import { Canvas } from "@react-three/fiber";
import GlobeScene from "./globe/GlobeScene";
import { MODE_CONFIG, DEFAULT_ROUTES } from "./globe/globeConfig";

/**
 * HeroGlobe — a premium, high-performance 3D interactive dot globe built on
 * React Three Fiber + drei + Three.js.
 *
 * Props:
 *  - mode:        "hero" | "dashboard" | "sidebar" | "background"
 *  - interactive: enable/disable OrbitControls (rotation/zoom)
 *  - routes:      [{ startLat, startLng, endLat, endLng, altitude?, color? }]
 *  - activeAircraft: optional aircraft record from useHeroAircraft() — renders
 *    a pulsing signal marker + label (preserves GlobeShowcase behaviour).
 *
 * The container applies `touch-action: none` so mobile swiping rotates the
 * globe instead of scrolling the page.
 */
export default function HeroGlobe({
  mode = "hero",
  interactive = true,
  routes,
  activeAircraft,
}) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.hero;
  const effectiveRoutes = routes && routes.length ? routes : DEFAULT_ROUTES;

  return (
    <div
      className={`relative ${cfg.container}`}
      style={{ touchAction: "none", pointerEvents: interactive ? "auto" : "none" }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, cfg.cameraDist], fov: 45, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
      >
        <GlobeScene
          mode={mode}
          interactive={interactive}
          routes={effectiveRoutes}
          activeAircraft={activeAircraft}
        />
      </Canvas>
    </div>
  );
}