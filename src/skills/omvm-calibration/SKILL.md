---
name: omvm-calibration
description: >-
  OMVM 2.0 Calibration Pipeline — offline quarterly workflow. Downloads FAA
  registry, NTSB dataset, and FAA SDR; normalizes aircraft identity; performs
  depreciation backtest; estimates residual uncertainty per aircraft class;
  produces immutable omvm-params-v2.json bundle versioned by hash. Requires
  human approval before publishing. Use this skill only during quarterly
  calibration windows (Jan 1, Apr 1, Jul 1, Oct 1).
compatibility: >-
  Requires outbound access to FAA registry endpoint, NTSB API (or annual
  release), FAA SDR file store, and write permission to omvm/params/. Runs in
  GitHub Actions (CI/CD only).
---

# OMVM 2.0 Calibration Pipeline

Quarterly offline batch workflow that produces the immutable parameter bundle
for runtime OMVM valuations. Separates calibration (trusted, audited) from
runtime (stateless, reproducible).

## When to use this skill

- Quarterly maintenance (Jan 1, Apr 1, Jul 1, Oct 1 ±2 days)
- Manual trigger: need to refresh parameters due to market shift
- Parameter review: audit last quarter's residuals and uncertainty estimates
- Never during valuation season (user-facing queries)

## Workflow

1. **Download source data**:
   - FAA Registry ZIP (aircraft identity, specs, registration history)
   - NTSB Dataset (accidents/incidents linked to N-numbers)
   - FAA Service Difficulty Reports (engine/system issues)

2. **Normalize identities**:
   - Parse FAA registry into canonical aircraft records
   - Link registrations to NTSB events (1:1 merge on N-number)
   - Deduplicate with historical records (re-registered aircraft)

3. **Backtest depreciation model**:
   - For each aircraft class (piston single/twin, turboprop, jet):
     - Select aircraft with **known purchase price and current sale data**
     - Calculate residuals: ln(V_actual) - ln(V_prior)
     - Estimate class-specific k (depreciation rate)
     - Fit σ_prior_log from residual distribution

4. **Estimate class uncertainty**:
   - Model error: std dev of depreciation residuals
   - Parameter uncertainty: how precise is the fitted k?
   - Ridge regularization lambda selection per class

5. **Generate parameter bundle**:
   - Construct omvm-params-v2.json with parameter sets per class/family
   - Compute SHA-256 hash of bundle content
   - Tag with calibration date and backtest period
   - **Require human review + approval before publishing**

6. **Publish parameter bundle**:
   - Write to omvm/params/omvm-params-v2.json
   - Update omvm/params/MANIFEST.json (version index)
   - Commit to main branch + tag as stable
   - Runtime will hot-reload at next deployment

## Input parameters

```json
{
  "trigger_date": "2026-10-01",
  "faa_registry_url": "https://www.faa.gov/pilots/registry/media/aircraft.zip",
  "ntsb_api_endpoint": "https://api.ntsb.gov/2.0/aviation",
  "faa_sdr_path": "s3://faa-sdr-archive/2026/sdr-annual.csv",
  "backtest_years_ago": 5,
  "require_approval": true
}
```

## Output format

```json
{
  "parameter_bundle_version": "2.1.0",
  "calibration_date": "2026-10-01",
  "backtest_period": "2021-2026",
  "parameter_sets": [
    {
      "aircraft_class": "piston_single",
      "model_family": "Cessna 172",
      "year_from": 1950,
      "year_to": 2000,
      "v_new_usd": 175000,
      "floor_ratio": 0.19,
      "depreciation_rate_k": 0.052,
      "prior_sigma_log": 0.165,
      "ridge_lambda": 0.08,
      "backtest_residuals": {
        "count": 487,
        "mean": -0.002,
        "std_dev": 0.165,
        "rmse": 0.167,
        "percentile_95": 0.271
      },
      "notes": "487 aircraft with purchase + sale data. k calibrated to minimize RMSE."
    }
  ],
  "uncertainty_calibration": {
    "test_confidence_intervals": [
      {
        "interval": "within_20_pct",
        "expected_probability": 0.89,
        "observed_probability": 0.892,
        "calibration_status": "PASS"
      }
    ]
  },
  "parameter_hash": "sha256:7d8c...",
  "published_at": "2026-10-01T15:30:00Z",
  "approval": {
    "approved_by": "user@abos.aero",
    "approval_timestamp": "2026-10-01T15:28:00Z",
    "notes": "Residuals well-calibrated. k values stable Q/Q. No anomalies detected."
  }
}
```

