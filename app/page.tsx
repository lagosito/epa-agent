import Link from 'next/link';
import { Activity, FileText, MessageCircle, Shield, Lock, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-medical-500" />
            <span className="font-semibold text-ink">ePA Agent</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-ink-soft hover:text-ink">
              Preise
            </Link>
            <Link href="/auth">
              <Button variant="ghost" size="sm">Anmelden</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm">Kostenlos starten</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container-wide py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-medical-50 px-3 py-1 text-xs font-medium text-medical-700 mb-6">
            <Shield className="h-3 w-3" />
            DSGVO-konform · Hosted in Deutschland
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-ink leading-tight mb-6">
            74 Millionen Deutsche haben eine ePA. <br />
            <span className="text-medical-500">Niemand hilft ihnen, sie zu verstehen.</span>
          </h1>
          <p className="text-lg text-ink-muted mb-8 max-w-2xl">
            ePA Agent organisiert deine Arztbriefe, Laborbefunde und Rezepte intelligent.
            Lade deine Dokumente hoch und stelle Fragen zu deiner eigenen Krankengeschichte —
            in einfacher Sprache, mit Quellenangabe.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/auth">
              <Button size="lg">Kostenlos starten — 5 Dokumente gratis</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" size="lg">Preise ansehen</Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink-faint">
            Keine Kreditkarte nötig. Volle Datenkontrolle. Jederzeit kündbar.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-bg-subtle">
        <div className="container-wide py-20">
          <h2 className="text-3xl font-bold text-ink mb-12 max-w-2xl">
            Drei Dinge, die ePA Agent für dich tut.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Feature
              icon={<FileText className="h-6 w-6" />}
              title="Verstehen statt sammeln"
              text="Lade Arztbriefe, Labor- oder Bildgebungsbefunde hoch. Wir extrahieren Diagnosen, Werte und Medikamente automatisch und ordnen alles chronologisch."
            />
            <Feature
              icon={<MessageCircle className="h-6 w-6" />}
              title="Fragen statt suchen"
              text="„Was war mein letztes Cholesterin?" – ePA Agent antwortet in Sekunden, mit Quellenangabe. Ohne medizinische Bewertung – das bleibt deinem Arzt vorbehalten."
            />
            <Feature
              icon={<Activity className="h-6 w-6" />}
              title="Verlauf statt Bauchgefühl"
              text="Sieh, wie sich deine Werte über Jahre entwickeln. Filtere nach Arzt, Datum, Diagnose. Behalte den Überblick über deine eigene Gesundheit."
            />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-wide py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl">
          <TrustBlock
            icon={<Lock className="h-5 w-5" />}
            title="Verschlüsselt — auch von uns"
            text="Deine Daten werden in der EU (Frankfurt) verschlüsselt gespeichert. Auch wir können sie nicht im Klartext lesen."
          />
          <TrustBlock
            icon={<Server className="h-5 w-5" />}
            title="DSGVO Art. 9"
            text="Wir verarbeiten deine Gesundheitsdaten nur mit deiner ausdrücklichen, jederzeit widerrufbaren Einwilligung."
          />
          <TrustBlock
            icon={<Shield className="h-5 w-5" />}
            title="Daten gehören dir"
            text="Du kannst alle deine Daten jederzeit als JSON exportieren oder dein Konto inkl. aller Daten löschen — innerhalb von 14 Tagen umkehrbar."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-medical-500">
        <div className="container-wide py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Deine Krankengeschichte. Endlich übersichtlich.
          </h2>
          <p className="text-medical-100 mb-8 max-w-xl mx-auto">
            Starte mit 5 kostenlosen Dokumenten. Pro-Tarif ab 9,99 €/Monat.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary">Jetzt kostenlos starten</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container-wide flex flex-col md:flex-row justify-between gap-4 text-sm text-ink-muted">
          <div>
            © {new Date().getFullYear()} Make Happen GmbH · Schulweg 22, 20259 Hamburg
          </div>
          <div className="flex gap-6">
            <Link href="/impressum" className="hover:text-ink">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-ink">Datenschutz</Link>
            <Link href="/agb" className="hover:text-ink">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div>
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-medical-500 text-white mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
      <p className="text-ink-muted leading-relaxed">{text}</p>
    </div>
  );
}

function TrustBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-0.5 text-medical-500">{icon}</div>
      <div>
        <h4 className="font-semibold text-ink mb-1">{title}</h4>
        <p className="text-sm text-ink-muted">{text}</p>
      </div>
    </div>
  );
}
