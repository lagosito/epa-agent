import { createClient } from '@/lib/supabase/server';
import { DocumentsClient } from './client';

export default async function DocumentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user!.id)
    .order('uploaded_at', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user!.id)
    .single();

  return (
    <DocumentsClient
      initialDocuments={documents ?? []}
      tier={profile?.subscription_tier ?? 'free'}
    />
  );
}
