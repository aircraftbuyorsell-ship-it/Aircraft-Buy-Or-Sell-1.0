import { useEffect, useRef } from "react";
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

function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function makeGlowTexture(isDark) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.92)");
  gradient.addColorStop(0.55, isDark ? "rgba(245,194,66,0.32)" : "rgba(21,124,111,0.24)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  return texture;
}

export default function HeroGlobe({ variant = "hero", forceDark }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const themeIsDark = useTheme();
  const isDark = forceDark ?? themeIsDark;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1 : 1.18;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.2, variant === "signals" ? 6.6 : 6.1);

    const globe = new THREE.Group();
    scene.add(globe);

    const radius = 1.8;
    const gold = 0xd4a017;
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 72, 72),
      new THREE.MeshPhongMaterial({
        color: isDark ? 0x080b10 : 0xe7eaee,
        emissive: isDark ? 0x020406 : 0x111315,
        shininess: isDark ? 5 : 72,
        specular: isDark ? 0x18202b : 0xffffff,
      })
    );
    globe.add(sphere);

    const rivetPositions = [];
    const rivetRadius = radius + 0.008;
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lon = 0; lon < 360; lon += 5) {
        const point = latLonToVec3(lat, lon, rivetRadius);
        rivetPositions.push(point.x, point.y, point.z);
      }
    }
    for (let lon = 0; lon < 360; lon += 30) {
      for (let lat = -78; lat <= 78; lat += 5) {
        const point = latLonToVec3(lat, lon, rivetRadius);
        rivetPositions.push(point.x, point.y, point.z);
      }
    }
    const rivetGeometry = new THREE.BufferGeometry();
    rivetGeometry.setAttribute("position", new THREE.Float32BufferAttribute(rivetPositions, 3));
    globe.add(new THREE.Points(rivetGeometry, new THREE.PointsMaterial({
      color: isDark ? 0xc99a1a : 0x9b7a22,
      size: isDark ? 0.022 : 0.016,
      transparent: true,
      opacity: isDark ? 0.68 : 0.38,
      depthWrite: false,
      sizeAttenuation: true,
    })));

    const arcGroup = new THREE.Group();
    globe.add(arcGroup);
    CITY_PAIRS.forEach(([from, to], index) => {
      const a = latLonToVec3(from[0], from[1], radius + 0.01);
      const b = latLonToVec3(to[0], to[1], radius + 0.01);
      const control = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(2.45 + (index % 3) * 0.08);
      const curve = new THREE.QuadraticBezierCurve3(a, control, b);
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 64, variant === "signals" ? 0.009 : 0.007, 8, false),
        new THREE.MeshBasicMaterial({
          color: gold,
          transparent: true,
          opacity: isDark ? 0.58 : 0.68,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      arcGroup.add(mesh);
    });

    const glowTexture = makeGlowTexture(isDark);
    const markerColors = [0xd4a017, 0x1a9f8b, 0x2f80ed];
    const markers = [];
    CITY_PAIRS.flat().filter((_, index) => index % 2 === 0).forEach((city, index) => {
      const material = new THREE.SpriteMaterial({
        map: glowTexture,
        color: markerColors[index % markerColors.length],
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(latLonToVec3(city[0], city[1], radius + 0.025));
      sprite.scale.set(0.14, 0.14, 1);
      globe.add(sprite);
      markers.push({ sprite, material, phase: index * 0.7 });
    });

    scene.add(new THREE.AmbientLight(isDark ? 0x273244 : 0xffffff, isDark ? 0.52 : 1.35));
    const keyLight = new THREE.DirectionalLight(isDark ? 0xffe6ae : 0xffffff, isDark ? 1.05 : 2.2);
    keyLight.position.set(3.5, 2.5, 4);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(isDark ? 0x3f6b7f : 0xb8c4d4, isDark ? 0.35 : 0.85);
    fillLight.position.set(-4, -1, 2);
    scene.add(fillLight);

    if (isDark) {
      const starGeometry = new THREE.BufferGeometry();
      const stars = [];
      for (let index = 0; index < 420; index += 1) {
        const point = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize().multiplyScalar(14 + Math.random() * 24);
        stars.push(point.x, point.y, point.z);
      }
      starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(stars, 3));
      scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({
        color: 0x8096a8,
        size: 0.04,
        transparent: true,
        opacity: variant === "signals" ? 0.36 : 0.48,
      })));
    }

    let width = 0;
    let height = 0;
    const placeGlobe = () => {
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();

      const desktop = width >= 900;
      if (variant === "signals") {
        globe.position.set(desktop ? 0.45 : 0.15, 0.05, 0);
        globe.scale.setScalar(desktop ? 1.03 : 0.88);
      } else {
        globe.position.set(desktop ? 1.18 : 0.52, desktop ? 0.02 : -0.32, 0);
        globe.scale.setScalar(desktop ? 1.2 : 0.9);
      }
    };
    placeGlobe();

    const pointer = { dragging: false, x: 0, y: 0 };
    let manualX = 0;
    let manualY = 0;
    const onPointerDown = (event) => {
      pointer.dragging = true;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!pointer.dragging) return;
      manualY += (event.clientX - pointer.x) * 0.0045;
      manualX += (event.clientY - pointer.y) * 0.0035;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    };
    const onPointerUp = (event) => {
      pointer.dragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", placeGlobe);

    let rafId;
    const start = performance.now();
    const render = () => {
      rafId = requestAnimationFrame(render);
      const elapsed = (performance.now() - start) / 1000;
      globe.rotation.y = manualY + (reducedMotion ? 0.28 : elapsed * (variant === "signals" ? 0.032 : 0.045));
      globe.rotation.x = Math.max(-0.35, Math.min(0.35, manualX));
      markers.forEach((marker) => {
        const pulse = reducedMotion ? 0.65 : 0.5 + 0.5 * Math.sin(elapsed * 1.4 + marker.phase);
        marker.material.opacity = 0.32 + pulse * 0.58;
        const scale = 0.1 + pulse * 0.08;
        marker.sprite.scale.set(scale, scale, 1);
      });
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", placeGlobe);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
        else object.material?.dispose?.();
      });
      glowTexture.dispose();
      renderer.dispose();
    };
  }, [isDark, variant]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        aria-label={variant === "signals" ? "Interactive global aviation signals" : "Interactive global aircraft network"}
      />
    </div>
  );
}
