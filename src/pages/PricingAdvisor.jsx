import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, LockKeyhole, Plane, ShieldCheck, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FULL_REPORT_PRICE_ID = "price_1TaO1rAT7Be3WR6JaWnMa7mx";

const normalizeRegistration = (value) => String(value || "").trim().toUpperCase().replace(/\s+/g, "");

export default function PricingAdvisor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const registration = useMemo(() => normalizeRegistration(params.get("registration")), [params]);
  const [aircraft, setAircraft] = useState(null);
  const [loading, setLoading] = useState(Boolean(registration));
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!registration) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await base44.functions.invoke("aircraftDataHub", { registration });
        if (!cancelled) setAircraft(result?.data?.aircraft || result?.data?.data?.aircraft || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Aircraft data is temporarily unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [registration]);

  const startCheckout = async () => {
    if (!registration || checkoutLoading) return;
    setCheckoutLoading(true);
    setError("");
    try {
      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }
      const returnUrl = `${window.location.origin}/finance-advisor?registration=${encodeURIComponent(registration)}`;
      const response = await base44.functions.invoke("stripeCreateCheckout", {
        priceId: FULL_REPORT_PRICE_ID,
        returnUrl,
        report_registration: registration,
        product_key: "ATI_FULL_REPORT",
      });
      const url = response?.data?.sessionUrl || response?.data?.url;
      if (!url) throw new Error("Checkout URL was not returned.");
      window.location.assign(url);
    } catch (err) {
      setError(err?.message || "Checkout could not be started.");
      setCheckoutLoading(false);
    }
  };

  if (!registration) {
    return <main className="min-h-screen bg-[#070B12] px-6 py-20 text-white"><div className="mx-auto max-w-xl text-center"><p className="text-xs uppercase tracking-[0.3em] text-[#D4A017]">ABOS Pricing Advisor</p><h1 className="mt-4 text-4xl font-black">Search an aircraft first.</h1><button onClick={() => navigate("/")} className="mt-8 rounded-xl bg-[#D4A017] px-5 py-3 font-bold text-[#07101B]">Back to search</button></div></main>;
  }

  const make = aircraft?.make || aircraft?.manufacturer || "Aircraft";
  const model = aircraft?.model || "Identity found";
  const year = aircraft?.year || aircraft?.year_mfr;

  return (
    <main className="min-h-screen bg-[#070B12] px-4 py-6 text-white md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate("/")} className="mb-8 flex items-center gap-2 text-sm text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" /> Search another aircraft</button>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D4A017]">ABOS Pricing Advisor</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight">{registration}</h1>
                <p className="mt-2 text-lg text-white/65">{loading ? "Identifying aircraft…" : `${make} ${model}${year ? ` · ${year}` : ""}`}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><Plane className="h-6 w-6 text-[#D4A017]" /></div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {["Aircraft identity", "Registry evidence", "Market valuation", "Verification & ATI", "Activity evidence", "Deal assessment"].map((item, index) => (
                <div key={item} className="relative min-h-24 overflow-hidden rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="relative z-10 flex items-center justify-between"><span className="text-sm font-semibold text-white/75">{item}</span>{index < 2 ? <Check className="h-4 w-4 text-emerald-400" /> : <LockKeyhole className="h-4 w-4 text-white/25" />}</div>
                  <div className={`mt-4 h-3 rounded-full bg-white/10 ${index >= 2 ? "blur-[5px]" : ""}`} />
                  <div className={`mt-2 h-2 w-2/3 rounded-full bg-white/10 ${index >= 2 ? "blur-[5px]" : ""}`} />
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#D4A017]/20 bg-[#D4A017]/5 p-5">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" /><div><p className="font-bold">One aircraft. One intelligence profile.</p><p className="mt-1 text-sm leading-6 text-white/50">ABOS combines identity, registry, market, verification, activity and valuation evidence. Missing evidence is reported as unknown — not as a negative finding.</p></div></div>
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl md:sticky md:top-6 md:p-8">
            <div className="flex items-center gap-2 text-[#D4A017]"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-[0.25em]">Unlock</span></div>
            <h2 className="mt-4 text-2xl font-black">Full Aircraft Intelligence</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">Get the complete ABOS analysis for <strong className="text-white/80">{registration}</strong>.</p>
            <ul className="mt-6 space-y-3 text-sm text-white/65">
              {["Full aircraft profile", "Verification & evidence", "ATI transparency score", "Market valuation", "Activity signals", "Deal assessment"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />{item}</li>)}
            </ul>
            <div className="mt-8 border-t border-white/10 pt-6"><div className="flex items-end justify-between"><span className="text-sm text-white/40">One-time report</span><span className="text-3xl font-black">$99</span></div><button onClick={startCheckout} disabled={checkoutLoading || loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4A017] px-5 py-4 font-black text-[#07101B] transition hover:brightness-110 disabled:opacity-40">{checkoutLoading ? "Opening secure checkout…" : "Unlock Aircraft Intelligence"}<ArrowLeft className="h-4 w-4 rotate-180" /></button><p className="mt-3 text-center text-[10px] text-white/25">Secure payment powered by Stripe</p></div>
            {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{error}</p>}
          </aside>
        </div>
      </div>
    </main>
  );
}