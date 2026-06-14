import { useState } from "react";
import {
  Layers, Eye, EyeOff, Plane, Globe, ShieldCheck, Zap,
  ChevronDown, Filter, SlidersHorizontal, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/lib/useTheme";

const CATEGORIES = [
  { key: "all", label: "All", icon: Plane },
  { key: "ga", label: "GA", icon: Plane, desc: "Cessna, Piper, Cirrus..." },
  { key: "turboprop", label: "Turboprop", icon: Plane, desc: "King Air, PC-12, Caravan..." },
  { key: "jet", label: "Jets", icon: Plane, desc: "Citation, Gulfstream, Learjet..." },
  { key: "heli", label: "Helicopters", icon: Plane, desc: "R22, Bell, EC..." },
  { key: "other", label: "Other", icon: Plane, desc: "Gliders, UAV, experimental..." },
];

const ATI_RANGES = [
  { key: "all", label: "All scores", min: 0, max: 120 },
  { key: "exceptional", label: "Exceptional (90+)", min: 90, max: 120, color: "#22c55e" },
  { key: "strong", label: "Strong Buy (72–89)", min: 72, max: 89, color: "#2563eb" },
  { key: "fair", label: "Fair (54–71)", min: 54, max: 71, color: "#E8A83A" },
  { key: "caution", label: "Caution (<54)", min: 0, max: 53, color: "#ef4444" },
  { key: "unscored", label: "Unscored", min: null, max: null, color: "#888" },
];

const LISTING_STATUSES = [
  { key: "all", label: "All statuses" },
  { key: "active", label: "Active" },
  { key: "sold", label: "Sold" },
  { key: "draft", label: "Draft" },
];

export const DEFAULT_FILTER = {
  adsb: { enabled: true, category: "all" },
  liveDb: { enabled: true },
  listings: { enabled: true, atiRange: "all", status: "all" },
};

export default function GlobeLayerFilter({ filter = DEFAULT_FILTER, onChange }) {
  const isDark = useTheme();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("adsb");

  // Count active layers
  const activeCount =
    (filter.adsb?.enabled ? 1 : 0) +
    (filter.liveDb?.enabled ? 1 : 0) +
    (filter.listings?.enabled ? 1 : 0);

  const update = (path, value) => {
    const next = structuredClone(filter);
    const keys = path.split(".");
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    onChange(next);
  };

  const bg = isDark ? "rgba(15,15,28,0.88)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)";
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const accentGold = "#E8A83A";
  const accentGreen = "#22c55e";
  const accentBlue = isDark ? "#00f5ff" : "#2563eb";

  const tabStyle = (tab) => ({
    background: activeTab === tab ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") : "transparent",
    color: activeTab === tab ? textColor : mutedColor,
  });

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all"
        style={{
          background: open ? `${accentCyan}15` : "transparent",
          border: open ? `1px solid ${accentCyan}30` : border,
          color: open ? accentCyan : mutedColor,
        }}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Layers ({activeCount}/3)
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 z-50 rounded-xl overflow-hidden shadow-xl"
            style={{ width: 320, background: bg, border, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
          >
            {/* Header */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: accentCyan }}>
                <Filter className="w-3 h-3 inline mr-1.5" />Globe Filters
              </p>
              <button onClick={() => setOpen(false)} className="opacity-40 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 pb-3">
              {[
                { key: "adsb", label: "ADS-B", icon: RadarIcon, color: accentBlue },
                { key: "listings", label: "Listings", icon: ShieldCheck, color: accentGold },
                { key: "live", label: "Live DB", icon: Globe, color: accentGreen },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                  style={tabStyle(tab.key)}
                >
                  <tab.icon className="w-3 h-3" style={{ color: tab.color }} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="px-4 pb-4 space-y-3">
              {/* ── ADS-B Tab ── */}
              {activeTab === "adsb" && (
                <div className="space-y-3">
                  <LayerToggle
                    label="ADS-B Traffic"
                    color={accentBlue}
                    enabled={filter.adsb.enabled}
                    onToggle={(v) => update("adsb.enabled", v)}
                    icon={RadarIcon}
                  />
                  {filter.adsb.enabled && (
                    <div className="space-y-1.5 ml-6">
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mutedColor }}>Category</p>
                      <div className="grid grid-cols-2 gap-1">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.key}
                            onClick={() => update("adsb.category", cat.key)}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-semibold text-left transition-all ${
                              filter.adsb.category === cat.key
                                ? "ring-1 ring-offset-0"
                                : ""
                            }`}
                            style={{
                              background: filter.adsb.category === cat.key
                                ? `${accentBlue}15`
                                : "transparent",
                              borderColor: filter.adsb.category === cat.key ? `${accentBlue}40` : "transparent",
                              borderWidth: 1,
                              color: filter.adsb.category === cat.key ? accentBlue : mutedColor,
                            }}
                          >
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: accentBlue }} />
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Listings Tab ── */}
              {activeTab === "listings" && (
                <div className="space-y-3">
                  <LayerToggle
                    label="ABOS Listings"
                    color={accentGold}
                    enabled={filter.listings.enabled}
                    onToggle={(v) => update("listings.enabled", v)}
                    icon={ShieldCheck}
                  />
                  {filter.listings.enabled && (
                    <>
                      <div className="space-y-1.5 ml-6">
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mutedColor }}>ATI Score</p>
                        <div className="grid grid-cols-1 gap-1">
                          {ATI_RANGES.map((range) => (
                            <button
                              key={range.key}
                              onClick={() => update("listings.atiRange", range.key)}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-semibold text-left transition-all`}
                              style={{
                                background: filter.listings.atiRange === range.key
                                  ? `${range.color || accentGold}12`
                                  : "transparent",
                                border: `1px solid ${filter.listings.atiRange === range.key ? (range.color || accentGold) + "30" : "transparent"}`,
                                color: filter.listings.atiRange === range.key ? (range.color || textColor) : mutedColor,
                              }}
                            >
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: range.color || "#888" }} />
                              {range.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5 ml-6">
                        <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mutedColor }}>Status</p>
                        <div className="flex flex-wrap gap-1">
                          {LISTING_STATUSES.map((s) => (
                            <button
                              key={s.key}
                              onClick={() => update("listings.status", s.key)}
                              className="px-2 py-1 rounded-md text-[10px] font-semibold transition-all"
                              style={{
                                background: filter.listings.status === s.key ? `${accentGold}12` : "transparent",
                                border: `1px solid ${filter.listings.status === s.key ? accentGold + "30" : "transparent"}`,
                                color: filter.listings.status === s.key ? accentGold : mutedColor,
                              }}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Live DB Tab ── */}
              {activeTab === "live" && (
                <div className="space-y-3">
                  <LayerToggle
                    label="Live Database"
                    color={accentGreen}
                    enabled={filter.liveDb.enabled}
                    onToggle={(v) => update("liveDb.enabled", v)}
                    icon={Globe}
                    subtitle="Supabase live_traffic — near real-time"
                  />
                  {filter.liveDb.enabled && (
                    <div className="ml-6 p-2 rounded-lg" style={{ background: `${accentGreen}08` }}>
                      <p className="text-[9px]" style={{ color: mutedColor }}>
                        Showing all live traffic data from Supabase.
                        Filtered to exclude commercial airliners.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer: Reset */}
            <div className="px-4 pb-3">
              <button
                onClick={() => onChange(structuredClone(DEFAULT_FILTER))}
                className="w-full py-1.5 rounded-lg text-[10px] font-bold text-center transition-opacity hover:opacity-70"
                style={{ color: mutedColor, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              >
                Reset all filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────

function LayerToggle({ label, color, enabled, onToggle, icon: Icon, subtitle }) {
  const isDark = useTheme();
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: enabled ? color : mutedColor }} />
        <div>
          <p className="text-[11px] font-bold" style={{ color: enabled ? "#e2e8f0" : mutedColor }}>{label}</p>
          {subtitle && <p className="text-[8px]" style={{ color: mutedColor }}>{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={() => onToggle(!enabled)}
        className="w-9 h-5 rounded-full relative transition-colors"
        style={{ background: enabled ? color : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)") }}
      >
        <div
          className="w-3.5 h-3.5 rounded-full absolute top-0.5 transition-all bg-white shadow"
          style={{ left: enabled ? 18 : 2 }}
        />
      </button>
    </div>
  );
}

function RadarIcon({ className, style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="12" x2="12" y2="2" />
      <line x1="12" y1="12" x2="19" y2="5" />
    </svg>
  );
}