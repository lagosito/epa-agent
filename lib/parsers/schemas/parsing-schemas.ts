import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateNullable = isoDate.nullable();
const confidence = z.number().min(0).max(1);

// ============================================================================
// Arztbrief schema
// ============================================================================
export const ArztbriefSchema = z.object({
  document_type: z.literal('arztbrief'),
  metadata: z.object({
    letter_date: isoDate,
    sender: z.object({
      name: z.string(),
      title: z.string().nullable().optional(),
      specialty: z.string().nullable().optional(),
      praxis: z.string().nullable().optional(),
      bsnr: z.string().nullable().optional(),
      lanr: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
    }),
    recipient: z.object({
      name: z.string().nullable(),
      specialty: z.string().nullable().optional(),
    }).nullable().optional(),
  }),
  patient: z.object({
    name: z.string().nullable(),
    dob: isoDateNullable.optional(),
    insurance: z.string().nullable().optional(),
    insurance_number: z.string().nullable().optional(),
  }).nullable().optional(),
  diagnoses: z.array(z.object({
    icd10: z.string().nullable(),
    text: z.string(),
    type: z.enum(['haupt', 'neben', 'verdacht', 'anamnese']).nullable().optional(),
    side: z.enum(['links', 'rechts', 'beidseits']).nullable().optional(),
  })).default([]),
  anamnesis: z.string().nullable().optional(),
  findings: z.string().nullable().optional(),
  assessment: z.string().nullable().optional(),
  procedure: z.string().nullable().optional(),
  medications: z.array(z.object({
    substance_inn: z.string(),
    trade_name: z.string().nullable().optional(),
    dose: z.string().nullable().optional(),
    form: z.string().nullable().optional(),
    frequency: z.string().nullable().optional(),
    duration: z.string().nullable().optional(),
    indication: z.string().nullable().optional(),
    atc: z.string().nullable().optional(),
  })).default([]),
  follow_up: isoDateNullable.optional(),
  confidence,
  raw_text: z.string().optional(),
});

export type ArztbriefData = z.infer<typeof ArztbriefSchema>;

// ============================================================================
// Laborwerte schema
// ============================================================================
export const LaborwerteSchema = z.object({
  document_type: z.literal('labor'),
  metadata: z.object({
    lab: z.string().nullable(),
    ordered_by: z.string().nullable().optional(),
    sample_date: isoDateNullable,
    report_date: isoDateNullable.optional(),
    patient_name: z.string().nullable().optional(),
  }),
  results: z.array(z.object({
    loinc: z.string().nullable(),
    name_de: z.string(),
    value: z.number().nullable().optional(),
    value_text: z.string().nullable().optional(),
    unit: z.string().nullable().optional(),
    ref_low: z.number().nullable().optional(),
    ref_high: z.number().nullable().optional(),
    ref_text: z.string().nullable().optional(),
    flag: z.enum(['normal', 'low', 'high', 'critical_low', 'critical_high']).nullable().optional(),
    material: z.string().nullable().optional(),
  })),
  confidence,
});

export type LaborwerteData = z.infer<typeof LaborwerteSchema>;

// ============================================================================
// Rezept schema
// ============================================================================
export const RezeptSchema = z.object({
  document_type: z.literal('rezept'),
  issued_at: isoDate,
  type: z.enum(['rosa', 'blau', 'gruen', 'gelb', 'eRezept']),
  prescriber: z.object({
    name: z.string().nullable(),
    lanr: z.string().nullable().optional(),
    bsnr: z.string().nullable().optional(),
    praxis: z.string().nullable().optional(),
  }),
  patient: z.object({
    name: z.string().nullable().optional(),
    dob: isoDateNullable.optional(),
    insurance_number: z.string().nullable().optional(),
  }).nullable().optional(),
  items: z.array(z.object({
    pzn: z.string().nullable().optional(),
    name: z.string(),
    substance_inn: z.string().nullable().optional(),
    amount: z.string().nullable().optional(),
    package_size: z.enum(['N1', 'N2', 'N3']).nullable().optional(),
    dose_instruction: z.string().nullable().optional(),
  })),
  confidence,
});

export type RezeptData = z.infer<typeof RezeptSchema>;

// ============================================================================
// Befund Bildgebung schema
// ============================================================================
export const BefundBildgebungSchema = z.object({
  document_type: z.literal('befund_bildgebung'),
  metadata: z.object({
    report_date: isoDate,
    modality: z.string(),
    body_region: z.string().nullable().optional(),
    radiologist: z.object({
      name: z.string().nullable(),
      praxis: z.string().nullable().optional(),
    }).nullable().optional(),
    ordering_physician: z.string().nullable().optional(),
  }),
  indication: z.string().nullable().optional(),
  technique: z.string().nullable().optional(),
  contrast_agent: z.string().nullable().optional(),
  findings: z.string().nullable().optional(),
  assessment: z.string().nullable().optional(),
  comparison_to_prior: z.string().nullable().optional(),
  recommendations: z.string().nullable().optional(),
  confidence,
});

export type BefundBildgebungData = z.infer<typeof BefundBildgebungSchema>;

// ============================================================================
// Überweisung
// ============================================================================
export const UeberweisungSchema = z.object({
  document_type: z.literal('ueberweisung'),
  issued_at: isoDate,
  from_practitioner: z.object({
    name: z.string().nullable(),
    specialty: z.string().nullable().optional(),
    lanr: z.string().nullable().optional(),
  }),
  to_specialty: z.string(),
  to_practitioner_name: z.string().nullable().optional(),
  reason: z.string(),
  diagnosis_text: z.string().nullable().optional(),
  icd10: z.string().nullable().optional(),
  confidence,
});

export type UeberweisungData = z.infer<typeof UeberweisungSchema>;

// ============================================================================
// Impfpass
// ============================================================================
export const ImpfpassSchema = z.object({
  document_type: z.literal('impfpass'),
  patient_name: z.string().nullable().optional(),
  patient_dob: isoDateNullable.optional(),
  vaccinations: z.array(z.object({
    vaccine_name: z.string(),
    manufacturer: z.string().nullable().optional(),
    batch_number: z.string().nullable().optional(),
    administered_at: isoDate,
    administered_by: z.string().nullable().optional(),
    dose_number: z.number().nullable().optional(),
  })),
  confidence,
});

export type ImpfpassData = z.infer<typeof ImpfpassSchema>;
