import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { normalizePaymentError, logPaymentError } from "@/utils/paymentErrors";
import { checkoutDedup } from "@/utils/checkoutDedup";

export default function PlanCheckoutButton({ planType, label = "Subscribe", variant = "default", returnUrl, onCheckoutStarted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    // Check for duplicate checkout attempt
    if (checkoutDedup.isDuplicate(planType)) {
      setError("A checkout is already in progress. Please wait or check your email.");
      return;
    }

    setLoading(true);
    setError("");
    checkoutDedup.markActive(planType);

    try {
      // Validate return URL exists and is absolute
      const finalReturnUrl = returnUrl || window.location.href;
      if (!finalReturnUrl.startsWith('http')) {
        throw new Error('Invalid checkout return URL');
      }

      const res = await base44.functions.invoke("stripeCreateCheckout", {
        plan_type: planType,
        returnUrl: finalReturnUrl,
      });

      if (!res.data?.sessionUrl) {
        throw new Error(res.data?.error || "No checkout URL returned");
      }

      // Notify parent component before redirect
      if (onCheckoutStarted) {
        onCheckoutStarted(res.data.sessionId);
      }

      // Store session ID for post-checkout verification
      if (res.data.sessionId) {
        sessionStorage.setItem('stripeSessionId', res.data.sessionId);
      }

      // Redirect to Stripe Checkout with return URL pointing to success page
      const successUrl = new URL('/checkout-success', window.location.origin);
      successUrl.searchParams.set('session_id', res.data.sessionId);
      window.location.href = res.data.sessionUrl;
    } catch (e) {
      const status = e?.response?.status || e?.status;

      if (status === 401 || status === 403) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const errorMsg = normalizePaymentError(e);
      logPaymentError('checkout_button_click', e);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={start}
        disabled={loading}
        variant={variant}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          label
        )}
      </Button>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-destructive" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}