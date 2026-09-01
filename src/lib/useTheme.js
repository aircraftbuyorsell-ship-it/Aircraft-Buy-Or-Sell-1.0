import { useState, useEffect } from "react";

const STORAGE_KEY = "abos-theme";

// Light mode is the default; dark mode is user-selected.
function isNightHour() {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

function resolveIsDark(stored) {
  if (stored === "dark") return true;
  if (stored === "light") return false;
  // Default to light mode (main mode)
  return false;
}

function applyClass(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const dark = resolveIsDark(stored);
    applyClass(dark);
    return dark;
  });

  useEffect(() => {
    // Sync from DOM mutations (ThemeToggle or other class changes)
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Re-evaluate auto mode every 5 minutes (catches hour transitions)
    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "auto" || !stored) {
        const dark = resolveIsDark(stored);
        applyClass(dark);
        setIsDark(dark);
      }
    }, 5 * 60 * 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return isDark;
}