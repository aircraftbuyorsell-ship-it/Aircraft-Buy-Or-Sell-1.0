import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const DISPLAY_MS = 4000; // how long each card stays visible

/**
 * RocketMetrics — Core Platform dark rotating metric strip.
 * #111827 panel, no glassmorphism, accent trail.
 */
export default function RocketMetrics({ metrics = [] }) {
  const [index, setIndex] = useState(0);

  const mutedColor = "rgba(255,255,255,0.45)";

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % metrics.length);
  }, [metrics.length]);

  useEffect(() => {
    if (metrics.length === 0) return;
    const t = setTimeout(advance, DISPLAY_MS);
    return () => clearTimeout(t);
  }, [index, metrics.length, advance]);

  if (metrics.length === 0) return null;

  const m = metrics[index];

  // Randomize entry trajectory slightly
  const entryY = (Math.random() - 0.5) * 30;
  const exitY = (Math.random() - 0.5) * 30;

  return (
    <div className="relative h-16 overflow-hidden flex items-center justify-center">
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
          <Link to={m.link} className="no-underline w-full max-w-md">
            <div
              className="rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer"
              style={{
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: `0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px ${m.color}20`,
              }}
            >
              {/* Accent trail on the left */}
              <div
                className="w-1 h-10 rounded-full shrink-0 animate-pulse"
                style={{ background: m.color, boxShadow: `0 0 8px ${m.color}60` }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <m.icon className="w-3.5 h-3.5 shrink-0" style={{ color: m.color }} />
                  <p className="text-[8px] font-semibold tracking-wider uppercase" style={{ color: mutedColor }}>
                    {m.label}
                  </p>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-sm font-black tracking-tight leading-none" style={{ color: m.color }}>
                    {m.value}
                  </p>
                  <p className="text-[9px] leading-tight truncate" style={{ color: mutedColor }}>
                    {m.sub}
                  </p>
                </div>
              </div>

              {/* Progress dot indicator */}
              <div className="flex gap-1 shrink-0">
                {metrics.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all"
                    style={{
                      width: i === index ? 5 : 3,
                      height: i === index ? 5 : 3,
                      background: i === index ? m.color : mutedColor,
                      opacity: i === index ? 1 : 0.3,
                    }}
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