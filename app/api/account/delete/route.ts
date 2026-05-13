import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { audit } from '@/lib/utils/audit';
import { getClientIp } from '@/lib/utils';

/**
 * POST /api/account/delete
 * DSGVO Art. 17 — Right to erasure.
 *
 * Two-step flow:
 *   1. User requests deletion → status 'requested', scheduled_at = now + 14 days
 *   2. After grace period: pg_cron job 'process-account-deletions' runs
 *      and hard-deletes all user data via cascade.
 *
 * User can cancel during the 14-day window via /api/account/cancel-deletion.
 *
 * Body: { confirmation: "LÖSCHEN" } — must be exactly this string
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body?.confirmation !== 'LÖSCHEN') {
    return NextResponse.json(
      {
        error: 'confirmation_required',
        message: 'Bitte bestätige durch Eingabe von "LÖSCHEN".',
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from('profiles')
    .update({
      deletion_status: 'requested',
      deletion_requested_at: now.toISOString(),
      deletion_scheduled_at: scheduledAt.toISOString(),
    })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit({
    userId: user.id,
    action: 'account.deletion_requested',
    metadata: {
      scheduled_for: scheduledAt.toISOString(),
      grace_period_days: 14,
    },
    ipAddress: getClientIp(req.headers),
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json({
    ok: true,
    message: 'Löschung wurde geplant.',
    scheduled_at: scheduledAt.toISOString(),
    grace_period_days: 14,
    cancel_until: scheduledAt.toISOString(),
  });
}
