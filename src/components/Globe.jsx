import { useRef, useEffect, useCallback, useState } from "react";

const PI = Math.PI;

function geo2xyz(lat, lon) {
  const phi = ((90 - lat) * PI) / 180;
  const theta = (lon * PI) / 180;
  return [
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  ];
}

function project(x, y, z, rotY, cx, cy, R) {
  const cs = Math.cos(rotY);
  const sn = Math.sin(rotY);
  const rx = x * cs + z * sn;
  const ry = y;
  const rz = -x * sn + z * cs;
  const fov = 3.2 / (3.2 + rz);
  const px = cx + rx * R * fov;
  const py = cy - ry * R * fov;
  return { px, py, fov, visible: rz < 0.93 };
}

function arcPath(ctx, value, isLat, rotY, cx, cy, R, steps = 60) {
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= steps; i++) {
    const deg = (i / steps) * 360;
    const lat = isLat ? value : 90 - (deg / 360) * 180;
    const lon = isLat ? deg - 180 : value;
    const [x, y, z] = geo2xyz(lat, lon);
    const { px, py, visible } = project(x, y, z, rotY, cx, cy, R);
    if (visible) {
      if (!started) { ctx.moveTo(px, py); started = true; }
      else { ctx.lineTo(px, py); }
    } else {
      started = false;
    }
  }
  ctx.stroke();
}

export default function Globe({
  size = 520,
  trafficDots = [],
  listingDots = [],
  autoRotate = true,
  rotateSpeed = 0.10,
  onDotClick,
}) {
  const canvasRef = useRef(null);
  const rotY = useRef(0);
  const rafRef = useRef(null);
  const dragRef = useRef({ active: false, px: 0, py: 0 });
  const lastTime = useRef(performance.now());
  const [counts, setCounts] = useState({ traffic: 0, listings: 0, ground: 0 });

  const R = size * 0.38;

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width;
    const H = cv.height;
    const cx = W / 2;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // 1. Sphere fill
    const sphereGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.05, cx, cy, R);
    sphereGrad.addColorStop(0, "#2a6090");
    sphereGrad.addColorStop(0.45, "#0f2a44");
    sphereGrad.addColorStop(1, "#040a14");
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();

    // 2. Atmosphere glow ring
    const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.90, cx, cy, R * 1.18);
    atmoGrad.addColorStop(0, "rgba(0,194,203,0)");
    atmoGrad.addColorStop(0.5, "rgba(0,194,203,0.18)");
    atmoGrad.addColorStop(1, "rgba(0,194,203,0)");
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.18, 0, PI * 2);
    ctx.fill();

    // 3. Clip to sphere
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 0.5, 0, PI * 2);
    ctx.clip();

    // 4 & 5. Grid
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 0.6;
    [-60, -30, 0, 30, 60].forEach((lat) => arcPath(ctx, lat, true, rotY.current, cx, cy, R));
    [0, 30, 60, 90, 120, 150, 180, -150, -120, -90, -60, -30].forEach((lon) => arcPath(ctx, lon, false, rotY.current, cx, cy, R));

    // 6. Listing dots (gold diamonds)
    listingDots.forEach((l) => {
      const [x, y, z] = geo2xyz(l.lat, l.lon);
      const { px, py, fov, visible } = project(x, y, z, rotY.current, cx, cy, R);
      if (!visible) return;
      const s = 5.5 * fov;
      ctx.fillStyle = "rgba(212,160,23,0.92)";
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(px, py - s);
      ctx.lineTo(px + s * 0.65, py);
      ctx.lineTo(px, py + s);
      ctx.lineTo(px - s * 0.65, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 7. Traffic dots
    trafficDots.forEach((t) => {
      const [x, y, z] = geo2xyz(t.lat, t.lon);
      const { px, py, fov, visible } = project(x, y, z, rotY.current, cx, cy, R);
      if (!visible) return;
      if (t.onGround) {
        ctx.fillStyle = "rgba(255,210,60,0.85)";
        ctx.beginPath();
        ctx.arc(px, py, 2.2 * fov, 0, PI * 2);
        ctx.fill();
      } else {
        // Outer pulse
        ctx.fillStyle = "rgba(0,194,203,0.22)";
        ctx.beginPath();
        ctx.arc(px, py, 4.8 * fov, 0, PI * 2);
        ctx.fill();
        // Core dot
        ctx.fillStyle = "rgba(0,194,203,0.90)";
        ctx.beginPath();
        ctx.arc(px, py, 2.8 * fov, 0, PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();

    // 9. Edge shadow
    const edgeGrad = ctx.createRadialGradient(cx, cy, R * 0.62, cx, cy, R);
    edgeGrad.addColorStop(0, "transparent");
    edgeGrad.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = edgeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();

    // 10. Specular highlight
    const specGrad = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.32, R * 0.02, cx - R * 0.05, cy - R * 0.05, R * 0.5);
    specGrad.addColorStop(0, "rgba(255,255,255,0.09)");
    specGrad.addColorStop(1, "transparent");
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();

    // Update counts
    const groundCount = trafficDots.filter((t) => t.onGround).length;
    setCounts({ traffic: trafficDots.length, listings: listingDots.length, ground: groundCount });
  }, [size, trafficDots, listingDots]);

  // Animation loop
  useEffect(() => {
    const animate = (time) => {
      const delta = (time - lastTime.current) / 1000;
      lastTime.current = time;
      if (autoRotate && !dragRef.current.active) {
        rotY.current += rotateSpeed * delta;
      }
      draw();
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [autoRotate, rotateSpeed, draw]);

  // Pointer event handlers
  const onPointerDown = (e) => {
    dragRef.current.active = true;
    dragRef.current.px = e.clientX;
    dragRef.current.py = e.clientY;
    canvasRef.current?.classList.add("cursor-grabbing");
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    rotY.current += (e.clientX - dragRef.current.px) * 0.005;
    dragRef.current.px = e.clientX;
    dragRef.current.py = e.clientY;
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
    canvasRef.current?.classList.remove("cursor-grabbing");
  };

  // Touch handlers
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragRef.current.active = true;
      dragRef.current.px = e.touches[0].clientX;
      dragRef.current.py = e.touches[0].clientY;
    }
  };
  const onTouchMove = (e) => {
    if (!dragRef.current.active || e.touches.length !== 1) return;
    rotY.current += (e.touches[0].clientX - dragRef.current.px) * 0.005;
    dragRef.current.px = e.touches[0].clientX;
    dragRef.current.py = e.touches[0].clientY;
  };
  const onTouchEnd = () => { dragRef.current.active = false; };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          cursor: dragRef.current.active ? "grabbing" : "grab",
          filter: "drop-shadow(0 0 28px rgba(0,194,203,0.20)) drop-shadow(0 8px 32px rgba(0,0,0,0.50))",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />
      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 14, fontSize: 10, fontWeight: 600,
        color: "rgba(255,255,255,0.55)",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(0,194,203,0.90)" }} /> Traffic ({counts.traffic})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 0, height: 0, borderLeft: "3.5px solid transparent", borderRight: "3.5px solid transparent", borderBottom: "7px solid rgba(212,160,23,0.92)" }} /> Listings ({counts.listings})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,210,60,0.85)" }} /> Ground ({counts.ground})
        </span>
      </div>
    </div>
  );
}