import { useEffect, useRef, useState, useCallback } from "react";

// Simplified continent polygons
const POLYGONS = [
  [[[-168,72],[-140,71],[-125,50],[-124,49],[-124,46],[-122,38],[-117,32],[-110,24],[-105,20],[-99,16],[-91,16],[-88,16],[-84,10],[-79,9],[-77,8],[-63,11],[-60,11],[-53,47],[-56,47],[-64,44],[-67,44],[-70,43],[-70,41],[-74,40],[-76,35],[-80,32],[-81,30],[-81,29],[-80,25],[-80,24],[-97,26],[-97,30],[-93,30],[-90,29],[-89,29],[-93,28],[-97,26],[-100,25],[-107,24],[-110,26],[-117,32],[-124,49],[-141,60],[-168,72]]],
  [[[-45,83],[-20,83],[-18,76],[-22,72],[-28,68],[-40,64],[-44,60],[-52,62],[-52,66],[-54,70],[-58,74],[-50,78],[-45,83]]],
  [[[-72,12],[-63,10],[-52,5],[-50,2],[-50,0],[-50,-2],[-36,-8],[-35,-10],[-37,-12],[-39,-16],[-40,-20],[-41,-22],[-43,-23],[-47,-25],[-48,-27],[-50,-30],[-52,-33],[-52,-34],[-57,-35],[-57,-36],[-58,-38],[-60,-38],[-62,-40],[-63,-42],[-65,-42],[-66,-44],[-67,-46],[-66,-48],[-68,-50],[-68,-52],[-65,-54],[-67,-55],[-65,-55],[-70,-53],[-75,-50],[-75,-44],[-73,-42],[-72,-38],[-72,-36],[-72,-32],[-72,-30],[-71,-28],[-70,-24],[-70,-22],[-70,-18],[-70,-16],[-75,-14],[-76,-12],[-78,-10],[-78,-6],[-78,-4],[-80,-2],[-80,0],[-80,2],[-78,5],[-77,8],[-76,10],[-73,12],[-72,12]]],
  [[[26,71],[28,68],[20,64],[16,60],[12,58],[8,58],[4,57],[4,56],[8,54],[10,54],[14,54],[10,54],[8,54],[6,53],[4,52],[2,51],[0,51],[-2,49],[-5,48],[-2,48],[-2,47],[-2,46],[0,44],[3,43],[8,44],[8,46],[14,44],[18,43],[18,42],[20,42],[22,42],[24,43],[26,44],[28,45],[30,46],[30,45],[28,47],[22,47],[18,48],[18,50],[22,48],[24,48],[26,50],[26,52],[20,52],[14,52],[8,52],[6,51],[4,52],[6,53],[8,54],[14,54],[18,55],[18,56],[12,58],[8,58],[4,57],[4,58],[6,58],[5,62],[14,65],[20,68],[28,68],[26,71]]],
  [[[-6,50],[-4,52],[-6,54],[-4,58],[0,58],[0,56],[0,53],[2,51],[2,50],[-2,50],[-6,50]]],
  [[[0,44],[-2,44],[-2,42],[-9,44],[-9,36],[-6,36],[0,36],[0,38],[3,40],[3,44],[0,44]]],
  [[[10,37],[12,35],[32,30],[34,28],[34,24],[38,22],[42,18],[42,14],[42,10],[40,8],[38,4],[42,2],[42,0],[40,-2],[40,-4],[38,-6],[36,-8],[38,-10],[40,-14],[36,-18],[37,-22],[33,-26],[33,-30],[28,-32],[26,-34],[20,-34],[18,-32],[16,-30],[16,-26],[14,-22],[14,-18],[12,-14],[12,-10],[10,-6],[10,-2],[8,4],[6,4],[-2,6],[-4,8],[-4,10],[-2,8],[0,10],[0,12],[2,14],[2,16],[4,14],[4,16],[-4,16],[-16,16],[-16,14],[-16,8],[-14,4],[-10,4],[-10,0],[-6,-2],[-6,-4],[-4,-4],[-2,-4],[0,-6],[0,-4],[-4,-4],[-4,-2],[0,2],[4,4],[4,6],[8,6],[6,4],[4,2],[6,-2],[8,-4],[10,-2],[12,0],[14,2],[14,4],[16,4],[14,2],[14,-4],[16,-4],[8,-16],[4,-10],[0,-6],[0,-4],[2,-4],[4,-4],[6,-4],[8,-4],[10,-2],[12,0],[14,2],[18,4],[22,4],[26,4],[30,2],[32,2],[34,4],[36,6],[37,10],[10,37]]],
  [[[30,70],[50,70],[70,70],[90,68],[100,65],[132,65],[140,60],[138,56],[142,50],[142,48],[136,44],[130,42],[130,38],[136,34],[122,30],[120,26],[114,22],[110,20],[108,16],[106,12],[104,8],[104,2],[104,-2],[106,-4],[108,-6],[110,-8],[116,-8],[114,-6],[110,-4],[108,-2],[104,0],[100,4],[100,6],[98,8],[100,12],[98,16],[96,18],[92,22],[92,24],[88,24],[88,22],[86,18],[84,16],[82,14],[80,10],[78,10],[74,14],[72,16],[72,18],[70,20],[68,20],[68,22],[68,24],[68,26],[66,28],[62,28],[60,26],[58,24],[56,22],[54,26],[52,28],[50,28],[48,30],[44,34],[36,34],[36,36],[36,38],[38,40],[40,40],[42,42],[42,44],[44,44],[46,46],[48,48],[50,50],[52,52],[52,54],[50,52],[48,46],[44,42],[42,42],[40,40],[38,38],[36,36],[34,36],[32,44],[30,48],[48,30],[52,28],[56,22],[54,26],[52,28],[50,32],[50,36],[52,38],[54,50],[56,52],[60,54],[64,56],[68,60],[70,60],[70,30]]],
  [[[128,-14],[130,-14],[134,-14],[136,-14],[138,-14],[138,-16],[140,-16],[141,-17],[140,-20],[138,-22],[138,-24],[140,-26],[142,-26],[144,-26],[148,-26],[152,-27],[154,-28],[153,-30],[152,-32],[151,-34],[150,-36],[148,-38],[146,-38],[142,-38],[140,-37],[138,-36],[136,-35],[136,-34],[134,-34],[132,-34],[130,-34],[128,-32],[116,-30],[114,-28],[114,-26],[114,-24],[114,-22],[118,-20],[122,-18],[124,-16],[126,-15],[128,-14]]],
  [[[-180,-68],[-120,-68],[-60,-68],[0,-68],[60,-68],[120,-68],[180,-68],[180,-90],[-180,-90],[-180,-68]]],
];

