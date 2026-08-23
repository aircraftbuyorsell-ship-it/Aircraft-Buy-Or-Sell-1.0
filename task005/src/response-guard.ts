import type { SearchResponse, SourceProvenance } from "./contract.js";

const AIRCRAFT_ID = /^ac_[a-f0-9]{24}$/;
const LISTING_ID = /^lst_[a-f0-9]{24}$/;
const FORBIDDEN_SOURCE_RECORD_ID = /^(base44_|internal_|[a-f0-9]{24}$)/;

const assertSafeProvenance = (provenance: SourceProvenance[]): void => {
  for (const record of provenance) {
    if (record.source_record_id !== null && FORBIDDEN_SOURCE_RECORD_ID.test(record.source_record_id)) {
      throw new Error("Search response contains a forbidden source record identifier.");
    }
  }
};

/** Runtime guard for the identity constraints that TypeScript cannot enforce. */
export function assertSafeSearchResponse(response: SearchResponse): SearchResponse {
  for (const listing of response.results) {
    if (!LISTING_ID.test(listing.listing_id)) throw new Error("Search response contains an invalid listing identifier.");
    if (!AIRCRAFT_ID.test(listing.aircraft.aircraft_id)) throw new Error("Search response contains an invalid aircraft identifier.");
    assertSafeProvenance(listing.source_provenance);
    assertSafeProvenance(listing.aircraft.source_provenance);
  }
  return response;
}
