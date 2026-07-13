import { Link } from "react-router-dom";
import {
  Calculator, Shield, TrendingUp, Fuel, Zap, Sparkles,
  Plane, DollarSign, Gauge, Wrench, PaintBucket, Armchair,
  Search, Activity, Brain, Users, ArrowRight, CheckCircle2, Lock
} from "lucide-react";
import { useMonetization } from "@/hooks/useMonetization";
import CalculatorPricingBadge from "@/components/calculators/CalculatorPricingBadge";

const CALCULATOR_GROUPS = [
  {
    id: "free",
    label: "Free Tools",
    icon: Search,
    color: "#5dcaa5",
    desc: "Start here — no account needed",
    items: [
      { path: "/n-lookup", label: "Registry Lookup", icon: Search, featureId: "registry_lookup" },
      { path: "/valuation", label: "OMVM Valuation", icon: TrendingUp, featureId: "basic_valuation" },
      { path: "/aircraft-detailing-calculator", label: "Detailing Calculator", icon: Sparkles, featureId: "detailing" },
    ],
  },
  {
    id: "intelligence",
    label: "ATI Intelligence",
    icon: Shield,
    color: "#f5c242",
    desc: "Aircraft transparency scoring & reports",
    items: [
      { path: "/ati-quick-score", label: "ATI Quick Score", icon: Zap, featureId: "ati_quick_score" },
      { path: "/ati-full-report", label: "ATI Full Report", icon: Shield, featureId: "ati_full_report" },
      { path: "/investment-brief", label: "Investment Brief", icon: Brain, featureId: "investment_brief" },
      { path: "/market-reports", label: "Market Report", icon: TrendingUp, featureId: "market_report" },
    ],
  },
  {
    id: "opex",
    label: "Operating Costs",
    icon: Calculator,
    color: "#4e8ef7",
    desc: "OPEX unlocks all sub-calculators below",
    items: [
      { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator, featureId: "opex_calculator", primary: true },
      { path: "/insurance-calculator", label: "Insurance", icon: Shield, featureId: "insurance_calculator" },
      { path: "/leasing-calculator", label: "Leasing + Tax", icon: DollarSign, featureId: "leasing_calculator" },
    ],
  },
  {
    id: "upgrades",
    label: "MRO & Upgrades",
    icon: Wrench,
    color: "#a855f7",
    desc: "Included with OPEX session — or standalone",
    items: [
      { path: "/avionics-upgrade-calculator", label: "Avionics Upgrade", icon: Zap, featureId: "avionics_upgrade" },
      { path: "/exterior-refurbishment-calculator", label: "Exterior Refurb", icon: PaintBucket, featureId: "exterior_refurb" },
      { path: "/interior-refurbishment-calculator", label: "Interior Refurb", icon: Armchair, featureId: "interior_refurb" },
      { path: "/upgrade-comparison", label: "Upgrade Compare", icon: TrendingUp, featureId: "avionics_upgrade" },
    ],
  },
  {
    id: "ownership",
    label: "Ownership & Fleet",
    icon: Plane,
    color: "#5dcaa5",
    desc: "Fractional, fleet, and tracking tools",
    items: [
      { path: "/fractional-calculators", label: "Fractional Ownership", icon: Users, featureId: "opex_calculator" },
      { path: "/registry-comparator", label: "Registry Comparator", icon: Search, featureId: "registry_lookup" },
    ],
  },
];

function CalculatorCard({ item, color }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className="group rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `0.5px solid ${item.primary ? `${color}40` : "rgba(255,255,255,0.08)"}`,
        boxShadow: item.primary ? `0 0 20px ${color}10` : "none",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `0.5px solid ${color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <CalculatorPricingBadge featureId={item.featureId} compact={!item.primary} />
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>
          {item.label}
        </p>
        {item.primary && (
          <p className="text-[10px] mt-0.5" style={{ color }}>
            Unlocks all MRO & upgrade calculators
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 mt-auto pt-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>
          Open
        </span>
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" style={{ color: "rgba(255,255,255,0.40)" }} />
      </div>
    </Link>
  );
}

export default function CalculatorsHub() {
  const { isRegistered, hasSubscription } = useMonetization();

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "transparent" }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "#f5c242" }}>
            ABOS Calculator Hub
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1" style={{ color: "rgba(255,255,255,0.90)" }}>
            Aviation Financial Tools
          </h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: "rgba(255,255,255,0.55)" }}>
            Free registry lookup and valuation. Unlock OPEX to access all MRO and upgrade calculators.
            {isRegistered ? " Member pricing active." : " Register free for instant discounts."}
          </p>
        </div>

        {/* Registration banner for non-registered */}
        {!isRegistered && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(245,194,66,0.08), rgba(93,202,165,0.05))",
              border: "0.5px solid rgba(245,194,66,0.20)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,194,66,0.12)" }}>
                <Lock className="w-4 h-4" style={{ color: "#f5c242" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>
                  You're seeing full prices
                </p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Register free to unlock member discounts up to 70%
                </p>
              </div>
            </div>
            <Link
              to="/pricing"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-opacity hover:opacity-90"
              style={{ background: "#f5c242", color: "#04060a" }}
            >
              Register <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Calculator groups */}
        <div className="space-y-8">
          {CALCULATOR_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${group.color}15`, border: `0.5px solid ${group.color}30` }}
                  >
                    <GroupIcon className="w-3.5 h-3.5" style={{ color: group.color }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-tight" style={{ color: "rgba(255,255,255,0.90)" }}>
                      {group.label}
                    </h2>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{group.desc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.map((item) => (
                    <CalculatorCard key={item.path} item={item} color={group.color} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* OPEX unlock info */}
        <div
          className="rounded-2xl p-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.20)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(78,142,247,0.12)" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "#4e8ef7" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>
                OPEX unlocks everything
              </p>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                Purchase OPEX Calculator once → avionics, exterior, interior, and detailing are unlocked for your session
              </p>
            </div>
          </div>
          <Link
            to="/opex-calculator"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-opacity hover:opacity-90"
            style={{ background: "#4e8ef7", color: "#fff" }}
          >
            <Calculator className="w-3.5 h-3.5" /> Start with OPEX
          </Link>
        </div>
      </div>
    </div>
  );
}