/**
 * Tier 2 parser: Azure Document Intelligence + Claude normalization.
 * Used for tabular Laborwerte where layout extraction matters.
 */

import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';
import { anthropic, MODEL_PARSER } from '@/lib/claude/client';
import { LABORWERTE_PROMPT } from './prompts/document-prompts';
import { LaborwerteSchema } from './schemas/parsing-schemas';
import type { ParseResult } from './parser';

let azureClient: DocumentAnalysisClient | null = null;

function getAzureClient(): DocumentAnalysisClient {
  if (azureClient) return azureClient;

  const endpoint = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOC_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error('Azure Document Intelligence credentials missing');
  }

  azureClient = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
  return azureClient;
}

/**
 * Extract layout (tables + text) using Azure DI prebuilt-layout model,
 * then ask Claude to normalize the table data with LOINC codes.
 */
export async function parseLaborwerteWithAzure(pdfBase64: string): Promise<ParseResult> {
  const buffer = Buffer.from(pdfBase64, 'base64');
  const client = getAzureClient();

  // Step 1: extract layout with Azure DI
  const poller = await client.beginAnalyzeDocument('prebuilt-layout', buffer);
  const layout = await poller.pollUntilDone();

  // Step 2: serialize the extracted tables and text in a compact form for Claude
  const extractedContent = serializeAzureLayout(layout);

  // Step 3: send extracted content to Claude with the Laborwerte prompt
  // for LOINC normalization and structured output
  const response = await anthropic.messages.create({
    model: MODEL_PARSER,
    max_tokens: 4096,
    system: LABORWERTE_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Hier ist der von Azure DI extrahierte Inhalt eines deutschen Laborbefunds. Wandle ihn in das JSON-Schema um:\n\n${extractedContent}`,
          },
        ],
      },
    ],
  });

  const firstBlock = response.content[0];
  const rawText = firstBlock.type === 'text' ? firstBlock.text : '';

  const cleanedJson = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanedJson);
    const validated = LaborwerteSchema.parse(parsed);
    return {
      documentType: 'laborwerte',
      data: validated,
      confidence: validated.confidence ?? 0.85,
      parserTier: 2,
      parserModel: `${MODEL_PARSER} + azure-doc-intel`,
      rawJson: cleanedJson,
    };
  } catch (err) {
    return {
      documentType: 'laborwerte',
      data: null,
      confidence: 0,
      parserTier: 2,
      parserModel: `${MODEL_PARSER} + azure-doc-intel`,
      rawJson: rawText,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Convert Azure DI output to a compact text representation.
 * Tables are serialized as markdown for easy LLM consumption.
 */
function serializeAzureLayout(layout: any): string {
  const parts: string[] = [];

  // Header text (lab name, date, ordering physician)
  if (layout.content) {
    const headerLines = layout.content.split('\n').slice(0, 20).join('\n');
    parts.push('## Header\n' + headerLines);
  }

  // Tables
  if (layout.tables && layout.tables.length > 0) {
    layout.tables.forEach((table: any, idx: number) => {
      parts.push(`\n## Table ${idx + 1} (${table.rowCount} x ${table.columnCount})`);
      // Build a 2D grid
      const grid: string[][] = Array.from({ length: table.rowCount }, () =>
        Array(table.columnCount).fill('')
      );
      for (const cell of table.cells) {
        grid[cell.rowIndex][cell.columnIndex] = (cell.content ?? '').replace(/\|/g, '\\|');
      }
      // Render as markdown
      const headerRow = grid[0].map((c) => c || ' ').join(' | ');
      const sepRow = grid[0].map(() => '---').join(' | ');
      const dataRows = grid.slice(1).map((row) => row.map((c) => c || ' ').join(' | '));
      parts.push(`| ${headerRow} |`);
      parts.push(`| ${sepRow} |`);
      dataRows.forEach((r) => parts.push(`| ${r} |`));
    });
  }

  return parts.join('\n');
}
