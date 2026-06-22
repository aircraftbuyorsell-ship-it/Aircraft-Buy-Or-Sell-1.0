import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

const STORAGE_KEY = "abos-theme";

function isNightHour() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || "auto");

  const isDark = mode === "dark" || (mode === "auto" && isNightHour());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, isDark]);

  // Cycle: auto → dark → light → auto
  const cycle = () => {
    setMode((prev) => (prev === "auto" ? "dark" : prev === "dark" ? "light" : "auto"));
  };

  const Icon = mode === "auto" ? Monitor : isDark ? Sun : Moon;
  const label = mode === "auto" ? "Auto" : isDark ? "Light" : "Dark";

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-black uppercase tracking-tight text-[#8A8780] hover:text-white hover:bg-white/5 border border-transparent transition-all"
      aria-label={`Theme: ${mode}`}
      title={mode === "auto" ? "Auto (time-based)" : isDark ? "Switch to light" : "Switch to dark"}
    >
      <Icon className="w-3.5 h-3.5 shrink-0 text-[#E8A83A]" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}