import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "abos-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || "dark");
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, isDark]);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[11px] font-black uppercase tracking-tight text-[#8A8780] hover:text-white hover:bg-white/5 border border-transparent transition-all"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun className="w-3.5 h-3.5 shrink-0 text-[#E8A83A]" /> : <Moon className="w-3.5 h-3.5 shrink-0" />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}