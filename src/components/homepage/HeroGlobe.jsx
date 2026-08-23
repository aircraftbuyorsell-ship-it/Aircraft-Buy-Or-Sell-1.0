import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useTheme } from "@/lib/useTheme";

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
  const isDark = useTheme();

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
    camera.position.set(0, 0.3, 6.2);

    const globe = new THREE.Group();
    scene.add(globe);

    const SPHERE_R = 1.8;
    const GOLD = 0xf5c242;

    // ── Sphere ── light: matte aluminum; dark: deep space
    const sphereMat = new THREE.MeshPhongMaterial({
      color: isDark ? 0x0A0E14 : 0x2a2a35,
      emissive: isDark ? 0x05080c : 0x0d0d12,
      shininess: isDark ? 4 : 28,
      specular: isDark ? 0x0a0f1a : 0xb0b0b0,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(SPHERE_R, 64, 64), sphereMat);
    globe.add(sphere);

    // ── Rivet texture ── circular dot with raised-head gradient
    const rivetTexture = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 32;
      const ctx = cv.getContext("2d");
      const g = ctx.createRadialGradient(16, 14, 0, 16, 16, 16);
      if (isDark) {
        // Classic gold rivet
        g.addColorStop(0, "rgba(255,222,130,1)");
        g.addColorStop(0.3, "rgba(212,160,23,0.85)");
        g.addColorStop(0.7, "rgba(166,124,0,0.35)");
        g.addColorStop(1, "rgba(166,124,0,0)");
      } else {
        // Brushed aluminum rivet — strong dark contrast on dark light-mode sphere
        g.addColorStop(0, "rgba(245,200,66,1)");
        g.addColorStop(0.3, "rgba(212,160,23,0.9)");
        g.addColorStop(0.7, "rgba(166,124,0,0.4)");
        g.addColorStop(1, "rgba(166,124,0,0)");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
      const tex = new THREE.CanvasTexture(cv);
      tex.flipY = false;
      return tex;
    })();

    // ── Rivet positions ── dots along parallels & meridians
    const rivetPositions = [];
    const rr = SPHERE_R + 0.006;

    // Parallels (latitude rings)
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lon = 0; lon < 360; lon += 5) {
        const v = latLonToVec3(lat, lon, rr);
        rivetPositions.push(v.x, v.y, v.z);
      }
    }
    // Meridians (longitude lines)
    for (let lon = 0; lon < 360; lon += 30) {
      for (let lat = -78; lat <= 78; lat += 5) {
        const v = latLonToVec3(lat, lon, rr);
        rivetPositions.push(v.x, v.y, v.z);
      }
    }

    const rivetGeo = new THREE.BufferGeometry();
    rivetGeo.setAttribute("position", new THREE.Float32BufferAttribute(rivetPositions, 3));
    const rivets = new THREE.Points(rivetGeo, new THREE.PointsMaterial({
      map: rivetTexture,
      size: 0.038,
      transparent: true,
      alphaTest: 0.06,
      depthWrite: false,
      sizeAttenuation: true,
      opacity: isDark ? 0.88 : 0.85,
    }));
    globe.add(rivets);

    // ── Flight path arcs ──
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
        opacity: isDark ? 0.55 : 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      arcGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
    });

    // ── City markers ──
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

    // ── Lights ── bright for aluminum, moody for dark
    scene.add(new THREE.AmbientLight(isDark ? 0x1a2030 : 0x6a6a78, isDark ? 0.5 : 0.35));
    const dirLight = new THREE.DirectionalLight(0xfff1d6, isDark ? 1.1 : 1.4);
    dirLight.position.set(3, 2, 3);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(isDark ? 0x4a6a9a : 0x8090a8, isDark ? 0.25 : 0.4);
    fillLight.position.set(-3, -1, -2);
    scene.add(fillLight);

    // ── Stars ── dark mode only
    if (isDark) {
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
        color: 0x8fa8cc,
        size: 0.05,
        transparent: true,
        opacity: 0.5,
      })));
    }

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
  }, [isDark]);

  return (
    <div ref={containerRef} className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}