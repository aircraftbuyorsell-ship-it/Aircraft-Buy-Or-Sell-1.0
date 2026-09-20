/**
 * ABOS Intelligence Layer — provenance & confidence model.
 *
 * Core principle (master spec §8, §9, §50): every important number carries
 * VALUE / SOURCE / DATE / STATUS / CONFIDENCE / CALCULATION.
 *
 * Absence of data is never a negative fact. A field with no data is
 * UNAVAILABLE or NOT_APPLICABLE — never 0, never "No", never a red flag.
 * This matters most for non-US aircraft where FAA data simply does not exist.
 *
 * Nothing in this file imports React or the Base44 SDK. It is the shared
 * vocabulary used by the router, the adapters, the decision engines and the UI.
 */

/** Truth-state of a single data point. */
export const DATA_STATUS = {
  /** Cross-checked against at least two independent sources, or a primary document. */
  VERIFIED: "verified",
  /** Single credible source, internally consistent, nothing contradicts it. */
  SUPPORTED: "supported",
  /** Present but self-reported / unchecked (typically listing-supplied). */
  UNVERIFIED: "unverified",
  /** Two or more sources disagree. Never silently resolved. */
  CONFLICTING: "conflicting",
  /** No source consulted returned a value. Not a negative finding. */
  UNAVAILABLE: "unavailable",
  /** The field does not apply to this aircraft / registry / configuration. */
  NOT_APPLICABLE: "not_applicable",
};

/** Transport-state layered on top of DATA_STATUS for UI components (§57). */
export const COMPONENT_STATE = {
  LOADING: "loading",
  AVAILABLE: "available",
  VERIFIED: "verified",
  UNVERIFIED: "unverified",
  CONFLICTING: "conflicting",
  UNAVAILABLE: "unavailable",
  ERROR: "error",
};

/**
 * What kind of thing a value is (§8). The UI must always be able to tell
 * observed fact from ABOS arithmetic from a third-party opinion.
 */
export const DATA_CLASS = {
  OBSERVED: "observed",
  DERIVED: "derived",
  THIRD_PARTY_VALUATION: "third_party_valuation",
  ABOS_CALCULATION: "abos_calculation",
  MISSING: "missing",
};

/** Human labels — single place, so UI copy stays consistent everywhere. */
export const STATUS_LABEL = {
  [DATA_STATUS.VERIFIED]: "Verified",
  [DATA_STATUS.SUPPORTED]: "Supported",
  [DATA_STATUS.UNVERIFIED]: "Unverified",
  [DATA_STATUS.CONFLICTING]: "Conflicting",
  [DATA_STATUS.UNAVAILABLE]: "Unavailable",
  [DATA_STATUS.NOT_APPLICABLE]: "Not applicable",
};

export const DATA_CLASS_LABEL = {
  [DATA_CLASS.OBSERVED]: "Observed data",
  [DATA_CLASS.DERIVED]: "Derived analysis",
  [DATA_CLASS.THIRD_PARTY_VALUATION]: "Third-party valuation",
  [DATA_CLASS.ABOS_CALCULATION]: "ABOS calculation",
  [DATA_CLASS.MISSING]: "Missing / unavailable",
};

/** Confidence bands. Confidence is a 0..1 number; these are the read-outs. */
export const CONFIDENCE_BAND = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  NONE: "none",
};

export function confidenceBand(confidence) {
  if (confidence === null || confidence === undefined) return CONFIDENCE_BAND.NONE;
  if (confidence >= 0.8) return CONFIDENCE_BAND.HIGH;
  if (confidence >= 0.55) return CONFIDENCE_BAND.MEDIUM;
  if (confidence > 0) return CONFIDENCE_BAND.LOW;
  return CONFIDENCE_BAND.NONE;
}

export const CONFIDENCE_LABEL = {
  [CONFIDENCE_BAND.HIGH]: "High",
  [CONFIDENCE_BAND.MEDIUM]: "Medium",
  [CONFIDENCE_BAND.LOW]: "Low",
  [CONFIDENCE_BAND.NONE]: "Not established",
};

