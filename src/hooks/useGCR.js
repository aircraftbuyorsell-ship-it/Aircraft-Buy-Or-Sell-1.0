import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const STALE_24H = 24 * 60 * 60 * 1000;

/**
 * Lazy-loads a Compliance Badge score for a registration.
 * Calls computeGlobalCompliance with force=false (uses 24h cache).
 * Does not block UI — shows skeleton while loading.
 */
export function useComplianceBadge(registration) {
  return useQuery({
    queryKey: ["gcr-badge", registration],
    queryFn: async () => {
      const res = await base44.functions.invoke("computeGlobalCompliance", {
        registration,
        force: false,
      });
      return res.data || res;
    },
    enabled: !!registration,
    staleTime: STALE_24H,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Checks if the current user has an active (30-day) GCR unlock for a registration.
 * Queries TokenTransaction for type='gcr_unlock' records.
 */
export function useGCRUnlock(registration, userEmail) {
  return useQuery({
    queryKey: ["gcr-unlock", registration, userEmail],
    queryFn: async () => {
      if (!registration || !userEmail) return { unlocked: false };
      const records = await base44.entities.TokenTransaction.filter(
        { user_email: userEmail, type: "gcr_unlock" },
        "-created_date",
        50
      );
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const unlocked = records.some(
        (r) =>
          r.metadata?.registration === registration &&
          new Date(r.created_date).getTime() > thirtyDaysAgo
      );
      return { unlocked };
    },
    enabled: !!registration && !!userEmail,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetches the full GCR report with force=true (fresh computation).
 * Only enabled when the user has unlocked the report.
 */
export function useGCRFullReport(registration, enabled) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["gcr-full", registration],
    queryFn: async () => {
      const res = await base44.functions.invoke("computeGlobalCompliance", {
        registration,
        force: true,
      });
      const data = res.data || res;
      // Update badge cache so the badge refreshes too
      queryClient.setQueryData(["gcr-badge", registration], data);
      return data;
    },
    enabled: !!registration && !!enabled,
    staleTime: STALE_24H,
    retry: 1,
  });
}