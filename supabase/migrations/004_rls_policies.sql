-- ============================================================================
-- Migration 004: Row Level Security (RLS) — STRICT for health data
-- ============================================================================
-- Every health-data table MUST enforce user_id = auth.uid()
-- This is non-negotiable for DSGVO Art. 9 compliance.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;

create policy "users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- consent_log
-- ----------------------------------------------------------------------------
alter table consent_log enable row level security;

create policy "users can view own consent log"
  on consent_log for select
  using (auth.uid() = user_id);

create policy "users can insert own consent records"
  on consent_log for insert
  with check (auth.uid() = user_id);
-- NO UPDATE/DELETE: consent log is immutable for audit purposes

-- ----------------------------------------------------------------------------
-- documents
-- ----------------------------------------------------------------------------
alter table documents enable row level security;

create policy "users can view own documents"
  on documents for select
  using (auth.uid() = user_id);

create policy "users can insert own documents"
  on documents for insert
  with check (auth.uid() = user_id);

create policy "users can update own documents"
  on documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own documents"
  on documents for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- practitioners
-- ----------------------------------------------------------------------------
alter table practitioners enable row level security;

create policy "users own practitioners select"
  on practitioners for select using (auth.uid() = user_id);
create policy "users own practitioners insert"
  on practitioners for insert with check (auth.uid() = user_id);
create policy "users own practitioners update"
  on practitioners for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own practitioners delete"
  on practitioners for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- medical_events
-- ----------------------------------------------------------------------------
alter table medical_events enable row level security;

create policy "users own events select"
  on medical_events for select using (auth.uid() = user_id);
create policy "users own events insert"
  on medical_events for insert with check (auth.uid() = user_id);
create policy "users own events update"
  on medical_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own events delete"
  on medical_events for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- lab_results
-- ----------------------------------------------------------------------------
alter table lab_results enable row level security;

create policy "users own labs select"
  on lab_results for select using (auth.uid() = user_id);
create policy "users own labs insert"
  on lab_results for insert with check (auth.uid() = user_id);
create policy "users own labs update"
  on lab_results for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own labs delete"
  on lab_results for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- medications
-- ----------------------------------------------------------------------------
alter table medications enable row level security;

create policy "users own meds select"
  on medications for select using (auth.uid() = user_id);
create policy "users own meds insert"
  on medications for insert with check (auth.uid() = user_id);
create policy "users own meds update"
  on medications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own meds delete"
  on medications for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- diagnoses
-- ----------------------------------------------------------------------------
alter table diagnoses enable row level security;

create policy "users own dx select"
  on diagnoses for select using (auth.uid() = user_id);
create policy "users own dx insert"
  on diagnoses for insert with check (auth.uid() = user_id);
create policy "users own dx update"
  on diagnoses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own dx delete"
  on diagnoses for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- vaccinations
-- ----------------------------------------------------------------------------
alter table vaccinations enable row level security;

create policy "users own vax select"
  on vaccinations for select using (auth.uid() = user_id);
create policy "users own vax insert"
  on vaccinations for insert with check (auth.uid() = user_id);
create policy "users own vax update"
  on vaccinations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users own vax delete"
  on vaccinations for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- chat_conversations / chat_messages
-- ----------------------------------------------------------------------------
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;

create policy "users own chat conversations"
  on chat_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users own chat messages"
  on chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- audit_log — users can read their own, but cannot modify
-- ----------------------------------------------------------------------------
alter table audit_log enable row level security;

create policy "users can view own audit log"
  on audit_log for select
  using (auth.uid() = user_id);
-- Audit log is INSERT-only via service role; no user inserts/updates/deletes

-- ============================================================================
-- Storage bucket policies
-- ============================================================================
-- Run after creating bucket 'medical-documents' via Supabase dashboard or CLI

-- insert into storage.buckets (id, name, public) values ('medical-documents', 'medical-documents', false);

create policy "users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can read own files"
  on storage.objects for select
  using (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