// Country → approx lat/lon
const COUNTRY_COORDS = {
  "US": { lat: 38, lon: -97 }, "USA": { lat: 38, lon: -97 },
  "DE": { lat: 51, lon: 10 }, "GB": { lat: 54, lon: -2 },
  "AU": { lat: -25, lon: 133 }, "FR": { lat: 46, lon: 2 },
  "BR": { lat: -15, lon: -50 }, "CA": { lat: 56, lon: -96 },
  "ZA": { lat: -29, lon: 25 }, "AE": { lat: 24, lon: 54 },
  "CZ": { lat: 50, lon: 15 }, "IT": { lat: 42, lon: 12 },
  "IN": { lat: 20, lon: 78 }, "ES": { lat: 40, lon: -4 },
  "NL": { lat: 52, lon: 5 }, "AT": { lat: 47, lon: 14 },
  "CH": { lat: 47, lon: 8 }, "PL": { lat: 52, lon: 20 },
  "SE": { lat: 60, lon: 18 }, "NO": { lat: 60, lon: 8 },
  "MX": { lat: 23, lon: -102 }, "AR": { lat: -34, lon: -64 },
  "JP": { lat: 36, lon: 138 }, "CN": { lat: 35, lon: 105 },
  "SG": { lat: 1, lon: 104 }, "NZ": { lat: -41, lon: 174 },
};

// Fallback markers when no listings
const DEFAULT_MARKERS = [
  { lat: 38, lon: -97 }, { lat: 51, lon: 10 }, { lat: 54, lon: -2 },
  { lat: -25, lon: 133 }, { lat: 46, lon: 2 }, { lat: -15, lon: -50 },
  { lat: 56, lon: -96 }, { lat: -29, lon: 25 }, { lat: 24, lon: 54 },
  { lat: 50, lon: 15 }, { lat: 42, lon: 12 }, { lat: 20, lon: 78 },
];

