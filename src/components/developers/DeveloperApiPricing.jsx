import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Zap, Crown, Rocket, ArrowRight } from "lucide-react";

const PLANS = [
  {
    id: "free",
    label: "Free",
    price_eur: 0,
    icon: Zap,
    accent: "#64748b",
    tagline: "Test the waters",
    rate: "20 req/min · 500/day",
    features: [
      "20 requests / min",
      "500 requests / day",
      "Search & listing read scopes",
      "Core API endpoints",
      "Community support",
    ],
  },
  {
    id: "API_PRO",
    label: "API Pro",
    price_eur: 49,
    icon: Rocket,
    accent: "#D4A017",
    tagline: "For developers building with ABOS",
    rate: "300 req/min · 20k/day",
    popular: true,
    features: [
      "300 requests / min",
      "20,000 requests / day",
      "All API scopes (read + write)",
      "ADL & APL protocol access",
      "MCP server connectivity",
      "Webhook event delivery",
      "Integration Kit & Widget Gateway",
      "Email support",
    ],
  },
  {
    id: "API_ENTERPRISE",
    label: "API Enterprise",
    price_eur: 199,
    icon: Crown,
    accent: "#7c3aed",
    tagline: "For platforms & high-volume partners",
    rate: "Custom · Unlimited/day",
    features: [
      "Custom rate limits",
      "Unlimited daily requests",
      "All scopes + white-label",
      "ADL & APL protocol access",
      "Dedicated MCP instance",
      "Webhook + retries",
      "Multiple API keys & team management",
      "SLA & priority support",
    ],
  },
];

export default function DeveloperApiPricing() {
  const [checkoutPlan, setCheckoutPlan] = useState(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["api-status"],
    queryFn: async () => {
      const res = await base44.functions.invoke("abosEntitlements", { action: "list_api_status" });
      return res?.data ?? res;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async (productKey) => {
      const res = await base44.functions.invoke("abosEntitlements", {
        action: "create_checkout",
        product_key: productKey,
        return_url: window.location.href,
      });
      return res?.data ?? res;
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
  });

  const currentPlan = status?.api_plan || "free";
  const currentProductKey = status?.api_product_key;

  const handleSelect = (planId) => {
    if (planId === "free") return;
    if (planId === currentProductKey) return;
    setCheckoutPlan(planId);
    checkoutMutation.mutate(planId);
  };

  return (
    <div className="space-y-6">
      {/* Current plan banner */}
      {!isLoading && currentPlan !== "free" && (
        <div className="flex items-center gap-3 rounded-xl border border-[#D4A017]/20 bg-[#D4A017]/[0.06] px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4A017]/10">
            <Check className="h-4 w-4 text-[#D4A017]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">
              Active API plan: {PLANS.find((p) => p.id === currentProductKey)?.label || currentPlan}
            </p>
            <p className="text-xs text-muted-foreground">
              All your API keys are on the <span className="font-bold uppercase">{currentPlan}</span> tier.
              {status?.current_period_end && ` Renews ${new Date(status.current_period_end).toLocaleDateString()}.`}
            </p>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentProductKey || (plan.id === "free" && currentPlan === "free");
          const isCheckoutLoading = checkoutPlan === plan.id && checkoutMutation.isPending;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                plan.popular
                  ? "border-[#D4A017]/40 shadow-md shadow-[#D4A017]/10"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#D4A017] px-3 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                  Most Popular
                </span>
              )}

              <div className="mb-4 flex items-center gap-2.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${plan.accent}14`, border: `1px solid ${plan.accent}30` }}
                >
                  <Icon className="h-5 w-5" style={{ color: plan.accent }} />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-foreground">{plan.label}</h3>
                  <p className="text-[10px] text-muted-foreground">{plan.tagline}</p>
                </div>
              </div>

              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground">€{plan.price_eur}</span>
                <span className="text-xs text-muted-foreground">/mo</span>
              </div>
              <p className="mb-4 text-[11px] font-bold text-muted-foreground">{plan.rate}</p>

              <ul className="mb-5 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground/80">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: plan.accent }} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.id)}
                disabled={isCurrent || isCheckoutLoading}
                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isCurrent
                    ? "cursor-default border border-border bg-muted text-muted-foreground"
                    : plan.id === "free"
                    ? "border border-border bg-card text-foreground hover:bg-muted/60"
                    : "bg-[#D4A017] text-white shadow-sm hover:bg-[#C9A22F] disabled:opacity-60"
                }`}
              >
                {isCheckoutLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isCurrent ? "Current Plan" : plan.id === "free" ? "Default" : (
                  <>Subscribe <ArrowRight className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* What's included */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-black text-foreground">What's included in paid API plans</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FeatureBlock
            title="Core API"
            desc="Search, valuate, extract, and listings endpoints — the same contract powering the web app, ChatGPT App, and partner SDKs."
          />
          <FeatureBlock
            title="ADL — Aircraft Definition Language"
            desc="Structured manifest protocol for aircraft data exchange. Define, validate, and consume aircraft data with typed schemas."
          />
          <FeatureBlock
            title="APL — ABOS Protocol Layer"
            desc="Request/response protocol schemas for all API operations. Ensures contract consistency across all integration channels."
          />
          <FeatureBlock
            title="MCP Server"
            desc="Model Context Protocol server for AI agents — connect ChatGPT, Claude, and other AI clients to ABOS aviation intelligence."
          />
          <FeatureBlock
            title="Webhooks"
            desc="Real-time event delivery for listing changes, valuation updates, and aircraft alerts to your endpoints."
          />
          <FeatureBlock
            title="Integration Kit & Widget Gateway"
            desc="Embed ABOS intelligence into your marketplace with white-label widgets and a partner token system."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureBlock({ title, desc }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <p className="mb-1 text-xs font-bold text-foreground">{title}</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}