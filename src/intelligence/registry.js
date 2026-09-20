/**
 * ABOS Intelligence Layer — provider registry (master spec §30).
 *
 * Providers are backend data sources. The user sees ABOS Intelligence, not
 * "now let's query Provider A, then Provider B". Nothing here is hard-coded
 * into a screen: the router reads this registry, and a provider is turned on
 * or off by flipping `enabled` — no UI change required.
 *
 * Commercial terms: `cost_per_call_eur` and `commercial_use` are INTERNAL.
 * They drive routing economics and never render in public UI (§30 closing
 * note). `public_label` is the only string safe to show a visitor.
 */

export const PROVIDER_CATEGORY = {
  REGISTRY: "registry",
  AIRCRAFT_INTELLIGENCE: "aircraft_intelligence",
  VALUATION: "valuation",
  FLIGHT_OPERATIONS: "flight_operations",
  MAINTENANCE: "maintenance",
  MARKETPLACE: "marketplace",
  FINANCING: "financing",
  INSURANCE: "insurance",
  SERVICES: "services",
  DOCUMENT: "document",
  INTERNAL: "internal",
};

/** Access tier — drives the routing ladder in §31. */
export const ACCESS_TIER = {
  CACHE: 0,
  OPEN: 1,
  LICENSED: 2,
  PREMIUM: 3,
  LIVE_LOOKUP: 4,
};

/**
 * @typedef {Object} Provider
 * @property {string}  provider_id
 * @property {string}  name              internal name
 * @property {string}  public_label      safe to render publicly
 * @property {string}  category
 * @property {string}  region
 * @property {string}  coverage
 * @property {number}  tier              ACCESS_TIER
 * @property {string}  api_type
 * @property {string}  authentication
 * @property {string}  pricing_model     internal
 * @property {number}  cost_per_call_eur internal, estimate
 * @property {Object}  rate_limits
 * @property {string}  license
 * @property {string}  commercial_use    internal
 * @property {number}  data_freshness_h  typical age of the data in hours
 * @property {number}  confidence        base trust weight 0..1
 * @property {boolean} enabled
 * @property {string[]} provides         canonical field keys this provider can fill
 */

