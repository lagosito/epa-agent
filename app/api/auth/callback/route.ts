import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { audit } from '@/lib/utils/audit';
import { getClientIp } from '@/lib/utils';

/**
 * GET /api/auth/callback
 * Handles the magic link redirect from Supabase Auth.
 * Exchanges the code for a session and creates the profile if needed.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirect') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`);
  }

  // Ensure profile exists
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email!,
        language: 'de',
      });
    }

    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);

    await audit({
      userId: user.id,
      action: 'auth.signed_in',
      ipAddress: getClientIp(req.headers),
      userAgent: req.headers.get('user-agent'),
    });
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
