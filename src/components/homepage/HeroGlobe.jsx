import { useRef, useEffect } from "react";
import * as THREE from "three";

const CITY_PAIRS = [
  [[40.7, -74.0], [51.5, -0.1]],
  [[34.0, -118.2], [35.7, 139.7]],
  [[25.3, 55.3], [1.4, 103.8]],
  [[48.9, 2.4], [50.1, 8.7]],
  [[22.3, 114.2], [-33.9, 151.2]],
  [[41.9, -87.6], [25.8, -80.2]],
  [[41.0, 28.9], [19.1, 72.9]],
  [[-23.5, -46.6], [-26.2, 28.0]],
  [[47.6, -122.3], [61.2, -149.9]],
  [[46.2, 6.1], [47.4, 8.5]],
];

function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

export default function HeroGlobe() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const W = container.clientWidth || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0.3, 4.5);

    const globe = new THREE.Group();
    scene.add(globe);

    const SPHERE_R = 1.8;
    const GOLD = 0xf5c242;

    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x070a10,
      emissive: 0x030508,
      shininess: 110,
      specular: 0xd4a017,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(SPHERE_R, 64, 64), sphereMat);
    globe.add(sphere);

    const gridPts = [];
    const gr = SPHERE_R + 0.004;
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lon = 0; lon < 360; lon += 4) {
        const v1 = latLonToVec3(lat, lon, gr);
        const v2 = latLonToVec3(lat, lon + 4, gr);
        gridPts.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      }
    }
    for (let lon = 0; lon < 360; lon += 30) {
      for (let lat = -75; lat <= 75; lat += 4) {
        const v1 = latLonToVec3(lat, lon, gr);
        const v2 = latLonToVec3(lat + 4, lon, gr);
        gridPts.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
      }
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(gridPts, 3));
    const grid = new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({
      color: 0xd4a017,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    globe.add(grid);

    const arcGroup = new THREE.Group();
    globe.add(arcGroup);

    CITY_PAIRS.forEach(([a, b]) => {
      const va = latLonToVec3(a[0], a[1], SPHERE_R + 0.01);
      const vb = latLonToVec3(b[0], b[1], SPHERE_R + 0.01);
      const mid = va.clone().add(vb).multiplyScalar(0.5);
      const ctrl = mid.normalize().multiplyScalar(2.5);
      const curve = new THREE.QuadraticBezierCurve3(va, ctrl, vb);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.007, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      arcGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
    });

    const markerTexture = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 64;
      const ctx = cv.getContext("2d");
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,0.85)");
      g.addColorStop(0.55, "rgba(245,194,66,0.35)");
      g.addColorStop(1, "rgba(245,194,66,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
      const tex = new THREE.CanvasTexture(cv);
      tex.flipY = false;
      return tex;
    })();

    const markers = [];
    const allCities = CITY_PAIRS.flat();
    allCities.forEach((city, idx) => {
      if (idx % 2 !== 0 && idx !== 0) return;
      const v = latLonToVec3(city[0], city[1], SPHERE_R + 0.02);
      const mat = new THREE.SpriteMaterial({
        map: markerTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.7,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(v);
      sprite.scale.set(0.14, 0.14, 1);
      globe.add(sprite);
      markers.push({ sprite, material: mat, phase: Math.random() * Math.PI * 2 });
    });

    scene.add(new THREE.AmbientLight(0x080a0e, 0.4));
    const dirLight = new THREE.DirectionalLight(0xf5c242, 0.9);
    dirLight.position.set(3, 2, 3);
    scene.add(dirLight);
    const rimLight = new THREE.DirectionalLight(0xd4a017, 0.6);
    rimLight.position.set(-4, 1, -2);
    scene.add(rimLight);
    const fillLight = new THREE.DirectionalLight(0x1a2a3a, 0.2);
    fillLight.position.set(0, -3, 2);
    scene.add(fillLight);

    const sg = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 500; i++) {
      const v = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize().multiplyScalar(18 + Math.random() * 22);
      sp.push(v.x, v.y, v.z);
    }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
      color: 0xd4c8a0,
      size: 0.05,
      transparent: true,
      opacity: 0.45,
    })));

    let rafId;
    const startTime = performance.now();
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const elapsed = (performance.now() - startTime) / 1000;

      globe.rotation.y = elapsed * 0.05;

      markers.forEach((m) => {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.5 + m.phase);
        m.material.opacity = 0.25 + pulse * 0.65;
        const scale = 0.09 + pulse * 0.08;
        m.sprite.scale.set(scale, scale, 1);
      });

      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}