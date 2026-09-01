import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Checks Pro trial status (without granting) on mount.
 * `grantTrial(giftChoice)` grants the trial with the selected gift.
 * `refresh()` re-checks after granting or dismissing.
 *
 * The status check resolves to `{ ok: false, error }` rather than rejecting, so
 * a trial-service outage degrades to a hidden banner instead of an unhandled
 * query error. `grantTrial` still throws — the modal surfaces that to the user.
 */
export function useProTrial(user) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pro-trial", user?.email],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke("grantProTrial", { checkOnly: true });
        if (!res?.data) {
          return { ok: false, error: "Empty response from trial check" };
        }
        return res.data;
      } catch (err) {
        console.error("Pro trial check failed:", err?.message || err);
        return { ok: false, error: err?.message || "Failed to check trial status" };
      }
    },
    enabled: !!user?.email,
    staleTime: Infinity,
    retry: 1,
  });

  const grantTrial = async (giftChoice) => {
    const res = await base44.functions.invoke("grantProTrial", { giftChoice });
    if (!res?.data) throw new Error("Empty response from grantProTrial");
    if (res.data.ok === false) {
      throw new Error(res.data.message || res.data.error || "Could not activate trial");
    }
    return res.data;
  };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["pro-trial", user?.email] });

  return { ...query, grantTrial, refresh };
}
