import { useState, useEffect } from "react";
import { ONE_TIME_PRODUCTS, SUBSCRIPTION_PRODUCTS, formatEur, formatPrice, effectivePrice } from "@/lib/products";
import { listMyEntitlements, createCheckout, createCustomerPortal } from "@/lib/entitlements";
import { ShieldCheck, Loader2, Check, Crown, Building, Lock, ArrowRight, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const ICONS = { Shield: ShieldCheck, FileBarChart: ShieldCheck, TrendingUp: ShieldCheck, BadgeCheck: ShieldCheck, Crown, Building };

export default function Pricing() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ active_sub_product: null, entitlements: [], subscriptions: [] });
  const [buying, setBuying] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [isNewMember, setIsNewMember] = useState(false);

  useEffect(() => {
    listMyEntitlements()
      .then((res) => {
        setData(res);
        const noPurchases = !(res.entitlements?.length) && !(res.subscriptions?.length);
        if (noPurchases) {
          base44.auth.me().then((u) => {
            const created = new Date(u?.created_date || 0).getTime();
            if (created && Date.now() - created < 14 * 86400000) setIsNewMember(true);
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const buy = async (productKey, aircraftRegistration = "") => {
    setBuying(productKey);
    try {
      const res = await createCheckout(productKey, aircraftRegistration, window.location.href);
      if (res.url) window.location.href = res.url;
    } finally {
      setBuying(null);
    }
  };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await createCustomerPortal(window.location.origin + "/billing");
      if (res.url) window.location.href = res.url;
    } finally {
      setPortalLoading(false);
    }
  };

  const hasEntitlement = (key) => data.entitlements?.some((e) => e.product_key === key && e.status === "active") || data.subscriptions?.some((e) => e.product_key === key && e.status === "active");
  const isSub = (key) => data.active_sub_product === key;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 bg-amber-400/10 border border-amber-400/30">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-amber-600">ABOS Monetization</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Pricing</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
          Pay per aircraft for one-time intelligence, or subscribe for ongoing access. Every purchase is backed by
          real Stripe checkout and a server-side entitlement system.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          {isNewMember && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-4">
              <Gift className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-black text-amber-700 dark:text-amber-400">New member welcome offer</p>
                <p className="text-xs text-muted-foreground">30% off your first report or valuation — applied automatically at checkout, valid for 14 days after signup.</p>
              </div>
            </div>
          )}
          {/* ── Individual (one-time) ── */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-black">Individual</h2>
              <span className="text-xs text-muted-foreground">One-time purchases · per aircraft</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ONE_TIME_PRODUCTS.map((p) => {
                const Icon = ICONS[p.icon] || ShieldCheck;
                const owned = hasEntitlement(p.key);
                const price = effectivePrice(p.key, data.active_sub_product);
                const included = price?.included;
                return (
                  <div key={p.key} className="rounded-2xl border bg-card p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-amber-600" />
                      </div>
                      {owned && <span className="text-[9px] font-black uppercase tracking-wider text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />Owned</span>}
                    </div>
                    <h3 className="font-black text-sm">{p.name}</h3>
                    <p className="text-[11px] text-muted-foreground mb-3">{p.tagline}</p>
                    <div className="mb-3">
                      {included ? (
                        <span className="text-lg font-black text-green-600">Included</span>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black">{formatPrice(price.amount, price.currency)}</span>
                          {price.discount_pct > 0 && <span className="text-xs line-through text-muted-foreground">{formatPrice(price.original_amount, price.currency)}</span>}
                        </div>
                      )}
                    </div>
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <Check className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => buy(p.key)}
                      disabled={buying === p.key || owned || included}
                      className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {buying === p.key ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : owned ? "Purchased" : included ? "Included" : `Buy · ${formatPrice(price.amount, price.currency)}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Professional (subscription) ── */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-black">Professional</h2>
              <span className="text-xs text-muted-foreground">Recurring subscriptions · monthly</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUBSCRIPTION_PRODUCTS.map((p) => {
                const Icon = ICONS[p.icon] || ShieldCheck;
                const active = isSub(p.key);
                return (
                  <div key={p.key} className={`rounded-2xl border p-6 flex flex-col ${p.key === "PRO" ? "border-amber-400/40 bg-amber-50/30 dark:bg-amber-950/10" : "bg-card"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-amber-600" />
                      </div>
                      {active && <span className="text-[9px] font-black uppercase tracking-wider text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />Active</span>}
                    </div>
                    <h3 className="font-black text-base">{p.name}</h3>
                    <p className="text-[11px] text-muted-foreground mb-3">{p.tagline}</p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-black">{formatEur(p.price_eur)}</span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </div>
                    <ul className="space-y-1.5 mb-5 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px]">
                          <Check className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    {active ? (
                      <button onClick={openPortal} disabled={portalLoading} className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border border-border hover:bg-muted transition-colors">
                        {portalLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Manage Subscription"}
                      </button>
                    ) : (
                      <button onClick={() => buy(p.key)} disabled={buying === p.key} className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50">
                        {buying === p.key ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Subscribe"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t">
            <Link to="/my-reports" className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:underline">
              My Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to="/billing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:underline">
              Billing & Usage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}