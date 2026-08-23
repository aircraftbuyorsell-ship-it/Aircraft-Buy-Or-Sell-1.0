import { SearchPresentationError, type AircraftSearchAdapter, type SearchFailureKind } from "./adapter.js";
import type { AircraftListing, SearchRequest, SearchResponse } from "./contract.js";

const observedAt = "2026-07-17T12:00:00Z";

const provenance = (record: string) => [{
  source: "task005-fixture",
  source_record_id: record,
  observed_at: observedAt,
  retrieval_method: "typed_fixture",
}];

const citation: AircraftListing = {
  listing_id: "lst_0123456789abcdef01234567",
  aircraft: {
    aircraft_id: "ac_0123456789abcdef01234567",
    identity: { registration: null, serial_number: null, registry_country: "DE" },
    manufacturer: "Cessna",
    model: "Citation Latitude",
    year: 2019,
    total_time_hours: 1840,
    engine_hours: 920,
    source_provenance: provenance("fixture-aircraft-latitude"),
  },
  asking_price: { value: 7_800_000, currency: "USD" },
  location: { country: "DE", region: "Europe", city: "Munich" },
  status: "active",
  summary: "Typed visual fixture for the TASK-005 search draft.",
  primary_image_url: null,
  intelligence: {
    ati_score: 82,
    observed_market_value: { value: 8_050_000, currency: "USD" },
    deal_score: 76,
    deal_label: "Fixture example",
    generated_at: observedAt,
    engine_version: "fixture-only",
    limitations: ["Fixture intelligence for visual review only; it is not a live valuation."],
  },
  source_provenance: provenance("fixture-listing-latitude"),
  created_at: "2026-07-01T09:00:00Z",
  updated_at: observedAt,
};

const phenom: AircraftListing = {
  listing_id: "lst_fedcba987654321001234567",
  aircraft: {
    aircraft_id: "ac_fedcba987654321001234567",
    identity: { registration: null, serial_number: null, registry_country: "FR" },
    manufacturer: "Embraer",
    model: "Phenom 300E",
    year: 2020,
    total_time_hours: 1280,
    engine_hours: 640,
    source_provenance: provenance("fixture-aircraft-phenom"),
  },
  asking_price: { value: 9_950_000, currency: "USD" },
  location: { country: "FR", region: "Europe", city: null },
  status: "active",
  summary: "A second approved-shape listing fixture for responsive layouts.",
  primary_image_url: null,
  intelligence: {
    ati_score: 79,
    observed_market_value: { value: 10_100_000, currency: "USD" },
    deal_score: 71,
    deal_label: "Fixture example",
    generated_at: observedAt,
    engine_version: "fixture-only",
    limitations: ["Fixture intelligence for visual review only; it is not a live valuation."],
  },
  source_provenance: provenance("fixture-listing-phenom"),
  created_at: "2026-06-20T09:00:00Z",
  updated_at: observedAt,
};

const partialListing: AircraftListing = {
  listing_id: "lst_aaaaaaaaaaaaaaaaaaaaaaaa",
  aircraft: {
    aircraft_id: "ac_bbbbbbbbbbbbbbbbbbbbbbbb",
    identity: { registration: null, serial_number: null, registry_country: null },
    manufacturer: "Pilatus",
    model: "PC-12",
    year: null,
    total_time_hours: null,
    engine_hours: null,
    source_provenance: provenance("fixture-aircraft-partial"),
  },
  asking_price: null,
  location: null,
  status: "active",
  summary: null,
  primary_image_url: null,
  intelligence: {
    ati_score: null,
    observed_market_value: null,
    deal_score: null,
    deal_label: null,
    generated_at: null,
    engine_version: null,
    limitations: ["Fixture demonstrates contract-permitted missing data."],
  },
  source_provenance: provenance("fixture-listing-partial"),
  created_at: null,
  updated_at: observedAt,
};

const response = (query: string, results: AircraftListing[]): SearchResponse => ({
  query,
  intent: {
    intent: "BUY",
    interpretation_status: "deterministic",
    constraints: { terms: query.toLowerCase().split(/\s+/).filter(Boolean) },
  },
  results,
  page: { page_size: 20, next_cursor: null, has_more: false },
  explanation: "Mode A typed fixtures demonstrate the approved SearchResponse shape.",
});

export const searchFixtures = {
  success: response("business jets in Europe", [citation, phenom]),
  empty: response("amphibious aircraft under 100k", []),
  partial: response("Pilatus PC-12", [partialListing]),
} as const;

export type FixtureScenario = keyof typeof searchFixtures | SearchFailureKind;

const FAILURE_COPY: Record<SearchFailureKind, { message: string; retryAfter: number | null }> = {
  unauthorized: { message: "Sign in or provide approved access to search aircraft.", retryAfter: null },
  forbidden: { message: "Your account does not have access to aircraft search.", retryAfter: null },
  rate_limited: { message: "Fixture-only rate-limit state for visual review.", retryAfter: 60 },
  offline: { message: "You appear to be offline. Reconnect and try again.", retryAfter: null },
  recoverable: { message: "The search could not be completed. Try again.", retryAfter: null },
  fatal: { message: "Aircraft search is unavailable. Try again later.", retryAfter: null },
};

export class FixtureAircraftSearchAdapter implements AircraftSearchAdapter {
  readonly scenario: FixtureScenario;
  readonly latencyMs: number;

  constructor(scenario: FixtureScenario = "success", latencyMs = 0) {
    this.scenario = scenario;
    this.latencyMs = latencyMs;
  }

  async search(request: SearchRequest, options?: { signal?: AbortSignal }): Promise<SearchResponse> {
    if (this.latencyMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, this.latencyMs);
        options?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Search cancelled", "AbortError"));
        }, { once: true });
      });
    }
    if (options?.signal?.aborted) throw new DOMException("Search cancelled", "AbortError");
    if (this.scenario in searchFixtures) {
      const fixture = searchFixtures[this.scenario as keyof typeof searchFixtures];
      return structuredClone({
        ...fixture,
        query: request.query,
        intent: {
          ...fixture.intent,
          constraints: { terms: request.query.toLowerCase().split(/\s+/).filter(Boolean) },
        },
      });
    }
    const failure = FAILURE_COPY[this.scenario as SearchFailureKind];
    throw new SearchPresentationError(this.scenario as SearchFailureKind, failure.message, failure.retryAfter);
  }
}