## Data sources

| Source | Format | Frequency | Link |
|--------|--------|-----------|------|
| FAA Registry | ZIP (text-delimited) | Daily | faa.gov/pilots/registry |
| NTSB Dataset | CSV or API | Annual release; API 2027 | ntsb.gov/aviation |
| FAA SDR | CSV | Annual release | faa.gov/certification/sdr |
| Aircraft Bluebook | JSON (reference only) | Quarterly | bluebook.aero (optional paid) |

## Depreciation model calibration

For each aircraft class, solve:

```
min_k Σ_i [ ln(V_base(t_i; k)) - ln(V_actual_i) ]²

subject to:
  k ∈ [0.02, 0.10]  (plausible range)
  V_floor = V_new × floor_ratio
```

Then estimate σ_prior_log from residuals:

```
σ_prior_log = std( ln(V_actual) - ln(V_prior) )
```

Validated via backtesting: ±10%, ±20%, ±30% confidence intervals must match
historical frequency.

## Approval workflow

Before publishing parameters:
1. Automated residual analysis (PASS/FAIL on anomalies)
2. Notification sent to calibration team (email)
3. Human reviews audit trail in UI
4. Human approves or requests revision
5. Approved bundle published; trigger redeploy

Rejection sends bundle to quarantine; team investigates before re-running.

## APL/ADL alignment

**ADL manifest**: `protocols/adl/manifests/abos.calibration.omvm-calibration.json`
- Type: `workflow`
- Autonomy: A1 (analytical, requires human approval)
- Trust: APL-T2 (verified)
- Audit: APL-A2 (decision-level)
- Risk: low (read-only on external data, writes to immutable bundle)
- Evidence: provenance + confidence required

**APL capabilities**:
- `calibrate_parameters` - run full depreciation calibration
- `backtest_depreciation` - historical residual analysis
- `estimate_residuals` - quantify model error per class
- `quantify_class_uncertainty` - σ per family
- `generate_parameter_bundle` - produce final JSON

**APL permissions**:
- `aircraft.read` (FAA registry)
- `documentation.verify` (data quality checks)
- `audit.log` (hash chain)
- `partner.read` (optional Bluebook API)

## Testing strategy

### Unit tests
- FAA registry parsing (duplicate detection)
- NTSB linkage (N-number matching)
- Depreciation formula fit (convergence, bounds)
- Residual statistics (mean ≈ 0, normal distribution)
- Parameter bounds (k, floor_ratio in plausible ranges)

### Integration tests
- End-to-end calibration run (mock data)
- Confidence calibration (does ±20% contain ~89%?)
- Parameter bundle schema validation
- Hash chain integrity

### Regression tests
- Compare new k values to previous quarter (should track ±2%)
- Monitor σ trends (should converge over years)
- Validate year-over-year residuals

## Known limitations

1. **Limited purchase/sale linkage**: FAA registry has registration but no price data.
   Rely on external sources (FAA SDR damage history) as proxy.
2. **Survivorship bias**: Only registered aircraft in backtest; retired/destroyed are
   missing.
3. **Regional data imbalance**: North American data dense; international sparse.
4. **Model family grouping**: Manual hierarchies; no dynamic clustering yet.

## Future enhancements

- Real-time NTSB API integration (2027)
- Acquisition cost database (corporate buyers)
- Regional depreciation factors
- Time-series k estimation (adaptive per decade)
- Machine learning for family detection (instead of manual)

---

**Maintainer**: ABOS Platform Team  
**Schedule**: Quarterly (Jan 1, Apr 1, Jul 1, Oct 1)  
**Approval Required**: Yes, by human before publish  
**Protocol Version**: APL 1.0 / ADL 1.0  
**Status**: Verified
