/**
 * Pseudonymization layer — DSGVO Art. 32 supplementary measure for US transfer.
 *
 * Before sending health documents to Claude API (US-based), replace direct
 * identifiers with tokens. The medical content itself (diagnoses, lab values,
 * narrative findings) is preserved — only PII identifiers are masked.
 *
 * The mapping is kept locally in the request scope and reapplied to the response.
 */

export interface PseudoMapping {
  patientName?: string;
  patientDob?: string;
  insuranceNumber?: string;
  address?: string;
  // Reverse mapping for response reconstruction
  tokens: Record<string, string>;
}

const PATIENT_TOKEN = '[PATIENT]';
const DOB_TOKEN = '[DOB]';
const INSURANCE_TOKEN = '[INSURANCE_NR]';
const ADDRESS_TOKEN = '[ADDRESS]';

/**
 * Note: For PDFs, pseudonymization at the byte level is not feasible.
 * Instead, we rely on:
 *   1. The system prompt instructing Claude to NOT echo back identifiers
 *      verbatim, only return them in structured fields.
 *   2. ZDR being enabled so prompts are not retained.
 *   3. EU-region routing where available (claude-sonnet-4-6 EU).
 *
 * For text content (chatbot context), apply the regex-based pseudonymizer below.
 */

export function pseudonymizeText(text: string, knownIdentifiers?: {
  patientName?: string;
  patientDob?: string;
  insuranceNumber?: string;
  address?: string;
}): { text: string; mapping: PseudoMapping } {
  let pseudonymized = text;
  const mapping: PseudoMapping = { ...knownIdentifiers, tokens: {} };

  if (knownIdentifiers?.patientName) {
    pseudonymized = pseudonymized.replaceAll(knownIdentifiers.patientName, PATIENT_TOKEN);
    mapping.tokens[PATIENT_TOKEN] = knownIdentifiers.patientName;
  }
  if (knownIdentifiers?.patientDob) {
    pseudonymized = pseudonymized.replaceAll(knownIdentifiers.patientDob, DOB_TOKEN);
    mapping.tokens[DOB_TOKEN] = knownIdentifiers.patientDob;
  }
  if (knownIdentifiers?.insuranceNumber) {
    pseudonymized = pseudonymized.replaceAll(knownIdentifiers.insuranceNumber, INSURANCE_TOKEN);
    mapping.tokens[INSURANCE_TOKEN] = knownIdentifiers.insuranceNumber;
  }
  if (knownIdentifiers?.address) {
    pseudonymized = pseudonymized.replaceAll(knownIdentifiers.address, ADDRESS_TOKEN);
    mapping.tokens[ADDRESS_TOKEN] = knownIdentifiers.address;
  }

  // Generic patterns
  // German insurance numbers: 1 letter + 9 digits
  pseudonymized = pseudonymized.replace(/\b[A-Z]\d{9}\b/g, INSURANCE_TOKEN);

  return { text: pseudonymized, mapping };
}

export function rehydrateText(text: string, mapping: PseudoMapping): string {
  let rehydrated = text;
  for (const [token, value] of Object.entries(mapping.tokens)) {
    rehydrated = rehydrated.replaceAll(token, value);
  }
  return rehydrated;
}
