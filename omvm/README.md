# OMVM 2.0 — Aircraft Valuation Engine

**Status**: Architecture & Core Engine (Draft)

OMVM 2.0 is a stateless Bayesian aircraft valuation engine that separates offline calibration (from public data: FAA, NTSB, FAA SDR) from runtime execution (live market evidence + Bayesian fusion).

## Why OMVM 2.0?

Previous approaches maintained large "comps" databases and asked market listings to do double duty: both inform value *and* serve as "sales data." OMVM 2.0 instead:

1. **Acknowledges market reality**: we have asking prices, not confirmed sale prices
2. **Calibrates offline**: public datasets (FAA registry, NTSB, SDR) → small immutable parameter bundle
3. **Fuses at runtime**: prior (depreciation) + market (live listings) → posterior distribution
4. **Quantifies uncertainty**: every estimate carries confidence intervals, not labels

## Architecture

```
                      ABOS OMVM 2.0
                           │
              ┌────────────┴────────────┐
              │                         │
       STATIC CALIBRATION         LIVE MARKET RUNTIME
              │                         │
    FAA / NTSB / SDR             Controller, TAP, etc.
    historical snapshots               live asking prices
              │                         │
              └────────────┬────────────┘
                           ↓
                  NORMALIZATION LAYER
                           ↓
              LIVE HEDONIC MARKET MODEL
                           ↓
               BAYESIAN FUSION ENGINE
                           ↓
              DETERMINISTIC ADJUSTMENTS
                  (damage, storage, usage)
                           ↓
              POSTERIOR VALUE DISTRIBUTION
                           ↓
             VALUE + RANGE + CONFIDENCE
```

## Directory Structure

```
omvm/
├── calibration/
│   ├── faa/              (FAA registry download, parsing, snapshots)
│   ├── ntsb/             (NTSB dataset download, linkage)
│   ├── sdr/              (FAA Service Difficulty Reports)
│   ├── historical-value/ (VREF, Aircraft Bluebook references)
│   └── backtest/         (depreciation backtesting, residual analysis)
│
├── engine/
│   ├── base-model.ts     (Log-linear depreciation prior)
│   ├── market-model.ts   (Weighted asking-price aggregation)
│   ├── bayesian-fusion.ts (Precision-weighted posterior)
│   ├── adjustments.ts    (Damage, storage, usage multipliers)
│   ├── uncertainty.ts    (Component uncertainty combination)
│   ├── confidence.ts     (Confidence intervals & metrics)
│   └── ridge.ts          (Regularized hedonic adjustments)
│
├── schemas/
│   ├── omvm-request.json (Input schema)
│   └── omvm-response.json (Output schema)
│
├── params/
│   └── omvm-params-v1.json (Calibrated parameter bundle)
│
└── tests/
    ├── mathematical/ (Bayesian fusion, CDF, log-space arithmetic)
    └── backtest/    (Depreciation residuals, confidence calibration)
```

## Key Concepts

### 1. Base Model (Prior)

**Depreciation formula**:
```
V_base(t) = V_floor + (V_new - V_floor) × exp(-k×t)
```

Where:
- `V_new`: new aircraft price
- `V_floor`: minimum residual value (~20% of new)
- `k`: depreciation rate (class-specific, ~0.04–0.055)
- `t`: age in years

**Uncertainty**: `σ_prior_log` calibrated from historical residuals per aircraft class.

Example parameter sets:
- Cessna 172 (1960–2000): V_new=$180k, floor=19%, k=0.052, σ=0.17
- Beechcraft Bonanza (1970–2005): V_new=$280k, floor=22%, k=0.048, σ=0.16
- Citation Excel (1990–2024): V_new=$8M, floor=20%, k=0.038, σ=0.18

### 2. Market Model (Likelihood)

**Input**: Live asking-price listings from Controller, Trade-A-Plane, Barnstormers, ASO.

**Weight each listing** by:
- Source reliability (Controller ≥ TAP ≥ Barnstormers)
- Freshness (decay from 7 days to 90+ days old)
- Identity match (exact make/model vs. fallback)
- Feature completeness (hours present, etc.)
- Independence (penalize same dealer duplicates)

**Effective sample size**:
```
n_eff = (Σ w_i)² / Σ w_i²
```

Not just count, but weighted for quality and overlap.

**Valuation mode** (state machine):
- `n_eff ≥ 8`: Full hedonic model (ridge regression)
- `5 ≤ n_eff < 8`: Reduced hedonic
- `2 ≤ n_eff < 5`: Robust weighted median
- `n_eff < 2`: Base prior only

### 3. Bayesian Fusion

Work in **log space** for multiplicative price dynamics:

```
ln(V_base) ~ N(μ_b, σ_b²)    [prior]
ln(V_market) ~ N(μ_m, σ_m²)  [market]
```

**Posterior** (precision-weighted):
```
τ = 1/σ²  [precision]
μ_post = (τ_b μ_b + τ_m μ_m) / (τ_b + τ_m)
σ_post = 1 / √(τ_b + τ_m)
```

**Convert to linear space**:
```
E[V] = exp(μ_log + σ_log²/2)
σ_linear = E[V] × σ_log
```

### 4. Uncertainty Quantification

**Six components**, combined via RSS:
1. Model error (depreciation residuals)
2. Parameter uncertainty (ridge regularization)
3. Data dispersion (market price scatter)
4. Source correlation (duplicate/correlated listings)
5. Staleness (age of market data)
6. Missing features (incomplete data)

Each weighted and combined:
```
σ_total = √(Σ w_i × σ_i²)
```

