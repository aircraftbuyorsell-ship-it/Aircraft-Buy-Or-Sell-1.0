import { useEffect, useRef, useState, useCallback } from "react";

const GLOBE_R = 0.92;
const OPENSKY_URL = "https://opensky-network.org/api/states/all?lamin=25&lomin=-130&lamax=70&lomax=40";

// Simplified continent outlines as lat/lon polygon paths (major landmasses)
const CONTINENTS = [
  // North America
  [[70,-165],[68,-140],[60,-140],[55,-130],[48,-125],[42,-124],[35,-121],[30,-115],[25,-112],[21,-97],[16,-88],[18,-80],[25,-80],[30,-81],[35,-76],[40,-74],[44,-67],[47,-64],[49,-54],[52,-55],[57,-57],[62,-61],[66,-72],[70,-80],[70,-120],[68,-165]],
  // South America
  [[12,-72],[8,-77],[5,-77],[-2,-80],[-5,-81],[-10,-75],[-15,-73],[-23,-67],[-30,-58],[-35,-57],[-40,-63],[-47,-68],[-52,-70],[-54,-67],[-50,-58],[-42,-50],[-34,-48],[-28,-42],[-25,-35],[-23,-28],[-16,-30],[-8,-34],[-3,-40],[1,-50],[5,-52],[10,-61],[12,-72]],
  // Europe
  [[70,-25],[65,-15],[60,-5],[55,-4],[50,2],[45,2],[43,6],[43,9],[40,3],[38,-1],[36,-6],[37,-8],[35,-4],[35,5],[37,12],[40,14],[44,15],[46,17],[48,22],[54,20],[58,18],[60,18],[61,10],[65,5],[70,5],[70,-25]],
  // Africa
  [[37,10],[35,5],[33,10],[30,10],[25,15],[22,20],[15,25],[10,30],[5,33],[0,35],[-5,36],[-10,40],[-17,35],[-22,30],[-25,33],[-30,30],[-35,25],[-35,20],[-30,15],[-25,12],[-20,10],[-15,8],[-10,5],[-5,5],[0,3],[5,0],[10,-2],[15,-5],[20,-5],[25,-5],[30,-3],[35,0],[37,10]],
  // Asia
  [[70,5],[70,35],[65,45],[60,50],[55,55],[48,62],[42,63],[38,50],[35,43],[30,45],[25,48],[20,50],[15,50],[10,50],[5,40],[0,40],[-5,35],[-5,30],[0,28],[5,30],[10,28],[15,25],[20,20],[25,15],[30,12],[35,8],[40,10],[45,15],[50,15],[55,10],[60,5],[65,2],[70,5]],
  // Australia
  [[-12,130],[-15,125],[-20,118],[-25,114],[-30,115],[-33,120],[-35,125],[-35,135],[-33,142],[-30,148],[-26,152],[-21,150],[-16,145],[-14,140],[-12,135],[-12,130]],
  // Japan
  [[42,140],[40,141],[35,139],[33,136],[31,131],[34,130],[37,136],[40,139],[42,140]],
  // Greenland
  [[70,-52],[68,-48],[65,-42],[62,-44],[60,-46],[62,-52],[66,-56],[68,-54],[70,-52]],
  // Indonesia / SE Asia islands
  [[5,95],[-2,100],[-5,104],[-8,110],[-6,115],[-2,118],[2,120],[5,122],[5,118],[3,110],[5,105],[5,95]],
  // New Zealand
  [[-35,173],[-38,175],[-42,173],[-45,169],[-43,167],[-40,168],[-37,170],[-35,173]],
  // Madagascar
  [[-12,49],[-18,49],[-25,47],[-22,44],[-15,45],[-12,47],[-12,49]],
  // UK / Ireland
  [[55,-5],[55,-3],[52,-2],[50,-5],[50,-8],[52,-10],[55,-8],[55,-5]],
];

function latLonToXY(lat, lon, cx, cy, scale) {
  const radLat = (lat * Math.PI) / 180;
  const radLon = (lon * Math.PI) / 180;
  const r = scale * GLOBE_R;
  const x = cx + r * Math.cos(radLat) * Math.sin(radLon);
  const y = cy - r * Math.sin(radLat);
  return [x, y];
}

