import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/cron/auto-delete
 * Backstop for pg_cron in case the DB-level job is unavailable.
 * Authenticated by CRON_SECRET. Schedule daily via Vercel Cron.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.rpc('process_scheduled_deletions');
  if (error) {
    console.error('[cron auto-delete] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ran_at: new Date().toISOString() });
}
