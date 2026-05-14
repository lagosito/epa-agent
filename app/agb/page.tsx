import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'AGB — ePA Agent' };

export default function AgbPage() {
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
        <h1>Allgemeine Geschäftsbedingungen</h1>
        <p className="text-sm text-ink-muted">Stand: 1. Mai 2026</p>

        <h2>§ 1 Geltungsbereich</h2>
        <p>
          Diese AGB regeln die Nutzung des Online-Dienstes „ePA Agent" der Make Happen GmbH
          (im Folgenden „Anbieter") durch Verbraucher (im Folgenden „Nutzer").
        </p>

        <h2>§ 2 Vertragsgegenstand</h2>
        <p>
          Der Anbieter stellt eine Software zur Verfügung, mit der Nutzer eigene medizinische
          Dokumente hochladen, automatisiert auswerten und chronologisch organisieren können.
          ePA Agent ist <strong>kein Medizinprodukt</strong> und ersetzt keine ärztliche Beratung.
        </p>

        <h2>§ 3 Vertragsschluss</h2>
        <p>
          Der Nutzungsvertrag kommt durch Registrierung mit gültiger E-Mail-Adresse und Bestätigung
          der erforderlichen Einwilligungen zustande. Die Nutzung des kostenpflichtigen Pro-Tarifs
          erfordert zusätzlich einen Vertragsabschluss über Stripe.
        </p>

        <h2>§ 4 Tarife und Preise</h2>
        <ul>
          <li>
            <strong>Free-Tarif:</strong> kostenlos, beschränkt auf 5 Dokumente und 10 Chat-Nachrichten/Tag
          </li>
          <li>
            <strong>Pro monatlich:</strong> 9,99 € pro Monat (inkl. MwSt.)
          </li>
          <li>
            <strong>Pro jährlich:</strong> 89,00 € pro Jahr (inkl. MwSt.)
          </li>
        </ul>
        <p>
          Die Abrechnung erfolgt über Stripe. Preisänderungen werden mindestens 30 Tage im Voraus
          per E-Mail angekündigt.
        </p>

        <h2>§ 5 Widerrufsrecht</h2>
        <p>
          Du hast das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
          Die Widerrufsfrist beginnt mit Vertragsschluss. Um dein Widerrufsrecht auszuüben, musst
          du uns mittels einer eindeutigen Erklärung (z.B. per E-Mail an{' '}
          <a href="mailto:hello@epa-agent.de">hello@epa-agent.de</a>) über deinen Entschluss
          informieren.
        </p>

        <h2>§ 6 Kündigung</h2>
        <p>
          Du kannst dein Abonnement jederzeit zum Ende des laufenden Abrechnungszeitraums über das
          Profil kündigen. Bereits gezahlte Beträge werden nicht anteilig erstattet, außer die
          Kündigung erfolgt gemäß § 5 oder bei Vertragsverletzung durch den Anbieter.
        </p>

        <h2>§ 7 Haftung</h2>
        <p>
          Der Anbieter haftet uneingeschränkt bei Vorsatz und grober Fahrlässigkeit. Bei einfacher
          Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten und
          begrenzt auf den vorhersehbaren, vertragstypischen Schaden.
        </p>
        <p>
          <strong>Wichtig:</strong> ePA Agent gibt keine Diagnosen, Therapieempfehlungen oder klinische
          Bewertungen ab. Eine Haftung für medizinische Folgen aus der Interpretation der angezeigten
          Daten ist ausgeschlossen. Konsultiere bei gesundheitlichen Fragen immer einen Arzt.
        </p>

        <h2>§ 8 Datenschutz</h2>
        <p>
          Es gilt unsere <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>

        <h2>§ 9 Schlussbestimmungen</h2>
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
          Gerichtsstand ist Hamburg, sofern der Nutzer Kaufmann, juristische Person des öffentlichen
          Rechts oder öffentlich-rechtliches Sondervermögen ist.
        </p>
      </main>
    </div>
  );
}
