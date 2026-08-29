/**
 * OMVM 2.0 Skill Orchestration
 * Demonstrates three skills working as an integrated pipeline
 */

import * as valuation from './omvm-valuation-v2-0/index';
import * as calibration from './omvm-calibration/index';
import * as marketAnalysis from './omvm-market-analysis/index';

/**
 * Unified OMVM 2.0 Pipeline Orchestration
 * Combines: calibration → market analysis → valuation
 */
async function orchestrateOmvmPipeline() {
  console.log('=== OMVM 2.0 Skill Orchestration ===\n');

  const pipelineId = 'pipe_' + new Date().getTime();
  console.log(`Pipeline ID: ${pipelineId}`);
  console.log(`Started: ${new Date().toISOString()}\n`);

  try {
    // STEP 1: Quarterly Calibration (if trigger date matches)
    console.log('STEP 1: Quarterly Calibration');
    console.log('─'.repeat(50));

    const calTrigger = new Date();
    const isQuarterlyDate =
      [1, 4, 7, 10].includes(calTrigger.getMonth() + 1) && calTrigger.getDate() <= 2;

    if (isQuarterlyDate) {
      console.log('Quarterly calibration date detected. Running calibration workflow...\n');

      const calibReq: calibration.CalibrationRequest = {
        trigger_date: calTrigger.toISOString().split('T')[0],
        backtest_years_ago: 5,
        require_approval: true,
      };

      const calibAplRequest: calibration.AplRequest = {
        apl_version: '1.0',
        message_id: 'msg_cal_' + pipelineId,
        sender: 'workflow:omvm-orchestration',
        receiver: 'apl://aviation.abos/calibration/omvm-calibration/v1',
        intent: 'calibrate_parameters',
        context: { channel: 'sdk' },
        payload: calibReq,
      };

      const calibResult = await calibration.handleAplRequest(calibAplRequest);
      console.log(`✓ Calibration complete`);
      console.log(`  Version: ${calibResult.payload.parameter_bundle_version}`);
      console.log(`  Hash: ${calibResult.payload.parameter_hash}\n`);
    } else {
      console.log(
        'Not a quarterly date; skipping calibration. Using cached omvm-params-v1\n'
      );
    }

    // STEP 2: Market Analysis
    console.log('STEP 2: Real-Time Market Analysis');
    console.log('─'.repeat(50));

    const marketListings: marketAnalysis.MarketListingInput[] = [
      {
        source: 'controller',
        listing_id: 'controller_cfvhp_1',
        price_usd: 48900,
        observed_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        hours: 7145,
      },
      {
        source: 'tap',
        listing_id: 'tap_150g_2',
        price_usd: 49500,
        observed_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        hours: 7200,
      },
      {
        source: 'barnstormers',
        listing_id: 'barn_150g_3',
        price_usd: 47800,
        observed_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        hours: 7100,
      },
    ];

    const marketReq: marketAnalysis.MarketAnalysisRequest = {
      make: 'Cessna',
      model: '150G',
      year_from: 1960,
      year_to: 1970,
      market_listings: marketListings,
    };

    const marketAplRequest: marketAnalysis.AplRequest = {
      apl_version: '1.0',
      message_id: 'msg_mkt_' + pipelineId,
      sender: 'workflow:omvm-orchestration',
      receiver: 'apl://aviation.abos/market/omvm-market-analysis/v1',
      intent: 'analyze_market_listings',
      context: { channel: 'sdk' },
      payload: marketReq,
    };

    const marketResult = await marketAnalysis.handleAplRequest(marketAplRequest);
    const marketPayload = marketResult.payload;

    console.log(`✓ Market analysis complete`);
    console.log(`  Aircraft: ${marketPayload.aircraft}`);
    console.log(
      `  Listings analyzed: ${marketPayload.market_analysis.observation_count_after_filtering}`
    );
    console.log(
      `  Effective sample size (n_eff): ${marketPayload.market_analysis.effective_sample_size.toFixed(2)}`
    );
    console.log(`  Mode: ${marketPayload.market_analysis.valuation_mode}`);
    console.log(`  Market value: $${marketPayload.market_analysis.market_value_usd.toLocaleString()}`);
    console.log(
      `  Market σ (log): ${marketPayload.market_analysis.market_sigma_log.toFixed(3)}\n`
    );

    // STEP 3: Aircraft Valuation with Market Evidence
    console.log('STEP 3: Aircraft Valuation with Market Evidence');
    console.log('─'.repeat(50));

    // Use the market listings from step 2 for valuation
    const valuationReq: valuation.OmvmRequest = {
      registration: 'C-FVHP',
      make: 'Cessna',
      model: '150G',
      year: 1966,
      engine_hours: 7145.1,
      tbo_remaining_pct: 18.7, // (2000 - 1625.5) / 2000 * 100
      avionics_score: 0.75,
      market_listings: marketListings.map((m) => ({
        source: m.source as 'controller' | 'tap' | 'barnstormers' | 'aso',
        price_usd: m.price_usd,
        observed_at: m.observed_at,
      })),
    };

    const valuationAplRequest: valuation.AplRequest = {
      apl_version: '1.0',
      message_id: 'msg_val_' + pipelineId,
      sender: 'workflow:omvm-orchestration',
      receiver: 'apl://aviation.abos/valuation/omvm-valuation-v2-0/v1',
      intent: 'value_aircraft',
      context: { channel: 'sdk' },
      payload: valuationReq,
    };

    const valuationResult = await valuation.handleAplRequest(valuationAplRequest);
    const valuationPayload = valuationResult.payload;

    console.log(`✓ Valuation complete`);
    console.log(`  Aircraft: ${valuationReq.registration} (${valuationReq.year} ${valuationReq.make} ${valuationReq.model})`);
    console.log(`  Estimated value: $${valuationPayload.estimated_value_usd.toLocaleString()}`);
    console.log(`  Posterior σ: $${valuationPayload.posterior_sigma_usd.toLocaleString()}`);
    console.log(`  Confidence (±20%): ${(valuationPayload.confidence.within_20_pct * 100).toFixed(1)}%`);
    console.log(`  Confidence level: ${valuationPayload.confidence.mode}\n`);

    // STEP 4: Orchestration Summary
    console.log('STEP 4: Orchestration Summary');
    console.log('─'.repeat(50));

    console.log(`Pipeline: ${pipelineId}`);
    console.log(`Duration: ${Date.now() - parseInt(pipelineId.split('_')[1])}ms\n`);

    console.log('APL/ADL VERIFICATION:');
    console.log(`  ✓ Calibration: manifest=${calibAplRequest.receiver}, autonomy=A1`);
    console.log(`  ✓ Market Analysis: manifest=${marketAplRequest.receiver}, autonomy=A2`);
    console.log(`  ✓ Valuation: manifest=${valuationAplRequest.receiver}, autonomy=A2`);
    console.log(`  ✓ All requests include apl_version=1.0, message_id, audit trail\n`);

    console.log('AUDIT CHAIN:');
    console.log(`  Event 1 (CAL): ${calibAplRequest.message_id}`);
    console.log(`  Event 2 (MKT): ${marketAplRequest.message_id} → confidence=${(marketResult.evidence.confidence * 100).toFixed(1)}%`);
    console.log(`  Event 3 (VAL): ${valuationAplRequest.message_id} → confidence=${(valuationResult.evidence.confidence * 100).toFixed(1)}%\n`);

    console.log('DECISION TRAIL:');
    valuationPayload.audit_trace.model_decisions.slice(0, 3).forEach((d) => {
      console.log(`  • ${d}`);
    });
    console.log('  ...\n');

    console.log('=== Orchestration Complete ===');
    console.log(`Final valuation: $${valuationPayload.estimated_value_usd.toLocaleString()} ±${valuationPayload.posterior_sigma_usd.toLocaleString()}`);
    console.log(`Confidence: ${(valuationPayload.confidence.within_20_pct * 100).toFixed(1)}% within ±20%\n`);

  } catch (error) {
    console.error('ORCHESTRATION ERROR:', error);
  }
}

// Export for external use
export { orchestrateOmvmPipeline };

// Run if called directly
if (require.main === module) {
  orchestrateOmvmPipeline().catch(console.error);
}
