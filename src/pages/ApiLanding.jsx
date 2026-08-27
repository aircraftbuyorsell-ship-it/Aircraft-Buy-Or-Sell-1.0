import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createCheckout } from "@/lib/entitlements";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import {
  Terminal, Zap, Building2, Bot, ShieldCheck, ArrowRight, Loader2, Check, KeyRound,
} from "lucide-react";

/**
 * Public front door for aircraftbuyorsell.com/api.
 *
 * This replaced a page that shipped full endpoint documentation, an OpenAPI
 * spec link and a live API-key panel to every anonymous visitor. That
 * content still exists — it moved to the Developer Portal (/developers) and
 * the full reference (/developers/core-api), both of which now require a
 * signed-in account. What belongs on the public marketing page is the pitch
 * and the price, not the internals.
 */

const VALUE_PROPS = [
  {
    icon: Zap,
    title: "Brokers & dealers",
    text: "Bring ABOS aircraft intelligence into your workflow — ATI scoring, valuation, market intelligence and broker/dealer tools from one connected platform."
  },
  {
    icon: Building2,
    title: "Platform builders",
    text: "Use ABOS API / MCP access when enabled to connect search, valuation, verification and marketplace intelligence to your own stack."
  },
  {
    icon: Bot,
    title: "AI agents & assistants",
    text: "MCP-native. Point Claude, Cursor or your own agent at the endpoint and it can search, value and extract listings without you writing a client.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Pick your plan", text: "Choose ABOS Professional for individual buyers and scouts, or Broker / Dealer for teams and API / MCP access when enabled." },
  { step: "2", title: "Checkout", text: "Stripe handles the subscription securely. Your access is granted server-side after successful checkout." },
  { step: "3", title: "Connect", text: "Use the ABOS workspace directly, or use the enabled API / MCP capabilities available with your plan." },
];

const PLANS = [
  {
    id: "PRO",
    name: "ABOS Professional",
    price: "€99",
    period: "/month",
    tagline: "For active buyers & scouts.",
    features: ["Increased search limits", "ATI Score access included", "Discounted ATI Full Reports", "Discounted Valuation Studio", "Advanced aircraft intelligence", "Market comparables", "Saved aircraft & reports", "Workspace functionality"],
    cta: "Subscribe",
    highlighted: true,
  },
  {
    id: "BROKER",
    name: "ABOS Broker / Dealer",
    price: "€299",
    period: "/month",
    tagline: "For brokers, dealers & teams.",
    features: ["Everything in Professional", "Higher usage limits", "Multiple aircraft / workspace management", "Bulk aircraft analysis", "Broker / dealer workflow", "Listing intelligence & advanced reports", "Team / workspace support", "API / MCP access when enabled", "Priority integration features"],
    cta: "Subscribe",
    highlighted: false,
  },
];

const CARD_BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";

function PlanCard({ plan, onSelect, loading }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col relative"
      style={{
        background: plan.highlighted ? "rgba(245,194,66,0.06)" : "rgba(255,255,255,0.03)",
        border: plan.highlighted ? "1px solid rgba(245,194,66,0.35)" : `1px solid ${CARD_BORDER}`,
      }}
    >
      {plan.highlighted && (
        <span
          className="absolute -top-3 left-6 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: AMBER, color: "#04060a" }}
        >
          Most popular
        </span>
      )}
      <h3 className="text-[15px] font-bold mb-1" style={{ color: "rgba(255,255,255,0.92)" }}>{plan.name}</h3>
      <p className="text-[12px] mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>{plan.tagline}</p>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-[28px] font-black" style={{ color: "rgba(255,255,255,0.95)" }}>{plan.price}</span>
        <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>{plan.period}</span>
      </div>
      <ul className="flex flex-col gap-2 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.70)" }}>
            <Check size={13} className="mt-0.5 shrink-0" style={{ color: TEAL }} />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSelect(plan)}
        disabled={loading === plan.id}
        className="w-full py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wide disabled:opacity-50"
        style={
          plan.highlighted
            ? { background: AMBER, color: "#04060a", border: "none", cursor: "pointer" }
            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)", border: `0.5px solid ${CARD_BORDER}`, cursor: "pointer" }
        }
      >
        {loading === plan.id ? <Loader2 size={14} className="animate-spin mx-auto" /> : plan.cta}
      </button>
    </div>
  );
}

