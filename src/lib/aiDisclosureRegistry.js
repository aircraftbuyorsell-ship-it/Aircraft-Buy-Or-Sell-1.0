/**
 * aiDisclosureRegistry.js
 *
 * Single source of truth for EU AI Act Article 50 transparency disclosure.
 * Every backend function that calls an LLM (InvokeLLM) to generate content,
 * scores, valuations, or analysis shown to users MUST have an entry here.
 * The /legal/ai-transparency page renders directly from this list, so the
 * public disclosure stays accurate as functions are added or removed.
 *
 * When adding a new base44/functions/* entry.ts that calls InvokeLLM:
 *   1. Add an entry to AI_DISCLOSURE_REGISTRY below.
 *   2. Pick the most specific existing category, or add a new one.
 *   3. Keep descriptions factual and non-marketing — this is a legal notice.
 *
 * Audited: 2026-08-14 — 25 functions found via `grep -rl InvokeLLM base44/functions`.
 */

export const AI_DISCLOSURE_CATEGORIES = [
  {
    id: "scoring_valuation",
    label_en: "Aircraft Scoring & Valuation",
    label_cz: "Skórování a oceňování letadel",
  },
  {
    id: "market_intelligence",
    label_en: "Market Intelligence & Reports",
    label_cz: "Tržní zpravodajství a reporty",
  },
  {
    id: "sales_matching",
    label_en: "Sales, Matching & CRM Support",
    label_cz: "Prodej, párování a CRM podpora",
  },
  {
    id: "content_generation",
    label_en: "Content Generation",
    label_cz: "Generování obsahu",
  },
  {
    id: "verification_compliance",
    label_en: "Document & Compliance Verification",
    label_cz: "Ověřování dokumentů a shody",
  },
  {
    id: "platform_api",
    label_en: "Platform & Partner APIs",
    label_cz: "Platformní a partnerská API",
  },
];

