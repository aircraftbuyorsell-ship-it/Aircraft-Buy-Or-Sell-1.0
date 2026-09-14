import { useState, useEffect } from "react";

const STORAGE_KEY = "abos-theme";

function resolveIsDark(stored) {
  if (stored === "dark") return true;
  if (stored === "light") return false;
  // No stored preference → follow system preference
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return true;
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
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Subscribe to system color-scheme changes when no manual preference is stored
    let mediaQuery;
    const handleMediaChange = (e) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "auto" || !stored) {
        const dark = e.matches;
        applyClass(dark);
        setIsDark(dark);
      }
    };
    if (typeof window !== "undefined" && window.matchMedia) {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", handleMediaChange);
    }

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
      if (mediaQuery) mediaQuery.removeEventListener("change", handleMediaChange);
      clearInterval(interval);
    };
  }, []);

  return isDark;
}