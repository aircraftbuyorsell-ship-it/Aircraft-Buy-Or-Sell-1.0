import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Calls the grantProTrial backend function once per user.
 * Idempotent — safe to call repeatedly; returns existing trial if already granted.
 */
export function useProTrial(user) {
  return useQuery({
    queryKey: ["pro-trial", user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke("grantProTrial", {});
      return res.data;
    },
    enabled: !!user?.email,
    staleTime: Infinity,
    retry: false,
  });
}