import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Search, Plane, Radar, ShieldAlert, Loader2, AlertTriangle,
  CheckCircle2, Clock, MapPin, Radio, FileText,
  Building2, Calendar, Activity, Zap
} from "lucide-react";

const STATUS_CONFIG = {
  ACTIVE:        { label: "Active", color: "#5dcaa5", icon: CheckCircle2 },
  INACTIVE:      { label: "Inactive", color: "#f5c242", icon: Clock },
  GROUNDED_90D:  { label: "Grounded (90d+)", color: "#e8a83a", icon: AlertTriangle },
  LONG_GROUNDED: { label: "Long-Grounded (120d+)", color: "#e24b4a", icon: ShieldAlert },
  NO_TRACKING:   { label: "No Tracking Data", color: "#6b7280", icon: Radar },
};

const ALERT_STYLES = {
  critical: { bg: "rgba(226,75,74,0.08)", border: "rgba(226,75,74,0.30)", color: "#e24b4a" },
  warning:  { bg: "rgba(232,168,58,0.08)", border: "rgba(232,168,58,0.30)", color: "#e8a83a" },
  info:     { bg: "rgba(78,142,247,0.08)", border: "rgba(78,142,247,0.25)", color: "#4e8ef7" },
  success:  { bg: "rgba(93,202,165,0.08)", border: "rgba(93,202,165,0.25)", color: "#5dcaa5" },
};

function Field({ label, value, icon: Icon }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className="text-xs text-white/50 flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}{label}
      </span>
      <span className="text-sm font-bold text-white/85 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NO_TRACKING;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
      style={{ background: `${cfg.color}15`, color: cfg.color, border: `0.5px solid ${cfg.color}40` }}>
      <Icon className="w-3.5 h-3.5" /> {cfg.label}
    </span>
  );
}

