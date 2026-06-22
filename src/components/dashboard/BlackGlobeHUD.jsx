import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import GlobeNav from "@/components/dashboard/GlobeNav";

// ─── Country coords & reg prefix map ──────────────────────────
const COUNTRY_COORDS = {
  "US": { lat: 38, lon: -97, flag: "🇺🇸", name: "USA" },
  "CA": { lat: 56, lon: -96, flag: "🇨🇦", name: "Canada" },
  "GB": { lat: 54, lon: -2, flag: "🇬🇧", name: "UK" },
  "DE": { lat: 51, lon: 10, flag: "🇩🇪", name: "Germany" },
  "FR": { lat: 46, lon: 2, flag: "🇫🇷", name: "France" },
  "IT": { lat: 42, lon: 12, flag: "🇮🇹", name: "Italy" },
  "ES": { lat: 40, lon: -4, flag: "🇪🇸", name: "Spain" },
  "NL": { lat: 52, lon: 5, flag: "🇳🇱", name: "Netherlands" },
  "AT": { lat: 47, lon: 14, flag: "🇦🇹", name: "Austria" },
  "CH": { lat: 47, lon: 8, flag: "🇨🇭", name: "Switzerland" },
  "CZ": { lat: 50, lon: 15, flag: "🇨🇿", name: "Czech Republic" },
  "AU": { lat: -25, lon: 133, flag: "🇦🇺", name: "Australia" },
  "BR": { lat: -15, lon: -50, flag: "🇧🇷", name: "Brazil" },
  "ZA": { lat: -29, lon: 25, flag: "🇿🇦", name: "South Africa" },
  "AE": { lat: 24, lon: 54, flag: "🇦🇪", name: "UAE" },
  "IN": { lat: 20, lon: 78, flag: "🇮🇳", name: "India" },
  "JP": { lat: 36, lon: 138, flag: "🇯🇵", name: "Japan" },
  "CN": { lat: 35, lon: 105, flag: "🇨🇳", name: "China" },
  "RU": { lat: 60, lon: 100, flag: "🇷🇺", name: "Russia" },
  "TR": { lat: 39, lon: 35, flag: "🇹🇷", name: "Turkey" },
  "MX": { lat: 23, lon: -102, flag: "🇲🇽", name: "Mexico" },
  "AR": { lat: -34, lon: -64, flag: "🇦🇷", name: "Argentina" },
  "NZ": { lat: -41, lon: 174, flag: "🇳🇿", name: "New Zealand" },
  "SE": { lat: 60, lon: 18, flag: "🇸🇪", name: "Sweden" },
  "NO": { lat: 60, lon: 8, flag: "🇳🇴", name: "Norway" },
  "PL": { lat: 52, lon: 20, flag: "🇵🇱", name: "Poland" },
  "IE": { lat: 53, lon: -8, flag: "🇮🇪", name: "Ireland" },
  "PT": { lat: 39, lon: -8, flag: "🇵🇹", name: "Portugal" },
  "GR": { lat: 39, lon: 22, flag: "🇬🇷", name: "Greece" },
  "SK": { lat: 49, lon: 20, flag: "🇸🇰", name: "Slovakia" },
  "HU": { lat: 47, lon: 19, flag: "🇭🇺", name: "Hungary" },
  "SA": { lat: 24, lon: 45, flag: "🇸🇦", name: "Saudi Arabia" },
  "KR": { lat: 36, lon: 128, flag: "🇰🇷", name: "South Korea" },
  "SG": { lat: 1, lon: 104, flag: "🇸🇬", name: "Singapore" },
  "TH": { lat: 15, lon: 101, flag: "🇹🇭", name: "Thailand" },
  "ID": { lat: -6, lon: 107, flag: "🇮🇩", name: "Indonesia" },
  "MY": { lat: 4, lon: 102, flag: "🇲🇾", name: "Malaysia" },
  "PH": { lat: 13, lon: 122, flag: "🇵🇭", name: "Philippines" },
  "VN": { lat: 14, lon: 108, flag: "🇻🇳", name: "Vietnam" },
  "CL": { lat: -33, lon: -71, flag: "🇨🇱", name: "Chile" },
  "CO": { lat: 4, lon: -72, flag: "🇨🇴", name: "Colombia" },
  "EG": { lat: 27, lon: 30, flag: "🇪🇬", name: "Egypt" },
  "NG": { lat: 9, lon: 8, flag: "🇳🇬", name: "Nigeria" },
  "KE": { lat: -1, lon: 37, flag: "🇰🇪", name: "Kenya" },
  "IL": { lat: 31, lon: 35, flag: "🇮🇱", name: "Israel" },
  "FI": { lat: 61, lon: 26, flag: "🇫🇮", name: "Finland" },
  "DK": { lat: 56, lon: 10, flag: "🇩🇰", name: "Denmark" },
  "BE": { lat: 51, lon: 4, flag: "🇧🇪", name: "Belgium" },
  "HR": { lat: 45, lon: 16, flag: "🇭🇷", name: "Croatia" },
  "RO": { lat: 46, lon: 25, flag: "🇷🇴", name: "Romania" },
  "BG": { lat: 43, lon: 25, flag: "🇧🇬", name: "Bulgaria" },
  "UA": { lat: 49, lon: 31, flag: "🇺🇦", name: "Ukraine" },
  "TW": { lat: 24, lon: 121, flag: "🇹🇼", name: "Taiwan" },
  "LU": { lat: 50, lon: 6, flag: "🇱🇺", name: "Luxembourg" },
};

