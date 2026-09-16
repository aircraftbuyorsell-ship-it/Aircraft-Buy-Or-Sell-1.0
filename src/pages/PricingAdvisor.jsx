import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, LockKeyhole, Search, ShieldCheck, Sparkles, Loader2, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { checkEntitlement, createCheckout } from "@/lib/entitlements";
import AdvisorIntelligence from "@/components/advisor/AdvisorIntelligence";
import AdvisorPricingTiers from "@/components/advisor/AdvisorPricingTiers";
import { normalizeReg as normalizeRegistration } from "@/lib/aircraftLookup";

const TIER_KEYS = ["ATI_REPORT", "DEAL_ANALYSIS", "INVESTMENT"];

export default function PricingAdvisor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const registration = useMemo(() => normalizeRegistration(params.get("registration")), [params]);
  const justPaid = params.get("paid") === "1" || params.get("success") === "true";

  const [data, setData] = useState(null);
  const [tiers, setTiers] = useState({});
  const [loading, setLoading] = useState(Boolean(registration));
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!registration) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(""); setNotFound(false); setData(null);
      try {
        const result = await base44.functions.invoke("globalAircraftLookup", { registration });
        if (cancelled) return;
        if (result?.data?.found) setData(result.data);
        else if (result?.data?.found === false) setNotFound(true);
        else setError(result?.data?.error || "Aircraft data is temporarily unavailable.");
      } catch (err) {
        if (cancelled) return;
        const status = err?.status || err?.response?.status;
        if (status === 401) { base44.auth.redirectToLogin(); return; }
        if (status === 404) setNotFound(true);
        else setError(err?.message || "Aircraft data is temporarily unavailable.");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [registration, justPaid]);

  useEffect(() => {
    if (!registration) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        TIER_KEYS.map((key) => checkEntitlement(key, registration).catch(() => null))
      );
      if (cancelled) return;
      const next = {};
      TIER_KEYS.forEach((key, i) => { next[key] = entries[i] || null; });
      setTiers(next);
    })();
    return () => { cancelled = true; };
  }, [registration, justPaid]);

  const startCheckout = async (productKey) => {
    if (!registration || checkoutLoading) return;
    setCheckoutLoading(productKey); setError("");
    try {
      const user = await base44.auth.me().catch(() => null);
      if (!user) { base44.auth.redirectToLogin(); return; }
      const returnUrl = `${window.location.origin}/finance-advisor?registration=${encodeURIComponent(registration)}`;
      const res = await createCheckout(productKey, registration, returnUrl);
      const url = res?.url;
      if (!url) throw new Error("Checkout URL was not returned.");
      window.location.assign(url);
    } catch (err) { setError(err?.message || "Checkout could not be started."); setCheckoutLoading(null); }
  };

  if (!registration) return <main className="min-h-screen bg-[#fbfaf7] px-6 py-20 text-[#102033]"><div className="mx-auto max-w-xl text-center"><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a87925]">Aircraft Advisor</p><h1 className="mt-4 text-4xl font-black">Search an aircraft first.</h1><button onClick={() => navigate("/")} className="mt-8 rounded-xl bg-[#c99635] px-5 py-3 font-bold text-white">Back to search</button></div></main>;

  const ac = data?.aircraft || {};
  const make = ac.make || ac.manufacturer || "Aircraft";
  const model = ac.model || "Identity found";
  const year = ac.year;
  const unlocked = !!(data?.premium?.unlocked && data?.premium?.data?.valuation);
  const insufficient = data?.data_sufficiency === "insufficient";

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#102033]">
      <header className="sticky top-0 z-30 border-b border-[#102033]/[0.08] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-5 md:px-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101a25] text-lg font-black text-white ring-1 ring-[#c99635]">N<span className="text-[#d6a33e]">↗</span></span><span><b className="block text-xl leading-none">ABOS</b><small className="text-[7px] font-bold tracking-[.25em] text-[#a87925]">AIRCRAFT BUY OR SELL</small></span></button>
          <nav className="hidden items-center gap-7 text-sm md:flex"><button>About Us</button><button>How It Works</button><button>FAQ</button><button onClick={() => navigate("/my-account")}>User Account</button></nav>
          <form onSubmit={(e) => { e.preventDefault(); navigate(`/finance-advisor?registration=${encodeURIComponent(normalizeRegistration(e.currentTarget.elements.search.value))}`); }} className="hidden w-[250px] items-center rounded-xl border border-[#c99635]/50 bg-white px-3 md:flex"><Search className="h-4 w-4 text-[#102033]/40" /><input name="search" defaultValue={registration} placeholder="Search registration..." className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs outline-none" /></form>
        </div>
      </header>

      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-[1500px] lg:grid-cols-[1fr_360px]">
        <section className="relative overflow-hidden border-r border-[#102033]/[0.08] px-5 py-8 md:px-10 lg:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(16,32,51,0.13)_0.65px,transparent_0.65px)] [background-size:12px_12px]" />
          <div className="relative mx-auto max-w-4xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#a87925]"><Sparkles className="h-4 w-4" /> Aircraft Advisor</div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">{registration}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#102033]/55">{loading ? "Checking registry evidence and public data sources…" : notFound ? "No connected source has confirmed evidence for this registration yet." : `${make} ${model}${year ? ` (${year})` : ""} — verified data from public registries and live feeds.`}</p>

            {loading && <div className="mt-10 flex items-center gap-3 text-sm text-[#102033]/50"><Loader2 className="h-5 w-5 animate-spin text-[#c99635]" /> Federating FAA registry, engine reference, compliance, filings and ADS-B activity…</div>}

            {notFound && <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6"><div className="flex items-center gap-2 text-amber-800"><ShieldCheck className="h-5 w-5" /><h3 className="text-sm font-black">No registry match yet</h3></div><p className="mt-2 text-xs text-amber-700/80">This is not a negative finding about the aircraft — it may not be covered by a connected registry or market source yet. Search the official FAA registry directly.</p><a href="https://www.faa.gov/" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-xl border border-amber-300/60 bg-white px-4 py-2 text-xs font-bold text-amber-800">Search FAA Registry ↗</a></div>}

            {!loading && !notFound && data && (
              <>
                <div className="mt-8 flex flex-wrap gap-2">
                  <span className="rounded-full border border-[#102033]/10 bg-white px-3 py-1.5 text-xs"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> {data.origin_label || "Registry evidence"}</span>
                  {data.data_sources?.map((s) => <span key={s} className="rounded-full border border-[#102033]/10 bg-white px-3 py-1.5 text-[10px] font-semibold text-[#102033]/55">{s}</span>)}
                </div>
                <div className="mt-6">
                  <AdvisorIntelligence data={data} unlocked={unlocked} />
                </div>
                {!insufficient && (
                  <AdvisorPricingTiers
                    registration={registration}
                    tiers={tiers}
                    loadingTier={checkoutLoading}
                    onPurchase={startCheckout}
                    justPaid={justPaid}
                  />
                )}
              </>
            )}

            {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          </div>
        </section>

        <aside className="hidden bg-white/75 p-6 lg:block">
          <div className="sticky top-[96px] rounded-3xl border border-[#102033]/10 bg-white p-6 shadow-sm">
            <div className="text-xl font-black">{registration}</div>
            <div className="mt-1 text-sm text-[#102033]/55">{make} {model} {year ? `· ${year}` : ""}</div>
            {notFound ? <div className="mt-5 flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">No registry match yet</div> : <div className="mt-5 flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Registry evidence available</div>}
            <h3 className="mt-6 border-b border-[#102033]/10 pb-3 text-sm font-black">Aircraft Overview</h3>
            <dl className="divide-y divide-[#102033]/[0.07] text-xs">{[["Registration", registration], ["Make / Model", `${make} ${model}`], ["Year", year || "—"], ["Serial Number", ac.serial_number || "—"], ["Mode-S Hex", ac.mode_s_hex || "—"], ["Status", ac.status || "—"]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-[#102033]/45">{k}</dt><dd className="font-semibold text-right">{v}</dd></div>)}</dl>
            <h3 className="mt-5 border-b border-[#102033]/10 pb-3 text-sm font-black">Your Reports</h3>
            <div className="space-y-2 pt-3 text-xs">
              {TIER_KEYS.map((key) => {
                const t = tiers[key];
                const owned = t?.entitled;
                return (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-[#102033]/8 px-3 py-2">
                    <span className="font-semibold">{key.replace(/_/g, " ")}</span>
                    <span className={`font-bold ${owned ? "text-emerald-600" : "text-[#102033]/45"}`}>{owned ? "Owned" : "—"}</span>
                  </div>
                );
              })}
              <button onClick={() => navigate("/my-reports")} className="w-full rounded-xl border border-[#102033]/10 px-3 py-3 text-left text-xs">My Reports ↗</button>
            </div>
            <div className="mt-6 flex items-start gap-2 border-t border-[#102033]/10 pt-5 text-[10px] leading-5 text-[#102033]/45"><Mail className="mt-0.5 h-3.5 w-3.5 flex-none text-[#a87925]" /><span>Reports are compiled into a PDF and emailed after payment. Owner data is masked. <b className="text-[#a87925]">Trust by design.</b></span></div>
          </div>
        </aside>
      </div>
    </main>
  );
}