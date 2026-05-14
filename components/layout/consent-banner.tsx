'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox, Label } from '@/components/ui/input';

export function ConsentBanner() {
  const router = useRouter();
  const [dataProcessing, setDataProcessing] = useState(false);
  const [claudeApi, setClaudeApi] = useState(false);
  const [productImprovement, setProductImprovement] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!dataProcessing || !claudeApi) {
      setError('Die ersten beiden Einwilligungen sind erforderlich.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { purpose: 'data_processing', granted: true },
        { purpose: 'claude_api_processing', granted: true },
        { purpose: 'product_improvement', granted: productImprovement },
      ]),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError('Einwilligung konnte nicht gespeichert werden. Bitte erneut versuchen.');
      return;
    }
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-medical-50 flex items-center justify-center">
            <Shield className="h-5 w-5 text-medical-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Einwilligung zur Datenverarbeitung</h2>
            <p className="text-sm text-ink-muted mt-1">
              Bevor du ePA Agent nutzen kannst, brauchen wir deine ausdrückliche Einwilligung
              gemäß Art. 9 DSGVO (besondere Kategorien personenbezogener Daten).
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <ConsentItem
            checked={dataProcessing}
            onChange={setDataProcessing}
            required
            title="Verarbeitung meiner Gesundheitsdaten (erforderlich)"
            text="Ich willige ein, dass ePA Agent meine hochgeladenen medizinischen Dokumente verarbeitet, um Diagnosen, Medikamente und Werte zu extrahieren und chronologisch zu organisieren."
          />
          <ConsentItem
            checked={claudeApi}
            onChange={setClaudeApi}
            required
            title="Verarbeitung durch Claude (Anthropic, USA) (erforderlich)"
            text="Ich willige ein, dass meine Dokumente zur strukturierten Extraktion an Claude (Anthropic, USA) übermittelt werden — auf Grundlage von Standardvertragsklauseln (SCCs) und unter Zero Data Retention. Direkte Identifikatoren werden vorher pseudonymisiert."
          />
          <ConsentItem
            checked={productImprovement}
            onChange={setProductImprovement}
            title="Anonyme Produktverbesserung (optional)"
            text="Ich willige ein, dass anonymisierte und aggregierte Statistiken zur Verbesserung des Dienstes verwendet werden dürfen."
          />
        </div>

        {error && (
          <div className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !dataProcessing || !claudeApi}
            className="flex-1"
          >
            {submitting ? 'Speichere...' : 'Einwilligen und fortfahren'}
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="secondary" className="w-full">
              Abbrechen
            </Button>
          </Link>
        </div>

        <p className="text-xs text-ink-muted mt-4 text-center">
          Du kannst deine Einwilligung jederzeit unter{' '}
          <Link href="/profile" className="underline">Profil</Link>
          {' '}widerrufen. Details:{' '}
          <Link href="/datenschutz" className="underline">Datenschutzerklärung</Link>.
        </p>
      </div>
    </div>
  );
}

function ConsentItem({
  checked,
  onChange,
  title,
  text,
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  text: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-bg-subtle cursor-pointer">
      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5"
      />
      <div>
        <div className="font-medium text-ink text-sm">
          {title}
          {required && <span className="text-danger ml-1">*</span>}
        </div>
        <p className="text-sm text-ink-muted mt-1">{text}</p>
      </div>
    </label>
  );
}
