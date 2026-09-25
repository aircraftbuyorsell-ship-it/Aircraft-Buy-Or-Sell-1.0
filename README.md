# Aircraft Buy Or Sell — ABOS

> **Where aviation data meets the marketspace.**
>
> An aviation marketspace and intelligence platform for discovering, verifying, assessing, and understanding aircraft transactions.

## What is ABOS?

**Aircraft Buy Or Sell (ABOS)** is being built as an independent aviation data and intelligence layer connecting aircraft listings, market data, verification signals, and transaction analysis.

The platform is designed around one core question:

**Can I trust the aircraft information well enough to make the next decision?**

ABOS combines:

- **Marketspace** — aircraft discovery and listings
- **Intelligence** — structured aviation data, analysis, and research
- **Verification** — aircraft, registration, history, documentation, and listing checks
- **ATI — Aircraft Transparency Index** — a structured transparency signal and report framework
- **Aircraft Passport / Digital Twin** — a persistent aircraft identity and evidence layer
- **Assessment & valuation tooling** — market and aircraft-level analysis
- **API / White-label infrastructure** — capabilities for aviation businesses and marketplaces

ABOS is intended to complement existing brokers, marketplaces, dealers, and aviation data providers rather than pull users away from them.

---

## Repository

This repository contains the current ABOS application and supporting services.

**Repository:** `aircraftbuyorsell-ship-it/Aircraft-Buy-Or-Sell-1.0`

**Primary branch:** `main`

The application is currently built as a **React + Vite** application with Base44 integration, Supabase data services, and supporting ABOS backend functions. The repository also contains testing, packaging, installer, and white-label related tooling.

---

## Technology Stack

- **Frontend:** React 18 + Vite
- **Routing:** React Router
- **UI:** Tailwind CSS + Radix UI + Lucide
- **Data / Backend:** Supabase + Base44 functions
- **Payments:** Stripe
- **Maps / Traffic:** React Leaflet and aviation traffic integrations
- **Reports:** jsPDF / HTML rendering utilities
- **Charts:** Recharts
- **3D / visualization:** Three.js
- **Validation:** Zod
- **Testing:** Node test runner
- **Deployment / Builder:** Base44

The project dependencies and available development scripts are defined in `package.json`. fileciteturn3file0L2-L2

---

## Local Development

### Prerequisites

- Node.js with npm
- Git
- Access to the required ABOS / Base44 / Supabase services and environment variables

### 1. Clone the repository

```bash
git clone https://github.com/aircraftbuyorsell-ship-it/Aircraft-Buy-Or-Sell-1.0.git
cd Aircraft-Buy-Or-Sell-1.0
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env.local` file.

At minimum, the browser-side Supabase integration expects:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The repository contains additional integrations and backend functions that may require other environment variables. **Never commit secrets, private API keys, service-role keys, Stripe secrets, or provider credentials to Git.**

The Supabase client explicitly reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. fileciteturn4file1L15-L22

### 4. Start the development server

```bash
npm run dev
```

Vite will start the local development environment.

---

## Useful Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Automatically fix lint issues
npm run lint:fix

# Type checking
npm run typecheck

# Test suite
npm test

# White-label / installer tests
npm run test:white-label

# Build ABOS package
npm run build:package

