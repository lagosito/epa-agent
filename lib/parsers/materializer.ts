/**
 * Event materializer: turn parsed JSON into medical_events + child rows.
 *
 * Per the design document section 2:
 *   Arztbrief → 1 consultation event + N diagnosis + N medication
 *   Laborwerte → 1 lab_result event + N lab_results rows
 *   Bildgebung → 1 imaging event
 *   Rezept → 1 prescription event + N medications
 *   Überweisung → 1 referral event
 *   Impfpass → N vaccination events
 */

import { createServiceClient } from '@/lib/supabase/server';
import type { ParseResult } from './parser';
import type {
  ArztbriefData,
  LaborwerteData,
  RezeptData,
  BefundBildgebungData,
  UeberweisungData,
  ImpfpassData,
} from './schemas/parsing-schemas';

interface MaterializeContext {
  userId: string;
  documentId: string;
  parseResult: ParseResult;
}

export async function materializeEvents(ctx: MaterializeContext): Promise<{
  eventIds: string[];
  practitionerIds: string[];
  warnings: string[];
}> {
  const { documentType, data } = ctx.parseResult;

  switch (documentType) {
    case 'arztbrief':
      return materializeArztbrief({ ...ctx, data: data as ArztbriefData });
    case 'laborwerte':
      return materializeLaborwerte({ ...ctx, data: data as LaborwerteData });
    case 'rezept':
      return materializeRezept({ ...ctx, data: data as RezeptData });
    case 'befund_bildgebung':
      return materializeBefundBildgebung({ ...ctx, data: data as BefundBildgebungData });
    case 'ueberweisung':
      return materializeUeberweisung({ ...ctx, data: data as UeberweisungData });
    case 'impfpass':
      return materializeImpfpass({ ...ctx, data: data as ImpfpassData });
    default:
      return { eventIds: [], practitionerIds: [], warnings: ['Unknown document type — no events created'] };
  }
}

