import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Checks Pro trial status (without granting) on mount.
 * `grantTrial(giftChoice)` grants the trial with the selected gift.
 * `refresh()` re-checks after granting or dismissing.
 */
export function useProTrial(user) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pro-trial", user?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke("grantProTrial", { checkOnly: true });
      return res.data;
    },
    enabled: !!user?.email,
    staleTime: Infinity,
    retry: false,
  });

  const grantTrial = async (giftChoice) => {
    const res = await base44.functions.invoke("grantProTrial", { giftChoice });
    return res.data;
  };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["pro-trial", user?.email] });

  return { ...query, grantTrial, refresh };
}