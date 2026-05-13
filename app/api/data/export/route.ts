import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { audit } from '@/lib/utils/audit';
import { getClientIp } from '@/lib/utils';

/**
 * GET /api/data/export
 * DSGVO Art. 20 — Right to data portability.
 * Returns a complete JSON dump of all user data.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Fetch all user data in parallel
  const [
    profile,
    consentLog,
    documents,
    practitioners,
    events,
    labResults,
    medications,
    diagnoses,
    vaccinations,
    chatConversations,
    chatMessages,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('consent_log').select('*').eq('user_id', user.id),
    supabase.from('documents').select('*').eq('user_id', user.id),
    supabase.from('practitioners').select('*').eq('user_id', user.id),
    supabase.from('medical_events').select('*').eq('user_id', user.id),
    supabase.from('lab_results').select('*').eq('user_id', user.id),
    supabase.from('medications').select('*').eq('user_id', user.id),
    supabase.from('diagnoses').select('*').eq('user_id', user.id),
    supabase.from('vaccinations').select('*').eq('user_id', user.id),
    supabase.from('chat_conversations').select('*').eq('user_id', user.id),
    supabase.from('chat_messages').select('*').eq('user_id', user.id),
  ]);

  const exportData = {
    export_metadata: {
      generated_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      format_version: '1.0',
      legal_basis: 'DSGVO Art. 20 — Recht auf Datenübertragbarkeit',
    },
    profile: profile.data,
    consent_log: consentLog.data,
    documents: documents.data,
    practitioners: practitioners.data,
    medical_events: events.data,
    lab_results: labResults.data,
    medications: medications.data,
    diagnoses: diagnoses.data,
    vaccinations: vaccinations.data,
    chat_conversations: chatConversations.data,
    chat_messages: chatMessages.data,
  };

  await audit({
    userId: user.id,
    action: 'data.exported',
    metadata: {
      documents_count: documents.data?.length ?? 0,
      events_count: events.data?.length ?? 0,
    },
    ipAddress: getClientIp(req.headers),
    userAgent: req.headers.get('user-agent'),
  });

  const filename = `epa-agent-export-${new Date().toISOString().split('T')[0]}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
