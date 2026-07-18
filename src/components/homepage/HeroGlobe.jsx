import { useEffect, useRef } from "react";

/* ────────────────────────────────────────────
   GEOGRAPHIC DATA
──────────────────────────────────────────── */

// Coarse continent polygons — [lat, lon] vertex lists
const LAND_POLYGONS = [
  // North America
  [[71, -156], [70, -110], [62, -92], [58, -94], [52, -79], [47, -52], [44, -66], [40, -74], [35, -76], [30, -81], [25, -80], [22, -97], [17, -95], [15, -92], [20, -105], [23, -110], [32, -117], [40, -124], [48, -125], [55, -131], [60, -140], [64, -165], [68, -166]],
  // Greenland
  [[83, -35], [81, -20], [76, -18], [70, -22], [60, -43], [65, -52], [76, -68], [80, -60]],
  // South America
  [[12, -72], [8, -60], [4, -51], [-2, -44], [-8, -35], [-14, -39], [-23, -41], [-33, -53], [-39, -62], [-46, -67], [-53, -70], [-52, -74], [-42, -73], [-33, -71], [-18, -70], [-5, -81], [1, -80], [8, -77], [11, -74]],
  // Europe
  [[71, 26], [68, 42], [60, 30], [55, 21], [54, 12], [57, 8], [58, 5], [62, 5], [65, 12], [70, 20]],
  [[60, -5], [58, -6], [54, -3], [51, 1], [50, -5], [53, -10], [57, -7]],
  [[51, 3], [53, 7], [54, 10], [51, 15], [48, 17], [45, 14], [44, 8], [43, -1], [43, -9], [42, -9], [37, -9], [36, -6], [38, 0], [42, 3], [43, 5], [44, 10], [41, 16], [38, 16], [40, 18], [42, 19], [45, 13], [46, 6], [49, 2]],
  [[47, 19], [44, 28], [41, 26], [37, 22], [39, 20], [42, 19], [45, 20]],
  // Africa
  [[35, -6], [37, 10], [33, 12], [31, 25], [31, 32], [15, 39], [11, 43], [12, 51], [2, 46], [-4, 40], [-15, 40], [-24, 35], [-34, 27], [-35, 20], [-33, 18], [-23, 14], [-12, 13], [-6, 12], [0, 9], [4, 6], [4, -7], [7, -13], [12, -17], [21, -17], [28, -13], [32, -9]],
  // Madagascar
  [[-12, 49], [-16, 50], [-25, 47], [-25, 44], [-19, 44], [-13, 48]],
  // Asia
  [[68, 42], [70, 70], [73, 85], [71, 130], [66, 160], [62, 165], [60, 155], [55, 137], [50, 128], [43, 132], [39, 126], [35, 120], [30, 122], [24, 118], [21, 108], [16, 108], [10, 107], [8, 100], [14, 98], [17, 94], [21, 90], [16, 82], [9, 78], [8, 77], [15, 74], [21, 70], [25, 67], [25, 61], [27, 56], [24, 52], [22, 59], [17, 55], [13, 44], [15, 42], [21, 39], [28, 34], [31, 32], [36, 36], [37, 27], [41, 27], [41, 41], [42, 48], [37, 54], [41, 55], [46, 52], [48, 46], [45, 38], [47, 39], [55, 37], [60, 30], [68, 42]],
  // Japan
  [[45, 142], [43, 145], [38, 141], [34, 140], [31, 131], [34, 131], [37, 137], [41, 140], [44, 141]],
  // SE Asia islands
  [[6, 95], [1, 103], [-3, 106], [-6, 106], [-8, 114], [-8, 108], [-6, 105], [0, 100], [5, 96]],
  [[7, 117], [1, 109], [-3, 110], [-4, 115], [1, 119], [5, 119]],
  [[-1, 131], [-4, 135], [-7, 139], [-9, 143], [-8, 147], [-5, 145], [-2, 141], [-1, 136]],
  // Australia
  [[-11, 142], [-16, 145], [-20, 148], [-25, 153], [-32, 152], [-37, 150], [-38, 145], [-35, 137], [-32, 133], [-33, 124], [-34, 115], [-30, 115], [-23, 113], [-19, 121], [-15, 128], [-12, 131], [-12, 136], [-14, 136], [-11, 140]],
];

