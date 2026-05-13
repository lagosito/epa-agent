-- ============================================================================
-- ePA Agent — Database schema
-- Migration 001: Extensions and base types
-- ============================================================================

-- Required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";
create extension if not exists "vector"; -- pgvector for embeddings (future)
create extension if not exists "pgsodium"; -- column-level encryption

-- ============================================================================
-- Enums and types
-- ============================================================================

create type document_type_enum as enum (
  'arztbrief',
  'laborwerte',
  'rezept',
  'ueberweisung',
  'befund_bildgebung',
  'impfpass',
  'unknown'
);

create type parsing_status_enum as enum (
  'pending',
  'processing',
  'completed',
  'failed',
  'requires_review'
);

create type event_type_enum as enum (
  'consultation',
  'diagnosis',
  'medication',
  'lab_result',
  'imaging',
  'vaccination',
  'prescription',
  'referral',
  'hospitalization'
);

create type lab_flag_enum as enum (
  'normal',
  'low',
  'high',
  'critical_low',
  'critical_high'
);

create type diagnosis_type_enum as enum (
  'haupt',
  'neben',
  'verdacht',
  'anamnese'
);

create type subscription_tier_enum as enum (
  'free',
  'pro_monthly',
  'pro_yearly'
);

create type consent_purpose_enum as enum (
  'data_processing',           -- Art. 9 (2) (a) — base
  'claude_api_processing',     -- USA transfer
  'product_improvement',       -- analytics
  'marketing_emails'
);

create type deletion_status_enum as enum (
  'none',
  'requested',     -- in 14-day grace period
  'cancelled',
  'in_progress',
  'completed'
);
