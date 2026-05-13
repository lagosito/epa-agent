/**
 * Chatbot tool definitions and execution.
 * Tools query the user's own data via Supabase with RLS enforced
 * (uses the user's session, NOT service role).
 */

import type Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Common LOINC mappings used to expand parameter names → codes
// ============================================================================
const LOINC_BY_NAME: Record<string, string[]> = {
  'cholesterin': ['2093-3'],
  'gesamtcholesterin': ['2093-3'],
  'cholesterol': ['2093-3'],
  'ldl': ['2089-1'],
  'ldl-cholesterin': ['2089-1'],
  'hdl': ['2085-9'],
  'hdl-cholesterin': ['2085-9'],
  'triglyceride': ['2571-8'],
  'triglyzeride': ['2571-8'],
  'tsh': ['3016-3'],
  'hba1c': ['4548-4'],
  'kreatinin': ['2160-0'],
  'gfr': ['62238-1'],
  'glucose': ['2345-7'],
  'blutzucker': ['2345-7'],
  'harnstoff': ['3094-0'],
  'natrium': ['2951-2'],
  'kalium': ['2823-3'],
  'haemoglobin': ['718-7'],
  'hb': ['718-7'],
  'leukozyten': ['6690-2'],
  'erythrozyten': ['789-8'],
  'thrombozyten': ['777-3'],
  'crp': ['1988-5'],
  'ast': ['1920-8'],
  'got': ['1920-8'],
  'alt': ['1742-6'],
  'gpt': ['1742-6'],
  'ggt': ['2324-2'],
};

function resolveLoincCodes(parameter: string): string[] {
  const normalized = parameter.toLowerCase().replace(/\s+/g, '');
  return LOINC_BY_NAME[normalized] ?? [];
}

// ============================================================================
// Tool schemas (Anthropic SDK format)
// ============================================================================
export const CHATBOT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'query_lab_results',
    description: 'Suche Laborwerte im Verlauf des Nutzers. Nutze dies, wenn der Nutzer nach konkreten Laborergebnissen fragt (Cholesterin, TSH, HbA1c, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        parameter: {
          type: 'string',
          description: 'Der Parametername auf Deutsch oder Englisch, z.B. "Cholesterin", "TSH", "HbA1c".',
        },
        loinc_codes: {
          type: 'array',
          items: { type: 'string' },
          description: 'LOINC-Codes (optional, alternativ zu parameter).',
        },
        limit: {
          type: 'integer',
          description: 'Anzahl der Ergebnisse (1 für letzten Wert, höher für Verlauf). Default: 1.',
        },
        from_date: {
          type: 'string',
          description: 'Optionales Startdatum (YYYY-MM-DD).',
        },
        to_date: {
          type: 'string',
          description: 'Optionales Enddatum (YYYY-MM-DD).',
        },
      },
    },
  },
  {
    name: 'query_medications',
    description: 'Suche Medikamente in der Krankengeschichte. Nutze dies für Fragen zu aktueller oder vergangener Medikation.',
    input_schema: {
      type: 'object',
      properties: {
        active_only: {
          type: 'boolean',
          description: 'Nur aktuelle Medikamente (true) oder alle (false). Default: true.',
        },
        substance: {
          type: 'string',
          description: 'Optionaler Wirkstoff- oder Markennamefilter.',
        },
      },
    },
  },
  {
    name: 'query_diagnoses',
    description: 'Suche Diagnosen in der Krankengeschichte. Nutze dies, wenn der Nutzer fragt, welche Diagnosen dokumentiert sind.',
    input_schema: {
      type: 'object',
      properties: {
        icd10: {
          type: 'string',
          description: 'Optionaler ICD-10-Code-Filter (z.B. "I10").',
        },
        active_only: {
          type: 'boolean',
          description: 'Nur ungelöste Diagnosen (true) oder alle (false). Default: true.',
        },
        chronic_only: {
          type: 'boolean',
          description: 'Nur chronische Diagnosen. Default: false.',
        },
      },
    },
  },
  {
    name: 'query_consultations',
    description: 'Suche Arztbesuche / Konsultationen. Nutze dies für Fragen wie "Wann war ich beim Kardiologen?" oder "Wie oft habe ich Dr. X gesehen?".',
    input_schema: {
      type: 'object',
      properties: {
        practitioner: {
          type: 'string',
          description: 'Optionaler Arztname-Filter.',
        },
        specialty: {
          type: 'string',
          description: 'Optionaler Fachrichtungs-Filter (z.B. "Kardiologie").',
        },
        from_date: {
          type: 'string',
          description: 'Optionales Startdatum (YYYY-MM-DD).',
        },
        to_date: {
          type: 'string',
          description: 'Optionales Enddatum (YYYY-MM-DD).',
        },
        limit: {
          type: 'integer',
          description: 'Maximale Anzahl Ergebnisse. Default: 10.',
        },
      },
    },
  },
  {
    name: 'search_timeline',
    description: 'Volltext-Suche im gesamten Verlauf. Nutze dies, wenn die Frage nicht durch andere Tools abgedeckt ist.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Suchbegriffe.',
        },
        from_date: { type: 'string' },
        to_date: { type: 'string' },
        limit: { type: 'integer' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_document',
    description: 'Hole Details zu einem spezifischen Dokument anhand der ID.',
    input_schema: {
      type: 'object',
      properties: {
        document_id: { type: 'string' },
      },
      required: ['document_id'],
    },
  },
];

