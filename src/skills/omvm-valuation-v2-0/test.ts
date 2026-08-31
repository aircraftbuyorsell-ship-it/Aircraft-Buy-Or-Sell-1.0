/**
 * OMVM 2.0 Valuation Engine - Test Suite
 * Tests the skill with real aircraft data
 */

import { valuateAircraft, handleAplRequest, OmvmRequest } from './index';

async function runTests() {
  console.log('=== OMVM 2.0 Valuation Engine - Test Suite ===\n');

  // Test 1: 1966 Cessna 150G (C-FVHP) - Real listing
  console.log('TEST 1: 1966 Cessna 150G (C-FVHP)');
  console.log('Data: $48,900 listing, 7,145.1 hrs total, 1,625.5 TTSO');
  console.log('Avionics: Garmin GTR 225, GTX 327, VSI, GPSmap 296, ARTEX 406 ELT\n');

  const testAircraft: OmvmRequest = {
    registration: 'C-FVHP',
    make: 'Cessna',
    model: '150G',
    year: 1966,
    engine_hours: 7145.1,
    tbo_remaining_pct: (2000 - 1625.5) / 2000 * 100, // ~18.7% remaining
    avionics_score: 0.75, // Moderate avionics upgrade
    market_listings: [
      {
        source: 'controller',
        price_usd: 48900,
        observed_at: new Date().toISOString(),
      },
    ],
  };

  try {
    const result = await valuateAircraft(testAircraft);

    console.log('VALUATION RESULT:');
    console.log(`  Estimated Value: $${result.estimated_value_usd.toLocaleString()}`);
    console.log(`  Posterior Sigma: $${result.posterior_sigma_usd.toLocaleString()}`);
    console.log(`  Valuation Mode: ${result.valuation_mode}`);
    console.log(`  Confidence (±20%): ${(result.confidence.within_20_pct * 100).toFixed(1)}%`);
    console.log(`  Coefficient of Variation: ${(result.confidence.cv * 100).toFixed(2)}%`);
    console.log(`  Confidence Level: ${result.confidence.mode}\n`);

    console.log('MARKET EVIDENCE:');
    console.log(`  Observations: ${result.market_evidence.observation_count}`);
    console.log(`  Effective Sample Size: ${result.market_evidence.effective_sample_size.toFixed(2)}`);
    console.log(`  Evidence Type: ${result.market_evidence.evidence_type}\n`);

    console.log('AUDIT TRAIL:');
    result.audit_trace.model_decisions.forEach((decision) => {
      console.log(`  • ${decision}`);
    });
    console.log('');

    // Verify reasonable values
    const list_price = 48900;
    const list_range = [list_price * 0.85, list_price * 1.15]; // ±15% of listing
    const value_in_range =
      result.estimated_value_usd >= list_range[0] &&
      result.estimated_value_usd <= list_range[1];

    console.log('VALIDATION:');
    console.log(`  Listing price: $${list_price.toLocaleString()}`);
    console.log(`  Estimate within ±15% of listing: ${value_in_range ? '✓ PASS' : '✗ FAIL'}`);
    console.log(`  Range: $${list_range[0].toLocaleString()} - $${list_range[1].toLocaleString()}`);
    console.log(
      `  Estimate: $${result.estimated_value_usd.toLocaleString()}`
    );
    console.log('');

  } catch (error) {
    console.error('ERROR:', error);
  }

  // Test 2: APL Request Envelope
  console.log('TEST 2: APL Request/Response Envelope');
  const aplRequest = {
    apl_version: '1.0',
    message_id: '550e8400-e29b-41d4-a716-446655440000',
    sender: 'user:test-user',
    receiver: 'apl://aviation.abos/valuation/omvm-valuation-v2-0/v1',
    intent: 'value_aircraft',
    context: {
      channel: 'mcp',
      human_approved: false,
    },
    payload: testAircraft,
  };

  try {
    const aplResponse = await handleAplRequest(aplRequest);
    console.log('APL RESPONSE:');
    console.log(`  Agent: ${aplResponse.agent}`);
    console.log(`  Skill: ${aplResponse.skill}`);
    console.log(`  Value: $${aplResponse.payload.estimated_value_usd.toLocaleString()}`);
    console.log(`  Audit Level: ${aplResponse.audit.level}`);
    console.log(`  Evidence Confidence: ${(aplResponse.evidence.confidence * 100).toFixed(1)}%`);
    console.log('');
  } catch (error) {
    console.error('ERROR:', error);
  }

  // Test 3: Prior-only valuation (no market data)
  console.log('TEST 3: Prior-Only Valuation (No Market Data)');
  const priorOnlyAircraft: OmvmRequest = {
    registration: 'N12345',
    make: 'Cessna',
    model: '172',
    year: 1995,
    engine_hours: 3500,
    tbo_remaining_pct: 65,
  };

  try {
    const result = await valuateAircraft(priorOnlyAircraft);
    console.log('PRIOR-ONLY VALUATION:');
    console.log(`  Aircraft: ${priorOnlyAircraft.year} Cessna 172`);
    console.log(`  Age: ${new Date().getFullYear() - priorOnlyAircraft.year} years`);
    console.log(`  Estimated Value: $${result.estimated_value_usd.toLocaleString()}`);
    console.log(`  Valuation Mode: ${result.valuation_mode}`);
    console.log(`  Confidence (±20%): ${(result.confidence.within_20_pct * 100).toFixed(1)}%`);
    console.log('');
  } catch (error) {
    console.error('ERROR:', error);
  }

  console.log('=== All Tests Complete ===');
}

// Run tests
runTests().catch(console.error);
