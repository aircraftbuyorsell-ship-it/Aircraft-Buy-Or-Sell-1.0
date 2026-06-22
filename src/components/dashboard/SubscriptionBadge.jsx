import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useBehavior } from "@/lib/useBehavior";
import { TIERS, toCredits } from "@/lib/pricing";
import { CheckCircle2, Star, Zap, Crown, Shield } from "lucide-react";
import { Link } from "react-router-dom";

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

  return (
    <div className={`rounded-2xl border hidden ${meta.border} ${meta.bg} px-5 py-4`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${meta.bg} border ${meta.border}`}>
            <Icon className={`w-4 h-4 ${meta.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-black text-foreground">{meta.label}</span>
              {meta.isBeneficiary &&
              <span className={`text-[9px] uppercase tracking-[0.15em] font-black px-2 py-0.5 rounded-full ${meta.badge}`}>
                  ✦ Beneficiary
                </span>
              }
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {meta.isBeneficiary ?
              `${credits.toLocaleString()} credits available` :
              "Free tier — upgrade to unlock more"}
            </p>
          </div>
        </div>
        {!meta.isBeneficiary &&
        <Link to="/pricing"
        className="text-[10px] font-black text-[#D4A017] hover:text-[#A67C00] uppercase tracking-wider transition-colors shrink-0">
            Upgrade →
          </Link>
        }
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {features.map((f) =>
        <div key={f} className="flex items-center gap-1.5">
            <CheckCircle2 className={`w-3 h-3 shrink-0 ${meta.color}`} />
            <span className="text-[11px] text-muted-foreground leading-tight">{f}</span>
          </div>
        )}
      </div>
    </div>);

}