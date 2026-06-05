import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Simplified continent polygons
const POLYGONS = [
  [[[-168,72],[-140,71],[-125,50],[-124,49],[-124,46],[-122,38],[-117,32],[-110,24],[-105,20],[-99,16],[-91,16],[-88,16],[-84,10],[-79,9],[-77,8],[-63,11],[-60,11],[-53,47],[-56,47],[-64,44],[-67,44],[-70,43],[-70,41],[-74,40],[-76,35],[-80,32],[-81,30],[-81,29],[-80,25],[-80,24],[-97,26],[-97,30],[-93,30],[-90,29],[-89,29],[-93,28],[-97,26],[-100,25],[-107,24],[-110,26],[-117,32],[-124,49],[-141,60],[-168,72]]],
  [[[-72,12],[-63,10],[-52,5],[-50,2],[-50,0],[-50,-2],[-36,-8],[-35,-10],[-37,-12],[-39,-16],[-40,-20],[-41,-22],[-43,-23],[-47,-25],[-48,-27],[-50,-30],[-52,-33],[-52,-34],[-57,-35],[-57,-36],[-58,-38],[-60,-38],[-62,-40],[-63,-42],[-65,-42],[-66,-44],[-67,-46],[-66,-48],[-68,-50],[-68,-52],[-65,-54],[-67,-55],[-65,-55],[-70,-53],[-75,-50],[-75,-44],[-73,-42],[-72,-38],[-72,-36],[-72,-32],[-72,-30],[-71,-28],[-70,-24],[-70,-22],[-70,-18],[-70,-16],[-75,-14],[-76,-12],[-78,-10],[-78,-6],[-78,-4],[-80,-2],[-80,0],[-80,2],[-78,5],[-77,8],[-76,10],[-73,12],[-72,12]]],
  [[[26,71],[28,68],[20,64],[16,60],[12,58],[8,58],[4,57],[4,56],[8,54],[10,54],[14,54],[10,54],[8,54],[6,53],[4,52],[2,51],[0,51],[-2,49],[-5,48],[-2,48],[-2,47],[-2,46],[0,44],[3,43],[8,44],[8,46],[14,44],[18,43],[18,42],[20,42],[22,42],[24,43],[26,44],[28,45],[30,46],[30,45],[28,47],[22,47],[18,48],[18,50],[22,48],[24,48],[26,50],[26,52],[20,52],[14,52],[8,52],[6,51],[4,52],[6,53],[8,54],[14,54],[18,55],[18,56],[12,58],[8,58],[4,57],[4,58],[6,58],[5,62],[14,65],[20,68],[28,68],[26,71]]],
  [[[-6,50],[-4,52],[-6,54],[-4,58],[0,58],[0,56],[0,53],[2,51],[2,50],[-2,50],[-6,50]]],
  [[[10,37],[12,35],[32,30],[34,28],[34,24],[38,22],[42,18],[42,14],[42,10],[40,8],[38,4],[42,2],[42,0],[40,-2],[40,-4],[38,-6],[36,-8],[38,-10],[40,-14],[36,-18],[37,-22],[33,-26],[33,-30],[28,-32],[26,-34],[20,-34],[18,-32],[16,-30],[16,-26],[14,-22],[14,-18],[12,-14],[12,-10],[10,-6],[10,-2],[8,4],[6,4],[-2,6],[-4,8],[-4,10],[-2,8],[0,10],[0,12],[2,14],[2,16],[4,14],[4,16],[-4,16],[-16,16],[-16,14],[-16,8],[-14,4],[-10,4],[-10,0],[-6,-2],[-6,-4],[-4,-4],[-2,-4],[0,-6],[0,-4],[-4,-4],[-4,-2],[0,2],[4,4],[4,6],[8,6],[6,4],[4,2],[6,-2],[8,-4],[10,-2],[12,0],[14,2],[14,4],[16,4],[14,2],[14,-4],[16,-4],[8,-16],[4,-10],[0,-6],[0,-4],[2,-4],[4,-4],[6,-4],[8,-4],[10,-2],[12,0],[14,2],[18,4],[22,4],[26,4],[30,2],[32,2],[34,4],[36,6],[37,10],[10,37]]],
  [[[30,70],[50,70],[70,70],[90,68],[100,65],[132,65],[140,60],[138,56],[142,50],[142,48],[136,44],[130,42],[130,38],[136,34],[122,30],[120,26],[114,22],[110,20],[108,16],[106,12],[104,8],[104,2],[104,-2],[106,-4],[108,-6],[110,-8],[116,-8],[114,-6],[110,-4],[108,-2],[104,0],[100,4],[100,6],[98,8],[100,12],[98,16],[96,18],[92,22],[92,24],[88,24],[88,22],[86,18],[84,16],[82,14],[80,10],[78,10],[74,14],[72,16],[72,18],[70,20],[68,20],[68,22],[68,24],[68,26],[66,28],[62,28],[60,26],[58,24],[56,22],[54,26],[52,28],[50,28],[48,30],[44,34],[36,34],[36,36],[36,38],[38,40],[40,40],[42,42],[42,44],[44,44],[46,46],[48,48],[50,50],[52,52],[52,54],[50,52],[48,46],[44,42],[42,42],[40,40],[38,38],[36,36],[34,36],[32,44],[30,48],[48,30],[52,28],[56,22],[54,26],[52,28],[50,32],[50,36],[52,38],[54,50],[56,52],[60,54],[64,56],[68,60],[70,60],[70,30]]],
  [[[128,-14],[130,-14],[134,-14],[136,-14],[138,-14],[138,-16],[140,-16],[141,-17],[140,-20],[138,-22],[138,-24],[140,-26],[142,-26],[144,-26],[148,-26],[152,-27],[154,-28],[153,-30],[152,-32],[151,-34],[150,-36],[148,-38],[146,-38],[142,-38],[140,-37],[138,-36],[136,-35],[136,-34],[134,-34],[132,-34],[130,-34],[128,-32],[116,-30],[114,-28],[114,-26],[114,-24],[114,-22],[118,-20],[122,-18],[124,-16],[126,-15],[128,-14]]],
  [[[-180,-68],[-120,-68],[-60,-68],[0,-68],[60,-68],[120,-68],[180,-68],[180,-90],[-180,-90],[-180,-68]]],
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

const STEP = 3.2;
const landDots = [];
const oceanDots = [];
for (let lat = -90; lat <= 90; lat += STEP) {
  for (let lon = -180; lon <= 180; lon += STEP) {
    if (isLand(lon, lat)) landDots.push([lon, lat]);
    else if ((Math.round(lat / STEP) + Math.round(lon / STEP)) % 5 === 0) oceanDots.push([lon, lat]);
  }
}

// Map US state codes → approximate lat/lon centers
const STATE_COORDS = {
  AL:[32.8,-86.8],AK:[64,-153],AZ:[34.3,-111.1],AR:[34.8,-92.2],CA:[36.8,-119.4],
  CO:[39,-105.5],CT:[41.6,-72.7],DE:[39,-75.5],FL:[28.7,-82.4],GA:[32.7,-83.2],
  HI:[21.1,-157.5],ID:[44.4,-114.6],IL:[40,-89.2],IN:[40,-86.3],IA:[42,-93.5],
  KS:[38.5,-98.4],KY:[37.5,-85],LA:[31,-91.8],ME:[45.2,-69],MD:[39,-76.5],
  MA:[42.3,-71.5],MI:[44.3,-85.4],MN:[46.4,-93.1],MS:[32.7,-89.7],MO:[38.5,-92.5],
  MT:[47,-110],NE:[41.5,-99.9],NV:[39.5,-116.9],NH:[43.7,-71.6],NJ:[40,-74.5],
  NM:[34.3,-106.2],NY:[43,-75.5],NC:[35.5,-79.8],ND:[47.5,-100.5],OH:[40.4,-82.7],
  OK:[35.6,-96.9],OR:[44,-120.5],PA:[40.8,-77.8],RI:[41.7,-71.5],SC:[33.8,-81],
  SD:[44.4,-100.2],TN:[35.9,-86.7],TX:[31.1,-97.6],UT:[39.4,-111.1],VT:[44,-72.7],
  VA:[37.5,-78.5],WA:[47.4,-120.5],WV:[38.6,-80.6],WI:[44.5,-89.5],WY:[43,-107.6],
};

// Generate pseudo-coordinates from aircraft data
function aircraftToCoords(listing) {
  // Use US state if available
  if (listing.state && STATE_COORDS[listing.state]) return STATE_COORDS[listing.state];
  // Fallback: hash registration to a position in a known country spread
  const reg = listing.registration || listing.n_number || "";
  const hash = [...reg].reduce((a, c) => a + c.charCodeAt(0), 0);
  const lon = -130 + (hash % 150) * 1.2;
  const lat = 25 + (hash % 45);
  return [lat, lon];
}

export default function MarketplaceGlobe({ listings = [] }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Also try to fetch FAA aircraft for richer data
  const { data: faaAircraft = [] } = useQuery({
    queryKey: ["faa-aircraft-sample"],
    queryFn: () => base44.entities.FAAAircraft.list("-created_date", 120),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const parent = cv.parentElement;

    let W, H, R, CX, CY, DPR;
    let rotLon = 10, rotLat = -15;
    let fr = 0, hlIdx = 0;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      W = Math.round(rect.width * DPR);
      H = Math.round(rect.height * DPR);
      cv.width = W; cv.height = H;
      cv.style.width = rect.width + "px";
      cv.style.height = rect.height + "px";
      R = Math.min(W, H) * 0.44;
      CX = W * 0.60;
      CY = H * 0.50;
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

    // Build aircraft marker positions from FAA data + listings
    const aircraftMarkers = [];
    for (const a of faaAircraft) {
      if (a.state && STATE_COORDS[a.state]) {
        const [lat, lon] = STATE_COORDS[a.state];
        // Add slight jitter per aircraft
        const jitter = (a.n_number || "").charCodeAt(0) || 0;
        aircraftMarkers.push({
          lon: lon + (jitter % 7) - 3,
          lat: lat + ((jitter >> 2) % 5) - 2,
          label: `N${a.n_number}`,
        });
      }
    }
    // Add listing-based markers as fallback
    for (const l of listings) {
      const reg = l.registration || "";
      const hash = [...reg].reduce((a, c) => a + c.charCodeAt(0), 0);
      if (hash % 3 === 0) {
        aircraftMarkers.push({ lon: -130 + (hash % 150) * 1.2, lat: 25 + (hash % 45), label: reg });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Sphere glow
      const glow = ctx.createRadialGradient(CX, CY, R * 0.3, CX, CY, R * 1.2);
      glow.addColorStop(0, "rgba(0,245,255,0.04)");
      glow.addColorStop(0.7, "rgba(122,0,255,0.03)");
      glow.addColorStop(1, "rgba(0,245,255,0)");
      ctx.beginPath(); ctx.arc(CX, CY, R * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = glow; ctx.fill();

      // Sphere base
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,245,255,0.025)"; ctx.fill();

      // Ocean dots
      ctx.fillStyle = "rgba(0,245,255,0.055)";
      for (const [lon, lat] of oceanDots) {
        const p = project(lon, lat); if (!p.vis) continue;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 0.65 * DPR, 0, Math.PI * 2); ctx.fill();
      }

      // Land dots
      for (const [lon, lat] of landDots) {
        const p = project(lon, lat); if (!p.vis) continue;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 1.1 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,255,${0.18 + p.depth * 0.48})`; ctx.fill();
      }

      // Aircraft markers
      for (let i = 0; i < aircraftMarkers.length; i++) {
        const m = aircraftMarkers[i];
        const p = project(m.lon, m.lat);
        if (!p.vis) continue;
        const isActive = i === hlIdx % aircraftMarkers.length;
        if (isActive) {
          const pulse = 0.5 + 0.5 * Math.sin(fr * 0.08);
          for (let ring = 2; ring >= 0; ring--) {
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, (6 + ring * 4 + pulse * 3) * DPR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(232,168,58,${(0.08 + pulse * 0.08) * (3 - ring) / 3})`;
            ctx.lineWidth = DPR; ctx.stroke();
          }
          ctx.beginPath(); ctx.arc(p.sx, p.sy, 2.8 * DPR, 0, Math.PI * 2);
          ctx.fillStyle = "#E8A83A"; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(p.sx, p.sy, 1.6 * DPR, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,245,255,${0.40 + p.depth * 0.45})`; ctx.fill();
        }
      }

      // Rim glow
      ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0,245,255,0.16)"; ctx.lineWidth = 1 * DPR; ctx.stroke();

      // Atmosphere
      const atm = ctx.createRadialGradient(CX, CY, R * 0.94, CX, CY, R * 1.09);
      atm.addColorStop(0, "rgba(122,0,255,0.10)");
      atm.addColorStop(1, "rgba(0,245,255,0)");
      ctx.beginPath(); ctx.arc(CX, CY, R * 1.09, 0, Math.PI * 2); ctx.fillStyle = atm; ctx.fill();
    };

    const ciMarker = setInterval(() => {
      if (aircraftMarkers.length > 0) hlIdx = (hlIdx + 1) % aircraftMarkers.length;
    }, 2200);

    const loop = () => {
      fr++; rotLon += 0.06; draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(ciMarker);
      ro.disconnect();
    };
  }, [faaAircraft, listings]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
      aria-hidden="true"
    />
  );
}