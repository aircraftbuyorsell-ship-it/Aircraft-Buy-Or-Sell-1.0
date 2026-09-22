// ABOS Product Catalog — single source of truth for what the UI displays.
//
// Two layers, deliberately:
//   1. SCREEN / ASSESS / COMMIT is the FUNNEL — what a user does, named in the app.
//      It is not a price list; Screen is free and the deeper stages are reached
//      through the products below.
//   2. The three commercial LINES below are the PACKAGING — what someone buys,
//      chosen by which kind of buyer they are:
//        acquire     broker           priced per seat + monthly report allowance
//        trade_desk  aircraft dealer  priced per airframe, banded by hull value
//        embed       marketplace      priced per API call
//      Plus `single_aircraft`, the per-tail products anyone can buy outright.
//
// Stripe Price IDs are resolved SERVER-SIDE from `key`. They are deliberately
// absent here and must never be trusted from the browser.
//
// `publish: 'fixed'` goes on the page as an exact number. `publish: 'from'`
// goes out as "from €X" — at that level the buyer expects to negotiate, and a
// fixed number on the page only caps what the deal can be worth.

export const PRODUCT_LINES = {
  single_aircraft: { key: 'single_aircraft', name: 'One aircraft', blurb: 'Verify and analyse a single tail number.' },
  acquire: { key: 'acquire', name: 'ABOS Acquire', segment: 'Broker', unit: 'Seat + monthly report allowance', blurb: 'Throughput: how many aircraft you can screen before deciding which are worth a call.' },
  trade_desk: { key: 'trade_desk', name: 'ABOS Trade Desk', segment: 'Aircraft sales company', unit: 'Per airframe, banded by hull value', blurb: 'Depth on one airframe: the quality of the entry estimate you commit capital against.' },
  embed: { key: 'embed', name: 'ABOS Embed', segment: 'Marketplace', unit: 'API call', blurb: 'An upsell for your own sellers — cost that scales with traffic, not headcount.' },
};

