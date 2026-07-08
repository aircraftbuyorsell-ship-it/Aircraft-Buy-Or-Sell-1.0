# ABOS Marketspace — Design Sprint 1
## UX Architecture & Design Direction

> **Status: PROPOSAL — awaiting approval.** No code changes in this sprint.
> Brand identity (logo, palette, typography, dot grid, premium aviation feel) is **frozen** — this document redesigns the *experience*, not the brand.

Owner: ABOS Product Team · Date: 2026-07-08 · Companion docs: `DOMAIN-GLOSSARY.md`

---

## 0. Challenged Assumptions (read first)

| Assumption in the brief | Challenge | Recommendation |
| :--- | :--- | :--- |
| "Four products" is new | The nav already ships Marketplace / Intelligence / Solutions / Developers / Pricing. | Don't rebuild nav from zero — **rename & regroup**: Solutions → split into **Verification** and **Services**; keep Developers under a slim "Developers" footer + Dashboard entry. |
| Globe must be built new | The codebase already has `HeroGlobe`, `MiniGlobe`, `SkyBossGlobe`, `TrafficGlobe`, `CanvasGlobe`, `RotatingGlobe` — six globes. | **Consolidate to ONE signature globe** (`AviationIntelligenceGlobe`) built on the canvas approach of `MiniGlobe` + live nodes from `cachedTraffic`. Delete/retire the rest in Sprint 2. Six globes is a maintenance liability, not a signature. |
| New design system needed | Sprint "Intelligence UI v2.0" already delivered 14 shared components (`src/components/intelligence/`) + token system (`gold-official`, `glass-card`, `dot-grid`, `bg-canvas`). | **Extend, don't replace.** The design system proposal below is v1.1 of that library, not a new one. |
| Verification = new page | ATI Verify, Digital Twin, N-Lookup, GCR, Ownership Trace already exist as separate pages. | The Verification product is an **umbrella IA change**: one "Verification Center" hub routing to existing capabilities. No feature rebuild. |
| "Future Escrow Placeholder" | Escrow already exists (`/escrow`, EscrowTransaction, USDC + Stripe). | Don't hide working functionality. Move escrow under **Services → Transaction Support**, presented as "confidence infrastructure", not as the product's selling point. Philosophy respected ("ABOS does not sell escrow — ABOS builds confidence") through copy & hierarchy, not deletion. |

---

## 1. Information Architecture

Four products, one platform:

```
ABOS (Aviation Commerce Platform)
├── MARKETSPACE            — discover & transact
│   ├── Listings (verified-first)
│   ├── Aircraft Detail ("flagship" page)
│   ├── Compare
│   ├── Deal Radar
│   └── Alerts
├── INTELLIGENCE           — understand the market
│   ├── Analytics (executive dashboard — redesigned ✓)
│   ├── Valuation / OMVM
│   ├── Market Reports
│   ├── Live Traffic Map
│   └── ATI Full Report (redesigned ✓)
├── VERIFICATION           — trust before transaction
│   ├── Verification Center (hub — redesigned ✓ as ATIVerify)
│   ├── Registry Lookup (N-Lookup + Digital Twin)
│   ├── Ownership Timeline (OwnershipTrace)
│   ├── Document Vault (VaultDocuments)
│   ├── Expert CrossCheck (A&P / IA / EASA network)
│   └── ATI Passport & Card
└── SERVICES               — complete the workflow
    ├── Service Intelligence Hub (directory: maintenance, CAMO, paint, avionics…)
    ├── Pre-Buy Inspection
    ├── Financing & Insurance (calculators exist)
    ├── Cross-Border Bridge (transport / import)
    ├── Transaction Support (escrow, sales pipeline, broker network)
    └── Startup Hub / Experts
```

**Cross-cutting:** Dashboard (role-aware), Pricing, Developers (Core API, SDK, Integration Kit), Legal.

---

## 2. Sitemap (target routes — mostly existing, regrouped)

```
/                        Homepage (Mission Control)
/listings                Marketspace
/aircraft/:id            Aircraft Detail (evolves from /ati-passport/:listingId)
/intelligence            Intelligence landing = /analytics
/traffic                 Live Traffic Map
/valuation, /market-reports, /ati-full-report
/verification            Verification Center hub (= /ati-verify evolved)
/n-lookup, /twin/:registration, /ati-standard
/services                Service Intelligence Hub (= /service-intelligence evolved)
/pre-buy-inspection, /cross-border-bridge, /escrow, /experts
/pricing, /developers, /dashboard (role-aware), /my-account
```

Rule: **no route deletions in Sprint 1–2** — only additive aliases + nav regrouping, so deep links and SEO stay intact.

---

## 3. Wireframes (structural)

