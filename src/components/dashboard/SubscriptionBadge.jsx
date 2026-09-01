import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useBehavior } from "@/lib/useBehavior";
import { toCredits } from "@/lib/pricing";
import { Star, Zap, Crown, Shield } from "lucide-react";

const PLAN_META = {
  free_explorer: {
    label: "Free Explorer",
    icon: Shield,
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    border: "border-slate-200 dark:border-slate-700",
    badge: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    isBeneficiary: false
  },
  starter: {
    label: "Starter",
    icon: Zap,
    color: "text-[#00b5cc]",
    bg: "bg-[rgba(0,181,204,0.06)] dark:bg-[rgba(0,245,255,0.06)]",
    border: "border-[rgba(0,181,204,0.25)] dark:border-[rgba(0,245,255,0.2)]",
    badge: "bg-[rgba(0,181,204,0.15)] text-[#007a8c] dark:text-[#00f5ff]",
    isBeneficiary: true
  },
  pro: {
    label: "Pro",
    icon: Star,
    color: "text-[#D4A017]",
    bg: "bg-[rgba(212,160,23,0.06)]",
    border: "border-[rgba(212,160,23,0.25)]",
    badge: "bg-[rgba(212,160,23,0.15)] text-[#A67C00]",
    isBeneficiary: true
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/10",
    border: "border-purple-200 dark:border-purple-700/40",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    isBeneficiary: true
  }
};

// Map tier + sub_tier to a display plan key
function resolvePlanKey(tier, subTier, tokens) {
  if (tier === "enterprise") return "enterprise";
  if (tier === "pro" || tokens > 20) return subTier && subTier !== "none" ? subTier : "pro";
  return "free_explorer";
}

// Features shown per plan key
const PLAN_FEATURES = {
  free_explorer: [
  "Browse all public listings",
  "20 ATI preview credits",
  "Basic market insights",
  "Live traffic map"],

  starter: [
  "500 ATI credits included",
  "Full ATI Passport reports",
  "Deal Radar access",
  "Leads CRM",
  "Bulk import (ZIP / JSON)",
  "Priority market insights"],

  pro: [
  "Full ATI Passport reports",
  "Deal Radar access",
  "Bulk import (ZIP / JSON)",
  "Leads CRM",
  "Branded PDF exports",
  "Priority AI models",
  "White-label branding"],

  enterprise: [
  "Unlimited tokens",
  "Full ATI suite",
  "API access",
  "Custom integrations",
  "Dedicated account manager",
  "Team seats",
  "SLA & priority support"]

};

export default function SubscriptionBadge() {
  const { tier, tokens, behavior, isAdmin } = useBehavior();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    base44.auth.me().then((me) => {
      if (!me) return;
      base44.entities.UserProfile.filter({ user_email: me.email }, "-updated_date", 1).
      then((res) => setProfile(res?.[0] || null)).
      catch(() => {});
    }).catch(() => {});
  }, []);

  // Resolve the display plan key
  const subTier = profile?.sub_tier;
  const profileTier = profile?.tier;
  const effectiveTier = isAdmin ? "enterprise" : profileTier || tier || "free_explorer";
  const planKey = resolvePlanKey(effectiveTier, subTier, tokens);
  const meta = PLAN_META[planKey] || PLAN_META.free_explorer;
  const features = PLAN_FEATURES[planKey] || PLAN_FEATURES.free_explorer;
  const Icon = meta.icon;
  const credits = toCredits(tokens);

  return null;










































}