export default function ApiLanding() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [loading, setLoading] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");

  const startCheckout = async (planType) => {
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    setCheckoutError("");
    setLoading(planType);
    try {
      const returnUrl = `${window.location.origin}/pricing?checkout=success`;
      const res = await createCheckout(planType, "", returnUrl);
      const checkoutUrl = res?.url || res?.sessionUrl;
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }
      setCheckoutError(res?.error || "Couldn't start checkout. Please try again.");
    } catch (err) {
      setCheckoutError(err?.message || "Couldn't start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleSelect = (plan) => {
    startCheckout(plan.id);
  };

  return (
    <div className="min-h-screen px-4 sm:px-8 pt-10 pb-24" style={{ color: "#fff" }}>
      <div className="max-w-[980px] mx-auto">

        {/* ── Hero ── */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
            <Terminal size={12} style={{ color: AMBER }} />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: AMBER }}>
              ABOS Core API · API / MCP Access
            </span>
          </div>
          <h1 className="tracking-[-0.03em] leading-[1.06] mb-4" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500 }}>
            One API. <span style={{ color: AMBER, fontWeight: 700 }}>Every channel.</span>
          </h1>
          <p className="text-[14px] leading-relaxed max-w-[600px] mb-7" style={{ color: "rgba(255,255,255,0.60)" }}>
            The same aviation intelligence engine behind aircraftbuyorsell.com — ATI scoring, OMVM
            valuation, listing extraction and market data — licensed to run under your own brand,
            authenticated with a tenant-scoped key.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wide"
              style={{ background: AMBER, color: "#04060a" }}>
              See plans &amp; pricing <ArrowRight size={14} />
            </a>
            <Link to="/partner-portal"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(255,255,255,0.05)", border: `0.5px solid ${CARD_BORDER}`, color: "rgba(255,255,255,0.80)" }}>
              <KeyRound size={13} /> Already a partner? Sign in
            </Link>
          </div>
        </div>

        {/* ── Value props ── */}
        <div className="grid sm:grid-cols-3 gap-4 mb-14">
          {VALUE_PROPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CARD_BORDER}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
                <Icon size={16} style={{ color: AMBER }} />
              </div>
              <h3 className="text-[14px] font-bold mb-1.5" style={{ color: "rgba(255,255,255,0.90)" }}>{title}</h3>
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{text}</p>
            </div>
          ))}
        </div>

        {/* ── How it works ── */}
        <div className="mb-14">
          <h2 className="text-[16px] font-bold mb-5" style={{ color: "rgba(255,255,255,0.92)" }}>How it works</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map(({ step, title, text }) => (
              <div key={step} className="flex gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold"
                  style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.28)", color: AMBER }}>
                  {step}
                </span>
                <div>
                  <p className="text-[13px] font-bold mb-1" style={{ color: "rgba(255,255,255,0.88)" }}>{title}</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pricing ── */}
        <div id="pricing" className="mb-10 scroll-mt-8">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={15} style={{ color: AMBER }} />
            <h2 className="text-[16px] font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>Plans &amp; pricing</h2>
          </div>
          <p className="text-[12px] mb-6" style={{ color: "rgba(255,255,255,0.50)" }}>
            Subscription pricing follows the ABOS monetization catalog. Professional is €99/month and Broker / Dealer is €299/month. API / MCP access is available when enabled for the Broker / Dealer plan.
          </p>

          {checkoutError && (
            <div className="mb-4 px-4 py-3 rounded-xl text-[12px]" style={{ background: "rgba(226,75,74,0.08)", border: "1px solid rgba(226,75,74,0.25)", color: "#f0a3a2" }}>
              {checkoutError}
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onSelect={handleSelect} loading={loading} />
            ))}
          </div>

          <p className="text-[11px] mt-5" style={{ color: "rgba(255,255,255,0.40)" }}>
            Capabilities are enforced server-side by your entitlement, not by the browser — access is granted only for the products and capabilities your account actually owns.
          </p>
        </div>

      </div>
    </div>
  );
}
