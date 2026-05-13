import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/cron/parse-queue
 * Picks up documents stuck in 'pending' (e.g. fire-and-forget invocation
 * died) and re-triggers parsing. Schedule every 5 minutes.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find documents pending for >2 minutes
  const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: stuck } = await supabase
    .from('documents')
    .select('id, user_id')
    .eq('parsing_status', 'pending')
    .lt('uploaded_at', cutoff)
    .limit(10);

  const triggered: string[] = [];

  for (const doc of stuck ?? []) {
    const url = new URL('/api/documents/parse', req.url);
    fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({ document_id: doc.id, user_id: doc.user_id }),
    }).catch((err) => console.error('[cron parse-queue] trigger failed:', err));
    triggered.push(doc.id);
  }

  return NextResponse.json({ ok: true, triggered_count: triggered.length, triggered });
}
