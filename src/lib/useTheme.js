import { useState, useEffect } from "react";

const STORAGE_KEY = "abos-theme";

// Light mode is disabled — ABOS is always dark
function applyClass() {
  document.documentElement.classList.add("dark");
}

export function useTheme() {
  const [isDark] = useState(() => {
    applyClass();
    return true;
  });

  useEffect(() => {
    applyClass();
    // Ensure dark stays on even if ThemeToggle tries to switch
    const observer = new MutationObserver(() => {
      if (!document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.add("dark");
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}