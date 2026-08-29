---
name: omvm-valuation-v2-0
description: >-
  OMVM 2.0 Bayesian aircraft valuation engine. Estimates market value via
  precision-weighted fusion of depreciation prior (offline calibrated from FAA/NTSB)
  and live asking-price evidence. Returns posterior distribution with confidence
  intervals as P(±10%), P(±20%), P(±30%), not labels. Use this skill whenever the
  user asks for an aircraft value estimate, appraisal, fair market value, or wants
  to understand what an aircraft is worth given its specs and market listings.
compatibility: >-
  Requires omvm-params-v1.json (calibrated parameter bundle) and aircraft identity
  (make, model, year). Optional market listings (Controller, Trade-A-Plane,
  Barnstormers, ASO) sharpen the posterior; runs on prior alone if no market data.
---

# OMVM 2.0 Valuation Engine

APL-compliant Bayesian aircraft valuation tool. Separates offline calibration
(from FAA registry, NTSB, FAA SDR) from stateless runtime execution (live market
fusion).

## When to use this skill

- User asks "what is this aircraft worth?"
- User provides aircraft specs and wants a data-driven estimate
- User has listing data and wants to contextualize it against the market
- Valuation needs quantified uncertainty, not a point estimate

## Workflow

1. **Input**: aircraft identity (registration, make, model, year) + optional engine hours,
   TBO%, avionics score, and market listings.
2. **Load parameters**: resolve aircraft class from params bundle; select model class
   (single-engine piston, twin, turboprop, jet).
3. **Calculate prior** (V_base): log-linear depreciation formula with class-specific
   k and floor.
4. **Aggregate market data**: weight listings by source reliability, freshness, identity match.
5. **Calculate effective sample size** (n_eff): account for deduplication and correlation.
6. **Bayesian fusion** (log space): combine ln(V_base) and ln(V_market) via precision weighting.
7. **Uncertainty quantification**: combine six components (model error, parameters, dispersion,
   correlation, staleness, missing features) via root-sum-of-squares.
8. **Apply deterministic adjustments**: damage (NTSB/SDR), storage (coastal), usage (operator).
9. **Calculate confidence**: P(±10%), P(±20%), P(±30%) from lognormal CDF.
10. **Return audit trace**: which decisions were made, why.

## Output format

```json
{
  "estimated_value_usd": 184500,
  "posterior_sigma_usd": 17600,
  "valuation_mode": "REDUCED_HEDONIC",
  "confidence": {
    "cv": 0.095,
    "within_10_pct": 0.61,
    "within_20_pct": 0.89,
    "within_30_pct": 0.97,
    "mode": "MEDIUM"
  },
  "market_evidence": {
    "observation_count": 7,
    "effective_sample_size": 4.83,
    "evidence_type": "ASKING_PRICES"
  },
  "audit_trace": {
    "model_decisions": [
      "Used reduced hedonic mode (n_eff=4.83)",
      "Applied 0.97× damage multiplier (weak NTSB evidence)",
      "No storage adjustment (active use)"
    ]
  }
}
```

## Key concepts

### Prior (V_base)

Log-linear depreciation formula calibrated from historical residuals:
```
V_base(t) = V_floor + (V_new - V_floor) × exp(-k×t)
```

Where t = aircraft age in years. Class-specific parameters (V_new, floor_ratio, k,
σ_prior_log) are immutable in the params bundle.

### Market likelihood

Weighted asking-price aggregation from multiple sources. Weight factors:
- Source reliability (Controller ≥ Trade-A-Plane ≥ Barnstormers)
- Freshness decay (7 days fresh, 90+ days stale)
- Identity match (exact vs. fallback)
- Independence (penalize dealer duplicates)

### Valuation mode state machine

| Mode | Condition | Method |
|------|-----------|--------|
| Full hedonic | n_eff ≥ 8 | Ridge regression with full feature set |
| Reduced hedonic | 5 ≤ n_eff < 8 | Ridge with 3-5 features |
| Robust median | 2 ≤ n_eff < 5 | Weighted median price |
| Prior only | n_eff < 2 | Depreciation prior alone |

### Uncertainty components

1. Model error (depreciation residuals)
2. Parameter uncertainty (ridge regularization)
3. Data dispersion (market price scatter)
4. Source correlation (duplicate listings)
5. Staleness (age of market data)
6. Missing features (incomplete data)

Combined via RSS: σ_total = √(Σ w_i × σ_i²)

### Confidence intervals

Instead of "HIGH/MEDIUM/LOW" labels, report probabilities:
- P(value within ±10% of estimate)
- P(value within ±20% of estimate)
- P(value within ±30% of estimate)

Computed from lognormal CDF using Hart approximation for speed.

## Example request

```json
{
  "registration": "N38DV",
  "make": "Beechcraft",
  "model": "Bonanza",
  "year": 1968,
  "engine_hours": 4120,
  "tbo_remaining_pct": 68,
  "avionics_score": 0.84,
  "market_listings": [
    {
      "source": "controller",
      "price_usd": 195000,
      "observed_at": "2026-08-28T14:32:00Z"
    }
  ]
}
```

## APL/ADL alignment

**ADL manifest**: `protocols/adl/manifests/abos.valuation.omvm-valuation-v2-0.json`
- Type: `tool`
- Autonomy: A2 (advisory)
- Trust: APL-T2 (verified)
- Audit: APL-A2 (decision-level)
- Risk: low
- Evidence: provenance + confidence required

**APL capabilities**:
- `value_aircraft` - estimate market value
- `estimate_posterior` - return posterior distribution
- `quantify_uncertainty` - breakdown of uncertainty components
- `audit_valuation` - decision trail and provenance

**APL permissions**:
- `aircraft.read` (identity lookup)
- `market.analyze` (price aggregation)
- `models.compare` (parameter selection)
- `recommendation.generate` (valuation guidance)
- `documentation.verify` (audit trail)
- `audit.log` (hash-chained events)

## Testing strategy

### Unit tests
- Log-space arithmetic (exp/log round-tripping)
- Bayesian fusion (precision weighting, symmetry)
- Normal CDF (Hart method accuracy vs. reference values)
- Ridge matrix solving (Gauss-Jordan numerical stability)
- Confidence percentile computation (known distributions)

### Backtest suite
- Depreciation residuals per aircraft class
- Confidence calibration (does ±20% contain ~89% historically?)
- Outlier detection (age > 50 years, missing features)
- Valuation mode transitions (n_eff boundaries)

### Integration tests
- End-to-end request → response (with test aircraft)
- Parameter version rollover (backward compatibility)
- APL request/response envelope validation
- Missing/incomplete market data handling

## Known limitations

1. **Thin market for jets**: n_eff often < 2 for large aircraft; falls back to prior.
2. **Asking prices, not sales prices**: by design; systematic bias possible.
3. **No correlation model**: assumes prior ⊥ market independence.
4. **Regional/seasonal effects**: depreciation k is global per class.
5. **Component/overhaul not modeled**: major maintenance cost impact pending.

## Future enhancements

- Integration with VREF / Aircraft Bluebook (optional paid tier)
- Regional corrosion/storage cost models
- Dynamic ridge lambda selection per aircraft class
- Engine/prop overhaul cost impact
- Acquisition cost database (fleet/corporate buyers)
- Time-series price tracking per N-number

---

**Maintainer**: ABOS Platform Team  
**Calibration**: Quarterly (Jan, Apr, Jul, Oct)  
**Protocol Version**: APL 1.0 / ADL 1.0  
**Status**: Verified
