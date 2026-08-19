import { useState, useEffect } from "react";
import { adminStats } from "@/lib/entitlements";
import { getProduct, formatEur } from "@/lib/products";
import { DollarSign, Crown, FileBarChart, Activity, AlertTriangle, RotateCcw, Loader2, TrendingUp } from "lucide-react";

export default function AdminMonetization() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminStats()
      .then((res) => setStats(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;
  }

  if (!stats) {
    return <div className="text-center py-20 text-sm text-muted-foreground">Admin access required.</div>;
  }

  const cards = [
    { label: "Total Revenue", value: formatEur(stats.total_revenue_eur || 0), icon: DollarSign, color: "text-green-600" },
    { label: "Active Subscriptions", value: stats.active_subscriptions || 0, icon: Crown, color: "text-amber-600" },
    { label: "One-time Purchases", value: stats.one_time_purchases || 0, icon: FileBarChart, color: "text-blue-600" },
    { label: "Reports Sold", value: stats.reports_sold || 0, icon: TrendingUp, color: "text-purple-600" },
    { label: "Usage Events", value: stats.usage_events || 0, icon: Activity, color: "text-cyan-600" },
    { label: "Failed Payments", value: stats.failed_payments || 0, icon: AlertTriangle, color: "text-red-600" },
    { label: "Refunds", value: stats.refunds || 0, icon: RotateCcw, color: "text-orange-600" },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-12 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black">Monetization Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Revenue, subscriptions and usage across ABOS products.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-2xl border bg-card p-4">
                <Icon className={`w-4 h-4 mb-2 ${c.color}`} />
                <p className="text-xl font-black">{c.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
              </div>
            );
          })}
        </div>

        {/* Revenue by product */}
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">Revenue by Product</p>
          {Object.keys(stats.revenue_by_product || {}).length === 0 ? (
            <p className="text-sm text-muted-foreground">No revenue recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.revenue_by_product).map(([k, v]) => {
                const p = getProduct(k);
                return (
                  <div key={k} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-semibold">{p?.name || k}</span>
                    <span className="text-sm font-black">{formatEur(v)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active subscriptions */}
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">Active Subscriptions</p>
          {(stats.subscriptions || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No active subscriptions.</p>
          ) : (
            <div className="space-y-2">
              {(stats.subscriptions || []).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <span className="font-semibold">{s.user_email}</span>
                  <span className="text-muted-foreground">{s.product_key} · {s.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">Recent Payment Events</p>
          {(stats.recent_payments || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment events.</p>
          ) : (
            <div className="space-y-2">
              {(stats.recent_payments || []).slice(0, 20).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0 text-xs">
                  <span className="font-mono">{p.user_email || "—"}</span>
                  <span className="text-muted-foreground">{p.product_key} · {p.status}</span>
                  <span className="font-black">{formatEur(p.amount_eur || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}