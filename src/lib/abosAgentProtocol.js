// ABOS Agent Protocol: ADL describes state/entities; APL describes executable actions.
export const ADL_ENTITIES = Object.freeze({
  AIRCRAFT: 'Aircraft', AIRCRAFT_TWIN: 'AircraftTwin', VERIFICATION: 'VerificationSession',
  EVIDENCE: 'Evidence', ATI: 'ATI', VALUATION: 'Valuation', LISTING: 'Listing',
  BUYER: 'Buyer', SELLER: 'Seller', MATCH: 'BuyerMatch', TRANSACTION: 'Transaction',
  PIPELINE: 'Pipeline', DEAL_ROOM: 'DealRoom', DOCUMENT: 'Document', EXPERT_REVIEW: 'ExpertReview',
});

export const APL_ACTIONS = Object.freeze({
  IDENTIFY_AIRCRAFT: 'IDENTIFY_AIRCRAFT', VERIFY_AIRCRAFT: 'VERIFY_AIRCRAFT', VERIFY_REGISTRY: 'VERIFY_REGISTRY',
  VERIFY_IDENTITY: 'VERIFY_IDENTITY', VERIFY_OWNERSHIP: 'VERIFY_OWNERSHIP', VERIFY_ACTIVITY: 'VERIFY_ACTIVITY',
  VERIFY_SERVICE: 'VERIFY_SERVICE', VERIFY_DOCUMENTS: 'VERIFY_DOCUMENTS', CALCULATE_ATI: 'CALCULATE_ATI',
  CALCULATE_OMVM: 'CALCULATE_OMVM', ANALYSE_DEAL: 'ANALYSE_DEAL', FIND_BUYERS: 'FIND_BUYERS',
  COMPARE_AIRCRAFT: 'COMPARE_AIRCRAFT', CREATE_TRANSACTION: 'CREATE_TRANSACTION', ADVANCE_PIPELINE: 'ADVANCE_PIPELINE',
  OPEN_DEAL_ROOM: 'OPEN_DEAL_ROOM', REQUEST_PREBUY: 'REQUEST_PREBUY', PREPARE_CLOSING: 'PREPARE_CLOSING',
});

export const WORKFLOW_STAGES = Object.freeze(['identify','verify','analyse','match','transact','close']);

// ADL runtime registry: one master conversational agent, with four governed
// specialist domains behind it. These are roles/capability owners, not competing
// chatbots. St. Elmo delegates execution through APL capabilities below.
export const ADL_AGENTS = Object.freeze({
  MASTER: { id: 'abos.agent.st-elmo', type: 'agent', autonomy: 'A2', trust: 'APL-T2', audit: 'APL-A2', status: 'verified' },
  VERIFICATION: { id: 'abos.agent.verification', type: 'agent', autonomy: 'A2', trust: 'APL-T2', audit: 'APL-A2', status: 'verified' },
  INTELLIGENCE: { id: 'abos.agent.intelligence', type: 'agent', autonomy: 'A2', trust: 'APL-T2', audit: 'APL-A2', status: 'verified' },
  MARKETSPACE: { id: 'abos.agent.marketspace', type: 'agent', autonomy: 'A2', trust: 'APL-T2', audit: 'APL-A2', status: 'verified' },
  DEAL: { id: 'abos.agent.deal', type: 'agent', autonomy: 'A1', trust: 'APL-T2', audit: 'APL-A2', status: 'verified' },
});

