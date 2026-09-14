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

    // Follow system color-scheme changes only when no manual preference is stored.
    // When "auto" is stored, ThemeToggle owns the time-based logic — don't override it.
    let mediaQuery;
    const handleMediaChange = (e) => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        applyClass(e.matches);
        setIsDark(e.matches);
      }
    };
    if (typeof window !== "undefined" && window.matchMedia) {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    return () => {
      observer.disconnect();
      if (mediaQuery) mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return isDark;
}