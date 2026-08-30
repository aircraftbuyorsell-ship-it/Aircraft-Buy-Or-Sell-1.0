// ABOS Flight Plans + one-time Flight Packs.
// Public product language is subscription-first; credits are the underlying usage allowance.
export const ABOS_FLIGHT_PLANS = {
  freeflight: { id:'freeflight', name:'FreeFlight', price:0, interval:'month', monthly_credits:0, daily_basic_actions:10, personal_use:true, features:['Basic registry & aircraft identity','Basic ATI','Market discovery','Limited Agent workflows'] },
  fl060: { id:'fl060', name:'FL060 Starter', price:20, currency:'usd', interval:'month', monthly_credits:600, daily_basic_actions:null, personal_use:false, features:['Full ABOS Agent workflows','600 monthly credits','Higher usage limits','Personal aircraft research'] },
  fl170: { id:'fl170', name:'FL170 Pro', price:99, currency:'usd', interval:'month', monthly_credits:3000, daily_basic_actions:null, personal_use:false, popular:true, features:['Everything in FL060','3,000 monthly credits','Verification & intelligence workflows','Deal & buyer workflows','Priority processing'] },
  fl340: { id:'fl340', name:'FL340 Expert', price:299, currency:'usd', interval:'month', monthly_credits:10000, daily_basic_actions:null, personal_use:false, features:['Everything in FL170','10,000 monthly credits','Advanced vision & documents','Bulk workflows','Advanced market intelligence'] },
  fl450: { id:'fl450', name:'FL450 Enterprise', price:null, currency:'usd', interval:'month', monthly_credits:null, daily_basic_actions:null, personal_use:false, features:['Everything in FL340','Teams & API','Custom usage','White-label / enterprise controls'] },
};

export const ABOS_FLIGHT_PACKS = [
  { id:'flight_light', name:'Flight Pack Light (L)', price:10, currency:'usd', credits:250 },
  { id:'flight_medium', name:'Flight Pack Medium (M)', price:25, currency:'usd', credits:750 },
  { id:'flight_heavy', name:'Flight Pack Heavy (H)', price:49, currency:'usd', credits:1750 },
  { id:'flight_jumbo', name:'Flight Pack Jumbo (J)', price:99, currency:'usd', credits:4000 },
];

export const ABOS_TIME_POLICIES = {
  registry: { freshness:'24h' },
  live_traffic: { freshness:'5m', session_minutes:15, cooldown_minutes:0 },
  ownership: { freshness:'7d' },
  activity: { freshness:'24h' },
  service: { freshness:'30d' },
  market_valuation: { freshness:'24h' },
  market_report: { freshness:'7d' },
  verification: { freshness:'30d' },
  documents: { freshness:null },
  vision_inspection: { freshness:'session', session_minutes:15, cooldown_minutes:60 },
};

export const ABOS_CREDIT_COSTS = {
  listing_analysis:25, compare:25, activity_check:25, owner_check:50, dealer_intelligence:50,
  live_traffic:50, service_intelligence:75, document_analysis:100, logbook_analysis:150,
  vision_inspection:200, ati_full_verification:250, omvm:150, deal_analysis:300,
  market_report:350, investment_brief:500, buyer_matching:150, professional_review:1000,
};

export function getFlightPlan(id){ return ABOS_FLIGHT_PLANS[id] || ABOS_FLIGHT_PLANS.freeflight; }
export function getFlightPack(id){ return ABOS_FLIGHT_PACKS.find(p=>p.id===id) || null; }
export function creditCost(action){ return ABOS_CREDIT_COSTS[action] ?? null; }