/**
 * A source descriptor. `providerId` refers to an entry in the provider
 * registry; the rest is what the UI needs without another lookup.
 */
export function source({
  providerId,
  providerName,
  type = DATA_CLASS.OBSERVED,
  sourceDate = null,
  retrievedAt = null,
  url = null,
  documentId = null,
  note = null,
} = {}) {
  return {
    providerId: providerId || "unknown",
    providerName: providerName || providerId || "Unknown source",
    type,
    sourceDate: sourceDate || null,
    retrievedAt: retrievedAt || new Date().toISOString(),
    url: url || null,
    documentId: documentId || null,
    note: note || null,
  };
}

/**
 * The atom of the ABOS trust model.
 *
 * Every field on a canonical aircraft is one of these — never a bare value.
 * Build one with `dataPoint(...)`, or use `unavailable()` / `notApplicable()`
 * so the absence itself is explicit and carries a reason.
 */
export function dataPoint(value, options = {}) {
  const {
    unit = null,
    sources = [],
    status,
    confidence,
    dataClass = DATA_CLASS.OBSERVED,
    calculation = null,
    crossCheckedAgainst = [],
    conflict = null,
    label = null,
  } = options;

  const list = Array.isArray(sources) ? sources.filter(Boolean) : [sources].filter(Boolean);
  const isEmpty = value === null || value === undefined || value === "";

  const resolvedStatus = status
    || (conflict ? DATA_STATUS.CONFLICTING
      : isEmpty ? DATA_STATUS.UNAVAILABLE
        : list.length >= 2 || crossCheckedAgainst.length > 0 ? DATA_STATUS.VERIFIED
          : list.length === 1 ? DATA_STATUS.SUPPORTED
            : DATA_STATUS.UNVERIFIED);

  const resolvedConfidence = confidence !== undefined && confidence !== null
    ? clamp01(confidence)
    : defaultConfidenceFor(resolvedStatus);

  return {
    value: isEmpty ? null : value,
    unit,
    label,
    status: resolvedStatus,
    dataClass: isEmpty && !conflict ? DATA_CLASS.MISSING : dataClass,
    confidence: resolvedConfidence,
    confidenceBand: confidenceBand(resolvedConfidence),
    sources: list,
    primarySource: list[0] || null,
    sourceDate: list[0]?.sourceDate || null,
    crossCheckedAgainst,
    calculation,
    conflict,
  };
}

/** Explicit "we looked and found nothing". Carries the reason, not a zero. */
export function unavailable(reason = null, options = {}) {
  return dataPoint(null, {
    ...options,
    status: DATA_STATUS.UNAVAILABLE,
    dataClass: DATA_CLASS.MISSING,
    confidence: 0,
    calculation: reason,
  });
}

/** Explicit "this field does not apply here" (e.g. FAA fields on an OK- aircraft). */
export function notApplicable(reason = null, options = {}) {
  return dataPoint(null, {
    ...options,
    status: DATA_STATUS.NOT_APPLICABLE,
    dataClass: DATA_CLASS.MISSING,
    confidence: 0,
    calculation: reason,
  });
}

/** An ABOS-computed number: shows its own arithmetic. */
export function calculated(value, calculation, options = {}) {
  return dataPoint(value, {
    ...options,
    dataClass: DATA_CLASS.ABOS_CALCULATION,
    status: options.status || (value === null || value === undefined ? DATA_STATUS.UNAVAILABLE : DATA_STATUS.SUPPORTED),
    calculation,
  });
}

function defaultConfidenceFor(status) {
  switch (status) {
    case DATA_STATUS.VERIFIED: return 0.92;
    case DATA_STATUS.SUPPORTED: return 0.7;
    case DATA_STATUS.UNVERIFIED: return 0.4;
    case DATA_STATUS.CONFLICTING: return 0.3;
    default: return 0;
  }
}