// Surface routes — from/to [lat, lon], altitude in globe radii above surface
const ROUTES = [
  { from: [40.7, -74.0], to: [51.5, -0.1], altitude: 0.28, width: 1.0 },   // NY → London
  { from: [51.5, -0.1], to: [25.3, 55.3], altitude: 0.12, width: 0.8 },    // London → Dubai
  { from: [25.3, 55.3], to: [1.4, 103.8], altitude: 0.12, width: 0.8 },    // Dubai → Singapore
  { from: [34.0, -118.2], to: [48.9, 2.4], altitude: 0.52, width: 1.2 },   // LA → Paris
  { from: [-23.5, -46.6], to: [40.7, -74.0], altitude: 0.28, width: 1.0 }, // São Paulo → NY
  { from: [50.1, 8.7], to: [-26.2, 28.0], altitude: 0.32, width: 1.0 },    // Frankfurt → Joburg
];

// Signals at cities
const SIGNALS = [
  { pos: [40.7, -74.0], type: "verified", size: 3.2 },
  { pos: [51.5, -0.1], type: "registry", size: 2.8 },
  { pos: [25.3, 55.3], type: "activity", size: 2.8 },
  { pos: [1.4, 103.8], type: "registry", size: 2.4 },
  { pos: [34.0, -118.2], type: "activity", size: 2.6 },
  { pos: [-23.5, -46.6], type: "verified", size: 2.4 },
  { pos: [50.1, 8.7], type: "activity", size: 2.2 },
];

const SIGNAL_COLORS = {
  verified: { core: "rgba(74, 218, 161, 1)", glowStrong: "rgba(74, 218, 161, 0.5)", glow: "rgba(74, 218, 161, 0.16)", ring: "rgba(74, 218, 161, 0.42)" },
  registry: { core: "rgba(80, 202, 239, 1)", glowStrong: "rgba(80, 202, 239, 0.5)", glow: "rgba(80, 202, 239, 0.15)", ring: "rgba(80, 202, 239, 0.4)" },
  activity: { core: "rgba(244, 190, 66, 1)", glowStrong: "rgba(244, 190, 66, 0.52)", glow: "rgba(244, 190, 66, 0.16)", ring: "rgba(244, 190, 66, 0.44)" },
};

/* ────────────────────────────────────────────
   GEOMETRY
──────────────────────────────────────────── */

function latLonToVector(lat, lon) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

function rotateY(v, a) {
  const cos = Math.cos(a), sin = Math.sin(a);
  return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos };
}

function rotateX(v, a) {
  const cos = Math.cos(a), sin = Math.sin(a);
  return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos };
}

function project(v, centerX, centerY, radius, rotation, tilt) {
  const r = rotateX(rotateY(v, rotation), tilt);
  return { x: centerX + r.x * radius, y: centerY - r.y * radius, z: r.z };
}

// Spherical interpolation with altitude bump
function interpolateGreatCircle(fromVec, toVec, t, altitude) {
  const dot = Math.max(-1, Math.min(1, fromVec.x * toVec.x + fromVec.y * toVec.y + fromVec.z * toVec.z));
  const omega = Math.acos(dot);
  const so = Math.sin(omega) || 1e-6;
  const a = Math.sin((1 - t) * omega) / so;
  const b = Math.sin(t * omega) / so;
  const lift = 1 + Math.sin(Math.PI * t) * altitude;
  return {
    x: (fromVec.x * a + toVec.x * b) * lift,
    y: (fromVec.y * a + toVec.y * b) * lift,
    z: (fromVec.z * a + toVec.z * b) * lift,
  };
}

