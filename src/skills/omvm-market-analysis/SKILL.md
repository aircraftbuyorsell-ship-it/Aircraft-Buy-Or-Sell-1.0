---
name: omvm-market-analysis
description: >-
  OMVM 2.0 Market Analysis Engine — real-time intelligence tool. Ingests live
  asking-price listings from Controller, Trade-A-Plane, Barnstormers, ASO;
  deduplicates, weights by source/freshness/identity/independence; calculates
  effective sample size (n_eff) and valuation mode; detects anomalies and
  market trends. Returns weighted market evidence ready for Bayesian fusion.
  Use this skill whenever analyzing aircraft market data or generating market
  context for valuations.
compatibility: >-
  Requires live market data feeds (Controller API, TAP scrape, Barnstormers
  scrape, ASO scrape) cached 15–60 min to avoid redundant pulls. Can run
  standalone or as a pipeline stage feeding into omvm-valuation-v2-0.
---

# OMVM 2.0 Market Analysis Engine

Real-time market intelligence tool that prepares live asking-price data for
Bayesian fusion. Handles deduplication, weighting, anomaly detection, and
trend analysis.

## When to use this skill

- Analyze market listings for a specific aircraft make/model
- Detect pricing anomalies or market shifts
- Calculate effective sample size before valuation
- Monitor market trends over time (weekly/monthly)
- Debug valuation mode selection (n_eff boundaries)

## Workflow

1. **Input**: aircraft identity (make, model, year range) + raw market listings
2. **Validate listings**: sanity check prices, remove duplicates
3. **Weight each listing**:
   - Source reliability (Controller ≥ TAP ≥ Barnstormers)
   - Freshness decay (7 days = 100%, 90+ days = 30%)
   - Identity match (exact make/model vs. fallback)
   - Feature completeness (hours present, etc.)
   - Independence (penalize same dealer/source within 2 weeks)
4. **Calculate effective sample size** (n_eff): weights balanced by quality
5. **Determine valuation mode**: n_eff thresholds govern regression type
6. **Detect anomalies**: outliers, stale data, correlated sources
7. **Calculate market statistics**: mean, dispersion (in log space)
8. **Return audit trail**: which listings retained, why

## Output format

```json
{
  "aircraft": "Beechcraft Bonanza",
  "year_range": "1970-2005",
  "market_analysis": {
    "observation_count": 7,
    "observation_count_after_filtering": 7,
    "effective_sample_size": 4.83,
    "valuation_mode": "reduced_hedonic",
    "market_value_usd": 189500,
    "market_sigma_log": 0.108,
    "market_sigma_usd": 20450
  },
  "weights": [
    {
      "listing_id": "controller_n1234_48900",
      "source": "controller",
      "price_usd": 195000,
      "observed_at": "2026-08-28T14:32:00Z",
      "days_old": 1,
      "source_reliability": 1.0,
      "freshness": 1.0,
      "identity_match": 1.0,
      "feature_completeness": 0.8,
      "independence": 1.0,
      "final_weight": 0.8
    }
  ],
  "anomalies": [],
  "trend_analysis": {
    "price_trend_30_days": "stable",
    "price_trend_90_days": "stable",
    "volume_trend": "normal"
  },
  "audit_trail": {
    "analysis_timestamp": "2026-08-29T20:40:00Z",
    "decisions": [
      "Accepted 7 listings; 0 filtered for price anomaly",
      "n_eff=4.83 → reduced_hedonic mode (5 ≤ n_eff < 8)",
      "No duplicate sources detected",
      "No stale listings (oldest: 1 day old)"
    ]
  }
}
```

## Weight calculation

For each listing, combine four factors:

```
weight = source_reliability × freshness × identity_match × feature_completeness × independence
```

| Factor | Range | Comment |
|--------|-------|---------|
| source_reliability | 0.7–1.0 | Controller=1.0, TAP=0.95, ASO=0.9, Barnstormers=0.8 |
| freshness | 0.3–1.0 | Linear decay from 7 days (100%) to 90+ days (30%) |
| identity_match | 0.5–1.0 | Exact make/model=1.0, same make=0.8, unrelated=0.5 |
| feature_completeness | 0.6–1.0 | Hours present & reasonable price=0.8, unknown=0.6 |
| independence | 0.6–1.0 | Same source within 14 days=0.6, independent=1.0 |

## Effective sample size (n_eff)

Accounts for quality and overlap, not just count:

```
n_eff = (Σ w_i)² / Σ w_i²
```

Interpretation:
- n_eff ≥ 8: Full hedonic model (ridge regression)
- 5 ≤ n_eff < 8: Reduced hedonic
- 2 ≤ n_eff < 5: Robust weighted median
- n_eff < 2: Prior only (no market signal)

## Anomaly detection

Identifies suspicious listings:
- **Price outliers**: > 3σ from weighted mean
- **Stale listings**: > 90 days old
- **Duplicate dealers**: same source within 14 days
- **Incomplete data**: missing hours or key features
- **Correlated sources**: multiple listings from same dealer

Marked in output but NOT filtered; human decides inclusion.

## Market trend analysis

Compares current market (30-day, 90-day windows) to longer-term baseline:
- **Price trend**: up, stable, down (vs. 180-day baseline)
- **Volume trend**: high, normal, low (listing count)
- **Volatility**: σ increase/decrease

Used for human context; not factored into valuation.

## APL/ADL alignment

**ADL manifest**: `protocols/adl/manifests/abos.market.omvm-market-analysis.json`
- Type: `tool`
- Autonomy: A2 (advisory)
- Trust: APL-T2 (verified)
- Audit: APL-A2 (decision-level)
- Risk: low (read-only on market data)
- Evidence: provenance + confidence required

**APL capabilities**:
- `analyze_market_listings` - core weighting & aggregation
- `detect_market_anomalies` - outlier detection
- `estimate_market_dispersion` - σ calculation
- `calculate_effective_sample_size` - n_eff computation
- `monitor_market_trends` - trend analysis

**APL permissions**:
- `market.analyze` (listing aggregation)
- `documentation.verify` (data quality)
- `audit.log` (decision trail)
- `partner.read` (market sources)

## Testing strategy

### Unit tests
- Weight calculation (each factor independently)
- n_eff computation (match formula exactly)
- Freshness decay function (boundary cases)
- Anomaly detection (known outliers)
- Log-space statistics (mean, variance)

### Integration tests
- End-to-end market analysis (sample data)
- Valuation mode selection (n_eff boundaries)
- Audit trail completeness
- API contract validation

### Data quality tests
- Price sanity checks (> $5k, < $100M)
- Date validation (not future-dated)
- Duplicate detection (same listing_id)
- Source reliability weights (documented)

## Known limitations

1. **Asking prices, not sales prices**: by design; may systematically bias high.
2. **Thin market for jets/large aircraft**: n_eff often < 2; falls back to prior.
3. **Regional data imbalance**: North American data dense; international sparse.
4. **No dynamic correlation model**: assumes independence; in reality sources inform each other.
5. **Frequency bias**: active dealers' listings overweighted by sheer volume.

## Future enhancements

- Real-time Controller API integration (webhooks)
- Trade-A-Plane partnership (direct API feed)
- Machine learning for listing quality scoring
- Dynamic correlation model (when markets move together)
- Regional/seasonal adjustment factors
- Time-series price tracking per N-number

---

**Maintainer**: ABOS Platform Team  
**Update Frequency**: Real-time (15–60 min cache)  
**Protocol Version**: APL 1.0 / ADL 1.0  
**Status**: Verified
