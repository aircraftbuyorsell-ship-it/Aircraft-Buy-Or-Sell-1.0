import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plane, MapPin, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";

const AMBER = "#F8C73E";
const TEAL = "#53C4A2";
const SKY = "#8EB7DC";

const FIELDS = [
  { key: "model", label: "Model", placeholder: "Cirrus SR22", icon: Plane },
  { key: "region", label: "Region", placeholder: "N. America", icon: MapPin },
  { key: "budget", label: "Budget", placeholder: "$850k", icon: DollarSign },
  { key: "hours", label: "Max Hours", placeholder: "2000", icon: Clock },
];

const TRUST = [
  "ATI-scored listings",
  "Verified ownership",
  "Live market pricing",
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
      {/* amber glow top-center */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: 700, height: 320, background: "radial-gradient(ellipse, rgba(248,199,62,0.09) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
        {/* ── LEFT: content (55%) ── */}
        <div className="w-full lg:w-[55%]">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase mb-4" style={{ color: AMBER }}>
            ABOS Marketspace
          </p>
          <h1 className="text-2xl md:text-[2.6rem] font-black tracking-tight text-white leading-[1.08]">
            Find verified aircraft
            <br />
            with{" "}
            <span className="relative inline-block">
              pricing context
              <span
                className="absolute left-0 -bottom-1 w-full"
                style={{ height: 3, background: AMBER, borderRadius: 2 }}
              />
            </span>
            <br />
            before you call
          </h1>

          {/* Search bar — frosted glass pill */}
          <div
            className="mt-7 rounded-2xl p-3"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {FIELDS.map(({ key, label, placeholder, icon: Icon }) => (
                <div key={key}>
                  <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <Icon className="w-3 h-3" style={{ color: SKY }} /> {label}
                  </label>
                  <input
                    value={vals[key] || ""}
                    onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder={placeholder}
                    className="w-full h-9 px-2.5 rounded-lg text-[12px] outline-none"
                    style={{ background: "#071018", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={submit}
              className="mt-2.5 w-full flex items-center justify-center gap-2 px-6 h-11 rounded-lg text-[14px] font-bold transition-all active:scale-95"
              style={{ background: AMBER, color: "#071018", boxShadow: "0 4px 18px rgba(248,199,62,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >
              <Search className="w-4 h-4" /> Search Aircraft
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2 mt-5">
            {TRUST.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(83,196,162,0.1)", border: "1px solid rgba(83,196,162,0.3)", color: TEAL }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: globe (45%) — hidden on mobile ── */}
        <div className="hidden lg:flex w-full lg:w-[45%] items-center justify-center">
          <div
            className="relative rounded-2xl flex items-center justify-center w-full"
            style={{
              background: "#071018",
              border: "1px solid rgba(248,199,62,0.35)",
              boxShadow: "0 0 40px rgba(248,199,62,0.12), inset 0 0 60px rgba(248,199,62,0.04)",
              aspectRatio: "1 / 1",
              maxWidth: 340,
            }}
          >
            <MiniGlobe size={260} color={SKY} />
          </div>
        </div>
      </div>
    </div>
  );
}