import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Makes an element draggable around the viewport via a drag-handle.
 * Position persists in localStorage under `storageKey`.
 * Returns { containerRef, handleRef, position, dragging }.
 */
export default function useDraggable({ storageKey, defaultPosition }) {
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const [position, setPosition] = useState(() => {
    if (typeof window === "undefined") return defaultPosition;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultPosition;
  });
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  const clamp = useCallback((x, y) => {
    const el = containerRef.current;
    if (!el) return { x, y };
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const maxX = window.innerWidth - w - 8;
    const maxY = window.innerHeight - h - 8;
    return {
      x: Math.max(8, Math.min(maxX, x)),
      y: Math.max(8, Math.min(maxY, y)),
    };
  }, []);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const onDown = (e) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      offsetRef.current = { x: point.clientX - rect.left, y: point.clientY - rect.top };
      setDragging(true);
      e.preventDefault();
    };
    handle.addEventListener("mousedown", onDown);
    handle.addEventListener("touchstart", onDown, { passive: false });
    return () => {
      handle.removeEventListener("mousedown", onDown);
      handle.removeEventListener("touchstart", onDown);
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const point = e.touches ? e.touches[0] : e;
      const next = clamp(point.clientX - offsetRef.current.x, point.clientY - offsetRef.current.y);
      setPosition(next);
    };
    const onUp = () => {
      setDragging(false);
      try { localStorage.setItem(storageKey, JSON.stringify(position)); } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, clamp, storageKey, position]);

  // Keep inside viewport on resize
  useEffect(() => {
    const onResize = () => setPosition((p) => clamp(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  return { containerRef, handleRef, position, dragging };
}