### 5. Deterministic Adjustments

**Multiplicative factors** applied post-fusion:
- **Damage**: NTSB + FAA SDR evidence → 0.75–1.00× multiplier
- **Storage**: coastal/outdoor exposure → 0.91–1.00× multiplier
- **Usage**: private vs. training/commercial → 0.98–1.05× multiplier

Each adjustment carries uncertainty (~2–5%).

### 6. Confidence Metrics

Instead of labels (HIGH/MEDIUM/LOW), report **probabilities**:
```json
{
  "estimated_value_usd": 184500,
  "posterior_sigma_usd": 17600,
  "confidence": {
    "cv": 0.095,
    "within_10_pct": 0.61,
    "within_20_pct": 0.89,
    "within_30_pct": 0.97
  }
}
```

**Interpretation**: 89% probability that market value is within ±20% of $184,500.

## Data Sources

### Public Data (Calibration)

| Source | Purpose | Frequency |
|--------|---------|-----------|
| FAA Registry ZIP | Aircraft identity, specs | Daily |
| FAA SDR | Service difficulties | Annual release |
| NTSB Dataset | Accidents/incidents | Annual release + API (2027) |
| OpenAirframes | FAA mirror/fallback | Daily |

**Not a comps database**: these feed parameter calibration only. The parameters (k, floor, σ_prior) are frozen and small; data does not accumulate in ABOS.

### Live Data (Runtime)

| Source | Medium | Update Frequency |
|--------|--------|------------------|
| Controller | API | Minutes–hours |
| Trade-A-Plane | Scrape/partnership | Daily |
| Barnstormers | Scrape/partnership | Daily |
| ASO | Scrape/partnership | Daily |

**Cached briefly** (15–60 min) to avoid redundant scrapes. Oldest listing age tracked for staleness penalty.

## Implementation Notes

### Stateless Runtime

The OMVM v2 Cloudflare Worker (`abos-widget-gateway` adaptation):

1. **Input**: registration, make, model, year, (optionally) engine hours, TBO%, avionics
2. **Lookup**: aircraft class from params bundle; load parameter set
3. **Calculate V_base**: depreciation formula
4. **Search market**: fetch live listings (cached)
5. **Normalize**: deduplication, weighting
6. **Calculate V_market**: weighted mean & variance in log space
7. **Bayesian fusion**: posterior with explicit weight attribution
8. **Apply adjustments**: damage, storage, usage
9. **Quantify confidence**: CDF calculations for ±10%, ±20%, ±30%
10. **Return audit trace**: which decisions were made, why

No state changes in ABOS. Result is fully reproducible given the same inputs and parameter version.

### Calibration Pipeline

Separate from runtime; runs quarterly via GitHub Actions:

```
download FAA
   ↓
download NTSB
   ↓
download FAA SDR
   ↓
normalize aircraft identity
   ↓
link registrations to NTSB
   ↓
backtest depreciation model
   ↓
estimate residual σ per class
   ↓
parameter bundle → omvm-params-v2.json
```

Result: immutable JSON bundle, versioned by hash, deployed once.

## API Contract

### Request

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

### Response

```json
{
  "engine": "ABOS OMVM 2.0",
  "parameter_version": "2.0.1",
  "calculated_at": "2026-08-29T20:40:00Z",
  "estimated_value_usd": 184500,
  "posterior_sigma_usd": 17600,
  "valuation_mode": "REDUCED_HEDONIC",
  "confidence": {
    "cv": 0.095,
    "within_10_pct": 0.61,
    "within_20_pct": 0.89,
    "within_30_pct": 0.97
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

## Testing Strategy

### Mathematical Tests

- Log-space arithmetic (exp/log round-tripping)
- Bayesian fusion (precision weighting, symmetry)
- Normal CDF approximation (Hart method accuracy)
- Confidence percentile computation
- Ridge matrix solving

### Backtest Suite

- Depreciation residuals per aircraft class
- Confidence calibration (does ±20% contain 89%?)
- Outlier detection
- Edge cases (age > 50 years, missing features)

### Integration Tests

- End-to-end OMVM calculation
- Parameter version rollover
- API contract validation

## Known Limitations & Future Work

### Known Limitations

1. **Thin market data for jets/large aircraft**: n_eff often < 2; falls back to prior
2. **No dynamic correlation model**: assumes prior ⊥ market; in reality they may share information
3. **Asking prices, not sales prices**: by design, but means systematic bias possible
4. **Regional/seasonal effects not yet modeled**: depreciation k is global per class
5. **Component/major-overhaul not yet in ridge features**: model_features in params are stubbed

### Future Work

- [ ] Integration with VREF/Bluebook reference API (optional paid tier)
- [ ] Regional corrosion/storage cost model
- [ ] Dynamic ridge lambda selection per aircraft class
- [ ] Engine/prop overhaul cost impact
- [ ] Acquisition cost database (for fleet/corporate buyers)
- [ ] Time-series price tracking per N-number

## References

- **Bayesian Fusion**: Press et al., *Numerical Recipes*, Ch. 16
- **Lognormal distributions**: Wikipedia, "Lognormal distribution"
- **Hedonic pricing**: Rosen, "Hedonic Prices and Implicit Markets" (*JPE* 1974)
- **OMVM v5 prior work**: See `base44/functions/omvmV5Score/entry.ts`

---

**Maintainer**: ABOS Platform Team  
**Calibration Schedule**: Quarterly (Jan, Apr, Jul, Oct)  
**Parameter Review**: Annually