export const AI_DISCLOSURE_REGISTRY = [
  // ── Aircraft Scoring & Valuation ──
  {
    id: "omvmV5Score",
    category: "scoring_valuation",
    name_en: "OMVM v5 — Market Valuation Model",
    name_cz: "OMVM v5 — model tržní hodnoty",
    desc_en: "Statistical valuation combining a log-linear depreciation regression fit on comparable listings with an AI-driven live web market search, used to estimate an aircraft's fair market value.",
    desc_cz: "Statistický model oceňování kombinující logaritmicko-lineární regresi amortizace na srovnatelných inzerátech s AI vyhledáváním aktuálních tržních cen na webu, používaný k odhadu spravedlivé tržní hodnoty letadla.",
  },
  {
    id: "atiFullReportScore",
    category: "scoring_valuation",
    name_en: "ATI Full Report — 8-Dimension Scoring",
    name_cz: "ATI Full Report — hodnocení v 8 dimenzích",
    desc_en: "Scores each of the 8 ATI (Aircraft Transparency Index) dimensions with an independent LLM call, then aggregates into a total score and verdict for paid full reports.",
    desc_cz: "Hodnotí každou z 8 dimenzí ATI (Aircraft Transparency Index) samostatným LLM voláním a agreguje výsledek do celkového skóre a verdiktu pro placené kompletní reporty.",
  },
  {
    id: "orchestrateATIScoring",
    category: "scoring_valuation",
    name_en: "ATI Scoring Orchestration",
    name_cz: "Orchestrace ATI skórování",
    desc_en: "Runs the ATI scoring workflow from wizard inputs — one focused LLM call per dimension, aggregated into a 0–120 score — and persists the result as an ATIPassport.",
    desc_cz: "Řídí proces ATI hodnocení ze zadaných vstupů — jedno cílené LLM volání na dimenzi, agregované do skóre 0–120 — a výsledek ukládá jako ATIPassport.",
  },
  {
    id: "marketExpertValuation",
    category: "scoring_valuation",
    name_en: "Expert Skill-Based Valuation",
    name_cz: "Odborné oceňování na bázi skillů",
    desc_en: "Alternate skill-based appraisal engine that scores the 8 ATI dimensions, calculates market value, and generates a professional narrative for score card reports.",
    desc_cz: "Alternativní odborný oceňovací engine, který hodnotí 8 dimenzí ATI, počítá tržní hodnotu a generuje profesionální textový popis pro reporty skóre karty.",
  },
  {
    id: "cmrLeadScore",
    category: "scoring_valuation",
    name_en: "CMR Lead Scoring",
    name_cz: "CMR skórování leadů",
    desc_en: "Scores an inbound aviation sales lead 0–100 using an LLM call, with a deterministic non-AI fallback if the LLM is unavailable.",
    desc_cz: "Hodnotí příchozí obchodní lead v letectví na škále 0–100 pomocí LLM volání, s deterministickou záložní metodou bez AI v případě nedostupnosti LLM.",
  },

  // ── Market Intelligence & Reports ──
  {
    id: "generateMarketReport",
    category: "market_intelligence",
    name_en: "Paid Market Reports",
    name_cz: "Placené tržní reporty",
    desc_en: "Generates paid market reports with macro, political, and regional depth, personalization, and prediction tracking, using an LLM narrative generator.",
    desc_cz: "Generuje placené tržní reporty s makroekonomickým, politickým a regionálním kontextem, personalizací a sledováním predikcí pomocí AI generátoru textu.",
  },
  {
    id: "generateMarketForecast",
    category: "market_intelligence",
    name_en: "Market Behavior Forecast",
    name_cz: "Predikce tržního chování",
    desc_en: "Generates a comprehensive market behavior forecast using an LLM with live internet context; can be configured to exclude internal ABOS listing data (see Admin Settings).",
    desc_cz: "Generuje komplexní predikci tržního chování pomocí LLM s aktuálním internetovým kontextem; lze nastavit tak, aby nezahrnovala interní data inzerátů ABOS (viz Nastavení administrace).",
  },
  {
    id: "generateMarketInsights",
    category: "market_intelligence",
    name_en: "Dashboard Market Insights",
    name_cz: "Tržní přehledy na nástěnce",
    desc_en: "Analyzes recent listings, escrow activity, deal scores, and ATI data to produce trending-model, buy-alert, and market-shift signals shown on the dashboard.",
    desc_cz: "Analyzuje nedávné inzeráty, aktivitu úschovy, skóre nabídek a ATI data za účelem generování trendů modelů, nákupních upozornění a signálů tržních posunů na nástěnce.",
  },
  {
    id: "hfMarketIntelligence",
    category: "market_intelligence",
    name_en: "Fleet Market Intelligence Commentary",
    name_cz: "Komentář tržní inteligence flotily",
    desc_en: "Generates a short AI commentary summarizing fleet/market intelligence signals for brokers and dealers.",
    desc_cz: "Generuje krátký AI komentář shrnující signály tržní inteligence flotily pro makléře a dealery.",
  },

  // ── Sales, Matching & CRM Support ──
  {
    id: "cmrMatchEngine",
    category: "sales_matching",
    name_en: "CMR Buyer-Aircraft Matching",
    name_cz: "CMR párování kupujícího s letadlem",
    desc_en: "Uses an LLM to pair a buyer lead with the best-matching aircraft listings, weighted by type, budget, ATI risk, avionics, and geography.",
    desc_cz: "Používá LLM k párování kupujícího leadu s nejlépe odpovídajícími inzeráty letadel, váženo podle typu, rozpočtu, ATI rizika, avioniky a geografie.",
  },
  {
    id: "cmrNegoBrief",
    category: "sales_matching",
    name_en: "Negotiation Brief Generator",
    name_cz: "Generátor vyjednávacího briefu",
    desc_en: "Generates a data-backed negotiation strategy brief using ATI subscores and OMVM valuation, via an LLM call.",
    desc_cz: "Generuje datově podložený brief vyjednávací strategie na základě dílčích skóre ATI a ocenění OMVM prostřednictvím LLM volání.",
  },
  {
    id: "dealCheckInFollowup",
    category: "sales_matching",
    name_en: "Deal Wizard Follow-Up Emails",
    name_cz: "Follow-up e-maily Deal Wizard",
    desc_en: "Generates personalized follow-up emails (initial check-in and a second follow-up with comparable listings) after a listing view with no contract initiated, using an LLM.",
    desc_cz: "Generuje personalizované follow-up e-maily (úvodní kontakt a druhé připomenutí se srovnatelnými inzeráty) po zobrazení inzerátu bez zahájení smlouvy, pomocí LLM.",
  },
  {
    id: "orchestrateSalesStep",
    category: "sales_matching",
    name_en: "AI-Governed Sales Pipeline Steps",
    name_cz: "AI řízené kroky prodejního pipeline",
    desc_en: "Orchestrates individual sales pipeline steps under an AI governance layer (approval thresholds, audit logging, confidence checks), using an LLM for step content.",
    desc_cz: "Řídí jednotlivé kroky prodejního pipeline pod vrstvou AI governance (schvalovací prahy, audit log, kontrola spolehlivosti) a využívá LLM pro obsah kroků.",
  },
  {
    id: "sakanaDealBrief",
    category: "sales_matching",
    name_en: "AI Deal Brief Generator",
    name_cz: "AI generátor souhrnu obchodu",
    desc_en: "Generates a data-driven deal brief summarizing ATI score, OMVM value, and comparable data for a listing, via an LLM call.",
    desc_cz: "Generuje datově podložený souhrn obchodu shrnující ATI skóre, hodnotu OMVM a srovnatelná data pro inzerát prostřednictvím LLM volání.",
  },

  // ── Content Generation ──
  {
    id: "generateAviationNews",
    category: "content_generation",
    name_en: "Aviation News Curation (legacy pipeline)",
    name_cz: "Kurátorství leteckých novinek (starší pipeline)",
    desc_en: "Uses an LLM with live web search to find and rewrite current general-aviation news in ABOS editorial voice.",
    desc_cz: "Používá LLM s živým vyhledáváním na webu k nalezení a přepsání aktuálních novinek z všeobecného letectví v redakčním stylu ABOS.",
  },
  {
    id: "fetchAviationNews",
    category: "content_generation",
    name_en: "Aviation News Pipeline",
    name_cz: "Pipeline leteckých novinek",
    desc_en: "Curated aviation news pipeline — uses an LLM with live web search to discover and curate current aviation stories from FAA, AOPA, and industry sources, and generates a themed image per article.",
    desc_cz: "Kurátorská pipeline leteckých novinek — používá LLM s živým vyhledáváním na webu k objevování a výběru aktuálních leteckých zpráv ze zdrojů FAA, AOPA a odvětví, a generuje tematický obrázek ke každému článku.",
  },

  // ── Document & Compliance Verification ──
  {
    id: "verifyDocumentVLM",
    category: "verification_compliance",
    name_en: "Document Verification (Vision LLM)",
    name_cz: "Ověřování dokumentů (Vision LLM)",
    desc_en: "Uses a vision-capable LLM to analyze uploaded document scans as part of the ATI verification process.",
    desc_cz: "Používá LLM se schopností rozpoznávání obrazu k analýze nahraných skenů dokumentů v rámci procesu ověřování ATI.",
  },
  {
    id: "verifyCertificate",
    category: "verification_compliance",
    name_en: "Certificate Data Extraction",
    name_cz: "Extrakce dat z certifikátu",
    desc_en: "Uses a vision-capable LLM to read certificate type, number, expiry date, issuer, and holder name from an uploaded scan.",
    desc_cz: "Používá LLM se schopností rozpoznávání obrazu k přečtení typu certifikátu, čísla, data platnosti, vydavatele a jména držitele z nahraného skenu.",
  },
  {
    id: "computeGlobalCompliance",
    category: "verification_compliance",
    name_en: "Global Compliance Report (Triple-Check)",
    name_cz: "Globální report shody (trojitá kontrola)",
    desc_en: "Cross-checks aircraft registry data across three independent sources; falls back to an LLM for international records not covered by structured sources.",
    desc_cz: "Křížově kontroluje data registru letadla ve třech nezávislých zdrojích; pro mezinárodní záznamy nepokryté strukturovanými zdroji používá jako záložní řešení LLM.",
  },
  {
    id: "managePreBuyInspection",
    category: "verification_compliance",
    name_en: "Pre-Buy Inspection Analysis",
    name_cz: "Analýza předprodejní inspekce",
    desc_en: "Uses an LLM to analyze pre-buy inspection findings and generate an executive summary, risk assessment, and Buy/Negotiate/Walk Away decision guidance. Never certifies airworthiness.",
    desc_cz: "Používá LLM k analýze zjištění z předprodejní inspekce a generování shrnutí, hodnocení rizik a doporučení Koupit/Vyjednávat/Odstoupit. Nikdy necertifikuje letovou způsobilost.",
  },
  {
    id: "easaAdLookup",
    category: "verification_compliance",
    name_en: "EASA Airworthiness Directive Lookup",
    name_cz: "Vyhledávání směrnic EASA o letové způsobilosti",
    desc_en: "Resolves an aircraft's manufacturer/model, then uses an LLM with live web search to find applicable EASA Airworthiness Directives, PADs, and Safety Information Bulletins.",
    desc_cz: "Určí výrobce/model letadla a poté pomocí LLM s živým vyhledáváním na webu najde příslušné směrnice EASA o letové způsobilosti, PAD a bezpečnostní bulletiny.",
  },
  {
    id: "registryLookup",
    category: "verification_compliance",
    name_en: "Multi-Source Registry Lookup",
    name_cz: "Vícezdrojové vyhledávání v registru",
    desc_en: "Looks up aircraft registry data across FAA records and external APIs, with an LLM fallback for international registrations not covered by structured sources.",
    desc_cz: "Vyhledává data registru letadla v záznamech FAA a externích API, se záložním řešením LLM pro mezinárodní registrace nepokryté strukturovanými zdroji.",
  },

  // ── Platform & Partner APIs ──
  {
    id: "abosCoreApi",
    category: "platform_api",
    name_en: "ABOS Core API — Search, Valuation, Extraction",
    name_cz: "ABOS Core API — vyhledávání, ocenění, extrakce",
    desc_en: "Public developer API. Uses an LLM to parse natural-language search intent, delegates aircraft valuation to the OMVM v5 engine, and extracts structured listing data from free-form text.",
    desc_cz: "Veřejné API pro vývojáře. Používá LLM k rozpoznání záměru vyhledávání v přirozeném jazyce, oceňování letadla deleguje na engine OMVM v5 a extrahuje strukturovaná data inzerátu z volného textu.",
  },
  {
    id: "widgetGateway",
    category: "platform_api",
    name_en: "White-Label Partner Widget Gateway",
    name_cz: "Gateway partnerského white-label widgetu",
    desc_en: "Routes intelligence actions (registry enrichment, compliance report, valuation, negotiation brief) for the white-label partner widget — all AI-backed.",
    desc_cz: "Směruje inteligentní akce (obohacení registru, report shody, ocenění, vyjednávací brief) pro partnerský white-label widget — vše na bázi AI.",
  },
  {
    id: "aviationServiceIntel",
    category: "platform_api",
    name_en: "Aviation Service Intelligence",
    name_cz: "Inteligence leteckých služeb",
    desc_en: "Uses an LLM with live web search to find current fuel prices, FBO information, and other aviation service data.",
    desc_cz: "Používá LLM s živým vyhledáváním na webu k nalezení aktuálních cen paliva, informací o FBO a dalších dat leteckých služeb.",
  },
];

export function getAiDisclosureByCategory() {
  return AI_DISCLOSURE_CATEGORIES.map((cat) => ({
    ...cat,
    items: AI_DISCLOSURE_REGISTRY.filter((item) => item.category === cat.id),
  })).filter((cat) => cat.items.length > 0);
}