# Run ABOS installer
npm run install:abos
```

These scripts are defined in the repository's current `package.json`. fileciteturn3file0L2-L2

---

## Architecture Principles

### Supabase-first data layer

Supabase is used as a core structured data layer for aircraft, aviation sources, verification signals, and application data.

### Source provenance matters

ABOS should distinguish between:

- verified data
- observed data
- calculated data
- inferred data
- unavailable data
- conflicting data

**Missing data must not automatically be treated as negative data.**

### Explainability

Valuations, transparency scores, verification results, and other analytical outputs should remain traceable to their underlying data and calculation logic wherever practical.

### Independent verification layer

ABOS is designed to sit between fragmented aviation information sources and the people making aircraft-related decisions.

### Marketplace compatibility

ABOS can be integrated into existing aviation marketplaces and dealer workflows. The goal is to improve the quality and usefulness of an existing marketplace rather than force users into a separate destination.

---

## Core Product Areas

### Marketspace

Aircraft discovery, listings, market information, and search workflows.

### Intelligence

Professional aviation research and analysis, including structured aircraft information and market signals.

### Verification

Evidence-oriented checks covering aircraft identity, registration, history, documents, listing information, and other available signals.

### ATI — Aircraft Transparency Index

ATI provides a structured transparency framework for aircraft and listings. The score is intended as a signal, not as a substitute for professional inspection, legal review, title research, or other due diligence.

### Aircraft Passport

A persistent aircraft record designed to bring together the aircraft's identity, evidence, verification history, market information, and other relevant data into a reusable digital record.

### API / White-label

ABOS capabilities can be exposed to aviation businesses, marketplaces, and other partners through integration and white-label workflows.

---

## Data & Integrations

The project contains integrations and backend functions for aviation data and analysis. Examples include registry-related workflows, FAA data processing, aircraft identity resolution, live traffic functionality, and Supabase synchronization.

Some backend functions use server-side credentials such as `SUPABASE_SERVICE_ROLE_KEY`; these credentials must remain server-side and must never be exposed to the browser or committed to the repository. fileciteturn4file2L28-L35

Additional provider integrations may be enabled through environment configuration depending on the deployment.

---

## Security

### Never commit secrets

Do not commit:

- `.env.local`
- Supabase service-role keys
- Stripe secret keys
- API provider keys
- OAuth credentials
- private signing keys
- webhook secrets
- internal ABOS automation secrets

Use environment variables and the relevant deployment secret manager instead.

### Public vs server-side variables

Variables prefixed with `VITE_` can be exposed to the browser bundle. **Do not put secrets in `VITE_*` variables.**

Server-side credentials belong exclusively in backend / function environments.

---

## Testing & Quality

Before pushing significant changes, run:

```bash
npm run lint
npm run typecheck
npm test
```

For white-label, installer, packaging, or tenant changes, also run:

```bash
npm run test:white-label
```

Keep tests close to the behavior they protect. Changes to data-source priority, aircraft identity resolution, scoring, verification, payments, or tenant isolation should include appropriate regression coverage.

---

## Working with Base44

This project originated as a Base44 application and remains integrated with the Base44 development/deployment workflow.

Base44 documentation for GitHub integration:

https://docs.base44.com/Integrations/Using-GitHub

Base44 support:

https://app.base44.com/support

When working locally, treat the Git repository as the source-controlled application code. Coordinate Base44 Builder changes carefully with Git changes to avoid overwriting or unintentionally diverging from the repository state.

---

## Contribution / Change Discipline

When modifying ABOS:

1. Understand the existing implementation before changing it.
2. Prefer the smallest safe change that solves the problem.
3. Preserve existing data-source priority and provenance rules.
4. Do not silently replace verified data with weaker sources.
5. Do not convert unavailable information into a negative finding.
6. Keep secrets out of source control.
7. Add or update regression tests for behavior changes.
8. Run lint, typecheck, and relevant tests before committing.
9. Document architectural changes when they affect other agents, integrations, or deployment environments.

---

## Project Direction

ABOS is evolving toward an **open aviation intelligence and verification layer** that can operate across marketplaces, brokers, dealers, aviation professionals, and aircraft buyers and sellers.

The long-term architecture is intended to support:

- trusted aircraft identity
- evidence-backed verification
- transparent market intelligence
- explainable valuation
- reusable Aircraft Passports / Digital Twins
- AI-assisted aviation research
- API and white-label deployment
- integration with existing aviation marketplaces

The objective is not simply to publish aircraft listings. It is to make the information surrounding an aircraft **more structured, traceable, and useful at the moment a decision is being made**.

---

## License

See the repository for the applicable license and third-party dependency notices.

---

## ABOS

**Aircraft Buy Or Sell**  
Aviation Marketspace · Intelligence · Verification

https://aircraftbuyorsell.com
