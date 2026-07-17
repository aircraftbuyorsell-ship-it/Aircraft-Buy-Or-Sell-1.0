import { useRef, useEffect } from "react";
import * as THREE from "three";

const WORLD_DATA_URL = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const CITY_PAIRS = [
  [[40.7, -74.0], [51.5, -0.1]],
  [[34.0, -118.2], [35.7, 139.7]],
  [[25.3, 55.3], [1.4, 103.8]],
  [[48.9, 2.4], [50.1, 8.7]],
  [[22.3, 114.2], [-33.9, 151.2]],
  [[-23.5, -46.6], [-26.2, 28.0]],
];

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function collectPolygons(features) {
  return features.flatMap(({ geometry }) => {
    if (!geometry) return [];
    if (geometry.type === "Polygon") return [geometry.coordinates];
    return geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  });
}

function makeGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d");
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.2, "rgba(245,194,66,.95)");
  glow.addColorStop(0.55, "rgba(245,194,66,.3)");
  glow.addColorStop(1, "rgba(245,194,66,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export default function HeroGlobe() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.12, 6.35);

    const globe = new THREE.Group();
    globe.rotation.set(-0.08, -0.48, 0.03);
    scene.add(globe);

    const radius = 1.82;
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(radius, 96, 96),
      new THREE.MeshPhysicalMaterial({ color: 0xf1f0ed, roughness: 0.56, metalness: 0.12, transparent: true, opacity: 0.76, clearcoat: 0.28 })
    ));

    const glowTexture = makeGlowTexture();
    const markers = [];
    const addMarker = (lat, lon, color, size) => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      sprite.position.copy(latLonToVec3(lat, lon, radius + 0.035));
      sprite.userData.baseSize = size;
      sprite.scale.set(size, size, 1);
      globe.add(sprite);
      markers.push(sprite);
    };

    const arcMaterial = new THREE.MeshBasicMaterial({ color: 0xd4a017, transparent: true, opacity: 0.42, depthWrite: false });
    CITY_PAIRS.forEach(([from, to], index) => {
      const start = latLonToVec3(from[0], from[1], radius + 0.02);
      const end = latLonToVec3(to[0], to[1], radius + 0.02);
      const control = start.clone().add(end).normalize().multiplyScalar(radius * 1.36);
      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      globe.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.006, 6, false), arcMaterial));
      addMarker(from[0], from[1], index % 3 === 0 ? 0x49d7c6 : 0xf5c242, index === 0 ? 0.24 : 0.14);
      addMarker(to[0], to[1], index % 2 === 0 ? 0x63c7ed : 0xf5c242, 0.13);
    });

    let disposed = false;
    fetch(WORLD_DATA_URL)
      .then((response) => response.json())
      .then(({ features }) => {
        if (disposed) return;
        const polygons = collectPolygons(features);
        const positions = [];
        for (let lat = -58; lat <= 80; lat += 2.1) {
          const lonStep = 2.1 / Math.max(Math.cos(lat * Math.PI / 180), 0.35);
          for (let lon = -180; lon < 180; lon += lonStep) {
            if (!polygons.some((polygon) => pointInRing(lon, lat, polygon[0]))) continue;
            const point = latLonToVec3(lat, lon, radius + 0.018);
            positions.push(point.x, point.y, point.z);
          }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        globe.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xa9a7a2, size: 0.028, transparent: true, opacity: 0.92, depthWrite: false })));
      });

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd6c79e, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(3, 3, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xe7c35f, 1.1);
    rimLight.position.set(-3, 1, -2);
    scene.add(rimLight);

    let frame;
    const startedAt = performance.now();
    const render = () => {
      frame = requestAnimationFrame(render);
      const elapsed = (performance.now() - startedAt) / 1000;
      globe.rotation.y = -0.48 + elapsed * 0.025;
      markers.forEach((marker, index) => {
        const pulse = 0.92 + Math.sin(elapsed * 1.5 + index) * 0.12;
        const size = marker.userData.baseSize * pulse;
        marker.scale.set(size, size, 1);
      });
      renderer.render(scene, camera);
    };
    render();

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </div>
  );
}