// ============================================================================
// Practitioner upsert helper
// ============================================================================
async function upsertPractitioner(
  userId: string,
  data: {
    name: string | null;
    title?: string | null;
    specialty?: string | null;
    praxis?: string | null;
    lanr?: string | null;
    bsnr?: string | null;
    address?: string | null;
    phone?: string | null;
  }
): Promise<string | null> {
  if (!data.name) return null;

  const supabase = createServiceClient();

  // Try to find existing by LANR (preferred) or by name+specialty
  if (data.lanr) {
    const { data: existing } = await supabase
      .from('practitioners')
      .select('id')
      .eq('user_id', userId)
      .eq('lanr', data.lanr)
      .maybeSingle();
    if (existing) return existing.id;
  }

  // Fallback: name + specialty match
  if (!data.lanr) {
    const { data: existingByName } = await supabase
      .from('practitioners')
      .select('id')
      .eq('user_id', userId)
      .eq('name', data.name)
      .eq('specialty', data.specialty ?? '')
      .maybeSingle();
    if (existingByName) return existingByName.id;
  }

  // Create new
  const { data: created, error } = await supabase
    .from('practitioners')
    .insert({
      user_id: userId,
      name: data.name,
      title: data.title ?? null,
      specialty: data.specialty ?? null,
      praxis_name: data.praxis ?? null,
      lanr: data.lanr ?? null,
      bsnr: data.bsnr ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[materializer] Failed to upsert practitioner:', error);
    return null;
  }
  return created.id;
}

// ============================================================================
// Arztbrief
// ============================================================================
async function materializeArztbrief(ctx: MaterializeContext & { data: ArztbriefData }) {
  const { userId, documentId, data } = ctx;
  const supabase = createServiceClient();
  const eventIds: string[] = [];
  const practitionerIds: string[] = [];
  const warnings: string[] = [];

  // Upsert practitioner
  const practitionerId = await upsertPractitioner(userId, {
    name: data.metadata.sender.name,
    title: data.metadata.sender.title ?? null,
    specialty: data.metadata.sender.specialty ?? null,
    praxis: data.metadata.sender.praxis ?? null,
    lanr: data.metadata.sender.lanr ?? null,
    bsnr: data.metadata.sender.bsnr ?? null,
    address: data.metadata.sender.address ?? null,
    phone: data.metadata.sender.phone ?? null,
  });
  if (practitionerId) practitionerIds.push(practitionerId);

  // Main consultation event
  const icd10Codes = data.diagnoses
    .map((d) => d.icd10)
    .filter((c): c is string => Boolean(c));

  const consultationTitle = data.metadata.sender.specialty
    ? `${data.metadata.sender.specialty}-Sprechstunde – ${data.metadata.sender.name}`
    : `Konsultation – ${data.metadata.sender.name}`;

  const summary = [
    data.findings && `Befund: ${data.findings}`,
    data.assessment && `Beurteilung: ${data.assessment}`,
    data.procedure && `Prozedere: ${data.procedure}`,
  ].filter(Boolean).join('\n\n');

  const { data: consultEvent, error: consultErr } = await supabase
    .from('medical_events')
    .insert({
      user_id: userId,
      event_date: data.metadata.letter_date,
      event_type: 'consultation',
      title: consultationTitle,
      summary,
      source_document_id: documentId,
      practitioner_id: practitionerId,
      icd10_codes: icd10Codes.length > 0 ? icd10Codes : null,
      confidence: data.confidence,
    })
    .select('id')
    .single();

  if (consultErr || !consultEvent) {
    warnings.push(`Failed to create consultation event: ${consultErr?.message}`);
    return { eventIds, practitionerIds, warnings };
  }
  eventIds.push(consultEvent.id);

  // Diagnoses
  if (data.diagnoses.length > 0) {
    const diagnosisRows = data.diagnoses.map((d) => ({
      user_id: userId,
      event_id: consultEvent.id,
      icd10: d.icd10 ?? null,
      text: d.text,
      diagnosis_type: d.type ?? null,
      side: d.side ?? null,
      first_documented: data.metadata.letter_date,
      last_documented: data.metadata.letter_date,
    }));
    const { error: dxErr } = await supabase.from('diagnoses').insert(diagnosisRows);
    if (dxErr) warnings.push(`Failed to insert diagnoses: ${dxErr.message}`);
  }

  // Medications
  if (data.medications.length > 0) {
    const medRows = data.medications.map((m) => ({
      user_id: userId,
      event_id: consultEvent.id,
      substance_inn: m.substance_inn,
      trade_name: m.trade_name ?? null,
      atc_code: m.atc ?? null,
      dose: m.dose ?? null,
      form: m.form ?? null,
      frequency: m.frequency ?? null,
      start_date: data.metadata.letter_date,
      end_date: m.duration?.toLowerCase().includes('dauerhaft') ? null : null,
      prescribed_by: practitionerId,
      indication: m.indication ?? null,
    }));
    const { error: medErr } = await supabase.from('medications').insert(medRows);
    if (medErr) warnings.push(`Failed to insert medications: ${medErr.message}`);
  }

  return { eventIds, practitionerIds, warnings };
}

// ============================================================================
// Laborwerte
// ============================================================================
async function materializeLaborwerte(ctx: MaterializeContext & { data: LaborwerteData }) {
  const { userId, documentId, data } = ctx;
  const supabase = createServiceClient();
  const eventIds: string[] = [];
  const warnings: string[] = [];

  const measureDate = data.metadata.sample_date ?? data.metadata.report_date;
  if (!measureDate) {
    warnings.push('No sample_date or report_date in laborwerte');
    return { eventIds, practitionerIds: [], warnings };
  }

  const flaggedCount = data.results.filter(
    (r) => r.flag && r.flag !== 'normal'
  ).length;

  const { data: labEvent, error: labErr } = await supabase
    .from('medical_events')
    .insert({
      user_id: userId,
      event_date: measureDate,
      event_type: 'lab_result',
      title: `Laborbefund${data.metadata.lab ? ' — ' + data.metadata.lab : ''}`,
      summary: `${data.results.length} Werte gemessen${flaggedCount ? `, ${flaggedCount} außerhalb des Referenzbereichs` : ''}.`,
      source_document_id: documentId,
      confidence: data.confidence,
    })
    .select('id')
    .single();

  if (labErr || !labEvent) {
    warnings.push(`Failed to create lab event: ${labErr?.message}`);
    return { eventIds, practitionerIds: [], warnings };
  }
  eventIds.push(labEvent.id);

  // Insert lab results
  const labRows = data.results.map((r) => ({
    user_id: userId,
    event_id: labEvent.id,
    loinc_code: r.loinc ?? null,
    parameter_name_de: r.name_de,
    value: r.value ?? null,
    value_text: r.value_text ?? null,
    unit: r.unit ?? null,
    reference_low: r.ref_low ?? null,
    reference_high: r.ref_high ?? null,
    reference_text: r.ref_text ?? null,
    flag: r.flag ?? null,
    material: r.material ?? null,
    measured_at: measureDate,
    lab_name: data.metadata.lab ?? null,
  }));

  const { error: labRowErr } = await supabase.from('lab_results').insert(labRows);
  if (labRowErr) warnings.push(`Failed to insert lab results: ${labRowErr.message}`);

  return { eventIds, practitionerIds: [], warnings };
}

// ============================================================================
// Rezept
// ============================================================================
async function materializeRezept(ctx: MaterializeContext & { data: RezeptData }) {
  const { userId, documentId, data } = ctx;
  const supabase = createServiceClient();
  const eventIds: string[] = [];
  const practitionerIds: string[] = [];
  const warnings: string[] = [];

  const practitionerId = await upsertPractitioner(userId, {
    name: data.prescriber.name,
    lanr: data.prescriber.lanr ?? null,
    bsnr: data.prescriber.bsnr ?? null,
    praxis: data.prescriber.praxis ?? null,
  });
  if (practitionerId) practitionerIds.push(practitionerId);

  const itemSummary = data.items
    .map((i) => `${i.name}${i.dose_instruction ? ` (${i.dose_instruction})` : ''}`)
    .join(', ');

  const { data: rxEvent, error: rxErr } = await supabase
    .from('medical_events')
    .insert({
      user_id: userId,
      event_date: data.issued_at,
      event_type: 'prescription',
      title: data.items.length === 1
        ? `Verordnung: ${data.items[0].name}`
        : `Verordnung: ${data.items.length} Medikamente`,
      summary: itemSummary,
      source_document_id: documentId,
      practitioner_id: practitionerId,
      confidence: data.confidence,
    })
    .select('id')
    .single();

  if (rxErr || !rxEvent) {
    warnings.push(`Failed to create prescription event: ${rxErr?.message}`);
    return { eventIds, practitionerIds, warnings };
  }
  eventIds.push(rxEvent.id);

  // Insert medications
  const medRows = data.items.map((i) => ({
    user_id: userId,
    event_id: rxEvent.id,
    substance_inn: i.substance_inn ?? i.name,
    trade_name: i.name,
    pzn: i.pzn ?? null,
    dose: null,
    frequency: i.dose_instruction ?? null,
    start_date: data.issued_at,
    prescribed_by: practitionerId,
  }));

  const { error: medErr } = await supabase.from('medications').insert(medRows);
  if (medErr) warnings.push(`Failed to insert prescribed medications: ${medErr.message}`);

  return { eventIds, practitionerIds, warnings };
}

// ============================================================================
// Bildgebung
// ============================================================================
async function materializeBefundBildgebung(ctx: MaterializeContext & { data: BefundBildgebungData }) {
  const { userId, documentId, data } = ctx;
  const supabase = createServiceClient();
  const eventIds: string[] = [];
  const practitionerIds: string[] = [];
  const warnings: string[] = [];

  let practitionerId: string | null = null;
  if (data.metadata.radiologist?.name) {
    practitionerId = await upsertPractitioner(userId, {
      name: data.metadata.radiologist.name,
      specialty: 'Radiologie',
      praxis: data.metadata.radiologist.praxis ?? null,
    });
    if (practitionerId) practitionerIds.push(practitionerId);
  }

  const summary = [
    data.indication && `Indikation: ${data.indication}`,
    data.technique && `Technik: ${data.technique}`,
    data.findings && `Befund: ${data.findings}`,
    data.assessment && `Beurteilung: ${data.assessment}`,
  ].filter(Boolean).join('\n\n');

  const { data: imgEvent, error } = await supabase
    .from('medical_events')
    .insert({
      user_id: userId,
      event_date: data.metadata.report_date,
      event_type: 'imaging',
      title: `${data.metadata.modality}${data.metadata.body_region ? ` ${data.metadata.body_region}` : ''}`,
      summary,
      source_document_id: documentId,
      practitioner_id: practitionerId,
      confidence: data.confidence,
    })
    .select('id')
    .single();

  if (error || !imgEvent) {
    warnings.push(`Failed to create imaging event: ${error?.message}`);
    return { eventIds, practitionerIds, warnings };
  }
  eventIds.push(imgEvent.id);

  return { eventIds, practitionerIds, warnings };
}

// ============================================================================
// Überweisung
// ============================================================================
async function materializeUeberweisung(ctx: MaterializeContext & { data: UeberweisungData }) {
  const { userId, documentId, data } = ctx;
  const supabase = createServiceClient();
  const eventIds: string[] = [];
  const practitionerIds: string[] = [];
  const warnings: string[] = [];

  const practitionerId = await upsertPractitioner(userId, {
    name: data.from_practitioner.name,
    specialty: data.from_practitioner.specialty ?? null,
    lanr: data.from_practitioner.lanr ?? null,
  });
  if (practitionerId) practitionerIds.push(practitionerId);

  const { data: refEvent, error } = await supabase
    .from('medical_events')
    .insert({
      user_id: userId,
      event_date: data.issued_at,
      event_type: 'referral',
      title: `Überweisung an ${data.to_specialty}${data.to_practitioner_name ? ` (${data.to_practitioner_name})` : ''}`,
      summary: `Grund: ${data.reason}${data.diagnosis_text ? `\nDiagnose: ${data.diagnosis_text}` : ''}`,
      source_document_id: documentId,
      practitioner_id: practitionerId,
      icd10_codes: data.icd10 ? [data.icd10] : null,
      confidence: data.confidence,
    })
    .select('id')
    .single();

  if (error || !refEvent) {
    warnings.push(`Failed to create referral event: ${error?.message}`);
    return { eventIds, practitionerIds, warnings };
  }
  eventIds.push(refEvent.id);

  return { eventIds, practitionerIds, warnings };
}

// ============================================================================
// Impfpass
// ============================================================================
async function materializeImpfpass(ctx: MaterializeContext & { data: ImpfpassData }) {
  const { userId, documentId, data } = ctx;
  const supabase = createServiceClient();
  const eventIds: string[] = [];
  const warnings: string[] = [];

  for (const vax of data.vaccinations) {
    const { data: vaxEvent, error } = await supabase
      .from('medical_events')
      .insert({
        user_id: userId,
        event_date: vax.administered_at,
        event_type: 'vaccination',
        title: `Impfung: ${vax.vaccine_name}`,
        summary: `${vax.manufacturer ?? ''}${vax.dose_number ? ` · Dosis ${vax.dose_number}` : ''}`,
        source_document_id: documentId,
        confidence: data.confidence,
      })
      .select('id')
      .single();

    if (error || !vaxEvent) {
      warnings.push(`Failed to create vaccination event for ${vax.vaccine_name}: ${error?.message}`);
      continue;
    }
    eventIds.push(vaxEvent.id);

    await supabase.from('vaccinations').insert({
      user_id: userId,
      event_id: vaxEvent.id,
      vaccine_name: vax.vaccine_name,
      manufacturer: vax.manufacturer ?? null,
      batch_number: vax.batch_number ?? null,
      administered_at: vax.administered_at,
      dose_number: vax.dose_number ?? null,
    });
  }

  return { eventIds, practitionerIds: [], warnings };
}
