import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import { lookupAircraft } from "@/lib/aircraftLookup";
import { Search, Loader2, ArrowRight, Plane, ShieldCheck, Radar } from "lucide-react";

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
    <section className="relative overflow-hidden border-b border-border">
      {/* Background gradient — auto light/dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/40" />

      {/* Globe — right side, desktop only */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-60 dark:opacity-40 hidden md:block">
        <HeroGlobe />
      </div>

      {/* Subtle dot grid overlay */}
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-50" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4A017]/20 bg-[#D4A017]/[0.06] px-3 py-1.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#D4A017]" />
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A67C00] dark:text-[#D4A017]">
              ABOS MarketSpace 1.0
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-4 text-4xl font-black leading-[1.08] tracking-tight text-foreground md:text-6xl">
            Aircraft Intelligence,
            <br />
            <span className="bg-gradient-to-r from-[#D4A017] to-[#F5C842] bg-clip-text text-transparent">
              Verified.
            </span>
          </h1>

          <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Search any tail number to unlock its Digital Twin — ATI score, market valuation,
            ownership history, and verification status, all in one place.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative mb-3 max-w-lg">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setError(null); }}
                  placeholder="Enter tail number (e.g. N123AB)"
                  className="w-full bg-transparent py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#C9A22F] disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">Verify</span>
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
                className="rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs font-bold text-foreground transition hover:border-[#D4A017]/40 hover:bg-[#D4A017]/[0.04]"
              >
                {reg}
              </button>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <TrustItem icon={ShieldCheck} label="FAA Verified" />
            <TrustItem icon={Radar} label="Live ADS-B" />
            <TrustItem icon={Plane} label="Global Registry" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustItem({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-[#D4A017]" />
      <span className="text-xs font-bold text-muted-foreground">{label}</span>
    </div>
  );
}