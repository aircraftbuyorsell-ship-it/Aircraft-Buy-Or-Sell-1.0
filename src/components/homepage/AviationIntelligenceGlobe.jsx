import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * AviationIntelligenceGlobe — THE signature ABOS globe (Design Sprint 1, §11).
 * Canvas 2D, built from the ABOS dot grid: transparent, slow rotation,
 * animated great-circle aviation routes, live aircraft nodes (cachedTraffic),
 * gold verification pulses. Respects prefers-reduced-motion.
 */

const GOLD = "212,160,23";
const TEAL = "93,202,165";
const WHITE = "255,255,255";

const HUBS = [
  { lat: 40.7, lon: -74.0 },   // New York
  { lat: 34.05, lon: -118.24 },// Los Angeles
  { lat: 32.78, lon: -96.8 },  // Dallas
  { lat: 25.76, lon: -80.19 }, // Miami
  { lat: 51.5, lon: -0.12 },   // London
  { lat: 50.08, lon: 14.43 },  // Prague
  { lat: 47.37, lon: 8.54 },   // Zurich
  { lat: 25.2, lon: 55.27 },   // Dubai
  { lat: 1.35, lon: 103.82 },  // Singapore
  { lat: 35.68, lon: 139.69 }, // Tokyo
  { lat: -33.87, lon: 151.21 },// Sydney
  { lat: -23.55, lon: -46.63 },// São Paulo
];
const ROUTES = [
  [0, 4], [0, 3], [1, 9], [2, 0], [4, 5], [4, 7],
  [5, 6], [7, 8], [8, 9], [10, 8], [11, 3], [4, 11], [1, 2], [5, 7],
];
const TILT = -0.38;

function toVec(lat, lon) {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
}

function slerp(a, b, t) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.min(1, Math.max(-1, dot));
  const th = Math.acos(dot);
  if (th < 1e-4) return a;
  const s = Math.sin(th);
  const w1 = Math.sin((1 - t) * th) / s;
  const w2 = Math.sin(t * th) / s;
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2];
}

// Rotate around Y (spin) + X (tilt), then orthographic projection.
function project(v, rot, r, cx, cy) {
  const cosR = Math.cos(rot), sinR = Math.sin(rot);
  const x1 = v[0] * cosR + v[2] * sinR;
  const z1 = -v[0] * sinR + v[2] * cosR;
  const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
  const y2 = v[1] * cosT - z1 * sinT;
  const z2 = v[1] * sinT + z1 * cosT;
  return { x: cx + x1 * r, y: cy - y2 * r, z: z2 };
}

function extractPositions(aircraft) {
  const out = [];
  for (const a of aircraft || []) {
    const lat = a.lat ?? a.latitude;
    const lon = a.lon ?? a.lng ?? a.longitude;
    if (typeof lat === "number" && typeof lon === "number" && (lat !== 0 || lon !== 0)) {
      out.push(toVec(lat, lon));
      if (out.length >= 80) break;
    }
  }
  return out;
}

export default function AviationIntelligenceGlobe({ size = 560 }) {
  const canvasRef = useRef(null);
  const trafficRef = useRef([]);

  const { data: traffic } = useQuery({
    queryKey: ["globe-live-traffic"],
    queryFn: async () => {
      const res = await base44.functions.invoke("cachedTraffic", {});
      return res.data || res;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    trafficRef.current = extractPositions(traffic?.aircraft);
  }, [traffic]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, R = size * 0.40;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Pre-compute dot-grid sphere points + route paths
    const gridDots = [];
    for (let lat = -75; lat <= 75; lat += 12) {
      const step = 12 / Math.max(Math.cos((lat * Math.PI) / 180), 0.3);
      for (let lon = -180; lon < 180; lon += step) gridDots.push(toVec(lat, lon));
    }
    const hubVecs = HUBS.map((h) => toVec(h.lat, h.lon));
    const routePaths = ROUTES.map(([i, j]) => {
      const pts = [];
      for (let k = 0; k <= 48; k++) {
        const t = k / 48;
        const v = slerp(hubVecs[i], hubVecs[j], t);
        const lift = 1 + 0.14 * Math.sin(Math.PI * t); // arc altitude
        pts.push([v[0] * lift, v[1] * lift, v[2] * lift]);
      }
      return pts;
    });

    let raf;
    const t0 = performance.now();

    const draw = (now) => {
      const t = (now - t0) / 1000;
      const rot = reduced ? 0.6 : t * ((2 * Math.PI) / 120); // 0.5 rpm
      ctx.clearRect(0, 0, size, size);

      // Atmosphere glow + rim
      const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
      glow.addColorStop(0, `rgba(${GOLD},0.10)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(${GOLD},0.18)`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

      // Dot-grid sphere (ABOS watermark language)
      for (const v of gridDots) {
        const p = project(v, rot, R, cx, cy);
        if (p.z > 0) {
          ctx.fillStyle = `rgba(${WHITE},${0.06 + p.z * 0.22})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${WHITE},0.03)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Aviation routes — faint arcs + comet aircraft nodes
      routePaths.forEach((pts, ri) => {
        ctx.strokeStyle = `rgba(${GOLD},0.16)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        let pen = false;
        for (const v of pts) {
          const p = project(v, rot, R, cx, cy);
          if (p.z > 0.02) {
            if (!pen) { ctx.moveTo(p.x, p.y); pen = true; }
            else ctx.lineTo(p.x, p.y);
          } else pen = false;
        }
        ctx.stroke();

        // Comet: aircraft traveling the route
        const prog = reduced ? (ri / ROUTES.length) : ((t * 0.055 + ri * 0.17) % 1);
        const idx = Math.floor(prog * 48);
        const head = project(pts[idx], rot, R, cx, cy);
        if (head.z > 0.02) {
          for (let k = 1; k <= 5; k++) {
            const trail = pts[Math.max(idx - k * 2, 0)];
            const tp = project(trail, rot, R, cx, cy);
            if (tp.z > 0.02) {
              ctx.fillStyle = `rgba(${GOLD},${0.30 - k * 0.05})`;
              ctx.beginPath(); ctx.arc(tp.x, tp.y, 1.3, 0, Math.PI * 2); ctx.fill();
            }
          }
          ctx.fillStyle = `rgba(${GOLD},0.95)`;
          ctx.shadowColor = `rgba(${GOLD},0.8)`;
          ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(head.x, head.y, 1.9, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Live aircraft nodes (real positions from cachedTraffic)
      for (const v of trafficRef.current) {
        const p = project(v, rot, R, cx, cy);
        if (p.z > 0.02) {
          ctx.fillStyle = `rgba(${TEAL},${0.35 + p.z * 0.45})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Hub markers + verification pulses
      const pulsePeriod = 2.8;
      const pulseHub = Math.floor(t / pulsePeriod) % HUBS.length;
      const pulseT = (t % pulsePeriod) / pulsePeriod;
      hubVecs.forEach((v, hi) => {
        const p = project(v, rot, R, cx, cy);
        if (p.z <= 0.02) return;
        ctx.fillStyle = `rgba(${GOLD},${0.5 + p.z * 0.4})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
        if (!reduced && hi === pulseHub) {
          ctx.strokeStyle = `rgba(${GOLD},${0.55 * (1 - pulseT)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(p.x, p.y, 3 + pulseT * 16, 0, Math.PI * 2); ctx.stroke();
        }
      });

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="ABOS Aviation Intelligence Globe — live aviation routes and verification activity"
      style={{ width: "100%", maxWidth: size, height: "auto", aspectRatio: "1 / 1", display: "block" }}
    />
  );
}