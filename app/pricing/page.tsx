'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  async function handleUpgrade(plan: 'monthly' | 'yearly') {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert('Fehler beim Start des Bezahlvorgangs.');
    }
  }

  return (
    <div className="min-h-screen bg-bg-subtle">
      <header className="border-b border-border bg-white">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-medical-500" />
            <span className="font-semibold text-ink">ePA Agent</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>
      </header>

      <main className="container-wide py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-ink mb-3">
            Preise — fair und transparent
          </h1>
          <p className="text-ink-muted">
            Beginne kostenlos mit 5 Dokumenten. Upgrade auf Pro für unbegrenzten Zugang.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex bg-white border border-border rounded-full p-1 mt-8">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                billing === 'monthly' ? 'bg-medical-500 text-white' : 'text-ink-soft'
              }`}
            >
              Monatlich
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                billing === 'yearly' ? 'bg-medical-500 text-white' : 'text-ink-soft'
              }`}
            >
              Jährlich · 25% sparen
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <Card>
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-ink">Free</h2>
                <p className="text-ink-muted mt-1">Zum Ausprobieren</p>
              </div>
              <div className="text-4xl font-bold text-ink mb-6">
                0 €<span className="text-lg font-normal text-ink-muted"> /Monat</span>
              </div>
              <Link href="/auth">
                <Button variant="secondary" className="w-full mb-6">Kostenlos starten</Button>
              </Link>
              <ul className="space-y-3 text-sm">
                <Feature text="Bis zu 5 Dokumente" />
                <Feature text="Timeline-Ansicht" />
                <Feature text="Bis zu 10 Chat-Nachrichten pro Tag" />
                <Feature text="DSGVO-Datenexport" />
                <Feature text="Alle Datenrechte" />
              </ul>
            </div>
          </Card>

          {/* Pro */}
          <Card className="border-medical-500 ring-1 ring-medical-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-medical-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Empfohlen
              </span>
            </div>
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-ink">Pro</h2>
                <p className="text-ink-muted mt-1">Für volle Kontrolle über deine Krankengeschichte</p>
              </div>
              <div className="text-4xl font-bold text-ink mb-1">
                {billing === 'monthly' ? '9,99 €' : '7,42 €'}
                <span className="text-lg font-normal text-ink-muted"> /Monat</span>
              </div>
              {billing === 'yearly' && (
                <p className="text-xs text-medical-600 mb-5">
                  89 €/Jahr — 30 € sparen ggü. monatlicher Zahlung
                </p>
              )}
              {billing === 'monthly' && <div className="mb-5" />}
              <Button
                onClick={() => handleUpgrade(billing)}
                disabled={loading}
                className="w-full mb-6"
              >
                {loading ? 'Lade...' : 'Pro aktivieren'}
              </Button>
              <ul className="space-y-3 text-sm">
                <Feature text="Unbegrenzte Dokumente" highlight />
                <Feature text="Voller Zugriff auf den Assistenten" highlight />
                <Feature text="Laborwerte-Trends mit Diagrammen" highlight />
                <Feature text="Erweiterte Filter" />
                <Feature text="Volltext-Suche" />
                <Feature text="Jederzeit kündbar" />
              </ul>
            </div>
          </Card>
        </div>

        <div className="text-center mt-12 text-xs text-ink-muted max-w-xl mx-auto">
          Alle Preise inkl. MwSt. Zahlung sicher abgewickelt durch Stripe.
          Datenschutzkonform gehostet in der EU (Frankfurt).
        </div>
      </main>
    </div>
  );
}

function Feature({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${highlight ? 'text-medical-500' : 'text-green-600'}`} />
      <span className={highlight ? 'text-ink font-medium' : 'text-ink-soft'}>{text}</span>
    </li>
  );
}
