import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { audit } from '@/lib/utils/audit';
import { getClientIp } from '@/lib/utils';

/**
 * POST /api/account/cancel-deletion
 * Cancel a pending account deletion during the 14-day grace period.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('deletion_status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deletion_status !== 'requested') {
    return NextResponse.json(
      { error: 'no_pending_deletion', message: 'Keine Löschung geplant.' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      deletion_status: 'cancelled',
      deletion_requested_at: null,
      deletion_scheduled_at: null,
    })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit({
    userId: user.id,
    action: 'account.deletion_cancelled',
    ipAddress: getClientIp(req.headers),
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json({ ok: true, message: 'Löschung abgebrochen.' });
}