const REG_PREFIX_MAP = {
  "N": "US", "C": "CA", "CF": "CA", "CG": "CA",
  "G": "GB", "D": "DE", "F": "FR", "I": "IT",
  "EC": "ES", "PH": "NL", "OE": "AT", "HB": "CH",
  "SP": "PL", "OK": "CZ", "OM": "SK", "HA": "HU",
  "YR": "RO", "LZ": "BG", "9A": "HR", "SX": "GR",
  "SE": "SE", "LN": "NO", "OH": "FI", "OY": "DK",
  "OO": "BE", "LX": "LU", "CS": "PT", "EI": "IE",
  "UR": "UA", "RA": "RU", "VH": "AU", "ZK": "NZ",
  "JA": "JP", "B": "CN", "VT": "IN", "HL": "KR",
  "9V": "SG", "HS": "TH", "PK": "ID", "9M": "MY",
  "RP": "PH", "XA": "MX", "XB": "MX", "XC": "MX",
  "PP": "BR", "PT": "BR", "PR": "BR", "LV": "AR",
  "LQ": "AR", "CC": "CL", "HK": "CO", "OB": "PE",
  "ZS": "ZA", "ZT": "ZA", "ZU": "ZA", "A6": "AE",
  "SU": "EG", "5N": "NG", "5Y": "KE", "4X": "IL",
  "HZ": "SA", "TC": "TR",
};

