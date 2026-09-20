/**
 * Adapter: ABOS Marketspace listing → canonical fields.
 *
 * Listing data is seller-supplied. It is credible about configuration and
 * asking price, and NOT authoritative about hours, history or ownership —
 * the registry base confidence in registry.js reflects that, and the conflict
 * engine will flag a listing that contradicts a registry.
 */

import { base44 } from "@/api/base44Client";
import { source } from "../provenance";
import { DATA_CLASS } from "../provenance";

const PROVIDER_ID = "abos_listing";

function candidate(field, value, listing, dataClass = DATA_CLASS.OBSERVED) {
  if (value === null || value === undefined || value === "") return null;
  return {
    field,
    value,
    dataClass,
    source: source({
      providerId: PROVIDER_ID,
      providerName: "ABOS listing",
      type: dataClass,
      sourceDate: listing?.updated_date || listing?.created_date || null,
      url: listing?.source_url || null,
    }),
  };
}

export async function listingAdapter({ registration }) {
  const reg = String(registration || "").trim().toUpperCase();
  if (!reg) return { candidates: [] };

  const compact = reg.replace(/-/g, "");
  let listings = [];
  try {
    listings = await base44.entities.AircraftListing.filter({ registration: reg }, "-updated_date", 5);
  } catch {
    listings = [];
  }
  if (!listings?.length && compact !== reg) {
    try {
      listings = await base44.entities.AircraftListing.filter({ registration: compact }, "-updated_date", 5);
    } catch {
      listings = [];
    }
  }

  const listing = listings?.[0];
  if (!listing) return { candidates: [], note: "No ABOS listing for this registration." };

  const daysOnMarket = listing.created_date
    ? Math.max(0, Math.round((Date.now() - new Date(listing.created_date).getTime()) / 86400000))
    : null;

  const candidates = [
    candidate("registration", listing.registration, listing),
    candidate("manufacturer", listing.make, listing),
    candidate("model", listing.model, listing),
    candidate("year", toNumber(listing.year), listing),
    candidate("total_time", toNumber(listing.total_time), listing),
    candidate("engine_smoh", toNumber(listing.engine_hours), listing),
    candidate("engine_tbo", toNumber(listing.tbo), listing),
    candidate("last_annual", listing.last_annual, listing),
    candidate("avionics_suite", listing.avionics, listing),
    candidate("asking_price", toNumber(listing.asking_price), listing),
    candidate("currency", listing.currency, listing),
    candidate("listing_status", listing.status, listing),
    candidate("listing_url", listing.source_url, listing),
    candidate("days_on_market", daysOnMarket, listing, DATA_CLASS.DERIVED),
  ].filter(Boolean);

  return {
    candidates,
    freshnessH: listing.updated_date
      ? Math.round((Date.now() - new Date(listing.updated_date).getTime()) / 3600000)
      : null,
    costEur: 0,
    meta: { listing_id: listing.id, ati_score: listing.ati_score ?? null, omvm_value: listing.omvm_value ?? null },
  };
}

function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
