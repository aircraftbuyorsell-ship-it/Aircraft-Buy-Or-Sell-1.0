import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Zap, Crown, Shield, CreditCard, RefreshCw, AlertTriangle,
  CheckCircle2, ArrowUpRight, ChevronRight, Info, X, Loader2,
  TrendingUp, Package, Clock
} from "lucide-react";
import { TOKEN_PACKS, TIERS, toCredits, CREDIT_RATIO } from "@/lib/pricing";
import { createCustomerPortal, listMyEntitlements } from "@/lib/entitlements";
import { useBehavior } from "@/lib/useBehavior";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import WithdrawalCard from "@/components/subscription/WithdrawalCard";

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIER_META = {
  free_explorer: { icon: Shield, color: "#4e8ef7", label: "Free Explorer", bg: "rgba(24,95,165,0.10)", border: "rgba(24,95,165,0.25)" },
  pro:           { icon: Zap,    color: "#f5c242", label: "Pro",           bg: "rgba(212,160,23,0.10)", border: "rgba(212,160,23,0.30)" },
  enterprise:   { icon: Crown,  color: "#1A1814", label: "Enterprise",    bg: "rgba(26,24,20,0.08)",  border: "rgba(26,24,20,0.20)" },
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function GlassCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      {children}
    </div>
  );
}

function InfoTip({ text }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-[rgba(255,255,255,0.35)] cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#f5c242] mb-3">{children}</p>;
}

