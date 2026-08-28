import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { lookupAircraft } from "@/lib/aircraftLookup";
import { ShieldCheck } from "lucide-react";
import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";
import RegistryResultOverlay from "@/components/dashboard/RegistryResultOverlay";
import ReportDeliveredBanner from "@/components/twin/ReportDeliveredBanner";
import SkyLinkAirportBlock from "@/components/skylink/SkyLinkAirportBlock";

const AMBER = "#f5c242";
const DASH_PREFIXES = ["OK", "D", "G", "F", "I", "EC", "EA", "SE", "OO", "PH", "HB", "OE", "LN", "OY", "ZK", "VH", "CS", "B", "9M"];

function normalizeReg(raw) {
  if (!raw) return "";
  let registration = raw.toUpperCase().replace(/\s+/g, "");
  for (const prefix of DASH_PREFIXES) {
    if (registration.startsWith(prefix) && !registration.startsWith(`${prefix}-`)) {
      registration = `${prefix}-${registration.slice(prefix.length)}`;
      break;
    }
  }
  return registration;
}

function detectAirportCode(raw) {
  const q = (raw || "").trim().toUpperCase();
  if (!/^[A-Z]+$/.test(q)) return null; // must be letters only — excludes registrations like N123AB
  if (q.length === 4) return q; // ICAO
  if (q.length === 3) return q; // IATA
  return null;
}

export default function NLookup() {
  const [query, setQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("registration") || params.get("serial") || params.get("owner") || "";
  });
  const [loading, setLoading] = useState(false);
  const [overlayData, setOverlayData] = useState(null);
  const [error, setError] = useState(null);
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

  const handleSearch = async (e, directQuery = query) => {
    e?.preventDefault();
    // Airport codes (ICAO/IATA) route to the SkyLink block, not the FAA registry.
    if (detectAirportCode(directQuery)) return;
    let registration = normalizeReg(directQuery);
    if (!registration) return;
    setLoading(true);
    setError(null);

    try {
      const mode = new URLSearchParams(window.location.search).get("mode");
      if (mode === "serial" || mode === "owner") {
        const value = directQuery.replace(/^(s\/n|sn|serial|owner)[:\s-]*/i, "").trim();
        const filter = mode === "serial" ? { serial_number: value } : { name: value.toUpperCase() };
        const matches = await base44.entities.FAAAircraft.filter(filter, "-created_date", 1);
        if (!matches.length) { setError(`No FAA record found for ${directQuery}.`); return; }
        registration = `N${matches[0].n_number}`;
      }
      const data = await lookupAircraft(registration);
      if (!data.found) {
        setError(data.error || `No registry record found for ${registration}.`);
        return;
      }

      let photo = null;
      try {
        const photoRes = await base44.functions.invoke("aircraftPhoto", {
          registration: data.aircraft.registration || registration,
          hex: data.aircraft.mode_s_hex,
        });
        if (photoRes.data?.photo_url && photoRes.data.source !== "hf_generated") photo = photoRes.data;
      } catch (_) {}

      let atiCard = null;
      let passport = null;
      try {
        const [cards, passports] = await Promise.all([
          base44.entities.ATICard.filter({ aircraft_registration: registration }, "-created_date", 1),
          base44.entities.ATIPassport.filter({ registration }, "-created_date", 1),
        ]);
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
        areaState: data.areaServices?.state || "",
        // aircraftDataHub has always returned this from Supabase faa_dealers;
        // until now nothing consumed it, so the rows were fetched and dropped.
        dealers: data.service_network?.active_dealers || null,
        dealerState: data.service_network?.state || "",
      });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to search registry. Please try again.");
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

        {/* Unified smart search */}
        <div className="flex justify-center mb-8">
          <SmartAircraftSearch variant="hero" value={query} onChange={setQuery} onSubmit={(value) => handleSearch(null, value)} loading={loading} />
        </div>

        {detectAirportCode(query) && (
          <div className="mb-8">
            <SkyLinkAirportBlock code={detectAirportCode(query)} />
          </div>
        )}

        {fulfillment && <ReportDeliveredBanner fulfillment={fulfillment} />}

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-[#e24b4a] mb-6"
            style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
            {error}
          </div>
        )}

        {/* Trust footer */}
        <div className="mt-12 grid grid-cols-3 gap-3 text-center">
          {[
            { n: "300k+", l: "FAA records" },
            { n: "8", l: "ATI dimensions" },
            { n: "$49", l: "Full PDF report" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl py-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <p className="text-lg font-black" style={{ color: AMBER }}>{s.n}</p>
              <p className="text-[10px] uppercase tracking-wider text-[rgba(255,255,255,0.4)]">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {overlayData && (
        <RegistryResultOverlay
          result={overlayData.result}
          atiCard={overlayData.atiCard}
          passport={overlayData.passport}
          photo={overlayData.photo}
          photoLoading={overlayData.photoLoading}
          listingMatch={overlayData.listingMatch}
          areaServices={overlayData.areaServices}
          areaState={overlayData.areaState}
          onClose={() => setOverlayData(null)}
        />
      )}
    </div>
  );
}