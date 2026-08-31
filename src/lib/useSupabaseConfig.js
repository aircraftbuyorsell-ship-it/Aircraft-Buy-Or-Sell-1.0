import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * useSupabaseConfig — retrieves the active Supabase project API configuration
 * (URL + publishable/anon key + live status) from the backend function.
 *
 * Safe to use anywhere in the app — the anon key is publishable.
 * The service role key is NEVER exposed to the frontend.
 *
 * @returns { data, isLoading, isError, status }
 *   data: { configured, url, anonKey, projectRef, status, latencyMs, tableCount, probeError }
 */
export function useSupabaseConfig() {
  return useQuery({
    queryKey: ["supabase-config"],
    queryFn: async () => {
      const res = await base44.functions.invoke("getSupabaseConfig", {});
      return res.data;
    },
    staleTime: 5 * 60 * 1000,   // cache for 5 min — config rarely changes
    retry: 1,
  });
}