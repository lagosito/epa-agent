import { describe, it, expect, vi } from 'vitest';
import { CHATBOT_TOOLS } from '@/lib/claude/chatbot-tools';
import { CHATBOT_SYSTEM_PROMPT } from '@/lib/claude/chatbot-prompt';

describe('Chatbot configuration', () => {
  describe('System prompt', () => {
    it('contains all six absolute rules', () => {
      // Spec from design doc — six numbered rules
      for (const n of [1, 2, 3, 4, 5, 6]) {
        expect(CHATBOT_SYSTEM_PROMPT).toContain(`${n}.`);
      }
    });

    it('mandates "Diese Information ersetzt kein Arztgespräch."', () => {
      expect(CHATBOT_SYSTEM_PROMPT).toContain('ersetzt kein Arztgespräch');
    });

    it('mandates source citations', () => {
      expect(CHATBOT_SYSTEM_PROMPT).toContain('Quelle');
    });

    it('forbids diagnoses, medication recommendations, and lab interpretation', () => {
      expect(CHATBOT_SYSTEM_PROMPT).toContain('KEINE Diagnosen');
      expect(CHATBOT_SYSTEM_PROMPT).toContain('KEINE Medikamentenempfehlungen');
      expect(CHATBOT_SYSTEM_PROMPT).toContain('KEINE Laborwerte medizinisch');
    });
  });

  describe('Tool definitions', () => {
    it('exposes all required tools', () => {
      const names = CHATBOT_TOOLS.map((t) => t.name);
      expect(names).toContain('query_lab_results');
      expect(names).toContain('query_medications');
      expect(names).toContain('query_diagnoses');
      expect(names).toContain('query_consultations');
      expect(names).toContain('search_timeline');
      expect(names).toContain('get_document');
    });

    it('every tool has a German description', () => {
      for (const tool of CHATBOT_TOOLS) {
        expect(tool.description).toBeTruthy();
        expect(tool.description!.length).toBeGreaterThan(20);
      }
    });

    it('every tool has a valid input_schema', () => {
      for (const tool of CHATBOT_TOOLS) {
        expect(tool.input_schema).toBeDefined();
        expect((tool.input_schema as any).type).toBe('object');
      }
    });
  });
});
