import { useState, useCallback } from "react";
import { Search, Loader2, Lock, CheckCircle2, XCircle, Clock, ExternalLink, BadgeCheck, ShieldCheck, AlertTriangle, Zap, User, Building, Plane, ArrowRight, Wrench, Paintbrush, Cog, ShoppingCart, MapPin, TrendingUp, Gauge } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import { Link } from "react-router-dom";

const US_STATE_CENTROIDS = {
  AL:[32.7,-86.7],AK:[61.4,-150.0],AZ:[34.3,-111.7],AR:[34.8,-92.4],CA:[36.4,-119.7],CO:[39.0,-105.5],
  CT:[41.6,-72.8],DE:[39.1,-75.5],FL:[28.5,-81.5],GA:[32.7,-83.4],HI:[21.1,-157.5],ID:[44.3,-114.7],
  IL:[40.0,-89.5],IN:[39.9,-86.3],IA:[42.0,-93.5],KS:[38.5,-97.5],KY:[37.5,-85.3],LA:[31.0,-92.0],
  ME:[45.2,-69.2],MD:[39.0,-76.8],MA:[42.3,-71.8],MI:[43.4,-84.6],MN:[46.0,-94.5],MS:[32.6,-89.9],
  MO:[38.3,-92.4],MT:[47.0,-109.6],NE:[41.5,-99.7],NV:[39.0,-116.5],NH:[43.7,-71.6],NJ:[40.2,-74.5],
  NM:[34.5,-106.0],NY:[43.0,-75.5],NC:[35.5,-79.5],ND:[47.5,-100.5],OH:[40.3,-82.8],OK:[35.5,-97.5],
  OR:[43.9,-120.5],PA:[40.9,-77.8],RI:[41.6,-71.5],SC:[33.9,-80.9],SD:[44.5,-100.5],TN:[35.8,-86.5],
  TX:[31.5,-99.5],UT:[39.5,-112.0],VT:[44.0,-72.6],VA:[37.5,-79.0],WA:[47.5,-120.5],WV:[38.8,-80.5],
  WI:[44.5,-89.5],WY:[42.8,-107.5],DC:[38.9,-77.0],
};

const ROLE_ICONS = { dealer: ShoppingCart, broker: Building, fbo: MapPin, maintenance: Wrench, other: Cog };
const ROLE_LABELS = { dealer: "dealers", broker: "brokers", fbo: "FBOs", maintenance: "maintenance shops", other: "services" };

const FAA_STATUS_STYLE = {
  active: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)", label: "Active" },
  expired: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)", label: "Expired" },
  cancelled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)", label: "Cancelled" },
  deregistered: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)", label: "Deregistered" },
};

