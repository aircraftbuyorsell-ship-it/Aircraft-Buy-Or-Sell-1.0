/**
 * ABOS Intelligence Layer — public surface.
 *
 * The rule from the master spec (§51): the frontend consumes the same
 * canonical layer that external developers do. If a screen needs something
 * that cannot be expressed through these exports, the layer is missing a
 * capability — do not reach around it into a provider.
 *
 *   import { resolveAircraft, screen, assess, commit, POLICY } from "@/intelligence";
 */

// --- Trust model -----------------------------------------------------------
export {
  DATA_STATUS, COMPONENT_STATE, DATA_CLASS,
  STATUS_LABEL, DATA_CLASS_LABEL, CONFIDENCE_LABEL, CONFIDENCE_BAND,
  dataPoint, unavailable, notApplicable, calculated, source,
  hasValue, valueOf, componentState, explain, formatValue,
  confidenceBand, aggregateConfidence,
} from "./provenance";

// --- Canonical aircraft ----------------------------------------------------
export {
  FIELD_REGISTRY, SECTIONS, SECTION_LABEL, IDENTITY_KEYS, SECONDARY_IDENTITY_KEYS,
  createAircraft, field, value, setField,
  sectionFields, sectionConfidence, knownFields, missingFields,
  identity, displayName, toApiShape,
} from "./schema";

// --- Providers -------------------------------------------------------------
export {
  PROVIDERS, PROVIDER_CATEGORY, ACCESS_TIER,
  allProviders, enabledProviders, getProvider, providersFor, providersProviding,
  publicProviderView, publicProviderCatalogue,
} from "./registry";

export {
  POLICY, policyByName, buildPlan, executeStep, summariseCalls, providerAppliesTo,
} from "./router";

export { ADAPTERS, adapterFor, providersWithAdapters } from "./adapters";

// --- Reconciliation --------------------------------------------------------
export { reconcile, valuesAgree, conflictSeverity, rankConflicts } from "./conflict";

// --- Orchestration ---------------------------------------------------------
export {
  resolveAircraft, resolveIdentity, identityConfidence,
  readCache, writeCache, clearCache,
} from "./resolve";

// --- Decision products -----------------------------------------------------
export { screen, VERDICT, VERDICT_MEANING, CHECK_STATE, DISCLAIMER as SCREEN_DISCLAIMER } from "./decision/screen";
export { assess, NOT_AN_APPRAISAL } from "./decision/assess";
export { commit, CONFIDENCE_KIND, MODELLED_NOTICE } from "./decision/commit";
