import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import TwinResultCard from "@/components/twin/TwinResultCard";
import ReportEmailModal from "@/components/twin/ReportEmailModal";
import ReportDeliveredBanner from "@/components/twin/ReportDeliveredBanner";

const AMBER = "#f5c242";

export default function NLookup() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [fulfillment, setFulfillment] = useState(null);

  // Handle return from Stripe checkout → trigger PDF delivery
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("report_session");
    const reg = params.get("report_reg");
    if (sessionId && params.get("success") === "true") {
      setFulfillment({ status: "processing", registration: reg });
      base44.functions.invoke("reportFulfill", { session_id: sessionId })
        .then((res) => setFulfillment({ status: "delivered", email: res.data?.email, registration: reg }))
        .catch((e) => setFulfillment({ status: "error", message: e.message, registration: reg }));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("publicTwinLookup", { query: query.trim() });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-20">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.25)" }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: AMBER }} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black" style={{ color: AMBER }}>
              ATI Verify · Independent Aircraft Intelligence
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[rgba(255,255,255,0.92)] tracking-tight">
            Check any aircraft before you buy
          </h1>
          <p className="text-sm text-[rgba(255,255,255,0.55)] mt-3 max-w-md mx-auto leading-relaxed">
            Enter an N-Number, registration marking or serial number. We verify against the FAA registry,
            ADS-B flight data, document filings and market records.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="w-full mb-8">
          <div
            className="flex items-stretch w-full rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(245,194,66,0.22)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              height: 56,
            }}
          >
            <div className="flex items-center pl-4 pr-2">
              <Search className="w-4 h-4" style={{ color: "rgba(245,194,66,0.60)" }} />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="N-Number, registration or serial number"
              className="flex-1 min-w-0 text-[15px] font-semibold bg-transparent border-none outline-none"
              style={{ color: "#fff", background: "transparent !important", border: "none !important" }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 m-1 rounded-xl text-[12px] font-bold tracking-wider uppercase transition-all disabled:opacity-30 flex items-center gap-1.5 shrink-0"
              style={{ background: AMBER, color: "#04060a" }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Search <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </form>

        {fulfillment && <ReportDeliveredBanner fulfillment={fulfillment} />}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-[#e24b4a] mb-6"
            style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
            {error}
          </div>
        )}

        {result && !result.found && (
          <div className="rounded-xl px-5 py-6 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[rgba(255,255,255,0.75)] font-bold">No aircraft found for "{query}"</p>
            <p className="text-[12px] text-[rgba(255,255,255,0.45)] mt-1">
              Check the N-Number spelling. International registrations are being added progressively.
            </p>
          </div>
        )}

        {result?.found && (
          <TwinResultCard result={result} onGetReport={() => setEmailModalOpen(true)} />
        )}

        {/* Trust footer */}
        <div className="mt-12 grid grid-cols-3 gap-3 text-center">
          {[
            { n: "300k+", l: "FAA records" },
            { n: "8", l: "ATI dimensions" },
            { n: "€29", l: "Full PDF report" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl py-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <p className="text-lg font-black" style={{ color: AMBER }}>{s.n}</p>
              <p className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.4)]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {emailModalOpen && result?.found && (
        <ReportEmailModal registration={result.registration} onClose={() => setEmailModalOpen(false)} />
      )}
    </div>
  );
}