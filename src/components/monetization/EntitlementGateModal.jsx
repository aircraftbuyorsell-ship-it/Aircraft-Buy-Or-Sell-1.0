import { ShieldCheck, X, Loader2, Check, Crown } from "lucide-react";
import { getProduct, formatEur } from "@/lib/products";

/**
 * Modal shown when a paid tool run is blocked by the entitlement gate.
 * Renders price, discount, and a Stripe checkout button.
 */
export default function EntitlementGateModal({ gate, onClose, onCheckout }) {
  if (!gate) return null;
  const product = getProduct(gate.productKey);
  const included = gate.price === 0 || (product?.included_in_subs || []).length > 0 && gate.price == null;
  const isSub = gate.productKey === "PRO" || gate.productKey === "BROKER";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 opacity-40 hover:opacity-100">
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center mb-3">
            {isSub ? <Crown className="w-6 h-6 text-amber-600" /> : <ShieldCheck className="w-6 h-6 text-amber-600" />}
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 mb-1">
            {isSub ? "Subscription required" : "Paid feature"}
          </p>
          <h3 className="text-lg font-black">{product?.name || gate.productKey}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{product?.tagline || "Unlock this feature to continue."}</p>

          {/* Price */}
          <div className="mt-4 mb-4">
            {included ? (
              <span className="text-2xl font-black text-green-600">Included in your plan</span>
            ) : (
              <div className="flex items-baseline gap-2 justify-center">
                <span className="text-3xl font-black">{formatEur(gate.price)}</span>
                {gate.discount > 0 && <span className="text-sm line-through text-muted-foreground">{formatEur(gate.originalPrice)}</span>}
                {gate.discount > 0 && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-500/15 text-green-600">
                    {Math.round(gate.discount * 100)}% off
                  </span>
                )}
              </div>
            )}
            {gate.welcome && (
              <p className="text-[11px] font-bold text-amber-600 mt-1.5">🎁 New member welcome offer — 30% off your first purchase</p>
            )}
            {!isSub && !included && <p className="text-[10px] text-muted-foreground mt-1">one-time · per aircraft · re-access free</p>}
            {isSub && <p className="text-[10px] text-muted-foreground mt-1">per month · cancel anytime</p>}
          </div>

          {/* Features */}
          {product?.features?.length > 0 && (
            <ul className="space-y-1.5 mb-5 text-left w-full">
              {product.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Check className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />{f}
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-border hover:bg-muted transition-colors">
              Not now
            </button>
            <button onClick={onCheckout} disabled={gate.loading} className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50">
              {gate.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : included ? "Subscribe" : `Buy · ${formatEur(gate.price)}`}
            </button>
          </div>

          {gate.registration && (
            <p className="text-[10px] text-muted-foreground mt-3">Aircraft: {gate.registration}</p>
          )}
        </div>
      </div>
    </div>
  );
}