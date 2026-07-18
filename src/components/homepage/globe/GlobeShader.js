// Custom GLSL ShaderMaterial for the globe's dot field.
//
// Vertex shader:
//   - places each point on the sphere of uRadius
//   - computes world-space normal + view direction for a correct fresnel term
//   - sizes points in pixels with a gentle twinkle
//
// Fragment shader:
//   - discards fragments outside a 0.5 radius → perfectly round points
//   - smoothstep gives a soft antialiased edge
//   - camera-fresnel brightens dots near the globe silhouette, producing a
//     luxurious Apple/Stripe-style glowing aura around the edges.

export const globeVertexShader = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uRadius;
attribute float aSize;
attribute vec3 aColor;
attribute float aLand;
varying vec3 vColor;
varying float vLand;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  vColor = aColor;
  vLand = aLand;
  vec3 dir = normalize(position);
  vec3 worldPos = (modelMatrix * vec4(dir * uRadius, 1.0)).xyz;
  vNormal = normalize(mat3(modelMatrix) * dir);
  vViewDir = normalize(cameraPosition - worldPos);
  vec4 mvPosition = modelViewMatrix * vec4(dir * uRadius, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float twinkle = 0.88 + 0.12 * sin(uTime * 1.4 + aSize * 47.0);
  gl_PointSize = aSize * uSize * twinkle * (7.0 / -mvPosition.z);
}
`;

export const globeFragmentShader = /* glsl */ `
uniform float uTime;
varying vec3 vColor;
varying float vLand;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  // Round point: distance from the point's center in gl_PointCoord space.
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;

  // Soft antialiased edge.
  float alpha = smoothstep(0.5, 0.36, d);

  // Camera fresnel — brightest where the surface turns away from the camera,
  // i.e. along the globe's silhouette, creating the glowing aura.
  float fres = 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
  fres = pow(fres, 2.2);

  vec3 col = vColor * (0.72 + fres * 0.35);
  float a = alpha * (0.50 + fres * 0.40) * vLand;
  gl_FragColor = vec4(col, a);
}
`;

export function createGlobeUniforms(radius = 1, size = 1) {
  return {
    uTime: { value: 0 },
    uSize: { value: size },
    uRadius: { value: radius },
  };
}