// ============================================================================
// Tool execution
// ============================================================================
export async function executeChatTool(
  toolName: string,
  input: any
): Promise<{ result: any; citations?: any[] }> {
  const supabase = createClient();

  switch (toolName) {
    case 'query_lab_results':
      return queryLabResults(supabase, input);
    case 'query_medications':
      return queryMedications(supabase, input);
    case 'query_diagnoses':
      return queryDiagnoses(supabase, input);
    case 'query_consultations':
      return queryConsultations(supabase, input);
    case 'search_timeline':
      return searchTimeline(supabase, input);
    case 'get_document':
      return getDocument(supabase, input);
    default:
      return { result: { error: `Unknown tool: ${toolName}` } };
  }
}

async function queryLabResults(supabase: any, input: any) {
  const limit = input.limit ?? 1;
  let loincCodes: string[] = input.loinc_codes ?? [];
  if (loincCodes.length === 0 && input.parameter) {
    loincCodes = resolveLoincCodes(input.parameter);
  }

  let query = supabase
    .from('lab_results_with_source')
    .select('*')
    .order('measured_at', { ascending: false })
    .limit(limit);

  if (loincCodes.length > 0) {
    query = query.in('loinc_code', loincCodes);
  } else if (input.parameter) {
    // Fallback to ILIKE on parameter name
    query = query.ilike('parameter_name_de', `%${input.parameter}%`);
  }

  if (input.from_date) query = query.gte('measured_at', input.from_date);
  if (input.to_date) query = query.lte('measured_at', input.to_date);

  const { data, error } = await query;
  if (error) return { result: { error: error.message } };

  const citations = data?.map((r: any) => ({
    type: 'lab_result',
    document_id: r.document_id,
    document_file_name: r.document_file_name,
    measured_at: r.measured_at,
    ordered_by: r.ordered_by_name,
  })) ?? [];

  return { result: data ?? [], citations };
}

async function queryMedications(supabase: any, input: any) {
  let query = supabase.from('active_medications').select('*');

  if (input.active_only !== false) {
    // active_medications view already filters
  } else {
    query = supabase.from('medications').select('*, prescribed_by:practitioners(name, specialty)');
  }

  if (input.substance) {
    query = query.or(`substance_inn.ilike.%${input.substance}%,trade_name.ilike.%${input.substance}%`);
  }

  const { data, error } = await query;
  if (error) return { result: { error: error.message } };
  return { result: data ?? [] };
}

async function queryDiagnoses(supabase: any, input: any) {
  let query = supabase
    .from('diagnoses')
    .select('*, event:medical_events(event_date, source_document_id)')
    .order('last_documented', { ascending: false });

  if (input.icd10) query = query.like('icd10', `${input.icd10}%`);
  if (input.active_only !== false) query = query.is('resolved_date', null);
  if (input.chronic_only) query = query.eq('is_chronic', true);

  const { data, error } = await query;
  if (error) return { result: { error: error.message } };
  return { result: data ?? [] };
}

async function queryConsultations(supabase: any, input: any) {
  const limit = input.limit ?? 10;

  let query = supabase
    .from('medical_events')
    .select('*, practitioner:practitioners(name, specialty), document:documents(file_name)')
    .eq('event_type', 'consultation')
    .order('event_date', { ascending: false })
    .limit(limit);

  if (input.from_date) query = query.gte('event_date', input.from_date);
  if (input.to_date) query = query.lte('event_date', input.to_date);

  const { data, error } = await query;
  if (error) return { result: { error: error.message } };

  let filtered = data ?? [];
  if (input.practitioner) {
    const term = input.practitioner.toLowerCase();
    filtered = filtered.filter((e: any) =>
      e.practitioner?.name?.toLowerCase().includes(term)
    );
  }
  if (input.specialty) {
    const term = input.specialty.toLowerCase();
    filtered = filtered.filter((e: any) =>
      e.practitioner?.specialty?.toLowerCase().includes(term)
    );
  }

  return { result: filtered };
}

async function searchTimeline(supabase: any, input: any) {
  const limit = input.limit ?? 10;
  const { query: q, from_date, to_date } = input;

  let query = supabase
    .from('medical_events')
    .select('*, practitioner:practitioners(name, specialty), document:documents(file_name)')
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
    .order('event_date', { ascending: false })
    .limit(limit);

  if (from_date) query = query.gte('event_date', from_date);
  if (to_date) query = query.lte('event_date', to_date);

  const { data, error } = await query;
  if (error) return { result: { error: error.message } };
  return { result: data ?? [] };
}

async function getDocument(supabase: any, input: any) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, file_name, document_type, uploaded_at, raw_extracted_json')
    .eq('id', input.document_id)
    .single();

  if (error) return { result: { error: error.message } };
  return { result: data };
}
