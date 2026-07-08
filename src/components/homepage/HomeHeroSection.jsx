import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RegistryResultOverlay from "@/components/dashboard/RegistryResultOverlay";
import AviationIntelligenceGlobe from "@/components/homepage/AviationIntelligenceGlobe";

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

const PLACEHOLDERS = ["N-Number", "Registration", "Serial Number", "ATI ID", "Owner"];
const STATS = [
{ value: "312,845", label: "Aircraft" },
{ value: "280,000", label: "ATI Passports" },
{ value: "4,891", label: "Verified Listings" },
{ value: "2,341", label: "Verified Dealers" }];


export default function HomeHeroSection() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [overlayData, setOverlayData] = useState(null);
  const [error, setError] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholder, setPlaceholder] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    let charIdx = 0;
    let isDeleting = false;
    let timeout;

    const type = () => {
      const full = PLACEHOLDERS[placeholderIdx];
      if (!isDeleting) {
        charIdx++;
        setPlaceholder(full.slice(0, charIdx));
        if (charIdx === full.length) {
          timeout = setTimeout(() => {isDeleting = true;type();}, 1800);
          return;
        }
      } else {
        charIdx--;
        setPlaceholder(full.slice(0, charIdx));
        if (charIdx === 0) {
          isDeleting = false;
          setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length);
          timeout = setTimeout(type, 200);
          return;
        }
      }
      timeout = setTimeout(type, isDeleting ? 40 : 80);
    };
    type();

    return () => clearTimeout(timeout);
  }, [placeholderIdx]);

  useEffect(() => {
    const onFocus = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 300);
    };
    window.addEventListener("abos:focus-hero-search", onFocus);
    return () => window.removeEventListener("abos:focus-hero-search", onFocus);
  }, []);

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
          model: data.aircraft.model
        });
        if (photoRes.data?.photo_url) photo = photoRes.data;
      } catch (_) {}
      // ABOS ATI Card + passport lookup (public data)
      let atiCard = null;
      let passport = null;
      try {
        const [cards, passports] = await Promise.all([
        base44.entities.ATICard.filter({ aircraft_registration: fullReg }, "-created_date", 1),
        base44.entities.ATIPassport.filter({ registration: fullReg }, "-created_date", 1)]
        );
        atiCard = cards[0] || null;
        passport = passports[0] || null;
      } catch (_) {}
      setOverlayData({
        result: { ...data.aircraft, _origin: data.origin_label, _source: data.source },
        atiCard,
        passport,
        photo,
        photoLoading: false,
        listingMatch: data.listing || null,
        areaServices: data.areaServices?.byRole || null,
        areaState: data.areaServices?.state || ""
      });
    } catch (_) {
      setError("Failed to search registry. Please try again.");
    }
    setSearching(false);
  };

  return (
    <section
      className="relative w-full"
      style={{ minHeight: "100vh", overflow: "hidden" }}>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
          "radial-gradient(ellipse 70% 50% at 72% 40%, rgba(245,194,66,0.10) 0%, transparent 70%)"
        }} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.06
        }} />

      {/* Two-column hero: content left · signature globe right */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-4 sm:px-8 pt-28 pb-16 lg:py-0">
        <div className="w-full max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] items-center gap-10 lg:gap-6">

          {/* ── Left: headline · CTAs · value prop · search ── */}
          <div className="w-full flex flex-col items-start text-left lg:pt-10">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{
                background: "rgba(245,194,66,0.09)",
                border: "0.5px solid rgba(245,194,66,0.22)"
              }}>

              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#f5c242" }} />

              <span
                className="text-[10px] font-bold tracking-[0.16em] uppercase"
                style={{ color: "#f5c242" }}>

                ABOS™ Platform
              </span>
            </div>

            <h1
              className="tracking-[-0.03em] leading-[1.04] text-white mb-6"
              style={{ fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 500 }}>

              The Aviation
              <br />
              <span style={{ color: "#f5c242", fontWeight: 700 }}>Intelligence</span> Platform
            </h1>

            {/* CTA row — filled + ghost */}
            <div className="flex flex-wrap items-center gap-3 mb-7">
              <Link
                to="/listings"
                className="px-6 py-3 rounded-xl text-[13px] font-bold transition-all hover:scale-[1.02]"
                style={{ background: "#f5c242", color: "#04060a", textDecoration: "none" }}>

                Browse Aircraft
              </Link>
              <Link
                to="/ati-verify"
                className="px-6 py-3 rounded-xl text-[13px] font-bold transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.14)",
                  color: "rgba(255,255,255,0.85)",
                  textDecoration: "none"
                }}>

                Verify an Aircraft
              </Link>
            </div>

            <p className="text-[14px] sm:text-[16px] leading-relaxed max-w-[480px] mb-8" style={{ color: "rgba(255,255,255,0.60)" }}>
              Trust before transaction — verified aircraft identity,
              AI valuations and end-to-end deal tools in one platform.
            </p>

            <div className="w-full max-w-[560px] mb-10">
              <div
                className="flex items-stretch w-full rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(245,194,66,0.22)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  height: 56
                }}>

                <div className="flex items-center pl-4 pr-2">
                  <Search
                    className="w-4 h-4"
                    style={{ color: "rgba(245,194,66,0.60)" }} />

                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search()}
                  placeholder={placeholder}
                  className="flex-1 text-[15px] font-semibold bg-transparent border-none outline-none"
                  style={{
                    color: "#fff",
                    background: "transparent !important",
                    border: "none !important"
                  }} />

                <button
                  onClick={search}
                  disabled={searching || !normalizeReg(query)}
                  className="px-6 m-1 rounded-xl text-[12px] font-bold tracking-wider uppercase transition-all disabled:opacity-30 flex items-center gap-1.5 shrink-0"
                  style={{ background: "#f5c242", color: "#04060a" }}>

                  {searching ?
                  <Loader2 className="w-4 h-4 animate-spin" /> :

                  <>
                      Search <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  }
                </button>
              </div>
              {error &&
              <p className="text-[11px] text-red-400 mt-2 text-left pl-1">
                  {error}
                </p>
              }
            </div>

            {/* Trusted-by strip — neon pill capsules */}
            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="text-[10px] font-bold tracking-[0.14em] uppercase leading-snug px-3.5 py-2 rounded-full whitespace-nowrap"
                  style={{
                    color: "rgba(245,194,66,0.70)",
                    background: "rgba(245,194,66,0.06)",
                    border: "0.5px solid rgba(245,194,66,0.18)"
                  }}>
                  The global aircraft identity &amp; sales network
                </span>
                {STATS.map((s, i) => (
                  <div
                    key={s.label}
                    className="flex items-baseline gap-1.5 px-3.5 py-2 rounded-full transition-all hover:scale-[1.03]"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "0.5px solid rgba(245,194,66,0.16)",
                      boxShadow: `0 0 18px rgba(245,194,66,${0.04 + i * 0.015}), inset 0 1px 0 rgba(255,255,255,0.04)`
                    }}>
                    <span className="text-[15px] sm:text-[18px] font-black tabular-nums leading-none" style={{ color: "#f5c242" }}>
                      {s.value}
                    </span>
                    <span className="text-[8px] tracking-[0.12em] uppercase font-semibold leading-none" style={{ color: "rgba(255,255,255,0.42)" }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Aviation Intelligence Globe — the ABOS visual signature ── */}
          <div className="hidden lg:flex items-center justify-center relative">
            <AviationIntelligenceGlobe size={560} />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#5dcaa5" }} />
              <span className="text-[9px] tracking-[0.18em] uppercase font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
                Live aviation intelligence
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
          Scroll
        </span>
        <div
          className="w-[1px] h-8"
          style={{
            background:
            "linear-gradient(180deg, rgba(245,194,66,0.4), transparent)"
          }} />

      </div>

      {overlayData &&
      <RegistryResultOverlay
        result={overlayData.result}
        atiCard={overlayData.atiCard}
        passport={overlayData.passport}
        photo={overlayData.photo}
        photoLoading={overlayData.photoLoading}
        listingMatch={overlayData.listingMatch}
        areaServices={overlayData.areaServices}
        areaState={overlayData.areaState}
        onClose={() => setOverlayData(null)} />

      }
    </section>);

}