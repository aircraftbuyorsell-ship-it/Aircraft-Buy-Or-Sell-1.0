import { useEffect, useRef } from "react";

// Simplified continent polygons (approx outlines) — sourced from the HTML mockup
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

const MARKERS = [
  { name: "United States", lat: 38, lon: -97 },
  { name: "Germany", lat: 51, lon: 10 },
  { name: "United Kingdom", lat: 54, lon: -2 },
  { name: "Australia", lat: -25, lon: 133 },
  { name: "France", lat: 46, lon: 2 },
  { name: "Brazil", lat: -15, lon: -50 },
  { name: "Canada", lat: 56, lon: -96 },
  { name: "South Africa", lat: -29, lon: 25 },
  { name: "UAE", lat: 24, lon: 54 },
  { name: "Czech Republic", lat: 50, lon: 15 },
  { name: "Italy", lat: 42, lon: 12 },
  { name: "India", lat: 20, lon: 78 },
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

// Precompute dot grids once (module scope)
const STEP = 2.8;
const landDots = [];
const oceanDots = [];
for (let lat = -90; lat <= 90; lat += STEP) {
  for (let lon = -180; lon <= 180; lon += STEP) {
    if (isLand(lon, lat)) landDots.push([lon, lat]);
    else if ((Math.round(lat / STEP) + Math.round(lon / STEP)) % 4 === 0) oceanDots.push([lon, lat]);
  }
}

/**
 * Rotating globe canvas — Navy/Amber tinted to match ABOS theme.
 * Renders inside its parent (absolute inset-0). Parent should be `relative`.
 */
export default function RotatingGlobe({ className = "" }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const parent = cv.parentElement;

    let W, H, R, CX, CY, DPR;
    let rotLon = 10, rotLat = -18;
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
      const rl = rotLat * Math.PI / 180, cx = Math.cos(rl), sx = Math.sin(rl);
      const y1 = y * cx - z * sx, z1 = y * sx + z * cx;
      const rln = rotLon * Math.PI / 180, cy = Math.cos(rln), sy = Math.sin(rln);
      const x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
      return { sx: CX + x2 * R, sy: CY - y1 * R, vis: z2 > 0, depth: z2 };
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Sphere base — subtle navy tint
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(11,45,91,0.06)"; ctx.fill();

      // Ocean dots — muted navy
      ctx.fillStyle = "rgba(11,45,91,0.12)";
      for (const [lon, lat] of oceanDots) {
        const p = project(lon, lat); if (!p.vis) continue;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 0.7 * DPR, 0, Math.PI * 2); ctx.fill();
      }

      // Land dots — Navy
      for (const [lon, lat] of landDots) {
        const p = project(lon, lat); if (!p.vis) continue;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 1.15 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(11,45,91,${0.28 + p.depth * 0.5})`; ctx.fill();
      }

      // Active marker — Amber
      const hm = MARKERS[hlIdx % MARKERS.length];
      const hp = project(hm.lon, hm.lat);
      if (hp.vis) {
        const pulse = 0.5 + 0.5 * Math.sin(fr * 0.07);
        for (let ring = 3; ring >= 0; ring--) {
          ctx.beginPath();
          ctx.arc(hp.sx, hp.sy, (8 + ring * 4 + pulse * 4) * DPR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(232,168,58,${(0.06 + pulse * 0.06) * (4 - ring) / 4})`;
          ctx.lineWidth = DPR; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(hp.sx, hp.sy, 3.2 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = "#E8A83A"; ctx.fill();
      }

      // Market dots — Navy blue
      MARKERS.forEach((m, i) => {
        if (i === hlIdx % MARKERS.length) return;
        const p = project(m.lon, m.lat); if (!p.vis) return;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 2 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(11,45,91,0.5)"; ctx.fill();
      });

      // Rim
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(11,45,91,0.18)"; ctx.lineWidth = 1 * DPR; ctx.stroke();

      // Amber atmosphere
      const atm = ctx.createRadialGradient(CX, CY, R * 0.95, CX, CY, R * 1.1);
      atm.addColorStop(0, "rgba(232,168,58,0.09)");
      atm.addColorStop(1, "rgba(232,168,58,0)");
      ctx.beginPath(); ctx.arc(CX, CY, R * 1.1, 0, Math.PI * 2); ctx.fillStyle = atm; ctx.fill();
    };

    const ci = setInterval(() => { hlIdx = (hlIdx + 1) % MARKERS.length; }, 2800);
    const loop = () => {
      fr++; rotLon += 0.08; draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(ci);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}