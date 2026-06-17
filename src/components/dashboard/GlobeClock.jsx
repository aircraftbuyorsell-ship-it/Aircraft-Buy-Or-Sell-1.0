import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/lib/useTheme";
import { Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TIMEZONES = [
  { label: "Prague CET", offset: 2, abbr: "CET" },
  { label: "London", offset: 1, abbr: "BST" },
  { label: "New York", offset: -4, abbr: "EDT" },
  { label: "Los Angeles", offset: -7, abbr: "PDT" },
  { label: "Tokyo", offset: 9, abbr: "JST" },
  { label: "Dubai", offset: 4, abbr: "GST" },
  { label: "Sydney", offset: 10, abbr: "AEST" },
  { label: "São Paulo", offset: -3, abbr: "BRT" },
];

function pad(n) { return String(n).padStart(2, "0"); }

export default function GlobeClock() {
  const isDark = useTheme();
  const [now, setNow] = useState(new Date());
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const utcHours = now.getUTCHours();
  const utcMins = now.getUTCMinutes();
  const localHours = now.getHours();
  const localMins = now.getMinutes();
  const localTzOffset = -now.getTimezoneOffset() / 60;

  const accentColor = isDark ? "#00f5ff" : "#2563eb";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const glassBg = isDark ? "rgba(15,15,28,0.72)" : "rgba(255,255,255,0.78)";
  const glassBorder = isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.06)";

  return (
    <div className="relative z-20">
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-[9px] font-bold tracking-wider cursor-pointer transition-colors"
        style={{ background: glassBg, border: glassBorder, color: accentColor, backdropFilter: "blur(16px)" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Clock className="w-3 h-3" />
        <span className="font-mono tabular-nums">
          {pad(utcHours)}:{pad(utcMins)}
        </span>
        <span className="opacity-50" style={{ color: mutedColor }}>UTC</span>
        <span className="mx-1 opacity-25" style={{ color: mutedColor }}>|</span>
        <span className="font-mono tabular-nums">
          {pad(localHours)}:{pad(localMins)}
        </span>
        <span className="opacity-50 text-[7px]" style={{ color: mutedColor }}>LOCAL</span>
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 right-0 rounded-xl p-3 min-w-[180px]"
            style={{ background: glassBg, border: glassBorder, backdropFilter: "blur(20px)" }}
          >
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: mutedColor }}>
              World Clocks
            </p>
            {TIMEZONES.map((tz) => {
              const localTime = new Date(now.getTime() + (tz.offset - localTzOffset) * 3600000);
              return (
                <div key={tz.label} className="flex items-center justify-between py-1 border-b last:border-0"
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}>
                  <span className="text-[9px] font-medium" style={{ color: textColor }}>{tz.label}</span>
                  <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color: accentColor }}>
                    {pad(localTime.getHours())}:{pad(localTime.getMinutes())}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}