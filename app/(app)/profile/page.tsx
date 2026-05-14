import { createClient } from '@/lib/supabase/server';
import { ProfileClient } from './client';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, consents] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase
      .from('consent_log')
      .select('purpose, granted, granted_at')
      .eq('user_id', user!.id)
      .order('granted_at', { ascending: false }),
  ]);

  // Compute current consent state per purpose
  const currentConsents: Record<string, boolean> = {};
  for (const c of consents.data ?? []) {
    if (!(c.purpose in currentConsents)) currentConsents[c.purpose] = c.granted;
  }

  return (
    <ProfileClient
      profile={profile.data}
      email={user!.email ?? ''}
      currentConsents={currentConsents}
    />
  );
}