function pip(lon, lat, polygon) {
  let inside = false;
  for (const ring of polygon) {
    const n = ring.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
    }
  }
  return inside;
}
const isLand = (lon, lat) => POLYGONS.some(p => pip(lon, lat, p));

const STEP = 2.8;
const landDots = [];
const oceanDots = [];
for (let lat = -90; lat <= 90; lat += STEP) {
  for (let lon = -180; lon <= 180; lon += STEP) {
    if (isLand(lon, lat)) landDots.push([lon, lat]);
    else if ((Math.round(lat / STEP) + Math.round(lon / STEP)) % 4 === 0) oceanDots.push([lon, lat]);
  }
}

// Map listing to lat/lon — distribute listings evenly across known coords
function listingToCoords(listing, index, total) {
  // Try to find coords from registration prefix or state code
  if (listing.registration) {
    const prefix = listing.registration.substring(0, 2).toUpperCase();
    if (COUNTRY_COORDS[prefix]) return COUNTRY_COORDS[prefix];
  }
  // Scatter across a fixed set of world positions with jitter
  const bases = Object.values(COUNTRY_COORDS);
  const base = bases[index % bases.length];
  const jitter = { lat: (Math.sin(index * 7.3) * 4), lon: (Math.cos(index * 5.1) * 6) };
  return { lat: base.lat + jitter.lat, lon: base.lon + jitter.lon };
}

function atiColor(score, isDark) {
  if (!score) return isDark ? "#ffffff" : "#0B2D5B";
  if (score >= 90) return isDark ? "#00f5ff" : "#0B2D5B";
  if (score >= 72) return isDark ? "#7a00ff" : "#2563eb";
  if (score >= 54) return "#E8A83A";
  return isDark ? "#ff4d6d" : "#dc2626";
}

