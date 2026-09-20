/**
 * useCanonicalRegistration — one registration contract for the whole funnel.
 *
 * Master spec §6, §9, §18: `?registration=` is the ONLY public parameter, and it
 * always holds a normalized registration. A lowercase, spaced or legacy-aliased
 * value in the URL is rewritten in place (replace, so Back still works).
 *
 * What this deliberately does NOT do: substitute anything when the value is
 * missing or unresolvable (§4, §19, §22). An empty registration stays empty and
 * the page shows its entry state — never a demo aircraft.
 */

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { normalizeReg } from "@/lib/aircraftLookup";

export const REGISTRATION_PARAM = "registration";

/** Accepted on the way IN so old links keep working; never written back out. */
export const LEGACY_REGISTRATION_PARAMS = ["tail", "tailNumber", "tail_number", "reg", "nreg", "aircraft"];

/** Reads the registration a URL carries, under the canonical name or a legacy alias. */
export function readRegistrationParam(searchParams) {
  const canonical = searchParams.get(REGISTRATION_PARAM);
  if (canonical) return canonical;
  for (const key of LEGACY_REGISTRATION_PARAMS) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return "";
}

/** Builds the one canonical aircraft-verification URL (§6). */
export function canonicalVerifyPath(value) {
  const normalized = normalizeReg(value);
  return normalized
    ? `/verify?${REGISTRATION_PARAM}=${encodeURIComponent(normalized)}`
    : "/verify";
}

export default function useCanonicalRegistration() {
  const [searchParams, setSearchParams] = useSearchParams();

  const raw = readRegistrationParam(searchParams);
  const registration = normalizeReg(raw);

  // Self-correct the address bar: ?registration=n7692j becomes ?registration=N7692J,
  // and legacy aliases collapse into the canonical name. Replace, not push.
  useEffect(() => {
    if (!raw) return;
    const alreadyCanonical = searchParams.get(REGISTRATION_PARAM) === registration;
    const carriesLegacy = LEGACY_REGISTRATION_PARAMS.some((key) => searchParams.has(key));
    if (alreadyCanonical && !carriesLegacy) return;

    const next = new URLSearchParams(searchParams);
    LEGACY_REGISTRATION_PARAMS.forEach((key) => next.delete(key));
    if (registration) next.set(REGISTRATION_PARAM, registration);
    else next.delete(REGISTRATION_PARAM);
    setSearchParams(next, { replace: true });
  }, [raw, registration, searchParams, setSearchParams]);

  /** Used by the in-page search box. Pushes, so Back returns to the previous aircraft. */
  const setRegistration = (value) => {
    const normalized = normalizeReg(value);
    const next = new URLSearchParams(searchParams);
    LEGACY_REGISTRATION_PARAMS.forEach((key) => next.delete(key));
    if (normalized) next.set(REGISTRATION_PARAM, normalized);
    else next.delete(REGISTRATION_PARAM);
    setSearchParams(next);
  };

  return { registration, setRegistration };
}
