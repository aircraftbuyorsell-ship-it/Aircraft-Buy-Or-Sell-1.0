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
