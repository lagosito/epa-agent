-- ============================================================================
-- Migration 006: Helper functions for chatbot tool calls
-- These are SECURITY INVOKER (default) so RLS still applies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: maintain diagnoses.first_documented / last_documented
-- ----------------------------------------------------------------------------
create or replace function public.upsert_diagnosis_dates()
returns trigger as $$
begin
  if new.first_documented is null then
    new.first_documented := (
      select min(event_date)
      from medical_events
      where id = new.event_id
    );
  end if;
  new.last_documented := coalesce(new.last_documented, new.first_documented);
  return new;
end;
$$ language plpgsql;

create trigger diagnoses_dates_trigger
  before insert on diagnoses
  for each row execute function public.upsert_diagnosis_dates();

-- ----------------------------------------------------------------------------
-- View: active medications with practitioner info (denormalized for UI)
-- ----------------------------------------------------------------------------
create or replace view active_medications as
select
  m.id,
  m.user_id,
  m.substance_inn,
  m.trade_name,
  m.dose,
  m.form,
  m.frequency,
  m.start_date,
  m.end_date,
  m.indication,
  p.name as prescribed_by_name,
  p.specialty as prescribed_by_specialty,
  m.event_id
from medications m
left join practitioners p on m.prescribed_by = p.id
where m.is_active = true;

-- ----------------------------------------------------------------------------
-- View: lab results with document reference (denormalized for chatbot)
-- ----------------------------------------------------------------------------
create or replace view lab_results_with_source as
select
  lr.*,
  d.id as document_id,
  d.file_name as document_file_name,
  pr.name as ordered_by_name
from lab_results lr
left join medical_events me on lr.event_id = me.id
left join documents d on me.source_document_id = d.id
left join practitioners pr on me.practitioner_id = pr.id;

-- Grant select on views (RLS on underlying tables still applies)
grant select on active_medications to authenticated;
grant select on lab_results_with_source to authenticated;

-- ----------------------------------------------------------------------------
-- Function: get latest lab value by LOINC code (chatbot tool)
-- ----------------------------------------------------------------------------
create or replace function public.get_latest_lab_value(
  p_loinc_codes text[],
  p_limit integer default 1
)
returns table (
  value numeric,
  unit text,
  parameter_name_de text,
  measured_at timestamp,
  flag lab_flag_enum,
  reference_low numeric,
  reference_high numeric,
  document_id uuid,
  document_file_name text,
  ordered_by_name text
)
language sql
security invoker
stable
as $$
  select
    lr.value, lr.unit, lr.parameter_name_de, lr.measured_at,
    lr.flag, lr.reference_low, lr.reference_high,
    d.id as document_id, d.file_name as document_file_name,
    pr.name as ordered_by_name
  from lab_results lr
  left join medical_events me on lr.event_id = me.id
  left join documents d on me.source_document_id = d.id
  left join practitioners pr on me.practitioner_id = pr.id
  where lr.user_id = auth.uid()
    and lr.loinc_code = any(p_loinc_codes)
  order by lr.measured_at desc
  limit p_limit;
$$;

-- ----------------------------------------------------------------------------
-- Function: get lab value history (for trend charts)
-- ----------------------------------------------------------------------------
create or replace function public.get_lab_history(
  p_loinc_codes text[],
  p_from_date date default null,
  p_to_date date default null
)
returns table (
  value numeric,
  unit text,
  parameter_name_de text,
  measured_at timestamp,
  flag lab_flag_enum,
  reference_low numeric,
  reference_high numeric,
  loinc_code text
)
language sql
security invoker
stable
as $$
  select
    value, unit, parameter_name_de, measured_at,
    flag, reference_low, reference_high, loinc_code
  from lab_results
  where user_id = auth.uid()
    and loinc_code = any(p_loinc_codes)
    and (p_from_date is null or measured_at >= p_from_date)
    and (p_to_date is null or measured_at <= p_to_date)
  order by measured_at asc;
$$;

grant execute on function public.get_latest_lab_value to authenticated;
grant execute on function public.get_lab_history to authenticated;
