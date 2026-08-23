import { useState, useEffect } from "react";
import { listMyEntitlements, usageSummary, createCustomerPortal } from "@/lib/entitlements";
import { getProduct, formatEur, PRODUCT_CATALOG } from "@/lib/products";
import { CreditCard, Loader2, Crown, Building, ShieldCheck, FileBarChart, TrendingUp, BadgeCheck, ExternalLink, Receipt } from "lucide-react";
import { Link } from "react-router-dom";

const ICONS = { ATI_SCORE: ShieldCheck, ATI_FULL_REPORT: FileBarChart, VALUATION_STUDIO: TrendingUp, VERIFICATION_PACK: BadgeCheck, PRO: Crown, BROKER: Building };

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ entitlements: [], subscriptions: [], active_sub_product: null, reports: [] });
  const [usage, setUsage] = useState({ total: 0, by_product: {} });
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    Promise.all([listMyEntitlements(), usageSummary()])
      .then(([entRes, usageRes]) => { setData(entRes); setUsage(usageRes); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await createCustomerPortal(window.location.origin + "/billing");
      if (res.url) window.location.href = res.url;
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;
  }

  const activeSub = data.subscriptions?.find((s) => s.status === "active");
  const subProduct = activeSub ? getProduct(activeSub.product_key) : null;

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-12 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black">ABOS Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your plan, products and usage.</p>
        </div>

        {/* Current plan */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
                {subProduct ? <Crown className="w-6 h-6 text-amber-600" /> : <CreditCard className="w-6 h-6 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Current Plan</p>
                <p className="font-black text-base">{subProduct ? subProduct.name : "Free Explorer"}</p>
                {activeSub?.current_period_end && (
                  <p className="text-[11px] text-muted-foreground">Renews {new Date(activeSub.current_period_end).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            {activeSub ? (
              <button onClick={openPortal} disabled={portalLoading} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted">
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Manage Subscription
              </button>
            ) : (
              <Link to="/pricing" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600">
                <Crown className="w-4 h-4" /> Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* Active entitlements */}
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">Active Products</p>
          {data.entitlements?.length === 0 && !activeSub ? (
            <p className="text-sm text-muted-foreground">No active products. <Link to="/pricing" className="text-amber-600 font-semibold hover:underline">Browse products →</Link></p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...(data.subscriptions || []), ...(data.entitlements || [])].filter((e) => e.status === "active").map((e) => {
                const p = getProduct(e.product_key);
                const Icon = ICONS[e.product_key] || ShieldCheck;
                return (
                  <div key={e.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <Icon className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{p?.name || e.product_key}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {e.scope === "global" ? "Subscription" : `${e.aircraft_registration || "—"}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Usage */}
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">Usage</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><p className="text-2xl font-black">{usage.total || 0}</p><p className="text-[10px] text-muted-foreground uppercase">Total events</p></div>
            {Object.entries(usage.by_product || {}).slice(0, 3).map(([k, v]) => (
              <div key={k}><p className="text-2xl font-black">{v}</p><p className="text-[10px] text-muted-foreground uppercase truncate">{k}</p></div>
            ))}
          </div>
        </div>

        {/* Purchased reports */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Purchased Reports</p>
            <Link to="/my-reports" className="text-[11px] font-semibold text-amber-600 hover:underline">View all →</Link>
          </div>
          <p className="text-sm text-muted-foreground">{data.reports?.length || 0} report(s)</p>
        </div>

        {/* Payment history */}
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Payment History</p>
            <button onClick={openPortal} disabled={portalLoading} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 hover:underline">
              <Receipt className="w-3.5 h-3.5" /> Stripe portal
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Full invoices and payment history are available in the Stripe customer portal.</p>
        </div>
      </div>
    </div>
  );
}