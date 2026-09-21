import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { checkEntitlement, createCheckout } from "@/lib/entitlements";
import { normalizeReg as normalizeRegistration } from "@/lib/aircraftLookup";
import { loadRecentSearches, saveRecentSearch } from "@/lib/recentSearches";
import AdvisorHero from "@/components/advisor/AdvisorHero";
import RecentSearchStrip from "@/components/advisor/RecentSearchStrip";
import AircraftIdentityPanel from "@/components/advisor/AircraftIdentityPanel";
import AircraftListingGrid from "@/components/advisor/AircraftListingGrid";
import AdvisorIntelligence from "@/components/advisor/AdvisorIntelligence";
import AdvisorPricingTiers from "@/components/advisor/AdvisorPricingTiers";
import LimitedOfferBanner from "@/components/advisor/LimitedOfferBanner";
import ReportEvidenceInput from "@/components/advisor/ReportEvidenceInput";
import AdvisorStorySections from "@/components/advisor/AdvisorStorySections";

const TIER_KEYS = ["ATI_REPORT", "DEAL_ANALYSIS", "INVESTMENT"];

export default function PricingAdvisor() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const registration = useMemo(() => normalizeRegistration(params.get("registration")), [params]);
  const justPaid = params.get("paid") === "1" || params.get("success") === "true";
  const [query, setQuery] = useState(registration || "");
  const [recent, setRecent] = useState(() => loadRecentSearches());
  const [data, setData] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [listings, setListings] = useState([]);
  const [tiers, setTiers] = useState({});
  const [loading, setLoading] = useState(Boolean(registration));
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [offerExpiresAt, setOfferExpiresAt] = useState(null);
  const [reportInputId, setReportInputId] = useState("");

  const goToAircraft = (value) => {
    const normalized = normalizeRegistration(value);
    if (!normalized) return;
    setRecent(saveRecentSearch(normalized, recent));
    navigate(`/verify?registration=${encodeURIComponent(normalized)}`);
  };

  useEffect(() => { setQuery(registration || ""); }, [registration]);

  useEffect(() => {
    if (registration) return;
    base44.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-updated_date", 3)
      .then(setListings).catch(() => setListings([]));
  }, [registration]);

  useEffect(() => {
    if (!registration) { setData(null); setPhoto(null); setNotFound(false); return; }
    setRecent((current) => saveRecentSearch(registration, current));
    let cancelled = false;
    (async () => {
      setLoading(true); setError(""); setNotFound(false); setData(null); setPhoto(null);
      try {
        const [lookup, photoResult, related] = await Promise.all([
          base44.functions.invoke("globalAircraftLookup", { registration }),
          base44.functions.invoke("aircraftPhoto", { registration }).catch(() => null),
          base44.entities.AircraftListing.filter({ registration, status: "active", visibility: "public" }, "-updated_date", 3).catch(() => []),
        ]);
        if (cancelled) return;
        if (lookup?.data?.found) {
          setData(lookup.data); setListings(related);
          const fetchedPhoto = photoResult?.data;
          setPhoto(fetchedPhoto?.photo_url ? fetchedPhoto : lookup.data.aircraft?.url_photo ? { photo_url: lookup.data.aircraft.url_photo, source: "ADS-BDB" } : null);
        } else setNotFound(true);
      } catch (err) {
        if (cancelled) return;
        const status = err?.status || err?.response?.status;
        if (status === 401) { base44.auth.redirectToLogin(); return; }
        if (status === 404) setNotFound(true); else setError(err?.message || "Aircraft data is temporarily unavailable.");
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [registration, justPaid]);

  useEffect(() => {
    if (!registration) return;
    let cancelled = false;
    Promise.all(TIER_KEYS.map((key) => checkEntitlement(key, registration).catch(() => null))).then((entries) => {
      if (cancelled) return;
      const next = {}; TIER_KEYS.forEach((key, i) => { next[key] = entries[i]; });
      setTiers(next); setOfferExpiresAt(entries[0]?.offer_expires_at || null);
    });
    return () => { cancelled = true; };
  }, [registration, justPaid]);

  const startCheckout = async (productKey) => {
    if (!registration || checkoutLoading) return;
    setCheckoutLoading(productKey); setError("");
    try {
      const user = await base44.auth.me().catch(() => null);
      if (!user) { base44.auth.redirectToLogin(); return; }
      const returnUrl = `${window.location.origin}/verify?registration=${encodeURIComponent(registration)}`;
      const res = await createCheckout(productKey, registration, returnUrl, reportInputId);
      if (!res?.url) throw new Error("Checkout URL was not returned.");
      window.location.assign(res.url);
    } catch (err) { setError(err?.message || "Checkout could not be started."); setCheckoutLoading(null); }
  };

  const unlocked = justPaid || Object.values(tiers).some((tier) => tier?.entitled) || Boolean(data?.premium?.unlocked);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdvisorHero query={query} setQuery={setQuery} onSubmit={(event) => { event.preventDefault(); goToAircraft(query); }} />
      <RecentSearchStrip items={recent} onSelect={goToAircraft} />
      <main className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        {!registration && <AircraftListingGrid listings={listings} title="Recently listed aircraft" />}
        {loading && <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin text-primary" />Checking registry, identity, history and market evidence…</div>}
        {notFound && <section className="rounded-2xl border border-primary/30 bg-card p-8 text-center"><ShieldCheck className="mx-auto h-9 w-9 text-primary" /><h2 className="mt-3 text-2xl font-bold">No connected registry match yet</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">This is not a negative finding. Check the registration format or consult the relevant official registry.</p></section>}
        {!loading && data && <>
          <AircraftIdentityPanel registration={registration} data={data} photo={photo} />
          <AircraftListingGrid listings={listings} title={`Listings connected to ${registration}`} />
          {!unlocked && <LimitedOfferBanner expiresAt={offerExpiresAt} />}
          <section className="mt-8"><div className="mb-5"><p className="text-xs font-bold uppercase text-primary">Aircraft evidence file</p><h2 className="mt-1 text-3xl font-bold">What the sources reveal</h2><p className="mt-2 text-sm text-muted-foreground">Identity remains visible. Transaction-grade evidence unlocks with the selected report.</p></div><AdvisorIntelligence data={data} unlocked={unlocked} /></section>
          <AdvisorPricingTiers registration={registration} tiers={tiers} loadingTier={checkoutLoading} onPurchase={startCheckout} justPaid={justPaid} />
          {!unlocked && <details className="group mt-6 rounded-2xl border border-border bg-card"><summary className="flex cursor-pointer items-center justify-between p-5 font-bold">Add private evidence for a stronger report <ChevronDown className="h-5 w-5 text-primary transition group-open:rotate-180" /></summary><div className="border-t border-border px-5 pb-5"><ReportEvidenceInput registration={registration} onSaved={setReportInputId} /></div></details>}
        </>}
        {error && <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <AdvisorStorySections />
      </main>
    </div>
  );
}