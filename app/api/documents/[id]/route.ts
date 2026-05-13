import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { audit } from '@/lib/utils/audit';
import { getClientIp } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Generate short-lived signed URL (TTL 5 minutes per design doc)
  const { data: signed } = await supabase.storage
    .from('medical-documents')
    .createSignedUrl(data.storage_path, 300);

  return NextResponse.json({ ...data, signed_url: signed?.signedUrl });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Get storage path before delete
  const { data: doc } = await supabase
    .from('documents')
    .select('storage_path, file_name')
    .eq('id', params.id)
    .single();

  if (!doc) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Delete storage file (service role for guaranteed cleanup)
  const serviceClient = createServiceClient();
  await serviceClient.storage.from('medical-documents').remove([doc.storage_path]);

  // Delete row (cascades to events, lab_results, medications, diagnoses)
  const { error: deleteErr } = await supabase
    .from('documents')
    .delete()
    .eq('id', params.id);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  await audit({
    userId: user.id,
    action: 'document.deleted',
    resourceType: 'document',
    resourceId: params.id,
    metadata: { file_name: doc.file_name },
    ipAddress: getClientIp(req.headers),
    userAgent: req.headers.get('user-agent'),
  });

  return NextResponse.json({ ok: true });
}
