# ABOS Domain Glossary

> **Status: DRAFT — pending approval.** Once approved, this document is the single source of truth
> for all terminology used in code, database schemas, the Core API, SDKs, documentation,
> legal texts, AI prompts, and marketing materials. Any deviation is a bug.

Last updated: 2026-07-08 · Owner: ABOS Platform Team

---

## 1. Canonical Terms

| Term | Full Name | Definition | Never Means |
| :--- | :--- | :--- | :--- |
| **ATI** | **Aircraft Transparency Index** | The 0–120 trust/transparency score of a specific aircraft, computed across 8 dimensions (documentation, technical, transparency, transaction readiness, usage/mission, storage/exposure, config clarity, market readiness). ATI is a **property of an aircraft**, not a service. | ~~Aircraft Transaction Intelligence~~ (deprecated, see §4) |
| **ATI Score** | — | The numeric output of the ATI model (0–120) plus its label (EXCEPTIONAL … AVOID). | A valuation. Price estimation is OMVM. |
| **ATI Passport** | — | The detailed per-aircraft report/document built on top of the ATI Score (Digital Twin data + score + insights). Entity: `ATIPassport`. | A marketplace listing. |
| **ATI Card** | — | The persistent, versioned, shareable digital identity card of an aircraft (public code `ATI-…`). Entity: `ATICard`. | — |
| **ATI Verify** | — | Document-based verification workflow (uploads, expert checks) that feeds the ATI Score. | — |
| **OMVM** | Observed Market Value Model | Statistical/AI market value estimate based on comparables and live market data. | Part of ATI. It is a separate output. |
| **Market Intelligence** | — | Umbrella for valuation, trends, forecasts, comparables, deal radar (OMVM, analytics, market reports). | — |
| **Transaction Services** | — | Escrow, sales pipeline, broker agreements, deal workflow, closing. | "Transaction Intelligence". |
| **ABOS Intelligence** | — | The overarching AI layer of the platform (LLM analysis, scoring orchestration, governance). | — |
| **Digital Twin** | — | The registry-anchored data profile of an aircraft (FAA/international registry, specs, ADS-B), independent of any listing. | — |

## 2. Brand Hierarchy

```
ABOS (brand)
└── ABOS Intelligence (AI layer)
    ├── ATI — Aircraft Transparency Index  → ATI Score, ATI Passport, ATI Card, ATI Verify
    ├── Market Intelligence                → OMVM, Deal Radar, Market Reports, Analytics
    └── Transaction Services               → Escrow, Sales Pipeline, Broker workflow
```

## 3. Usage Rules

1. **First mention** in any user-facing document: "ATI (Aircraft Transparency Index)". After that, "ATI" alone.
2. **API/SDK**: field names stay `ati_score`, `ati_total`, `omvm_value`. Descriptions must say "Aircraft Transparency Index".
3. **Database**: entity names (`ATIPassport`, `ATICard`, …) and field names are frozen — renaming them is a breaking change and is not planned. Only their *descriptions* are aligned to this glossary.
4. **Legal texts** (ToS, Privacy, AI Transparency): must use "Aircraft Transparency Index" exclusively.
5. **AI prompts**: any prompt referencing ATI must expand it as "Aircraft Transparency Index" to avoid LLM ambiguity.
6. **Marketing**: services that analyze deals/valuations are described as "Market Intelligence" or "Transaction Services" — never "Transaction Intelligence".

## 4. Deprecated Terms

| Deprecated | Replace With | Where it still exists (to fix) |
| :--- | :--- | :--- |
| Aircraft **Transaction** Intelligence | Aircraft **Transparency** Index (when meaning the score) or Market Intelligence / Transaction Services (when meaning services) | `TermsOfService.jsx` §2, `Pricing.jsx` H1, `ATIStandard.jsx` hero copy |
| "transaction intelligence" (lowercase, generic) | "transparency intelligence" or "market intelligence" per context | `ATIStandard.jsx` line ~96 |

## 5. Known-Good Anchors (already compliant)

- `AITransparency.jsx` — "ATI Report (Aircraft Transparency Index)" (EU AI Act Art. 50 disclosure, CZ + EN)
- `abosOpenApiSpec` — `ati_score`: "ATI transparency score 0-120"
- `ATIPassport` entity — `ati_total` described as the 8-dimension transparency score