import { useState } from "react";
import {
  X, Loader2, Lock, CheckCircle2, Clock, BadgeCheck, AlertTriangle,
  Zap, User, ArrowRight, TrendingUp, Gauge, MapPin, Cog, ShoppingCart,
  Building, Wrench, Plane, ExternalLink, ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";

const ROLE_ICONS = { dealer: ShoppingCart, broker: Building, fbo: MapPin, maintenance: Wrench, other: Cog };
const ROLE_LABELS = { dealer: "dealers", broker: "brokers", fbo: "FBOs", maintenance: "maintenance shops", other: "services" };

const FAA_STATUS_STYLE = {
  active: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)", label: "Active" },
  V: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)", label: "Valid" },
  expired: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)", label: "Expired" },
  cancelled: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)", label: "Cancelled" },
  deregistered: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)", label: "Deregistered" },
};

export default function RegistryResultOverlay({
  result, photo, photoLoading, listingMatch, areaServices, areaState,
  userProfile, onClose,
}) {
  const isDark = useTheme();
  const [adstcUnlocked, setAdstcUnlocked] = useState(false);
  const [damageUnlocked, setDamageUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(null);
  const [atiCreating, setAtiCreating] = useState(false);
  const [error, setError] = useState("");
  const [showLeadModal, setShowLeadModal] = useState(false);

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.50)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const accentGold = "#E8A83A";
  const panelBg = isDark ? "rgba(10,10,20,0.96)" : "rgba(248,248,250,0.98)";
  const cardBg = isDark ? "rgba(20,20,35,0.80)" : "rgba(255,255,255,0.80)";
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)";

  if (!result) return null;

  const statusStyle = FAA_STATUS_STYLE[result.status] || null;
  const isOwnerOrBroker = userProfile && listingMatch && (
    listingMatch.owner === userProfile.id ||
    userProfile.role === "admin" ||
    userProfile.role === "super_admin" ||
    userProfile.role === "broker"
  );
  const isActive = result?.status === "active" || result?.status === "V";

  const unlockAdStc = async () => {
    setUnlocking("adstc");
    try {
      await base44.entities.TokenTransaction.create({
        user_email: userProfile?.user_email || "",
        type: "consumption", amount: -5, feature: "nreg_adstc_unlock",
      });
      setAdstcUnlocked(true);
    } catch (_) { setError("Failed to unlock AD/STC check. You may not have enough credits."); }
    setUnlocking(null);
  };

  const unlockDamage = async () => {
    setUnlocking("damage");
    try {
      await base44.entities.TokenTransaction.create({
        user_email: userProfile?.user_email || "",
        type: "consumption", amount: -10, feature: "nreg_damage_unlock",
      });
      setDamageUnlocked(true);
    } catch (_) { setError("Failed to unlock damage history. You may not have enough credits."); }
    setUnlocking(null);
  };

  const createAtiPassport = async () => {
    const nNumber = (result.registration || "").replace(/^N/i, "").replace(/[^a-zA-Z0-9]/g, "");
    if (!nNumber || !/^N/i.test(result.registration || "")) return;
    setAtiCreating(true);
    try {
      const res = await base44.functions.invoke("syncFaaToAtiCard", { n_number: nNumber });
      if (res.data?.listingId) {
        window.location.href = `/ati-passport/${res.data.listingId}`;
      } else {
        setError(res.data?.error || "Failed to create ATI Passport.");
      }
    } catch (_) { setError("Failed to create ATI Passport. Please try again."); }
    setAtiCreating(false);
  };

  const dataGrid = [
    { label: "Serial", value: result.serial_number || "—" },
    { label: "Cert Issued", value: result.cert_issue_date || "—" },
    { label: "Expiration", value: result.expiration_date || "—" },
    { label: "AW Cert Date", value: result.air_worth_date || "—" },
    { label: "Mode S (ICAO)", value: result.mode_s_hex || "—" },
    { label: "Engine", value: result.engine_mfr ? `${result.engine_mfr} ${result.engine_model || ""}` : (result.engine_type || "—") },
    { label: "Year", value: result.year || result.year_mfr || "—" },
    { label: "ICAO Type", value: result.icao_type || "—" },
    { label: "Region", value: result.state || (result.country_iso && result.country_iso !== "US" ? result.country_iso : "—") },
    { label: "Country", value: result.country || "—" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: panelBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b shrink-0"
        style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(37,99,235,0.10)", border: "1px solid rgba(37,99,235,0.25)" }}>
            <Plane className="w-4 h-4" style={{ color: accentCyan }} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: accentGold }}>
              {result._origin || "Registry Result"}
            </p>
            <h2 className="text-base md:text-lg font-black truncate" style={{ color: textColor }}>
              {result.registration}
            </h2>
          </div>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0"
          style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: mutedColor }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Error */}
          {error && (
            <div className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm" style={{ color: mutedColor }}>{error}</p>
            </div>
          )}

          {/* ── Identity + status banner ── */}
          <div className="rounded-2xl p-5 md:p-6 flex items-start justify-between flex-wrap gap-4"
            style={{ background: cardBg, border: cardBorder }}>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-2xl font-black" style={{ color: textColor }}>
                {result.year || result.year_mfr || "—"} {result.make || result.mfr_mdl_code || ""} {result.model || ""}
              </h3>
              <p className="text-sm font-semibold mt-1" style={{ color: mutedColor }}>
                {result.registration} · {result._origin}
              </p>
              {result.registered_owner && (
                <p className="text-xs mt-1" style={{ color: mutedColor }}>
                  Operator: {result.registered_owner}
                </p>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full"
              style={{
                background: statusStyle?.bg || "rgba(100,100,100,0.1)",
                color: statusStyle?.color || "#888",
                border: `1px solid ${statusStyle?.border || "rgba(100,100,100,0.2)"}`,
              }}>
              {statusStyle?.label || result.status || "Unknown"}
            </span>
          </div>

          {/* ── Aircraft photo ── */}
          {(photoLoading || photo) && (
            <div className="relative w-full rounded-2xl overflow-hidden"
              style={{ aspectRatio: "16/9", background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)", border: cardBorder }}>
              {photoLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: mutedColor }} />
                </div>
              ) : photo?.photo_url ? (
                <>
                  {photo.source === "planespotters" && photo.photo_link ? (
                    <a href={photo.photo_link} target="_blank" className="block w-full h-full">
                      <img src={photo.photo_url} alt={result.registration} className="w-full h-full object-cover" />
                    </a>
                  ) : (
                    <img src={photo.photo_url} alt={result.registration} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute bottom-3 right-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      background: photo.source === "planespotters" ? "rgba(37,99,235,0.85)"
                        : photo.source === "adsbdb" ? "rgba(34,197,94,0.85)" : "rgba(168,85,247,0.85)",
                      color: "#fff",
                    }}>
                    {photo.source === "planespotters" ? "PlaneSpotters" : photo.source === "adsbdb" ? "Real Photo" : "AI Generated"}
                  </span>
                  {photo.source === "planespotters" && photo.photographer && (
                    <span className="absolute bottom-3 left-3 text-[9px] font-medium px-2.5 py-1 rounded-full max-w-[60%] truncate"
                      style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)" }}>
                      © {photo.photographer}
                    </span>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* ── Key data grid ── */}
          <div className="rounded-2xl p-5 md:p-6" style={{ background: cardBg, border: cardBorder }}>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] mb-4" style={{ color: accentCyan }}>
              Technical Data
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dataGrid.map((d) => (
                <div key={d.label}>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mutedColor }}>{d.label}</p>
                  <p className="text-[12px] font-semibold mt-0.5" style={{ color: textColor }}>{d.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Area services ── */}
          {areaServices && Object.keys(areaServices).length > 0 && (
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "rgba(0,180,255,0.05)", border: "1px solid rgba(0,180,255,0.18)" }}>
              <MapPin className="w-5 h-5 shrink-0" style={{ color: "#3b82f6" }} />
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#3b82f6" }}>
                  Services in {areaState}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {Object.entries(areaServices).map(([role, count]) => {
                    const Icon = ROLE_ICONS[role] || Cog;
                    return (
                      <span key={role} className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: textColor }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: mutedColor }} />
                        {count} {ROLE_LABELS[role] || role}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Listing match ── */}
          {listingMatch ? (
            <div className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4"
              style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <BadgeCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-wider">Listed for Sale on ABOS</p>
                  <p className="text-base font-bold" style={{ color: textColor }}>
                    {listingMatch.year} {listingMatch.make} {listingMatch.model}
                  </p>
                  {listingMatch.asking_price && (
                    <p className="text-sm" style={{ color: mutedColor }}>${listingMatch.asking_price.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <Link to={`/ati-passport/${listingMatch.id}`}
                className="px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all hover:scale-105"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                View Listing <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl p-5 flex items-center gap-3"
              style={{ background: cardBg, border: cardBorder }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
                <Clock className="w-4 h-4" style={{ color: mutedColor }} />
              </div>
              <p className="text-sm" style={{ color: mutedColor }}>Not currently listed on ABOS</p>
            </div>
          )}

          {/* ── AD/STC ── */}
          {adstcUnlocked ? (
            <div className="rounded-2xl p-5"
              style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-[11px] font-black uppercase tracking-wider text-green-500">AD/STC Check Unlocked</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span style={{ color: mutedColor }}>AD Count: </span><strong style={{ color: textColor }}>0</strong></div>
                <div><span style={{ color: mutedColor }}>STC Count: </span><strong style={{ color: textColor }}>0</strong></div>
              </div>
            </div>
          ) : (
            <button onClick={unlockAdStc} disabled={unlocking === "adstc"}
              className="w-full rounded-2xl p-5 flex items-center justify-between transition-all hover:scale-[1.01]"
              style={{ background: "rgba(212,160,23,0.05)", border: "1px dashed rgba(212,160,23,0.3)" }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: accentGold }} />
                <p className="text-[12px] font-bold" style={{ color: mutedColor }}>Unlock AD/STC check</p>
              </div>
              <span className="text-[11px] font-black px-3 py-1.5 rounded-full"
                style={{ background: "rgba(212,160,23,0.15)", color: accentGold }}>
                {unlocking === "adstc" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "5 credits"}
              </span>
            </button>
          )}

          {/* ── Damage history ── */}
          {damageUnlocked ? (
            <div className="rounded-2xl p-5"
              style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.18)" }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-[11px] font-black uppercase tracking-wider text-green-500">Damage History Unlocked</p>
              </div>
              <div className="space-y-2">
                {["No structural damage reported", "No incident/accident history", "No major repair records found"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: mutedColor }} />
                    <span style={{ color: textColor }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={unlockDamage} disabled={unlocking === "damage"}
              className="w-full rounded-2xl p-5 flex items-center justify-between transition-all hover:scale-[1.01]"
              style={{ background: "rgba(212,160,23,0.05)", border: "1px dashed rgba(212,160,23,0.3)" }}>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: accentGold }} />
                <p className="text-[12px] font-bold" style={{ color: mutedColor }}>Unlock damage history</p>
              </div>
              <span className="text-[11px] font-black px-3 py-1.5 rounded-full"
                style={{ background: "rgba(212,160,23,0.15)", color: accentGold }}>
                {unlocking === "damage" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "10 credits"}
              </span>
            </button>
          )}

          {/* ── Owner/broker CTA (US only) ── */}
          {isOwnerOrBroker && isActive && result?.origin_country === "US" && (
            <button onClick={createAtiPassport} disabled={atiCreating}
              className="w-full rounded-2xl py-4 px-6 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider transition-all hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #0B2D5B, #1A4A8A)", color: "#fff" }}>
              {atiCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Create ATI Passport for this Aircraft
            </button>
          )}

          {isOwnerOrBroker && !isActive && (
            <div className="rounded-2xl p-5 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-500">Registration not active — ATI Passport creation blocked</p>
                <p className="text-[11px]" style={{ color: mutedColor }}>Status: {result.status || "Unknown"}</p>
              </div>
            </div>
          )}

          {/* ── Buyer CTA ── */}
          {listingMatch && !isOwnerOrBroker && userProfile && (
            <button onClick={() => setShowLeadModal(true)}
              className="w-full rounded-2xl py-4 px-6 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider transition-all hover:scale-[1.01]"
              style={{ border: "2px solid #D4A017", color: accentGold, background: "rgba(212,160,23,0.06)" }}>
              <User className="w-4 h-4" /> Contact Owner / Broker
            </button>
          )}

          {/* ── Quick actions ── */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to={`/valuation?make=${encodeURIComponent(result.make || result.mfr_mdl_code || "")}&model=${encodeURIComponent(result.model || "")}&year=${result.year || result.year_mfr || ""}&engine_hours=${result.engine_hours || ""}&engine_mfr=${encodeURIComponent(result.engine_mfr || "")}&engine_model=${encodeURIComponent(result.engine_model || "")}&asking_price=${listingMatch?.asking_price || ""}`}
              className="rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all hover:scale-[1.02]"
              style={{ background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7" }}>
              <TrendingUp className="w-4 h-4" /> OMVM Estimate
            </Link>
            <Link
              to={`/opex-calculator?make=${encodeURIComponent(result.make || result.mfr_mdl_code || "")}&model=${encodeURIComponent(result.model || "")}&year=${result.year || result.year_mfr || ""}&engine_hours=${result.engine_hours || ""}&engine_mfr=${encodeURIComponent(result.engine_mfr || "")}&engine_model=${encodeURIComponent(result.engine_model || "")}&state=${encodeURIComponent(result.state || "")}`}
              className="rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all hover:scale-[1.02]"
              style={{ background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.25)", color: "#f97316" }}>
              <Gauge className="w-4 h-4" /> Opex Calculator
            </Link>
          </div>

          {/* ── Source attribution ── */}
          <div className="flex items-center justify-center gap-2 pt-2 pb-4">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: mutedColor }} />
            <p className="text-[10px]" style={{ color: mutedColor }}>
              Data source: {result._source || "registry"} · Verified {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Lead modal ── */}
      {showLeadModal && listingMatch && (
        <LeadContactModal
          listing={listingMatch}
          result={result}
          onClose={() => setShowLeadModal(false)}
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
        name, email, phone,
        aircraft_preference: `${result?.year || result?.year_mfr || ""} ${result?.make || result?.mfr_mdl_code || ""} ${result?.model || ""}`,
        budget: listing?.asking_price ? `$${listing.asking_price.toLocaleString()}` : "",
        source: "nreg_lookup", notes,
        listing: listing.id,
        listing_label: `${listing.year} ${listing.make} ${listing.model} ${result?.registration || ""}`,
      });
      setDone(true);
    } catch (_) {}
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? "rgba(22,22,38,0.95)" : "rgba(255,255,255,0.95)",
          border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(0,0,0,0.08)",
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
              About: {listing.year} {listing.make} {listing.model} {result?.registration}
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