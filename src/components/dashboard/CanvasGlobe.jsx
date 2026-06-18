import { useEffect, useRef, useState, useCallback } from "react";

const GLOBE_R = 0.92;
const ATMOSPHERE_WIDTH = 0.04;
const OPENSKY_URL = "https://opensky-network.org/api/states/all?lamin=25&lomin=-130&lamax=70&lomax=40";

function latLonToXY(lat, lon, cx, cy, scale) {
  const x = cx + (lon / 180) * scale;
  const y = cy - (lat / 90) * scale * 0.55;
  return [x, y];
}

export default function CanvasGlobe({ listings = [], onSelectListing }) {
  const canvasRef = useRef(null);
  const [trafficCount, setTrafficCount] = useState(0);
  const [liveCount, setLiveCount] = useState(0);
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
      setLiveCount(states.length);
    } catch { /* offline is ok */ }
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
      const W = cv.width = cv.offsetWidth * (window.devicePixelRatio || 1);
      const H = cv.height = cv.offsetHeight * (window.devicePixelRatio || 1);
      const cx = W / 2, cy = H / 2;
      const scale = W * 0.44;

      ctx.clearRect(0, 0, W, H);

      // Dark navy sphere gradient
      const grad = ctx.createRadialGradient(cx - scale * 0.2, cy - scale * 0.3, scale * 0.1, cx, cy, scale);
      grad.addColorStop(0, "#1e3a5f");
      grad.addColorStop(0.5, "#0f2a44");
      grad.addColorStop(1, "#060f1e");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * GLOBE_R, 0, Math.PI * 2);
      ctx.fill();

      // Atmosphere glow
      ctx.strokeStyle = "rgba(0, 194, 203, 0.25)";
      ctx.lineWidth = scale * ATMOSPHERE_WIDTH * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * (GLOBE_R + ATMOSPHERE_WIDTH), 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 194, 203, 0.08)";
      ctx.lineWidth = scale * ATMOSPHERE_WIDTH * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * (GLOBE_R + ATMOSPHERE_WIDTH * 1.5), 0, Math.PI * 2);
      ctx.stroke();

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lon = -180; lon <= 180; lon += 2) {
          const [x, y] = latLonToXY(lat, lon, cx, cy, scale);
          if (lon === -180) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let lon = -150; lon <= 150; lon += 30) {
        ctx.beginPath();
        for (let lat = -80; lat <= 80; lat += 2) {
          const [x, y] = latLonToXY(lat, lon, cx, cy, scale);
          if (lat === -80) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Apply rotation offset for traffic/latlon mapping
      const rotOffset = rotationRef.current;

      // Live traffic dots (cyan / yellow for on-ground)
      for (const state of trafficCache.current) {
        const lon = (state[5] || 0) + rotOffset * (180 / Math.PI);
        const lat = state[6] || 0;
        const onGround = state[8] === true;
        const [x, y] = latLonToXY(lat, lon, cx, cy, scale);
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > (scale * GLOBE_R) * (scale * GLOBE_R)) continue;

        ctx.fillStyle = onGround ? "rgba(241, 180, 33, 0.85)" : "rgba(0, 220, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Listing markers (gold diamonds)
      for (const l of listingsCache.current) {
        const lon = (l.lon || 0) + rotOffset * (180 / Math.PI);
        const lat = l.lat || 0;
        const [x, y] = latLonToXY(lat, lon, cx, cy, scale);
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > (scale * GLOBE_R) * (scale * GLOBE_R)) continue;

        const score = l.ati_score || 0;
        const color = score >= 90 ? "#00f5ff" : score >= 72 ? "#a855f7" : score >= 54 ? "#D4A017" : "#f48120";
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.5);
        ctx.lineTo(x + 2.5, y);
        ctx.lineTo(x, y + 3.5);
        ctx.lineTo(x - 2.5, y);
        ctx.closePath();
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [trafficCount, liveCount, maxDots, listings]);

  // Auto rotate (unless paused or dragging)
  useEffect(() => {
    let timer;
    const rotate = () => {
      if (!isPaused && !dragRef.current) {
        rotationRef.current += 0.002;
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

      {/* Traffic limit slider */}
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