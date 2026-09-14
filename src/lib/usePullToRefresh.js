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
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

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
        if (distanceRef.current !== 0) {
          distanceRef.current = 0;
          setDistance(0);
          setPulling(false);
        }
        return;
      }
      // Resistance curve
      const d = Math.min(max, delta * 0.5);
      distanceRef.current = d;
      setDistance(d);
      setPulling(d > 10);
    };

    const onTouchEnd = async () => {
      if (!active.current) return;
      active.current = false;
      const d = distanceRef.current;
      startY.current = null;
      if (d >= threshold && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        setDistance(threshold);
        try {
          await onRefreshRef.current?.();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setDistance(0);
          setPulling(false);
          distanceRef.current = 0;
        }
      } else {
        distanceRef.current = 0;
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
  }, [threshold, max]);

  return { distance, pulling, refreshing };
}