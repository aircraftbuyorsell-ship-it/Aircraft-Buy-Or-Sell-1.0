import { Check, LockKeyhole, Mail, Sparkles, ArrowRight, BadgeCheck } from "lucide-react";

const TIERS = [
  {
    key: "ATI_REPORT",
    name: "ATI Report",
    price: 39,
    tagline: "Verify before you buy.",
    features: [
      "Aircraft identity & provenance",
      "Registry and verification signals",
      "History and risk indicators",
      "Data gaps and confidence",
      "Sources and methodology",
    ],
  },
  {
    key: "DEAL_ANALYSIS",
    name: "Deal Analysis",
    price: 99,
    tagline: "Know if it's actually a good deal.",
    features: [
      "Everything in ATI Report",
      "Market valuation & comparables",
      "Deal score and price position",
      "Risk and negotiation analysis",
      "Buy / negotiate / review / pass guidance",
    ],
    highlight: true,
  },
  {
    key: "INVESTMENT",
    name: "Investment",
    price: 149,
    tagline: "Understand ownership economics.",
    features: [
      "Complete Deal Analysis",
      "CAPEX / OPEX economics",
      "Ownership and financing scenarios",
      "Investment risk assessment",
      "3–5 year ownership outlook",
    ],
  },
];

function fmt(amount) {
  return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function TierCard({ tier, state, loading, onPurchase }) {
  const entitled = state?.entitled;
  const upgrade = state?.upgrade;
  const checkoutPrice = state?.checkout_price_usd ?? tier.price;
  const hasDiscount = checkoutPrice < tier.price;

  return (
    <div
      className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition ${
        tier.highlight ? "border-[#c99635]/60 ring-1 ring-[#c99635]/30" : "border-[#102033]/10"
      }`}
    >
      {tier.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c99635] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
          Most popular
        </span>
      )}
      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#a87925]">{tier.name}</div>
      <div className="mt-2 flex items-end gap-2">
        {entitled ? (
          <span className="flex items-center gap-1.5 text-2xl font-black text-emerald-600">
            <BadgeCheck className="h-6 w-6" /> Owned
          </span>
        ) : (
          <>
            <span className="text-3xl font-black tracking-tight">{fmt(checkoutPrice)}</span>
            {hasDiscount && <span className="mb-1 text-sm font-bold text-[#102033]/40 line-through">{fmt(tier.price)}</span>}
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-[#102033]/55">{tier.tagline}</p>

      {upgrade && !entitled && (
        <div className="mt-3 rounded-xl border border-[#c99635]/30 bg-[#c99635]/[0.06] px-3 py-2 text-[10px] font-semibold text-[#a87925]">
          You own {upgrade.from_name}. Upgrade now — pay only the difference{upgrade.discount_pct > 0 ? ` − ${Math.round(upgrade.discount_pct * 100)}% loyalty` : ""}.
        </div>
      )}

      <ul className="mt-4 flex-1 space-y-2">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-[#102033]/70">
            <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-600" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => onPurchase(tier.key)}
        disabled={entitled || loading}
        className={`mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          entitled ? "bg-emerald-600" : "bg-[#c99635] hover:bg-[#b8862a]"
        }`}
      >
        {entitled ? (
          <>
            <BadgeCheck className="h-4 w-4" /> Delivered to your email
          </>
        ) : (
          <>
            <LockKeyhole className="h-4 w-4" /> {loading ? "Opening…" : `Get ${tier.name}`} <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}

export default function AdvisorPricingTiers({ registration, tiers, loadingTier, onPurchase, justPaid }) {
  return (
    <div className="mt-8">
      {justPaid ? (
        <div className="mb-6 flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <Mail className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
          <div>
            <h3 className="text-sm font-black text-emerald-800">Payment received — your report is on its way.</h3>
            <p className="mt-1 text-xs text-emerald-700/80">
              We're compiling your verification report for <b>{registration}</b> and will email it to you within a few minutes.
              You can also reopen it any time from <b>My Reports</b>.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-3 rounded-3xl border border-[#c99635]/40 bg-white p-5 shadow-sm">
          <Sparkles className="mt-0.5 h-5 w-5 flex-none text-[#c99635]" />
          <div>
            <h3 className="text-sm font-black">Free preview ends here</h3>
            <p className="mt-1 text-xs text-[#102033]/55">
              You've seen the public registry evidence. Pick a report below to unlock the full analysis — compiled and
              <span className="font-semibold text-[#a87925]"> delivered to your email</span>. Own a report already? Upgrade and pay only the difference, minus a loyalty discount.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <TierCard
            key={tier.key}
            tier={tier}
            state={tiers[tier.key]}
            loading={loadingTier === tier.key}
            onPurchase={onPurchase}
          />
        ))}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-[#102033]/45">
        <Mail className="h-3.5 w-3.5" /> Every report is compiled into a PDF and emailed to you after payment. One-time purchase per aircraft.
      </p>
    </div>
  );
}