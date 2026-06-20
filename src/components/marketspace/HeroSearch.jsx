import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plane, Target, MapPin, Clock, DollarSign } from "lucide-react";

const AMBER = "#F8C73E";
const SKY = "#8EB7DC";

const FIELDS = [
  { key: "model", label: "Model", placeholder: "e.g. Cirrus SR22", icon: Plane },
  { key: "mission", label: "Mission", placeholder: "e.g. Family travel", icon: Target },
  { key: "region", label: "Region", placeholder: "e.g. North America", icon: MapPin },
  { key: "hours", label: "Max Hours", placeholder: "e.g. 2000", icon: Clock },
  { key: "budget", label: "Budget", placeholder: "e.g. $850k", icon: DollarSign },
];

export default function HeroSearch() {
  const navigate = useNavigate();
  const [vals, setVals] = useState({});

  const submit = () => {
    const params = new URLSearchParams();
    if (vals.model) params.set("q", vals.model);
    if (vals.region) params.set("region", vals.region);
    if (vals.budget) params.set("budget", vals.budget);
    navigate(`/listings${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-6 md:p-10"
      style={{ background: "linear-gradient(135deg, #0C1620 0%, #071018 100%)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {/* dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          opacity: 0.6,
        }}
      />
      {/* amber glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: 600, height: 280, background: "radial-gradient(ellipse, rgba(248,199,62,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative z-10">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: AMBER }}>
          ABOS Marketspace
        </p>
        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white leading-[1.1] max-w-2xl">
          Find verified aircraft with pricing context before you call
        </h1>
        <p className="text-[14px] mt-3 max-w-xl" style={{ color: SKY }}>
          Every listing scored by ATI Intelligence — market value, risk flags and verification status, up front.
        </p>

        {/* Search bar */}
        <div
          className="mt-7 rounded-2xl p-3 md:p-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {FIELDS.map(({ key, label, placeholder, icon: Icon }) => (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <Icon className="w-3 h-3" style={{ color: SKY }} /> {label}
                </label>
                <input
                  value={vals[key] || ""}
                  onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder={placeholder}
                  className="w-full h-10 px-3 rounded-lg text-[13px] outline-none transition-colors"
                  style={{ background: "#071018", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={submit}
            className="mt-3 w-full lg:w-auto flex items-center justify-center gap-2 px-6 h-11 rounded-lg text-[14px] font-bold transition-all active:scale-95"
            style={{ background: AMBER, color: "#071018", boxShadow: "0 4px 18px rgba(248,199,62,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          >
            <Search className="w-4 h-4" /> Search Aircraft
          </button>
        </div>
      </div>
    </div>
  );
}