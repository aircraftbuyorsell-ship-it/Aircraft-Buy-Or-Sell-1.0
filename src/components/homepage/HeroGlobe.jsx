import Globe from "react-globe.gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAircraftStatusLabel } from "@/hooks/useHeroAircraft";

/* ────────────────────────────────────────────
   LAND MASK (bounding-box fallback — consumed by the texture generator)
──────────────────────────────────────────── */
function isApproximateLand(lat, lon) {
  const northAmerica = lat > 10 && lat < 72 && lon > -170 && lon < -50;
  const southAmerica = lat > -58 && lat < 15 && lon > -82 && lon < -34;
  const europe = lat > 34 && lat < 72 && lon > -12 && lon < 45;
  const africa = lat > -36 && lat < 38 && lon > -20 && lon < 52;
  const asia = lat > 5 && lat < 75 && lon > 35 && lon < 180;
  const australia = lat > -47 && lat < -10 && lon > 110 && lon < 155;
  return northAmerica || southAmerica || europe || africa || asia || australia;
}

/* ────────────────────────────────────────────
   GLOBE TEXTURE — one static equirectangular dot-land image, cached at module scope
──────────────────────────────────────────── */
function generateGlobeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  // light pearl ocean base
  ctx.fillStyle = "#f7f8f8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 3) {
    const lat = 90 - (y / canvas.height) * 180;
    for (let x = 0; x < canvas.width; x += 3) {
      const lon = (x / canvas.width) * 360 - 180;
      if (!isApproximateLand(lat, lon)) continue;

      const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const random = seed - Math.floor(seed);
      if (random > 0.55) continue; // dot density on land

      ctx.beginPath();
      ctx.arc(x, y, 1.1 + random * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(116, 121, 125, ${0.35 + random * 0.3})`;
      ctx.fill();
    }
  }

  return canvas.toDataURL("image/png");
}

let cachedGlobeTexture = null;
function getGlobeTexture() {
  if (!cachedGlobeTexture) cachedGlobeTexture = generateGlobeTexture();
  return cachedGlobeTexture;
}

/* ────────────────────────────────────────────
   SURFACE ROUTES — aviation hubs, varied altitudes
──────────────────────────────────────────── */
const ROUTES = [
  { startLat: 40.7128, startLng: -74.006, endLat: 51.5074, endLng: -0.1278, altitude: 0.18 }, // NY → London
  { startLat: 51.5074, startLng: -0.1278, endLat: 25.2048, endLng: 55.2708, altitude: 0.28 }, // London → Dubai
  { startLat: 25.2048, startLng: 55.2708, endLat: 1.3521, endLng: 103.8198, altitude: 0.42 }, // Dubai → Singapore
  { startLat: 34.0522, startLng: -118.2437, endLat: 50.1109, endLng: 8.6821, altitude: 0.32 }, // LA → Frankfurt
  { startLat: 50.0755, startLng: 14.4378, endLat: 40.7128, endLng: -74.006, altitude: 0.24 }, // Prague → NY
  { startLat: 48.8566, startLng: 2.3522, endLat: -23.5505, endLng: -46.6333, altitude: 0.4 }, // Paris → São Paulo
];

/* ────────────────────────────────────────────
   COMPONENT
──────────────────────────────────────────── */
export default function HeroGlobe({ activeAircraft }) {
  const wrapperRef = useRef(null);
  const globeRef = useRef(null);
  const [size, setSize] = useState({ width: 600, height: 600 });

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Explicit pixel size driven by ResizeObserver — never a raw CSS percentage
  useEffect(() => {
    if (!wrapperRef.current) return;
    const maxWidth = 900;
    const maxHeight = 720;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.min(entry.contentRect.width, maxWidth);
      const height = Math.min(entry.contentRect.height, maxHeight);
      setSize({ width, height });
    });

    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  // Initial point of view + slow auto-rotation, zoom/pan disabled
  useEffect(() => {
    if (!globeRef.current) return;
    // North America left, Atlantic center, Europe/Africa right
    globeRef.current.pointOfView({ lat: 15, lng: -40, altitude: 2.1 }, 0);

    const controls = globeRef.current.controls();
    controls.autoRotate = !reducedMotion;
    controls.autoRotateSpeed = 0.25; // slow — do not increase
    controls.enableZoom = false;
    controls.enablePan = false;
  }, [size.width, size.height, reducedMotion]);

  const signalPoint = useMemo(
    () =>
      activeAircraft
        ? [
            {
              lat: 40.7128, // anchored to a fixed North America point — aircraft model has no lat/lng
              lng: -74.006,
              color: "#4adaa1",
              aircraft: activeAircraft,
            },
          ]
        : [],
    [activeAircraft],
  );

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={getGlobeTexture()}
        showAtmosphere
        atmosphereColor="#f5c242"
        atmosphereAltitude={0.14}
        arcsData={ROUTES}
        arcColor={() => ["rgba(212,160,23,0.05)", "rgba(238,202,112,0.75)"]}
        arcAltitude="altitude"
        arcStroke={0.4}
        arcDashLength={0.4}
        arcDashGap={0.6}
        arcDashAnimateTime={reducedMotion ? 0 : 4000}
        pointsData={signalPoint}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius={0.35}
        ringsData={reducedMotion ? [] : signalPoint}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => "rgba(74,218,161,0.45)"}
        ringMaxRadius={4}
        ringPropagationSpeed={2}
        ringRepeatPeriod={1400}
        htmlElementsData={signalPoint}
        htmlLat="lat"
        htmlLng="lng"
        htmlElement={(d) => {
          const el = document.createElement("div");
          el.className =
            "pointer-events-none rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium shadow-md border border-black/5 whitespace-nowrap";
          el.innerText = `${d.aircraft.registration} · ${getAircraftStatusLabel(d.aircraft)}`;
          return el;
        }}
      />
    </div>
  );
}