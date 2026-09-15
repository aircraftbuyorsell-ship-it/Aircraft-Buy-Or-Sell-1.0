import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, LockKeyhole, Search, ShieldCheck, Sparkles, Send, Globe2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FULL_REPORT_PRICE_ID = "price_1TaO1rAT7Be3WR6JaWnMa7mx";
const normalizeRegistration = (value) => String(value || "").trim().toUpperCase().replace(/\s+/g, "");

export default function PricingAdvisor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const registration = useMemo(() => normalizeRegistration(params.get("registration")), [params]);
  const [aircraft, setAircraft] = useState(null);
  const [report, setReport] = useState(null);
  const [entitled, setEntitled] = useState(false);
  const [loading, setLoading] = useState(Boolean(registration));
  const [reportLoading, setReportLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!registration) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setError(""); setNotFound(false);
      try {
        const result = await base44.functions.invoke("aircraftPreview", { registration });
        if (cancelled) return;
        setAircraft(result?.data?.aircraft || null);
        setPreview(result?.data || null);
      } catch (err) {
        if (cancelled) return;
        const status = err?.status || err?.response?.status;
        // A missing registry match is not a negative result about the aircraft —
        // it only means no source has confirmed evidence for it yet.
        if (status === 404) setNotFound(true);
        else setError(err?.message || "Aircraft data is temporarily unavailable.");
      }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [registration]);

  useEffect(() => {
    if (!registration) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await base44.functions.invoke("abosEntitlements", { action: "check", product_key: "ATI_FULL_REPORT", aircraft_registration: registration });
        if (!cancelled && result?.data?.entitled) setEntitled(true);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [registration]);

  useEffect(() => {
    if (!registration || !entitled) return;
    let cancelled = false;
    (async () => {
      setReportLoading(true);
      try {
        const result = await base44.functions.invoke("aircraftIntelligenceReport", { registration });
        if (!cancelled) setReport(result?.data?.report || null);
      } catch (err) { if (!cancelled) setError(err?.message || "Your aircraft intelligence could not be loaded."); }
      finally { if (!cancelled) setReportLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [registration, entitled]);

  const startCheckout = async () => {
    if (!registration || checkoutLoading) return;
    setCheckoutLoading(true); setError("");
    try {
      const user = await base44.auth.me().catch(() => null);
      if (!user) { base44.auth.redirectToLogin(); return; }
      const returnUrl = `${window.location.origin}/finance-advisor?registration=${encodeURIComponent(registration)}`;
      const response = await base44.functions.invoke("stripeCreateCheckout", { priceId: FULL_REPORT_PRICE_ID, returnUrl, report_registration: registration, product_key: "ATI_FULL_REPORT" });
      const url = response?.data?.sessionUrl || response?.data?.url;
      if (!url) throw new Error("Checkout URL was not returned.");
      window.location.assign(url);
    } catch (err) { setError(err?.message || "Checkout could not be started."); setCheckoutLoading(false); }
  };

  if (!registration) return <main className="min-h-screen bg-[#fbfaf7] px-6 py-20 text-[#102033]"><div className="mx-auto max-w-xl text-center"><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a87925]">Aircraft Advisor</p><h1 className="mt-4 text-4xl font-black">Search an aircraft first.</h1><button onClick={() => navigate("/")} className="mt-8 rounded-xl bg-[#c99635] px-5 py-3 font-bold text-white">Back to search</button></div></main>;

  const make = aircraft?.make || aircraft?.manufacturer || "Aircraft";
  const model = aircraft?.model || "Identity found";
  const year = aircraft?.year;
  const unlocked = entitled && !!report;

  const sendMessage = (text = message) => {
    const value = String(text || "").trim();
    if (!value) return;
    setMessage("");
    if (/market|value|price/i.test(value)) navigate(`/finance-advisor?registration=${encodeURIComponent(registration)}&question=market-value`);
  };

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
            <h1 className="mt-4 text-4xl font-black tracking-[-0.035em] md:text-5xl">Ask. Analyze. Make better decisions.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#102033]/55">Your AI-powered aviation intelligence assistant. Verified data, global registries and market intelligence in one place.</p>
            <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-[#102033]/10 bg-white px-3 py-1.5 text-xs"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-emerald-600" /> Verified sources</span><span className="rounded-full border border-[#102033]/10 bg-white px-3 py-1.5 text-xs"><Globe2 className="mr-1 inline h-3.5 w-3.5 text-[#b98427]" /> Global registries</span><span className="rounded-full border border-[#102033]/10 bg-white px-3 py-1.5 text-xs">Transparent calculations</span></div>

            <div className="mt-10 flex justify-end"><div className="max-w-lg rounded-2xl border border-[#102033]/10 bg-white px-5 py-4 text-sm shadow-sm">Show me the full intelligence report for <b>{registration}</b></div></div>
            <div className="mt-4 flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#101a25] text-sm font-black text-white">N<span className="text-[#d6a33e]">↗</span></div><div className="max-w-2xl rounded-2xl border border-[#102033]/10 bg-white px-5 py-4 text-sm leading-6 shadow-sm">
              {loading && `I’m identifying ${registration} and checking available registry evidence…`}
              {!loading && notFound && <>No connected source has confirmed evidence for <b>{registration}</b> yet. This is not a finding about the aircraft itself — it may not be covered by a connected registry or market source yet.</>}
              {!loading && !notFound && <>I found <b>{registration}</b>. Here is the available {make} {model}{year ? ` (${year})` : ""} profile and your report options.</>}
            </div></div>

            <div className="mt-5 rounded-3xl border border-[#102033]/10 bg-white p-5 shadow-[0_18px_50px_rgba(16,32,51,0.06)] md:p-6">
              <div className="grid gap-5 md:grid-cols-[150px_1fr] md:items-center"><div className="flex h-28 items-center justify-center rounded-2xl bg-[#eee9df] text-5xl">✈</div><div><div className="text-xl font-black">{registration} <span className="text-sm font-normal">🌐</span></div><div className="mt-1 text-sm text-[#102033]/60">{make} {model}{year ? ` · ${year}` : ""}</div>{notFound ? <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">No registry match yet — not a negative finding</div> : <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4" /> {aircraft?.registry?.status || "Registry evidence available"}</div>}</div></div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2"><button onClick={startCheckout} disabled={checkoutLoading || loading || unlocked || notFound} className="flex items-center justify-center gap-2 rounded-xl bg-[#c99635] px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><LockKeyhole className="h-4 w-4" /> {unlocked ? "Full report unlocked" : checkoutLoading ? "Opening checkout…" : "View Full Intelligence Report"}<ArrowRight className="h-4 w-4" /></button><button onClick={() => setShowPreview((v) => !v)} disabled={loading || notFound || !preview} className="rounded-xl border border-[#102033]/10 px-4 py-3 text-sm font-semibold disabled:opacity-40">{showPreview ? "Hide Free Preview" : "View Free Preview"}</button></div>
              {showPreview && preview && (
                <div className="mt-4 rounded-2xl border border-[#102033]/10 bg-[#fbfaf7] p-4 text-xs">
                  <div className="font-bold text-[#102033]/70">Free identity preview</div>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    {[["Make", aircraft?.make], ["Model", aircraft?.model], ["Year", aircraft?.year], ["Serial number", aircraft?.serial_number], ["Registration status", aircraft?.status || "—"]].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 border-b border-[#102033]/[0.06] pb-1"><dt className="text-[#102033]/45">{k}</dt><dd className="font-semibold">{v || "—"}</dd></div>
                    ))}
                  </dl>
                  {preview?.evidence && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Object.entries(preview.evidence).map(([k, v]) => <span key={k} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${v ? "bg-emerald-50 text-emerald-700" : "bg-[#102033]/5 text-[#102033]/45"}`}>{k.replace(/_/g, " ")}: {v ? "found" : "unknown"}</span>)}
                    </div>
                  )}
                  <p className="mt-3 text-[10px] text-[#102033]/45">Full intelligence — ATI score, valuation, verification and market analysis — is available after checkout.</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">{["What’s the current market value?", "Any open ADs or STCs?", "Show me the ownership history"].map((q) => <button key={q} onClick={() => sendMessage(q)} className="rounded-full border border-[#102033]/10 bg-white px-4 py-2 text-xs text-[#102033]/65 hover:border-[#c99635]/50">{q}</button>)}</div>
            {unlocked && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><b className="text-sm text-emerald-800">Full Aircraft Intelligence unlocked.</b><div className="mt-3 grid gap-2 sm:grid-cols-2">{[["Identity",report?.identity],["Registry",report?.registry],["ATI",report?.ati],["Valuation",report?.valuation],["Activity",report?.activity]].map(([title,data]) => <div key={title} className="rounded-xl bg-white/80 p-3"><div className="text-xs font-bold">{title}</div><pre className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap text-[10px] text-[#102033]/55">{JSON.stringify(data,null,2)}</pre></div>)}</div></div>}

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="sticky bottom-4 mt-8 flex items-center rounded-2xl border border-[#c99635]/50 bg-white p-1.5 shadow-[0_15px_40px_rgba(16,32,51,0.10)]"><span className="pl-3 text-lg">⌕</span><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask me anything about this aircraft..." className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none placeholder:text-[#102033]/35" /><button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c99635] text-white"><Send className="h-4 w-4" /></button></form>
            {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
          </div>
        </section>

        <aside className="hidden bg-white/75 p-6 lg:block"><div className="sticky top-[96px] rounded-3xl border border-[#102033]/10 bg-white p-6 shadow-sm"><div className="text-xl font-black">{registration}</div><div className="mt-1 text-sm text-[#102033]/55">{make} {model} {year ? `· ${year}` : ""}</div>{notFound ? <div className="mt-5 flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">No registry match yet</div> : <div className="mt-5 flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Registry evidence available</div>}<h3 className="mt-6 border-b border-[#102033]/10 pb-3 text-sm font-black">Aircraft Overview</h3><dl className="divide-y divide-[#102033]/[0.07] text-xs">{[["Registration",registration],["Make / Model",`${make} ${model}`],["Year",year || "—"],["Serial Number",aircraft?.serial_number || "—"]].map(([k,v]) => <div key={k} className="flex justify-between gap-4 py-3"><dt className="text-[#102033]/45">{k}</dt><dd className="font-semibold text-right">{v}</dd></div>)}</dl><h3 className="mt-5 border-b border-[#102033]/10 pb-3 text-sm font-black">Quick Actions</h3><div className="space-y-2 pt-3"><button onClick={startCheckout} disabled={unlocked || notFound} className="w-full rounded-xl bg-[#c99635] px-3 py-3 text-xs font-bold text-white disabled:opacity-50">{unlocked ? "Full Report Unlocked" : "View Full Intelligence Report"} <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button><button className="w-full rounded-xl border border-[#102033]/10 px-3 py-3 text-left text-xs">Market Valuation (OMVM)</button><button className="w-full rounded-xl border border-[#102033]/10 px-3 py-3 text-left text-xs">Check ADs & STCs</button><button className="w-full rounded-xl border border-[#102033]/10 px-3 py-3 text-left text-xs">View Service History</button></div><div className="mt-6 border-t border-[#102033]/10 pt-5 text-[10px] leading-5 text-[#102033]/45">Data is aggregated from multiple verified sources and global registries.<br /><b className="text-[#a87925]">Trust by design.</b></div></div></aside>
      </div>
    </main>
  );
}
