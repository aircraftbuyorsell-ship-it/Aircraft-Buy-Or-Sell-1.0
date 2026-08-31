import FunnelDashboard from "@/pages/FunnelDashboard";

/**
 * GrowthCenter — consolidated growth/funnel hub.
 * Phase 1: renders the legacy FunnelDashboard management view (non-breaking).
 * Funnel canvas remains at /funnels/:id/canvas (legacy route, preserved).
 * Phase 2 will fold the canvas into /growth-center/:id/canvas and restyle to Core.
 */
export default function GrowthCenter() {
  return <FunnelDashboard />;
}