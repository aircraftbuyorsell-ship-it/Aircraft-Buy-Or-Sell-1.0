import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three/examples/jsm/controls/OrbitControls.js";
import { MODE_CONFIG, DEFAULT_ROUTES } from "./globe/globeConfig";
import { latLngToVec3, fibonacciSphere, vec3ToLatLng, fbm } from "./globe/globeUtils";
import { globeVertexShader, globeFragmentShader } from "./globe/GlobeShader";
import { getAircraftStatusLabel } from "@/hooks/useHeroAircraft";

/**
 * HeroGlobe — pure imperative three.js implementation.
 *
 * R3F v8.18's reconciler (applyProps) crashes against three 0.185 with
 * "Cannot read properties of undefined (reading 'source')". To eliminate the
 * reconciler entirely, the scene is built and driven imperatively inside a
 * single useEffect — no <Canvas>, no applyProps, no createInstance.
 *
 * Props:
 *  - mode:           "hero" | "dashboard" | "sidebar" | "background"
 *  - interactive:    enable/disable OrbitControls
 *  - routes:         [{ startLat, startLng, endLat, endLng, altitude?, color? }]
 *  - activeAircraft: optional aircraft record → pulsing signal + HTML label
 */
const SIGNAL_LAT = 40.7128;
const SIGNAL_LNG = -74.006;
const TRAIL = [0, 0.02, 0.045];

// Land-dot geometry (non-hook version of useGlobeGeometry).
function buildDotGeometry(count, radius) {
  const pts = fibonacciSphere(count);
  const pos = [], col = [], siz = [], lnd = [];
  const SILVER = new THREE.Color("#AEB3BC");
  const SILVER_BRIGHT = new THREE.Color("#E6E9EF");
  const PLATINUM = new THREE.Color("#C9CDD2");
  const tmp = new THREE.Color();
  const hash01 = (i) => {
    const s = Math.sin(i * 91.345 + 17.1) * 43758.5453;
    return s - Math.floor(s);
  };

  for (let i = 0; i < count; i++) {
    const [x, y, z] = pts[i];
    const { lat, lng } = vec3ToLatLng(x, y, z);
    const n = fbm(lng * 0.035 + 13.2, lat * 0.06 + 4.7, 4);
    const latBias = 1 - Math.pow(Math.abs(lat) / 90, 1.5) * 0.35;
    if (n * latBias <= 0.48) continue; // ocean → no dot
    const v = hash01(i);
    tmp.copy(SILVER).lerp(SILVER_BRIGHT, v * 0.6).lerp(PLATINUM, v * 0.25);
    pos.push(x, y, z);
    col.push(tmp.r, tmp.g, tmp.b);
    siz.push(0.9 + v * 0.7);
    lnd.push(1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(col), 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(siz), 1));
  geo.setAttribute("aLand", new THREE.BufferAttribute(new Float32Array(lnd), 1));
  return geo;
}