export default function RegistryComparator() {
  const [registration, setRegistration] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const compare = useCallback(async () => {
    if (!registration.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await base44.functions.invoke("registryComparator", { registration: registration.trim() });
      setResult(res.data);
    } catch (e) { setError(e.message || "Lookup failed"); }
    finally { setLoading(false); }
  }, [registration]);

  const reg = result?.registry;
  const track = result?.tracking;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#f5c242" }}>Multi-Authority Cross-Reference</p>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1 uppercase flex items-center gap-2" style={{ color: "rgba(255,255,255,0.90)" }}>
          <Radar className="w-7 h-7 text-[#f5c242]" /> Registry Comparator
        </h1>
        <p className="text-sm mt-1 max-w-3xl" style={{ color: "rgba(255,255,255,0.60)" }}>
          Cross-reference FAA, UK CAA, Czech CAA (ÚCL), and EASA registries with live ADS-B tracking.
          Detects grounded aircraft (90d no activity), long-grounded (120d+), and revoked/expired registrations.
        </p>

        {/* Search */}
        <div className="mt-5 rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={registration}
              onChange={e => setRegistration(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && compare()}
              placeholder="N12345, OK-ABC, G-ABCD, D-EEEE…"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-mono font-bold"
              style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
            />
          </div>
          <button onClick={compare} disabled={loading || !registration.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer shrink-0"
            style={{ background: "#f5c242", color: "#04060a" }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            {loading ? "Scanning…" : "Compare"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl p-4 flex items-start gap-2" style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
            <AlertTriangle className="w-4 h-4 text-[#e24b4a] shrink-0 mt-0.5" />
            <p className="text-sm text-[#e24b4a]">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-5 space-y-4">
            {/* Header + Status */}
            <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
              style={{ background: "linear-gradient(135deg, rgba(245,194,66,0.08), rgba(78,142,247,0.06))", border: "0.5px solid rgba(245,194,66,0.20)" }}>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">{result.origin_label}</p>
                <h2 className="text-xl font-black font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.90)" }}>{result.registration}</h2>
                {reg?.found && (
                  <p className="text-sm text-white/60 mt-0.5">{reg.make} {reg.model}{reg.year ? ` (${reg.year})` : ""}</p>
                )}
              </div>
              <StatusBadge status={result.activity_status} />
            </div>

            {/* Alerts */}
            {result.alerts.length > 0 && (
              <div className="space-y-2">
                {result.alerts.map((alert, i) => {
                  const style = ALERT_STYLES[alert.level] || ALERT_STYLES.info;
                  return (
                    <div key={i} className="rounded-xl p-3 flex items-start gap-2" style={{ background: style.bg, border: `0.5px solid ${style.border}` }}>
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: style.color }} />
                      <p className="text-xs leading-relaxed" style={{ color: style.color }}>{alert.message}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Two-column comparison */}
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Registry Card */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#4e8ef7]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#4e8ef7]">Registry Data</span>
                  {reg?.source && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(78,142,247,0.10)", color: "#4e8ef7" }}>{reg.source}</span>
                  )}
                </div>
                {!reg?.found && <p className="text-sm text-white/40 italic">No registry record found</p>}
                {reg?.found && (
                  <div>
                    <Field label="Authority" value={reg.authority} icon={Building2} />
                    <Field label="Registration" value={reg.registration} icon={FileText} />
                    <Field label="Make / Model" value={`${reg.make || "?"} ${reg.model || ""}`.trim()} icon={Plane} />
                    <Field label="Year" value={reg.year} icon={Calendar} />
                    <Field label="Serial Number" value={reg.serial_number} icon={FileText} />
                    <Field label="Mode-S Hex" value={reg.mode_s_hex} icon={Radio} />
                    <Field label="ICAO Type" value={reg.icao_type} icon={Plane} />
                    <Field label="Aircraft Type" value={reg.type_aircraft} icon={Plane} />
                    <Field label="Engine Type" value={reg.engine_type} icon={Zap} />
                    <Field label="Owner" value={reg.registered_owner} icon={Building2} />
                    <Field label="State / Country" value={reg.state ? `${reg.state}, ${reg.country}` : reg.country} icon={MapPin} />
                    <Field label="Reg. Status" value={reg.registration_status?.toUpperCase()} icon={ShieldAlert} />
                    <Field label="Cert Issue Date" value={reg.cert_issue_date} icon={Calendar} />
                    <Field label="Expiration Date" value={reg.expiration_date} icon={Calendar} />
                    <Field label="Airworthiness Date" value={reg.air_worth_date} icon={Calendar} />
                    <Field label="Last Action Date" value={reg.last_action_date} icon={Activity} />
                  </div>
                )}
              </div>

              {/* ADS-B Tracking Card */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Radar className="w-4 h-4 text-[#5dcaa5]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#5dcaa5]">ADS-B Tracking</span>
                  {track?.appearances_count != null && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(93,202,165,0.10)", color: "#5dcaa5" }}>{track.appearances_count} sightings</span>
                  )}
                </div>
                {!track?.last_seen && <p className="text-sm text-white/40 italic">No ADS-B tracking data recorded</p>}
                {track?.last_seen && (
                  <div>
                    <Field label="Last Seen" value={new Date(track.last_seen).toLocaleString()} icon={Clock} />
                    <Field label="Days Since Last Flight" value={track.last_seen_days_ago != null ? `${track.last_seen_days_ago} days` : null} icon={Activity} />
                    <Field label="Last Callsign" value={track.last_callsign} icon={Radio} />
                    <Field label="Last Aircraft Type" value={track.last_aircraft_type} icon={Plane} />
                    <Field label="Last On Ground" value={track.last_on_ground ? "Yes (parked)" : "No (airborne)"} icon={MapPin} />
                    <Field label="First Seen" value={track.first_seen ? new Date(track.first_seen).toLocaleString() : null} icon={Calendar} />
                    {track.last_position && (
                      <>
                        <div className="mt-3 mb-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-white/40">Last Known Position</p>
                        </div>
                        <Field label="Latitude" value={track.last_position.lat?.toFixed(4)} icon={MapPin} />
                        <Field label="Longitude" value={track.last_position.lon?.toFixed(4)} icon={MapPin} />
                        <Field label="Altitude" value={track.last_position.altitude_ft != null ? `${track.last_position.altitude_ft.toLocaleString()} ft` : null} icon={Activity} />
                        <Field label="Ground Speed" value={track.last_position.speed_kt != null ? `${track.last_position.speed_kt} kt` : null} icon={Zap} />
                        <Field label="Heading" value={track.last_position.heading != null ? `${track.last_position.heading}°` : null} icon={Activity} />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Photo */}
            {reg?.url_photo && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-2">Aircraft Photo (adsbdb)</p>
                <img src={reg.url_photo} alt={result.registration} className="rounded-xl max-h-64 mx-auto" />
              </div>
            )}

            {/* Cross-links */}
            <div className="flex flex-wrap gap-3">
              <Link to={`/twin/${result.registration}`} className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ background: "rgba(78,142,247,0.10)", border: "0.5px solid rgba(78,142,247,0.25)", color: "#4e8ef7" }}>
                <Plane className="w-3.5 h-3.5" /> Digital Twin
              </Link>
              <Link to="/n-lookup" className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.25)", color: "#f5c242" }}>
                <Search className="w-3.5 h-3.5" /> N-Lookup
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !error && !loading && (
          <div className="mt-8 rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <Radar className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">Enter any aircraft registration to cross-reference registry data with live ADS-B tracking</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["N12345", "OK-ABC", "G-ABCD", "D-EEEE"].map(ex => (
                <button key={ex} onClick={() => setRegistration(ex)}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.60)" }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}