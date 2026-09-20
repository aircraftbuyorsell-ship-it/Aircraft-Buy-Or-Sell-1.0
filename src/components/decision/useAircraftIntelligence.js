/**
 * useAircraftIntelligence — the single React entry point into the layer.
 *
 * Screens never call a provider. They call this, with a policy, and get back
 * the canonical aircraft plus live progress while sources are consulted.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveAircraft, policyByName } from "@/intelligence";

export default function useAircraftIntelligence(registration, { policy = "screen", auto = true } = {}) {
  const [aircraft, setAircraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState([]);
  const requestId = useRef(0);

  const run = useCallback(async (reg, { force = false } = {}) => {
    const query = String(reg || "").trim();
    if (!query) return null;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setProgress([]);

    try {
      const result = await resolveAircraft(query, {
        policy: policyByName(policy),
        force,
        onProgress: (step) => {
          if (requestId.current !== id) return;
          if (step.phase === "call") {
            setProgress((prev) => {
              const next = prev.filter((p) => p.provider_id !== step.provider_id);
              return [...next, step];
            });
          }
        },
      });
      if (requestId.current !== id) return null;
      setAircraft(result);
      if (result?.error) setError(result.error);
      return result;
    } catch (err) {
      if (requestId.current !== id) return null;
      setError(err?.message || "The intelligence layer could not complete this lookup.");
      return null;
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, [policy]);

  useEffect(() => {
    if (auto && registration) run(registration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registration, policy, auto]);

  return { aircraft, loading, error, progress, run, refresh: () => run(registration, { force: true }) };
}