export const PRODUCT_CATALOG = [
  // — One aircraft ————————————————————————————————————————————————
  { key:'ATI_SCORE', line:'single_aircraft', name:'ATI Score', type:'one_time', price_eur:0, free:true, currency:'eur', publish:'fixed', icon:'Shield',
    tagline:'Know the aircraft at a glance.',
    features:['ATI transparency score','Key risk signals','Data-quality indicators','Locked report preview'] },

  { key:'ATI_REPORT', line:'single_aircraft', name:'ATI Report', type:'one_time', price_usd:49, currency:'usd', publish:'fixed', icon:'FileBarChart', aircraft_scoped:true,
    tagline:'Aircraft due diligence before you buy.',
    features:['Aircraft identity & provenance','Registry and verification signals','History and risk indicators','OMVM valuation','Data gaps and confidence','Sources and methodology'] },

  { key:'ATI_PRO', line:'single_aircraft', name:'ATI Pro — Investment Brief', type:'one_time', price_usd:199, currency:'usd', publish:'fixed', icon:'PieChart', aircraft_scoped:true,
    tagline:'Ownership economics before you commit.',
    features:['Everything in ATI Report','CAPEX / OPEX economics','Insurance and MRO analysis','Rebuild ROI','Ownership scenarios'] },

  { key:'ATI_PRO_TAX', line:'single_aircraft', name:'ATI Pro Tax', type:'one_time', price_usd:499, currency:'usd', publish:'fixed', icon:'Shield', aircraft_scoped:true, upgrade_from:'ATI_PRO',
    tagline:'Jurisdiction-specific tax and insurance layer.',
    features:['Tax treatment by jurisdiction','Insurance structuring','Fractional ownership analysis','Lease-rate analysis'] },

  { key:'PROFESSIONAL_REVIEW', line:'single_aircraft', name:'Professional Review', type:'one_time', price_usd:499, currency:'usd', publish:'from', icon:'BadgeCheck',
    tagline:'Have an aviation professional review the ABOS analysis.',
    features:['AI analysis package','Identified risks and questions','Professional comments','Credentialed review workflow','Review status and audit trail'] },

  // — ABOS Acquire ————————————————————————————————————————————————
  { key:'ACQUIRE_SOLO', line:'acquire', name:'Acquire Solo', type:'subscription', price_eur:290, currency:'eur', interval:'month', publish:'fixed', icon:'Crown',
    seats:1, report_allowance:20, overage_eur:19, effective_per_report_eur:14.50,
    tagline:'One broker, twenty aircraft a month.',
    features:['1 seat','20 ATI Reports per month','Bulk screening','Tail-number watchlist','Core API access','Overage €19 per report'] },

  { key:'ACQUIRE_DESK', line:'acquire', name:'Acquire Desk', type:'subscription', price_eur:890, currency:'eur', interval:'month', publish:'fixed', icon:'Crown',
    seats:3, report_allowance:100, overage_eur:19, effective_per_report_eur:8.90,
    tagline:'A desk screening a hundred aircraft a month.',
    features:['3 seats','100 ATI Reports per month','Bulk screening','Tail-number watchlist','Core API access','Overage €19 per report'] },

  { key:'ACQUIRE_FIRM', line:'acquire', name:'Acquire Firm', type:'subscription', price_eur:2490, currency:'eur', interval:'month', publish:'from', icon:'Building',
    seats:10, report_allowance:400, overage_eur:19, effective_per_report_eur:6.22,
    tagline:'A firm running continuous acquisition screening.',
    features:['10 seats','400 ATI Reports per month','Bulk screening','Tail-number watchlist','Core API access','Overage €19 per report'] },

  // — ABOS Trade Desk ——————————————————————————————————————————————
  { key:'ACQUISITION_PACK', line:'trade_desk', name:'Acquisition Pack', type:'one_time', price_eur:2450, currency:'eur', publish:'fixed', icon:'FileBarChart',
    aircraft_scoped:true, hull_value_band:'500k_2m', hull_value_label:'€500k–2M',
    tagline:'Everything ABOS knows about one airframe, in one output.',
    features:['ATI Report','OMVM valuation','Verification Pack','Investment Brief','CAPEX, OPEX, engine overhaul and MRO models'] },

  { key:'ACQUISITION_PACK_PLUS', line:'trade_desk', name:'Acquisition Pack Plus', type:'one_time', price_eur:4900, currency:'eur', publish:'fixed', icon:'FileBarChart',
    aircraft_scoped:true, hull_value_band:'above_2m', hull_value_label:'above €2M',
    tagline:'The same scope, priced for the larger transaction.',
    features:['ATI Report','OMVM valuation','Verification Pack','Investment Brief','CAPEX, OPEX, engine overhaul and MRO models'] },

  { key:'TRADE_DESK', line:'trade_desk', name:'Trade Desk', type:'subscription', price_eur:2900, currency:'eur', interval:'month', publish:'from', icon:'Building', seats:5,
    tagline:'Unlimited analysis for a dealer buying on its own account.',
    features:['Unlimited acquisition analysis','5 seats','Bulk screening','Core API access'] },

  { key:'TRADE_DESK_ENTERPRISE', line:'trade_desk', name:'Trade Desk Enterprise', type:'subscription', price_eur:5900, currency:'eur', interval:'month', publish:'from', icon:'Building',
    tagline:'Several entities under one agreement.',
    features:['Everything in Trade Desk','Multiple entities','SSO','Contracted SLA'] },

  // — ABOS Embed ——————————————————————————————————————————————————
  { key:'EMBED_SANDBOX', line:'embed', name:'Embed Sandbox', type:'subscription', price_eur:0, free:true, currency:'eur', interval:'month', publish:'fixed', icon:'Crown',
    call_allowance:500,
    tagline:'Try it on a Friday evening, before anyone signs anything.',
    features:['500 API calls per month','ATI Score and search endpoints','No card required'] },

  { key:'EMBED_LAUNCH', line:'embed', name:'Embed Launch', type:'subscription', price_eur:149, currency:'eur', interval:'month', publish:'fixed', icon:'Crown',
    call_allowance:5000, overage_eur_per_call:0.017, implementation_fee_eur:0,
    tagline:'A snippet, not a project.',
    features:['5,000 API calls per month','Drop-in snippet','ATI Score and search endpoints','No implementation fee'] },

  { key:'EMBED_GROWTH', line:'embed', name:'Embed Growth', type:'subscription', price_eur:690, currency:'eur', interval:'month', publish:'from', icon:'Building',
    call_allowance:50000, overage_eur_per_call:0.017, implementation_fee_eur:2500,
    tagline:'Verified listings across a live marketplace.',
    features:['50,000 API calls per month','ATI Report and valuation endpoints','Usage monitoring','Integration support'] },

  { key:'EMBED_SCALE', line:'embed', name:'Embed Scale', type:'subscription', price_eur:2490, currency:'eur', interval:'month', publish:'from', icon:'Building',
    call_allowance:250000, overage_eur_per_call:0.017, implementation_fee_eur:2500,
    tagline:'Marketplace-wide verification.',
    features:['250,000 API calls per month','Full Core API capability set','Usage monitoring','Integration support'] },

  { key:'EMBED_ENTERPRISE', line:'embed', name:'Embed Enterprise', type:'contract', price_eur:5900, currency:'eur', interval:'month', publish:'from', icon:'Building',
    tagline:'Above 250,000 calls, or revenue share instead of per-call.',
    features:['Custom call volume','Revenue share available (20–30%)','Dedicated onboarding','Contracted support / SLA'] },
];

