import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, Zap, Gift } from "lucide-react";

/**
 * Monitors user tier + hot deals and triggers push notifications
 * at strategic times (e.g., on dashboard load, or when deals appear)
 */
export default function NotificationCenter() {
  const [lastNotified, setLastNotified] = useState({});

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({
        user_email: user.email,
      });
      return profiles[0] || null;
    },
    staleTime: 60000,
  });

  // Fetch hot deals
  const { data: hotDeals = [] } = useQuery({
    queryKey: ["hot-deals"],
    queryFn: async () => {
      return base44.entities.DealRadar.filter({ status: "active" });
    },
    staleTime: 30000,
  });

  // Trigger tier upgrade notification (once per session)
  useEffect(() => {
    if (!profile || lastNotified.tier_upgrade) return;

    const tier = profile.tier || "free_explorer";
    const isFree = tier === "free_explorer";

    if (
      isFree &&
      window.notificationStack &&
      Math.random() < 0.35
    ) {
      window.notificationStack.addNotification({
        type: "tier_upgrade",
        title: "Unlock Premium Features",
        message:
          "Upgrade to Pro for unlimited ATI reports, escrow management, and deal scoring.",
        cta_label: "View Plans",
        cta_href: "/pricing",
        duration: 10000,
      });
      setLastNotified((prev) => ({ ...prev, tier_upgrade: true }));
    }
  }, [profile, lastNotified]);

  // Trigger hot deal notifications (max 1 per session)
  useEffect(() => {
    if (
      !hotDeals.length ||
      lastNotified.hot_deal ||
      !window.notificationStack
    ) {
      return;
    }

    const deal = hotDeals[0];
    if (deal && Math.random() < 0.25) {
      window.notificationStack.addNotification({
        type: "hot_deal",
        title: "🔥 Hot Deal Alert",
        message: `${deal.year || ""} ${deal.make || ""} ${deal.model || ""} listed — ${(deal.deal_score || 0).toFixed(1)}/10 deal score.`,
        cta_label: "View Deal",
        cta_href: `/listings`,
        duration: 12000,
      });
      setLastNotified((prev) => ({ ...prev, hot_deal: true }));
    }
  }, [hotDeals, lastNotified]);

  return null; // Invisible monitoring component
}