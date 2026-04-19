import { useEffect, useRef, useState } from "react";

/**
 * Simple pull-to-refresh for the window scroll (body).
 * Triggers `onRefresh` when the user pulls down >= threshold while at scrollTop=0.
 *
 * Returns { pulling, distance, refreshing } — use to render a visual indicator.
 */
export function usePullToRefresh({ onRefresh, threshold = 70, max = 120 }) {
  const [distance, setDistance] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(null);
  const active = useRef(false);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (e) => {
      if (!active.current || startY.current == null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        setDistance(0);
        setPulling(false);
        return;
      }
      // Resistance curve
      const d = Math.min(max, delta * 0.5);
      setDistance(d);
      setPulling(d > 10);
    };

    const onTouchEnd = async () => {
      if (!active.current) return;
      active.current = false;
      const d = distance;
      startY.current = null;
      if (d >= threshold && !refreshing) {
        setRefreshing(true);
        setDistance(threshold);
        try { await onRefresh?.(); } finally {
          setRefreshing(false);
          setDistance(0);
          setPulling(false);
        }
      } else {
        setDistance(0);
        setPulling(false);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [distance, refreshing, threshold, max, onRefresh]);

  return { distance, pulling, refreshing };
}