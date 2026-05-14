# AVV-Checkliste (Auftragsverarbeitungsverträge)

Stand: 1. Mai 2026 · Verantwortlich: Make Happen GmbH

Diese Checkliste dokumentiert alle Sub-Auftragsverarbeiter, die im Rahmen
von ePA Agent Gesundheitsdaten verarbeiten. Für jeden Anbieter ist ein
Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO abzuschließen,
**bevor** Produktivdaten verarbeitet werden.

## Status-Übersicht

| Anbieter | Zweck | Region | AVV-Status | Drittland-Transfer |
|---|---|---|---|---|
| Supabase Inc. | DB + Storage | EU Frankfurt | ⏳ vor Go-Live abschließen | Nein (EU-Region erzwungen) |
| Vercel Inc. | Hosting | EU Frankfurt (fra1) | ⏳ vor Go-Live abschließen | Nein (Region pinning) |
| Anthropic, PBC | KI (Claude API) | USA | ⏳ + ZDR-Addendum erforderlich | **Ja** — SCCs + ZDR |
| Microsoft Ireland | Azure Document Intelligence | EU West Europe | ⏳ vor Go-Live abschließen | Nein |
| Stripe Payments Europe | Zahlungsabwicklung | EU (Irland) | ⏳ vor Go-Live abschließen | EU-intern |
| Resend Inc. | Transaktions-Mails | EU-Region wählen | ⏳ vor Go-Live abschließen | EU-intern (bei EU-Region) |

Legende: ✅ unterzeichnet · ⏳ ausstehend · ❌ nicht abgeschlossen

## Pflicht-Anforderungen je AVV

Jeder AVV muss enthalten:

- Gegenstand und Dauer der Verarbeitung
- Art und Zweck der Verarbeitung
- Art der personenbezogenen Daten (hier: Gesundheitsdaten Art. 9 DSGVO)
- Kategorien betroffener Personen (Patienten/Endnutzer)
- Pflichten und Rechte des Verantwortlichen
- Weisungsgebundenheit des Auftragsverarbeiters
- Vertraulichkeitsverpflichtung der Mitarbeitenden
- Technische und organisatorische Maßnahmen (TOMs) — Art. 32
- Unterauftragsverhältnisse — Genehmigung erforderlich
- Unterstützung bei Betroffenenrechten (Art. 12–22)
- Unterstützung bei Meldepflichten (Art. 33, 34)
- Löschung/Rückgabe nach Vertragsende
- Nachweispflicht / Audit-Recht des Verantwortlichen

## Anthropic — besondere Anforderungen

Wegen USA-Transfer zwingend erforderlich:

1. **Standardvertragsklauseln (SCCs)** — Modul 2 (Verantwortlicher → Auftragsverarbeiter)
2. **Zero Data Retention Addendum** — keine Speicherung über Verarbeitungszeit hinaus
3. **Transfer Impact Assessment (TIA)** — dokumentieren in DSFA
4. **Pseudonymisierung** vor Übermittlung — siehe `lib/claude/pseudonymize.ts`
5. **Einwilligung des Nutzers** — separat, granular, dokumentiert

## Aufbewahrung der AVVs

- Original-PDFs in passwortgeschütztem Unternehmens-Drive
- Auflistung dieser Liste regelmäßig prüfen (mindestens halbjährlich)
- Bei Anbieterwechsel: alte AVV mindestens 3 Jahre aufbewahren

## Vor jedem Go-Live: prüfen

- [ ] Alle ⏳ in der Status-Tabelle auf ✅ gesetzt
- [ ] Datenschutzerklärung listet alle Anbieter
- [ ] DSFA (siehe `DSFA-template.md`) erstellt und intern freigegeben
- [ ] DPO informiert und Freigabe erteilt
- [ ] Nutzer-Einwilligungen frisch eingeholt (Policy-Version aktualisiert)
