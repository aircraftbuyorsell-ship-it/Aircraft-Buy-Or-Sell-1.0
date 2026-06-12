import { useState, useEffect } from "react";

const STORAGE_KEY = "abos-theme";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? stored === "dark" : true; // default dark
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}