### Homepage — "Mission Control"
```
┌────────────────────────────────────────────────────────┐
│ Sticky Nav: Marketspace·Intelligence·Verification·      │
│             Services·Pricing | 🔍 persistent | Dashboard│
├───────────────────────────┬────────────────────────────┤
│ HERO LEFT                 │ HERO RIGHT                  │
│  Headline (trust-led)     │  Aviation Intelligence      │
│  Universal search bar     │  Globe (dot-grid built,     │
│  [Verify an Aircraft]     │  routes, live nodes,        │
│  [Browse Marketspace]     │  verification pulses)       │
│  Value prop line          │                             │
├───────────────────────────┴────────────────────────────┤
│ QUICK ACTIONS  (4–6 workflow tiles: Verify · Value ·    │
│                 Search Registry · Track · Sell · Report)│
├─────────────────────────────────────────────────────────┤
│ MARKET INTELLIGENCE  (live counters + mini trend chart) │
├─────────────────────────────────────────────────────────┤
│ FEATURED AIRCRAFT  (3–4 large cards, verified-first)    │
├─────────────────────────────────────────────────────────┤
│ LATEST VERIFIED LISTINGS  (row of compact cards)        │
├─────────────────────────────────────────────────────────┤
│ POPULAR MANUFACTURERS  (logo/name pills → filtered srch)│
├─────────────────────────────────────────────────────────┤
│ PROFESSIONAL SERVICES  (4 service category cards)       │
├─────────────────────────────────────────────────────────┤
│ WHY TRUST ABOS  (ATI standard, expert network, 280k     │
│                  community, EU AI Act compliance)       │
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                  │
└─────────────────────────────────────────────────────────┘
```

### Aircraft Detail — "the most important page"
```
┌──────────────────────────────┬──────────────────────────┐
│ GALLERY (large, swipeable)   │ COMMAND PANEL (sticky)    │
│                              │  Price + OMVM vs market   │
│                              │  ATI Score ring + badge   │
│                              │  Verification status      │
│                              │  [Request Verification]   │
│                              │  [Contact / Offer]        │
├──────────────────────────────┴──────────────────────────┤
│ TABS: Overview · Specifications · History · Ownership · │
│       Documents · Analytics                              │
│  (tab content: skip-if-missing policy — "Data            │
│   unavailable" instead of blocking)                      │
├──────────────────────────────────────────────────────────┤
│ MARKET INTELLIGENCE (comparables, price trend, days on  │
│                      market, liquidity)                  │
├──────────────────────────────────────────────────────────┤
│ RELATED AIRCRAFT (cards)                                 │
└──────────────────────────────────────────────────────────┘
```

### Aircraft Card (redesign)
```
┌──────────────────┐   Photo 16:10, full-bleed
│   PHOTO          │   Verification badge overlaid top-left
│  [✓ Verified]    │   ATI score chip top-right
├──────────────────┤
│ 1979 Mooney M20J │   Price — bold, gold on hover
│ $145,000 · TX,US │   One metadata line only
│ ★4.8 seller      │   Quick actions on hover: ♡ · Compare · Verify
└──────────────────┘
```
Everything else (hours, avionics, engine) lives in the drawer/detail — *minimal information, maximum confidence*.

---

## 4. UX Flows (primary)

**Buyer:** Search → Card (trust signals visible) → Detail (verify status + market score) → Request Verification / Expert CrossCheck → Full Report → Offer → Transaction Support.
Every step answers: *Can I trust this? → What next? → How do I finish?*

**Seller:** Dashboard → List Aircraft (wizard) → Auto Registry Match (T0 free) → ATI scoring upsell → Verified badge → Leads → Sales Pipeline.

**Verifier/Expert:** Expert Dashboard → Open crosschecks → Bid → Verdict → Rating.

**Anonymous → Trust funnel:** Public Registry Lookup (free) → Digital Twin (public) → ATI unlock (paid) → account creation. Verification is the acquisition engine, not the marketplace.

---

## 5. Component List

**Existing (keep, from `src/components/intelligence/`):** HeroHeader, SectionHeader, SummaryCard, MetricCard, StatusBadge, Timeline, RiskIndicator, InsightCard, AIInsightPanel, ChartCard, ActionBar, LoadingSkeleton, EmptyState, VerificationCard.

**New for Sprint 1 scope (build in implementation phase):**

| Component | Purpose |
| :--- | :--- |
| `AviationIntelligenceGlobe` | THE signature globe (see §11) — replaces 6 existing globes |
| `UniversalSearchBar` | Persistent nav search: registrations, models, sellers, reports |
| `QuickActionTile` | Homepage workflow tiles |
| `TrustBadge` | Unified verification badge (listing cards, detail, search results) |
| `AircraftCard v2` | Photography-first card per §3 |
| `CommandPanel` | Sticky right rail on Aircraft Detail |
| `ManufacturerPill` | Popular-manufacturers strip |
| `ServiceCategoryCard` | Services hub tiles |
| `TrustSection` | "Why Trust ABOS" band |
| `TabbedDetail` | Reusable tab shell (already prototyped in ATIFullReport) |

---

