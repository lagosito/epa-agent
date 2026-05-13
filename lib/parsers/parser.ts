/**
 * Document parser orchestrator.
 * Routes documents to the appropriate tier based on type:
 *   Tier 1: Claude vision direct (Arztbrief, Befund, Rezept, eRezept)
 *   Tier 2: Azure Document Intelligence + Claude normalization (Laborwerte, Impfpass analog)
 *   Tier 3: Tesseract fallback (degraded scans)
 */

import { anthropic, MODEL_PARSER } from '@/lib/claude/client';
import {
  PROMPTS_BY_TYPE,
  DOCUMENT_TYPE_DETECTOR_PROMPT,
  type DocumentTypeKey,
} from './prompts/document-prompts';
import {
  ArztbriefSchema,
  LaborwerteSchema,
  RezeptSchema,
  BefundBildgebungSchema,
  UeberweisungSchema,
  ImpfpassSchema,
} from './schemas/parsing-schemas';
import { parseLaborwerteWithAzure } from './tier2-azure';

export interface ParseResult {
  documentType: DocumentTypeKey;
  data: any;
  confidence: number;
  parserTier: 1 | 2 | 3;
  parserModel: string;
  rawJson: string;
  error?: string;
}

/**
 * Detect document type by sending a small prompt with the PDF to Claude.
 */
export async function detectDocumentType(pdfBase64: string): Promise<DocumentTypeKey> {
  const response = await anthropic.messages.create({
    model: MODEL_PARSER,
    max_tokens: 50,
    system: DOCUMENT_TYPE_DETECTOR_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          { type: 'text', text: 'Was für ein Dokument ist das?' },
        ],
      },
    ],
  });

  const firstBlock = response.content[0];
  const text = firstBlock.type === 'text' ? firstBlock.text.trim().toLowerCase() : '';

  const validTypes: DocumentTypeKey[] = [
    'arztbrief', 'laborwerte', 'rezept', 'ueberweisung',
    'befund_bildgebung', 'impfpass', 'unknown',
  ];
  if (validTypes.includes(text as DocumentTypeKey)) {
    return text as DocumentTypeKey;
  }
  return 'unknown';
}

/**
 * Tier 1: parse with Claude vision directly.
 * Best for narrative documents (Arztbrief, Befund, Rezept).
 */
export async function parseTier1(
  pdfBase64: string,
  documentType: DocumentTypeKey
): Promise<ParseResult> {
  const systemPrompt = PROMPTS_BY_TYPE[documentType];

  const response = await anthropic.messages.create({
    model: MODEL_PARSER,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: 'Extrahiere die strukturierten Daten gemäß dem Schema. Antworte nur mit JSON.',
          },
        ],
      },
    ],
  });

  const firstBlock = response.content[0];
  const rawText = firstBlock.type === 'text' ? firstBlock.text : '';

  // Strip code fences if Claude wrapped them
  const cleanedJson = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (err) {
    return {
      documentType,
      data: null,
      confidence: 0,
      parserTier: 1,
      parserModel: MODEL_PARSER,
      rawJson: rawText,
      error: `Invalid JSON from parser: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Validate against schema
  const validated = validateByType(documentType, parsed);
  if (!validated.success) {
    return {
      documentType,
      data: parsed,
      confidence: parsed.confidence ?? 0.3,
      parserTier: 1,
      parserModel: MODEL_PARSER,
      rawJson: cleanedJson,
      error: `Schema validation failed: ${validated.error}`,
    };
  }

  return {
    documentType,
    data: validated.data,
    confidence: validated.data.confidence ?? 0.8,
    parserTier: 1,
    parserModel: MODEL_PARSER,
    rawJson: cleanedJson,
  };
}

/**
 * Validate parsed JSON against the appropriate Zod schema.
 */
function validateByType(documentType: DocumentTypeKey, data: any) {
  try {
    switch (documentType) {
      case 'arztbrief':
        return { success: true as const, data: ArztbriefSchema.parse(data) };
      case 'laborwerte':
        return { success: true as const, data: LaborwerteSchema.parse(data) };
      case 'rezept':
        return { success: true as const, data: RezeptSchema.parse(data) };
      case 'befund_bildgebung':
        return { success: true as const, data: BefundBildgebungSchema.parse(data) };
      case 'ueberweisung':
        return { success: true as const, data: UeberweisungSchema.parse(data) };
      case 'impfpass':
        return { success: true as const, data: ImpfpassSchema.parse(data) };
      default:
        return { success: true as const, data };
    }
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Main entry point: route to the appropriate tier and parse.
 */
export async function parseDocument(
  pdfBase64: string,
  hint?: DocumentTypeKey
): Promise<ParseResult> {
  // Step 1: detect type if not provided
  const documentType = hint ?? await detectDocumentType(pdfBase64);

  // Step 2: route to tier
  if (documentType === 'laborwerte') {
    // Tier 2: Azure DI handles tabular data better
    try {
      return await parseLaborwerteWithAzure(pdfBase64);
    } catch (err) {
      // Fallback to tier 1 if Azure fails
      console.warn('[parser] Azure DI failed, falling back to Claude vision:', err);
      return await parseTier1(pdfBase64, documentType);
    }
  }

  // Tier 1 for everything else
  return await parseTier1(pdfBase64, documentType);
}
