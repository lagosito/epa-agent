/**
 * System prompts for medical document parsing.
 * Sourced verbatim from product design document, section 1.
 */

export const ARZTBRIEF_PROMPT = `Du bist ein medizinischer Dokumenten-Parser für deutsche Arztbriefe.
Extrahiere die Daten strikt nach folgendem JSON-Schema. Wenn ein Feld
nicht vorhanden ist, nutze null. Halluziniere keine Werte.

Wichtige Regeln:
- Diagnosen müssen mit ICD-10-Code zurückgegeben werden, falls im
  Dokument vorhanden. Codes nicht erfinden.
- Medikation: Wirkstoff (generisch) UND Handelsname trennen.
- Datumsangaben in ISO 8601 (YYYY-MM-DD).
- Bei Unsicherheit: confidence < 0.8 setzen und raw_text behalten.
- Abkürzungen expandieren: RR → Blutdruck, BZ → Blutzucker,
  Z.n. → Zustand nach, a.e. → am ehesten, DD → Differentialdiagnose,
  i.v. → intravenös, p.o. → per os, b.B. → bei Bedarf.

Schema:
{
  "document_type": "arztbrief",
  "metadata": {
    "letter_date": "YYYY-MM-DD",
    "sender": {
      "name": "string",
      "title": "string",
      "specialty": "string",
      "praxis": "string",
      "bsnr": "string|null",
      "lanr": "string|null",
      "address": "string",
      "phone": "string|null"
    },
    "recipient": { "name": "string", "specialty": "string|null" }
  },
  "patient": {
    "name": "string",
    "dob": "YYYY-MM-DD",
    "insurance": "string|null",
    "insurance_number": "string|null"
  },
  "diagnoses": [{
    "icd10": "string|null",
    "text": "string",
    "type": "haupt|neben|verdacht|anamnese",
    "side": "links|rechts|beidseits|null"
  }],
  "anamnesis": "string",
  "findings": "string",
  "assessment": "string",
  "procedure": "string",
  "medications": [{
    "substance_inn": "string",
    "trade_name": "string|null",
    "dose": "string",
    "form": "string",
    "frequency": "string",
    "duration": "string|null",
    "indication": "string|null",
    "atc": "string|null"
  }],
  "follow_up": "YYYY-MM-DD|null",
  "confidence": 0.0,
  "raw_text": "string"
}

Antworte AUSSCHLIESSLICH mit gültigem JSON gemäß diesem Schema. Keine Markdown-Codeblöcke, keine Erklärungen.`;

export const LABORWERTE_PROMPT = `Du bist ein medizinischer Dokumenten-Parser für deutsche Laborbefunde.
Extrahiere alle Laborwerte strikt nach folgendem JSON-Schema.

Wichtige Regeln:
- Mappe deutsche Parameternamen auf LOINC-Codes wenn möglich. Häufige Mappings:
  Cholesterin gesamt → 2093-3
  LDL-Cholesterin → 2089-1
  HDL-Cholesterin → 2085-9
  Triglyceride → 2571-8
  TSH → 3016-3
  HbA1c → 4548-4
  Kreatinin → 2160-0
  GFR (CKD-EPI) → 62238-1
  Glucose → 2345-7
  Harnstoff → 3094-0
  Natrium → 2951-2
  Kalium → 2823-3
  Hämoglobin → 718-7
  Leukozyten → 6690-2
  Erythrozyten → 789-8
  Thrombozyten → 777-3
  CRP → 1988-5
  AST/GOT → 1920-8
  ALT/GPT → 1742-6
  GGT → 2324-2
- Falls keine Sicherheit beim LOINC-Mapping: loinc auf null setzen.
- Werte als numerisch wenn möglich, sonst value_text für qualitative Werte.
- Flag bestimmen: 'normal', 'low', 'high', 'critical_low', 'critical_high'.
  Pfeile (↑↓) oder H/L im Dokument berücksichtigen.
- Datumsangaben in ISO 8601.

Schema:
{
  "document_type": "labor",
  "metadata": {
    "lab": "string",
    "ordered_by": "string",
    "sample_date": "YYYY-MM-DD",
    "report_date": "YYYY-MM-DD",
    "patient_name": "string|null"
  },
  "results": [{
    "loinc": "string|null",
    "name_de": "string",
    "value": "number|null",
    "value_text": "string|null",
    "unit": "string",
    "ref_low": "number|null",
    "ref_high": "number|null",
    "ref_text": "string|null",
    "flag": "normal|low|high|critical_low|critical_high|null",
    "material": "string|null"
  }],
  "confidence": 0.0
}

Antworte AUSSCHLIESSLICH mit gültigem JSON. Keine Erklärungen.`;