/** Deterministic ADL-safe fallback when the reasoning model returns no executable plan. */
export function buildAPLPlan(request, { registration = null } = {}) {
  const text = String(request || '').toLowerCase();
  const plan = [];
  const isDefinition = /\b(what is|what's|define|definition of|explain|meaning of|tell me about|how does)\b/i.test(text);
  const hasAircraftContext = Boolean(registration) || /\b(n[- ]?reg|registration|tail number|aircraft|plane|serial number|listing)\b/i.test(text);
  // Pure definitions/explanations never trigger aircraft operations.
  if (isDefinition && !hasAircraftContext) return [];
  if (registration) plan.push(APL_ACTIONS.IDENTIFY_AIRCRAFT);
  if (/\b(registry|n[- ]?reg|ownership|owner|serial|verification|verify|maintenance|service|activity|traffic|document)/i.test(text)) {
    plan.push(APL_ACTIONS.VERIFY_AIRCRAFT);
  }
  if (/\b(ati|transparency)/i.test(text) && hasAircraftContext) plan.push(APL_ACTIONS.CALCULATE_ATI);
  if (/\b(value|valuation|worth|price|omvm|market value)/i.test(text)) plan.push(APL_ACTIONS.CALCULATE_OMVM);
  if (/\b(deal|compare|undervalued|market|listing)/i.test(text)) plan.push(/\bcompare\b/i.test(text) ? APL_ACTIONS.COMPARE_AIRCRAFT : APL_ACTIONS.ANALYSE_DEAL);
  if (/\b(buyer|buyers|match|sell)/i.test(text)) plan.push(APL_ACTIONS.FIND_BUYERS);
  if (/\b(pre[- ]?buy|inspection)/i.test(text)) plan.push(APL_ACTIONS.REQUEST_PREBUY);
  if (/\b(transaction|purchase|offer|closing|deal room)/i.test(text)) plan.push(APL_ACTIONS.CREATE_TRANSACTION);
  return [...new Set(plan)];
}

export function capabilityOwner(capability) {
  if ([APL_ACTIONS.VERIFY_AIRCRAFT, APL_ACTIONS.VERIFY_REGISTRY, APL_ACTIONS.VERIFY_IDENTITY, APL_ACTIONS.VERIFY_OWNERSHIP, APL_ACTIONS.VERIFY_ACTIVITY, APL_ACTIONS.VERIFY_SERVICE, APL_ACTIONS.VERIFY_DOCUMENTS, APL_ACTIONS.REQUEST_PREBUY].includes(capability)) return ADL_AGENTS.VERIFICATION.id;
  if ([APL_ACTIONS.CALCULATE_ATI, APL_ACTIONS.CALCULATE_OMVM].includes(capability)) return ADL_AGENTS.INTELLIGENCE.id;
  if ([APL_ACTIONS.ANALYSE_DEAL, APL_ACTIONS.COMPARE_AIRCRAFT, APL_ACTIONS.FIND_BUYERS].includes(capability)) return ADL_AGENTS.MARKETSPACE.id;
  if ([APL_ACTIONS.CREATE_TRANSACTION, APL_ACTIONS.ADVANCE_PIPELINE, APL_ACTIONS.OPEN_DEAL_ROOM, APL_ACTIONS.PREPARE_CLOSING].includes(capability)) return ADL_AGENTS.DEAL.id;
  return ADL_AGENTS.MASTER.id;
}

export function buildAgentWorkflow({ aircraft = null, verification = null, marketspace = null, transaction = null } = {}) {
  const stages = {
    identify: Boolean(aircraft),
    verify: Boolean(verification),
    analyse: Boolean(marketspace?.digitalTwin || marketspace?.valuation),
    match: Boolean(marketspace?.buyerMatches?.length),
    transact: Boolean(transaction),
    close: false,
  };
  const current = !stages.identify ? 'identify' : !stages.verify ? 'verify' : !stages.analyse ? 'analyse' : !stages.match ? 'match' : !stages.transact ? 'transact' : 'close';
  return { stages, current, next: current === 'identify' ? APL_ACTIONS.IDENTIFY_AIRCRAFT : current === 'verify' ? APL_ACTIONS.VERIFY_AIRCRAFT : current === 'analyse' ? APL_ACTIONS.ANALYSE_DEAL : current === 'match' ? APL_ACTIONS.FIND_BUYERS : current === 'transact' ? APL_ACTIONS.ADVANCE_PIPELINE : APL_ACTIONS.PREPARE_CLOSING };
}