const POLYGONS = [
  [[[-168,72],[-140,71],[-125,50],[-124,49],[-124,46],[-122,38],[-117,32],[-110,24],[-105,20],[-99,16],[-91,16],[-88,16],[-84,10],[-79,9],[-77,8],[-63,11],[-60,11],[-53,47],[-56,47],[-64,44],[-67,44],[-70,43],[-70,41],[-74,40],[-76,35],[-80,32],[-81,30],[-81,29],[-80,25],[-80,24],[-97,26],[-97,30],[-93,30],[-90,29],[-89,29],[-93,28],[-97,26],[-100,25],[-107,24],[-110,26],[-117,32],[-124,49],[-141,60],[-168,72]]],
  [[[-45,83],[-20,83],[-18,76],[-22,72],[-28,68],[-40,64],[-44,60],[-52,62],[-52,66],[-54,70],[-58,74],[-50,78],[-45,83]]],
  [[[-72,12],[-63,10],[-52,5],[-50,2],[-50,0],[-50,-2],[-36,-8],[-35,-10],[-37,-12],[-39,-16],[-40,-20],[-41,-22],[-43,-23],[-47,-25],[-48,-27],[-50,-30],[-52,-33],[-52,-34],[-57,-35],[-57,-36],[-58,-38],[-60,-38],[-62,-40],[-63,-42],[-65,-42],[-66,-44],[-67,-46],[-66,-48],[-68,-50],[-68,-52],[-65,-54],[-67,-55],[-65,-55],[-70,-53],[-75,-50],[-75,-44],[-73,-42],[-72,-38],[-72,-36],[-72,-32],[-72,-30],[-71,-28],[-70,-24],[-70,-22],[-70,-18],[-70,-16],[-75,-14],[-76,-12],[-78,-10],[-78,-6],[-78,-4],[-80,-2],[-80,0],[-80,2],[-78,5],[-77,8],[-76,10],[-73,12],[-72,12]]],
  [[[26,71],[28,68],[20,64],[16,60],[12,58],[8,58],[4,57],[4,56],[8,54],[10,54],[14,54],[6,53],[4,52],[2,51],[0,51],[-2,49],[-5,48],[-2,48],[-2,46],[0,44],[3,43],[8,44],[14,44],[18,43],[20,42],[24,43],[26,44],[28,45],[30,46],[28,47],[22,47],[18,48],[18,50],[22,48],[26,50],[26,52],[20,52],[14,52],[8,52],[6,51],[4,52],[6,53],[8,54],[14,54],[18,55],[18,56],[12,58],[8,58],[4,57],[4,58],[5,62],[14,65],[20,68],[28,68],[26,71]]],
  [[[30,70],[50,70],[70,70],[90,68],[100,65],[132,65],[140,60],[138,56],[142,50],[142,48],[136,44],[130,42],[130,38],[136,34],[122,30],[120,26],[114,22],[110,20],[108,16],[106,12],[104,8],[104,2],[104,-2],[106,-4],[108,-6],[110,-8],[116,-8],[114,-6],[110,-4],[108,-2],[104,0],[100,4],[100,6],[98,8],[100,12],[98,16],[96,18],[92,22],[92,24],[88,24],[88,22],[86,18],[84,16],[82,14],[80,10],[78,10],[74,14],[72,16],[70,20],[68,20],[68,22],[68,24],[68,26],[66,28],[62,28],[60,26],[58,24],[56,22],[54,26],[52,28],[50,28],[48,30],[44,34],[36,34],[36,36],[36,38],[38,40],[40,40],[42,42],[42,44],[44,44],[46,46],[48,48],[50,50],[52,52],[52,54],[50,52],[48,46],[44,42],[42,42],[40,40],[38,38],[36,36],[34,36],[32,44],[30,48],[50,32],[50,36],[52,38],[54,50],[56,52],[60,54],[64,56],[68,60],[70,60]]],
  [[[128,-14],[130,-14],[134,-14],[136,-14],[138,-14],[138,-16],[140,-16],[141,-17],[140,-20],[138,-22],[138,-24],[140,-26],[142,-26],[144,-26],[148,-26],[152,-27],[154,-28],[153,-30],[152,-32],[151,-34],[150,-36],[148,-38],[146,-38],[142,-38],[140,-37],[138,-36],[136,-35],[136,-34],[134,-34],[132,-34],[130,-34],[128,-32],[116,-30],[114,-28],[114,-26],[114,-24],[114,-22],[118,-20],[122,-18],[124,-16],[126,-15],[128,-14]]],
];

