import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { audit } from '@/lib/utils/audit';
import { getClientIp } from '@/lib/utils';

const POLICY_VERSION = '2026-05-01';

const VALID_PURPOSES = [
  'data_processing',
  'claude_api_processing',
  'product_improvement',
  'marketing_emails',
] as const;

type Purpose = typeof VALID_PURPOSES[number];

interface ConsentRequest {
  purpose: Purpose;
  granted: boolean;
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const consents: ConsentRequest[] = Array.isArray(body) ? body : [body];

  for (const c of consents) {
    if (!VALID_PURPOSES.includes(c.purpose)) {
      return NextResponse.json({ error: `invalid_purpose: ${c.purpose}` }, { status: 400 });
    }
  }

  const ip = getClientIp(req.headers);
  const userAgent = req.headers.get('user-agent');

  const rows = consents.map((c) => ({
    user_id: user.id,
    purpose: c.purpose,
    granted: c.granted,
    policy_version: POLICY_VERSION,
    ip_address: ip,
    user_agent: userAgent,
  }));

  const { error } = await supabase.from('consent_log').insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const c of consents) {
    await audit({
      userId: user.id,
      action: c.granted ? 'consent.granted' : 'consent.revoked',
      metadata: { purpose: c.purpose, policy_version: POLICY_VERSION },
      ipAddress: ip,
      userAgent,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('consent_log')
    .select('purpose, granted, granted_at, policy_version')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compute latest state per purpose
  const latest: Record<string, any> = {};
  for (const row of data ?? []) {
    if (!(row.purpose in latest)) latest[row.purpose] = row;
  }

  return NextResponse.json({ history: data, current: latest });
}
