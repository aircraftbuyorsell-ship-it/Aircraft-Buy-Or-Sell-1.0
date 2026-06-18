import { useRef, useEffect } from "react";

function geo2xyz(lat, lon) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

function project(x, y, z, rotY, cx, cy, R) {
  const cosRY = Math.cos(rotY), sinRY = Math.sin(rotY);
  const rx = x * cosRY + z * sinRY;
  const ry = y;
  const rz = -x * sinRY + z * cosRY;
  const fov = 3.2 / (3.2 + rz);
  return { px: cx + rx * R * fov, py: cy - ry * R * fov, fov, visible: rz < 0.95 };
}

function arcPath(ctx, value, isLat, rotY, cx, cy, R, steps = 30) {
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= steps; i++) {
    const deg = (i / steps) * 360;
    const lat = isLat ? value : 90 - deg;
    const lon = isLat ? deg - 180 : value;
    const p = geo2xyz(lat, lon);
    const { px, py, visible } = project(p.x, p.y, p.z, rotY, cx, cy, R);
    if (visible) {
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    } else {
      started = false;
    }
  }
}

const CITY_PINS = [
  { name: "NYC", lat: 40.7, lon: -74 },
  { name: "London", lat: 51.5, lon: -0.1 },
  { name: "Frankfurt", lat: 50.1, lon: 8.7 },
  { name: "Tokyo", lat: 35.7, lon: 139.7 },
  { name: "LA", lat: 34.0, lon: -118.2 },
  { name: "Sydney", lat: -33.9, lon: 151.2 },
  { name: "Singapore", lat: 1.4, lon: 103.8 },
  { name: "Moscow", lat: 55.8, lon: 37.6 },
];

export default function MiniGlobe({ size = 48, speed = 0.6, label, color = "#00c2cb", inline = false }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const rotYRef = useRef(-Math.PI / 2);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
    };
    resize();

    const drawGlobe = () => {
      const w = canvas.width, h = canvas.height;
      if (w === 0 || h === 0) return;
      const cx = w / 2, cy = h / 2;
      const R = Math.min(cx, cy) * 0.78;
      const rotY = rotYRef.current;

      ctx.clearRect(0, 0, w, h);

      // 1. Sphere fill
      const sphereGrad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.3, R * 0.04, cx, cy, R);
      sphereGrad.addColorStop(0, "#4a8fcc");
      sphereGrad.addColorStop(0.45, "#1a3a5c");
      sphereGrad.addColorStop(1, "#040c18");
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // 2. Atmosphere glow
      const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.15);
      atmoGrad.addColorStop(0, color + "30");
      atmoGrad.addColorStop(1, "transparent");
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.3, 0, Math.PI * 2);
      ctx.clip();

      // Latitude rings
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.4;
      for (const lat of [-60, 0, 60]) {
        arcPath(ctx, lat, true, rotY, cx, cy, R, 30);
        ctx.stroke();
      }

      // Longitude lines every 45°
      for (let lon = 0; lon < 360; lon += 45) {
        arcPath(ctx, lon, false, rotY, cx, cy, R, 30);
        ctx.stroke();
      }

      // City pin dots
      for (const city of CITY_PINS) {
        const p = geo2xyz(city.lat, city.lon);
        const { px, py, visible } = project(p.x, p.y, p.z, rotY, cx, cy, R);
        if (!visible) continue;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, R * 0.045, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Edge shadow
      const edgeGrad = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R);
      edgeGrad.addColorStop(0, "transparent");
      edgeGrad.addColorStop(1, "rgba(0,0,0,0.50)");
      ctx.fillStyle = edgeGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Specular
      const specGrad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, 0, cx, cy, R * 0.45);
      specGrad.addColorStop(0, "rgba(255,255,255,0.07)");
      specGrad.addColorStop(1, "transparent");
      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = (time) => {
      const delta = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;
      rotYRef.current += speed * 2 * Math.PI * delta;
      drawGlobe();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [size, speed, color]);

  return (
    <div style={{ display: inline ? "inline-flex" : "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: "50%",
          filter: `drop-shadow(0 0 12px ${color}40)`,
          pointerEvents: "none",
        }}
      />
      {label && (
        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", textAlign: "center" }}>
          {label}
        </span>
      )}
    </div>
  );
}

export function GlobePageLoader({ label = "Loading\u2026", size = 72, color = "#00c2cb", overlay = false }) {
  const containerStyle = overlay
    ? { position: "absolute", inset: 0, background: "rgba(5,14,28,0.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 50 }
    : { position: "relative", minHeight: 200 };

  return (
    <div style={{ ...containerStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <MiniGlobe size={size} color={color} inline />
      <p style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.45)" }}>
        {label}
      </p>
    </div>
  );
}