import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import { lookupAircraft } from "@/lib/aircraftLookup";
import { Loader2 } from "lucide-react";

/* Brand icons from DESIGN_SYSTEM.md */
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />
  </svg>
);
const RadarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /><path d="M4 6h.01" /><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" /><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" /><path d="M12 18h.01" /><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" /><circle cx="12" cy="12" r="2" /><path d="m13.41 10.59 5.66-5.66" />
  </svg>
);
const PlaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
);

export default function HomeHero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const reg = (query || "").toUpperCase().trim();
    if (!reg) return;
    setLoading(true);
    setError(null);
    try {
      const data = await lookupAircraft(reg);
      if (!data?.found) {
        setError(data?.error || `No aircraft found for ${reg}.`);
        return;
      }
      navigate(`/twin/${encodeURIComponent(reg)}`);
    } catch (err) {
      setError(err?.message || "Lookup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--brand-background)" }}>
      {/* Globe — right side, desktop only */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-40 hidden md:block">
        <HeroGlobe />
      </div>

      {/* Subtle dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-50" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          {/* Promo badge */}
          <div className="mb-5">
            <span className="abos-badge-promo">
              <span className="abos-badge-promo-dot" aria-hidden="true" />
              ABOS MarketSpace 1.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-4 text-4xl text-foreground md:text-6xl" style={{ lineHeight: "1.08" }}>
            Aircraft Intelligence,
            <br />
            <span style={{ color: "var(--brand-primary)" }}>Verified.</span>
          </h1>

          <p className="mb-8 max-w-xl text-base text-muted-foreground md:text-lg" style={{ lineHeight: "1.6" }}>
            Search any tail number to unlock its Digital Twin — ATI score, market valuation,
            ownership history, and verification status, all in one place.
          </p>

          {/* Tail-number search — from design system */}
          <form onSubmit={handleSearch} className="abos-tail-search mb-3">
            <div className="abos-tail-search-shell">
              <div className="abos-tail-search-field">
                <span className="abos-tail-search-leading"><SearchIcon /></span>
                <input
                  className="abos-tail-search-input"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setError(null); }}
                  placeholder="Enter aircraft ID"
                  aria-label="Aircraft tail number"
                  type="text"
                />
              </div>
              <button className="abos-tail-search-submit" type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon />}
                <span>Check</span>
              </button>
            </div>
          </form>

          {error && (
            <p className="mb-3 text-sm text-destructive">{error}</p>
          )}

          {/* Quick links */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Popular:</span>
            {["N123AB", "G-ABCD", "D-ELYX"].map((reg) => (
              <button
                key={reg}
                onClick={() => setQuery(reg)}
                className="abos-badge-tag"
                style={{ minHeight: "auto", fontSize: "11px", cursor: "pointer" }}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <TrustItem icon={<ShieldCheckIcon />} label="FAA Verified" />
            <TrustItem icon={<RadarIcon />} label="Live ADS-B" />
            <TrustItem icon={<PlaneIcon />} label="Global Registry" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({ icon, label }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
    </div>
  );
}