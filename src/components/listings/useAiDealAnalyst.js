import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function useAiDealAnalyst(listingId) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [paywall, setPaywall] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true); setError(""); setPaywall(false);
    try {
      const response = await base44.functions.invoke("aiOrchestrator", { action: "analyze_deal", listing_id: listingId });
      setResult(response.data.result); setRemaining(response.data.remaining_this_month);
    } catch (failure) {
      const status = failure?.response?.status || failure?.status;
      const data = failure?.response?.data || failure?.data || {};
      if (status === 402 || data.upgrade_required) setPaywall(true);
      else setError(data.error || failure.message || "AI analysis could not be completed.");
    } finally { setLoading(false); }
  };

  return { loading, result, remaining, paywall, error, run };
}