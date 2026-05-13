-- ============================================================================
-- Migration 005: pg_cron jobs for DSGVO retention compliance
-- ============================================================================
-- Schedules:
--   - Chat messages: 90 days
--   - Audit log: 1 year
--   - Account deletion: 14-day grace period
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: delete chat messages older than 90 days
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_old_chat_messages()
returns void
language plpgsql
security definer
as $$
begin
  delete from chat_messages
  where created_at < now() - interval '90 days';

  -- Clean up empty conversations
  delete from chat_conversations
  where id not in (select distinct conversation_id from chat_messages)
    and updated_at < now() - interval '90 days';
end;
$$;

-- ----------------------------------------------------------------------------
-- Function: delete audit log older than 1 year
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_old_audit_log()
returns void
language plpgsql
security definer
as $$
begin
  delete from audit_log
  where created_at < now() - interval '1 year';
end;
$$;

-- ----------------------------------------------------------------------------
-- Function: process scheduled account deletions (Art. 17 DSGVO)
-- After 14-day grace period: hard delete cascades all user data
-- Anonymize billing records (legal retention 10 years)
-- ----------------------------------------------------------------------------
create or replace function public.process_scheduled_deletions()
returns void
language plpgsql
security definer
as $$
declare
  v_user record;
begin
  for v_user in
    select id, email, stripe_customer_id
    from profiles
    where deletion_status = 'requested'
      and deletion_scheduled_at <= now()
  loop
    -- Mark in progress
    update profiles
    set deletion_status = 'in_progress'
    where id = v_user.id;

    -- Audit the deletion (this record stays — the act of deletion is logged)
    insert into audit_log (user_id, action, metadata)
    values (
      v_user.id,
      'account.deletion_executed',
      jsonb_build_object(
        'email_hash', encode(digest(v_user.email, 'sha256'), 'hex'),
        'executed_at', now()
      )
    );

    -- Cascade delete: documents, events, labs, meds, diagnoses, vaccinations,
    -- chat, practitioners — all FK cascade from auth.users
    -- Storage cleanup must be triggered separately by an Edge Function
    delete from auth.users where id = v_user.id;

    -- Note: profile row is deleted via cascade; the audit_log row remains
    -- with user_id = null due to ON DELETE SET NULL on audit_log.user_id
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Schedule jobs (UTC times)
-- ----------------------------------------------------------------------------

-- Daily 03:00 UTC: chat retention
select cron.schedule(
  'cleanup-chat-messages',
  '0 3 * * *',
  $$select public.cleanup_old_chat_messages();$$
);

-- Weekly Sunday 04:00 UTC: audit log
select cron.schedule(
  'cleanup-audit-log',
  '0 4 * * 0',
  $$select public.cleanup_old_audit_log();$$
);

-- Daily 05:00 UTC: process scheduled deletions
select cron.schedule(
  'process-account-deletions',
  '0 5 * * *',
  $$select public.process_scheduled_deletions();$$
);
