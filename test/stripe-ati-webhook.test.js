import test from 'node:test';
import assert from 'node:assert/strict';

const ATI_MAP = {
  level_2_basic: 'ATI_BASIC_REPORT',
  ati_pro: 'ATI_PRO',
  ati_pro_tax: 'ATI_PRO_TAX',
};

function resolveProductKey({ productMetadata = {}, sessionMetadata = {} } = {}) {
  const stripeTier = productMetadata.abos_tier_id;
  if (stripeTier && ATI_MAP[stripeTier]) return ATI_MAP[stripeTier];
  const legacy = new Set([
    'ATI_FULL_REPORT', 'ATI_SCORE', 'VALUATION_STUDIO',
    'VERIFICATION_PACK', 'PRO', 'BROKER',
  ]);
  return legacy.has(sessionMetadata.product_key) ? sessionMetadata.product_key : null;
}

function requireAircraftRegistration(productKey, registration) {
  const aircraftScoped = new Set([
    'ATI_BASIC_REPORT', 'ATI_PRO', 'ATI_PRO_TAX',
    'ATI_FULL_REPORT', 'ATI_SCORE', 'VALUATION_STUDIO', 'VERIFICATION_PACK',
  ]);
  if (!aircraftScoped.has(productKey)) return true;
  return typeof registration === 'string' && registration.trim().length > 0;
}

function idempotencyKey(eventId, paymentId) {
  return eventId || paymentId || null;
}

test('maps Stripe Level 2 metadata to canonical ABOS product', () => {
  assert.equal(resolveProductKey({ productMetadata: { abos_tier_id: 'level_2_basic' } }), 'ATI_BASIC_REPORT');
});

test('maps Stripe ATI Pro metadata to canonical ABOS product', () => {
  assert.equal(resolveProductKey({ productMetadata: { abos_tier_id: 'ati_pro' } }), 'ATI_PRO');
});

test('maps Stripe ATI Pro Tax metadata to canonical ABOS product', () => {
  assert.equal(resolveProductKey({ productMetadata: { abos_tier_id: 'ati_pro_tax' } }), 'ATI_PRO_TAX');
});

test('Stripe product metadata wins over client supplied product_key', () => {
  assert.equal(resolveProductKey({
    productMetadata: { abos_tier_id: 'ati_pro' },
    sessionMetadata: { product_key: 'ATI_FULL_REPORT' },
  }), 'ATI_PRO');
});

test('legacy product key remains supported', () => {
  assert.equal(resolveProductKey({ sessionMetadata: { product_key: 'ATI_FULL_REPORT' } }), 'ATI_FULL_REPORT');
});

test('unknown product is rejected', () => {
  assert.equal(resolveProductKey({ sessionMetadata: { product_key: 'FREE_REPORT' } }), null);
});

test('aircraft scoped ATI purchase requires registration', () => {
  assert.equal(requireAircraftRegistration('ATI_PRO', 'N123AB'), true);
  assert.equal(requireAircraftRegistration('ATI_PRO', ''), false);
  assert.equal(requireAircraftRegistration('ATI_PRO_TAX', null), false);
});

test('idempotency prefers Stripe event id', () => {
  assert.equal(idempotencyKey('evt_123', 'pi_123'), 'evt_123');
});

test('idempotency falls back to payment id when event id is absent', () => {
  assert.equal(idempotencyKey('', 'pi_123'), 'pi_123');
});

test('idempotency has no key when both identifiers are absent', () => {
  assert.equal(idempotencyKey('', ''), null);
});
