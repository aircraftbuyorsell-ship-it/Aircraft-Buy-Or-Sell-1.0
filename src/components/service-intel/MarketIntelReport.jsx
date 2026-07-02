import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Wrench, GraduationCap, Fuel, Building2, Users, Brush,
  RefreshCw, TrendingUp, AlertTriangle, Lightbulb, ShieldCheck, Zap,
} from "lucide-react";

const GOLD = "#f5c242";
const GREEN = "#5dcaa5";
const BLUE = "#4e8ef7";
const RED = "#e24b4a";
const PURPLE = "#8b5cf6";
const MUTED = "rgba(255,255,255,0.60)";
const WHITE = "rgba(255,255,255,0.90)";

const CATEGORIES = [
  { id: "mechanic",      label: "Mechanics / MRO",  icon: Wrench },
  { id: "ap_mechanic",   label: "A&P Mechanics",    icon: Wrench },
  { id: "flight_school", label: "Flight Schools",   icon: GraduationCap },
  { id: "refueling_fbo", label: "FBOs / Refueling", icon: Fuel },
  { id: "dealer",        label: "Aircraft Dealers", icon: Building2 },
  { id: "broker",        label: "Aircraft Brokers", icon: Users },
  { id: "paint_shop",    label: "Paint Shops",      icon: Brush },
];

function IntelSection({ icon: Icon, title, items, color = GOLD }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color }} />
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color }}>{title}</p>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: color, marginTop: 6, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MarketIntelReport() {
  const [category, setCategory] = useState("mechanic");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await base44.functions.invoke("aviationServiceIntel", {
        action: "market_intel",
        category,
      });
      setData(res.data);
    } catch (e) {
      setError(e.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Category selector */}
      <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 12 }}>
          Category Market Intelligence
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap"
                style={{
                  background: active ? "rgba(245,194,66,0.09)" : "rgba(255,255,255,0.04)",
                  border: active ? "0.5px solid rgba(245,194,66,0.22)" : "0.5px solid rgba(255,255,255,0.08)",
                  color: active ? GOLD : MUTED,
                  fontSize: 11,
                  fontWeight: 600,
                  minHeight: 36,
                }}
              >
                <Icon size={13} />
                {cat.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg transition-all mt-3"
          style={{
            background: loading ? "rgba(255,255,255,0.04)" : "rgba(245,194,66,0.09)",
            border: loading ? "0.5px solid rgba(255,255,255,0.08)" : "0.5px solid rgba(245,194,66,0.22)",
            color: loading ? "rgba(255,255,255,0.25)" : GOLD,
            fontSize: 12,
            fontWeight: 600,
            padding: "0 16px",
            minHeight: 40,
          }}
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <TrendingUp size={14} />}
          {loading ? "Generating Report…" : "Generate Market Report"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: "rgba(245,194,66,0.20)", borderTopColor: "#f5c242" }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.15)" }}>
          <p style={{ fontSize: 12, color: RED, fontWeight: 600 }}>{error}</p>
        </div>
      )}

      {/* Report */}
      {data && !loading && (
        <div className="space-y-4">
          {/* Summary header */}
          <div className="rounded-xl p-5" style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 8 }}>
              {data.category || CATEGORIES.find(c => c.id === category)?.label} — Executive Summary
            </p>
            <p style={{ fontSize: 13, color: WHITE, lineHeight: 1.6 }}>{data.summary}</p>
          </div>

          {/* Market stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>Market Size</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: GOLD, letterSpacing: "-0.03em", marginTop: 4 }}>
                {data.market_size_usd || "—"}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>Growth Rate</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: GREEN, letterSpacing: "-0.03em", marginTop: 4 }}>
                {data.growth_rate_pct != null ? `${data.growth_rate_pct}%` : "—"}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>Avg Pricing</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: BLUE, letterSpacing: "-0.03em", marginTop: 4, lineHeight: 1.3 }}>
                {data.avg_pricing || "—"}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>Regional Split</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: WHITE, letterSpacing: "-0.03em", marginTop: 4, lineHeight: 1.3 }}>
                {data.regional_distribution || "—"}
              </p>
            </div>
          </div>

          {/* Growth outlook */}
          {data.growth_outlook && (
            <div className="rounded-xl p-5" style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} style={{ color: GREEN }} />
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(93,202,165,0.80)" }}>Growth Outlook</p>
              </div>
              <p style={{ fontSize: 12, color: WHITE, lineHeight: 1.6 }}>{data.growth_outlook}</p>
            </div>
          )}

          {/* Grid of intel sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IntelSection icon={TrendingUp} title="Key Trends" items={data.key_trends} color={BLUE} />
            <IntelSection icon={Building2} title="Major Players" items={data.major_players} color={GOLD} />
            <IntelSection icon={Lightbulb} title="Opportunities" items={data.opportunities} color={GREEN} />
            <IntelSection icon={AlertTriangle} title="Risks" items={data.risks} color={RED} />
            <IntelSection icon={ShieldCheck} title="Barriers to Entry" items={data.barriers_to_entry} color={PURPLE} />
            <IntelSection icon={Zap} title="Technology Disruptions" items={data.technology_disruptions} color="#06b6d4" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="text-center py-16">
          <TrendingUp size={32} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>Market Intelligence Reports</p>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 4, maxWidth: 400, margin: "4px auto 0" }}>
            Select a service category and generate a comprehensive market intelligence report
            with market size, trends, pricing, and growth outlook.
          </p>
        </div>
      )}
    </div>
  );
}