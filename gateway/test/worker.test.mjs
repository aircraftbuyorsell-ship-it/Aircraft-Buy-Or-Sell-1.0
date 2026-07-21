import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUpstreamRequest } from '../src/worker.mjs';

const env = {
  GATEWAY_SECRET: 'shh',
  BASE44_APP_BASE_URL: 'https://abos-example.base44.app',
  CORS_ALLOWED_ORIGINS: 'https://aircraftbuyorsell.com',
};

test('rewrites a public search request into a Base44 function call with gateway headers', () => {
  const incoming = new Request('https://api.abos.group/api/v1/search', {
    method: 'POST',
    headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'g650' }),
  });

  const upstream = buildUpstreamRequest(incoming, env);

  assert.equal(upstream.url, 'https://abos-example.base44.app/functions/abosCoreApiV1');
  assert.equal(upstream.method, 'POST');
  assert.equal(upstream.headers.get('x-abos-gateway-secret'), 'shh');
  assert.equal(upstream.headers.get('x-abos-original-path'), '/api/v1/search');
  assert.equal(upstream.headers.get('x-abos-original-method'), 'POST');
  assert.equal(upstream.headers.get('authorization'), 'Bearer tok');
});

test('preserves query strings and GET/HEAD method in the original-path header, without a body', () => {
  const incoming = new Request('https://api.abos.group/api/v1/aircraft/ac_abc123?foo=bar', {
    method: 'GET',
    headers: { 'x-abos-api-key': 'key123' },
  });

  const upstream = buildUpstreamRequest(incoming, env);

  assert.equal(upstream.headers.get('x-abos-original-path'), '/api/v1/aircraft/ac_abc123?foo=bar');
  assert.equal(upstream.headers.get('x-abos-original-method'), 'GET');
  assert.equal(upstream.method, 'POST'); // Base44 function invocation is always POST at the transport level
  assert.equal(upstream.body, null);
});

test('strips connection-level headers that must not cross origins', () => {
  const incoming = new Request('https://api.abos.group/api/v1/search', {
    method: 'POST',
    headers: { host: 'api.abos.group', 'cf-connecting-ip': '1.2.3.4', 'x-forwarded-for': '1.2.3.4' },
    body: '{}',
  });

  const upstream = buildUpstreamRequest(incoming, env);

  assert.equal(upstream.headers.get('host'), null);
  assert.equal(upstream.headers.get('cf-connecting-ip'), null);
  assert.equal(upstream.headers.get('x-forwarded-for'), null);
});
