-- ============================================================================
-- Migration 003: Medical data tables (lab_results, medications, diagnoses)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- lab_results — separated for time-series queries
-- ----------------------------------------------------------------------------
create table lab_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references medical_events(id) on delete cascade,
  loinc_code text,
  parameter_name_de text not null,
  parameter_name_en text,
  value numeric,
  value_text text, -- für qualitative Werte ("negativ", "positiv", "Spuren")
  unit text,
  reference_low numeric,
  reference_high numeric,
  reference_text text, -- e.g. "<200" wenn Referenzbereich nicht numerisch ist
  flag lab_flag_enum,
  material text, -- "Serum", "Plasma", "Urin", "EDTA-Blut"
  measured_at timestamp not null,
  lab_name text,
  created_at timestamptz default now()
);

create index lab_results_user_loinc_idx on lab_results(user_id, loinc_code, measured_at desc);
create index lab_results_user_param_idx on lab_results(user_id, parameter_name_de, measured_at desc);
create index lab_results_user_flag_idx on lab_results(user_id, flag) where flag is not null and flag != 'normal';

-- ----------------------------------------------------------------------------
-- medications — with active window
-- ----------------------------------------------------------------------------
create table medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references medical_events(id) on delete cascade,
  substance_inn text not null,
  trade_name text,
  pzn text, -- Pharmazentralnummer
  atc_code text, -- WHO ATC classification
  dose text, -- "20 mg"
  form text, -- "Tablette", "Lösung", "Spray"
  frequency text, -- "1-0-0" (morning-noon-evening)
  route text, -- "p.o.", "i.v.", "s.c.", "topisch"
  start_date date,
  end_date date,
  is_active boolean generated always as (
    end_date is null or end_date >= current_date
  ) stored,
  prescribed_by uuid references practitioners(id) on delete set null,
  indication text,
  notes text,
  created_at timestamptz default now()
);

create index medications_user_active_idx on medications(user_id, is_active);
create index medications_user_substance_idx on medications(user_id, substance_inn);
create index medications_user_dates_idx on medications(user_id, start_date desc);

-- ----------------------------------------------------------------------------
-- diagnoses — chronic vs. acute, ICD-10
-- ----------------------------------------------------------------------------
create table diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references medical_events(id) on delete set null,
  icd10 text,
  text text not null,
  diagnosis_type diagnosis_type_enum,
  is_chronic boolean default false,
  side text check (side in ('links', 'rechts', 'beidseits')),
  first_documented date,
  last_documented date,
  resolved_date date,
  notes text,
  created_at timestamptz default now()
);

create index diagnoses_user_icd_idx on diagnoses(user_id, icd10) where icd10 is not null;
create index diagnoses_user_chronic_idx on diagnoses(user_id, is_chronic) where is_chronic = true;
create index diagnoses_user_active_idx on diagnoses(user_id) where resolved_date is null;

-- ----------------------------------------------------------------------------
-- vaccinations — separate table for Impfpass parsing
-- ----------------------------------------------------------------------------
create table vaccinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid references medical_events(id) on delete cascade,
  vaccine_name text not null,
  vaccine_code text, -- ATC or specific code
  manufacturer text,
  batch_number text,
  administered_at date not null,
  administered_by uuid references practitioners(id) on delete set null,
  dose_number integer,
  next_due date,
  notes text,
  created_at timestamptz default now()
);

create index vaccinations_user_date_idx on vaccinations(user_id, administered_at desc);

-- ----------------------------------------------------------------------------
-- chat_conversations — chatbot history
-- 90-day retention (auto-deleted via pg_cron)
-- ----------------------------------------------------------------------------
create table chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  tool_calls jsonb,
  tool_results jsonb,
  citations jsonb, -- { document_id, event_id, lab_result_id }
  created_at timestamptz default now()
);

create index chat_conversations_user_idx on chat_conversations(user_id, updated_at desc);
create index chat_messages_conversation_idx on chat_messages(conversation_id, created_at);
create index chat_messages_retention_idx on chat_messages(created_at);

-- ----------------------------------------------------------------------------
-- audit_log — for security and DSGVO accountability
-- ----------------------------------------------------------------------------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- 'document.uploaded', 'document.parsed', 'account.deletion_requested', etc.
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

create index audit_log_user_idx on audit_log(user_id, created_at desc);
create index audit_log_action_idx on audit_log(action, created_at desc);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function public.update_updated_at();

create trigger practitioners_updated_at before update on practitioners
  for each row execute function public.update_updated_at();

create trigger medical_events_updated_at before update on medical_events
  for each row execute function public.update_updated_at();

create trigger chat_conversations_updated_at before update on chat_conversations
  for each row execute function public.update_updated_at();
