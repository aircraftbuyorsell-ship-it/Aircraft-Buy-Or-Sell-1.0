import { Link } from "react-router-dom";
import { Sparkles, CheckCircle2, ArrowRight, Zap, TrendingUp } from "lucide-react";
import { FEATURE_PRICING, SUBSCRIPTION_TIERS } from "@/lib/monetization";

/**
 * MonetizationCTA — call-to-action band that wraps featured tools
 * with the hybrid credit/fiat pricing model.
 * Shows full prices to anonymous users, discounts after registration.
 */
export default function MonetizationCTA({ user }) {
  const isRegistered = !!user?.email;
  const tier = user?.subscription_tier || "free";

  // Featured paid tools to showcase
  const featuredTools = [
    FEATURE_PRICING.ati_quick_score,
    FEATURE_PRICING.opex_calculator,
    FEATURE_PRICING.ati_full_report,
    FEATURE_PRICING.aircraft_tracking,
  ];

  const proTier = SUBSCRIPTION_TIERS.find((t) => t.id === "pro");

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 md:px-8 py-6">
      {/* Main CTA band */}
      <div
        className="rounded-3xl p-6 md:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(245,194,66,0.08) 0%, rgba(78,142,247,0.06) 50%, rgba(168,85,247,0.05) 100%)",
          border: "0.5px solid rgba(245,194,66,0.20)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(245,194,66,0.10) 0%, transparent 70%)" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: "#f5c242" }} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "#f5c242" }}>
              Unlock Premium Intelligence
            </span>
          </div>

          <h2
            className="text-xl md:text-2xl font-black tracking-tight mb-2"
            style={{ color: "rgba(255,255,255,0.90)" }}
          >
            {isRegistered ? "Your Aviation Intelligence Toolkit" : "Get Full Aviation Intelligence — Save 30% Today"}
          </h2>

          <p className="text-sm mb-5 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
            {isRegistered
              ? "Use credits for every analysis or upgrade to Pro for unlimited access."
              : "Register free to unlock member pricing. Or pay-per-use with transparent fiat pricing (1.3× credit rate)."}
          </p>

          {/* Featured tool pricing grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {featuredTools.map((tool, i) => {
              const featureId = Object.keys(FEATURE_PRICING).find((k) => FEATURE_PRICING[k] === tool);
              const showMemberPrice = isRegistered && tool.member_price_eur;
              return (
                <div
                  key={i}
                  className="rounded-xl p-3 flex flex-col"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "rgba(255,255,255,0.50)" }}>
                    {tool.label}
                  </p>
                  {tool.free ? (
                    <p className="text-lg font-black" style={{ color: "#5dcaa5" }}>Free</p>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      {showMemberPrice && tool.list_price_eur && (
                        <span className="text-[10px] line-through" style={{ color: "rgba(255,255,255,0.30)" }}>
                          €{tool.list_price_eur}
                        </span>
                      )}
                      <span className="text-lg font-black" style={{ color: showMemberPrice ? "#5dcaa5" : "rgba(255,255,255,0.90)" }}>
                        €{showMemberPrice ? tool.member_price_eur : tool.fiat_eur}
                      </span>
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        or {tool.credits} cr
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] mt-1 line-clamp-2" style={{ color: "rgba(255,255,255,0.40)" }}>
                    {tool.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!isRegistered ? (
              <Link
                to="/pricing"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-opacity hover:opacity-90"
                style={{ background: "#f5c242", color: "#04060a" }}
              >
                Register Free — Save 30% <ArrowRight className="w-4 h-4" />
              </Link>
            ) : tier === "free" ? (
              <Link
                to="/pricing"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-opacity hover:opacity-90"
                style={{ background: "#f5c242", color: "#04060a" }}
              >
                Upgrade to Pro — 200 credits/mo <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/skills"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-opacity hover:opacity-90"
                style={{ background: "#f5c242", color: "#04060a" }}
              >
                <Zap className="w-4 h-4" /> Use Your Credits
              </Link>
            )}
            <Link
              to="/pricing"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "transparent", color: "rgba(255,255,255,0.70)", border: "0.5px solid rgba(255,255,255,0.12)" }}
            >
              View All Pricing
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 mt-5 pt-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
            {[
              "Free registry lookup",
              "FAA + EASA verified",
              "Pay per use or subscribe",
              "Credits never expire",
            ].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" style={{ color: "#5dcaa5" }} />
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}