import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const DISPLAY_MS = 4000; // how long each card stays visible

/**
 * RocketMetrics — dark neon-pill rotating metric carousel.
 * Auto-advances, pauses on hover, and supports click-to-jump dots.
 */
export default function RocketMetrics({ metrics = [] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trajectory = useRef({ entryY: 0, exitY: 0 });

  // Guard: reset index if it falls outside the metrics range
  useEffect(() => {
    if (index >= metrics.length && metrics.length > 0) {
      setIndex(0);
    }
  }, [index, metrics.length]);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % metrics.length);
  }, [metrics.length]);

  // Recompute trajectory once per index change (not during render)
  useEffect(() => {
    trajectory.current = {
      entryY: (Math.random() - 0.5) * 30,
      exitY: (Math.random() - 0.5) * 30,
    };
  }, [index]);

  useEffect(() => {
    if (metrics.length === 0 || paused) return;
    const t = setTimeout(advance, DISPLAY_MS);
    return () => clearTimeout(t);
  }, [index, metrics.length, paused, advance]);

  if (metrics.length === 0) return null;

  const m = metrics[index];
  const { entryY, exitY } = trajectory.current;

  return (
    <div
      className="relative h-28 overflow-hidden flex items-center justify-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ x: 320, y: entryY, opacity: 0, scale: 0.7, rotate: -8 }}
          animate={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          exit={{ x: -320, y: exitY, opacity: 0, scale: 0.7, rotate: 8 }}
          transition={{
            x: { type: "spring", stiffness: 80, damping: 14, duration: 1.2 },
            y: { type: "spring", stiffness: 120, damping: 12, duration: 0.9 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.5 },
            rotate: { duration: 0.6 },
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Link to={m.link} className="no-underline w-full max-w-md" aria-label={`${m.label}: ${m.value}`}>
            <div
              className="rounded-full px-8 py-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              style={{
                background: "#1a1a1a",
                border: `1.5px solid ${m.color}40`,
                boxShadow: `0 0 24px ${m.color}30, 0 0 48px ${m.color}15, inset 0 0 12px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Label — top center */}
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.55)" }}>
                {m.label}
              </p>

              {/* Large value — center */}
              <p className="text-2xl font-black tracking-tight leading-none" style={{ color: "#ffffff" }}>
                {m.value}
              </p>

              {/* Progress dots — bottom center, click to jump */}
              <div className="flex gap-1.5 mt-0.5">
                {metrics.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIndex(i);
                    }}
                    className="rounded-full transition-all cursor-pointer"
                    style={{
                      width: 5,
                      height: 5,
                      background: m.color,
                      opacity: i === index ? 1 : 0.25,
                      boxShadow: i === index ? `0 0 6px ${m.color}` : "none",
                      border: "none",
                      padding: 0,
                    }}
                    aria-label={`Go to metric ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}