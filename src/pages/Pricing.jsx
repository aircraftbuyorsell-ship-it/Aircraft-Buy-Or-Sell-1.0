import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Zap, Sparkles, Crown, Shield, ArrowRight } from "lucide-react";
import { TIERS, TOKEN_PACKS, toCredits } from "@/lib/pricing";
import { useBehavior, useAutoTrack } from "@/lib/useBehavior";
import CreditUsageTable, { CreditPricingTable } from "@/components/pricing/CreditUsageTable";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

export default function Pricing() {
  useAutoTrack("pricing");
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const { behavior, tier, track } = useBehavior();
  const discountCode = params.get("code");
  const discountPct = behavior?.active_offer?.code === discountCode ? behavior.active_offer.discount_pct : 0;

  const [processing, setProcessing] = useState(null);

  // Simulated purchase (replace with Stripe later)
  const handlePurchase = async (packOrTier) => {
    if (!behavior?.id) return;
    setProcessing(packOrTier.id);
    track("purchase_attempt", { id: packOrTier.id });

    if (packOrTier.id === "free_explorer") {
      // Verification: mark verified + grant sampler
      const newTokens = (behavior.tokens_remaining || 0) + packOrTier.tokens_included;
      await base44.entities.UserBehavior.update(behavior.id, {
        tier: "free_explorer",
        verification_paid: true,
        tokens_remaining: newTokens,
        tokens_purchased_total: (behavior.tokens_purchased_total || 0) + packOrTier.tokens_included,
      });
      await base44.entities.TokenTransaction.create({
        user_email: behavior.user_email,
        type: "purchase",
        amount: packOrTier.tokens_included,
        pack: "Free Explorer verification",
        price_usd: packOrTier.price,
        balance_after: newTokens,
      });
    } else if (packOrTier.tokens) {
      // Token pack
      const price = discountPct ? packOrTier.price_usd * (1 - discountPct / 100) : packOrTier.price_usd;
      const bonus = packOrTier.bonus_pct ? Math.round(packOrTier.tokens * packOrTier.bonus_pct / 100) : 0;
      const total = packOrTier.tokens + bonus;
      const newTokens = (behavior.tokens_remaining || 0) + total;
      await base44.entities.UserBehavior.update(behavior.id, {
        tier: tier === "free_explorer" ? "pro" : tier,
        tokens_remaining: newTokens,
        tokens_purchased_total: (behavior.tokens_purchased_total || 0) + total,
        active_offer: null,
      });
      await base44.entities.TokenTransaction.create({
        user_email: behavior.user_email,
        type: "purchase",
        amount: total,
        pack: packOrTier.name,
        price_usd: price,
        balance_after: newTokens,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["user-behavior"] });
    setProcessing(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-8 pb-6 max-w-6xl mx-auto">
        <GoldLabel>Pricing · Token-based</GoldLabel>
        <h1 className="text-3xl md:text-4xl font-black text-[#1A1814] tracking-tight mt-1">
          Pay for what you use. Never overpay.
        </h1>
        <p className="text-[#6B6560] text-sm mt-2 max-w-2xl">
          Start with a $9 verification, then buy credits as you need them. 1 credit = 1 small action (like a preview). Heavy features like full ATI Passport use ~25 credits.
        </p>

        {discountPct > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-[rgba(212,160,23,0.12)] border border-[#D4A017]/30 text-[#A67C00] text-sm font-bold rounded-full px-4 py-1.5">
            <Sparkles className="w-4 h-4" />
            {discountPct}% discount active — code {discountCode}
          </div>
        )}
      </div>

      {/* Tiers */}
      <div className="px-4 md:px-8 pb-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Explorer */}
          <TierCard
            tier={TIERS.free_explorer}
            icon={Shield}
            accent="#185FA5"
            isCurrent={tier === "free_explorer" && behavior?.verification_paid}
            processing={processing === "free_explorer"}
            onBuy={() => handlePurchase({ ...TIERS.free_explorer })}
          />

          {/* Pro — token packs inside */}
          <div className="md:col-span-1 bg-white border-2 border-[#D4A017] rounded-2xl p-6 relative shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4A017] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
              Most flexible
            </div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-[#D4A017]" />
              <GoldLabel>{TIERS.pro.tagline}</GoldLabel>
            </div>
            <h3 className="text-2xl font-black text-[#1A1814]">{TIERS.pro.name}</h3>
            <p className="text-sm text-[#6B6560] mt-1">Pick a pack, use anytime. Bonus credits on bigger packs.</p>

            <div className="mt-4 space-y-2">
              {TOKEN_PACKS.map(pack => {
                const price = discountPct ? (pack.price_usd * (1 - discountPct / 100)).toFixed(0) : pack.price_usd;
                const credits = toCredits(pack.tokens);
                const bonus = pack.bonus_pct ? Math.round(pack.tokens * pack.bonus_pct / 100) : 0;
                const bonusCredits = toCredits(bonus);
                return (
                  <button
                    key={pack.id}
                    onClick={() => handlePurchase(pack)}
                    disabled={processing === pack.id}
                    className="w-full flex items-center justify-between gap-3 p-3 bg-[#F7F4EF] hover:bg-[rgba(212,160,23,0.08)] border border-black/10 hover:border-[#D4A017] rounded-xl transition-all text-left disabled:opacity-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-black text-[#1A1814]">{pack.name}</p>
                        {pack.badge && (
                          <span className="text-[8px] uppercase tracking-wider font-bold text-[#A67C00] bg-[rgba(212,160,23,0.15)] px-1.5 py-0.5 rounded">
                            {pack.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B6560]">
                        {credits.toLocaleString()} credits
                        {bonusCredits > 0 && <span className="text-[#0F7A56] font-bold"> + {bonusCredits.toLocaleString()} bonus</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      {discountPct > 0 && (
                        <p className="text-[10px] text-[#AAA49C] line-through">${pack.price_usd}</p>
                      )}
                      <p className="text-lg font-black text-[#1A1814]">${price}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#AAA49C]" />
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-black/[0.07] space-y-1.5">
              {TIERS.pro.features.map(f => (
                <div key={f} className="flex items-start gap-2 text-[12px] text-[#6B6560]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#D4A017] shrink-0 mt-0.5" />
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Enterprise */}
          <TierCard
            tier={TIERS.enterprise}
            icon={Crown}
            accent="#1A1814"
            isCurrent={tier === "enterprise"}
            onBuy={() => window.location.href = "mailto:sales@abos.aero"}
          />
        </div>

        {/* Credit pricing + usage history */}
        <div className="mt-8 grid lg:grid-cols-2 gap-4">
          <CreditPricingTable />
          <CreditUsageTable userEmail={behavior?.user_email} />
        </div>

        {/* FAQ / trust */}
        <div className="mt-8 bg-white border border-black/[0.07] rounded-2xl p-6">
          <GoldLabel>Why token-based?</GoldLabel>
          <div className="grid md:grid-cols-3 gap-6 mt-3">
            {[
              { title: "Never overpay", body: "Pay only for what you actually use — no wasted monthly fees." },
              { title: "Credits never expire", body: "Your unused credits stay in your account forever." },
              { title: "Transparent pricing", body: "Every feature shows exactly how many credits it costs." },
            ].map(x => (
              <div key={x.title}>
                <p className="text-[13px] font-bold text-[#1A1814]">{x.title}</p>
                <p className="text-[12px] text-[#6B6560] mt-1">{x.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TierCard({ tier, icon: Icon, accent, isCurrent, processing, onBuy }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-5 h-5" style={{ color: accent }} />
        <GoldLabel>{tier.tagline}</GoldLabel>
      </div>
      <h3 className="text-2xl font-black text-[#1A1814]">{tier.name}</h3>
      <p className="text-base font-bold text-[#1A1814] mt-2">{tier.price_label}</p>

      <div className="mt-4 space-y-1.5 flex-1">
        {tier.features.map(f => (
          <div key={f} className="flex items-start gap-2 text-[12px] text-[#6B6560]">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />
            {f}
          </div>
        ))}
      </div>

      <button
        onClick={onBuy}
        disabled={isCurrent || processing}
        className="mt-5 w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-colors disabled:opacity-50"
        style={{
          backgroundColor: isCurrent ? "#F7F4EF" : accent,
          color: isCurrent ? "#6B6560" : "white",
        }}
      >
        {isCurrent ? "Current plan" : processing ? "Processing…" : tier.cta}
      </button>
    </div>
  );
}