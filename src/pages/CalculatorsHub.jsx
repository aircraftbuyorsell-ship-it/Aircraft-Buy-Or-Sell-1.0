import { Link } from "react-router-dom";
import {
  Calculator, Shield, TrendingUp, Fuel, Zap, Sparkles,
  Plane, DollarSign, Gauge, Wrench, PaintBucket, Armchair,
  Search, Activity, Brain, Users, ArrowRight, CheckCircle2, Lock
} from "lucide-react";
import { ABOS_PRODUCTS } from "@/lib/abosProducts";

// ── Audience tag colors ──
const AUDIENCE_STYLES = {
  buyer:   { bg: "rgba(78,142,247,0.12)",  color: "#4e8ef7",  label: "Buyer" },
  seller:  { bg: "rgba(93,202,165,0.12)",  color: "#5dcaa5",  label: "Seller" },
  broker:  { bg: "rgba(245,194,66,0.12)",  color: "#f5c242",  label: "Broker" },
  lender:  { bg: "rgba(168,85,247,0.12)",  color: "#a855f7",  label: "Lender" },
  owner:   { bg: "rgba(232,168,58,0.12)",  color: "#e8a83a",  label: "Owner" },
};

function AudienceBadge({ tag }) {
  const s = AUDIENCE_STYLES[tag];
  if (!s) return null;
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

const CALCULATOR_GROUPS = [
  {
    id: "free",
    label: "Free Tools",
    icon: Search,
    color: "#5dcaa5",
    desc: "Start here — no account needed",
    items: [
      {
        path: "/n-lookup", label: "Registry Lookup", icon: Search, featureId: "registry_lookup",
        audience: ["buyer", "seller", "broker"],
        features: ["FAA + international registry", "N-Number / ICAO / S/N", "Owner cross-reference"],
      },
      {
        path: "/valuation-studio", label: "OMVM Valuation", icon: TrendingUp, featureId: "basic_valuation",
        audience: ["buyer", "seller", "broker"],
        features: ["Market-estimated value", "Comparable sales", "Depreciation curve"],
      },
      {
        path: "/aircraft-detailing-calculator", label: "Detailing Calculator", icon: Sparkles, featureId: "detailing",
        audience: ["owner", "seller"],
        features: ["Exterior wash & wax", "Interior deep clean", "Labor + material estimate"],
      },
    ],
  },
  {
    id: "intelligence",
    label: "ATI Intelligence",
    icon: Shield,
    color: "#f5c242",
    desc: "Aircraft transparency scoring & reports",
    items: [
      {
        path: "/ati-quick-score", label: "ATI Quick Score", icon: Zap, featureId: "ati_quick_score",
        audience: ["buyer", "broker"],
        features: ["120-point transparency score", "Risk flag summary", "PDF scorecard"],
      },
      {
        path: "/ati-full-report", label: "ATI Full Report", icon: Shield, featureId: "ati_full_report",
        audience: ["buyer", "broker", "lender"],
        features: ["Full due diligence", "8-dimension breakdown", "Branded .docx report"],
      },
      {
        path: "/investment-brief", label: "Investment Brief", icon: Brain, featureId: "investment_brief",
        audience: ["buyer", "broker", "lender"],
        features: ["AI health analysis", "ROI projection", "Financial risk score"],
      },
      {
        path: "/market-reports", label: "Market Report", icon: TrendingUp, featureId: "market_report",
        audience: ["buyer", "seller", "broker"],
        features: ["Make/model analysis", "Price trends", "Comparable listings"],
      },
    ],
  },
  {
    id: "opex",
    label: "Operating Costs",
    icon: Calculator,
    color: "#4e8ef7",
    desc: "Ownership and cost tools included in Deal Analysis",
    items: [
      {
        path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator, featureId: "opex_calculator", primary: true,
        audience: ["buyer", "owner", "broker"],
        features: ["Annual cost projection", "Engine/prop/inspection reserves", "Location-adjusted rates"],
      },
      {
        path: "/insurance-calculator", label: "Insurance", icon: Shield, featureId: "insurance_calculator",
        audience: ["buyer", "owner"],
        features: ["Hull & liability premium", "Pilot experience factor", "Deductible options"],
      },
      {
        path: "/leasing-calculator", label: "Leasing + Tax", icon: DollarSign, featureId: "leasing_calculator",
        audience: ["buyer", "broker", "lender"],
        features: ["Dry lease rate estimate", "Tax benefit analysis", "Residual value projection"],
      },
    ],
  },
  {
    id: "upgrades",
    label: "MRO & Upgrades",
    icon: Wrench,
    color: "#a855f7",
    desc: "Upgrade and refurbishment economics included in Deal Analysis",
    items: [
      {
        path: "/avionics-upgrade-calculator", label: "Avionics Upgrade", icon: Zap, featureId: "avionics_upgrade",
        audience: ["buyer", "owner"],
        features: ["Glass panel retrofit", "Transponder/ADS-B install", "Labor + parts estimate"],
      },
      {
        path: "/exterior-refurbishment-calculator", label: "Exterior Refurb", icon: PaintBucket, featureId: "exterior_refurb",
        audience: ["seller", "owner"],
        features: ["Full repaint estimate", "Polish & corrosion treatment", "Condition-based pricing"],
      },
      {
        path: "/interior-refurbishment-calculator", label: "Interior Refurb", icon: Armchair, featureId: "interior_refurb",
        audience: ["seller", "owner"],
        features: ["Seat reupholstery", "Cabin paneling & carpet", "Material grade options"],
      },
      {
        path: "/upgrade-comparison", label: "Upgrade Compare", icon: TrendingUp, featureId: "avionics_upgrade",
        audience: ["buyer", "owner", "broker"],
        features: ["Side-by-side cost compare", "ROI per upgrade", "Combined project total"],
      },
    ],
  },
  {
    id: "ownership",
    label: "Ownership & Fleet",
    icon: Plane,
    color: "#5dcaa5",
    desc: "Fractional, fleet, and tracking tools",
    items: [
      {
        path: "/fractional-calculators", label: "Fractional Ownership", icon: Users, featureId: "opex_calculator",
        audience: ["buyer", "broker"],
        features: ["Share-split calculator", "Cost-per-owner breakdown", "Usage allocation"],
      },
      {
        path: "/registry-comparator", label: "Registry Comparator", icon: Search, featureId: "registry_lookup",
        audience: ["buyer", "broker", "lender"],
        features: ["FAA vs EASA vs CAA", "Cross-registry data match", "Compliance gap flags"],
      },
    ],
  },
];

// ── Centered price display ──
function CenteredPrice({ featureId }) {
  const freeFeatures = ["registry_lookup", "basic_valuation", "detailing"];
  const isFree = freeFeatures.includes(featureId);

  if (isFree) {
    return (
      <div className="text-center py-2">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider" style={{ background: "rgba(93,202,165,0.12)", color: "#5dcaa5", border: "0.5px solid rgba(93,202,165,0.25)" }}>
          <Sparkles className="w-3 h-3" /> Free
        </span>
      </div>
    );
  }

  return (
    <div className="text-center py-2">
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider" style={{ background: "rgba(245,194,66,0.10)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.22)" }}>
        <CheckCircle2 className="w-3 h-3" /> Included with Deal Analysis
      </span>
      <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.40)" }}>Decision workflow {ABOS_PRODUCTS.DEAL_ANALYSIS.displayPrice}</p>
    </div>
  );
}

