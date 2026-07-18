import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGlobeGeometry } from "./useGlobeGeometry";
import { globeVertexShader, globeFragmentShader, createGlobeUniforms } from "./GlobeShader";

/**
 * The dot field: a single THREE.Points mesh driven by a custom ShaderMaterial.
 * Thousands of dots render in one draw call for stable mobile performance.
 */
export default function GlobePoints({ count, radius, dotScale = 1 }) {
  const geometry = useGlobeGeometry(count, radius);
  const uniforms = useRef(createGlobeUniforms());
  const matRef = useRef();

  useEffect(() => {
    uniforms.current.uRadius.value = radius;
    uniforms.current.uSize.value = dotScale;
  }, [radius, dotScale]);

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={matRef}
        vertexShader={globeVertexShader}
        fragmentShader={globeFragmentShader}
        uniforms={uniforms.current}
        transparent
        depthWrite={false}
      />
    </points>
  );
}