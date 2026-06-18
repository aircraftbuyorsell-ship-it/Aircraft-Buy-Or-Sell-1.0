import { useRef, useEffect, useCallback, useState } from "react";

function geo2xyz(lat, lon) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

function project(x, y, z, rotY, cx, cy, R) {
  const cosRY = Math.cos(rotY), sinRY = Math.sin(rotY);
  const rx = x * cosRY + z * sinRY;
  const ry = y;
  const rz = -x * sinRY + z * cosRY;
  const fov = 3.2 / (3.2 + rz);
  return { px: cx + rx * R * fov, py: cy - ry * R * fov, fov, visible: rz < 0.95 };
}

function arcPath(ctx, value, isLat, rotY, cx, cy, R, steps = 60) {
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= steps; i++) {
    const deg = (i / steps) * 360;
    const lat = isLat ? value : 90 - deg;
    const lon = isLat ? deg - 180 : value;
    const p = geo2xyz(lat, lon);
    const { px, py, visible } = project(p.x, p.y, p.z, rotY, cx, cy, R);
    if (visible) {
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    } else {
      started = false;
    }
  }
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
  const rafRef = useRef(null);
  const rotYRef = useRef(-Math.PI / 2);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);

  const [groundCount, setGroundCount] = useState(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    if (w === 0 || h === 0) return;

    const cx = w / 2, cy = h / 2;
    const R = Math.min(cx, cy) * 0.7;
    const rotY = rotYRef.current;

    ctx.clearRect(0, 0, w, h);

    // 1. Sphere fill
    const sphereGrad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.35, R * 0.05, cx, cy, R);
    sphereGrad.addColorStop(0, "#4a8fcc");
    sphereGrad.addColorStop(0.45, "#1a3a5c");
    sphereGrad.addColorStop(0.85, "#081428");
    sphereGrad.addColorStop(1, "#040c18");
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 2. Atmosphere glow ring
    const atmoGrad = ctx.createRadialGradient(cx, cy, R * 0.90, cx, cy, R * 1.18);
    atmoGrad.addColorStop(0, "rgba(0,194,203,0.18)");
    atmoGrad.addColorStop(0.5, "rgba(0,194,203,0.06)");
    atmoGrad.addColorStop(1, "transparent");
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
    ctx.fill();

    // 3. Clip to sphere
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2);
    ctx.clip();

    // 4. Latitude grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 0.6;
    for (const lat of [-60, -30, 0, 30, 60]) {
      arcPath(ctx, lat, true, rotY, cx, cy, R);
      ctx.stroke();
    }

    // 5. Longitude grid lines
    for (const lon of [0, 30, 60, 90, 120, 150, 180, -150, -120, -90, -60, -30]) {
      arcPath(ctx, lon, false, rotY, cx, cy, R);
      ctx.stroke();
    }

    // 6. Listing dots (gold diamonds)
    let ground = 0;
    for (const dot of listingDots) {
      const p = geo2xyz(dot.lat, dot.lon);
      const { px, py, fov, visible } = project(p.x, p.y, p.z, rotY, cx, cy, R);
      if (!visible) continue;
      const ds = 5.5 * fov;
      ctx.fillStyle = "rgba(212,160,23,0.92)";
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(px, py - ds);
      ctx.lineTo(px + ds * 0.7, py);
      ctx.lineTo(px, py + ds);
      ctx.lineTo(px - ds * 0.7, py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 7. Traffic dots
    for (const dot of trafficDots) {
      const p = geo2xyz(dot.lat, dot.lon);
      const { px, py, fov, visible } = project(p.x, p.y, p.z, rotY, cx, cy, R);
      if (!visible) continue;

      if (dot.onGround) {
        ground++;
        ctx.fillStyle = "rgba(255,210,60,0.85)";
        ctx.beginPath();
        ctx.arc(px, py, 2.2 * fov, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Outer pulse ring
        ctx.fillStyle = "rgba(0,194,203,0.22)";
        ctx.beginPath();
        ctx.arc(px, py, 4.5 * fov, 0, Math.PI * 2);
        ctx.fill();
        // Core dot
        ctx.fillStyle = "rgba(0,194,203,0.90)";
        ctx.beginPath();
        ctx.arc(px, py, 2.8 * fov, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    setGroundCount(ground);

    ctx.restore();

    // 9. Edge shadow
    const edgeGrad = ctx.createRadialGradient(cx, cy, R * 0.62, cx, cy, R);
    edgeGrad.addColorStop(0, "transparent");
    edgeGrad.addColorStop(0.75, "rgba(0,0,0,0.25)");
    edgeGrad.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = edgeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // 10. Specular highlight
    const specGrad = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.02, cx - R * 0.15, cy - R * 0.2, R * 0.55);
    specGrad.addColorStop(0, "rgba(255,255,255,0.09)");
    specGrad.addColorStop(1, "transparent");
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }, [trafficDots, listingDots]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
    };
    resize();

    const loop = (time) => {
      const delta = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;

      if (autoRotate && !draggingRef.current) {
        rotYRef.current += rotateSpeed * delta;
      }

      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, autoRotate, rotateSpeed, size]);

  const handlePointerDown = (e) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    canvasRef.current?.style.setProperty("cursor", "grabbing");
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    rotYRef.current += (e.clientX - lastXRef.current) * 0.005;
    lastXRef.current = e.clientX;
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
    canvasRef.current?.style.setProperty("cursor", "grab");
  };

  const handleTouchStart = (e) => {
    draggingRef.current = true;
    lastXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!draggingRef.current) return;
    rotYRef.current += (e.touches[0].clientX - lastXRef.current) * 0.005;
    lastXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    draggingRef.current = false;
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          borderRadius: "50%",
          cursor: "grab",
          filter: "drop-shadow(0 0 28px rgba(0,194,203,0.20)) drop-shadow(0 8px 32px rgba(0,0,0,0.50))",
        }}
      />

      {/* Legend overlay */}
      <div style={{
        position: "absolute",
        bottom: 10,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 14,
        padding: "4px 12px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(255,255,255,0.10)",
        fontSize: 10,
        fontWeight: 700,
        whiteSpace: "nowrap",
        color: "rgba(255,255,255,0.6)",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(0,194,203,0.90)" }} />
          Traffic ({trafficDots.length})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ display: "inline-block", width: 0, height: 0, borderLeft: "3.5px solid transparent", borderRight: "3.5px solid transparent", borderBottom: "6px solid rgba(212,160,23,0.92)" }} />
          Listings ({listingDots.length})
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,210,60,0.85)" }} />
          Ground ({groundCount})
        </span>
      </div>
    </div>
  );
}