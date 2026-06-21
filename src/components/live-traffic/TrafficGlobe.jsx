import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

// DS v3 altitude palette (meters → color)
export function altColor(altM) {
  if (altM == null) return "#888888";
  const ft = altM * 3.28084;
  if (ft < 5000) return "#e24b4a";
  if (ft < 15000) return "#f5c242";
  if (ft < 30000) return "#5dcaa5";
  return "#4e8ef7";
}

function latLngTo3D(lat, lng, r = 2.02) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// Circular white sprite texture for points
function makeCircleTexture() {
  const size = 32;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d");
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

export default function TrafficGlobe({ aircraft, onSelect, selected }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const acRef = useRef([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // ── Init scene once ──
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#04060a");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Globe group (rotates)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Globe sphere
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2, 64, 64),
      new THREE.MeshPhongMaterial({ color: "#0a1628", emissive: "#04060a", shininess: 8 })
    );
    globeGroup.add(globe);

    // Wireframe overlay
    const wire = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.SphereGeometry(2, 32, 32)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06 })
    );
    globeGroup.add(wire);

    // Lights
    scene.add(new THREE.AmbientLight(0x222244, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(5, 3, 5);
    scene.add(dir);
    const amber = new THREE.PointLight(0xf5c242, 0.3);
    amber.position.set(-5, 2, -3);
    scene.add(amber);

    // Markers container in the globe group
    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);

    // Selection ring sprite
    const ringTex = makeCircleTexture();
    const ringMat = new THREE.SpriteMaterial({ map: ringTex, color: 0xf5c242, transparent: true, opacity: 0.9, depthTest: false });
    const ring = new THREE.Sprite(ringMat);
    ring.scale.set(0.12, 0.12, 0.12);
    ring.visible = false;
    globeGroup.add(ring);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.04;
    const mouse = new THREE.Vector2();

    Object.assign(stateRef.current, {
      scene, camera, renderer, globeGroup, markerGroup, ring,
      raycaster, mouse, points: null,
      isDragging: false, prevX: 0, prevY: 0, autoRotate: true,
    });

    // ── Interaction ──
    const dom = renderer.domElement;

    const getXY = (e) => {
      const t = e.touches?.[0] || e.changedTouches?.[0] || e;
      return { x: t.clientX, y: t.clientY };
    };

    const onDown = (e) => {
      const { x, y } = getXY(e);
      const s = stateRef.current;
      s.isDragging = true;
      s.moved = false;
      s.prevX = x;
      s.prevY = y;
      s.autoRotate = false;
    };

    const onMove = (e) => {
      const s = stateRef.current;
      if (!s.isDragging) return;
      const { x, y } = getXY(e);
      const dx = x - s.prevX;
      const dy = y - s.prevY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) s.moved = true;
      s.globeGroup.rotation.y += dx * 0.005;
      s.globeGroup.rotation.x += dy * 0.005;
      s.globeGroup.rotation.x = Math.max(-1.2, Math.min(1.2, s.globeGroup.rotation.x));
      s.prevX = x;
      s.prevY = y;
    };

    const onUp = (e) => {
      const s = stateRef.current;
      const wasDrag = s.moved;
      s.isDragging = false;
      setTimeout(() => { s.autoRotate = true; }, 2500);
      if (wasDrag) return;
      // Treat as click → raycast
      const rect = dom.getBoundingClientRect();
      const { x, y } = getXY(e);
      s.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
      s.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
      if (!s.points) return;
      s.raycaster.setFromCamera(s.mouse, s.camera);
      const hits = s.raycaster.intersectObject(s.points);
      if (hits.length > 0) {
        const idx = hits[0].index;
        const ac = acRef.current[idx];
        if (ac) onSelectRef.current?.(ac);
      } else {
        onSelectRef.current?.(null);
      }
    };

    dom.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    dom.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    // ── Resize ──
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Animate ──
    let raf;
    const animate = () => {
      const s = stateRef.current;
      if (s.autoRotate) s.globeGroup.rotation.y += 0.0005;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      dom.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      dom.removeEventListener("touchstart", onDown);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (dom.parentNode) dom.parentNode.removeChild(dom);
    };
  }, []);

  // ── Rebuild markers when aircraft change ──
  const buildPoints = useCallback((list) => {
    const s = stateRef.current;
    if (!s.markerGroup) return;

    // Clear old points
    if (s.points) {
      s.markerGroup.remove(s.points);
      s.points.geometry.dispose();
      s.points.material.dispose();
      s.points = null;
    }

    const valid = list.filter((a) => a.latitude != null && a.longitude != null);
    acRef.current = valid;
    if (valid.length === 0) return;

    const positions = new Float32Array(valid.length * 3);
    const colors = new Float32Array(valid.length * 3);
    const col = new THREE.Color();

    valid.forEach((a, i) => {
      const p = latLngTo3D(a.latitude, a.longitude);
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      col.set(a.on_ground ? "#888888" : altColor(a.baro_altitude));
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 4.0,
      sizeAttenuation: false,
      map: makeCircleTexture(),
      vertexColors: true,
      transparent: true,
      alphaTest: 0.4,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    s.markerGroup.add(points);
    s.points = points;
  }, []);

  useEffect(() => {
    buildPoints(aircraft || []);
  }, [aircraft, buildPoints]);

  // ── Move selection ring ──
  useEffect(() => {
    const s = stateRef.current;
    if (!s.ring) return;
    if (selected && selected.latitude != null && selected.longitude != null) {
      const p = latLngTo3D(selected.latitude, selected.longitude, 2.03);
      s.ring.position.copy(p);
      s.ring.visible = true;
    } else {
      s.ring.visible = false;
    }
  }, [selected]);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, cursor: "grab" }} />;
}