import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

export default function PlanCheckoutButton({ planType, label = "Subscribe", variant = "default", returnUrl, onCheckoutStarted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setLoading(true);
    setError("");
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

      // Redirect to Stripe Checkout
      window.location.href = res.data.sessionUrl;
    } catch (e) {
      const status = e?.response?.status || e?.status;

      if (status === 401 || status === 403) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const errorMsg = e?.response?.data?.error || e?.message || "Could not start checkout. Please try again.";
      console.error("Checkout error:", e);
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