// ─── Listing Popup overlay (HTML, not canvas) ───────────────────
function ListingPopup({ listing, pos, onClose, onOpen }) {
  if (!listing || !pos) return null;
  const score = listing.ati_score;
  const color = atiColor(score, false); // popups always dark bg
  const pct = score ? (score / 120) * 113.1 : 0;

  return (
    <div
      className="absolute z-30 pointer-events-auto"
      style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -120%)" }}
    >
      {/* Arrow */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-full w-0 h-0"
        style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "7px solid rgba(0,245,255,0.30)" }} />

      <div className="rounded-2xl p-3 min-w-[200px] max-w-[240px] shadow-2xl"
        style={{
          background: "rgba(10,10,32,0.95)",
          backdropFilter: "blur(24px)",
          border: `1px solid ${color}40`,
          boxShadow: `0 0 30px ${color}18, 0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 ${color}25`,
        }}>
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>

        {/* ATI ring + title */}
        <div className="flex items-center gap-2.5 mb-2.5 pr-4">
          <div className="relative w-9 h-9 shrink-0">
            <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
              <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}25`} strokeWidth="3.5" />
              {score && <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3.5"
                strokeDasharray={`${pct} 113.1`} strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 3px ${color})` }} />}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-black" style={{ color }}>{score ?? "—"}</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-black text-white leading-tight truncate">
              {listing.year} {listing.make} {listing.model}
            </p>
            {listing.registration && (
              <p className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{listing.registration}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          {[
            { l: "Price", v: listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : "On request" },
            { l: "Total Time", v: listing.total_time ? `${listing.total_time.toLocaleString()} h` : "—" },
            { l: "Engine SMOH", v: listing.engine_hours ? `${listing.engine_hours.toLocaleString()} h` : "—" },
            { l: "Deal", v: listing.deal_label ?? "—" },
          ].map(({ l, v }) => (
            <div key={l} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <p className="text-[8px] uppercase tracking-wider text-white/25 font-semibold">{l}</p>
              <p className="text-[10px] font-bold text-white/80 truncate mt-0.5">{v}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={() => onOpen(listing.id)}
          className="w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${color}28, ${color}0d)`,
            border: `1px solid ${color}45`,
            color,
          }}>
          Full ATI Report →
        </button>
      </div>
    </div>
  );
}

export default function RotatingGlobe({ className = "", theme = "light", listings = [] }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const themeRef = useRef(theme);
  const listingsRef = useRef(listings);
  const rotLonRef = useRef(10);
  const pausedRef = useRef(false);

  // Projected screen positions of listing markers (updated each frame)
  const projectedRef = useRef([]); // [{ sx, sy, vis, listing }]

  const [popup, setPopup] = useState(null); // { listing, x, y } in CSS px

  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { listingsRef.current = listings; }, [listings]);

  // Build marker data from listings
  const listingMarkers = listings.map((l, i) => ({
    listing: l,
    ...listingToCoords(l, i, listings.length),
  }));

  const handleCanvasClick = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const mx = (e.clientX - rect.left) * DPR;
    const my = (e.clientY - rect.top) * DPR;
    const HIT_R = 12 * DPR;

    // Find closest visible marker within hit radius
    let best = null, bestDist = Infinity;
    for (const pt of projectedRef.current) {
      if (!pt.vis) continue;
      const dx = pt.sx - mx, dy = pt.sy - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < HIT_R && d < bestDist) { bestDist = d; best = pt; }
    }

    if (best) {
      pausedRef.current = true;
      // Convert canvas coords → CSS px
      setPopup({ listing: best.listing, x: best.sx / DPR, y: best.sy / DPR });
    } else {
      setPopup(null);
      pausedRef.current = false;
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const mx = (e.clientX - rect.left) * DPR;
    const my = (e.clientY - rect.top) * DPR;
    const HIT_R = 14 * DPR;
    let found = false;
    for (const pt of projectedRef.current) {
      if (!pt.vis) continue;
      const dx = pt.sx - mx, dy = pt.sy - my;
      if (Math.sqrt(dx * dx + dy * dy) < HIT_R) { found = true; break; }
    }
    cv.style.cursor = found ? "pointer" : "default";
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const parent = cv.parentElement;

    let W, H, R, CX, CY, DPR;
    let hlIdx = 0, fr = 0;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      W = Math.round(rect.width * DPR);
      H = Math.round(rect.height * DPR);
      cv.width = W; cv.height = H;
      cv.style.width = rect.width + "px";
      cv.style.height = rect.height + "px";
      R = Math.min(W, H) * 0.48;
      CX = W * 0.72;
      CY = H * 0.52;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const project = (lon, lat) => {
      const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
      const x = -Math.sin(phi) * Math.cos(theta), y = Math.cos(phi), z = Math.sin(phi) * Math.sin(theta);
      const rl = -18 * Math.PI / 180, cx = Math.cos(rl), sx = Math.sin(rl);
      const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
      const rln = rotLonRef.current * Math.PI / 180, cy = Math.cos(rln), sy = Math.sin(rln);
      const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
      return { sx: CX + x2 * R, sy: CY - y1 * R, vis: z2 > 0, depth: z2 };
    };

    const draw = () => {
      const isDark = themeRef.current === "dark";
      const C = isDark ? {
        sphere: "rgba(0,245,255,0.10)",
        ocean: "rgba(0,245,255,0.24)",
        land: (depth) => `rgba(0,245,255,${0.50 + depth * 0.50})`,
        rim: "rgba(0,245,255,0.55)",
        atmIn: "rgba(122,0,255,0.25)",
        atmOut: "rgba(0,245,255,0)",
      } : {
        // Light mode — bold, high-contrast navy + gold accents
        sphere: "rgba(11,45,91,0.22)",
        ocean: "rgba(11,45,91,0.48)",
        land: (depth) => `rgba(11,45,91,${0.78 + depth * 0.22})`,
        rim: "rgba(11,45,91,0.70)",
        atmIn: "rgba(232,168,58,0.35)",
        atmOut: "rgba(232,168,58,0)",
      };

      ctx.clearRect(0, 0, W, H);

      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fillStyle = C.sphere; ctx.fill();

      const dotScale = isDark ? 1 : 1.6;
      ctx.fillStyle = C.ocean;
      for (const [lon, lat] of oceanDots) {
        const p = project(lon, lat); if (!p.vis) continue;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 0.7 * DPR * dotScale, 0, Math.PI * 2); ctx.fill();
      }
      for (const [lon, lat] of landDots) {
        const p = project(lon, lat); if (!p.vis) continue;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 1.15 * DPR * dotScale, 0, Math.PI * 2);
        ctx.fillStyle = C.land(p.depth); ctx.fill();
      }

      // ── Listing markers ──────────────────────────────────────────
      const lm = listingsRef.current;
      const projected = [];
      lm.forEach((listing, i) => {
        const coords = listingToCoords(listing, i, lm.length);
        const p = project(coords.lon, coords.lat);
        projected.push({ ...p, listing });
        if (!p.vis) return;

        const score = listing.ati_score;
        const color = atiColor(score, isDark);
        const pulse = 0.5 + 0.5 * Math.sin(fr * 0.06 + i * 1.3);
        const isActive = (i === hlIdx % Math.max(lm.length, 1));

        if (isActive) {
          // Pulsing rings for active listing
          for (let ring = 3; ring >= 0; ring--) {
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, (8 + ring * 5 + pulse * 4) * DPR, 0, Math.PI * 2);
            const alpha = (0.10 + pulse * 0.10) * (4 - ring) / 4;
            ctx.strokeStyle = color + Math.round(alpha * 255).toString(16).padStart(2, "0");
            ctx.lineWidth = DPR * 1.2; ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(p.sx, p.sy, 4.2 * DPR, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 6 * DPR; ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          // Static dot with glow
          ctx.beginPath(); ctx.arc(p.sx, p.sy, 2.8 * DPR, 0, Math.PI * 2);
          ctx.fillStyle = color + "cc";
          ctx.shadowColor = color;
          ctx.shadowBlur = 5 * DPR;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Fallback: default markers if no listings
      if (lm.length === 0) {
        const dm = DEFAULT_MARKERS;
        const hi = dm[hlIdx % dm.length];
        const hp = project(hi.lon, hi.lat);
        if (hp.vis) {
          const pulse = 0.5 + 0.5 * Math.sin(fr * 0.07);
          const color = isDark ? "#00f5ff" : "#E8A83A";
          const glowColor = isDark ? "rgba(0,245,255," : "rgba(232,168,58,";
          for (let ring = 4; ring >= 0; ring--) {
            ctx.beginPath(); ctx.arc(hp.sx, hp.sy, (8 + ring * 5 + pulse * 5) * DPR, 0, Math.PI * 2);
            const alpha = (0.09 + pulse * 0.08) * (5 - ring) / 5;
            ctx.strokeStyle = glowColor + alpha.toFixed(2) + ")";
            ctx.lineWidth = DPR * 1.2; ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(hp.sx, hp.sy, 3.8 * DPR, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.fill();
          ctx.shadowColor = color;
          ctx.shadowBlur = 8 * DPR; ctx.fill();
          ctx.shadowBlur = 0;
        }
        dm.forEach((m, i) => {
          if (i === hlIdx % dm.length) return;
          const p = project(m.lon, m.lat); if (!p.vis) return;
          ctx.beginPath(); ctx.arc(p.sx, p.sy, 2.4 * DPR, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? "rgba(0,245,255,0.70)" : "rgba(11,45,91,0.80)";
          ctx.shadowColor = isDark ? "rgba(0,245,255,0.25)" : "rgba(11,45,91,0.35)";
          ctx.shadowBlur = 3 * DPR; ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // Store projected positions for hit-testing
      projectedRef.current = projected;

      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = C.rim; ctx.lineWidth = 1 * DPR; ctx.stroke();

      const atm = ctx.createRadialGradient(CX, CY, R * 0.95, CX, CY, R * 1.1);
      atm.addColorStop(0, C.atmIn); atm.addColorStop(1, C.atmOut);
      ctx.beginPath(); ctx.arc(CX, CY, R * 1.1, 0, Math.PI * 2); ctx.fillStyle = atm; ctx.fill();
    };

    const ci = setInterval(() => {
      hlIdx = (hlIdx + 1) % Math.max(listingsRef.current.length || DEFAULT_MARKERS.length, 1);
    }, 2800);

    const loop = () => {
      fr++;
      if (!pausedRef.current) rotLonRef.current += 0.08;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(ci);
      ro.disconnect();
    };
  }, []);

  const handlePopupClose = () => {
    setPopup(null);
    pausedRef.current = false;
  };

  const handlePopupOpen = (listingId) => {
    window.location.href = `/ati-passport/${listingId}`;
  };

  return (
    <div className={`relative ${className}`} style={{ pointerEvents: "auto" }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        aria-label="Interactive aircraft map"
        style={{ display: "block", width: "100%", height: "100%" }}
      />
      {popup && (
        <ListingPopup
          listing={popup.listing}
          pos={{ x: popup.x, y: popup.y }}
          onClose={handlePopupClose}
          onOpen={handlePopupOpen}
        />
      )}
    </div>
  );
}