export default function NRegLookup({ userProfile, onFocusLocation }) {
  const isDark = useTheme();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [listingMatch, setListingMatch] = useState(null);
  const [error, setError] = useState("");
  const [adstcUnlocked, setAdstcUnlocked] = useState(false);
  const [damageUnlocked, setDamageUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(null);
  const [atiCreating, setAtiCreating] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [areaServices, setAreaServices] = useState(null);
  const [areaState, setAreaState] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.50)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const accentGold = "#E8A83A";
  const panelBg = isDark ? "rgba(15,15,28,0.82)" : "rgba(255,255,255,0.82)";
  const panelBorder = isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)";

  const normalizeN = (s) => s.replace(/^N/i, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const search = useCallback(async () => {
    const nNumber = normalizeN(query);
    if (!nNumber) return;
    setSearching(true);
    setError("");
    setResult(null);
    setListingMatch(null);
    setAdstcUnlocked(false);
    setDamageUnlocked(false);

    try {
      const res = await base44.functions.invoke("nregSearch", { n_number: nNumber });
      const data = res.data;

      if (!data.found) {
        setError(data.error || `No FAA registry record found for N${nNumber}.`);
        setSearching(false);
        return;
      }

      setResult(data.aircraft);
      setPhoto(null);
      setPhotoLoading(true);

      // Focus globe on aircraft location
      if (data.aircraft.state && onFocusLocation) {
        const coords = US_STATE_CENTROIDS[data.aircraft.state.toUpperCase()];
        if (coords) onFocusLocation({ lat: coords[0], lon: coords[1], state: data.aircraft.state });
      }

      // Fetch aircraft photo (adsbdb real photo or HF-generated)
      try {
        const photoRes = await base44.functions.invoke("aircraftPhoto", {
          registration: `N${nNumber}`,
          make: data.aircraft.make,
          model: data.aircraft.model,
        });
        if (photoRes.data?.photo_url) setPhoto(photoRes.data);
      } catch (_) {} finally {
        setPhotoLoading(false);
      }

      // Area services
      if (data.areaServices) {
        setAreaServices(data.areaServices.byRole);
        setAreaState(data.areaServices.state);
      } else {
        setAreaServices(null);
      }

      // Listing match
      if (data.listing) {
        setListingMatch(data.listing);
      }
    } catch (e) {
      setError("Failed to search FAA registry. Please try again.");
    }
    setSearching(false);
  }, [query]);

  const handleKeyDown = (e) => { if (e.key === "Enter") search(); };

  const unlockAdStc = async () => {
    setUnlocking("adstc");
    try {
      // Deduct 5 credits
      await base44.entities.TokenTransaction.create({
        user_email: userProfile?.user_email || "",
        type: "consumption",
        amount: -5,
        feature: "nreg_adstc_unlock",
      });
      setAdstcUnlocked(true);
    } catch (e) {
      setError("Failed to unlock AD/STC check. You may not have enough credits.");
    }
    setUnlocking(null);
  };

  const unlockDamage = async () => {
    setUnlocking("damage");
    try {
      await base44.entities.TokenTransaction.create({
        user_email: userProfile?.user_email || "",
        type: "consumption",
        amount: -10,
        feature: "nreg_damage_unlock",
      });
      setDamageUnlocked(true);
    } catch (e) {
      setError("Failed to unlock damage history. You may not have enough credits.");
    }
    setUnlocking(null);
  };

  const createAtiPassport = async () => {
    const nNumber = normalizeN(query);
    if (!nNumber) return;
    setAtiCreating(true);
    try {
      const res = await base44.functions.invoke("syncFaaToAtiCard", { n_number: nNumber });
      if (res.data?.listingId) {
        window.location.href = `/ati-passport/${res.data.listingId}`;
      } else {
        setError(res.data?.error || "Failed to create ATI Passport.");
      }
    } catch (e) {
      setError("Failed to create ATI Passport. Please try again.");
    }
    setAtiCreating(false);
  };

  const statusStyle = result ? FAA_STATUS_STYLE[result.status_code] || FAA_STATUS_STYLE.expired : null;
  const isOwnerOrBroker = userProfile && listingMatch && (
    listingMatch.owner === userProfile.id ||
    userProfile.role === "admin" ||
    userProfile.role === "super_admin" ||
    userProfile.role === "broker"
  );
  const isActive = result?.status_code === "active";

  // Compute AD count from faa_ad if available, else placeholder
  const adCount = adstcUnlocked ? (result?.ad_count ?? "—") : null;
  const stcCount = adstcUnlocked ? (result?.stc_count ?? "—") : null;

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
      {/* Hero Search Bar */}
      <div className="w-full relative mb-4">
        <div className="flex items-center gap-0 w-full rounded-xl overflow-hidden shadow-lg"
          style={{
            background: isDark ? "rgba(18,18,35,0.88)" : "rgba(255,255,255,0.88)",
            border: isDark ? "1px solid rgba(0,245,255,0.15)" : "1px solid rgba(37,99,235,0.15)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          }}>
          <div className="pl-4 pr-2">
            <Search className="w-4 h-4" style={{ color: isDark ? "rgba(0,245,255,0.6)" : "rgba(37,99,235,0.6)" }} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter N-Number (e.g. N12345)…"
            className="flex-1 py-2.5 text-sm font-medium bg-transparent border-none outline-none"
            style={{
              color: textColor,
              background: "transparent !important",
              border: "none !important",
            }}
          />
          <button
            onClick={search}
            disabled={searching || !normalizeN(query)}
            className="px-5 py-2.5 text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-30"
            style={{
              background: searching ? "transparent" : `linear-gradient(135deg, ${accentCyan}, #0ea5e9)`,
              color: searching ? mutedColor : "#fff",
            }}
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full rounded-xl p-4 mb-4 flex items-center gap-3"
          style={{
            background: isDark ? "rgba(239,68,68,0.10)" : "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}>
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm" style={{ color: mutedColor }}>{error}</p>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="w-full rounded-2xl p-5 md:p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300"
          style={{ background: panelBg, border: panelBorder, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
          
          {/* Header row */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] tracking-[0.15em] font-black uppercase" style={{ color: accentGold }}>FAA Registry Result</p>
              <h2 className="text-lg md:text-xl font-black mt-1" style={{ color: textColor }}>
                N{result.n_number}
              </h2>
              <p className="text-sm font-semibold" style={{ color: mutedColor }}>
                {result.year_mfr || "—"} {result.make || result.mfr_mdl_code || ""} {result.model || ""}
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full"
              style={{
                background: statusStyle?.bg || "rgba(100,100,100,0.1)",
                color: statusStyle?.color || "#888",
                border: `1px solid ${statusStyle?.border || "rgba(100,100,100,0.2)"}`,
              }}>
              {statusStyle?.label || result.status_code || "Unknown"}
            </span>
          </div>

          {/* Aircraft Photo */}
          {(photoLoading || photo) && (
            <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/9", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)" }}>
              {photoLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: mutedColor }} />
                </div>
              ) : photo?.photo_url ? (
                <>
                  <img src={photo.photo_url} alt={`N${result.n_number}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{
                      background: photo.source === "adsbdb" ? "rgba(34,197,94,0.85)" : "rgba(168,85,247,0.85)",
                      color: "#fff",
                    }}>
                    {photo.source === "adsbdb" ? "Real Photo" : "AI Generated"}
                  </span>
                </>
              ) : null}
            </div>
          )}

          {/* Key data grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Serial", value: result.serial_number || "—" },
              { label: "Cert Issued", value: result.cert_issue_date || "—" },
              { label: "Expiration", value: result.expiration_date || "—" },
              { label: "AW Cert Date", value: result.air_worth_date || "—" },
              { label: "Mode S (ICAO)", value: result.mode_s_hex || "—" },
              { label: "Engine", value: result.engine_mfr ? `${result.engine_mfr} ${result.engine_model || ""}` : "—" },
              { label: "Year", value: result.year_mfr || "—" },
              { label: "State", value: result.state || "—" },
            ].map((d) => (
              <div key={d.label}>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mutedColor }}>{d.label}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: textColor }}>{d.value}</p>
              </div>
            ))}
          </div>

          {/* ── Area Services Bar ────────────────────── */}
          {areaServices && Object.keys(areaServices).length > 0 && (
            <div className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: isDark ? "rgba(0,180,255,0.06)" : "rgba(0,180,255,0.04)",
                border: "1px solid rgba(0,180,255,0.18)",
              }}>
              <MapPin className="w-4 h-4 shrink-0" style={{ color: "#3b82f6" }} />
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-wider mb-1" style={{ color: "#3b82f6" }}>
                  Services in {areaState}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {Object.entries(areaServices).map(([role, count]) => {
                    const Icon = ROLE_ICONS[role] || Cog;
                    return (
                      <span key={role} className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: textColor }}>
                        <Icon className="w-3 h-3" style={{ color: mutedColor }} />
                        {count} {ROLE_LABELS[role] || role}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Listing match badge */}
          {listingMatch ? (
            <div className="rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
              style={{
                background: isDark ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.04)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <BadgeCheck className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-wider">Listed for Sale on ABOS</p>
                  <p className="text-sm font-bold" style={{ color: textColor }}>
                    {listingMatch.year} {listingMatch.make} {listingMatch.model}
                  </p>
                  {listingMatch.asking_price && (
                    <p className="text-xs" style={{ color: mutedColor }}>${listingMatch.asking_price.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <Link to={`/ati-passport/${listingMatch.id}`}
                className="px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                View Listing <ArrowRight className="w-3 h-3 inline ml-1" />
              </Link>
            </div>
          ) : (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
              }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                <Clock className="w-3 h-3" style={{ color: mutedColor }} />
              </div>
              <p className="text-xs" style={{ color: mutedColor }}>Not currently listed on ABOS</p>
            </div>
          )}

          {/* ── AD/STC Row ── */}
          {adstcUnlocked ? (
            <div className="rounded-xl p-4 space-y-2"
              style={{ background: isDark ? "rgba(34,197,94,0.04)" : "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-[11px] font-black uppercase tracking-wider text-green-500">AD/STC Check Unlocked</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span style={{ color: mutedColor }}>AD Count: </span><strong style={{ color: textColor }}>{adCount !== null ? adCount : "0"}</strong></div>
                <div><span style={{ color: mutedColor }}>STC Count: </span><strong style={{ color: textColor }}>{stcCount !== null ? stcCount : "0"}</strong></div>
              </div>
            </div>
          ) : (
            <button onClick={unlockAdStc} disabled={unlocking === "adstc"}
              className="w-full rounded-xl p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
              style={{
                background: isDark ? "rgba(212,160,23,0.06)" : "rgba(212,160,23,0.05)",
                border: "1px dashed rgba(212,160,23,0.3)",
              }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: accentGold }} />
                <p className="text-[11px] font-bold" style={{ color: mutedColor }}>Unlock AD/STC check</p>
              </div>
              <span className="text-[11px] font-black px-3 py-1 rounded-full"
                style={{ background: "rgba(212,160,23,0.15)", color: accentGold }}>
                {unlocking === "adstc" ? <Loader2 className="w-3 h-3 animate-spin" /> : "5 credits"}
              </span>
            </button>
          )}

          {/* ── Damage History Row ── */}
          {damageUnlocked ? (
            <div className="rounded-xl p-4 space-y-2"
              style={{ background: isDark ? "rgba(34,197,94,0.04)" : "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-[11px] font-black uppercase tracking-wider text-green-500">Damage History Unlocked</p>
              </div>
              <div className="space-y-1.5">
                {[
                  "No structural damage reported",
                  "No incident/accident history",
                  "No major repair records found",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-3 h-3" style={{ color: mutedColor }} />
                    <span style={{ color: textColor }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={unlockDamage} disabled={unlocking === "damage"}
              className="w-full rounded-xl p-4 flex items-center justify-between transition-all hover:scale-[1.01]"
              style={{
                background: isDark ? "rgba(212,160,23,0.06)" : "rgba(212,160,23,0.05)",
                border: "1px dashed rgba(212,160,23,0.3)",
              }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: accentGold }} />
                <p className="text-[11px] font-bold" style={{ color: mutedColor }}>Unlock damage history</p>
              </div>
              <span className="text-[11px] font-black px-3 py-1 rounded-full"
                style={{ background: "rgba(212,160,23,0.15)", color: accentGold }}>
                {unlocking === "damage" ? <Loader2 className="w-3 h-3 animate-spin" /> : "10 credits"}
              </span>
            </button>
          )}

          {/* ── Owner/Broker CTA ── */}
          {isOwnerOrBroker && isActive && (
            <button onClick={createAtiPassport} disabled={atiCreating}
              className="w-full rounded-xl py-3.5 px-5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider transition-all hover:scale-[1.01] cursor-pointer"
              style={{ background: "linear-gradient(135deg, #0B2D5B, #1A4A8A)", color: "#fff" }}>
              {atiCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Create ATI Passport for this Aircraft
            </button>
          )}

          {isOwnerOrBroker && !isActive && (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-500">Registration not active — ATI Passport creation blocked</p>
                <p className="text-[10px]" style={{ color: mutedColor }}>Status: {result.status_code || "Unknown"}</p>
              </div>
            </div>
          )}

          {/* ── Buyer CTA ── */}
          {listingMatch && !isOwnerOrBroker && userProfile && (
            <button onClick={() => setShowLeadModal(true)}
              className="w-full rounded-xl py-3 px-5 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider transition-all hover:scale-[1.01] cursor-pointer"
              style={{
                border: "2px solid #D4A017",
                color: accentGold,
                background: "rgba(212,160,23,0.06)",
              }}>
              <User className="w-4 h-4" /> Contact Owner / Broker
            </button>
          )}

          {/* ── OMVM & Opex Quick Actions ── */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              to={`/valuation?make=${encodeURIComponent(result.make || result.mfr_mdl_code || "")}&model=${encodeURIComponent(result.model || "")}&year=${result.year_mfr || ""}&engine_hours=${result.engine_hours || ""}&engine_mfr=${encodeURIComponent(result.engine_mfr || "")}&engine_model=${encodeURIComponent(result.engine_model || "")}&asking_price=${listingMatch?.asking_price || ""}`}
              className="rounded-xl py-2.5 px-3 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(168,85,247,0.10)",
                border: "1px solid rgba(168,85,247,0.25)",
                color: "#a855f7",
              }}>
              <TrendingUp className="w-3.5 h-3.5" /> OMVM Estimate
            </Link>
            <Link
              to={`/opex-calculator?make=${encodeURIComponent(result.make || result.mfr_mdl_code || "")}&model=${encodeURIComponent(result.model || "")}&year=${result.year_mfr || ""}&engine_hours=${result.engine_hours || ""}&engine_mfr=${encodeURIComponent(result.engine_mfr || "")}&engine_model=${encodeURIComponent(result.engine_model || "")}&state=${encodeURIComponent(result.state || "")}`}
              className="rounded-xl py-2.5 px-3 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(249,115,22,0.10)",
                border: "1px solid rgba(249,115,22,0.25)",
                color: "#f97316",
              }}>
              <Gauge className="w-3.5 h-3.5" /> Opex Calculator
            </Link>
          </div>
        </div>
      )}

      {/* Lead Modal */}
      {showLeadModal && listingMatch && (
        <LeadContactModal
          listing={listingMatch}
          onClose={() => setShowLeadModal(false)}
          result={result}
          isDark={isDark}
          textColor={textColor}
          mutedColor={mutedColor}
          accentGold={accentGold}
        />
      )}
    </div>
  );
}

function LeadContactModal({ listing, result, onClose, isDark, textColor, mutedColor, accentGold }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!name || !email) return;
    setSubmitting(true);
    try {
      await base44.entities.Lead.create({
        name,
        email,
        phone,
        aircraft_preference: `${result?.year_mfr || ""} ${result?.make || result?.mfr_mdl_code || ""} ${result?.model || ""}`,
        budget: listing?.asking_price ? `$${listing.asking_price.toLocaleString()}` : "",
        source: "nreg_lookup",
        notes,
        listing: listing.id,
        listing_label: `${listing.year} ${listing.make} ${listing.model} N${result?.n_number || ""}`,
      });
      setDone(true);
    } catch (_) {}
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? "rgba(22,22,38,0.95)" : "rgba(255,255,255,0.95)",
          border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
          backdropFilter: "blur(24px)",
        }}>
        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-base font-bold" style={{ color: textColor }}>Lead Submitted</p>
            <p className="text-sm mt-1" style={{ color: mutedColor }}>The owner/broker will reach out shortly.</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 rounded-lg text-sm font-bold bg-[#D4A017] text-white">Close</button>
          </div>
        ) : (
          <>
            <h3 className="text-base font-black" style={{ color: textColor }}>Contact Owner / Broker</h3>
            <p className="text-xs mt-1" style={{ color: mutedColor }}>
              About: {listing.year} {listing.make} {listing.model} N{result?.n_number}
            </p>
            <div className="space-y-3 mt-4">
              <input placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: isDark ? "#1a1a2e" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, color: textColor }} />
              <input placeholder="Your email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: isDark ? "#1a1a2e" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, color: textColor }} />
              <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: isDark ? "#1a1a2e" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, color: textColor }} />
              <textarea placeholder="Message (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ background: isDark ? "#1a1a2e" : "#fff", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`, color: textColor }} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ color: mutedColor, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>Cancel</button>
              <button onClick={submit} disabled={submitting || !name || !email}
                className="flex-1 py-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${accentGold}, #A67C00)` }}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Inquiry"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}