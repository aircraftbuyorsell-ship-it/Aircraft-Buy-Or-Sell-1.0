const DEFAULT_MAX_CANDIDATES = 200;

const hasPublicVisibility = (record) => record?.status === "active" && record?.visibility === "public";

const stringOrNull = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
const finiteOrNull = (value, minimum = -Infinity) => Number.isFinite(value) && value >= minimum ? value : null;
const yearOrNull = (value) => Number.isInteger(value) && value >= 1903 ? value : null;
const countryCodeOrNull = (value) => {
  const normalized = stringOrNull(value)?.toUpperCase() || null;
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : null;
};
const currencyCode = (value) => {
  const normalized = stringOrNull(value)?.toUpperCase() || "USD";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "USD";
};
const dateTimeOrNull = (value) => {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
};
const uriOrNull = (value) => {
  const normalized = stringOrNull(value);
  if (!normalized) return null;
  try { return new URL(normalized).toString(); }
  catch { return null; }
};

const normalizeTerms = (intent) => Array.isArray(intent?.constraints?.terms)
  ? intent.constraints.terms
      .filter((term) => typeof term === "string")
      .map((term) => term.trim().toLowerCase())
      .filter(Boolean)
  : [];

const searchableAircraftText = (listing) => [
  listing.aircraft.manufacturer,
  listing.aircraft.model,
  listing.aircraft.identity.registration,
].filter(Boolean).join(" ").toLowerCase();

const assertAdapterDependencies = ({ base44, createPublicId, maxCandidates }) => {
  const filter = base44?.asServiceRole?.entities?.AircraftListing?.filter;
  if (typeof filter !== "function") {
    throw new TypeError("Base44 AircraftListing.filter must be available.");
  }
  if (typeof createPublicId !== "function") {
    throw new TypeError("createPublicId must be a function.");
  }
  if (!Number.isInteger(maxCandidates) || maxCandidates < 1 || maxCandidates > 1000) {
    throw new TypeError("maxCandidates must be an integer from 1 to 1000.");
  }
};

export function createBase44Repositories({
  base44,
  createPublicId,
  maxCandidates = DEFAULT_MAX_CANDIDATES,
}) {
  assertAdapterDependencies({ base44, createPublicId, maxCandidates });

  const toPublicListing = async (record) => {
    const listingId = await createPublicId("lst", record.id);
    const aircraftId = await createPublicId("ac", record.registration || record.id);
    const observedAt = dateTimeOrNull(record.updated_date) || dateTimeOrNull(record.created_date);
    const provenance = () => [{
      source: "legacy_marketplace",
      source_record_id: null,
      observed_at: observedAt,
      retrieval_method: "base44_adapter",
    }];

    return {
      listing_id: listingId,
      aircraft: {
        aircraft_id: aircraftId,
        identity: {
          registration: stringOrNull(record.registration),
          serial_number: stringOrNull(record.serial_number),
          registry_country: countryCodeOrNull(record.registry_country),
        },
        manufacturer: stringOrNull(record.make),
        model: stringOrNull(record.model),
        year: yearOrNull(record.year),
        total_time_hours: finiteOrNull(record.total_time, 0),
        engine_hours: finiteOrNull(record.engine_hours, 0),
        source_provenance: provenance(),
      },
      asking_price: Number.isFinite(record.asking_price) && record.asking_price >= 0
        ? { value: record.asking_price, currency: currencyCode(record.currency) }
        : null,
      location: record.country || record.region || record.city
        ? {
            country: countryCodeOrNull(record.country),
            region: stringOrNull(record.region),
            city: stringOrNull(record.city),
          }
        : null,
      status: "active",
      summary: stringOrNull(record.ai_summary),
      primary_image_url: uriOrNull(record.photo_url),
      intelligence: {
        ati_score: finiteOrNull(record.ati_score),
        observed_market_value: Number.isFinite(record.omvm_value) && record.omvm_value >= 0
          ? { value: record.omvm_value, currency: currencyCode(record.currency) }
          : null,
        deal_score: finiteOrNull(record.deal_score),
        deal_label: stringOrNull(record.deal_label),
        generated_at: dateTimeOrNull(record.intelligence_generated_at) || observedAt,
        engine_version: stringOrNull(record.intelligence_engine_version),
        limitations: ["Legacy intelligence values do not yet carry a complete calculation provenance record."],
      },
      source_provenance: provenance(),
      created_at: dateTimeOrNull(record.created_date),
      updated_at: dateTimeOrNull(record.updated_date),
    };
  };

  const readCandidates = async () => {
    const records = await base44.asServiceRole.entities.AircraftListing.filter(
      { status: "active", visibility: "public" },
      "-created_date",
      maxCandidates,
    );
    if (!Array.isArray(records)) {
      throw new TypeError("Base44 AircraftListing.filter must return an array.");
    }
    return Promise.all(records.filter(hasPublicVisibility).map(toPublicListing));
  };

  return {
    listingRepository: {
      async getByPublicId(publicId) {
        return (await readCandidates()).find((listing) => listing.listing_id === publicId) || null;
      },

      async search({ intent, limit }) {
        const listings = await readCandidates();
        const terms = normalizeTerms(intent);
        const matches = terms.length
          ? listings.filter((listing) => {
              const searchable = searchableAircraftText(listing);
              return terms.every((term) => searchable.includes(term));
            })
          : listings;

        return {
          items: matches
            .sort((left, right) => (right.intelligence.ati_score || 0) - (left.intelligence.ati_score || 0))
            .slice(0, limit),
          nextCursor: null,
        };
      },
    },

    aircraftRepository: {
      async getByPublicId(publicId) {
        const listing = (await readCandidates()).find((candidate) => candidate.aircraft.aircraft_id === publicId);
        return listing?.aircraft || null;
      },
    },
  };
}
