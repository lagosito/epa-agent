# ePA Agent — MVP

> Deine Krankenakte, intelligent organisiert.
>
> 74 Millionen Deutsche haben eine ePA. ePA Agent hilft ihnen, sie zu verstehen.

Stack: **Next.js 14** · **Supabase** (EU Frankfurt) · **Claude API** (Anthropic) · **Azure Document Intelligence** · **Stripe** · **Recharts**

---

## Inhaltsverzeichnis

1. [Architektur](#architektur)
2. [Lokales Setup](#lokales-setup)
3. [Supabase einrichten](#supabase-einrichten)
4. [Claude API einrichten](#claude-api-einrichten)
5. [Stripe einrichten](#stripe-einrichten)
6. [Azure Document Intelligence einrichten](#azure-document-intelligence-einrichten)
7. [Tests ausführen](#tests-ausführen)
8. [Deployment](#deployment)
9. [DSGVO-Compliance](#dsgvo-compliance)
10. [Verzeichnisstruktur](#verzeichnisstruktur)

---

## Architektur

```
Browser
   │
   ▼
Next.js 14 (App Router) ──────► Supabase (EU Frankfurt)
   │                                  │
   │                                  ├─ Postgres (RLS aktiv auf jeder Tabelle)
   │                                  ├─ Storage (medical-documents bucket)
   │                                  └─ pg_cron (Retention + Auto-Delete)
   │
   ├─► Anthropic API (Claude Opus 4.7 für Parsing, Sonnet 4.6 für Chat)
   │      mit ZDR-Addendum + Pseudonymisierung
   │
   ├─► Azure Document Intelligence (EU West Europe) — Tier 2 Laborwerte
   │
   └─► Stripe (Checkout + Webhook + Billing Portal)
```

### PDF Parser Pipeline

```
Upload → Storage → SHA-256 Dedup → Document Type Detection
   │
   ├─ Tier 1: Claude Vision direkt
   │     · Arztbrief, Befund, Rezept, Überweisung, Impfpass
   │
   └─ Tier 2: Azure DI + Claude
         · Laborwerte (Tabellen-Layout)

Parsed JSON → Schema-Validierung (Zod) → Materializer
   │
   ▼
medical_events + lab_results / medications / diagnoses / vaccinations
```

---

## Lokales Setup

### Voraussetzungen

- Node.js 20+
- pnpm (oder npm/yarn)
- Docker (für Supabase lokal)
- Supabase CLI: `npm i -g supabase`

### Schritte

```bash
# 1. Dependencies installieren
pnpm install

# 2. .env.local anlegen (aus .env.example kopieren und ausfüllen)
cp .env.example .env.local

# 3. Supabase lokal starten
supabase start

# 4. Migrationen anwenden
supabase db reset

# 5. Storage-Bucket anlegen (siehe Supabase einrichten)

# 6. Dev-Server starten
pnpm dev
```

App läuft auf [http://localhost:3000](http://localhost:3000).

---

## Supabase einrichten

### Projektregion

⚠️ **Wichtig:** Bei Supabase Cloud unbedingt **EU Frankfurt (eu-central-1)**
auswählen. Andere Regionen sind aus DSGVO-Gründen nicht zulässig.

### Migrationen

Alle Migrationen liegen in `supabase/migrations/`:

```
001_extensions_and_types.sql   # uuid-ossp, pgcrypto, pg_cron, vector, pgsodium
002_core_tables.sql            # profiles, documents, practitioners, medical_events, consent_log
003_medical_data.sql           # lab_results, medications, diagnoses, vaccinations, chat
004_rls_policies.sql           # Row Level Security
005_cron_retention.sql         # 90-Tage chat retention, 14-Tage Konto-Löschung
006_helper_functions.sql       # Views + RPC functions for chatbot tools
```

Anwenden mit:

```bash
supabase db push   # gegen Cloud-Projekt
# ODER
supabase db reset  # lokal — wirft die DB weg und re-migriert
```

### Storage-Bucket erstellen

⚠️ **Manuell anlegen** — die Migrationen können den Bucket nicht erstellen:

```sql
insert into storage.buckets (id, name, public)
values ('medical-documents', 'medical-documents', false);
```

Oder im Supabase-Dashboard: **Storage → New bucket → "medical-documents"**, public: **false**.

### Environment-Variablen

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Claude API einrichten

```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_PARSER=claude-opus-4-7
ANTHROPIC_MODEL_CHAT=claude-sonnet-4-6
ANTHROPIC_ZDR_ENABLED=true   # erst auf true setzen, wenn Addendum unterschrieben
```

| Modell | Verwendung |
|---|---|
| Claude Opus 4.7 | Document Parsing |
| Claude Sonnet 4.6 | Chatbot |

---

## DSGVO-Compliance

### Erforderliche Dokumente

- ✅ Datenschutzerklärung — `app/datenschutz/page.tsx`
- ✅ AGB — `app/agb/page.tsx`
- ✅ Impressum — `app/impressum/page.tsx`
- 📋 AVV-Checkliste — `docs/AVV-checklist.md`
- 📋 DSFA — `docs/DSFA-template.md`

### Nutzerrechte (alle implementiert)

| Recht | Endpunkt |
|---|---|
| Auskunft (Art. 15) | `/api/data/export` |
| Löschung (Art. 17) | `/api/account/delete` (14d grace) |
| Datenübertragbarkeit (Art. 20) | `/api/data/export` |
| Widerruf der Einwilligung | `/profile` (granular) |

---

## Lizenz

Proprietär · Make Happen GmbH · 2026.

## Kontakt

- Produktfragen: hello@epa-agent.de
- Datenschutz: datenschutz@epa-agent.de
