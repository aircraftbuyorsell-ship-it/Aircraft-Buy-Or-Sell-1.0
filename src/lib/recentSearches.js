import { normalizeReg } from "@/lib/aircraftLookup";

const KEY = "abos:recent-registrations";
const LIMIT = 8;

function cleanList(items) {
  if (!Array.isArray(items)) return [];
  return [...new Set(items.filter((item) => typeof item === "string")
    .map(normalizeReg).filter(Boolean))].slice(0, LIMIT);
}

export function loadRecentSearches() {
  // Browser storage can be disabled; lookup must remain usable in that case.
  try {
    return cleanList(JSON.parse(window.localStorage.getItem(KEY) || "[]"));
  } catch {
    return [];
  }
}

export function saveRecentSearch(registration, previous = loadRecentSearches()) {
  const recent = cleanList([registration, ...previous]);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(recent));
  } catch {
    // Retain this visit's history in component state when storage is unavailable.
  }
  return recent;
}