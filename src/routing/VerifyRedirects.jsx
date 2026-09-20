/**
 * Canonical verification redirects (master spec §6, §10, §11, §18, §22).
 *
 * ABOS has exactly one public aircraft-verification URL:
 *
 *     /verify?registration=N7692J
 *
 * Every older address for the same thing lands there, normalized, carrying the
 * aircraft the user actually asked for. When no registration is supplied the
 * redirect goes to bare /verify and the entry state is shown — it never falls
 * back to a demo aircraft.
 */

import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { normalizeReg } from "@/lib/aircraftLookup";
import { canonicalVerifyPath, readRegistrationParam } from "@/components/decision/useCanonicalRegistration";

/**
 * Query-form redirect: /screen?registration=… and /advisor?registration=…
 * both resolve to the canonical verification URL.
 */
export function CanonicalVerifyRedirect() {
  const [searchParams] = useSearchParams();
  return <Navigate to={canonicalVerifyPath(readRegistrationParam(searchParams))} replace />;
}

/**
 * Path-form redirect: the legacy /verify/N7692J shape becomes the query form.
 * Static siblings such as /verify/tools are matched by the router first.
 */
export function PathRegistrationRedirect() {
  const { registration } = useParams();
  return <Navigate to={canonicalVerifyPath(registration)} replace />;
}

/**
 * The Advisor is an alternative entry point into the SAME verification system,
 * not a second engine (§3, §21). Without an aircraft it renders its own page;
 * the moment it carries one, the canonical URL takes over.
 */
export function AdvisorEntry({ children }) {
  const [searchParams] = useSearchParams();
  const registration = normalizeReg(readRegistrationParam(searchParams));
  if (registration) return <Navigate to={canonicalVerifyPath(registration)} replace />;
  return children;
}
