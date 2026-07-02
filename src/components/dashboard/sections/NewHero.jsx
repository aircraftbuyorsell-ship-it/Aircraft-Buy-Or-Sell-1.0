import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plane, TrendingUp, Shield, Tag, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RegistryResultOverlay from "@/components/dashboard/RegistryResultOverlay";

const DASH_PREFIXES = ["OK", "D", "G", "F", "I", "EC", "EA", "SE", "OO", "PH", "HB", "OE", "LN", "OY", "ZK", "VH", "CS", "B", "9M"];

function normalizeReg(raw) {
  if (!raw) return "";
  let r = raw.toUpperCase().replace(/\s+/g, "");
  for (const p of DASH_PREFIXES) {
    if (r.startsWith(p) && !r.startsWith(p + "-")) {
      r = p + "-" + r.slice(p.length);
      break;
    }
  }
  return r;
}

const STATS = [
  { value: "20,990", label: "Aircraft Listed" },
  { value: "3,412", label: "Aircraft Verified" },
  { value: "250,000", label: "Community Members" },
  { value: "150+", label: "Countries" },
];

const QUICK_ACTIONS = [
  { label: "Browse Aircraft", icon: Plane, to: "/listings", color: "#5dcaa5" },
  { label: "Aircraft Value", icon: TrendingUp, to: "/valuation", color: "#a855f7" },
  { label: "ATI Passport", icon: Shield, to: "/ati-passport", color: "#D4A017" },
  { label: "Sell My Aircraft", icon: Tag, to: "/listings", color: "#4e8ef7" },
];

export default function NewHero({ listings = [], atiCards = [] }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [overlayData, setOverlayData] = useState(null);
  const [error, setError] = useState("");

  const search = async () => {
    const fullReg = normalizeReg(query);
    if (!fullReg) return;
    setSearching(true);
    setError("");
    try {
      const res = await base44.functions.invoke("globalAircraftLookup", { registration: fullReg });
      const data = res.data;
      if (!data.found) {
        setError(data.error || `No registry record found for ${fullReg}.`);
        setSearching(false);
        return;
      }
      let photo = null;
      try {
        const photoRes = await base44.functions.invoke("aircraftPhoto", {
          registration: data.aircraft.registration || fullReg,
          hex: data.aircraft.mode_s_hex,
          make: data.aircraft.make,
          model: data.aircraft.model,
        });
        if (photoRes.data?.photo_url) photo = photoRes.data;
      } catch (_) {}
      setOverlayData({
        result: { ...data.aircraft, _origin: data.origin_label, _source: data.source },
        photo,
        photoLoading: false,
        listingMatch: data.listing || null,
        areaServices: data.areaServices?.byRole || null,
        areaState: data.areaServices?.state || "",
      });
    } catch (_) {
      setError("Failed to search registry. Please try again.");
    }
    setSearching(false);
  };

  return (
    <section className="relative flex flex-col items-center justify-center px-4 sm:px-6 pt-16 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,160,23,0.10) 0%, transparent 70%)",
      }} />

      <div className="relative z-10 w-full max-w-[760px] flex flex-col items-center text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.22)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#D4A017" }} />
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: "#D4A017" }}>
            Trusted by 250,000+ Aviation Professionals
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-black tracking-[-0.04em] leading-[0.98] text-white mb-5"
          style={{ fontSize: "clamp(36px, 7vw, 68px)" }}>
          Global Aircraft
          <br />
          <span style={{ color: "#D4A017" }}>Marketplace</span>
        </h1>

        {/* Subhead */}
        <p className="text-[15px] sm:text-[18px] text-white/55 leading-relaxed max-w-[520px] mb-10">
          Buy, Sell &amp; Verify Aircraft Worldwide.
        </p>

        {/* Search bar */}
        <div className="w-full max-w-[560px] mb-3">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/30 mb-2.5 text-left pl-1">
            Search Aircraft Registration
          </p>
          <div className="flex items-stretch w-full rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(212,160,23,0.25)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}>
            <div className="flex items-center pl-4 pr-2">
              <Search className="w-4 h-4" style={{ color: "rgba(212,160,23,0.6)" }} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="N123AB"
              className="flex-1 py-3.5 text-[15px] font-semibold bg-transparent border-none outline-none"
              style={{ color: "#fff", background: "transparent !important", border: "none !important" }}
            />
            <button
              onClick={search}
              disabled={searching || !normalizeReg(query)}
              className="px-6 m-1 rounded-xl text-[12px] font-bold tracking-wider uppercase transition-all disabled:opacity-30 flex items-center gap-1.5"
              style={{ background: "#D4A017", color: "#0B1220" }}
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Search <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
          {error && (
            <p className="text-[11px] text-red-400 mt-2 text-left pl-1">{error}</p>
          )}
        </div>

        <p className="text-[11px] text-white/25 mb-8">or</p>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12 w-full max-w-[600px]">
          {QUICK_ACTIONS.map(({ label, icon: Icon, to, color }) => (
            <Link key={label} to={to}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:scale-[1.03]"
              style={{
                background: `${color}10`,
                border: `1px solid ${color}28`,
                color: color,
              }}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* Stats bar */}
        <div className="w-full max-w-[680px]">
          <div className="w-full h-[1px] mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(212,160,23,0.4), transparent)" }} />
          <div className="flex items-center justify-center gap-0 flex-wrap">
            {STATS.map((s, i) => (
              <div key={s.label}
                className={`flex-1 min-w-[140px] flex flex-col items-center px-4 py-2 ${i < STATS.length - 1 ? "border-r border-white/10" : ""}`}>
                <div className="text-[clamp(22px,3vw,32px)] font-black tabular-nums leading-none" style={{ color: "#D4A017" }}>
                  {s.value}
                </div>
                <div className="text-[9px] sm:text-[10px] tracking-[0.12em] uppercase text-white/45 mt-2 font-semibold text-center">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Registry overlay */}
      {overlayData && (
        <RegistryResultOverlay
          result={overlayData.result}
          photo={overlayData.photo}
          photoLoading={overlayData.photoLoading}
          listingMatch={overlayData.listingMatch}
          areaServices={overlayData.areaServices}
          areaState={overlayData.areaState}
          onClose={() => setOverlayData(null)}
        />
      )}
    </section>
  );
}