// Per-call rate implied by each Embed tier's allowance, for the pricing table.
export const EMBED_RATE_PER_CALL = { EMBED_LAUNCH: 0.0298, EMBED_GROWTH: 0.0138, EMBED_SCALE: 0.0100 };
export const EMBED_OVERAGE_EUR_PER_CALL = 0.017;
export const EMBED_IMPLEMENTATION_FEE_EUR = 2500;

export const SUB_INCLUDED = {};
export const SUB_DISCOUNT = {};

export function getProduct(key){ return PRODUCT_CATALOG.find(p => p.key === key); }
export function productsInLine(line){ return PRODUCT_CATALOG.filter(p => p.line === line); }

export const SINGLE_AIRCRAFT_PRODUCTS = productsInLine('single_aircraft');
export const ACQUIRE_PRODUCTS = productsInLine('acquire');
export const TRADE_DESK_PRODUCTS = productsInLine('trade_desk');
export const EMBED_PRODUCTS = productsInLine('embed');

export const ONE_TIME_PRODUCTS = PRODUCT_CATALOG.filter(p => p.type === 'one_time');
export const SUBSCRIPTION_PRODUCTS = PRODUCT_CATALOG.filter(p => p.type === 'subscription');
export const API_PRODUCTS = EMBED_PRODUCTS;

/** One-time products scoped to a tail number. Checkout MUST collect a registration
 *  for these — stripeWebhook refuses the entitlement without one and the payment
 *  is marked `ignored`, meaning the customer pays and receives nothing. */
export const AIRCRAFT_SCOPED_KEYS = PRODUCT_CATALOG.filter(p => p.aircraft_scoped).map(p => p.key);
export function isAircraftScoped(key){ return AIRCRAFT_SCOPED_KEYS.includes(key); }

/** Picks the Trade Desk band for a hull value in EUR. Below €500k the answer is
 *  ATI Pro, not a pack — the pack's price only makes sense against a pre-buy
 *  inspection the buyer was going to pay for anyway. */
export function packForHullValue(valueEur){
  if (!Number.isFinite(valueEur)) return null;
  if (valueEur < 500_000) return getProduct('ATI_PRO');
  if (valueEur <= 2_000_000) return getProduct('ACQUISITION_PACK');
  return getProduct('ACQUISITION_PACK_PLUS');
}

export function formatPrice(amount, currency = 'eur'){
  return `${currency === 'usd' ? '$' : '€'}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
export function formatEur(amount){ return formatPrice(amount, 'eur'); }

export function productAmount(product){
  if (!product) return null;
  return product.price_usd ?? product.price_eur ?? null;
}

/** The display string, including the "from" prefix where the tier is negotiated. */
export function formatProductPrice(product){
  if (!product) return '';
  if (product.free) return 'Free';
  const amount = productAmount(product);
  if (amount == null) return '';
  const formatted = formatPrice(amount, product.currency || 'eur');
  const suffix = product.interval ? `/${product.interval}` : '';
  return product.publish === 'from' ? `from ${formatted}${suffix}` : `${formatted}${suffix}`;
}

export function effectivePrice(key){
  const p = getProduct(key);
  if (!p) return null;
  const amount = productAmount(p);
  return { amount, currency: p.currency || 'eur', included: false, original_amount: amount, discount_pct: 0 };
}
