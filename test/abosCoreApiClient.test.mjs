import test from 'node:test';
import assert from 'node:assert/strict';
import { createAbosCoreApiClient, AbosCoreApiError } from '../sdk/js/abosCoreApiClient.mjs';

function fakeFetch(responses) {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url, init });
      const match = responses.shift();
      return {
        ok: match.status >= 200 && match.status < 300,
        status: match.status,
        json: async () => match.body,
      };
    },
  };
}

test('searchListings sends the gateway secret, credential, and contract-shaped body', async () => {
  const { fetch, calls } = fakeFetch([
    { status: 200, body: { query: 'g650', intent: { intent: 'search', interpretation_status: 'deterministic', constraints: { terms: ['g650'] } }, results: [], page: { page_size: 20, next_cursor: null, has_more: false }, explanation: 'ok' } },
  ]);
  const client = createAbosCoreApiClient({
    baseUrl: 'https://gateway.example.invalid',
    gatewaySecret: 'shh',
    credential: { bearer: 'token123' },
    fetchImpl: fetch,
  });

  const res = await client.searchListings('g650');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://gateway.example.invalid/api/v1/search');
  assert.equal(calls[0].init.headers['x-abos-gateway-secret'], 'shh');
  assert.equal(calls[0].init.headers.authorization, 'Bearer token123');
  assert.deepEqual(JSON.parse(calls[0].init.body), { query: 'g650', page_size: 20, cursor: null });
  assert.equal(res.query, 'g650');
});

test('throws AbosCoreApiError with the sanitized server error on non-2xx', async () => {
  const { fetch } = fakeFetch([
    { status: 401, body: { error: { code: 'AUTHENTICATION_REQUIRED', message: 'A bearer token or X-ABOS-API-Key header is required.', request_id: 'req_1' } } },
  ]);
  const client = createAbosCoreApiClient({
    baseUrl: 'https://gateway.example.invalid',
    gatewaySecret: 'shh',
    credential: { apiKey: 'abc' },
    fetchImpl: fetch,
  });

  await assert.rejects(
    () => client.searchListings('g650'),
    (err) => {
      assert.ok(err instanceof AbosCoreApiError);
      assert.equal(err.status, 401);
      assert.equal(err.code, 'AUTHENTICATION_REQUIRED');
      assert.equal(err.requestId, 'req_1');
      return true;
    },
  );
});

test('requires gatewaySecret and a credential', () => {
  assert.throws(() => createAbosCoreApiClient({ baseUrl: 'https://x', credential: { bearer: 'a' } }));
  assert.throws(() => createAbosCoreApiClient({ baseUrl: 'https://x', gatewaySecret: 'a' }));
});
