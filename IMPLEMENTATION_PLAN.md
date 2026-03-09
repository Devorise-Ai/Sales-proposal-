# Sales Pricing Matrix — Full-Stack Implementation Plan

> **Project:** Devorise AI Sales Pricing Matrix
> **Date:** March 9, 2026
> **Architecture:** Monorepo — React + Express + PostgreSQL
> **Reference:** SDLC Document v1.0

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema](#3-database-schema)
4. [Backend API](#4-backend-api)
5. [Frontend Pages & Components](#5-frontend-pages--components)
6. [Authentication Flow](#6-authentication-flow)
7. [Pricing Logic — From Hardcoded to Database-Driven](#7-pricing-logic--from-hardcoded-to-database-driven)
8. [PDF Generation](#8-pdf-generation)
9. [Deployment (Docker)](#9-deployment-docker)
10. [Build Sequence (8 Steps)](#10-build-sequence-8-steps)

---

## 1. Project Structure

Monorepo layout — backend and frontend live in a single repository.

```
sales-pricing-matrix/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── CLAUDE.md
├── IMPLEMENTATION_PLAN.md
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env
│   ├── Dockerfile
│   └── src/
│       ├── index.ts                    # Express entry point
│       ├── config/
│       │   ├── database.ts             # PostgreSQL connection (pg Pool)
│       │   ├── env.ts                  # Environment variable validation
│       │   └── cors.ts                 # CORS whitelist
│       ├── middleware/
│       │   ├── auth.ts                 # JWT verification middleware
│       │   ├── validate.ts             # Request body validation (Zod)
│       │   └── errorHandler.ts         # Global error handler
│       ├── routes/
│       │   ├── auth.routes.ts          # POST /api/auth/register, /login, /refresh
│       │   ├── user.routes.ts          # GET/PUT /api/users/me
│       │   ├── industry.routes.ts      # GET /api/industries, /api/industries/:id/modules
│       │   ├── proposal.routes.ts      # CRUD /api/proposals
│       │   └── config.routes.ts        # GET /api/config (exchange rates, tax, addons)
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── user.controller.ts
│       │   ├── industry.controller.ts
│       │   ├── proposal.controller.ts
│       │   └── config.controller.ts
│       ├── services/
│       │   ├── auth.service.ts         # bcrypt hashing, JWT sign/verify
│       │   ├── pricing.service.ts      # Server-side pricing calculation (validation)
│       │   └── proposal.service.ts     # Proposal CRUD + snapshot logic
│       ├── db/
│       │   ├── migrate.ts              # Migration runner
│       │   └── migrations/
│       │       ├── 001_users.sql
│       │       ├── 002_industries_modules.sql
│       │       ├── 003_proposals.sql
│       │       └── 004_seed_pricing.sql
│       └── types/
│           ├── index.ts                # Shared TypeScript interfaces
│           └── express.d.ts            # Express Request augmentation for user
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── Dockerfile
│   └── src/
│       ├── main.tsx                    # React entry point
│       ├── App.tsx                     # Router + AuthProvider wrapper
│       ├── api/
│       │   └── client.ts              # Axios instance with JWT interceptor
│       ├── context/
│       │   └── AuthContext.tsx         # React context for auth state
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── usePricingConfig.ts     # Fetches industries/modules from API
│       │   └── useProposalBuilder.ts   # Core pricing state machine
│       ├── pages/
│       │   ├── LandingPage.tsx
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx
│       │   ├── ProposalBuilderPage.tsx # The core pricing matrix UI
│       │   ├── ProposalHistoryPage.tsx
│       │   ├── ProposalViewPage.tsx    # Read-only view of saved proposal
│       │   └── ProfilePage.tsx
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── ProtectedRoute.tsx
│       │   ├── landing/
│       │   │   ├── Hero.tsx
│       │   │   ├── Features.tsx
│       │   │   └── PricingTiers.tsx
│       │   ├── builder/
│       │   │   ├── ClientInfoCard.tsx
│       │   │   ├── IndustryGrid.tsx
│       │   │   ├── ModuleList.tsx
│       │   │   ├── InfrastructureCard.tsx
│       │   │   ├── HostingAddonsCard.tsx
│       │   │   ├── QuoteSidebar.tsx    # Sticky pricing summary
│       │   │   └── CurrencyTaxControls.tsx
│       │   └── common/
│       │       ├── Button.tsx
│       │       ├── Card.tsx
│       │       ├── Toggle.tsx
│       │       ├── PillSelector.tsx
│       │       └── ImpactMeter.tsx
│       ├── lib/
│       │   ├── pricing.ts             # Client-side calculation logic
│       │   └── pdf-generator.ts       # ProposalGenerator class (jsPDF)
│       ├── assets/
│       │   ├── brand-assets.ts        # Base64 logos for PDF
│       │   └── logo.png
│       └── styles/
│           └── globals.css            # CSS custom properties, design system tokens
│
└── docs/
    └── sdlc.pdf
```

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | UI components, SPA |
| Bundler | Vite | Fast dev server, production builds |
| Routing | react-router-dom v6 | Client-side page routing |
| HTTP Client | Axios | API calls with JWT interceptor |
| Styling | Vanilla CSS3 | Dark glassmorphism theme |
| PDF | jspdf + jspdf-autotable | Client-side 6-page proposal PDF |
| Icons | Font Awesome 6 | UI icons |
| Fonts | Google Fonts (Inter) | Typography |
| Backend | Express 4 + TypeScript | REST API |
| Validation | Zod | Request body validation |
| Auth | bcryptjs + jsonwebtoken | Password hashing, JWT tokens |
| Database | PostgreSQL 16 | Data persistence |
| DB Driver | pg (node-postgres) | Raw SQL, parameterized queries |
| Dev Runner | tsx | TypeScript execution for development |
| Containers | Docker + Docker Compose | PostgreSQL in dev, full deployment |

---

## 3. Database Schema

### 3.1 `users`

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(50) NOT NULL DEFAULT 'sales_architect',
    company_name  VARCHAR(255),
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.2 `industries`

```sql
CREATE TABLE industries (
    id          VARCHAR(50) PRIMARY KEY,      -- e.g. 'ai_rnd', 'fintech'
    name        VARCHAR(255) NOT NULL,
    theme_color VARCHAR(7) NOT NULL,           -- hex e.g. '#007C8A'
    narrative   TEXT NOT NULL,
    roi         TEXT NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.3 `modules`

```sql
CREATE TABLE modules (
    id                VARCHAR(100) PRIMARY KEY, -- e.g. 'fintech_fraud_detection'
    industry_id       VARCHAR(50) NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT NOT NULL,
    setup_price_jod   NUMERIC(10,2) NOT NULL,   -- base price always in JOD
    monthly_price_jod NUMERIC(10,2) NOT NULL,
    efficiency        INT NOT NULL CHECK (efficiency BETWEEN 0 AND 100),
    sort_order        INT NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_modules_industry ON modules(industry_id);
```

### 3.4 `pricing_config`

Key-value table — makes pricing database-driven instead of hardcoded.

```sql
CREATE TABLE pricing_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       NUMERIC(10,4) NOT NULL,
    description VARCHAR(255),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed values:
-- ('exchange_rate_usd',      1.41,    'JOD to USD conversion rate')
-- ('tax_rate',               0.16,    'Tax multiplier (16%)')
-- ('system_creation_fee',    5000.00, 'System Creation one-time fee in JOD')
-- ('bulk_messaging_monthly', 100.00,  'Bulk Messaging add-on monthly in JOD')
```

### 3.5 `proposals`

```sql
CREATE TABLE proposals (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reference_number      VARCHAR(50) UNIQUE NOT NULL,  -- e.g. 'DEV-2026-0001'
    status                VARCHAR(20) NOT NULL DEFAULT 'draft',
                          -- draft | sent | accepted | expired

    -- Client info
    client_company        VARCHAR(255) NOT NULL,
    client_contact        VARCHAR(255),
    client_role           VARCHAR(255),
    client_narrative      TEXT,

    -- Configuration snapshot
    industry_id           VARCHAR(50) NOT NULL REFERENCES industries(id),
    currency              VARCHAR(3) NOT NULL DEFAULT 'JOD',
    is_tax_enabled        BOOLEAN NOT NULL DEFAULT false,
    infrastructure_type   VARCHAR(50),       -- 'integration_only' | 'system_creation'
    hosting_provider      VARCHAR(50),       -- 'devorise' | 'client_aws' | 'client_gcp'
    bulk_messaging        BOOLEAN NOT NULL DEFAULT false,
    channels              TEXT[],            -- e.g. '{whatsapp,website,social_media}'

    -- Calculated totals (in base JOD)
    total_setup_jod       NUMERIC(10,2) NOT NULL,
    total_monthly_jod     NUMERIC(10,2) NOT NULL,
    total_yearly_jod      NUMERIC(10,2) NOT NULL,
    impact_score          INT NOT NULL,

    -- Rate snapshot at creation time
    snapshot_exchange_rate NUMERIC(10,4),
    snapshot_tax_rate      NUMERIC(10,4),

    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_user ON proposals(user_id);
CREATE INDEX idx_proposals_status ON proposals(status);
```

### 3.6 `proposal_modules`

Snapshots module data at save time so catalog changes don't alter old proposals.

```sql
CREATE TABLE proposal_modules (
    proposal_id   UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    module_id     VARCHAR(100) NOT NULL,
    module_name   VARCHAR(255) NOT NULL,
    setup_price   NUMERIC(10,2) NOT NULL,
    monthly_price NUMERIC(10,2) NOT NULL,
    efficiency    INT NOT NULL,
    PRIMARY KEY (proposal_id, module_id)
);
```

### Entity Relationship Summary

```
users 1──────M proposals
industries 1──────M modules
proposals M──────M modules (through proposal_modules, with price snapshots)
proposals M──────1 industries
```

---

## 4. Backend API

### 4.1 Middleware Stack

1. **CORS** — whitelist Vite dev server (`http://localhost:5173`) and production origin
2. **JSON parser** — `express.json()`
3. **Auth** — extracts `Bearer <token>`, verifies JWT, attaches `req.user = { id, email, role }`
4. **Validation** — accepts a Zod schema, validates `req.body`, returns 400 on failure
5. **Error handler** — catches errors, returns `{ error: string, details?: any }`

### 4.2 Route Definitions

#### Auth Routes (public — no auth middleware)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/register` | `{ email, password, fullName }` | `{ user, accessToken, refreshToken }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `{ accessToken }` |

#### User Routes (auth required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/users/me` | — | User profile |
| PUT | `/api/users/me` | `{ fullName?, companyName?, avatarUrl? }` | Updated user |
| PUT | `/api/users/me/password` | `{ currentPassword, newPassword }` | `{ message }` |

#### Config Routes (public)

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/config` | `{ exchangeRateUsd, taxRate, systemCreationFee, bulkMessagingMonthly }` |

#### Industry Routes (auth required)

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/industries` | Array of industries with nested modules |
| GET | `/api/industries/:id` | Single industry with modules |

#### Proposal Routes (auth required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/proposals` | query: `?status=draft&page=1&limit=20` | Paginated list |
| GET | `/api/proposals/:id` | — | Full proposal with snapshotted modules |
| POST | `/api/proposals` | Full proposal payload | Created proposal with reference number |
| PUT | `/api/proposals/:id` | Partial update | Updated proposal |
| DELETE | `/api/proposals/:id` | — | 204 No Content |

#### Pricing Validation (auth required)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/proposals/calculate` | `{ moduleIds, currency, isTaxEnabled, infrastructureType, bulkMessaging }` | `{ totalSetup, totalMonthly, totalYearly, impactScore }` |

> The frontend computes totals locally for real-time UI. On save, the backend **recalculates authoritatively** from the database — preventing client-side price manipulation.

### 4.3 Reference Number Generation

Format: `DEV-YYYY-NNNN` (e.g. `DEV-2026-0001`). Sequential counter per year, generated within a database transaction.

---

## 5. Frontend Pages & Components

### 5.1 Routing

| Route | Page | Access |
|-------|------|--------|
| `/` | LandingPage (Hero, Features, Pricing Tiers) | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/dashboard` | DashboardPage (stats, recent proposals) | Protected |
| `/proposals/new` | ProposalBuilderPage (core pricing matrix) | Protected |
| `/proposals/:id/edit` | ProposalBuilderPage (pre-loaded) | Protected |
| `/proposals/:id` | ProposalViewPage (read-only) | Protected |
| `/proposals` | ProposalHistoryPage (list + filters) | Protected |
| `/profile` | ProfilePage (edit profile, change password) | Protected |

### 5.2 Core Hook — `useProposalBuilder`

This is the React equivalent of the MVP's `SalesOS` class.

```typescript
interface ProposalBuilderState {
  clientCompany: string;
  clientContact: string;
  clientRole: string;
  clientNarrative: string;
  industryId: string | null;
  selectedModuleIds: Set<string>;
  currency: 'JOD' | 'USD';
  isTaxEnabled: boolean;
  infrastructureType: 'integration_only' | 'system_creation' | null;
  hostingProvider: 'devorise' | 'client_aws' | 'client_gcp' | null;
  channels: string[];
  bulkMessaging: boolean;

  // Computed via useMemo
  totalSetup: number;
  totalMonthly: number;
  totalYearly: number;
  impactScore: number;
}
```

Exposes actions: `selectIndustry`, `toggleModule`, `setCurrency`, `toggleTax`, `setInfrastructure`, `toggleBulkMessaging`, `saveProposal`, `generatePdf`.

### 5.3 Builder Components

| Component | Responsibility |
|-----------|---------------|
| `ClientInfoCard` | Company name, contact person, role, narrative textarea |
| `IndustryGrid` | Clickable industry cards rendered from API data |
| `ModuleList` | Appears after industry selection, checkboxes per module |
| `InfrastructureCard` | Integration Only / System Creation radio, channel pills |
| `HostingAddonsCard` | Hosting provider radio, bulk messaging toggle |
| `CurrencyTaxControls` | JOD/USD toggle, 16% tax toggle |
| `QuoteSidebar` | Sticky right column — setup/monthly/yearly totals, impact meter, download PDF, save proposal |
| `ImpactMeter` | Visual efficiency score indicator (0–95%) |

---

## 6. Authentication Flow

### Registration
1. User submits email, password, full name → `POST /api/auth/register`
2. Backend validates with Zod (email format, password min 8 chars)
3. Password hashed with bcryptjs (12 salt rounds)
4. User row inserted, JWT access token (15min) + refresh token (7 days) generated
5. Frontend stores access token in memory (AuthContext), refresh token in localStorage

### Login
Same flow — lookup by email, compare hash, return tokens.

### Authenticated Requests
1. Axios interceptor adds `Authorization: Bearer <accessToken>` to every request
2. On 401 → interceptor tries `POST /api/auth/refresh` with stored refresh token
3. If refresh succeeds → retry original request with new token
4. If refresh fails → clear auth state, redirect to `/login`

### JWT Payload
```typescript
{ sub: userId, email: string, role: string, iat: number, exp: number }
```

---

## 7. Pricing Logic — From Hardcoded to Database-Driven

### How the transition works

| Layer | What happens |
|-------|-------------|
| **Seed migration** (`004_seed_pricing.sql`) | All data from the MVP spec's `PRICING_CONFIG` is inserted into `industries`, `modules`, and `pricing_config` tables |
| **API serves data** | Frontend calls `GET /api/industries` + `GET /api/config` instead of importing a JS file. The `usePricingConfig` hook fetches and caches this data |
| **Runtime editability** (future) | Because pricing lives in the database, an admin UI can edit prices without redeploying. The `is_active` flag allows soft-deletion |

### Calculation logic (same as MVP, now fixing known limitations)

```
totalSetup   = SUM(selected modules' setup prices)
             + (infrastructureType === 'system_creation' ? systemCreationFee : 0)  ← FIXED

totalMonthly = SUM(selected modules' monthly prices)
             + (bulkMessaging ? bulkMessagingMonthly : 0)                          ← FIXED

totalYearly  = totalSetup + (totalMonthly × 12)
impactScore  = MIN(95, SUM(selected modules' efficiency))

If currency === 'USD': displayed amount = base × exchangeRateUsd
If isTaxEnabled:       displayed amount = amount × (1 + taxRate)
```

### Dual calculation (frontend + backend)
- **Frontend** calculates in real-time via `useProposalBuilder` for instant UI updates
- **Backend** recalculates on `POST /api/proposals` from database prices — this is the **source of truth**

---

## 8. PDF Generation

Remains client-side using `jspdf` + `jspdf-autotable` (installed as npm packages, not CDN).

### 6-Page Structure (unchanged from SDLC spec)

| Page | Content |
|------|---------|
| 1. Cover | Devorise logo, client name, "Agentic AI Integration Proposal", date, reference number |
| 2. Proposed Solution | List of selected modules with descriptions |
| 3. Implementation Roadmap | 3 phases: Strategy & Integration → Agent Deployment → Monitoring |
| 4. Investment & Pricing | Auto-generated pricing table (setup, monthly, yearly per module) |
| 5. Terms & Conditions | Proposal validity, assumptions, responsibilities |
| 6. Agreement & Signatures | Signature blocks for Devorise and client |

### Data interface

```typescript
interface PdfProposalData {
  referenceNumber: string;
  clientCompany: string;
  clientContact: string;
  clientRole: string;
  industryName: string;
  narrative: string;
  selectedModules: Array<{
    name: string;
    description: string;
    setup: number;
    monthly: number;
  }>;
  totalSetup: number;
  totalMonthly: number;
  totalYearly: number;
  currency: 'JOD' | 'USD';
  isTaxEnabled: boolean;
  date: string;
}
```

Brand assets (`brand-assets.ts`) are Base64 strings embedded directly — same approach as the MVP.

---

## 9. Deployment (Docker)

### docker-compose.yml — 3 services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | postgres:16 | 5432 (internal) | PostgreSQL with auto-running migrations |
| `backend` | Node 20 Alpine (custom) | 3000 | Express API |
| `frontend` | Nginx Alpine (multi-stage) | 80 | Serves Vite build, proxies `/api` to backend |

### Development workflow

For development, only the database needs Docker:

```bash
docker-compose up db          # PostgreSQL ready in ~5 seconds
cd backend && npm run dev     # Express on :3000
cd frontend && npm run dev    # Vite on :5173
```

### Production deployment

```bash
docker-compose up --build     # All 3 services
```

### Backend Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build             # tsc → dist/
CMD ["node", "dist/index.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build             # vite build → dist/

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Nginx proxies `/api/*` to the backend service and serves all other routes with `index.html` (SPA fallback).

### Environment Variables (.env)

```
PORT=3000
DATABASE_URL=postgresql://devorise:devorise123@db:5432/devorise
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<different-generated-secret>
NODE_ENV=production
FRONTEND_URL=http://localhost
```

---

## 10. Build Sequence (8 Steps)

Each step produces a testable increment. Steps must be completed in order.

| Step | What to Build | Depends On | How to Verify |
|------|--------------|-----------|---------------|
| **1** | **Project scaffolding** — init backend (Express+TS), frontend (Vite+React+TS), docker-compose with PostgreSQL only, `.env.example`, `.gitignore` | Nothing | Express on :3000, Vite on :5173, Postgres running |
| **2** | **Database schema + seed** — write all 4 migration SQL files, mount in Docker entrypoint | Step 1 | `docker-compose up db`, query `SELECT * FROM industries` — all data present |
| **3** | **Backend auth** — pg Pool config, register/login/refresh endpoints, JWT middleware, error handler | Step 2 | curl: register → login → access protected endpoint |
| **4** | **Backend API** — industries, config, proposals CRUD, pricing service with server-side recalculation | Step 3 | Postman: create proposal → list → get single → verify totals |
| **5** | **Frontend foundation** — routing, AuthContext, login/register pages, navbar, ProtectedRoute, design system CSS | Step 4 | Register → login → see protected dashboard shell → logout |
| **6** | **Proposal Builder** — all builder components, `useProposalBuilder` hook, `usePricingConfig` hook, real-time pricing, save to API | Step 5 | Select industry → modules → see pricing → toggle currency/tax → save |
| **7** | **PDF + History** — port ProposalGenerator to TS, proposal history page, proposal view page, "Duplicate as New" | Step 6 | Download PDF (6 pages), browse saved proposals |
| **8** | **Dashboard, Profile, Landing, Docker** — dashboard stats, profile editing, public landing page, full Docker deployment | Step 7 | `docker-compose up --build` → end-to-end flow from landing to PDF download |

### MVP Limitations Fixed in This Implementation

| Limitation | Fix |
|-----------|-----|
| System Creation (+5000 JOD) not added to total | Wired to `totalSetup` when `infrastructureType === 'system_creation'` |
| Bulk Messaging (+100 JOD/mo) not added to total | Wired to `totalMonthly` when `bulkMessaging === true` |
| Channel pills visual only | Stored in proposal, available for future pricing logic |
| View Company Profile opens nothing | Links to `/proposals/:id` view page |
| No data persistence | Full PostgreSQL backend with proposal history |
| No authentication | JWT-based auth with user management |
