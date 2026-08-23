import type { AircraftSearchAdapter } from "./adapter.js";
import type { AircraftListing } from "./contract.js";
import { AircraftSearchV2 } from "./components/AircraftSearchV2.js";

/** Proposed parallel route element. The host owns navigation and adapter creation. */
export interface AircraftSearchV2RouteProps {
  adapter: AircraftSearchAdapter;
  approvedImageHosts?: readonly string[];
  onOpenListing?: (listing: AircraftListing) => void;
  onRequestAuthentication?: () => void;
  onRequestAccess?: () => void;
}

export function AircraftSearchV2Route(props: AircraftSearchV2RouteProps) {
  return <AircraftSearchV2 {...props} />;
}
