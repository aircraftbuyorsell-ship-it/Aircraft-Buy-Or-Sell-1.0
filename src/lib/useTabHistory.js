import { useCallback } from "react";

const STORAGE_KEY = "abos-tab-history";

function readHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function writeHistory(map) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

/** Records each tab's last visited path; returns { getLast, setLast, resetToRoot } */
export function useTabHistory() {
  const getLast = useCallback((tabKey) => {
    const map = readHistory();
    return map[tabKey] || null;
  }, []);

  const setLast = useCallback((tabKey, path) => {
    const map = readHistory();
    if (map[tabKey] === path) return;
    map[tabKey] = path;
    writeHistory(map);
  }, []);

  const resetToRoot = useCallback((tabKey) => {
    const map = readHistory();
    if (tabKey in map) { delete map[tabKey]; writeHistory(map); }
  }, []);

  return { getLast, setLast, resetToRoot };
}