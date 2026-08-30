// ABOS Agent monetization: subscription-first + usage wallet + one-time actions.
import { ABOS_FLIGHT_PLANS, ABOS_FLIGHT_PACKS, ABOS_TIME_POLICIES, ABOS_CREDIT_COSTS } from './abosFlightPlans';
export const ABOS_ACTIONS = {
  ATI_REPORT: { label: 'ATI Full Verification', price: 39, currency: 'USD', product: 'ATI_REPORT', unit: 'aircraft', repeatable: true },
  DEAL_ANALYSIS: { label: 'Deal Analysis', price: 99, currency: 'USD', product: 'DEAL_ANALYSIS', unit: 'aircraft', repeatable: true },
  INVESTMENT_BRIEF: { label: 'Investment Brief', price: 149, currency: 'USD', product: 'INVESTMENT', unit: 'aircraft', repeatable: true },
  PROFESSIONAL_REVIEW: { label: 'Professional Review', price: 499, currency: 'USD', product: 'PROFESSIONAL', unit: 'aircraft', repeatable: true },
  VISION_INSPECTION: { label: 'AI Vision Inspection', price: 49, currency: 'USD', product: 'PROFESSIONAL', unit: 'inspection_session', repeatable: true },
  DOCUMENT_ANALYSIS: { label: 'Logbook & Document Analysis', price: 39, currency: 'USD', product: 'ATI_REPORT', unit: 'document_set', repeatable: true },
  MARKET_REPORT: { label: 'Market Report', price: 15, currency: 'USD', product: 'INVESTMENT', unit: 'aircraft', repeatable: true },
};

export function getAction(actionId) { return ABOS_ACTIONS[actionId] || null; }
export function actionPrice(actionId) { return getAction(actionId)?.price ?? null; }

// UI/backend contract: the action must be authorized before execution.
export function getActionState(actionId, context = {}) {
  const action = getAction(actionId);
  if (!action) return { state: 'unknown' };
  const entitlement = context.entitlements?.[action.product] === true;
  if (entitlement) return { state: 'included', action };
  if (context.paidActionAccess?.includes?.(actionId)) return { state: 'included', action };
  return { state: 'paywall', action };
}

export const ABOS_FREE_ACTIONS = [
  'IDENTIFY_AIRCRAFT',
  'REGISTRY_LOOKUP',
  'BASIC_IDENTITY',
  'BASIC_OMVM',
  'MARKET_DISCOVERY',
];

export const ABOS_ACTION_POLICY = {
  conversation: 'unmetered',
  free_data: 'free',
  paid_capabilities: 'wallet_or_one_time',
  token_metering: false,
  subscription_first: true,
};

export function getFlightPlan(id) { return ABOS_FLIGHT_PLANS[id] || ABOS_FLIGHT_PLANS.freeflight; }
export function getFlightPack(id) { return ABOS_FLIGHT_PACKS.find(p => p.id === id) || null; }
export function getTimePolicy(key) { return ABOS_TIME_POLICIES[key] || null; }
export function creditCost(action) { return ABOS_CREDIT_COSTS[action] ?? null; }
