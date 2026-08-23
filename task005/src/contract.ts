/**
 * Hand-authored TypeScript view of the approved TASK-001 SearchRequest and
 * SearchResponse schemas. Contract tests validate fixtures against the pinned
 * OpenAPI source; these types do not extend the public DTO.
 */
export type AircraftId = `ac_${string}`;
export type ListingId = `lst_${string}`;

export interface SourceProvenance {
  source: string;
  source_record_id: string | null;
  observed_at: string | null;
  retrieval_method: string;
}

export interface AircraftIdentity {
  registration?: string | null;
  serial_number?: string | null;
  registry_country?: string | null;
}

export interface Aircraft {
  aircraft_id: AircraftId;
  identity: AircraftIdentity;
  manufacturer: string | null;
  model: string | null;
  year?: number | null;
  total_time_hours?: number | null;
  engine_hours?: number | null;
  source_provenance: SourceProvenance[];
}

export interface Price {
  value: number;
  currency: string;
}

export interface Location {
  country?: string | null;
  region?: string | null;
  city?: string | null;
}

export interface IntelligenceMetadata {
  ati_score: number | null;
  observed_market_value: Price | null;
  deal_score: number | null;
  deal_label: string | null;
  generated_at: string | null;
  engine_version: string | null;
  limitations: string[];
}

export interface AircraftListing {
  listing_id: ListingId;
  aircraft: Aircraft;
  asking_price: Price | null;
  location: Location | null;
  status: string;
  summary?: string | null;
  primary_image_url?: string | null;
  intelligence: IntelligenceMetadata;
  source_provenance: SourceProvenance[];
  created_at: string | null;
  updated_at: string | null;
}

export interface SearchIntent {
  intent: string;
  interpretation_status: "deterministic" | "unavailable";
  constraints: {
    terms?: string[];
  };
}

export interface SearchRequest {
  query: string;
  page_size?: number;
  cursor?: string | null;
}

export interface SearchResponse {
  query: string;
  intent: SearchIntent;
  results: AircraftListing[];
  page: {
    page_size: number;
    next_cursor: string | null;
    has_more: boolean;
  };
  explanation: string;
}

export type ErrorDetailValue = string | number | boolean | null | Array<string | number | boolean | null>;

export interface APIError {
  error: {
    code: string;
    message: string;
    request_id: string | null;
    details: Record<string, ErrorDetailValue>;
    documentation_url: string | null;
  };
}
