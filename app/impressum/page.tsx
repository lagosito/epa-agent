import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Impressum — ePA Agent' };

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="container-narrow flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2 text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>
      </header>

      <main className="container-narrow py-12 prose prose-slate max-w-none">
        <h1>Impressum</h1>

        <p>Angaben gemäß § 5 TMG:</p>

        <p>
          <strong>Make Happen GmbH</strong>
          <br />
          Schulweg 22
          <br />
          20259 Hamburg
          <br />
          Deutschland
        </p>

        <h2>Vertretungsberechtigte</h2>
        <p>Gabriel Lagos (Geschäftsführer)</p>

        <h2>Kontakt</h2>
        <p>
          E-Mail:{' '}
          <a href="mailto:hello@epa-agent.de">hello@epa-agent.de</a>
        </p>

        <h2>Registereintrag</h2>
        <p>
          Eintragung im Handelsregister.
          <br />
          Registergericht: Amtsgericht Hamburg
          <br />
          Registernummer: HRB 136558
        </p>

        <h2>Umsatzsteuer-ID</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: [auf Anfrage]
        </p>

        <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>
          Gabriel Lagos
          <br />
          Schulweg 22, 20259 Hamburg
        </p>

        <h2>Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
            https://ec.europa.eu/consumers/odr/
          </a>
          .
        </p>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </main>
    </div>
  );
}