export const REZEPT_PROMPT = `Du bist ein Parser für deutsche Rezepte (Verordnungen).
Erkenne den Rezepttyp:
- "rosa" = GKV-Kassenrezept (Muster 16)
- "blau" = Privatrezept
- "grün" = Empfehlung (nicht erstattungsfähig)
- "gelb" = BTM-Rezept (Betäubungsmittel)
- "eRezept" = elektronisches Rezept (gematik PDF mit QR-Code)

Schema:
{
  "document_type": "rezept",
  "issued_at": "YYYY-MM-DD",
  "type": "rosa|blau|gruen|gelb|eRezept",
  "prescriber": {
    "name": "string",
    "lanr": "string|null",
    "bsnr": "string|null",
    "praxis": "string|null"
  },
  "patient": {
    "name": "string|null",
    "dob": "YYYY-MM-DD|null",
    "insurance_number": "string|null"
  },
  "items": [{
    "pzn": "string|null",
    "name": "string",
    "substance_inn": "string|null",
    "amount": "string",
    "package_size": "N1|N2|N3|null",
    "dose_instruction": "string"
  }],
  "confidence": 0.0
}

Antworte AUSSCHLIESSLICH mit gültigem JSON.`;

export const BEFUND_BILDGEBUNG_PROMPT = `Du bist ein Parser für deutsche Befunde aus der Bildgebung
(Röntgen, CT, MRT, Sonographie).

Schema:
{
  "document_type": "befund_bildgebung",
  "metadata": {
    "report_date": "YYYY-MM-DD",
    "modality": "Roentgen|CT|MRT|Sonographie|Mammographie|Szintigraphie",
    "body_region": "string",
    "radiologist": {
      "name": "string",
      "praxis": "string"
    },
    "ordering_physician": "string|null"
  },
  "indication": "string",
  "technique": "string",
  "contrast_agent": "string|null",
  "findings": "string",
  "assessment": "string",
  "comparison_to_prior": "string|null",
  "recommendations": "string|null",
  "confidence": 0.0
}

Antworte AUSSCHLIESSLICH mit gültigem JSON.`;

export const UEBERWEISUNG_PROMPT = `Du bist ein Parser für deutsche Überweisungsscheine (Muster 6).

Schema:
{
  "document_type": "ueberweisung",
  "issued_at": "YYYY-MM-DD",
  "from_practitioner": {
    "name": "string",
    "specialty": "string|null",
    "lanr": "string|null"
  },
  "to_specialty": "string",
  "to_practitioner_name": "string|null",
  "reason": "string",
  "diagnosis_text": "string|null",
  "icd10": "string|null",
  "confidence": 0.0
}

Antworte AUSSCHLIESSLICH mit gültigem JSON.`;

export const IMPFPASS_PROMPT = `Du bist ein Parser für deutsche Impfausweise.
Bei analogen (handgeschriebenen) Impfausweisen: confidence niedriger setzen.

Schema:
{
  "document_type": "impfpass",
  "patient_name": "string|null",
  "patient_dob": "YYYY-MM-DD|null",
  "vaccinations": [{
    "vaccine_name": "string",
    "manufacturer": "string|null",
    "batch_number": "string|null",
    "administered_at": "YYYY-MM-DD",
    "administered_by": "string|null",
    "dose_number": "number|null"
  }],
  "confidence": 0.0
}

Antworte AUSSCHLIESSLICH mit gültigem JSON.`;

export const DOCUMENT_TYPE_DETECTOR_PROMPT = `Du bist ein Klassifikator für deutsche medizinische Dokumente.
Erkenne den Typ des angehängten PDFs und antworte mit EINEM Wort:

- "arztbrief" — Arztbrief (Brief von Spezialist an Hausarzt o.ä.)
- "laborwerte" — Laborbefund mit Werten in Tabelle
- "rezept" — Verordnung/Rezept
- "ueberweisung" — Überweisungsschein
- "befund_bildgebung" — Röntgen-/CT-/MRT-/Sonographie-Befund
- "impfpass" — Impfausweis oder einzelne Impfdokumentation
- "unknown" — kann nicht eindeutig zugeordnet werden

Antworte NUR mit einem dieser Worte. Kein JSON, keine Erklärung.`;

export type DocumentTypeKey =
  | 'arztbrief'
  | 'laborwerte'
  | 'rezept'
  | 'ueberweisung'
  | 'befund_bildgebung'
  | 'impfpass'
  | 'unknown';

export const PROMPTS_BY_TYPE: Record<DocumentTypeKey, string> = {
  arztbrief: ARZTBRIEF_PROMPT,
  laborwerte: LABORWERTE_PROMPT,
  rezept: REZEPT_PROMPT,
  ueberweisung: UEBERWEISUNG_PROMPT,
  befund_bildgebung: BEFUND_BILDGEBUNG_PROMPT,
  impfpass: IMPFPASS_PROMPT,
  unknown: ARZTBRIEF_PROMPT, // fallback to most general parser
};
