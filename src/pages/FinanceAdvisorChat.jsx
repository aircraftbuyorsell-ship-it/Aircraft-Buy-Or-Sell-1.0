import PricingAdvisor from "./PricingAdvisor";

// The Aircraft Advisor now calls aircraftDataHub directly for real federated
// verification data. The client-side aircraftPreviewBridge interception and
// atiFullReportScore fallback (which scored missing data as AVOID) are retired.
export default function FinanceAdvisorChat() {
  return <PricingAdvisor />;
}