function clamp01(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** True when a data point actually carries a usable value. */
export function hasValue(point) {
  return Boolean(point) && point.value !== null && point.value !== undefined && point.value !== "";
}

/** Read a value out of a data point, or a fallback. Never throws. */
export function valueOf(point, fallback = null) {
  return hasValue(point) ? point.value : fallback;
}

/** UI state for a data point, given transport flags. */
export function componentState(point, { loading = false, error = false } = {}) {
  if (loading) return COMPONENT_STATE.LOADING;
  if (error) return COMPONENT_STATE.ERROR;
  if (!point) return COMPONENT_STATE.UNAVAILABLE;
  switch (point.status) {
    case DATA_STATUS.VERIFIED: return COMPONENT_STATE.VERIFIED;
    case DATA_STATUS.CONFLICTING: return COMPONENT_STATE.CONFLICTING;
    case DATA_STATUS.UNVERIFIED: return COMPONENT_STATE.UNVERIFIED;
    case DATA_STATUS.UNAVAILABLE:
    case DATA_STATUS.NOT_APPLICABLE: return COMPONENT_STATE.UNAVAILABLE;
    default: return COMPONENT_STATE.AVAILABLE;
  }
}

/**
 * The "Why do you say this?" payload (§8). Everything the provenance drawer
 * needs, in the order it is displayed.
 */
export function explain(point, { fieldLabel = null } = {}) {
  if (!point) {
    return {
      field: fieldLabel,
      value: null,
      display: "No data",
      status: STATUS_LABEL[DATA_STATUS.UNAVAILABLE],
      abosStatus: "Not retrieved",
      sources: [],
      sourceDate: null,
      crossChecked: null,
      conflict: null,
      confidence: CONFIDENCE_LABEL[CONFIDENCE_BAND.NONE],
      calculation: null,
      dataClass: DATA_CLASS_LABEL[DATA_CLASS.MISSING],
    };
  }
  return {
    field: fieldLabel || point.label,
    value: point.value,
    display: hasValue(point) ? formatValue(point) : "No data available",
    status: STATUS_LABEL[point.status] || point.status,
    abosStatus: abosStatusFor(point),
    sources: point.sources,
    sourceDate: point.sourceDate,
    crossChecked: point.crossCheckedAgainst?.length
      ? point.crossCheckedAgainst.join(" + ")
      : null,
    conflict: point.conflict,
    confidence: CONFIDENCE_LABEL[point.confidenceBand],
    calculation: point.calculation,
    dataClass: DATA_CLASS_LABEL[point.dataClass] || point.dataClass,
  };
}

function abosStatusFor(point) {
  switch (point.dataClass) {
    case DATA_CLASS.ABOS_CALCULATION: return "Calculated by ABOS";
    case DATA_CLASS.DERIVED: return "Derived by ABOS";
    case DATA_CLASS.THIRD_PARTY_VALUATION: return "Third-party valuation";
    case DATA_CLASS.OBSERVED: return "Imported";
    default: return "Not retrieved";
  }
}

export function formatValue(point) {
  if (!hasValue(point)) return "—";
  const { value, unit } = point;
  if (typeof value === "number") {
    const formatted = Number.isInteger(value)
      ? value.toLocaleString("en-US")
      : value.toLocaleString("en-US", { maximumFractionDigits: 1 });
    return unit ? `${formatted} ${unit}` : formatted;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return unit ? `${value} ${unit}` : String(value);
}

/**
 * Roll several data points up into one confidence number. Unavailable points
 * drag the average down only through `coverage` — they are not scored as zeros
 * on quality, because "we don't know" is not "it is bad".
 */
export function aggregateConfidence(points = []) {
  const list = points.filter(Boolean);
  if (!list.length) return { confidence: 0, coverage: 0, band: CONFIDENCE_BAND.NONE, known: 0, total: 0 };
  const applicable = list.filter((p) => p.status !== DATA_STATUS.NOT_APPLICABLE);
  const known = applicable.filter(hasValue);
  const coverage = applicable.length ? known.length / applicable.length : 0;
  const quality = known.length
    ? known.reduce((sum, p) => sum + p.confidence, 0) / known.length
    : 0;
  const confidence = clamp01(quality * (0.6 + 0.4 * coverage));
  return {
    confidence,
    coverage,
    quality,
    band: confidenceBand(confidence),
    known: known.length,
    total: applicable.length,
  };
}
