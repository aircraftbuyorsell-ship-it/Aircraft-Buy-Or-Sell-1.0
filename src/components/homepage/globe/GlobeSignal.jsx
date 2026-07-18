import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { latLngToVec3 } from "./globeUtils";
import { getAircraftStatusLabel } from "@/hooks/useHeroAircraft";

// Aircraft records carry no lat/lng, so the signal is anchored to a stable
// fixed point (preserves the behaviour of the previous globe).
const SIGNAL_LAT = 40.7128;
const SIGNAL_LNG = -74.006;

/**
 * Optional aircraft signal marker — a pulsing dot plus an HTML label — shown
 * when an `activeAircraft` is passed (e.g. from useHeroAircraft).
 */
export default function GlobeSignal({ aircraft, radius = 1 }) {
  const haloRef = useRef();
  const [x, y, z] = latLngToVec3(SIGNAL_LAT, SIGNAL_LNG, radius);

  useFrame(({ clock }) => {
    if (!haloRef.current) return;
    const s = 1 + 0.28 * Math.sin(clock.getElapsedTime() * 3);
    haloRef.current.scale.setScalar(s);
  });

  const label = aircraft
    ? `${aircraft.registration} · ${getAircraftStatusLabel(aircraft)}`
    : "";

  return (
    <group>
      <mesh position={[x, y, z]}>
        <sphereGeometry args={[0.018, 16, 16]} />
        <meshBasicMaterial color="#4adaa1" transparent opacity={0.95} />
      </mesh>
      <mesh ref={haloRef} position={[x, y, z]}>
        <sphereGeometry args={[0.026, 16, 16]} />
        <meshBasicMaterial color="#4adaa1" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      {aircraft && (
        <Html position={[x, y, z]} center distanceFactor={2.2} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-black/5 bg-white/95 px-3 py-1.5 text-[11px] font-medium shadow-md">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}