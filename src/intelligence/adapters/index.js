/**
 * Adapter registry. Maps provider_id → adapter function.
 *
 * An adapter's only job is to translate one provider's payload into canonical
 * candidates. It never decides whether it should be called (the router does
 * that), and it never resolves disagreements (the conflict engine does that).
 *
 * A provider with no adapter is simply not callable yet — the router records
 * `no_adapter` and moves on, which is a gap, not an error.
 */

import { listingAdapter } from "./listing";
import { faaAdapter, nationalRegistryAdapter, ntsbAdapter } from "./registry";
import { openSkyAdapter } from "./operations";
import { omvmAdapter, vrefAdapter, jetnetAdapter } from "./valuation";

export const ADAPTERS = {
  abos_listing: listingAdapter,
  faa: faaAdapter,
  national_registries: nationalRegistryAdapter,
  ntsb: ntsbAdapter,
  opensky: openSkyAdapter,
  abos_omvm: omvmAdapter,
  vref: vrefAdapter,
  jetnet: jetnetAdapter,
  // abos_cache is handled by the resolver itself, before any plan is built.
  // adsb_lol, flightaware, abos_receivers and document_intelligence are
  // registered providers awaiting an adapter.
};

export function adapterFor(providerId) {
  return ADAPTERS[providerId] || null;
}

export function providersWithAdapters() {
  return Object.keys(ADAPTERS);
}
