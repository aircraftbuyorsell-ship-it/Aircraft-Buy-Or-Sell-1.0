import PricingAdvisor from "./PricingAdvisor";
import { installAircraftPreviewBridge } from "@/lib/aircraftPreviewBridge";

// Keep the existing Aircraft Advisor UI and route. The bridge only replaces
// the stale/unavailable preview function call with the shared ABOS lookup.
installAircraftPreviewBridge();

export default function FinanceAdvisorChat() {
  return <PricingAdvisor />;
}
