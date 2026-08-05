export const FINDERS_FEE_TIERS = [
  { min: 0, max: 99999, percent: 2.5, cap: 2475 },
  { min: 100000, max: 499999, percent: 1.5, cap: 7485 },
  { min: 500000, max: 999999, percent: 1, cap: 9990 },
  { min: 1000000, max: Infinity, percent: 0.5, cap: null },
];

export function calculateFindersFee(askingPrice = 0) {
  const price = Number(askingPrice) || 0;
  const tier = FINDERS_FEE_TIERS.find((item) => price >= item.min && price <= item.max) || FINDERS_FEE_TIERS[0];
  const rawFee = price * (tier.percent / 100);
  return { ...tier, fee: tier.cap ? Math.min(rawFee, tier.cap) : rawFee };
}

export function trialRemaining(expiresAt) {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 86400000));
}