function isOnFrontFace(lat, lon, rotOffset) {
  const adjustedLon = ((lon + rotOffset * (180 / Math.PI) + 540) % 360) - 180;
  const radLat = (lat * Math.PI) / 180;
  const radLon = (adjustedLon * Math.PI) / 180;
  const normalX = Math.cos(radLat) * Math.cos(radLon);
  const normalY = Math.sin(radLat);
  const normalZ = Math.cos(radLat) * Math.sin(radLon);
  const viewX = 0, viewY = 0, viewZ = 1;
  const dotProduct = normalX * viewX + normalY * viewY + normalZ * viewZ;
  return dotProduct > -0.15;
}

export default function CanvasGlobe({ listings = [], onSelectListing }) {
  const canvasRef = useRef(null);
  const [trafficCount, setTrafficCount] = useState(0);
  const [maxDots, setMaxDots] = useState(150);
  const [isPaused, setIsPaused] = useState(false);
  const trafficCache = useRef([]);
  const listingsCache = useRef([]);
  const rotationRef = useRef(0);
  const animRef = useRef(null);
  const dragRef = useRef(false);
  const lastX = useRef(0);

  const fetchTraffic = useCallback(async () => {
    try {
      const res = await fetch(OPENSKY_URL);
      const data = await res.json();
      const states = (data?.states || []).slice(0, maxDots);
      trafficCache.current = states;
      setTrafficCount(states.length);
    } catch { /* offline ok */ }
  }, [maxDots]);

  useEffect(() => {
    listingsCache.current = listings.filter(l => l.lat != null && l.lon != null);
  }, [listings]);

  useEffect(() => {
    fetchTraffic();
    const iv = setInterval(fetchTraffic, 30000);
    return () => clearInterval(iv);
  }, [fetchTraffic]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = cv.width = cv.offsetWidth * dpr;
      const H = cv.height = cv.offsetHeight * dpr;
      const cx = W / 2, cy = H / 2;
      const scale = Math.min(W, H) * 0.42;

      ctx.clearRect(0, 0, W, H);

      // Ocean background — dark radial gradient
      const oceanGrad = ctx.createRadialGradient(cx - scale * 0.15, cy - scale * 0.2, scale * 0.05, cx, cy, scale * 1.05);
      oceanGrad.addColorStop(0, "#1a3355");
      oceanGrad.addColorStop(0.4, "#0f2440");
      oceanGrad.addColorStop(0.8, "#091525");
      oceanGrad.addColorStop(1, "#050c16");
      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * GLOBE_R, 0, Math.PI * 2);
      ctx.fill();

      const rotOffset = rotationRef.current;

      // Continent outlines
      ctx.lineWidth = 1.0 * dpr;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const polygon of CONTINENTS) {
        const visible = polygon.some(([lat, lon]) => isOnFrontFace(lat, lon, rotOffset));
        if (!visible) continue;

        ctx.strokeStyle = "rgba(255,255,255,0.10)";
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        ctx.beginPath();
        polygon.forEach(([lat, lon], i) => {
          const adjustedLon = lon + rotOffset * (180 / Math.PI);
          const [x, y] = latLonToXY(lat, adjustedLon, cx, cy, scale);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Grid lines (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lon = -180; lon <= 180; lon += 3) {
          const adjustedLon = lon + rotOffset * (180 / Math.PI);
          const [x, y] = latLonToXY(lat, adjustedLon, cx, cy, scale);
          if (lon === -180) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let lon = -150; lon <= 150; lon += 30) {
        ctx.beginPath();
        for (let lat = -80; lat <= 80; lat += 3) {
          const adjustedLon = lon + rotOffset * (180 / Math.PI);
          const [x, y] = latLonToXY(lat, adjustedLon, cx, cy, scale);
          if (lat === -80) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Atmosphere glow
      ctx.strokeStyle = "rgba(0, 194, 203, 0.18)";
      ctx.lineWidth = scale * 0.04;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * (GLOBE_R + 0.02), 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 194, 203, 0.06)";
      ctx.lineWidth = scale * 0.08;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * (GLOBE_R + 0.04), 0, Math.PI * 2);
      ctx.stroke();

      // Shadows on sphere edges for 3D depth
      const shadowGrad = ctx.createRadialGradient(cx - scale * 0.35, cy - scale * 0.35, scale * 0.4, cx, cy, scale * GLOBE_R);
      shadowGrad.addColorStop(0, "rgba(255,255,255,0.05)");
      shadowGrad.addColorStop(0.7, "transparent");
      shadowGrad.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * GLOBE_R, 0, Math.PI * 2);
      ctx.fill();

      // Live traffic dots
      for (const state of trafficCache.current) {
        const lon = (state[5] || 0) + rotOffset * (180 / Math.PI);
        const lat = state[6] || 0;
        if (!isOnFrontFace(lat, state[5] || 0, rotOffset)) continue;
        const [x, y] = latLonToXY(lat, lon, cx, cy, scale);
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > (scale * GLOBE_R) * (scale * GLOBE_R)) continue;

        const onGround = state[8] === true;
        ctx.fillStyle = onGround ? "rgba(241, 180, 33, 0.85)" : "rgba(0, 220, 255, 0.85)";
        ctx.beginPath();
        ctx.arc(x, y, 1.6 * dpr, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        if (!onGround) {
          ctx.fillStyle = "rgba(0, 220, 255, 0.15)";
          ctx.beginPath();
          ctx.arc(x, y, 3.2 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Listing markers
      for (const l of listingsCache.current) {
        const lon = (l.lon || 0) + rotOffset * (180 / Math.PI);
        const lat = l.lat || 0;
        if (!isOnFrontFace(lat, l.lon || 0, rotOffset)) continue;
        const [x, y] = latLonToXY(lat, lon, cx, cy, scale);
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > (scale * GLOBE_R) * (scale * GLOBE_R)) continue;

        const score = l.ati_score || 0;
        const color = score >= 90 ? "#00f5ff" : score >= 72 ? "#a855f7" : score >= 54 ? "#D4A017" : "#f48120";
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - 4 * dpr);
        ctx.lineTo(x + 3 * dpr, y);
        ctx.lineTo(x, y + 4 * dpr);
        ctx.lineTo(x - 3 * dpr, y);
        ctx.closePath();
        ctx.fill();
        // Glow
        ctx.fillStyle = color + "30";
        ctx.beginPath();
        ctx.arc(x, y, 5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [trafficCount, maxDots, listings]);

  // Auto rotate
  useEffect(() => {
    let timer;
    const rotate = () => {
      if (!isPaused && !dragRef.current) {
        rotationRef.current += 0.003;
      }
      timer = setTimeout(rotate, 16);
    };
    rotate();
    return () => clearTimeout(timer);
  }, [isPaused]);

  const onPointerDown = (e) => {
    dragRef.current = true;
    lastX.current = e.clientX;
    canvasRef.current?.classList.add("cursor-grabbing");
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    rotationRef.current += (e.clientX - lastX.current) * 0.005;
    lastX.current = e.clientX;
  };
  const onPointerUp = () => {
    dragRef.current = false;
    canvasRef.current?.classList.remove("cursor-grabbing");
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", cursor: dragRef.current ? "grabbing" : "grab" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 12, left: 12, display: "flex", gap: 16,
        padding: "8px 14px", borderRadius: 10,
        background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.1)",
        fontSize: 10, fontWeight: 600,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(0,220,255,0.8)" }} /> Live Traffic ({trafficCount})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)" }}>
          <span style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: "8px solid #D4A017" }} /> Listings ({listingsCache.current.length})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.6)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(241,180,33,0.85)" }} /> On Ground
        </span>
      </div>

      {/* Controls */}
      <div style={{
        position: "absolute", bottom: 12, right: 12, display: "flex", alignItems: "center", gap: 8,
        padding: "6px 12px", borderRadius: 10,
        background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.1)",
        fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)",
      }}>
        <span>Traffic: {maxDots}</span>
        <input type="range" min="50" max="300" step="50" value={maxDots}
          onChange={e => setMaxDots(parseInt(e.target.value))}
          style={{ width: 60, accentColor: "#00c2cb" }} />
        <button onClick={() => setIsPaused(p => !p)}
          style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer",
            fontSize: 9, fontWeight: 700, padding: "2px 8px",
          }}>
          {isPaused ? "▶" : "⏸"}
        </button>
      </div>
    </div>
  );
}