import type { SearchRequest, SearchResponse } from "./contract.js";

/** Trusted integration seam. A Mode-B SDK implementation may satisfy this
 * interface; presentation components never know transport or storage details. */
export interface AircraftSearchAdapter {
  search(request: SearchRequest, options?: { signal?: AbortSignal }): Promise<SearchResponse>;
}

export type SearchFailureKind =
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "offline"
  | "recoverable"
  | "fatal";

/** Client-side presentation classification, not a public API error code. */
export class SearchPresentationError extends Error {
  readonly kind: SearchFailureKind;
  readonly retryAfterSeconds: number | null;

  constructor(kind: SearchFailureKind, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "SearchPresentationError";
    this.kind = kind;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
