import { useRef, useEffect } from "react";

const PI = Math.PI;

function geo2xyz(lat, lon) {
  const phi = ((90 - lat) * PI) / 180;
  const theta = (lon * PI) / 180;
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
}

function project(x, y, z, rotY, cx, cy, R) {
  const cs = Math.cos(rotY);
  const sn = Math.sin(rotY);
  const rx = x * cs + z * sn;
  const ry = y;
  const rz = -x * sn + z * cs;
  const fov = 3.2 / (3.2 + rz);
  return { px: cx + rx * R * fov, py: cy - ry * R * fov, fov, visible: rz < 0.93 };
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

function drawGlobe(ctx, size, rotY, accentColor) {
  const R = size * 0.44;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // 1. Sphere
  const sphereGrad = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.04, cx, cy, R);
  sphereGrad.addColorStop(0, "#1e3a5f");
  sphereGrad.addColorStop(0.5, "#0f2a44");
  sphereGrad.addColorStop(1, "#060f1e");
  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, PI * 2);
  ctx.fill();

  // 2. Atmosphere glow
  const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.15);
  atmoGrad.addColorStop(0, "transparent");
  atmoGrad.addColorStop(0.5, `${accentColor}22`);
  atmoGrad.addColorStop(1, "transparent");
  ctx.fillStyle = atmoGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.15, 0, PI * 2);
  ctx.fill();

  // 3. Clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 0.3, 0, PI * 2);
  ctx.clip();

  // Grid lines (fewer steps)
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 0.4;
  const steps = 30;
  [-60, 0, 60].forEach((lat) => {
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= steps; i++) {
      const deg = (i / steps) * 360;
      const lon = deg - 180;
      const [x, y, z] = geo2xyz(lat, lon);
      const { px, py, visible } = project(x, y, z, rotY, cx, cy, R);
      if (visible) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      } else started = false;
    }
    ctx.stroke();
  });
  [0, 45, 90, 135, 180, -135, -90, -45].forEach((lon) => {
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= steps; i++) {
      const deg = (i / steps) * 360;
      const lat = 90 - (deg / 360) * 180;
      const [x, y, z] = geo2xyz(lat, lon);
      const { px, py, visible } = project(x, y, z, rotY, cx, cy, R);
      if (visible) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      } else started = false;
    }
    ctx.stroke();
  });

  // City pin dots
  CITY_PINS.forEach((city) => {
    const [x, y, z] = geo2xyz(city.lat, city.lon);
    const { px, py, visible } = project(x, y, z, rotY, cx, cy, R);
    if (!visible) return;
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(px, py, R * 0.045, 0, PI * 2);
    ctx.fill();
  });

  ctx.restore();

  // Edge shadow
  const edgeGrad = ctx.createRadialGradient(cx, cy, R * 0.58, cx, cy, R);
  edgeGrad.addColorStop(0, "transparent");
  edgeGrad.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = edgeGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, PI * 2);
  ctx.fill();

  // Specular
  const specGrad = ctx.createRadialGradient(cx - R * 0.22, cy - R * 0.24, R * 0.01, cx, cy, R * 0.5);
  specGrad.addColorStop(0, "rgba(255,255,255,0.06)");
  specGrad.addColorStop(1, "transparent");
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, PI * 2);
  ctx.fill();
}

export default function MiniGlobe({ size = 48, speed = 0.6, label, color = "#00c2cb", inline = false }) {
  const canvasRef = useRef(null);
  const rotY = useRef(0);
  const rafRef = useRef(null);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    cv.width = size * 2;
    cv.height = size * 2;
    const ctx = cv.getContext("2d");

    const animate = (time) => {
      const delta = (time - lastTime.current) / 1000;
      lastTime.current = time;
      rotY.current += speed * 2 * PI * delta;
      drawGlobe(ctx, size * 2, rotY.current, color);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, speed, color]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: label ? 6 : 0 }}>
      <canvas
        ref={canvasRef}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          filter: `drop-shadow(0 0 10px ${color}30)`,
          flexShrink: 0,
        }}
      />
      {label && (
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</span>
      )}
    </div>
  );
}

export function GlobePageLoader({ label = "Loading…", size = 72, color = "#00c2cb", overlay = false }) {
  if (overlay) {
    return (
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(5,14,28,0.65)", backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)", zIndex: 50,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 12,
      }}>
        <MiniGlobe size={size} speed={0.6} color={color} />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 200, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12,
    }}>
      <MiniGlobe size={size} speed={0.6} color={color} />
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}