export const PROVIDERS = {
  abos_cache: {
    provider_id: "abos_cache",
    name: "ABOS cache",
    public_label: "ABOS",
    category: PROVIDER_CATEGORY.INTERNAL,
    region: "global",
    coverage: "Previously resolved aircraft",
    tier: ACCESS_TIER.CACHE,
    api_type: "internal",
    authentication: "session",
    pricing_model: "free",
    cost_per_call_eur: 0,
    rate_limits: null,
    license: "proprietary",
    commercial_use: "owned",
    data_freshness_h: 24,
    confidence: 0.8,
    enabled: true,
    provides: ["*"],
  },

  abos_listing: {
    provider_id: "abos_listing",
    name: "ABOS Marketspace listing",
    public_label: "ABOS listing",
    category: PROVIDER_CATEGORY.MARKETPLACE,
    region: "global",
    coverage: "Aircraft listed on ABOS",
    tier: ACCESS_TIER.OPEN,
    api_type: "internal",
    authentication: "session",
    pricing_model: "free",
    cost_per_call_eur: 0,
    rate_limits: null,
    license: "proprietary",
    commercial_use: "owned",
    data_freshness_h: 1,
    // Seller-supplied. Credible for configuration, never authoritative for
    // hours or history — hence the low base confidence.
    confidence: 0.45,
    enabled: true,
    provides: [
      "registration", "serial_number", "manufacturer", "model", "year",
      "asking_price", "currency", "listing_status", "listing_url", "days_on_market",
      "total_time", "engine_smoh", "engine_tbo", "avionics_suite", "autopilot",
      "seating", "interior_year", "exterior_year", "stcs", "home_base",
    ],
  },

  faa: {
    provider_id: "faa",
    name: "FAA Civil Aviation Registry",
    public_label: "FAA registry",
    category: PROVIDER_CATEGORY.REGISTRY,
    region: "US",
    coverage: "US-registered aircraft (N-numbers)",
    tier: ACCESS_TIER.OPEN,
    api_type: "internal function / bulk dataset",
    authentication: "none",
    pricing_model: "free",
    cost_per_call_eur: 0,
    rate_limits: { per_minute: 60 },
    license: "public domain",
    commercial_use: "permitted",
    data_freshness_h: 168,
    confidence: 0.95,
    enabled: true,
    provides: [
      "registration", "serial_number", "manufacturer", "model", "year",
      "registered_owner", "registration_status", "certificate_issue_date",
      "country", "registry", "engine_make_model", "engine_count", "seating",
      "ownership_changes",
    ],
  },

  national_registries: {
    provider_id: "national_registries",
    name: "National aviation registries (EASA member states and others)",
    public_label: "National registry",
    category: PROVIDER_CATEGORY.REGISTRY,
    region: "EU / global",
    coverage: "Non-US registries, varies by state",
    tier: ACCESS_TIER.OPEN,
    api_type: "mixed / scraped where permitted",
    authentication: "none",
    pricing_model: "free",
    cost_per_call_eur: 0,
    rate_limits: { per_minute: 20 },
    license: "varies by registry",
    commercial_use: "varies",
    data_freshness_h: 336,
    confidence: 0.85,
    enabled: true,
    provides: [
      "registration", "serial_number", "manufacturer", "model", "year",
      "registration_status", "country", "registry", "registered_owner", "operator",
    ],
  },

  ntsb: {
    provider_id: "ntsb",
    name: "NTSB accident & incident database",
    public_label: "NTSB",
    category: PROVIDER_CATEGORY.REGISTRY,
    region: "US",
    coverage: "US accident and incident records",
    tier: ACCESS_TIER.OPEN,
    api_type: "REST",
    authentication: "none",
    pricing_model: "free",
    cost_per_call_eur: 0,
    rate_limits: { per_minute: 30 },
    license: "public domain",
    commercial_use: "permitted",
    data_freshness_h: 720,
    confidence: 0.9,
    enabled: true,
    provides: ["damage_history", "accident_records"],
  },

  opensky: {
    provider_id: "opensky",
    name: "OpenSky Network",
    public_label: "OpenSky",
    category: PROVIDER_CATEGORY.FLIGHT_OPERATIONS,
    region: "global",
    coverage: "Community ADS-B coverage, uneven outside Europe/US",
    tier: ACCESS_TIER.OPEN,
    api_type: "REST",
    authentication: "optional basic auth",
    pricing_model: "free / rate limited",
    cost_per_call_eur: 0,
    rate_limits: { per_day_anonymous: 400, per_day_authenticated: 4000 },
    license: "research / attribution",
    commercial_use: "restricted — check terms before commercial display",
    data_freshness_h: 0,
    confidence: 0.7,
    enabled: true,
    provides: ["last_known_position", "last_seen", "flights_90d", "home_base"],
  },

  adsb_lol: {
    provider_id: "adsb_lol",
    name: "adsb.lol",
    public_label: "ADS-B community feed",
    category: PROVIDER_CATEGORY.FLIGHT_OPERATIONS,
    region: "global",
    coverage: "Community ADS-B feed",
    tier: ACCESS_TIER.OPEN,
    api_type: "REST",
    authentication: "none",
    pricing_model: "free",
    cost_per_call_eur: 0,
    rate_limits: { per_minute: 60 },
    license: "ODbL",
    commercial_use: "permitted with attribution",
    data_freshness_h: 0,
    confidence: 0.65,
    enabled: true,
    provides: ["last_known_position", "last_seen"],
  },

  abos_receivers: {
    provider_id: "abos_receivers",
    name: "ABOS receiver network",
    public_label: "ABOS receiver network",
    category: PROVIDER_CATEGORY.FLIGHT_OPERATIONS,
    region: "EU",
    coverage: "ABOS-owned ADS-B receivers",
    tier: ACCESS_TIER.OPEN,
    api_type: "internal",
    authentication: "session",
    pricing_model: "owned",
    cost_per_call_eur: 0,
    rate_limits: null,
    license: "proprietary",
    commercial_use: "owned",
    data_freshness_h: 0,
    confidence: 0.75,
    enabled: false,
    provides: ["last_known_position", "last_seen", "flights_90d"],
  },

  abos_omvm: {
    provider_id: "abos_omvm",
    name: "ABOS OMVM (Open Market Valuation Model)",
    public_label: "ABOS Market Model",
    category: PROVIDER_CATEGORY.VALUATION,
    region: "global",
    coverage: "GA and light jet secondary market",
    tier: ACCESS_TIER.OPEN,
    api_type: "internal",
    authentication: "session",
    pricing_model: "owned",
    cost_per_call_eur: 0,
    rate_limits: null,
    license: "proprietary",
    commercial_use: "owned",
    data_freshness_h: 24,
    confidence: 0.75,
    enabled: true,
    provides: ["estimated_value", "value_low", "value_high", "market_median", "comparable_count"],
  },

  vref: {
    provider_id: "vref",
    name: "VREF Aircraft Values & Appraisals",
    public_label: "VREF",
    category: PROVIDER_CATEGORY.VALUATION,
    region: "US-oriented, expanding",
    coverage: "Valuation, FAA and market data",
    tier: ACCESS_TIER.PREMIUM,
    api_type: "REST",
    authentication: "api key",
    pricing_model: "subject to plan",
    cost_per_call_eur: 2.5,
    rate_limits: { per_minute: 30 },
    license: "commercial licence",
    commercial_use: "subject to plan",
    data_freshness_h: 720,
    confidence: 0.88,
    // Off until a contract and key exist. The UI already knows how to display
    // a VREF number the moment this flips to true.
    enabled: false,
    provides: ["estimated_value", "value_low", "value_high", "market_median"],
  },

  jetnet: {
    provider_id: "jetnet",
    name: "JETNET",
    public_label: "JETNET",
    category: PROVIDER_CATEGORY.AIRCRAFT_INTELLIGENCE,
    region: "global",
    coverage: "Aircraft, company and contact data, market intelligence, history",
    tier: ACCESS_TIER.PREMIUM,
    api_type: "REST",
    authentication: "oauth / api key",
    pricing_model: "enterprise contract",
    cost_per_call_eur: 4.0,
    rate_limits: { per_minute: 60 },
    license: "enterprise licence",
    commercial_use: "subject to contract",
    data_freshness_h: 168,
    confidence: 0.9,
    enabled: false,
    provides: [
      "registration", "serial_number", "manufacturer", "model", "year",
      "registered_owner", "operator", "ownership_since", "ownership_changes",
      "total_time", "total_cycles", "engine_make_model", "engine_serial",
      "engine_tsn", "engine_program", "avionics_suite", "interior_year",
      "exterior_year", "days_on_market", "price_changes", "comparable_count",
      "maintenance_tracking", "export_import_history",
    ],
  },

  flightaware: {
    provider_id: "flightaware",
    name: "FlightAware AeroAPI",
    public_label: "FlightAware",
    category: PROVIDER_CATEGORY.FLIGHT_OPERATIONS,
    region: "global",
    coverage: "Live and historical flight data, 60+ endpoints",
    tier: ACCESS_TIER.PREMIUM,
    api_type: "REST",
    authentication: "api key",
    pricing_model: "usage-based",
    cost_per_call_eur: 0.3,
    rate_limits: { per_minute: 60 },
    license: "commercial",
    commercial_use: "subject to plan",
    data_freshness_h: 0,
    confidence: 0.92,
    enabled: false,
    provides: ["last_known_position", "last_seen", "flights_90d", "hours_12m", "home_base"],
  },

  document_intelligence: {
    provider_id: "document_intelligence",
    name: "ABOS Document Intelligence",
    public_label: "Uploaded documents",
    category: PROVIDER_CATEGORY.DOCUMENT,
    region: "global",
    coverage: "Logbooks, maintenance records, registration, invoices",
    tier: ACCESS_TIER.OPEN,
    api_type: "internal",
    authentication: "session",
    pricing_model: "owned",
    cost_per_call_eur: 0,
    rate_limits: null,
    license: "proprietary",
    commercial_use: "owned",
    data_freshness_h: 0,
    // Primary documents outrank every remote source.
    confidence: 0.97,
    enabled: true,
    provides: ["*"],
  },
};

