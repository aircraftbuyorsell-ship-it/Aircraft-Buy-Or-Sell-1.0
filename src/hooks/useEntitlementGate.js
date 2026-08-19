import { useState, useCallback } from "react";
import { checkEntitlement, createCheckout } from "@/lib/entitlements";
import { getProduct, formatEur } from "@/lib/products";

/**
 * Gate hook for paid tool pages.
 * requireAccess(productKey, aircraftRegistration?) → resolves true if entitled,
 * otherwise sets `gate` state (render the modal) and returns false.
 */
export function useEntitlementGate() {
  const [gate, setGate] = useState(null); // { productKey, registration, price, originalPrice, discount, loading }
  const [checking, setChecking] = useState(false);

  const requireAccess = useCallback(async (productKey, registration = "") => {
    setChecking(true);
    try {
      const res = await checkEntitlement(productKey, registration);
      if (res.entitled) {
        setChecking(false);
        return true;
      }
      setGate({
        productKey,
        registration,
        price: res.checkout_price_eur,
        originalPrice: res.original_price_eur,
        discount: res.discount_pct || 0,
        loading: false,
      });
      setChecking(false);
      return false;
    } catch (e) {
      // If the check itself fails (e.g. network), don't block — let the tool run.
      console.warn("Entitlement check failed, allowing access:", e);
      setChecking(false);
      return true;
    }
  }, []);

  const closeGate = useCallback(() => setGate(null), []);

  const startCheckout = useCallback(async () => {
    setGate((g) => (g ? { ...g, loading: true } : g));
    try {
      const res = await createCheckout(gate.productKey, gate.registration, window.location.href);
      if (res.url) window.location.href = res.url;
    } catch (e) {
      setGate((g) => (g ? { ...g, loading: false } : g));
    }
  }, [gate]);

  return { gate, checking, requireAccess, closeGate, startCheckout };
}

export { getProduct, formatEur };