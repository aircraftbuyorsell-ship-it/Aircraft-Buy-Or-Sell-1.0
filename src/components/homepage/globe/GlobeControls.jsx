import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * GlobeControls — three's own OrbitControls wired into the R3F render loop.
 * Using the upstream control (instead of drei's wrapper) removes a layer of
 * middleware that was incompatible with three 0.185.
 *
 * Returns null — OrbitControls drives the camera directly; it is not a scene
 * graph object.
 */
export default function GlobeControls({
  interactive = true,
  autoRotate = true,
  rotateSpeed = 1,
  enableZoom = false,
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const controls = useMemo(
    () => new OrbitControlsImpl(camera, gl.domElement),
    [camera, gl.domElement],
  );

  useEffect(() => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = interactive;
    controls.enableZoom = interactive && enableZoom;
    controls.enablePan = false;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.4;
    controls.rotateSpeed = rotateSpeed;
    controls.minDistance = 1.4;
    controls.maxDistance = 5;
  }, [controls, interactive, autoRotate, rotateSpeed, enableZoom]);

  useEffect(() => () => controls.dispose(), [controls]);

  useFrame(() => controls.update());

  return null;
}