import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';
import { ConsentBanner } from '@/components/layout/consent-banner';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // Check consent state
  const { data: consents } = await supabase
    .from('consent_log')
    .select('purpose, granted')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false });

  const latest: Record<string, boolean> = {};
  for (const c of consents ?? []) {
    if (!(c.purpose in latest)) latest[c.purpose] = c.granted;
  }
  const consentNeeded = !latest.data_processing || !latest.claude_api_processing;

  return (
    <AppShell>
      {consentNeeded && <ConsentBanner />}
      {children}
    </AppShell>
  );
}
