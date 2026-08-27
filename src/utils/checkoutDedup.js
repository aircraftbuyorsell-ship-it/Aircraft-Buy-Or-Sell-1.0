/**
 * Checkout deduplication to prevent accidental multiple checkout attempts
 * and double-charges.
 *
 * This uses a combination of:
 * 1. In-memory lock during active checkout
 * 2. Local storage tracking of recent checkout attempts
 * 3. Timeout mechanism to auto-unlock after checkout window
 */

const CHECKOUT_TIMEOUT = 30000; // 30 second window for checkout
const RECENT_CHECKOUT_WINDOW = 3600000; // 1 hour for duplicate detection
const STORAGE_KEY = 'abos_recent_checkouts';

class CheckoutDeduplicator {
  constructor() {
    this.activeCheckouts = new Map();
  }

  /**
   * Check if a checkout is already in progress or was recent
   */
  isDuplicate(planType) {
    // Check active checkout
    if (this.activeCheckouts.has(planType)) {
      return true;
    }

    // Check recent checkouts from localStorage
    try {
      const recent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const now = Date.now();
      const filtered = recent.filter(
        (item) => item.planType === planType && (now - item.timestamp) < RECENT_CHECKOUT_WINDOW
      );
      return filtered.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Mark a checkout as active
   */
  markActive(planType) {
    this.activeCheckouts.set(planType, true);

    // Auto-cleanup after timeout
    setTimeout(() => {
      this.activeCheckouts.delete(planType);
    }, CHECKOUT_TIMEOUT);

    // Record in localStorage for cross-tab/cross-device detection
    try {
      const recent = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filtered = recent.filter((item) => (Date.now() - item.timestamp) < RECENT_CHECKOUT_WINDOW);
      filtered.push({ planType, timestamp: Date.now() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }

  /**
   * Clear checkout state (called after successful checkout)
   */
  clear(planType) {
    this.activeCheckouts.delete(planType);
  }

  /**
   * Clear all checkout history (useful for testing)
   */
  clearAll() {
    this.activeCheckouts.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silently fail
    }
  }
}

export const checkoutDedup = new CheckoutDeduplicator();
