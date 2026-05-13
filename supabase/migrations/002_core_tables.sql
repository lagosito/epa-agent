-- ============================================================================
-- Migration 002: Core tables (users, profiles, consent, documents, events)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles — extended user data (auth.users handles authentication)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  date_of_birth date,
  language text default 'de' check (language in ('de', 'en')),
  subscription_tier subscription_tier_enum default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_current_period_end timestamptz,
  -- Deletion workflow (Art. 17 DSGVO)
  deletion_status deletion_status_enum default 'none',
  deletion_requested_at timestamptz,
  deletion_scheduled_at timestamptz, -- = requested + 14 days
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_active_at timestamptz default now()
);

create index profiles_subscription_idx on profiles(subscription_tier);
create index profiles_deletion_idx on profiles(deletion_status, deletion_scheduled_at)
  where deletion_status = 'requested';

-- ----------------------------------------------------------------------------
-- consent_log — DSGVO Art. 9 (2) (a) explicit consent tracking
-- Granular, revocable, timestamped. Required for audit.
-- ----------------------------------------------------------------------------
create table consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose consent_purpose_enum not null,
  granted boolean not null,
  policy_version text not null,         -- e.g. "2026-05-01"
  ip_address inet,
  user_agent text,
  granted_at timestamptz default now(),
  revoked_at timestamptz
);

create index consent_log_user_idx on consent_log(user_id, purpose, granted_at desc);

-- ----------------------------------------------------------------------------
-- documents — original uploaded PDFs
-- ----------------------------------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size_bytes bigint not null,
  file_hash text not null, -- SHA-256 für Deduplikation
  mime_type text not null,
  document_type document_type_enum default 'unknown',
  uploaded_at timestamptz default now(),
  parsed_at timestamptz,
  parsing_status parsing_status_enum default 'pending',
  parsing_error text,
  raw_extracted_json jsonb,
  parser_tier integer, -- 1 = Claude direct, 2 = Azure DI + Claude, 3 = Tesseract
  parser_model text,
  confidence numeric(3,2),
  page_count integer,
  unique(user_id, file_hash)
);

create index documents_user_status_idx on documents(user_id, parsing_status, uploaded_at desc);
create index documents_user_type_idx on documents(user_id, document_type);

-- ----------------------------------------------------------------------------
-- practitioners — normalized doctors/specialists
-- Deduplicated by LANR (national doctor number) when available
-- ----------------------------------------------------------------------------
create table practitioners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  title text,                 -- "Dr. med.", "Prof. Dr.", etc.
  specialty text,             -- "Kardiologie", "Hausarzt", etc.
  praxis_name text,
  lanr text,                  -- Lebenslange Arztnummer (9 digits)
  bsnr text,                  -- Betriebsstättennummer (9 digits)
  address text,
  phone text,
  email text,
  fax text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Deduplikation: ein Arzt pro Nutzer (per LANR)
  unique(user_id, lanr)
);

create index practitioners_user_idx on practitioners(user_id);
create index practitioners_user_name_idx on practitioners(user_id, name);

-- ----------------------------------------------------------------------------
-- medical_events — central timeline table
-- ----------------------------------------------------------------------------
create table medical_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_date date not null,
  event_time time,
  event_type event_type_enum not null,
  title text not null,
  summary text,
  source_document_id uuid references documents(id) on delete set null,
  practitioner_id uuid references practitioners(id) on delete set null,
  icd10_codes text[],
  confidence numeric(3,2),
  is_user_verified boolean default false,
  user_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index medical_events_user_date_idx on medical_events(user_id, event_date desc);
create index medical_events_user_type_idx on medical_events(user_id, event_type, event_date desc);
create index medical_events_user_practitioner_idx on medical_events(user_id, practitioner_id, event_date desc);
create index medical_events_icd10_idx on medical_events using gin(icd10_codes);

-- Full-text search on summary (German)
create index medical_events_summary_fts_idx on medical_events
  using gin(to_tsvector('german', coalesce(title, '') || ' ' || coalesce(summary, '')));
