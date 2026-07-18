import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToVec3 } from "./globeUtils";
import { getAircraftStatusLabel } from "@/hooks/useHeroAircraft";

// Aircraft records carry no lat/lng, so the signal is anchored to a stable
// fixed point (preserves the behaviour of the previous globe).
const SIGNAL_LAT = 40.7128;
const SIGNAL_LNG = -74.006;

/**
 * Optional aircraft signal marker — a pulsing dot — shown when an
 * `activeAircraft` is passed (e.g. from useHeroAircraft).
 *
 * The registration/status label is rendered as a plain HTML element positioned
 * each frame by projecting the 3D anchor into screen space — avoiding drei's
 * <Html> middleware (incompatible with three 0.185).
 */
export default function GlobeSignal({ aircraft, radius = 1 }) {
  const haloRef = useRef();
  const labelRef = useRef();
  const labelVec = useRef(new THREE.Vector3());

  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  const [x, y, z] = latLngToVec3(SIGNAL_LAT, SIGNAL_LNG, radius);
  const worldPos = useMemo(() => new THREE.Vector3(x, y, z), [x, y, z]);
  const label = aircraft
    ? `${aircraft.registration} · ${getAircraftStatusLabel(aircraft)}`
    : "";

  // Mount the label div into the canvas's parent container.
  useEffect(() => {
    if (!aircraft) return;
    const container = gl.domElement.parentElement;
    if (!container) return;
    const el = document.createElement("div");
    el.className =
      "pointer-events-none absolute z-10 whitespace-nowrap rounded-full border border-black/5 bg-white/95 px-3 py-1.5 text-[11px] font-medium shadow-md";
    el.style.transform = "translate(-50%, -50%)";
    el.style.willChange = "left, top";
    el.textContent = label;
    container.appendChild(el);
    labelRef.current = el;
    return () => {
      el.remove();
      labelRef.current = null;
    };
  }, [aircraft, gl, label]);

  useFrame(({ clock }) => {
    if (haloRef.current) {
      const s = 1 + 0.28 * Math.sin(clock.getElapsedTime() * 3);
      haloRef.current.scale.setScalar(s);
    }
    if (labelRef.current) {
      labelVec.current.copy(worldPos).project(camera);
      const sx = (labelVec.current.x * 0.5 + 0.5) * size.width;
      const sy = (-labelVec.current.y * 0.5 + 0.5) * size.height;
      labelRef.current.style.left = `${sx}px`;
      labelRef.current.style.top = `${sy}px`;
    }
  });

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
    </group>
  );
}