function groupByCountry(listings) {
  const groups = {};
  listings.forEach((l) => {
    // Strip owner/operator identity fields — globe shows specs only
    const safe = {
      id: l.id,
      year: l.year,
      make: l.make,
      model: l.model,
      registration: l.registration,
      asking_price: l.asking_price,
      ati_score: l.ati_score,
      status: l.status,
    };
    const reg = (safe.registration || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    let country = null;
    for (const len of [2, 1]) {
      const prefix = reg.substring(0, len);
      if (REG_PREFIX_MAP[prefix]) { country = REG_PREFIX_MAP[prefix]; break; }
    }
    if (!country) country = "US";
    if (!groups[country]) {
      const c = COUNTRY_COORDS[country] || { lat: 20, lon: 0, flag: "📍", name: country };
      groups[country] = { country, lat: c.lat, lon: c.lon, flag: c.flag, name: c.name, listings: [] };
    }
    groups[country].listings.push(safe);
  });
  return Object.values(groups);
}

// ─── Theme palettes ────────────────────────────────────────────
function getTheme(isDark) {
  // ABOS brand colors from design handoff
  const amber = "#f5c242";       // brand amber/gold
  const darkBg = "#04060a";      // brand dark background
  if (isDark) {
    return {
      bg: darkBg,
      oceanInner: "#0A0A0A",
      oceanMid: "#050505",
      oceanOuter: "#000000",
      continentFill: "rgba(245,194,66,0.08)",     // very subtle amber fill
      continentStroke: amber,                     // brand yellow outline
      dotGrid: "rgba(255,255,255,0.025)",
      rim: "rgba(255,255,255,0.06)",
      atmosphere: `${amber}08`,
      pillBg: "rgba(255,255,255,0.08)",
      pillBorder: "1px solid rgba(255,255,255,0.12)",
      pillShadow: "0 8px 32px rgba(0,0,0,0.4)",
      text: "#fff",
      muted: "rgba(255,255,255,0.45)",
      popupBg: "rgba(10,10,10,0.95)",
      popupBorder: `1px solid ${amber}40`,
      popupShadow: "0 12px 40px rgba(0,0,0,0.6)",
      popupArrow: "rgba(10,10,10,0.95)",
      rowBg: "rgba(255,255,255,0.04)",
      rowBorder: "1px solid rgba(255,255,255,0.06)",
      rowHover: `${amber}14`,
      rowText: "#fff",
      rowMuted: "rgba(255,255,255,0.35)",
      pinColor: amber,
      pinGlow: amber,
      watermarkOpacity: 0.06,
      watermarkColor: "#ffffff",
      dotGridBg: "rgba(255,255,255,0.04)",
      dotGridSize: "40px",
    };
  }
  return {
    bg: "#eef2f7",
    oceanInner: "#dbe5f0",
    oceanMid: "#cdd8e6",
    oceanOuter: "#b8c5d6",
    continentFill: "rgba(45,80,55,0.65)",
    continentStroke: "rgba(30,50,35,0.4)",
    dotGrid: "rgba(0,0,0,0.03)",
    rim: "rgba(0,0,0,0.10)",
    atmosphere: `${amber}0D`,
    pillBg: "rgba(255,255,255,0.72)",
    pillBorder: "1px solid rgba(0,0,0,0.08)",
    pillShadow: "0 8px 32px rgba(0,0,0,0.15)",
    text: "#1a1a1a",
    muted: "rgba(0,0,0,0.50)",
    popupBg: "rgba(255,255,255,0.95)",
    popupBorder: `1px solid ${amber}4D`,
    popupShadow: "0 12px 40px rgba(0,0,0,0.2)",
    popupArrow: "rgba(255,255,255,0.95)",
    rowBg: "rgba(0,0,0,0.03)",
    rowBorder: "1px solid rgba(0,0,0,0.05)",
    rowHover: `${amber}1A`,
    rowText: "#1a1a1a",
    rowMuted: "rgba(0,0,0,0.45)",
    pinColor: amber,
    pinGlow: amber,
    watermarkOpacity: 0.05,
    watermarkColor: "#000000",
    dotGridBg: "rgba(0,0,0,0.03)",
    dotGridSize: "40px",
  };
}

// ─── Cluster popup ────────────────────────────────────────────
function ClusterPopup({ cluster, pos, onClose, onOpen, t }) {
  if (!cluster || !pos) return null;
  return (
    <div style={{ position: "absolute", left: pos.x, top: pos.y, transform: "translate(-50%, calc(-100% - 14px))", zIndex: 30 }}>
      <div style={{
        background: t.popupBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: t.popupBorder, borderRadius: 14, padding: "12px 14px", minWidth: 200, maxWidth: 260,
        boxShadow: t.popupShadow,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>{cluster.flag}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{cluster.name}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.muted, cursor: "pointer", padding: 2 }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: t.pinColor, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          {cluster.listings.length} listing{cluster.listings.length > 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
          {cluster.listings.map((l, i) => (
            <button key={l.id || i} onClick={() => onOpen(l)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8,
                background: t.rowBg, border: t.rowBorder, cursor: "pointer", textAlign: "left",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = t.rowHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = t.rowBg; }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: l.ati_score >= 72 ? "#5dcaa5" : t.pinColor, flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: t.rowText, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {l.year} {l.make} {l.model}
                </p>
                <p style={{ fontSize: 9, color: t.rowMuted, margin: 0, fontFamily: "'Courier New', monospace" }}>
                  {l.registration}{l.asking_price ? ` · $${l.asking_price.toLocaleString()}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translate(-50%, 100%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `7px solid ${t.popupArrow}` }} />
    </div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────
function Pill({ children, t }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999,
      background: t.pillBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: t.pillBorder, boxShadow: t.pillShadow,
    }}>
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────
export default function BlackGlobeHUD({
  listings = [],
  utcTime,
  stats = { adsbCount: 2315, liveDbCount: 10987, faaCount: 456 },
  listingsCount = 142,
  isDark = true,
}) {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const rotRef = useRef(0);
  const rafRef = useRef(null);
  const pausedRef = useRef(false);
  const clusterScreenRef = useRef([]);
  const [time, setTime] = useState(utcTime || "");
  const [popup, setPopup] = useState(null);
  const [hoverCluster, setHoverCluster] = useState(null);

  const t = getTheme(isDark);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const clusters = useMemo(() => groupByCountry(listings), [listings]);
  const clustersRef = useRef(clusters);
  useEffect(() => { clustersRef.current = clusters; }, [clusters]);

  useEffect(() => {
    if (utcTime) return;
    const update = () => {
      const d = new Date();
      setTime(`${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}:${String(d.getUTCSeconds()).padStart(2,"0")}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [utcTime]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W, H, R, CX, CY, DPR;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = cv.parentElement.getBoundingClientRect();
      W = Math.round(rect.width * DPR);
      H = Math.round(rect.height * DPR);
      cv.width = W; cv.height = H;
      cv.style.width = rect.width + "px";
      cv.style.height = rect.height + "px";
      R = Math.min(W, H) * 0.42;
      CX = W / 2;
      CY = H / 2;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv.parentElement);

    const project = (lon, lat) => {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180 + rotRef.current) * Math.PI / 180;
      const x = -Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      return { sx: CX + x * R, sy: CY - y * R, vis: z > 0, depth: z };
    };

    let frame = 0;

    const draw = () => {
      const th = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Ocean — transparent (no fill, let dashboard background show through)
      // (intentionally removed)

      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.clip();

      // Continents — thick yellow outline with glow
      for (const poly of POLYGONS) {
        for (const ring of poly) {
          ctx.beginPath();
          ring.forEach(([lon, lat], i) => {
            const p = project(lon, lat);
            if (i === 0) ctx.moveTo(p.sx, p.sy);
            else ctx.lineTo(p.sx, p.sy);
          });
          ctx.closePath();
          ctx.fillStyle = th.continentFill;
          ctx.fill();
          // Glow pass
          ctx.shadowColor = th.continentStroke;
          ctx.shadowBlur = 6 * DPR;
          ctx.strokeStyle = th.continentStroke;
          ctx.lineWidth = 1.8 * DPR;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Dot grid
      ctx.fillStyle = th.dotGrid;
      for (let la = -80; la <= 80; la += 8) {
        for (let lo = -180; lo <= 180; lo += 8) {
          const p = project(lo, la);
          if (!p.vis) continue;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 0.5 * DPR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Cluster pins — ABOS brand amber
      const projectedClusters = [];
      const cls = clustersRef.current;
      const pinHex = th.pinColor;
      // Convert hex to rgb for rgba strings
      const pinRgb = parseInt(pinHex.slice(1), 16);
      const pr = (pinRgb >> 16) & 255, pg = (pinRgb >> 8) & 255, pb = pinRgb & 255;
      cls.forEach((cluster, i) => {
        const p = project(cluster.lon, cluster.lat);
        projectedClusters.push({ ...p, cluster, index: i });
        if (!p.vis) return;

        const count = cluster.listings.length;
        const isHovered = hoverCluster === i;
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.04 + i * 1.7);

        for (let ring = 2; ring >= 0; ring--) {
          ctx.beginPath();
          const ringR = (6 + ring * 4 + (isHovered ? pulse * 3 : 0)) * DPR;
          ctx.arc(p.sx, p.sy, ringR, 0, Math.PI * 2);
          const alpha = (isHovered ? 0.18 : 0.08) * (3 - ring) / 3;
          ctx.strokeStyle = `rgba(${pr},${pg},${pb},${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.2 * DPR;
          ctx.stroke();
        }

        const dotR = (isHovered ? 5 : 3.5) * DPR;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = pinHex;
        ctx.shadowColor = pinHex;
        ctx.shadowBlur = (isHovered ? 10 : 5) * DPR;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (count > 1) {
          const bx = p.sx + dotR + 2 * DPR;
          const by = p.sy - dotR - 2 * DPR;
          ctx.beginPath();
          ctx.arc(bx, by, 6 * DPR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${pr},${pg},${pb},0.9)`;
          ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.4)";
          ctx.lineWidth = 0.5 * DPR;
          ctx.stroke();
          ctx.fillStyle = "#000";
          ctx.font = `bold ${8 * DPR}px -apple-system, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(count), bx, by);
        }
      });
      clusterScreenRef.current = projectedClusters;

      ctx.restore();

      // Rim
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = th.rim;
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();

      // Atmosphere
      const rimGrad = ctx.createRadialGradient(CX, CY, R * 0.96, CX, CY, R * 1.1);
      rimGrad.addColorStop(0, th.atmosphere);
      rimGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(CX, CY, R * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();
    };

    const loop = () => {
      frame++;
      if (!pausedRef.current) rotRef.current += 0.04;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [hoverCluster]);

  const handleClick = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const mx = (e.clientX - rect.left) * DPR;
    const my = (e.clientY - rect.top) * DPR;
    const HIT = 16 * DPR;

    let best = null, bestDist = Infinity;
    for (const pt of clusterScreenRef.current) {
      if (!pt.vis) continue;
      const dx = pt.sx - mx, dy = pt.sy - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < HIT && d < bestDist) { bestDist = d; best = pt; }
    }

    if (best) {
      pausedRef.current = true;
      setPopup({ cluster: best.cluster, x: best.sx / DPR, y: best.sy / DPR });
    } else {
      setPopup(null);
      pausedRef.current = false;
    }
  }, []);

  const handleMove = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const mx = (e.clientX - rect.left) * DPR;
    const my = (e.clientY - rect.top) * DPR;
    const HIT = 16 * DPR;

    let found = null;
    for (const pt of clusterScreenRef.current) {
      if (!pt.vis) continue;
      const dx = pt.sx - mx, dy = pt.sy - my;
      if (Math.sqrt(dx * dx + dy * dy) < HIT) { found = pt.index; break; }
    }
    setHoverCluster(found);
    cv.style.cursor = found !== null ? "pointer" : "default";
  }, []);

  const closePopup = () => {
    setPopup(null);
    pausedRef.current = false;
  };

  const openListing = (l) => {
    if (l.id) navigate(`/ati-passport/${l.id}`);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 500, background: "transparent", overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onMouseMove={handleMove}
        style={{ width: "100%", height: "100%", display: "block", position: "relative", zIndex: 2 }}
      />

      {/* Top-Left: UTC time */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
        <Pill t={t}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.pinColor, boxShadow: `0 0 8px ${t.pinColor}80`, flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: t.text, fontFamily: "'Courier New', monospace" }}>{time}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: t.muted }}>UTC</span>
          </div>
        </Pill>
      </div>

      {/* Top-Right: Navigation + Admin */}
      <GlobeNav isDark={isDark} />

      {/* Bottom-Left: Stats */}
      <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { color: t.pinColor, label: "ADS-B count", value: stats.adsbCount.toLocaleString() },
          { color: "#0D9488", label: "Live DB count", value: stats.liveDbCount.toLocaleString() },
          { color: "#0D9488", label: "FAA count", value: stats.faaCount.toLocaleString() },
        ].map(s => (
          <Pill key={s.label} t={t}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color || t.pinColor, boxShadow: `0 0 8px ${(s.color || t.pinColor)}80`, flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{s.value}</span>
            </div>
          </Pill>
        ))}
      </div>

      {/* Bottom-Right: Listings + hint */}
      <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 10, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        <Pill t={t}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.pinColor, boxShadow: `0 0 8px ${t.pinColor}80`, flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>listings</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Total: {listingsCount}</span>
          </div>
        </Pill>
        <div style={{
          padding: "8px 14px", borderRadius: 999,
          background: t.pillBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: t.pillBorder, fontSize: 10, fontWeight: 600, color: t.muted,
        }}>
          Click a pin to expand listings
        </div>
      </div>

      {/* Cluster popup */}
      {popup && (
        <ClusterPopup cluster={popup.cluster} pos={{ x: popup.x, y: popup.y }} onClose={closePopup} onOpen={openListing} t={t} />
      )}
    </div>
  );
}