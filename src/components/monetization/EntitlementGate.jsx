import { useState, useEffect, useCallback } from "react";
import { checkEntitlement, createCheckout } from "@/lib/entitlements";
import { getProduct, formatEur } from "@/lib/products";
import { ShieldCheck, Lock, Loader2, Sparkles } from "lucide-react";

/**
 * useEntitlement — server-side entitlement check for a paid feature.
 * Returns { loading, entitled, reason, price, refetch, buy, buying }.
 */
export function useEntitlement(productKey, aircraftRegistration = "") {
  const [loading, setLoading] = useState(true);
  const [entitled, setEntitled] = useState(false);
  const [reason, setReason] = useState("");
  const [price, setPrice] = useState(null);
  const [buying, setBuying] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await checkEntitlement(productKey, aircraftRegistration);
      setEntitled(!!res.entitled);
      setReason(res.reason || "");
      setPrice(res.checkout_price_eur != null ? res.checkout_price_eur : null);
    } catch (_) {
      setEntitled(false);
      setReason("check_failed");
    } finally {
      setLoading(false);
    }
  }, [productKey, aircraftRegistration]);

  useEffect(() => {
    if (!productKey) return;
    refetch();
  }, [refetch]);

  const buy = useCallback(async (returnUrl) => {
    setBuying(true);
    try {
      const res = await createCheckout(productKey, aircraftRegistration, returnUrl || window.location.href);
      if (res.url) window.location.href = res.url;
    } finally {
      setBuying(false);
    }
  }, [productKey, aircraftRegistration]);

  return { loading, entitled, reason, price, refetch, buy, buying };
}

/**
 * EntitlementGate — wraps a paid action button.
 * If entitled → renders children (the action). If not → renders a paywall CTA.
 */
export default function EntitlementGate({
  productKey, aircraftRegistration, returnUrl, onEntitled, children, compact = false,
}) {
  const { loading, entitled, reason, price, buy, buying } = useEntitlement(productKey, aircraftRegistration);
  const product = getProduct(productKey);

  if (loading) {
    return (
      <div className={`flex items-center justify-center gap-2 ${compact ? "py-2" : "py-4"}`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Checking access…</span>
      </div>
    );
  }

  if (entitled) {
    return (
      <div>
        {reason === "report_already_purchased" && (
          <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold text-green-600">
            <ShieldCheck className="w-3.5 h-3.5" /> Already purchased — re-opening your report
          </div>
        )}
        {typeof children === "function" ? children({ run: onEntitled }) : children}
      </div>
    );
  }

  const displayPrice = price != null ? price : product?.price_eur;

  return (
    <div
      className={`rounded-2xl border border-dashed border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/10 p-4 flex items-center justify-between gap-3 ${compact ? "" : "flex-wrap"}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate">{product?.name || productKey}</p>
          <p className="text-[11px] text-muted-foreground">
            {reason === "subscription_included" ? "Included in your plan" : "One-time purchase — unlocked forever for this aircraft"}
          </p>
        </div>
      </div>
      <button
        onClick={() => buy(returnUrl)}
        disabled={buying}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50 shrink-0"
      >
        {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        Buy · {formatEur(displayPrice)}
      </button>
    </div>
  );
}