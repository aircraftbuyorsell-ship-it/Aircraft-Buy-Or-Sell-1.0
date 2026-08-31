import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { lookupAircraft } from "@/lib/aircraftLookup";
import { ShieldCheck, MessageSquare, FileText, ImagePlus, Video, Camera, ClipboardPaste, ArrowRight, Loader2, ScanSearch } from "lucide-react";
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
  const navigate = useNavigate();
  const [query, setQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("registration") || params.get("serial") || params.get("owner") || "";
  });
  const [loading, setLoading] = useState(false);
  const [overlayData, setOverlayData] = useState(null);
  const [error, setError] = useState(null);
  const [fulfillment, setFulfillment] = useState(null);
  const [listingText, setListingText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);

  const sendToAgent = (extra = {}) => {
    const registration = normalizeReg(query);
    const params = new URLSearchParams();
    if (registration) params.set("registration", registration);
    if (listingText.trim()) params.set("listing", listingText.trim());
    if (attachments.length) params.set("attachments", attachments.join(","));
    Object.entries(extra).forEach(([k, v]) => { if (v) params.set(k, v); });
    navigate(`/max-chat?${params.toString()}`);
  };

  const handleAttachments = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const result = await base44.integrations.Core.UploadFile({ file });
        if (result?.file_url) uploaded.push(result.file_url);
      }
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (e) {
      setError(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

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
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
            Start with the aircraft. Let ABOS Agent do the rest.
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
            Enter a registration, paste a listing, upload logbooks or photos, or start a live inspection. Everything feeds the same ABOS Agent, Digital Twin and verification workflow.
          </p>
        </div>

        {/* Universal ABOS Agent intake */}
        <div className="rounded-3xl border border-border bg-card shadow-sm p-5 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4" style={{ color: AMBER }} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground">ABOS Agent intake</span>
          </div>
          <div className="flex justify-center mb-5">
            <SmartAircraftSearch variant="hero" value={query} onChange={setQuery} onSubmit={(value) => { setQuery(value); sendToAgent({ intent: "identify" }); }} loading={loading} />
          </div>

          <textarea
            value={listingText}
            onChange={(e) => setListingText(e.target.value)}
            placeholder="Paste the aircraft listing, seller description, maintenance notes, or anything you want ABOS Agent to analyse…"
            className="w-full min-h-28 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none resize-y placeholder:text-muted-foreground/60"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            <label className="cursor-pointer rounded-xl border border-border bg-background px-3 py-3 flex items-center gap-2 text-xs font-bold text-foreground hover:bg-muted transition">
              <FileText className="w-4 h-4" /> Upload docs
              <input type="file" multiple accept=".pdf,.txt,.csv,.jpg,.jpeg,.png,.webp" onChange={handleAttachments} className="hidden" disabled={uploading} />
            </label>
            <label className="cursor-pointer rounded-xl border border-border bg-background px-3 py-3 flex items-center gap-2 text-xs font-bold text-foreground hover:bg-muted transition">
              <ImagePlus className="w-4 h-4" /> Upload photos
              <input type="file" multiple accept="image/*" onChange={handleAttachments} className="hidden" disabled={uploading} />
            </label>
            <label className="cursor-pointer rounded-xl border border-border bg-background px-3 py-3 flex items-center gap-2 text-xs font-bold text-foreground hover:bg-muted transition">
              <Camera className="w-4 h-4" /> Live camera
              <input type="file" accept="image/*" capture="environment" onChange={handleAttachments} className="hidden" disabled={uploading} />
            </label>
            <label className="cursor-pointer rounded-xl border border-border bg-background px-3 py-3 flex items-center gap-2 text-xs font-bold text-foreground hover:bg-muted transition">
              <Video className="w-4 h-4" /> Live video
              <input type="file" accept="video/*" capture="environment" onChange={handleAttachments} className="hidden" disabled={uploading} />
            </label>
          </div>

          {(uploading || attachments.length > 0) && (
            <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {uploading ? "Uploading evidence…" : `${attachments.length} evidence file${attachments.length === 1 ? "" : "s"} attached`}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => sendToAgent({ intent: "verify" })} className="inline-flex items-center gap-2 rounded-xl bg-[#D4A017] text-white px-4 py-2.5 text-sm font-black hover:opacity-90">
              <ScanSearch className="w-4 h-4" /> Start Verification
            </button>
            <button onClick={() => sendToAgent({ intent: "analyse" })} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background text-foreground px-4 py-2.5 text-sm font-bold hover:bg-muted">
              <ClipboardPaste className="w-4 h-4" /> Analyse with Agent
            </button>
            <button onClick={() => sendToAgent({ intent: "inspect" })} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background text-foreground px-4 py-2.5 text-sm font-bold hover:bg-muted">
              <Camera className="w-4 h-4" /> Inspect live
            </button>
          </div>
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

        <div className="rounded-2xl border border-border bg-card p-4 mb-6">
          <p className="text-xs font-black uppercase tracking-wider text-foreground mb-2">One intake · one Agent · one Digital Twin</p>
          <p className="text-xs text-muted-foreground leading-relaxed">Registry data, listing text, documents, photos and inspection evidence are combined into the same aircraft context. The Agent can then run Registry, Identity, Ownership, Activity, Service, Document, ATI, valuation and transaction workflows without creating duplicate aircraft records.</p>
        </div>

        {/* Action-based monetization */}
        <div className="mt-10 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-foreground">ABOS Action Pricing</p>
              <p className="text-xs text-muted-foreground mt-1">Chat is not metered. You pay only when the Agent runs a premium aircraft action.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 border border-border text-muted-foreground">No token limits</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              ["ATI Full Verification", "$39", "per aircraft"],
              ["Deal Analysis", "$99", "per aircraft"],
              ["Investment Brief", "$149", "per aircraft"],
              ["Professional Review", "$499+", "per aircraft"],
            ].map(([name, price, unit]) => (
              <div key={name} className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-bold text-foreground">{name}</p>
                <p className="text-lg font-black mt-1" style={{ color: AMBER }}>{price}</p>
                <p className="text-[10px] text-muted-foreground">{unit}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Additional Agent actions such as AI Vision Inspection and Logbook Analysis appear contextually when relevant.</p>
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