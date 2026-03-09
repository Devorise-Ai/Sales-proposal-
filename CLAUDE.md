# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sales Pricing Matrix** — an internal SaaS tool for Devorise AI's sales team. Sales architects configure AI transformation proposals by selecting industry-specific modules, infrastructure options, and add-ons, then generate a branded 6-page PDF proposal in one click.

**Current state:** Transitioning from MVP (static SPA) to full-stack (React + Express + PostgreSQL). The MVP frontend files exist at the repo root. Database schema and seed data are in place. Backend/frontend application code is being built per `IMPLEMENTATION_PLAN.md`.

## Running Locally

### MVP (current working frontend)

```bash
npx -y http-server . -p 5000 --cors -c-1
# Open http://localhost:5000
```

No build step, no package.json for the MVP.

### Full-Stack Development (in progress)

```bash
docker-compose up db                # PostgreSQL on :5432 (user: devorise, pass: devorise123, db: devorise)
cd backend && npm run dev           # Express on :3000
cd frontend && npm run dev          # Vite on :5173
```

Migrations run automatically when the `db` container starts (mounted from `backend/src/db/migrations/`).

### Production

```bash
docker-compose up --build           # All 3 services (db, backend, frontend)
```

## Architecture

### MVP Files (repo root)

```
index.html          → Main UI (layout, forms, sticky sidebar)
style.css           → All styling (CSS custom properties for design system)
pricing.js          → PRICING_CONFIG + GLOBAL_PHASES (data layer)
app.js              → SalesOS class (state management, DOM, events)
pdf-generator.js    → ProposalGenerator class (6-page jsPDF builder)
brand-assets.js     → Base64-encoded logos/images for PDF embedding
```

### Full-Stack Layout (being built)

```
backend/src/
  index.ts              → Express entry point
  config/               → database.ts, env.ts, cors.ts
  middleware/            → auth.ts (JWT), validate.ts (Zod), errorHandler.ts
  routes/               → auth, user, industry, proposal, config routes
  controllers/          → Request handlers
  services/             → auth.service.ts, pricing.service.ts, proposal.service.ts
  db/migrations/        → 001_users, 002_industries_modules, 003_proposals, 004_seed_pricing

frontend/src/
  pages/                → Landing, Login, Register, Dashboard, ProposalBuilder, History, View, Profile
  components/builder/   → ClientInfoCard, IndustryGrid, ModuleList, QuoteSidebar, etc.
  hooks/                → useAuth, usePricingConfig, useProposalBuilder
  lib/                  → pricing.ts, pdf-generator.ts
```

### Separation of Concerns

- **Pricing data** → `pricing.js` (MVP) or database `industries`/`modules`/`pricing_config` tables (full-stack)
- **UI/layout** → `index.html` + `style.css` (MVP) or React components (full-stack)
- **Business logic** → `app.js` SalesOS class (MVP) or `useProposalBuilder` hook (full-stack)
- **PDF output** → `pdf-generator.js` / `pdf-generator.ts` — client-side jsPDF in both versions

## Calculation Logic

```
totalSetup   = SUM(selectedModules.setup)
             + (infrastructureType === 'system_creation' ? 5000 : 0)
totalMonthly = SUM(selectedModules.monthly)
             + (bulkMessaging ? 100 : 0)
totalYearly  = totalSetup + (totalMonthly × 12)
impactScore  = MIN(95, SUM(selectedModules.efficiency))

If currency == 'USD':  amount × 1.41
If tax enabled:        amount × 1.16
```

Frontend calculates in real-time for UI. Backend recalculates authoritatively on save (source of truth).

## Database

PostgreSQL 16 with 4 migration files auto-applied via Docker entrypoint:

- **`001_users.sql`** — UUID PKs, email/password_hash, role defaults to `sales_architect`
- **`002_industries_modules.sql`** — `industries`, `modules`, `pricing_config` (key-value for exchange rate, tax, fees)
- **`003_proposals.sql`** — `proposals` + `proposal_modules` (snapshots prices at save time)
- **`004_seed_pricing.sql`** — 8 industries, 5 modules each (40 modules total), 4 pricing config values

Key relationship: `proposals M──M modules` through `proposal_modules` with price snapshots, so catalog changes don't alter saved proposals.

## Design System

| Token | Value |
|-------|-------|
| Background | `#0F1014` (`--devorise-navy`) |
| Card surfaces | `#1A1B21` (`--devorise-card`) with `rgba(255,255,255,0.08)` border |
| Accent | `#007C8A` (`--devorise-teal`) |
| Border radius | Cards 16px, Inputs 12px, Pills 20px |
| Layout | CSS Grid, 2-column (form left + sticky sidebar right) |
| Animations | fadeInUp, `cubic-bezier(0.16, 1, 0.3, 1)` |

## Adding a New Industry

**MVP:** Add a key to `PRICING_CONFIG.industries` in `pricing.js` — UI renders dynamically.

**Full-stack:** Insert into `industries` and `modules` tables (or add to `004_seed_pricing.sql` for fresh deploys).

## API Routes (full-stack)

- **Auth (public):** `POST /api/auth/register`, `/login`, `/refresh`
- **Config (public):** `GET /api/config` → exchange rates, tax, fees
- **Industries (auth):** `GET /api/industries`, `/api/industries/:id`
- **Proposals (auth):** CRUD at `/api/proposals`, plus `POST /api/proposals/calculate` for server-side validation
- **Users (auth):** `GET/PUT /api/users/me`

Reference numbers format: `DEV-YYYY-NNNN` (sequential per year).

## Auth Flow

JWT access tokens (15min) + refresh tokens (7 days). Passwords hashed with bcryptjs (12 rounds). Axios interceptor auto-refreshes on 401.

## Known MVP Limitations

- System Creation (+5000 JOD) not wired to pricing — fixed in full-stack
- Bulk Messaging (+100 JOD/mo) not wired to pricing — fixed in full-stack
- Channel pills visual only (stored but no pricing impact)
- No data persistence or authentication — fixed in full-stack

## Testing

No automated test suite. Manual testing:
- Open the app, verify no JS errors in console
- Select modules, verify sidebar pricing matches calculation logic
- Toggle USD (×1.41) and tax (×1.16), verify math
- Generate PDF, verify 6 pages with correct content

## Build Sequence

Full-stack is built in 8 ordered steps (see `IMPLEMENTATION_PLAN.md` for details):
1. Project scaffolding → 2. DB schema + seed → 3. Backend auth → 4. Backend API → 5. Frontend foundation → 6. Proposal Builder → 7. PDF + History → 8. Dashboard, Profile, Landing, Docker