export default function HeroGlobe({
  mode = "hero",
  interactive = true,
  routes,
  activeAircraft,
}) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.hero;
  const effectiveRoutes = routes && routes.length ? routes : DEFAULT_ROUTES;
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Scene + camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, cfg.cameraDist);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const pLight = new THREE.PointLight(0xffffff, 1.2);
    pLight.position.set(3, 2, 4);
    scene.add(pLight);

    // Dot field
    const dotGeo = buildDotGeometry(cfg.count, cfg.radius);
    const uniforms = {
      uTime: { value: 0 },
      uSize: { value: cfg.dotScale },
      uRadius: { value: cfg.radius },
    };
    const dotMat = new THREE.ShaderMaterial({
      vertexShader: globeVertexShader,
      fragmentShader: globeFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
    });
    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    // Route arcs + animated pulse trails
    const arcs = effectiveRoutes.map((r) => {
      const start = new THREE.Vector3(...latLngToVec3(r.startLat, r.startLng, cfg.radius));
      const end = new THREE.Vector3(...latLngToVec3(r.endLat, r.endLng, cfg.radius));
      const alt = typeof r.altitude === "number" ? r.altitude : 0.22;
      const ctrl = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(cfg.radius * (1 + alt));
      const curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
      const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
      const color = new THREE.Color(r.color || "#E8C56B");
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      const pulseMeshes = TRAIL.map((_, j) => {
        const m = new THREE.Mesh(
          new THREE.SphereGeometry(0.014, 10, 10),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: j === 0 ? 0.95 : 0.5 / j,
            depthWrite: false,
          })
        );
        scene.add(m);
        return m;
      });
      return { curve, line, pulseMeshes, color };
    });

    // Aircraft signal marker + HTML label
    let signalCore = null, signalHalo = null, labelEl = null;
    const [sx, sy, sz] = latLngToVec3(SIGNAL_LAT, SIGNAL_LNG, cfg.radius);
    if (activeAircraft) {
      signalCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 16, 16),
        new THREE.MeshBasicMaterial({ color: "#4adaa1", transparent: true, opacity: 0.95 })
      );
      signalCore.position.set(sx, sy, sz);
      scene.add(signalCore);

      signalHalo = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 16, 16),
        new THREE.MeshBasicMaterial({ color: "#4adaa1", transparent: true, opacity: 0.22, depthWrite: false })
      );
      signalHalo.position.set(sx, sy, sz);
      scene.add(signalHalo);

      labelEl = document.createElement("div");
      labelEl.className =
        "pointer-events-none absolute z-10 whitespace-nowrap rounded-full border border-black/5 bg-white/95 px-3 py-1.5 text-[11px] font-medium shadow-md";
      labelEl.style.transform = "translate(-50%, -50%)";
      labelEl.style.willChange = "left, top";
      labelEl.textContent = `${activeAircraft.registration} · ${getAircraftStatusLabel(activeAircraft)}`;
      mount.appendChild(labelEl);
    }

    // Controls
    const controls = new OrbitControlsImpl(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableRotate = interactive;
    controls.enableZoom = interactive && cfg.zoom;
    controls.enablePan = false;
    controls.autoRotate = cfg.autoRotate;
    controls.autoRotateSpeed = 0.4;
    controls.rotateSpeed = cfg.rotateSpeed;
    controls.minDistance = 1.4;
    controls.maxDistance = 5;

    // Animation loop
    const clock = new THREE.Clock();
    const labelVec = new THREE.Vector3();
    let raf = 0;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      uniforms.uTime.value = t;
      controls.update();

      arcs.forEach((arc, i) => {
        TRAIL.forEach((off, j) => {
          const mesh = arc.pulseMeshes[j];
          let p = (t * 0.12 + i * 0.19 - off) % 1;
          if (p < 0) p += 1;
          mesh.position.copy(arc.curve.getPointAt(p));
          mesh.scale.setScalar(j === 0 ? 1 : 0.7 / j);
        });
      });

      if (signalHalo) signalHalo.scale.setScalar(1 + 0.28 * Math.sin(t * 3));

      if (labelEl) {
        labelVec.set(sx, sy, sz).project(camera);
        const w = mount.clientWidth, h = mount.clientHeight;
        labelEl.style.left = `${(labelVec.x * 0.5 + 0.5) * w}px`;
        labelEl.style.top = `${(-labelVec.y * 0.5 + 0.5) * h}px`;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const onResize = () => {
      const w = mount.clientWidth || 1, h = mount.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // Cleanup
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
          else obj.material.dispose?.();
        }
      });
      if (labelEl) labelEl.remove();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, interactive, JSON.stringify(effectiveRoutes), activeAircraft?.id]);

  return (
    <div
      className={`relative ${cfg.container}`}
      style={{ touchAction: "none", pointerEvents: interactive ? "auto" : "none" }}
    >
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}