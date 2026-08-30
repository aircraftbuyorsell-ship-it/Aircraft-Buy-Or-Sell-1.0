import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

const STORAGE_KEY = "abos-theme";

function isNightHour() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

function resolveIsDark(mode) {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  // Default to light mode (main mode)
  return false;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || "light");

  const isDark = resolveIsDark(mode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, isDark]);

  // Re-evaluate auto mode every 5 minutes (catches hour transitions)
  useEffect(() => {
    if (mode !== "auto") return;
    const interval = setInterval(() => {
      const dark = isNightHour();
      document.documentElement.classList.toggle("dark", dark);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // Cycle: light → dark → auto → light
  const cycle = () => {
    setMode((prev) => (prev === "light" ? "dark" : prev === "dark" ? "auto" : "light"));
  };

  const Icon = mode === "auto" ? Monitor : isDark ? Moon : Sun;
  const label = mode === "auto" ? "Auto" : isDark ? "Dark" : "Light";

  return (
    <button
      onClick={cycle}
      className="relative flex items-center gap-2 px-2.5 h-9 rounded-full text-[11px] font-bold uppercase tracking-tight transition-all overflow-hidden"
      style={{
        background: isDark ? "rgba(212,160,23,0.10)" : "rgba(255,255,255,0.06)",
        border: "1px solid",
        borderColor: isDark ? "rgba(212,160,23,0.30)" : "rgba(255,255,255,0.10)",
        color: isDark ? "#F5C842" : "rgba(255,255,255,0.70)",
      }}
      aria-label={`Theme: ${mode}. Click to change.`}
      title={mode === "auto" ? "Auto (time-based) — click for dark" : isDark ? "Dark mode — click for light" : "Light mode — click for auto"}
    >
      {/* Glow halo behind icon */}
      <span
        className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
        style={{
          width: 28,
          height: 28,
          background: isDark
            ? "radial-gradient(circle, rgba(245,200,66,0.25) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,200,100,0.15) 0%, transparent 70%)",
          opacity: mode === "auto" ? 0.4 : 0.8,
        }}
      />
      <Icon
        className="relative w-4 h-4 shrink-0 transition-transform duration-300"
        style={{
          color: isDark ? "#F5C842" : mode === "auto" ? "#8A8780" : "#E8A83A",
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(180deg) scale(0.9)",
        }}
      />
      <span className="hidden sm:inline relative">{label}</span>
    </button>
  );
}