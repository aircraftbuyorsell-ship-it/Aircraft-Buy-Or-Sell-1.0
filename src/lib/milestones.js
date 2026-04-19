// Single source of truth for reward milestones.
// 1 token = 5 displayed credits (see lib/pricing.js)

export const MILESTONES = {
  referral_verified: {
    credits: 250,
    tokens: 50,
    label: "Verified referral",
    description: "A friend you invited completed paid verification.",
  },
  ati_score_90: {
    credits: 100,
    tokens: 20,
    label: "ATI 90+ score",
    description: "One of your listings reached an ATI score of 90 or higher.",
  },
  ati_score_95: {
    credits: 250,
    tokens: 50,
    label: "ATI 95+ elite score",
    description: "Your listing reached elite ATI status (95+) — top-tier transparency.",
  },
  first_ati_passport: {
    credits: 50,
    tokens: 10,
    label: "First ATI Passport",
    description: "You generated your first ATI Score Card.",
  },
  first_escrow: {
    credits: 50,
    tokens: 10,
    label: "First Escrow",
    description: "You opened your first escrow transaction.",
  },
};

export const MILESTONE_LIST = Object.entries(MILESTONES).map(([id, m]) => ({ id, ...m }));