/** All providers, as an array. */
export function allProviders() {
  return Object.values(PROVIDERS);
}

/** Providers currently switched on. */
export function enabledProviders() {
  return allProviders().filter((p) => p.enabled);
}

export function getProvider(providerId) {
  return PROVIDERS[providerId] || null;
}

/** Enabled providers in a category, cheapest tier first. */
export function providersFor(category, { includeDisabled = false } = {}) {
  return allProviders()
    .filter((p) => p.category === category && (includeDisabled || p.enabled))
    .sort((a, b) => a.tier - b.tier || b.confidence - a.confidence);
}

/** Enabled providers that can fill a given canonical field, cheapest first. */
export function providersProviding(fieldKey, { includeDisabled = false } = {}) {
  return allProviders()
    .filter((p) => (includeDisabled || p.enabled) && (p.provides.includes("*") || p.provides.includes(fieldKey)))
    .sort((a, b) => a.tier - b.tier || b.confidence - a.confidence);
}

/**
 * Public-safe view of a provider. Everything commercially sensitive is
 * stripped: no pricing, no contract terms, no per-call cost.
 */
export function publicProviderView(provider) {
  if (!provider) return null;
  return {
    id: provider.provider_id,
    label: provider.public_label,
    category: provider.category,
    region: provider.region,
    coverage: provider.coverage,
    status: provider.enabled ? "connected" : "available on request",
  };
}

/** Public provider list for the API / status pages. */
export function publicProviderCatalogue() {
  return allProviders()
    .filter((p) => p.category !== PROVIDER_CATEGORY.INTERNAL)
    .map(publicProviderView);
}
