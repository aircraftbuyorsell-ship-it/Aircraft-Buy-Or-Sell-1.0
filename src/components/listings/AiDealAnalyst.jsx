import { BrainCircuit, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import useAiDealAnalyst from "@/components/listings/useAiDealAnalyst";
import AiDealResultCard from "@/components/listings/AiDealResultCard";
import AiDealPaywall from "@/components/listings/AiDealPaywall";
import "@/components/listings/ai-deal-analyst.css";

export default function AiDealAnalyst({ listingId }) {
  const { isAuthenticated } = useAuth();
  const state = useAiDealAnalyst(listingId);
  if (!isAuthenticated) return null;
  return <div className="border-t border-black/[0.05] px-5 py-4"><button type="button" className="ai-deal-button" onClick={state.run} disabled={state.loading}>{state.loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <BrainCircuit className="h-4 w-4"/>}{state.loading ? "Analyzing Deal…" : "AI Deal Analyst"}</button>{state.paywall && <AiDealPaywall/>}{state.error && <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{state.error}</p>}<AiDealResultCard result={state.result} remaining={state.remaining}/></div>;
}