# BelOma — Patient Calling Dashboard

A modern, healthcare-style dashboard for managing automated patient phone calls and medication adherence follow-up. Built as a prototype for stakeholder demonstration, with a clean architecture designed for real-world extension.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres (`@vercel/postgres`)
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd beloma-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your Vercel Postgres credentials:

```bash
cp .env.example .env.local
```

Required variables (get these from your Vercel Postgres database panel):

```
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
```

> **Tip**: If you're running on Vercel, link your project to a Vercel Postgres database and these variables will be injected automatically.

### 4. Initialize and seed the database

Start the dev server and then call the seed endpoint once:

```bash
npm run dev
```

In a separate terminal (or using curl/Postman):

```bash
curl -X POST http://localhost:3000/api/seed
```

This will:
- Create all tables (patients, adherence_records, call_records, alerts, notes)
- Insert 5 realistic Dutch demo patients
- Populate call history, adherence records, alerts, and AI summaries

### 5. Open the app

```
http://localhost:3000
```

---

## Features

| Page | Description |
|------|-------------|
| **Dashboard** | Summary cards (patients, calls today, alerts, avg adherence), patient table, activity feed |
| **Patients** | Searchable + filterable patient list (language, risk, alert status) |
| **Patient Detail** | Full profile, adherence chart, call history, alert timeline, AI notes, Start Call button |
| **Calls** | All call records across patients |
| **Activity** | Chronological activity feed |

### Start Call (Mock Workflow)

Clicking **"Gesprek starten"** on a patient's detail page:
1. Calls `POST /api/calls` with the patient ID
2. Simulates a call with weighted-random outcomes (stable / needs review / urgent / no answer)
3. Inserts a new `call_record` into the database
4. Updates the patient's active alert
5. Saves an AI-generated mock summary as a note
6. Returns the result immediately to the UI

**The call logic is fully modular** — to integrate ElevenLabs + Twilio, replace the `simulateCall()` function in `app/api/calls/route.ts` with real API calls.

---

## Database Schema

```sql
patients         — Patient profile (name, phone, language, birth_year, risk_level)
adherence_records — Daily adherence scores per patient
call_records     — Call log (status, outcome, duration, summary, transcript)
alerts           — Patient alerts (green/yellow/red with reason)
notes            — Manual notes and AI summaries
```

See `schema.sql` for the full schema with constraints and indexes.

---

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add a **Vercel Postgres** database to your project (Storage tab)
4. The `POSTGRES_*` environment variables are injected automatically
5. Deploy — then call `/api/seed` once via `curl` or the Vercel dashboard

> ⚠️ **In production**, protect or remove the `/api/seed` endpoint after initial setup.

---

## Future Extensibility

The codebase is structured for easy extension:

| Feature | Where to add |
|---------|-------------|
| **Google Auth (NextAuth.js)** | Add `app/api/auth/[...nextauth]/route.ts` + `lib/auth.ts`; protect routes with middleware |
| **ElevenLabs voice agent** | Replace `simulateCall()` in `app/api/calls/route.ts` |
| **Twilio telephony** | Add Twilio SDK call in the same function; add `app/api/webhooks/twilio/route.ts` for callbacks |
| **Webhook endpoints** | `app/api/webhooks/` directory |
| **Multilingual UI** | Add `next-intl` or `i18next`; `nl` / `en` messages in `/messages/` |
| **Downloadable reports** | Add `app/api/reports/route.ts` using `pdf-lib` or `puppeteer` |
| **Role-based access** | Extend NextAuth session with roles; add middleware guards |

---

## Project Structure

```
beloma-dashboard/
├── app/
│   ├── layout.tsx              # Root layout (sidebar)
│   ├── page.tsx                # Dashboard
│   ├── patients/page.tsx       # Patient list
│   ├── patients/[id]/page.tsx  # Patient detail
│   ├── calls/page.tsx          # Calls overview
│   ├── activity/page.tsx       # Activity feed
│   └── api/
│       ├── seed/route.ts       # DB init + seed
│       ├── dashboard/route.ts  # Dashboard stats
│       ├── patients/route.ts   # Patient list
│       ├── patients/[id]/route.ts  # Patient detail
│       └── calls/route.ts      # Start call (mock)
├── components/
│   ├── layout/Sidebar.tsx
│   ├── ui/ (Badge, StatCard, LoadingSpinner)
│   └── charts/AdherenceChart.tsx
├── lib/
│   ├── types.ts    # TypeScript interfaces
│   ├── db.ts       # Postgres client
│   └── utils.ts    # Utilities + color helpers
├── schema.sql      # Full DB schema
└── .env.example    # Environment variable template
```

---

## Demo Data

Five realistic Dutch patients are seeded:

| Name | Risk | Language | Adherence trend |
|------|------|----------|-----------------|
| Maria van den Berg | 🔴 High | NL | Declining → urgent alert |
| Jan de Vries | 🟡 Medium | NL | Stable → green |
| Fatima El Amrani | 🔴 High | AR | Critical, unreachable |
| Pieter Bakker | 🟢 Low | NL | Excellent adherence |
| Layla Yilmaz | 🟡 Medium | TR | Fluctuating, improving |

---

*Built with ❤️ for healthcare professionals — Demo only, not for clinical use.*
