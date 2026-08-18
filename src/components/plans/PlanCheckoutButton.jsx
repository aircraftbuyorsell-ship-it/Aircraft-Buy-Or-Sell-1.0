import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function PlanCheckoutButton({ planType, label = "Subscribe", variant = "default" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("stripeCreateCheckout", {
        plan_type: planType,
        returnUrl: window.location.href,
      });
      if (res.data?.sessionUrl) window.location.href = res.data.sessionUrl;
      else setError("Could not start checkout. Please try again.");
    } catch (e) {
      if ([401, 403].includes(e?.response?.status || e?.status)) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      setError(e?.response?.data?.error || "Could not start checkout. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Button onClick={start} disabled={loading} variant={variant} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
      </Button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  );
}