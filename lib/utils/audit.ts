import { createServiceClient } from '@/lib/supabase/server';

interface AuditEntry {
  userId: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Insert an audit log entry. Best-effort — failures are logged but don't throw.
 * Uses service role to bypass RLS (audit_log is INSERT-only for service role).
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from('audit_log').insert({
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType ?? null,
      resource_id: entry.resourceId ?? null,
      metadata: entry.metadata ?? null,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    });
  } catch (err) {
    console.error('[audit] Failed to record audit entry:', err);
  }
}
