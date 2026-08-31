import { SearchPresentationError, type SearchFailureKind } from "./adapter.js";
import type { AircraftListing, SearchRequest, SearchResponse } from "./contract.js";

export interface StructuredSearchDraft {
  manufacturer: string;
  model: string;
  maximumPrice: string;
  region: string;
}

export const EMPTY_STRUCTURED_SEARCH: StructuredSearchDraft = {
  manufacturer: "",
  model: "",
  maximumPrice: "",
  region: "",
};

export function buildStructuredQuery(draft: StructuredSearchDraft): string {
  const identity = [draft.manufacturer.trim(), draft.model.trim()].filter(Boolean).join(" ");
  const budget = draft.maximumPrice.trim() ? `under ${draft.maximumPrice.trim()}` : "";
  const region = draft.region.trim() ? `in ${draft.region.trim()}` : "";
  return [identity || "aircraft", budget, region].filter(Boolean).join(" ");
}

export function createSearchRequest(query: string, cursor: string | null = null): SearchRequest {
  const normalized = query.trim();
  if (!normalized) throw new Error("Enter an aircraft search query.");
  if (normalized.length > 500) throw new Error("Search queries are limited to 500 characters.");
  return { query: normalized, page_size: 20, cursor };
}

export function hasPartialData(listing: AircraftListing): boolean {
  return listing.asking_price === null
    || listing.location === null
    || listing.aircraft.manufacturer === null
    || listing.aircraft.model === null
    || listing.intelligence.ati_score === null
    || listing.intelligence.observed_market_value === null;
}

export function mergeSearchResponses(previous: SearchResponse, next: SearchResponse): SearchResponse {
  return { ...next, results: [...previous.results, ...next.results] };
}

export type SearchViewState =
  | { kind: "initial" }
  | { kind: "invalid"; message: string }
  | { kind: "loading"; query: string }
  | { kind: "empty"; response: SearchResponse }
  | { kind: "success"; response: SearchResponse }
  | { kind: "partial"; response: SearchResponse }
  | { kind: "failure"; failure: SearchFailureKind; message: string; retryAfterSeconds: number | null; request: SearchRequest };

export type LoadMoreState =
  | { kind: "idle" }
  | { kind: "loadingMore" }
  | { kind: "loadMoreError"; message: string; request: SearchRequest };

export function stateFromResponse(response: SearchResponse): SearchViewState {
  if (response.results.length === 0) return { kind: "empty", response };
  if (response.results.some(hasPartialData)) return { kind: "partial", response };
  return { kind: "success", response };
}

export function stateFromError(error: unknown, request: SearchRequest): SearchViewState {
  if (error instanceof SearchPresentationError) {
    return { kind: "failure", failure: error.kind, message: error.message, retryAfterSeconds: error.retryAfterSeconds, request };
  }
  return {
    kind: "failure",
    failure: "fatal",
    message: "Aircraft search is unavailable. Try again later.",
    retryAfterSeconds: null,
    request,
  };
}
