import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { latLngToVec3 } from "./globeUtils";

// Head pulse + two trailing segments → a glowing pulse "trail" along each arc.
const TRAIL = [0, 0.02, 0.045];

/**
 * GlobeRoutes — maps the `routes` prop to 3D Bezier arcs elevated above the
 * globe surface, and animates a glowing pulse trail along each line using the
 * R3F useFrame clock.
 *
 * routes: [{ startLat, startLng, endLat, endLng, altitude?, color? }]
 */
export default function GlobeRoutes({ routes = [], radius = 1 }) {
  const arcs = useMemo(
    () =>
      (routes || []).map((r) => {
        const start = new THREE.Vector3(...latLngToVec3(r.startLat, r.startLng, radius));
        const end = new THREE.Vector3(...latLngToVec3(r.endLat, r.endLng, radius));
        const alt = typeof r.altitude === "number" ? r.altitude : 0.22;
        const ctrl = new THREE.Vector3()
          .addVectors(start, end)
          .multiplyScalar(0.5)
          .normalize()
          .multiplyScalar(radius * (1 + alt));
        const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
        return {
          curve,
          points: curve.getPoints(64).map((p) => [p.x, p.y, p.z]),
          color: r.color || "#E8C56B",
        };
      }),
    [routes, radius],
  );

  const refs = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    arcs.forEach((arc, i) => {
      TRAIL.forEach((off, j) => {
        const mesh = refs.current[i * TRAIL.length + j];
        if (!mesh) return;
        let p = (t * 0.12 + i * 0.19 - off) % 1;
        if (p < 0) p += 1;
        mesh.position.copy(arc.curve.getPointAt(p));
        mesh.scale.setScalar(j === 0 ? 1 : 0.7 / j);
      });
    });
  });

  return (
    <group>
      {arcs.map((arc, i) => (
        <group key={i}>
          <Line points={arc.points} color={arc.color} lineWidth={1} transparent opacity={0.18} />
          {TRAIL.map((_, j) => (
            <mesh
              key={j}
              ref={(el) => {
                refs.current[i * TRAIL.length + j] = el;
              }}
            >
              <sphereGeometry args={[0.014, 10, 10]} />
              <meshBasicMaterial
                color={arc.color}
                transparent
                opacity={j === 0 ? 0.95 : 0.5 / j}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}