// ─── Token Balance Ring ───────────────────────────────────────────────────────
function BalanceRing({ tokens }) {
  const credits = toCredits(tokens);
  const maxDisplay = 500;
  const pct = Math.min(credits / maxDisplay, 1);
  const r = 38, cx = 48, cy = 48;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f5c242"
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="text-center -mt-[76px] pb-4 pointer-events-none">
        <p className="text-2xl font-black text-[rgba(255,255,255,0.90)] leading-none">{credits.toLocaleString()}</p>
        <p className="text-[10px] text-[rgba(255,255,255,0.60)] uppercase tracking-wider font-semibold mt-0.5">credits</p>
      </div>
    </div>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({ open, onClose, behavior }) {
  const [processing, setProcessing] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  const handleBuy = async (pack) => {
    setProcessing(pack.id);
    setError(null);
    try {
      const res = await base44.functions.invoke("stripeCreateCheckout", {
        priceId: pack.stripe_price_id,
        packName: pack.name,
        tokens: pack.tokens + (pack.bonus_pct ? Math.round(pack.tokens * pack.bonus_pct / 100) : 0),
        priceUsd: pack.price_usd,
        returnUrl: `${window.location.origin}/subscription`,
      });
      if (res.data?.sessionUrl) {
        window.location.href = res.data.sessionUrl;
      } else {
        throw new Error(res.data?.error || "Failed to create checkout session");
      }
    } catch (err) {
      setError(err.message);
      setProcessing(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden bg-[rgba(13,17,23,0.98)] border border-[rgba(255,255,255,0.08)]"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.14)" }}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/[0.06]">
          <DialogTitle className="text-lg font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#f5c242]" /> Buy Token Pack
          </DialogTitle>
          <p className="text-xs text-[rgba(255,255,255,0.60)] mt-1">Credits never expire. Use them anytime for any feature.</p>
        </DialogHeader>

        <div className="p-6 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-[rgba(226,75,74,0.06)] border border-[rgba(226,75,74,0.22)] text-[#e24b4a] text-xs rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {TOKEN_PACKS.map(pack => {
            const bonus = pack.bonus_pct ? Math.round(pack.tokens * pack.bonus_pct / 100) : 0;
            const totalCredits = toCredits(pack.tokens + bonus);
            const isProcessing = processing === pack.id;
            return (
              <button key={pack.id} onClick={() => handleBuy(pack)} disabled={!!processing}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border transition-all text-left disabled:opacity-60 hover:border-[#f5c242] hover:bg-[rgba(212,160,23,0.04)] group"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[rgba(255,255,255,0.90)]">{pack.name}</span>
                    {pack.badge && (
                      <span className="text-[8px] uppercase tracking-wider font-bold text-[#f5c242] bg-[rgba(212,160,23,0.15)] px-2 py-0.5 rounded-full">{pack.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-[rgba(255,255,255,0.60)] mt-0.5">
                    {toCredits(pack.tokens).toLocaleString()} credits
                    {bonus > 0 && <span className="text-[#5dcaa5] font-semibold"> + {toCredits(bonus).toLocaleString()} bonus</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-[rgba(255,255,255,0.90)]">{pack.display_price}</p>
                  <p className="text-[10px] text-[rgba(255,255,255,0.35)]">{totalCredits.toLocaleString()} total credits</p>
                </div>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-[#f5c242]" /> : <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.35)] group-hover:text-[#f5c242] transition-colors" />}
              </button>
            );
          })}
        </div>

        <div className="px-6 pb-5">
          <p className="text-[10px] text-[rgba(255,255,255,0.35)] text-center">Secured by Stripe · All major cards accepted · Credits never expire</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cancel Confirmation ──────────────────────────────────────────────────────
function CancelDialog({ open, onClose, onConfirm }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl bg-[rgba(13,17,23,0.98)] border border-[rgba(255,255,255,0.08)] max-w-sm"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.14)" }}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base font-black">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Cancel Subscription?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-[rgba(255,255,255,0.60)]">
            Your remaining credits will stay in your account. You'll lose access to Pro features at the end of your current billing period.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl text-sm font-semibold">Keep Subscription</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}
            className="rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold">
            Yes, Cancel
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SubscriptionManagement() {
  const { behavior, tier, tokens, isAdmin } = useBehavior();
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: billingData = null } = useQuery({
    queryKey: ["subscription-entitlements"],
    queryFn: listMyEntitlements,
    enabled: !!behavior?.user_email,
    staleTime: 30_000,
    retry: false,
  });
  const queryClient = useQueryClient();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  const { data: transactions = [] } = useQuery({
    queryKey: ["token-tx", behavior?.user_email],
    queryFn: () => behavior?.user_email
      ? base44.entities.TokenTransaction.filter({ user_email: behavior.user_email }, "-created_date", 8)
      : [],
    enabled: !!behavior?.user_email,
  });

  const tierMeta = TIER_META[tier] || TIER_META.free_explorer;
  const TierIcon = tierMeta.icon;
  const safeTokens = Number.isFinite(Number(tokens)) ? Math.max(0, Number(tokens)) : 0;
  const credits = toCredits(safeTokens);
  const activeSubscription = billingData?.subscriptions?.find((s) => ["active", "trialing"].includes(s.status));
  const activeProduct = activeSubscription?.product_key ? billingData?.entitlements?.find((e) => e.product_key === activeSubscription.product_key) : null;

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await createCustomerPortal(window.location.origin + "/subscription");
      if (res?.url) window.location.href = res.url;
    } catch (e) {
      console.error("Stripe customer portal failed:", e?.message || e);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    setCancelOpen(false);
    await openBillingPortal();
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen px-4 md:px-8 py-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#f5c242]">Account</p>
          <h1 className="text-2xl md:text-3xl font-black text-[rgba(255,255,255,0.90)] uppercase tracking-tight mt-1">Subscription Management</h1>
          <p className="text-sm text-[rgba(255,255,255,0.60)] mt-1">Manage your plan, credits, and billing details.</p>
        </div>

        {cancelDone && (
          <div className="mb-6 flex items-center gap-3 bg-[rgba(93,202,165,0.06)] border border-[rgba(93,202,165,0.20)] text-[#5dcaa5] text-sm rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Cancellation request submitted. Your access continues until the end of the billing period.
          </div>
        )}

        <div className="grid md:grid-cols-[1fr_300px] gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Current Plan */}
            <GlassCard className="p-6">
              <SectionLabel>Current Plan</SectionLabel>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: tierMeta.bg, border: `1px solid ${tierMeta.border}` }}>
                    <TierIcon className="w-5 h-5" style={{ color: tierMeta.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-[rgba(255,255,255,0.90)]">{tierMeta.label}</p>
                    <p className="text-xs text-[rgba(255,255,255,0.60)]">{activeSubscription?.current_period_end ? `Active · renews ${new Date(activeSubscription.current_period_end).toLocaleDateString()}` : (TIERS[tier]?.price_label || "Free")}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!isAdmin && tier !== "enterprise" && (
                    <button onClick={() => setUpgradeOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg,#f5c242,#f5c242)", boxShadow: "0 4px 14px rgba(212,160,23,0.30)" }}
                      title="Buy additional credits for pay-as-you-go access">
                      <Zap className="w-3.5 h-3.5" /> Buy Credits
                    </button>
                  )}
                  {tier === "enterprise" && (
                    <a href="mailto:sales@abos.aero"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg,#4e8ef7,#4e8ef7)" }}>
                      <ArrowUpRight className="w-3.5 h-3.5" /> Contact Account Manager
                    </a>
                  )}
                  {!isAdmin && tier !== "free_explorer" && !cancelDone && (
                    <button onClick={() => setCancelOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-all"
                      title="Cancel your current subscription">
                      <X className="w-3.5 h-3.5" /> Cancel Plan
                    </button>
                  )}
                </div>
              </div>

              {/* Feature list */}
              <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.08)] grid sm:grid-cols-2 gap-2">
                {(TIERS[tier]?.features || []).map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-[rgba(255,255,255,0.70)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#f5c242] shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Token Summary */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <SectionLabel>Token Balance</SectionLabel>
                <div className="-mt-3 ml-1">
                  <InfoTip text={`Credits are used for platform actions. 1 token = ${CREDIT_RATIO} credits. Credits never expire.`} />
                </div>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <BalanceRing tokens={tokens} />
                <div className="flex-1 min-w-0 space-y-3">
                  {[
                    { label: "Full ATI Passport", cost: 5, displayCost: 25, tip: "Complete 8-dimension risk analysis report" },
                    { label: "ATI Preview", cost: 1, displayCost: 5, tip: "Quick score preview without full report" },
                    { label: "Bulk Import (per listing)", cost: 2, displayCost: 10, tip: "Import listings from ZIP / JSON file" },
                    { label: "Deal Radar Refresh", cost: 1, displayCost: 5, tip: "Re-scan the market for hot deals" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[rgba(255,255,255,0.70)]">{item.label}</span>
                        <InfoTip text={item.tip} />
                      </div>
                      <span className="text-xs font-bold text-[rgba(255,255,255,0.90)] tabular-nums">{item.displayCost} credits</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[rgba(255,255,255,0.60)]" />
                  <span className="text-xs text-[rgba(255,255,255,0.60)]">Raw tokens remaining</span>
                  <InfoTip text="Raw tokens are the underlying unit. Multiply by 5 for display credits." />
                </div>
                <span className="text-sm font-black text-[rgba(255,255,255,0.90)]">{isAdmin ? "∞" : (tokens || 0).toLocaleString()} tokens</span>
              </div>
            </GlassCard>

            {/* Payment Method */}
            <GlassCard className="p-6">
              <SectionLabel>Payment Method</SectionLabel>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[rgba(255,255,255,0.60)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[rgba(255,255,255,0.90)]">Managed via Stripe</p>
                    <p className="text-xs text-[rgba(255,255,255,0.60)]">Secure payment processing · All major cards</p>
                  </div>
                </div>
                <button onClick={openBillingPortal} disabled={portalLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#4e8ef7] border border-[#4e8ef7]/20 hover:bg-[#4e8ef7]/[0.06] transition-all disabled:opacity-50"
                  title="Open the Stripe customer portal to update your payment details">
                  {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Manage Billing
                </button>
              </div>
              <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-3 flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                Invoices, billing history, and card updates are available in the Stripe customer portal.
              </p>
            </GlassCard>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Recent Transactions */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <SectionLabel>Recent Activity</SectionLabel>
                <div className="-mt-3">
                  <InfoTip text="Your last 8 token transactions — purchases and feature usage." />
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-[rgba(255,255,255,0.35)]">
                  <Clock className="w-8 h-8 mx-auto opacity-30 mb-2" />
                  <p className="text-xs">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div key={tx.id} className="flex items-center justify-between gap-2 py-2 border-b border-[rgba(255,255,255,0.06)] last:border-0">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[rgba(255,255,255,0.90)] truncate">{tx.pack || tx.feature || tx.type}</p>
                          <p className="text-[10px] text-[rgba(255,255,255,0.35)]">{new Date(tx.created_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-black ${isPositive ? "text-[#5dcaa5]" : "text-[#e24b4a]"}`}>
                            {isPositive ? "+" : ""}{toCredits(Number.isFinite(Number(tx.amount)) ? Number(tx.amount) : 0).toLocaleString()} cr
                          </p>
                          {Number.isFinite(Number(tx.price_usd)) && <p className="text-[10px] text-[rgba(255,255,255,0.35)]">${Number(tx.price_usd).toFixed(2)}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>

            {/* Upgrade nudge for free tier */}
            {tier === "free_explorer" && !isAdmin && (
              <GlassCard className="p-5 overflow-hidden relative">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(212,160,23,0.12) 0%, transparent 60%)" }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#f5c242]" />
                    <p className="text-xs font-black text-[rgba(255,255,255,0.90)] uppercase tracking-wide">Go Pro</p>
                  </div>
                  <p className="text-xs text-[rgba(255,255,255,0.60)] leading-relaxed">
                    Unlock full ATI Passport reports, Deal Radar, Leads CRM, and bulk import with token packs.
                  </p>
                  <button onClick={() => setUpgradeOpen(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-[#4e8ef7] transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg,#f5c242,#f5c242)", boxShadow: "0 4px 14px rgba(212,160,23,0.28)" }}>
                    <Zap className="w-3.5 h-3.5" /> View Token Packs
                  </button>
                </div>
              </GlassCard>
            )}

            {/* EU 14-day right of withdrawal */}
            <WithdrawalCard />

            {/* Enterprise contact */}
            {tier !== "enterprise" && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-[rgba(255,255,255,0.90)]" />
                  <p className="text-xs font-black text-[rgba(255,255,255,0.90)] uppercase tracking-wide">Enterprise?</p>
                </div>
                <p className="text-xs text-[rgba(255,255,255,0.60)]">Need unlimited tokens, API access, or team seats? Contact us for a custom plan.</p>
                <a href="mailto:sales@abos.aero"
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#4e8ef7] hover:text-[#f5c242] transition-colors">
                  Contact Sales <ArrowUpRight className="w-3 h-3" />
                </a>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Modals */}
        <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} behavior={behavior} />
        <CancelDialog open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={handleCancelConfirm} />
      </div>
    </TooltipProvider>
  );
}