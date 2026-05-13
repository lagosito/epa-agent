import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Note: ZDR (Zero Data Retention) is configured at account level via Anthropic
  // contractual addendum, not via SDK parameter. Verify in console.anthropic.com.
});

export const MODEL_PARSER = process.env.ANTHROPIC_MODEL_PARSER || 'claude-opus-4-7';
export const MODEL_CHAT = process.env.ANTHROPIC_MODEL_CHAT || 'claude-sonnet-4-6';

export const ZDR_ENABLED = process.env.ANTHROPIC_ZDR_ENABLED === 'true';
