/**
 * Checkout price resolution — one place that turns a catalog product into the
 * amount Stripe actually charges.
 *
 * Why this exists: the catalog prices some products in USD (`price_usd`) and
 * others in EUR (`price_eur`). Code that reads only `price_usd` resolves a
 * EUR-priced product to 0 and, because a Stripe line item is still valid at
 * zero, silently creates a free subscription instead of failing. That is the
 * worst possible failure mode for a billing path: it succeeds.
 *
 * So resolution is explicit, currency-aware, and refuses to produce a
 * chargeable session for a product whose price it cannot determine.
 */

/**
 * Resolve the currency and Stripe unit amount (minor units) for a product.
 *
 * @param {Object} product catalog entry, e.g. { price_eur: 99, currency: 'eur' }
 * @returns {{currency: string, amount: number, unitAmount: number}|null}
 *          null when the product carries no usable price.
 */
export function resolveCheckoutAmount(product) {
  if (!product || typeof product !== "object") return null;

  // The declared currency wins. Without one, infer it from whichever price
  // field is present rather than defaulting to USD and reading the wrong field.
  const declared = typeof product.currency === "string" ? product.currency.toLowerCase() : null;
  const currency = declared
    || (product.price_usd != null ? "usd" : product.price_eur != null ? "eur" : null);
  if (!currency) return null;

  const preferred = currency === "usd" ? product.price_usd : product.price_eur;
  const amount = preferred ?? product.price_usd ?? product.price_eur ?? null;
  if (amount == null) return null;

  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) return null;

  return { currency, amount: numeric, unitAmount: Math.round(numeric * 100) };
}

/**
 * True when this product is meant to be paid for through a checkout session.
 * Free products are granted outright; contract products are quoted by a human.
 */
export function isChargeable(product) {
  if (!product) return false;
  if (product.free) return false;
  if (product.type === "contract") return false;
  return true;
}

/**
 * Apply a fractional discount to a base amount, in minor units.
 * Never returns a negative amount.
 *
 * @param {number} amount base price in major units
 * @param {number} pct fraction, e.g. 0.30 for 30%
 */
export function discountedUnitAmount(amount, pct) {
  const base = Number(amount);
  const fraction = Number(pct);
  if (!Number.isFinite(base)) return 0;
  if (!Number.isFinite(fraction) || fraction <= 0) return Math.round(base * 100);
  return Math.max(0, Math.round(base * (1 - fraction) * 100));
}

/**
 * The guard a checkout path should run before creating a Stripe session.
 * Returns an error string when the product must not be charged as resolved,
 * or null when it is safe to proceed.
 *
 * A chargeable product resolving to zero is always a bug, never a free tier —
 * a genuinely free product carries `free: true` and is granted without Stripe.
 */
export function checkoutBlocker(product, resolved) {
  if (!product) return "Unknown product";
  if (!isChargeable(product)) return "Product is not purchasable through checkout";
  if (!resolved) return `No price is configured for ${product.name || "this product"}`;
  if (resolved.unitAmount <= 0) {
    return `Refusing to create a zero-amount checkout for ${product.name || "this product"}`;
  }
  return null;
}