// Deterministic pseudo-random from two numbers
function hashRand(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function pointInPolygon(lat, lon, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function isLand(lat, lon) {
  for (const poly of LAND_POLYGONS) {
    if (pointInPolygon(lat, lon, poly)) return true;
  }
  return false;
}

/* ────────────────────────────────────────────
   DATA GENERATION
──────────────────────────────────────────── */

function createLandPointCloud() {
  const dots = [];
  const latStep = 1.9;
  for (let lat = -60; lat <= 82; lat += latStep) {
    const lonStep = latStep / Math.max(0.25, Math.cos((lat * Math.PI) / 180));
    for (let lon = -180; lon < 180; lon += lonStep) {
      const jLat = lat + (hashRand(lat, lon) - 0.5) * latStep * 0.9;
      const jLon = lon + (hashRand(lon, lat) - 0.5) * lonStep * 0.9;
      if (!isLand(jLat, jLon)) continue;
      const density = hashRand(jLat * 2.3, jLon * 1.7);
      dots.push({ vec: latLonToVector(jLat, jLon), density });
    }
  }
  return dots;
}

function createSparseSphereDots() {
  const dots = [];
  const count = 260;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    dots.push({ vec: { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r } });
  }
  return dots;
}

const LAND_DOTS = createLandPointCloud();
const OCEAN_DOTS = createSparseSphereDots();

/* ────────────────────────────────────────────
   RENDERING
──────────────────────────────────────────── */

function drawGlobeBase(ctx, centerX, centerY, radius) {
  const globeFill = ctx.createRadialGradient(
    centerX - radius * 0.3, centerY - radius * 0.35, radius * 0.1,
    centerX, centerY, radius,
  );
  globeFill.addColorStop(0, "rgba(255,255,255,0.98)");
  globeFill.addColorStop(0.45, "rgba(249,249,247,0.88)");
  globeFill.addColorStop(0.78, "rgba(229,232,233,0.48)");
  globeFill.addColorStop(1, "rgba(203,208,211,0.12)");
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = globeFill;
  ctx.fill();
}

function drawOuterAtmosphere(ctx, centerX, centerY, radius) {
  const halo = ctx.createRadialGradient(centerX, centerY, radius * 0.9, centerX, centerY, radius * 1.25);
  halo.addColorStop(0, "rgba(255,255,255,0)");
  halo.addColorStop(0.5, "rgba(238,225,190,0.10)");
  halo.addColorStop(1, "rgba(238,225,190,0)");
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();
}

function drawGlobeShading(ctx, centerX, centerY, radius) {
  const shading = ctx.createRadialGradient(
    centerX - radius * 0.35, centerY - radius * 0.4, radius * 0.15,
    centerX + radius * 0.2, centerY + radius * 0.15, radius * 1.15,
  );
  shading.addColorStop(0, "rgba(255,255,255,0)");
  shading.addColorStop(0.58, "rgba(255,255,255,0)");
  shading.addColorStop(0.82, "rgba(118,126,132,0.05)");
  shading.addColorStop(1, "rgba(74,82,90,0.14)");
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = shading;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawRimLight(ctx, centerX, centerY, radius) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(160,168,174,0.18)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawSpecularHighlight(ctx, centerX, centerY, radius) {
  const spec = ctx.createRadialGradient(
    centerX - radius * 0.42, centerY - radius * 0.48, 0,
    centerX - radius * 0.42, centerY - radius * 0.48, radius * 0.55,
  );
  spec.addColorStop(0, "rgba(255,255,255,0.5)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = spec;
  ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawDots(ctx, dots, centerX, centerY, radius, rotation, tilt, isLandLayer) {
  for (const dot of dots) {
    const p = project(dot.vec, centerX, centerY, radius, rotation, tilt);
    if (p.z < -0.15) continue;
    const depth = Math.max(0, Math.min(1, (p.z + 1) / 2));
    if (isLandLayer) {
      const landDensity = dot.density;
      const dotSize = 0.55 + depth * 0.95 + landDensity * 0.3;
      const alpha = 0.08 + depth * 0.34 + landDensity * 0.12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = depth > 0.72
        ? `rgba(122, 126, 128, ${alpha})`
        : depth > 0.45
          ? `rgba(145, 149, 151, ${alpha})`
          : `rgba(180, 184, 187, ${alpha})`;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 0.6 + depth * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196, 202, 206, ${0.04 + depth * 0.08})`;
      ctx.fill();
    }
  }
}

function drawRoute(ctx, route, centerX, centerY, radius, rotation, tilt, frontPass) {
  const fromVec = latLonToVector(route.from[0], route.from[1]);
  const toVec = latLonToVector(route.to[0], route.to[1]);
  const steps = 72;
  let path = [];
  const segments = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = interpolateGreatCircle(fromVec, toVec, t, route.altitude);
    const p = project(point, centerX, centerY, radius, rotation, tilt);
    const isFront = p.z > 0;
    if (isFront === frontPass) {
      path.push(p);
    } else if (path.length > 1) {
      segments.push(path);
      path = [];
    } else {
      path = [];
    }
  }
  if (path.length > 1) segments.push(path);

  for (const seg of segments) {
    const first = seg[0];
    const last = seg[seg.length - 1];
    const gradient = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
    gradient.addColorStop(0, "rgba(212,160,23,0.05)");
    gradient.addColorStop(0.18, "rgba(224,181,70,0.42)");
    gradient.addColorStop(0.5, "rgba(238,202,112,0.78)");
    gradient.addColorStop(0.82, "rgba(224,181,70,0.42)");
    gradient.addColorStop(1, "rgba(212,160,23,0.05)");
    ctx.save();
    ctx.globalAlpha = frontPass ? 1 : 0.12;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < seg.length; i++) ctx.lineTo(seg[i].x, seg[i].y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = route.width;
    if (frontPass) {
      ctx.shadowColor = "rgba(232,190,86,0.35)";
      ctx.shadowBlur = 6;
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawOrbitalArc(ctx, centerX, centerY, radiusX, radiusY, rotation, startAngle, endAngle) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, startAngle, endAngle);
  ctx.strokeStyle = "rgba(218, 170, 48, 0.42)";
  ctx.lineWidth = 1;
  ctx.shadowColor = "rgba(232, 190, 86, 0.25)";
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();
}

function drawLayeredSignal(ctx, x, y, signal, elapsed, index) {
  const colors = SIGNAL_COLORS[signal.type];
  const phase = (Math.sin(elapsed * 0.0012 + index) + 1) / 2;

  ctx.save();

  // Outer soft glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 20 + phase * 8);
  glow.addColorStop(0, colors.glowStrong);
  glow.addColorStop(0.35, colors.glow);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 22 + phase * 8, 0, Math.PI * 2);
  ctx.fill();

  // Pulse ring
  ctx.beginPath();
  ctx.arc(x, y, 10 + phase * 10, 0, Math.PI * 2);
  ctx.strokeStyle = colors.ring;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.55 - phase * 0.3;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Core
  ctx.beginPath();
  ctx.arc(x, y, signal.size, 0, Math.PI * 2);
  ctx.fillStyle = colors.core;
  ctx.shadowColor = colors.core;
  ctx.shadowBlur = 18;
  ctx.fill();

  // White center
  ctx.beginPath();
  ctx.arc(x - 1, y - 1, 1.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.fill();

  ctx.restore();
}

/* ────────────────────────────────────────────
   COMPONENT
──────────────────────────────────────────── */

export default function HeroGlobe() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame;
    const startedAt = performance.now();

    const render = (now) => {
      frame = requestAnimationFrame(render);
      const elapsed = now - startedAt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const radius = Math.min(width * 0.57, height * 0.73);
      const centerX = width * 0.55;
      const centerY = height * 0.55;

      const autoRotation = reducedMotion ? 0 : elapsed * 0.000008;
      const rotation = -0.62 + autoRotation;
      const tilt = -0.12;

      drawOuterAtmosphere(ctx, centerX, centerY, radius);
      drawGlobeBase(ctx, centerX, centerY, radius);
      drawDots(ctx, OCEAN_DOTS, centerX, centerY, radius, rotation, tilt, false);
      drawDots(ctx, LAND_DOTS, centerX, centerY, radius * 1.002, rotation, tilt, true);
      drawGlobeShading(ctx, centerX, centerY, radius);

      // Back-side routes first, then front
      for (const route of ROUTES) drawRoute(ctx, route, centerX, centerY, radius, rotation, tilt, false);
      for (const route of ROUTES) drawRoute(ctx, route, centerX, centerY, radius, rotation, tilt, true);

      // Orbital arcs — large champagne infrastructure ellipses
      drawOrbitalArc(ctx, centerX, centerY, radius * 1.32, radius * 0.38, -0.4, Math.PI * 0.08, Math.PI * 1.86);
      drawOrbitalArc(ctx, centerX, centerY, radius * 1.18, radius * 0.52, 0.32, Math.PI * 1.1, Math.PI * 2.7);

      // Signals
      SIGNALS.forEach((signal, index) => {
        const vec = latLonToVector(signal.pos[0], signal.pos[1]);
        const p = project(vec, centerX, centerY, radius * 1.01, rotation, tilt);
        if (p.z > -0.05) drawLayeredSignal(ctx, p.x, p.y, signal, elapsed, index);
      });

      drawSpecularHighlight(ctx, centerX, centerY, radius);
      drawRimLight(ctx, centerX, centerY, radius);

      if (reducedMotion) cancelAnimationFrame(frame);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </div>
  );
}