import { describe, it, expect } from 'vitest';
import {
  ArztbriefSchema,
  LaborwerteSchema,
  RezeptSchema,
} from '@/lib/parsers/schemas/parsing-schemas';

describe('Parser schemas', () => {
  describe('ArztbriefSchema', () => {
    it('accepts a valid Arztbrief from the design document example', () => {
      const data = {
        document_type: 'arztbrief',
        metadata: {
          letter_date: '2026-05-03',
          sender: {
            name: 'Dr. med. Andreas Meier',
            specialty: 'Kardiologie',
            praxis: 'Kardiologische Praxis Eppendorf',
            lanr: '999999900',
            address: 'Martinistraße 52, 20251 Hamburg',
          },
        },
        diagnoses: [
          { icd10: 'I10.90', text: 'Essentielle Hypertonie', type: 'haupt' },
          { icd10: 'E78.0', text: 'Reine Hypercholesterinämie', type: 'neben' },
        ],
        findings: 'Belastungs-EKG bis 150 W ohne Ischämiezeichen.',
        assessment: 'Stabile Hypertonie unter aktueller Medikation.',
        procedure: 'Statin-Therapie wird begonnen.',
        medications: [
          {
            substance_inn: 'Atorvastatin',
            trade_name: 'Sortis',
            dose: '20 mg',
            form: 'Tablette',
            frequency: '1-0-0',
            duration: 'dauerhaft',
            atc: 'C10AA05',
          },
        ],
        follow_up: '2026-08-03',
        confidence: 0.94,
      };

      const result = ArztbriefSchema.parse(data);
      expect(result.diagnoses).toHaveLength(2);
      expect(result.diagnoses[0].icd10).toBe('I10.90');
      expect(result.medications[0].substance_inn).toBe('Atorvastatin');
      expect(result.confidence).toBe(0.94);
    });

    it('rejects invalid date formats', () => {
      const bad = {
        document_type: 'arztbrief',
        metadata: {
          letter_date: '03.05.2026',
          sender: { name: 'Dr. X' },
        },
        diagnoses: [],
        medications: [],
        confidence: 0.5,
      };
      expect(() => ArztbriefSchema.parse(bad)).toThrow();
    });

    it('handles minimum required fields', () => {
      const minimal = {
        document_type: 'arztbrief',
        metadata: {
          letter_date: '2026-05-03',
          sender: { name: 'Dr. X' },
        },
        confidence: 0.5,
      };
      const result = ArztbriefSchema.parse(minimal);
      expect(result.diagnoses).toEqual([]);
      expect(result.medications).toEqual([]);
    });
  });

  describe('LaborwerteSchema', () => {
    it('parses a typical lipid panel', () => {
      const data = {
        document_type: 'labor',
        metadata: {
          lab: 'SYNLAB MVZ Hamburg',
          ordered_by: 'Dr. Andreas Meier',
          sample_date: '2026-05-02',
          report_date: '2026-05-03',
        },
        results: [
          {
            loinc: '2093-3',
            name_de: 'Cholesterin gesamt',
            value: 247,
            unit: 'mg/dL',
            ref_low: null,
            ref_high: 200,
            flag: 'high',
          },
          {
            loinc: '2089-1',
            name_de: 'LDL-Cholesterin',
            value: 168,
            unit: 'mg/dL',
            ref_low: null,
            ref_high: 130,
            flag: 'high',
          },
          {
            loinc: '2085-9',
            name_de: 'HDL-Cholesterin',
            value: 48,
            unit: 'mg/dL',
            ref_low: 40,
            ref_high: null,
            flag: 'normal',
          },
        ],
        confidence: 0.92,
      };
      const parsed = LaborwerteSchema.parse(data);
      expect(parsed.results).toHaveLength(3);
      expect(parsed.results[0].loinc).toBe('2093-3');
    });

    it('accepts qualitative values via value_text', () => {
      const data = {
        document_type: 'labor',
        metadata: { lab: 'X', sample_date: '2026-05-02' },
        results: [
          {
            loinc: null,
            name_de: 'COVID-19 PCR',
            value: null,
            value_text: 'negativ',
            unit: null,
          },
        ],
        confidence: 0.8,
      };
      expect(() => LaborwerteSchema.parse(data)).not.toThrow();
    });
  });

  describe('RezeptSchema', () => {
    it('parses a Kassenrezept (rosa)', () => {
      const data = {
        document_type: 'rezept',
        issued_at: '2026-05-03',
        type: 'rosa',
        prescriber: {
          name: 'Dr. Andreas Meier',
          lanr: '999999900',
        },
        items: [
          {
            pzn: '00592135',
            name: 'Sortis 20mg Filmtbl. N3',
            substance_inn: 'Atorvastatin',
            amount: '100 St.',
            dose_instruction: '1-0-0',
          },
        ],
        confidence: 0.95,
      };
      const parsed = RezeptSchema.parse(data);
      expect(parsed.type).toBe('rosa');
      expect(parsed.items[0].pzn).toBe('00592135');
    });

    it('rejects invalid prescription types', () => {
      const bad = {
        document_type: 'rezept',
        issued_at: '2026-05-03',
        type: 'orange',
        prescriber: { name: 'Dr. X' },
        items: [],
        confidence: 0.5,
      };
      expect(() => RezeptSchema.parse(bad)).toThrow();
    });
  });
});
