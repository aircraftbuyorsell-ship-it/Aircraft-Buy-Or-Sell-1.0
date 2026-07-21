const AIRCRAFT_ID = /^ac_[a-f0-9]{24}$/;
const LISTING_ID = /^lst_[a-f0-9]{24}$/;
const VALUATION_ID = /^val_/;
const COUNTRY_CODE = /^[A-Z]{2}$/;
const CURRENCY_CODE = /^[A-Z]{3}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const fail = (path, message) => {
  throw new TypeError(`Contract violation at ${path}: ${message}`);
};

const assertObject = (value, path) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "expected an object");
};

const assertKeys = (value, path, required, allowed) => {
  assertObject(value, path);
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) fail(`${path}.${key}`, "required property is missing");
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key}`, "property is not declared by the public contract");
  }
};

const assertString = (value, path) => {
  if (typeof value !== "string") fail(path, "expected a string");
};

const assertStringOrNull = (value, path) => {
  if (value !== null && typeof value !== "string") fail(path, "expected a string or null");
};

const assertNumberOrNull = (value, path, { minimum = -Infinity, maximum = Infinity, integer = false } = {}) => {
  if (value === null) return;
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value)) || value < minimum || value > maximum) {
    fail(path, `expected ${integer ? "an integer" : "a number"} from ${minimum} to ${maximum}, or null`);
  }
};

const assertDateTimeOrNull = (value, path) => {
  if (value === null) return;
  if (typeof value !== "string" || !DATE_TIME.test(value) || !Number.isFinite(Date.parse(value))) {
    fail(path, "expected an RFC 3339 date-time or null");
  }
};

const assertUriOrNull = (value, path) => {
  if (value === null) return;
  if (typeof value !== "string") fail(path, "expected a URI or null");
  try { new URL(value); }
  catch { fail(path, "expected a URI or null"); }
};

const assertStringArray = (value, path) => {
  if (!Array.isArray(value)) fail(path, "expected an array");
  value.forEach((item, index) => assertString(item, `${path}[${index}]`));
};

const assertPrice = (value, path) => {
  assertKeys(value, path, ["value", "currency"], new Set(["value", "currency"]));
  if (!Number.isFinite(value.value) || value.value < 0) fail(`${path}.value`, "expected a non-negative number");
  if (typeof value.currency !== "string" || !CURRENCY_CODE.test(value.currency)) fail(`${path}.currency`, "expected an ISO-like three-letter uppercase currency code");
};

const assertPriceOrNull = (value, path) => {
  if (value !== null) assertPrice(value, path);
};

const assertSourceProvenance = (value, path) => {
  if (!Array.isArray(value)) fail(path, "expected an array");
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    assertKeys(
      item,
      itemPath,
      ["source", "source_record_id", "observed_at", "retrieval_method"],
      new Set(["source", "source_record_id", "observed_at", "retrieval_method"]),
    );
    assertString(item.source, `${itemPath}.source`);
    assertStringOrNull(item.source_record_id, `${itemPath}.source_record_id`);
    assertDateTimeOrNull(item.observed_at, `${itemPath}.observed_at`);
    assertString(item.retrieval_method, `${itemPath}.retrieval_method`);
  });
};

const assertAircraftIdentity = (value, path) => {
  assertKeys(value, path, [], new Set(["registration", "serial_number", "registry_country"]));
  if (Object.prototype.hasOwnProperty.call(value, "registration")) assertStringOrNull(value.registration, `${path}.registration`);
  if (Object.prototype.hasOwnProperty.call(value, "serial_number")) assertStringOrNull(value.serial_number, `${path}.serial_number`);
  if (Object.prototype.hasOwnProperty.call(value, "registry_country")) {
    assertStringOrNull(value.registry_country, `${path}.registry_country`);
    if (value.registry_country !== null && !COUNTRY_CODE.test(value.registry_country)) fail(`${path}.registry_country`, "expected a two-letter uppercase country code or null");
  }
};

export const assertAircraft = (value, path = "Aircraft") => {
  assertKeys(
    value,
    path,
    ["aircraft_id", "identity", "manufacturer", "model", "source_provenance"],
    new Set(["aircraft_id", "identity", "manufacturer", "model", "year", "total_time_hours", "engine_hours", "source_provenance"]),
  );
  if (typeof value.aircraft_id !== "string" || !AIRCRAFT_ID.test(value.aircraft_id)) fail(`${path}.aircraft_id`, "invalid public aircraft ID");
  assertAircraftIdentity(value.identity, `${path}.identity`);
  assertStringOrNull(value.manufacturer, `${path}.manufacturer`);
  assertStringOrNull(value.model, `${path}.model`);
  if (Object.prototype.hasOwnProperty.call(value, "year")) assertNumberOrNull(value.year, `${path}.year`, { minimum: 1903, integer: true });
  if (Object.prototype.hasOwnProperty.call(value, "total_time_hours")) assertNumberOrNull(value.total_time_hours, `${path}.total_time_hours`, { minimum: 0 });
  if (Object.prototype.hasOwnProperty.call(value, "engine_hours")) assertNumberOrNull(value.engine_hours, `${path}.engine_hours`, { minimum: 0 });
  assertSourceProvenance(value.source_provenance, `${path}.source_provenance`);
};

const assertLocationOrNull = (value, path) => {
  if (value === null) return;
  assertKeys(value, path, [], new Set(["country", "region", "city"]));
  if (Object.prototype.hasOwnProperty.call(value, "country")) {
    assertStringOrNull(value.country, `${path}.country`);
    if (value.country !== null && !COUNTRY_CODE.test(value.country)) fail(`${path}.country`, "expected a two-letter uppercase country code or null");
  }
  if (Object.prototype.hasOwnProperty.call(value, "region")) assertStringOrNull(value.region, `${path}.region`);
  if (Object.prototype.hasOwnProperty.call(value, "city")) assertStringOrNull(value.city, `${path}.city`);
};

const assertIntelligence = (value, path) => {
  assertKeys(
    value,
    path,
    ["ati_score", "observed_market_value", "deal_score", "deal_label", "generated_at", "engine_version", "limitations"],
    new Set(["ati_score", "observed_market_value", "deal_score", "deal_label", "generated_at", "engine_version", "limitations"]),
  );
  assertNumberOrNull(value.ati_score, `${path}.ati_score`);
  assertPriceOrNull(value.observed_market_value, `${path}.observed_market_value`);
  assertNumberOrNull(value.deal_score, `${path}.deal_score`);
  assertStringOrNull(value.deal_label, `${path}.deal_label`);
  assertDateTimeOrNull(value.generated_at, `${path}.generated_at`);
  assertStringOrNull(value.engine_version, `${path}.engine_version`);
  assertStringArray(value.limitations, `${path}.limitations`);
};

export const assertAircraftListing = (value, path = "AircraftListing") => {
  assertKeys(
    value,
    path,
    ["listing_id", "aircraft", "asking_price", "location", "status", "intelligence", "source_provenance", "created_at", "updated_at"],
    new Set(["listing_id", "aircraft", "asking_price", "location", "status", "summary", "primary_image_url", "intelligence", "source_provenance", "created_at", "updated_at"]),
  );
  if (typeof value.listing_id !== "string" || !LISTING_ID.test(value.listing_id)) fail(`${path}.listing_id`, "invalid public listing ID");
  assertAircraft(value.aircraft, `${path}.aircraft`);
  assertPriceOrNull(value.asking_price, `${path}.asking_price`);
  assertLocationOrNull(value.location, `${path}.location`);
  assertString(value.status, `${path}.status`);
  if (Object.prototype.hasOwnProperty.call(value, "summary")) assertStringOrNull(value.summary, `${path}.summary`);
  if (Object.prototype.hasOwnProperty.call(value, "primary_image_url")) assertUriOrNull(value.primary_image_url, `${path}.primary_image_url`);
  assertIntelligence(value.intelligence, `${path}.intelligence`);
  assertSourceProvenance(value.source_provenance, `${path}.source_provenance`);
  assertDateTimeOrNull(value.created_at, `${path}.created_at`);
  assertDateTimeOrNull(value.updated_at, `${path}.updated_at`);
};

const assertSearchIntent = (value, path) => {
  assertKeys(value, path, ["intent", "interpretation_status", "constraints"], new Set(["intent", "interpretation_status", "constraints"]));
  assertString(value.intent, `${path}.intent`);
  if (!["deterministic", "unavailable"].includes(value.interpretation_status)) fail(`${path}.interpretation_status`, "invalid interpretation status");
  assertKeys(value.constraints, `${path}.constraints`, [], new Set(["terms"]));
  if (Object.prototype.hasOwnProperty.call(value.constraints, "terms")) assertStringArray(value.constraints.terms, `${path}.constraints.terms`);
};

const assertSearchResponse = (value) => {
  assertKeys(value, "SearchResponse", ["query", "intent", "results", "page", "explanation"], new Set(["query", "intent", "results", "page", "explanation"]));
  assertString(value.query, "SearchResponse.query");
  assertSearchIntent(value.intent, "SearchResponse.intent");
  if (!Array.isArray(value.results)) fail("SearchResponse.results", "expected an array");
  value.results.forEach((item, index) => assertAircraftListing(item, `SearchResponse.results[${index}]`));
  assertKeys(value.page, "SearchResponse.page", ["page_size", "next_cursor", "has_more"], new Set(["page_size", "next_cursor", "has_more"]));
  if (!Number.isInteger(value.page.page_size)) fail("SearchResponse.page.page_size", "expected an integer");
  assertStringOrNull(value.page.next_cursor, "SearchResponse.page.next_cursor");
  if (typeof value.page.has_more !== "boolean") fail("SearchResponse.page.has_more", "expected a boolean");
  assertString(value.explanation, "SearchResponse.explanation");
};

const assertValuationResult = (value) => {
  assertKeys(
    value,
    "ValuationResult",
    ["valuation_id", "status", "estimated_value", "range", "confidence", "data_completeness", "generated_at", "engine_version", "source_provenance", "limitations"],
    new Set(["valuation_id", "status", "estimated_value", "range", "confidence", "data_completeness", "generated_at", "engine_version", "source_provenance", "limitations"]),
  );
  if (typeof value.valuation_id !== "string" || !VALUATION_ID.test(value.valuation_id)) fail("ValuationResult.valuation_id", "invalid valuation ID");
  if (!["complete", "insufficient_data"].includes(value.status)) fail("ValuationResult.status", "invalid valuation status");
  assertPriceOrNull(value.estimated_value, "ValuationResult.estimated_value");
  assertKeys(value.range, "ValuationResult.range", ["minimum", "maximum", "currency"], new Set(["minimum", "maximum", "currency"]));
  assertNumberOrNull(value.range.minimum, "ValuationResult.range.minimum");
  assertNumberOrNull(value.range.maximum, "ValuationResult.range.maximum");
  if (typeof value.range.currency !== "string" || !CURRENCY_CODE.test(value.range.currency)) fail("ValuationResult.range.currency", "invalid currency code");
  assertNumberOrNull(value.confidence, "ValuationResult.confidence", { minimum: 0, maximum: 1 });
  if (!Number.isFinite(value.data_completeness) || value.data_completeness < 0 || value.data_completeness > 1) fail("ValuationResult.data_completeness", "expected a number from 0 to 1");
  assertDateTimeOrNull(value.generated_at, "ValuationResult.generated_at");
  assertStringOrNull(value.engine_version, "ValuationResult.engine_version");
  assertSourceProvenance(value.source_provenance, "ValuationResult.source_provenance");
  assertStringArray(value.limitations, "ValuationResult.limitations");
};

export function assertOperationResponse(operationId, value) {
  switch (operationId) {
    case "searchListings": return assertSearchResponse(value);
    case "getAircraft": return assertAircraft(value);
    case "getListing": return assertAircraftListing(value);
    case "requestValuation": return assertValuationResult(value);
    default: throw new TypeError(`Unknown Core API operation: ${operationId}`);
  }
}
