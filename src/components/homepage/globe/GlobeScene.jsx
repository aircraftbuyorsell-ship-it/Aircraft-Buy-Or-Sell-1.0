import { OrbitControls } from "@react-three/drei";
import { MODE_CONFIG } from "./globeConfig";
import GlobePoints from "./GlobePoints";
import GlobeRoutes from "./GlobeRoutes";
import GlobeSignal from "./GlobeSignal";

/**
 * GlobeScene — the in-canvas composition: dot field, route arcs, optional
 * aircraft signal, lighting, and mobile-optimized OrbitControls.
 */
export default function GlobeScene({ mode = "hero", interactive = true, routes = [], activeAircraft }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.hero;

  // Lower rotateSpeed on touch devices for smoother, less twitchy control.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const rotateSpeed = isMobile ? Math.min(cfg.rotateSpeed, 0.6) : cfg.rotateSpeed;

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 2, 4]} intensity={1.2} />

      <GlobePoints count={cfg.count} radius={cfg.radius} dotScale={cfg.dotScale} />
      <GlobeRoutes routes={routes} radius={cfg.radius} />
      {activeAircraft && <GlobeSignal aircraft={activeAircraft} radius={cfg.radius} />}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enableRotate={interactive}
        enableZoom={interactive && cfg.zoom}
        enablePan={false}
        autoRotate={cfg.autoRotate}
        autoRotateSpeed={0.4}
        rotateSpeed={rotateSpeed}
        minDistance={1.4}
        maxDistance={5}
      />
    </>
  );
}