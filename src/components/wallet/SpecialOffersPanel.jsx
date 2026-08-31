import { Gift, Sparkles, Tag, Crown, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMonetization } from "@/hooks/useMonetization";

const SPECIAL_OFFERS = [
  {
    id: "summer2026",
    type: "sale",
    title: "Summer Special — 30% Extra Credits",
    desc: "Buy any credit bundle this month and get 30% bonus credits on top.",
    badge: "Limited Time",
    color: "#f5c242",
    icon: Tag,
    cta: "/pricing",
    ctaLabel: "Claim Bonus",
  },
  {
    id: "first_report",
    type: "gift",
    title: "First ATI Report — Free",
    desc: "New members get their first ATI Quick Score report at no cost.",
    badge: "New Members",
    color: "#5dcaa5",
    icon: Gift,
    cta: "/ati-quick-score",
    ctaLabel: "Claim Free Report",
  },
  {
    id: "referral_bonus",
    type: "benefit",
    title: "Refer & Earn 50 Credits",
    desc: "Invite a friend — when they make their first purchase, you both get 50 bonus credits.",
    badge: "Active",
    color: "#4e8ef7",
    icon: Sparkles,
    cta: "/my-account",
    ctaLabel: "Get Referral Link",
  },
];

const TIER_BENEFITS = {
  free: [
    "Free registry lookup (unlimited)",
    "Free OMVM valuation estimate",
    "1 free ATI Quick Score report",
  ],
  starter: [
    "50 credits / month included",
    "All calculators unlocked",
    "Member pricing on all reports",
    "ATI Quick Score included",
  ],
  pro: [
    "200 credits / month included",
    "Full ATI Report included",
    "Aircraft tracking (1 aircraft)",
    "Priority support",
    "Tax benefit reports",
  ],
  enterprise: [
    "500 credits / month included",
    "Unlimited tracking",
    "White-label API access",
    "Dedicated account manager",
    "Custom branding",
  ],
};

export default function SpecialOffersPanel({ user }) {
  const { tier } = useMonetization();
  const currentTier = tier || "free";
  const benefits = TIER_BENEFITS[currentTier] || TIER_BENEFITS.free;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      {/* Tier benefits */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(245,194,66,0.12)", border: "0.5px solid rgba(245,194,66,0.25)" }}
        >
          <Crown className="w-4 h-4" style={{ color: "#f5c242" }} />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "rgba(255,255,255,0.40)" }}>
            Your Tier Benefits
          </p>
          <p className="text-sm font-black capitalize chrome-text">
            {currentTier.replace("_", " ")} Plan
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 mb-5">
        {benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.70)" }}>
            <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" style={{ color: "#5dcaa5" }} />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* Special offers */}
      <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>
        Special Offers & Gifts
      </p>
      <div className="space-y-2.5">
        {SPECIAL_OFFERS.map((offer) => {
          const Icon = offer.icon;
          return (
            <div
              key={offer.id}
              className="rounded-xl p-3 flex items-start gap-3"
              style={{
                background: `${offer.color}08`,
                border: `0.5px solid ${offer.color}20`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${offer.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: offer.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-bold truncate" style={{ color: "rgba(255,255,255,0.90)" }}>
                    {offer.title}
                  </p>
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: `${offer.color}15`, color: offer.color }}
                  >
                    {offer.badge}
                  </span>
                </div>
                <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {offer.desc}
                </p>
                <Link
                  to={offer.cta}
                  className="inline-flex items-center gap-1 text-[11px] font-bold mt-1.5 transition-opacity hover:opacity-80"
                  style={{ color: offer.color }}
                >
                  {offer.ctaLabel} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}