## 6. Design System Proposal (v1.1 — extension, not replacement)

- **Tokens frozen:** `--gold-official #D4A017`, `--bg-canvas`, `--grid-color`, glass utilities, dot-grid watermark, SF Pro/Inter stack, light+dark.
- **Additions:** `--trust-verified` (emerald ramp), `--trust-caution` (amber), `--trust-risk` (red) as semantic trust tokens; consistent 4/8/12/16/24 spacing scale; radius stays `--radius 1.1rem`.
- **Page skeleton standard** (from Intelligence v2.0, now platform-wide): Hero → Summary → Primary Interactive → AI Insights → Detail → Actions.
- **Rules:** no hardcoded hex in JSX; every stat uses SummaryCard/MetricCard; every list has LoadingSkeleton + EmptyState; every page hero uses HeroHeader.

---

## 7. Homepage Layout — see §3 wireframe. Key decisions:
- Listings do **not** open the page; trust and intelligence do.
- Quick Actions map 1:1 to real routes (Verify → /n-lookup, Value → /valuation, Track → /traffic, Sell → listing wizard, Report → /ati-full-report).
- Market Intelligence band uses live `computeMarketAnalytics` data (already cached 5 min).

## 8. Aircraft Detail Layout — see §3 wireframe. Key decisions:
- Merge today's ATIPassport page + ListingDrawer content into one tabbed detail.
- ATI score & Digital Twin data public; deep insights behind unlock (existing gating preserved).
- Skip-if-missing policy everywhere (established preference).

## 9. Dashboard Layout (role-aware, single entry)
```
Header: identity + role badge + tier
Row 1: role KPIs (SummaryCards)
Row 2: "Continue your workflow" — resumable pipelines, open verifications, unread leads
Row 3: role modules (Seller: listings+leads · Broker: agreements+pipeline ·
        Expert: crosschecks+bids · Admin: system health+moderation)
```
One Dashboard route, module visibility by role — consistent with the established "single role-aware Dashboard" decision.

---

## 10. Responsive Strategy

- **Desktop-first** (professional tool), then tablet, then mobile.
- Breakpoints: ≥1280 full two-rail layouts; 768–1279 command panels collapse below content; <768 single column, sticky bottom ActionBar, filters become bottom sheets (`BottomSheetSelect` exists).
- Globe: full animation desktop; static-rotation frame ≤ tablet; hidden (headline-only hero) on small phones for LCP.
- Sticky elements: nav always; filters sticky ≥768px; detail CommandPanel sticky ≥1024px.

---

## 11. Motion Design Strategy

- **Physics:** one easing everywhere — `cubic-bezier(0.16,1,0.3,1)`, 200–400 ms. No bouncy motion.
- **Globe (visual signature):** canvas 2D (extends `MiniGlobe` math — no new deps): dot-grid sphere in `--grid-color`; 0.5 rpm rotation; great-circle route arcs drawn as animated dashes; live aircraft nodes (real positions via `cachedTraffic`, throttled); gold "verification pulse" rings emitted from cities on recent ATI events; respects `prefers-reduced-motion`.
- **Cards:** hover = 2px lift + border-color shift only (no scale/shadow explosions).
- **Data:** score bars & rings animate width/stroke on first paint only; counters tween once.
- **Page transitions:** none (SPA snappiness > theatrics); skeletons carry the perceived speed.

---

## 12. Future SDK Integration Points (hooks for Sprint 2–3)

| Surface | Integration point |
| :--- | :--- |
| Universal Search | thin client of `POST /api/v1/search` (abosCoreApi) — same endpoint FB/ChatGPT clients use |
| Aircraft Card / TrustBadge | embeddable via widgetGateway (partner white-label already exists) |
| Verification Center | `publicTwinLookup` + `registryLookup` become public SDK methods |
| Globe live nodes | `cachedTraffic` → future `GET /api/v1/traffic` |
| Market Intelligence band | `computeMarketAnalytics` → `GET /api/v1/market/summary` |
| Aircraft Detail tabs | each tab = one API resource (spec: `abosOpenApiSpec`) so SDK renders the same detail |

Design rule: every homepage/detail data block must map to exactly one Core API endpoint — the web app becomes the reference client of the ABOS OS.

---

## Sprint sequencing (agreed)

- **Sprint 1 = Design & UX** (this document)
- **Sprint 2 = Platform Architecture** (Core API, Sales Pipeline, MCP, White-label)
- **Sprint 3 = SDK & Integrations** (FB Community SDK, Partner/Developer Portal)
- **Sprint 4 = Public Launch Readiness**

**Proposed implementation order for Sprint 1 build-out (after approval):**
1. Navigation regroup + UniversalSearchBar
2. AviationIntelligenceGlobe + new Hero
3. Homepage Mission Control restructure
4. AircraftCard v2 + TrustBadge
5. Aircraft Detail (tabbed flagship)
6. Verification Center hub + Services hub regroup
7. Role-aware Dashboard rework