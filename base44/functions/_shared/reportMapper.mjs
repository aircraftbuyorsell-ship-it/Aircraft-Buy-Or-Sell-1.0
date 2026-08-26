// Canonical public shape of an ATI report in the ABOS API contract.
//
// Shared between abosCoreApi (direct API-key / user-session callers) and
// tenantCoreApi (White-Label tenant callers) for the same reason as
// listingMapper and valuationMapper: a white-label customer must see exactly
// the same report contract as a direct API customer.
//
// Formatting and tier-trimming only — no authorization, no scoring. The report
// itself is produced by the atiReportScoreInternal Base44 function, which is
// where the ATI methodology lives and stays. Nothing here recomputes a score
// or a band: the licence agreement forbids a tenant altering the presentation
// of an ATI Score, and that guarantee is worth nothing if this layer can
// quietly derive its own.

/** Dimension fields that only a pro-tier report carries. */
const PRO_ONLY_DIMENSION_FIELDS = Object.freeze(['justification', 'strengths', 'risks', 'missing']);

/** Per-dimension maximum used by atiReportScoreInternal's scoring prompt. */
const DIMENSION_MAX = 15;

/** Total across all eight scored dimensions. */
const TOTAL_MAX = 120;

/**
 * Is this a usable report, or did the engine fail to produce one?
 *
 * atiReportScoreInternal signals failure with an `error` property rather than
 * a throw, so a caller that only catches exceptions would otherwise pass a
 * failure straight through as though it were a report.
 */
export function hasUsableReport(raw) {
  return !!raw && !raw.error && raw.total != null;
}

/**
 * Maps an atiReportScoreInternal result into the v1 report contract.
 *
 * The basic/pro split is the line between the two capabilities the licence
 * model already distinguishes (`ati_basic_report` vs `ati_pro_report`):
 *
 *   basic — the assessment: total, band label, per-dimension numeric scores,
 *           executive summary, extracted spec table, OMVM range.
 *   pro   — all of that PLUS the reasoning: per-dimension justification,
 *           strengths, risks, what data was missing, and recommendations.
 *
 * A basic report is therefore a complete, honest answer in its own right, not
 * a teaser with holes in it. What it withholds is ABOS's analysis of *why*,
 * which is the part that costs analyst judgement to produce.
 *
 * @param {object} raw Raw atiReportScoreInternal output
 * @param {'basic'|'pro'} tier Which capability the caller's licence grants
 */
export function mapReport(raw, tier) {
  const pro = tier === 'pro';

  const dimensions = {};
  for (const [key, value] of Object.entries(raw?.dimensions || {})) {
    // Always carry the number. The narrative fields are the tiered part.
    const mapped = { score: value?.score ?? null, max: DIMENSION_MAX };
    if (pro) {
      for (const field of PRO_ONLY_DIMENSION_FIELDS) {
        if (value?.[field] !== undefined) mapped[field] = value[field];
      }
    }
    dimensions[key] = mapped;
  }

  return {
    tier: pro ? 'pro' : 'basic',
    // Straight from the engine, never recomputed here.
    ati_score: raw?.total ?? null,
    ati_score_max: TOTAL_MAX,
    rating: raw?.score_label ?? null,
    dimensions,
    summary: raw?.summary || null,
    specs: Array.isArray(raw?.spec_table) ? raw.spec_table : [],
    registration: raw?.registration_extracted || null,
    valuation: {
      // Absent OMVM bounds stay null, never 0 — same rule as valuationMapper:
      // "we could not value this" must never render as "worth nothing".
      omvm_low: raw?.omvm_low || null,
      omvm_high: raw?.omvm_high || null,
      asking_price: raw?.asking_price ?? null,
      currency: 'USD',
    },
    recommendations: pro && Array.isArray(raw?.recommendations) ? raw.recommendations : [],
    disclaimer:
      'This assessment is ABOS’s opinion based on the information supplied. '
      + 'It is not an appraisal, inspection, survey, certification of airworthiness, '
      + 'or a guarantee of condition, value, title or legal status.',
    model_version: 'ati-report-v1',
  };
}
