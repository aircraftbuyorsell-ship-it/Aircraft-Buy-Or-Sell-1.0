// Behavioral tracking + engagement scoring + adaptive offer trigger
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useEffect, useRef } from "react";

// Event weights (feed into engagement score 0-100)
const EVENT_WEIGHTS = {
  page_view: 0.5,
  listing_view: 1,
  ati_generate_attempt: 3,
  import_attempt: 4,
  limit_hit: 5,
  pricing_view: 2,
  offer_view: 1,
  offer_dismiss: -2,
  session_start: 1,
};

async function fetchBehavior() {
  const me = await base44.auth.me().catch(() => null);
  if (!me) return null;
  const existing = await base44.entities.UserBehavior.filter({ user_email: me.email }, "-updated_date", 1);
  if (existing?.[0]) return { ...existing[0], _user: me };
  // Bootstrap
  const fresh = await base44.entities.UserBehavior.create({
    user_email: me.email,
    tier: "free_explorer",
    tokens_remaining: 0,
    engagement_score: 0,
    session_count: 1,
    last_active: new Date().toISOString(),
    events: [],
    limits_hit: {},
  });
  return { ...fresh, _user: me };
}

export function useBehavior() {
  const queryClient = useQueryClient();
  const { data: behavior } = useQuery({
    queryKey: ["user-behavior"],
    queryFn: fetchBehavior,
    staleTime: 30_000,
    retry: false,
  });

  const trackMutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      if (!behavior?.id) return null;
      const weight = EVENT_WEIGHTS[type] ?? 0.5;
      const newEvents = [...(behavior.events || []).slice(-49), { type, payload: payload || {}, at: new Date().toISOString() }];
      const newScore = Math.max(0, Math.min(100, (behavior.engagement_score || 0) + weight));
      const newLimits = { ...(behavior.limits_hit || {}) };
      if (type === "limit_hit" && payload?.feature) {
        newLimits[payload.feature] = (newLimits[payload.feature] || 0) + 1;
      }
      return base44.entities.UserBehavior.update(behavior.id, {
        events: newEvents,
        engagement_score: newScore,
        limits_hit: newLimits,
        last_active: new Date().toISOString(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-behavior"] }),
  });

  const isAdmin = behavior?._user?.role === "admin";

  return {
    behavior,
    user: behavior?._user,
    tier: isAdmin ? "enterprise" : (behavior?.tier || "free_explorer"),
    tokens: isAdmin ? 999999 : (behavior?.tokens_remaining || 0),
    engagement: behavior?.engagement_score || 0,
    isVerified: true, // All users are verified (free access)
    isAdmin,
    track: (type, payload) => trackMutation.mutate({ type, payload }),
  };
}

// Auto-track page views + session start
export function useAutoTrack(pageName) {
  const { track, behavior } = useBehavior();
  const trackedRef = useRef(false);
  useEffect(() => {
    if (!behavior?.id || trackedRef.current) return;
    trackedRef.current = true;
    track("page_view", { page: pageName });
  }, [behavior?.id, pageName, track]);
}

// Decide if we should show an offer this session
export function useShouldShowOffer() {
  const { behavior, engagement, tier } = useBehavior();
  if (!behavior || tier !== "free_explorer") return { show: false };

  const lastShown = behavior.last_offer_shown_at ? new Date(behavior.last_offer_shown_at) : null;
  const lastDismissed = behavior.last_offer_dismissed_at ? new Date(behavior.last_offer_dismissed_at) : null;
  const now = new Date();

  // Don't re-show within 7 days of a dismiss
  if (lastDismissed && now - lastDismissed < 7 * 86400_000) return { show: false };
  // Don't re-show within 24h of a view
  if (lastShown && now - lastShown < 86400_000) return { show: false };
  // Require engagement threshold (smart, not spammy)
  if (engagement < 6) return { show: false };

  // Personalized discount based on engagement
  const discount = engagement > 30 ? 40 : engagement > 15 ? 30 : 20;
  const expiresAt = new Date(now.getTime() + 24 * 3600_000).toISOString();
  return { show: true, discount, expiresAt };
}