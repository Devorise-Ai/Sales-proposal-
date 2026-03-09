# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sales Pricing Matrix** — an internal SaaS tool for Devorise AI's sales team. Sales architects configure AI transformation proposals by selecting industry-specific modules, infrastructure options, and add-ons, then generate a branded 6-page PDF proposal in one click.

**Current state:** MVP (Phase 1) — static single-page app, no backend, no database, no authentication. All logic runs client-side in the browser.

## Running Locally

```bash
# ES Modules require HTTP (not file://), so use a local server
npx -y http-server . -p 5000 --cors -c-1
# Open http://localhost:5000
```

No build step, no package.json, no npm install for MVP.

## Tech Stack (MVP)

- HTML5 + vanilla CSS3 (dark glassmorphism theme)
- Vanilla JavaScript with ES Modules
- jsPDF + jspdf-autotable (client-side PDF generation, loaded via CDN)
- Font Awesome 6 (icons), Google Fonts Inter (typography)

## Architecture

```
index.html          → Main UI (layout, forms, sticky sidebar)
style.css           → All styling (CSS custom properties for design system)
pricing.js          → PRICING_CONFIG + GLOBAL_PHASES (data layer, build first)
app.js              → SalesOS class (state management, DOM, events, build second)
pdf-generator.js    → ProposalGenerator class (6-page jsPDF builder, build third)
brand-assets.js     → Base64-encoded logos/images for PDF embedding
logo.png            → Devorise AI logo for web header
```

### Separation of Concerns

- **All pricing/data changes** → `pricing.js` only
- **All UI/layout changes** → `index.html` + `style.css`
- **All logic changes** → `app.js`
- **PDF output changes** → `pdf-generator.js`

The UI renders dynamically from `PRICING_CONFIG`. Adding a new industry or module requires editing only `pricing.js`.

### Application State (managed by SalesOS class in app.js)

```js
state = {
    industry, selectedModules, currency ('JOD'|'USD'),
    isTaxEnabled, clientName, salespersonName, clientNarrative,
    totalSetup, totalMonthly, totalYearly, impactScore (0-95)
}
```

### Calculation Logic

```
totalSetup    = SUM(selectedModules.setup)
totalMonthly  = SUM(selectedModules.monthly)
totalYearly   = totalSetup + (totalMonthly × 12)
impactScore   = MIN(95, SUM(selectedModules.efficiency))
If currency == 'USD':  amount × 1.41
If tax enabled:        amount × 1.16
```

## Design System

| Token | Value |
|-------|-------|
| Background | `#0F1014` (dark navy) |
| Card surfaces | `#1A1B21` with `rgba(255,255,255,0.08)` border |
| Accent | `#007C8A` (teal) |
| CSS vars | `--devorise-navy`, `--devorise-card`, `--devorise-teal` |
| Border radius | Cards 16px, Inputs 12px, Pills 20px |
| Layout | CSS Grid, 2-column (form left + sticky sidebar right) |
| Animations | fadeInUp, `cubic-bezier(0.16, 1, 0.3, 1)` |

## Adding a New Industry

Add a key to `PRICING_CONFIG.industries` in `pricing.js`:

```js
NEW_INDUSTRY: {
    id: "new_industry",
    name: "Display Name",
    theme: "#HEX_COLOR",
    narrative: "...",
    roi: "...",
    modules: [
        { id: "mod1", name: "Module Name", setup: 2000, monthly: 500, description: "...", efficiency: 40 }
    ]
}
```

No other file changes needed — the UI renders dynamically from this config.

## Known MVP Limitations

- System Creation option (+5000 JOD) not wired to pricing logic
- Bulk Messaging add-on (+100 JOD/mo) not wired to pricing logic
- Channel pills are visual only (no pricing impact)
- View Company Profile button has no target

## Testing

No automated test suite. Testing is manual:
- Open `http://localhost:5000`, verify no JS errors
- Select modules, verify sidebar pricing matches calculation logic
- Toggle USD (×1.41) and tax (×1.16), verify math
- Generate PDF, verify 6 pages with correct content

## Future Architecture (Phase 3+)

Frontend (Vite SPA) → REST API → Express + TypeScript backend → PostgreSQL/SQLite
