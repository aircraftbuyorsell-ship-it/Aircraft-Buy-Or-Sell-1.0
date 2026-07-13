import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FEATURE_PRICING, getFeaturePrice } from "@/lib/monetization";

/**
 * useMonetization — central hook for pricing/auth state.
 * Returns user context, pricing helper, and registration status.
 */
export function useMonetization() {
  const { data: user } = useQuery({
    queryKey: ["auth-monetization"],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 60000,
  });

  const isRegistered = !!user?.email;
  const tier = user?.subscription_tier || user?.tier || "free";
  const hasSubscription = tier !== "free" && tier !== "free_explorer";

  const userContext = {
    email: user?.email,
    verified: user?.verified || isRegistered,
    subscription_tier: tier,
    credit_balance: user?.credit_balance || 0,
  };

  const getPrice = (featureId) => getFeaturePrice(featureId, userContext);

  return {
    user,
    isRegistered,
    hasSubscription,
    tier,
    userContext,
    getPrice,
    featurePricing: FEATURE_PRICING,
  };
}