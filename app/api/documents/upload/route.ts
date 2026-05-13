import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sha256, getClientIp } from '@/lib/utils';
import { audit } from '@/lib/utils/audit';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIMES = ['application/pdf'];

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Check subscription tier — Free tier: max 5 documents
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  if (profile?.subscription_tier === 'free') {
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count >= 5) {
      return NextResponse.json(
        { error: 'free_tier_limit_reached', message: 'Free-Tier ist auf 5 Dokumente begrenzt. Bitte upgrade auf Pro.' },
        { status: 402 }
      );
    }
  }

  // Verify required consents
  const { data: consents } = await supabase
    .from('consent_log')
    .select('purpose, granted')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false });

  const latestByPurpose: Record<string, boolean> = {};
  for (const c of consents ?? []) {
    if (!(c.purpose in latestByPurpose)) latestByPurpose[c.purpose] = c.granted;
  }
  if (!latestByPurpose.data_processing || !latestByPurpose.claude_api_processing) {
    return NextResponse.json(
      { error: 'consent_required', message: 'Erforderliche Einwilligungen fehlen.' },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
  }

  const files = formData.getAll('files') as File[];
  if (files.length === 0) {
    return NextResponse.json({ error: 'no_files' }, { status: 400 });
  }

  const results: Array<{
    fileName: string;
    documentId?: string;
    status: 'uploaded' | 'duplicate' | 'rejected';
    reason?: string;
  }> = [];

  const serviceClient = createServiceClient();

  for (const file of files) {
    // Validate
    if (!ALLOWED_MIMES.includes(file.type)) {
      results.push({ fileName: file.name, status: 'rejected', reason: 'invalid_mime_type' });
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      results.push({ fileName: file.name, status: 'rejected', reason: 'too_large' });
      continue;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = await sha256(buffer);

    // Dedup check
    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('user_id', user.id)
      .eq('file_hash', hash)
      .maybeSingle();

    if (existing) {
      results.push({ fileName: file.name, status: 'duplicate', documentId: existing.id });
      continue;
    }

    // Upload to storage (user-isolated folder)
    const storagePath = `${user.id}/${hash}.pdf`;
    const { error: uploadErr } = await serviceClient.storage
      .from('medical-documents')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadErr && !uploadErr.message.includes('already exists')) {
      results.push({ fileName: file.name, status: 'rejected', reason: `storage: ${uploadErr.message}` });
      continue;
    }

    // Insert document row
    const { data: doc, error: insertErr } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        file_hash: hash,
        mime_type: file.type,
        parsing_status: 'pending',
      })
      .select('id')
      .single();

    if (insertErr || !doc) {
      results.push({ fileName: file.name, status: 'rejected', reason: insertErr?.message });
      continue;
    }

    results.push({ fileName: file.name, status: 'uploaded', documentId: doc.id });

    await audit({
      userId: user.id,
      action: 'document.uploaded',
      resourceType: 'document',
      resourceId: doc.id,
      metadata: { file_name: file.name, file_size: file.size },
      ipAddress: getClientIp(req.headers),
      userAgent: req.headers.get('user-agent'),
    });

    // Trigger parsing async (fire-and-forget — actual implementation
    // should use a queue, but for MVP we kick off the parse endpoint)
    fetch(new URL(`/api/documents/parse`, req.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({ document_id: doc.id, user_id: user.id }),
    }).catch((err) => console.error('[upload] Failed to trigger parse:', err));
  }

  return NextResponse.json({ results }, { status: 200 });
}
