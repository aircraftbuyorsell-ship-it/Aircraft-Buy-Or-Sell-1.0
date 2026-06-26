import { useState, useCallback } from "react";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import RegistryResultOverlay from "@/components/dashboard/RegistryResultOverlay";

// Auto-insert dash for international prefixes that use one (OK-, D-, G-, …)
const DASH_PREFIXES = ["OK", "D", "G", "F", "I", "EC", "EA", "SE", "OO", "PH", "HB", "OE", "LN", "OY", "ZK", "VH", "CS", "B", "9M"];

function normalizeReg(raw) {
  if (!raw) return "";
  let r = raw.toUpperCase().replace(/\s+/g, "");
  for (const p of DASH_PREFIXES) {
    if (r.startsWith(p) && !r.startsWith(p + "-")) {
      r = p + "-" + r.slice(p.length);
      break;
    }
  }
  return r;
}

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

export default function NRegLookup({ userProfile, onFocusLocation }) {
  const isDark = useTheme();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [overlayData, setOverlayData] = useState(null);

  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.50)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";

  const search = useCallback(async () => {
    const fullReg = normalizeReg(query);
    if (!fullReg) return;
    setSearching(true);
    setError("");

    try {
      const res = await base44.functions.invoke("globalAircraftLookup", { registration: fullReg });
      const data = res.data;

      if (!data.found) {
        setError(data.error || `No registry record found for ${fullReg}.`);
        setSearching(false);
        return;
      }

      // Focus globe on aircraft location (US only — has state)
      if (data.aircraft.state && onFocusLocation) {
        const coords = US_STATE_CENTROIDS[data.aircraft.state.toUpperCase()];
        if (coords) onFocusLocation({ lat: coords[0], lon: coords[1], state: data.aircraft.state });
      }

      // Fetch aircraft photo (adsbdb real photo or HF-generated)
      let photo = null;
      try {
        const photoRes = await base44.functions.invoke("aircraftPhoto", {
          registration: data.aircraft.registration || fullReg,
          hex: data.aircraft.mode_s_hex,
          make: data.aircraft.make,
          model: data.aircraft.model,
        });
        if (photoRes.data?.photo_url) photo = photoRes.data;
      } catch (_) {}

      // Open the full-screen overlay with all data
      setOverlayData({
        result: { ...data.aircraft, _origin: data.origin_label, _source: data.source },
        photo,
        photoLoading: false,
        listingMatch: data.listing || null,
        areaServices: data.areaServices?.byRole || null,
        areaState: data.areaServices?.state || "",
      });
    } catch (_) {
      setError("Failed to search registry. Please try again.");
    }
    setSearching(false);
  }, [query]);

  const handleKeyDown = (e) => { if (e.key === "Enter") search(); };

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
            placeholder="Enter registration (N12345, OK-2001, G-BOAC, D-AIBL)…"
            className="flex-1 py-2.5 text-sm font-medium bg-transparent border-none outline-none"
            style={{ color: textColor, background: "transparent !important", border: "none !important" }}
          />
          <button
            onClick={search}
            disabled={searching || !normalizeReg(query)}
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
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm" style={{ color: mutedColor }}>{error}</p>
        </div>
      )}

      {/* Full-screen result overlay */}
      {overlayData && (
        <RegistryResultOverlay
          result={overlayData.result}
          photo={overlayData.photo}
          photoLoading={overlayData.photoLoading}
          listingMatch={overlayData.listingMatch}
          areaServices={overlayData.areaServices}
          areaState={overlayData.areaState}
          userProfile={userProfile}
          onClose={() => setOverlayData(null)}
        />
      )}
    </div>
  );
}