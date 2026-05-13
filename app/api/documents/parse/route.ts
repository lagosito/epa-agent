import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { parseDocument } from '@/lib/parsers/parser';
import { materializeEvents } from '@/lib/parsers/materializer';
import { audit } from '@/lib/utils/audit';

/**
 * POST /api/documents/parse
 * Trusted endpoint — invoked internally after upload or via cron.
 * Authenticated by CRON_SECRET header.
 */
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { document_id, user_id } = body;

  if (!document_id || !user_id) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Mark as processing
  await supabase
    .from('documents')
    .update({ parsing_status: 'processing' })
    .eq('id', document_id)
    .eq('user_id', user_id);

  try {
    // Download the PDF from storage
    const { data: docMeta } = await supabase
      .from('documents')
      .select('storage_path, file_name')
      .eq('id', document_id)
      .single();

    if (!docMeta) {
      return NextResponse.json({ error: 'document_not_found' }, { status: 404 });
    }

    const { data: blob, error: downloadErr } = await supabase.storage
      .from('medical-documents')
      .download(docMeta.storage_path);

    if (downloadErr || !blob) {
      throw new Error(`Failed to download: ${downloadErr?.message}`);
    }

    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Parse with appropriate tier
    const parseResult = await parseDocument(base64);

    // Materialize events into DB
    const materialized = await materializeEvents({
      userId: user_id,
      documentId: document_id,
      parseResult,
    });

    // Update document row with results
    await supabase
      .from('documents')
      .update({
        document_type: parseResult.documentType,
        parsing_status: parseResult.error ? 'requires_review' : 'completed',
        parsing_error: parseResult.error ?? null,
        parsed_at: new Date().toISOString(),
        raw_extracted_json: parseResult.data,
        parser_tier: parseResult.parserTier,
        parser_model: parseResult.parserModel,
        confidence: parseResult.confidence,
      })
      .eq('id', document_id);

    await audit({
      userId: user_id,
      action: 'document.parsed',
      resourceType: 'document',
      resourceId: document_id,
      metadata: {
        document_type: parseResult.documentType,
        confidence: parseResult.confidence,
        events_created: materialized.eventIds.length,
        warnings: materialized.warnings,
      },
    });

    return NextResponse.json({
      ok: true,
      document_type: parseResult.documentType,
      confidence: parseResult.confidence,
      events_created: materialized.eventIds.length,
      warnings: materialized.warnings,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[parse] Error:', err);

    await supabase
      .from('documents')
      .update({
        parsing_status: 'failed',
        parsing_error: errorMessage,
      })
      .eq('id', document_id);

    await audit({
      userId: user_id,
      action: 'document.parse_failed',
      resourceType: 'document',
      resourceId: document_id,
      metadata: { error: errorMessage },
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