function CalculatorCard({ item, color }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className="group rounded-2xl p-4 flex flex-col gap-2 transition-all duration-200 hover:scale-[1.02]"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `0.5px solid ${item.primary ? `${color}40` : "rgba(255,255,255,0.08)"}`,
        boxShadow: item.primary ? `0 0 20px ${color}10` : "none",
      }}
    >
      {/* Icon + audience badges */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `0.5px solid ${color}30` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {(item.audience || []).map((tag) => (
            <AudienceBadge key={tag} tag={tag} />
          ))}
        </div>
      </div>

      {/* Label */}
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

      {/* Centered price */}
      <CenteredPrice featureId={item.featureId} />

      {/* Feature list */}
      {(item.features || []).length > 0 && (
        <ul className="space-y-1 pt-1" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
          {item.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" style={{ color: `${color}80` }} />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Open link */}
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
            Free registry and valuation tools, plus a complete calculator workbench for aircraft ownership decisions.
          </p>
        </div>

        <div className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-4" style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.18)" }}>
          <div>
            <p className="text-sm font-bold text-white/90">One calculator workbench. One decision product.</p>
            <p className="text-[11px] text-white/50">Calculators support the ABOS Deal Analysis workflow — no separate calculator pricing.</p>
          </div>
          <Link to="/pricing" className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black" style={{ background: "#f5c242", color: "#04060a" }}>
            Deal Analysis {ABOS_PRODUCTS.DEAL_ANALYSIS.displayPrice} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

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

        <div className="rounded-2xl p-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(78,142,247,0.12)" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "#4e8ef7" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white/90">Turn calculator outputs into a buying decision</p>
              <p className="text-[11px] text-white/55">Deal Analysis combines valuation, ownership economics, risk and negotiation guidance.</p>
            </div>
          </div>
          <Link to="/pricing" className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black" style={{ background: "#4e8ef7", color: "#fff" }}>
            <Calculator className="w-3.5 h-3.5" /> Get Deal Analysis {ABOS_PRODUCTS.DEAL_ANALYSIS.displayPrice}
          </Link>
        </div>
      </div>
    </div>
  );
}