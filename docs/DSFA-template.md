# Datenschutz-Folgenabschätzung (DSFA) — Vorlage

ePA Agent verarbeitet Gesundheitsdaten (Art. 9 DSGVO) im großen Maßstab und
nutzt automatisierte Verarbeitung mit Drittland-Transfer. Eine DSFA gemäß
**Art. 35 DSGVO** ist daher zwingend erforderlich.

## 1. Beschreibung der Verarbeitungsvorgänge

**Verantwortlicher:** Make Happen GmbH, Schulweg 22, 20259 Hamburg
**Datenschutzbeauftragter:** [Name + Kontakt]
**Beginn der Verarbeitung:** [Datum]

### Zweck
Endnutzer laden eigene medizinische Dokumente (PDF) hoch. Die Software
extrahiert strukturierte Daten (Diagnosen, Medikamente, Laborwerte),
ordnet sie chronologisch an und ermöglicht eine Konversation über die
eigenen Befunde.

### Art der Daten
- Hochgeladene PDFs (Arztbriefe, Laborbefunde, Rezepte, Bildgebung, Impfausweise)
- Extrahierte strukturierte Daten (ICD-10, ATC, LOINC, Werte, Datumsangaben)
- Stammdaten (E-Mail, Geburtsdatum optional)
- Konversationsverläufe mit dem KI-Assistenten
- Audit-Logs (Zugriffsereignisse, Einwilligungen)

### Kategorien Betroffener
Erwachsene Patienten in Deutschland, die freiwillig Dokumente hochladen.
Keine automatische Verarbeitung von Daten Minderjähriger ohne separaten Prozess.

## 2. Notwendigkeit und Verhältnismäßigkeit

- **Rechtsgrundlage:** Art. 9 (2) (a) DSGVO (ausdrückliche Einwilligung)
- **Datenminimierung:** Nur Felder werden extrahiert, die der Zweckerreichung dienen
- **Speicherbegrenzung:** Chats 90 Tage; Audit 1 Jahr; Dokumente bis Nutzerlöschung
- **Zweckbindung:** Daten werden nicht für andere Zwecke (z.B. Werbung) verwendet
- **Transparenz:** Datenschutzerklärung in einfacher Sprache; Einwilligungen granular

## 3. Risikobewertung

### Identifizierte Risiken

| Risiko | Wahrscheinlichkeit | Schwere | Risiko-Niveau |
|---|---|---|---|
| Unbefugter Zugriff auf Klartext-Daten | gering | hoch | mittel |
| Cross-User-Datenleck (RLS-Fehler) | gering | sehr hoch | hoch |
| Drittland-Transfer (USA) — Behördenzugriff | mittel | mittel | mittel |
| Fehlinterpretation durch Nutzer (kein Arzt) | mittel | mittel | mittel |
| Halluzination der KI | niedrig (mit Tool-Calling) | hoch | mittel |
| Datenverlust durch Provider-Ausfall | niedrig | mittel | niedrig |
| Re-Identifizierung trotz Pseudonymisierung | niedrig | hoch | mittel |

## 4. Geplante Abhilfemaßnahmen

### Technische Maßnahmen
- TLS 1.3 für alle Verbindungen
- AES-256 at-rest in Supabase
- pgsodium-Spaltenverschlüsselung für sensible Felder
- Strenge RLS-Policies pro Nutzer (siehe `004_rls_policies.sql`)
- Signed URLs mit TTL 5 Minuten für Datei-Zugriff
- Pseudonymisierung vor KI-Übermittlung (`lib/claude/pseudonymize.ts`)
- Zero Data Retention bei Anthropic
- EU-Region-Pinning bei allen Hauptdienstleistern

### Organisatorische Maßnahmen
- Datenschutzbeauftragter benannt
- Mitarbeiterschulung zum Datenschutz
- Vorfallreaktionsplan (siehe separates Dokument)
- Quartalsweise Audit der RLS-Policies
- Halbjährliche Überprüfung der Sub-Auftragsverarbeiter
- 14-Tage-Wartezeit vor endgültiger Kontolöschung

### Prozessuale Maßnahmen
- Kein Konto-Anlegen ohne ausdrückliche Einwilligung
- Granulare Einwilligungen (Speicherung, KI-Verarbeitung getrennt)
- Klares Disclaimer im Chatbot (kein Ersatz für Arztgespräch)
- Quellenpflicht in Antworten — keine "freien" Aussagen
- Datenexport jederzeit über UI verfügbar

## 5. Konsultation der Aufsichtsbehörde

Wenn nach Umsetzung der Abhilfemaßnahmen ein **hohes Risiko** verbleibt,
ist eine Konsultation mit dem Hamburgischen Beauftragten für Datenschutz
und Informationsfreiheit (HmbBfDI) gemäß Art. 36 DSGVO erforderlich.

**Zwischenstand:** [auszufüllen nach interner Bewertung]

## 6. Genehmigung

| Rolle | Name | Datum | Unterschrift |
|---|---|---|---|
| Geschäftsführer | Gabriel Lagos | | |
| Datenschutzbeauftragter | | | |

## 7. Überprüfungsplan

Diese DSFA ist mindestens **jährlich** oder bei wesentlichen Änderungen
der Verarbeitung zu überprüfen. Auslöser für eine Neubewertung:
- Neue Sub-Auftragsverarbeiter
- Wechsel zu neuen KI-Modellen
- Erweiterung um neue Datentypen (z.B. Genom-Daten, Wearable-Daten)
- Änderungen der Rechtslage (DSGVO, ePrivacy)
