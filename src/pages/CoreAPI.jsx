import { useState } from "react";
import { Check, Zap } from "lucide-react";
import PlanCheckoutButton from "@/components/plans/PlanCheckoutButton";

export default function CoreAPI() {
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const valueProps = [
    {
      title: "Chat-First Search",
      description: "Natural language queries power intelligent listing discovery — let buyers find aircraft by intent, not filters.",
    },
    {
      title: "Market Intelligence",
      description: "Real-time aggregates: median prices, ATI score trends, and days-on-market across your listing pool.",
    },
    {
      title: "Aircraft Scoring",
      description: "ATI Score (0–100) contextualizes condition and age — buyers see comparable value at a glance.",
    },
    {
      title: "Professional Valuations",
      description: "OMVM market range on any aircraft — confidence-scored and backed by real transaction data.",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "€690",
      period: "per month",
      description: "Essential APIs for search and scoring",
      trial: "14-day free trial",
      features: [
        "Search and natural language queries",
        "ATI Score (basic assessment)",
        "Market intelligence (aggregates)",
        "Up to 60 requests/minute",
        "Up to 10,000 requests/day",
        "Email support",
      ],
      cta: "Start 14-day Trial",
      planType: "wl_starter",
      color: "rgba(100, 200, 255, 0.1)",
      borderColor: "#64C8FF",
    },
    {
      name: "Professional",
      price: "€1,890",
      period: "per month",
      description: "Full-featured platform for dealers and partners",
      trial: "14-day free trial",
      features: [
        "Everything in Starter, plus:",
        "Detailed ATI reports with expert analysis",
        "Aircraft valuations (OMVM)",
        "Professional insights and recommendations",
        "Up to 300 requests/minute",
        "Up to 100,000 requests/day",
        "Priority support",
        "Custom branding options",
      ],
      cta: "Start 14-day Trial",
      planType: "wl_professional",
      color: "rgba(245, 194, 66, 0.1)",
      borderColor: "#F5C242",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "Unlimited access and dedicated support",
      trial: null,
      features: [
        "Unlimited API requests",
        "White-label infrastructure",
        "Custom integration support",
        "SLA guarantees",
        "Dedicated account manager",
        "Advanced analytics and reporting",
      ],
      cta: "Contact Sales",
      planType: "enterprise",
      color: "rgba(100, 200, 100, 0.1)",
      borderColor: "#64C864",
    },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-8 pt-10 pb-24" style={{ color: "#fff" }}>
      <div className="max-w-[1200px] mx-auto">
        {/* Hero Section */}
        <div className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(100, 200, 255, 0.09)", border: "0.5px solid rgba(100, 200, 255, 0.22)" }}>
            <Zap size={12} style={{ color: "#64C8FF" }} />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: "#64C8FF" }}>
              White-Label Platform
            </span>
          </div>
          <h1 className="tracking-[-0.03em] leading-[1.1] mb-5" style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 600 }}>
            The <span style={{ color: "#64C8FF", fontWeight: 700 }}>Aircraft Intelligence</span> API
          </h1>
          <p className="text-[16px] leading-relaxed max-w-[700px] mx-auto mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
            White-label search, scoring, and valuation for aviation marketplaces. Give your buyers and dealers instant intelligence backed by ABOS data.
          </p>
        </div>

        {/* Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {valueProps.map((prop, i) => (
            <div key={i} className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-[16px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.92)" }}>
                {prop.title}
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
                {prop.description}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing Section */}
        <div className="mb-20">
          <h2 className="text-[32px] font-bold text-center mb-3" style={{ color: "rgba(255,255,255,0.92)" }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-[16px] text-center mb-12" style={{ color: "rgba(255,255,255,0.60)" }}>
            Try for free with a 14-day trial. No credit card required for Starter and Professional plans.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className="rounded-2xl p-8 transition-all relative"
                style={{
                  background: plan.color,
                  border: `2px solid ${plan.borderColor}`,
                  transform: hoveredPlan === i ? 'translateY(-8px)' : 'translateY(0)',
                  boxShadow: hoveredPlan === i ? `0 20px 40px ${plan.borderColor}40` : 'none',
                  zIndex: plan.highlighted ? 1 : 0,
                  scale: plan.highlighted ? 1.05 : 1,
                }}
                onMouseEnter={() => setHoveredPlan(i)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <span className="px-3 py-1 rounded-full text-[12px] font-bold tracking-[0.1em] uppercase"
                      style={{ background: plan.borderColor, color: "#000" }}>
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-[20px] font-bold mb-1" style={{ color: plan.borderColor }}>
                  {plan.name}
                </h3>
                <p className="text-[14px] mb-6" style={{ color: "rgba(255,255,255,0.60)" }}>
                  {plan.description}
                </p>

                <div className="mb-6">
                  <div className="text-[32px] font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>
                    {plan.price}
                  </div>
                  <div className="text-[14px]" style={{ color: "rgba(255,255,255,0.60)" }}>
                    {plan.period}
                  </div>
                  {plan.trial && (
                    <div className="text-[12px] mt-2" style={{ color: plan.borderColor }}>
                      {plan.trial}
                    </div>
                  )}
                </div>

                <PlanCheckoutButton
                  planType={plan.planType}
                  label={plan.cta}
                  returnUrl="/partner-portal"
                  style={{
                    width: "100%",
                    marginBottom: "24px",
                    backgroundColor: plan.highlighted ? plan.borderColor : "transparent",
                    color: plan.highlighted ? "#000" : plan.borderColor,
                    border: `1px solid ${plan.borderColor}`,
                    borderRadius: "0.75rem",
                    padding: "10px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                />

                <div className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3">
                      {!feature.includes("Everything in") && !feature.includes("plus:") && (
                        <Check size={16} style={{ color: plan.borderColor, marginTop: 2, flexShrink: 0 }} />
                      )}
                      <span className="text-[14px]" style={{
                        color: feature.includes("Everything") || feature.includes("plus:") ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0.82)",
                        fontWeight: feature.includes("Everything") || feature.includes("plus:") ? 500 : 400,
                      }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-12 px-6 rounded-2xl"
          style={{ background: "rgba(100, 200, 255, 0.06)", border: "1px solid rgba(100, 200, 255, 0.14)" }}>
          <h3 className="text-[20px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.92)" }}>
            Ready to get started?
          </h3>
          <p className="text-[14px] mb-6" style={{ color: "rgba(255,255,255,0.60)" }}>
            Trial includes access to the full platform. Upgrade or cancel anytime.
          </p>
          <p className="text-[13px] italic" style={{ color: "rgba(255,255,255,0.50)" }}>
            Questions? Reach out to <a href="mailto:partners@aircraft-buy-or-sell.com" style={{ color: "#64C8FF" }}>partners@aircraft-buy-or-sell.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
