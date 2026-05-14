import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Datenschutzerklärung — ePA Agent' };

export default function DatenschutzPage() {
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
        <h1>Datenschutzerklärung</h1>
        <p className="text-sm text-ink-muted">Stand: 1. Mai 2026 · Version 2026-05-01</p>

        <h2>1. Verantwortlicher</h2>
        <p>
          <strong>Make Happen GmbH</strong>
          <br />
          Schulweg 22, 20259 Hamburg
          <br />
          E-Mail: <a href="mailto:datenschutz@epa-agent.de">datenschutz@epa-agent.de</a>
        </p>

        <h2>2. Datenschutzbeauftragter</h2>
        <p>
          Wir haben einen externen Datenschutzbeauftragten bestellt. Du erreichst ihn unter:{' '}
          <a href="mailto:datenschutz@epa-agent.de">datenschutz@epa-agent.de</a>.
        </p>

        <h2>3. Welche Daten verarbeiten wir?</h2>
        <p>
          ePA Agent verarbeitet besondere Kategorien personenbezogener Daten i.S.d. Art. 9 DSGVO,
          insbesondere <strong>Gesundheitsdaten</strong>:
        </p>
        <ul>
          <li>Hochgeladene medizinische Dokumente (Arztbriefe, Laborbefunde, Rezepte, etc.)</li>
          <li>Aus diesen Dokumenten extrahierte Daten (Diagnosen, Medikamente, Laborwerte)</li>
          <li>Konversationen mit dem KI-Assistenten</li>
          <li>Stammdaten (E-Mail, Geburtsdatum sofern angegeben)</li>
          <li>Abrechnungsdaten (über Stripe)</li>
          <li>Technische Logs und Audit-Daten</li>
        </ul>

        <h2>4. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung von Gesundheitsdaten erfolgt ausschließlich auf Grundlage deiner
          ausdrücklichen Einwilligung gemäß <strong>Art. 9 (2) (a) DSGVO</strong>. Diese Einwilligung
          kannst du jederzeit unter „Profil" mit Wirkung für die Zukunft widerrufen.
        </p>
        <p>
          Abrechnungsdaten verarbeiten wir auf Grundlage von Art. 6 (1) (b) DSGVO (Vertragserfüllung)
          und § 257 HGB / § 147 AO (gesetzliche Aufbewahrungspflicht).
        </p>

        <h2>5. Übermittlung in Drittländer</h2>
        <p>
          Zur strukturierten Verarbeitung der Dokumente übermitteln wir Inhalte an{' '}
          <strong>Anthropic, PBC (USA)</strong>, Anbieter des Sprachmodells „Claude". Direkte
          Identifikatoren (Name, Adresse, Versichertennummer) werden vor der Übermittlung
          pseudonymisiert.
        </p>
        <p>
          Die Übermittlung erfolgt auf Grundlage von <strong>Standardvertragsklauseln (SCCs)</strong>{' '}
          gemäß Durchführungsbeschluss (EU) 2021/914 sowie unter <strong>Zero Data Retention (ZDR)</strong>{' '}
          — Anthropic speichert die übermittelten Inhalte nicht über die Verarbeitungsdauer hinaus.
        </p>
        <p>
          Eine Übermittlung erfolgt nur, wenn du dieser ausdrücklich zugestimmt hast.
        </p>

        <h2>6. Wo werden meine Daten gespeichert?</h2>
        <p>
          Alle persistenten Daten werden in der Europäischen Union (Frankfurt am Main, Deutschland)
          gespeichert. Wir nutzen folgende Auftragsverarbeiter:
        </p>
        <ul>
          <li>
            <strong>Supabase Inc.</strong> — Datenbank und Datei-Storage (EU Frankfurt-Region).
            AVV abgeschlossen.
          </li>
          <li>
            <strong>Vercel Inc.</strong> — Hosting (EU Frankfurt-Region erzwungen). AVV abgeschlossen.
          </li>
          <li>
            <strong>Microsoft (Azure)</strong> — Document Intelligence für tabellarische Befunde
            (EU West Europe). AVV abgeschlossen.
          </li>
          <li>
            <strong>Anthropic, PBC</strong> — KI-Verarbeitung (USA, mit SCCs und ZDR).
          </li>
          <li>
            <strong>Stripe Inc.</strong> — Zahlungsabwicklung. AVV abgeschlossen.
          </li>
          <li>
            <strong>Resend Inc.</strong> — transaktionale E-Mails. AVV abgeschlossen.
          </li>
        </ul>

        <h2>7. Speicherdauer</h2>
        <table>
          <thead>
            <tr>
              <th>Datentyp</th>
              <th>Speicherdauer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hochgeladene Dokumente</td>
              <td>Bis zur Löschung durch dich</td>
            </tr>
            <tr>
              <td>Geparste Daten</td>
              <td>Wie Dokumente (gekoppelt)</td>
            </tr>
            <tr>
              <td>Chat-Konversationen</td>
              <td>90 Tage (automatische Löschung)</td>
            </tr>
            <tr>
              <td>Abrechnungsdaten</td>
              <td>10 Jahre (§ 257 HGB, § 147 AO)</td>
            </tr>
            <tr>
              <td>Audit-Logs</td>
              <td>1 Jahr</td>
            </tr>
            <tr>
              <td>Anthropic API-Logs</td>
              <td>0 Tage (mit Zero Data Retention)</td>
            </tr>
          </tbody>
        </table>

        <h2>8. Deine Rechte</h2>
        <p>Dir stehen folgende Rechte zu:</p>
        <ul>
          <li>
            <strong>Auskunftsrecht</strong> (Art. 15 DSGVO) — kontaktiere uns oder nutze den
            Daten-Export.
          </li>
          <li>
            <strong>Recht auf Berichtigung</strong> (Art. 16 DSGVO).
          </li>
          <li>
            <strong>Recht auf Löschung</strong> (Art. 17 DSGVO) — du kannst dein Konto und alle Daten
            jederzeit unter „Profil" löschen. Es gilt eine Wartefrist von 14 Tagen, in der du den
            Vorgang abbrechen kannst.
          </li>
          <li>
            <strong>Recht auf Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO).
          </li>
          <li>
            <strong>Recht auf Datenübertragbarkeit</strong> (Art. 20 DSGVO) — JSON-Export aller
            Daten unter „Profil".
          </li>
          <li>
            <strong>Widerspruchsrecht</strong> (Art. 21 DSGVO).
          </li>
          <li>
            <strong>Recht auf Widerruf der Einwilligung</strong> (Art. 7 (3) DSGVO) — jederzeit
            unter „Profil".
          </li>
          <li>
            <strong>Beschwerderecht</strong> bei einer Aufsichtsbehörde, z.B. dem Hamburgischen
            Beauftragten für Datenschutz und Informationsfreiheit (HmbBfDI).
          </li>
        </ul>

        <h2>9. Sicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Maßnahmen (TOMs) ein, darunter:
        </p>
        <ul>
          <li>Verschlüsselung in Transit (TLS 1.3) und at Rest (AES-256)</li>
          <li>Spalten-Verschlüsselung (pgsodium) für sensible Felder</li>
          <li>Strenges Row-Level-Security-Modell (RLS) pro Nutzer</li>
          <li>Signed URLs mit kurzer Gültigkeit (5 Minuten) für Datei-Zugriff</li>
          <li>Pseudonymisierung vor Übermittlung an externe KI-Dienste</li>
          <li>Regelmäßige Sicherheits-Reviews und Penetrationstests</li>
        </ul>

        <h2>10. Cookies</h2>
        <p>
          Wir nutzen ausschließlich technisch notwendige Cookies (Session-Authentifizierung).
          Es kommen keine Tracking- oder Marketing-Cookies zum Einsatz.
        </p>

        <h2>11. Kein Medizinprodukt</h2>
        <p>
          ePA Agent ist <strong>kein Medizinprodukt</strong> i.S.d. MDR. Der Dienst gibt keine
          Diagnosen, Therapieempfehlungen oder klinische Bewertungen ab. Er dient ausschließlich
          der Organisation und Anzeige der von dir hochgeladenen Dokumente und ersetzt kein
          Arztgespräch.
        </p>

        <h2>12. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Bei Änderungen wirst du per E-Mail informiert und musst der neuen Fassung erneut
          zustimmen, sofern es um wesentliche Änderungen der Datenverarbeitung geht.
        </p>

        <h2>13. Kontakt</h2>
        <p>
          Bei allen Fragen zum Datenschutz erreichst du uns unter{' '}
          <a href="mailto:datenschutz@epa-agent.de">datenschutz@epa-agent.de</a>.
        </p>
      </main>
    </div>
  );
}
