// Generates the integration artifacts the installer writes into a customer's
// project: a public config file, a server-side adapter, and an env template.
//
// Pure — returns {path, contents} descriptors rather than writing them, so
// generation is fully unit-testable and the CLI stays a thin writer.
//
// THE INVARIANT THIS MODULE EXISTS TO ENFORCE:
// the tenant API key is never written into any generated file. It goes into an
// .env template (gitignored, server-read) and nowhere else. Generated config
// is assumed to be committed and publicly readable.

import { PLATFORMS, adapterPathFor } from './platform.mjs';

export const CONFIG_FILENAME = 'abos.config.json';
export const ENV_FILENAME = '.env.abos.example';

/** Fields that must never appear in a generated, committed config file. */
const FORBIDDEN_CONFIG_KEYS = Object.freeze([
  'api_key', 'apiKey', 'key', 'secret', 'token', 'password', 'credential',
]);

export function buildConfig({ tenant, license, features, branding, adapterUrl = '/api/abos' }) {
  const config = {
    $schema: 'https://aircraftbuyorsell.com/schema/abos.config.v1.json',
    version: 1,
    tenant_id: tenant?.tenant_id || null,
    display_name: tenant?.display_name || null,
    // Presentation only. The authoritative capability grant lives in the
    // License entity and is enforced server-side on every request; this list
    // exists so the UI can hide what the tenant isn't licensed for, which is a
    // UX nicety, never a security control.
    enabled_features: [...(features || [])],
    branding: {
      brand_name: branding?.brand_name || tenant?.display_name || null,
      primary_color: branding?.primary_color || null,
      logo_url: branding?.logo_url || null,
      mode: branding?.mode || 'light',
    },
    adapter_url: adapterUrl,
    plan: license?.plan || null,
    generated_at: new Date().toISOString(),
    $note: 'This file is safe to commit. Your ABOS tenant API key is NOT stored here — it belongs in an environment variable read only by your server-side adapter.',
  };

  assertNoCredentials(config);
  return config;
}

/**
 * Defensive check: throws if anything credential-shaped reached the config.
 * Called on every generated config so a future edit to buildConfig can't
 * quietly start leaking a key into a committed file.
 */
export function assertNoCredentials(config) {
  const serialized = JSON.stringify(config);
  if (/abos_tenant_[0-9a-f]{8}/.test(serialized)) {
    throw new Error('Refusing to generate config: it contains a tenant API key');
  }
  if (/sk_(test|live)_/.test(serialized)) {
    throw new Error('Refusing to generate config: it contains a Stripe secret key');
  }
  const walk = (node, path = '') => {
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      const lowered = key.toLowerCase();
      if (FORBIDDEN_CONFIG_KEYS.includes(lowered)) {
        throw new Error(`Refusing to generate config: forbidden key '${path}${key}'`);
      }
      walk(value, `${path}${key}.`);
    }
  };
  walk(config);
  return true;
}

const ENV_VAR = 'ABOS_TENANT_API_KEY';
const BASE_URL_VAR = 'ABOS_BASE_URL';

export function buildEnvTemplate({ tenantId, baseUrl }) {
  return [
    '# ABOS White-Label — server-side credentials.',
    '#',
    '# Copy this file to .env (or configure these as secrets in your hosting',
    '# platform) and fill in the key issued to you in the ABOS Partner Portal.',
    '#',
    '# SECURITY: this key authorizes API calls billed to your tenant. It must',
    '# only ever be read by server-side code. Never expose it to the browser,',
    '# never prefix it with NEXT_PUBLIC_/VITE_, and never commit the filled-in',
    '# .env file.',
    '',
    `# Tenant: ${tenantId || '<your tenant id>'}`,
    `${ENV_VAR}=`,
    `${BASE_URL_VAR}=${baseUrl || 'https://aircraftbuyorsell.base44.app'}`,
    '',
  ].join('\n');
}

const ADAPTER_HEADER = `/**
 * ABOS White-Label server-side adapter — GENERATED FILE.
 *
 * This is the ONLY place your ABOS tenant API key is used. It runs on your
 * server, reads the key from the environment, and proxies requests from your
 * browser code to ABOS Core.
 *
 * Your browser code should call this route via createBrowserClient() from the
 * ABOS SDK — it never sees the key.
 *
 * Re-running the ABOS installer will overwrite this file.
 */`;

function adapterBody(platform) {
  const common = `
const ABOS_BASE_URL = process.env.${BASE_URL_VAR} || 'https://aircraftbuyorsell.base44.app';
const ABOS_TENANT_API_KEY = process.env.${ENV_VAR};

// Only endpoints your integration actually uses are forwarded. An open proxy
// would let anyone who can reach your site spend your ABOS quota on any
// endpoint your license grants.
const ALLOWED_ENDPOINTS = new Set([
  'health', 'whoami', 'search', 'listings.list', 'listings.get',
  'ati.score', 'valuate',
]);

async function callAbos(endpoint, params) {
  if (!ABOS_TENANT_API_KEY) {
    return { ok: false, status: 500, payload: { status: 'error', error: { code: 'not_configured', message: 'ABOS adapter is not configured: ${ENV_VAR} is unset.' } } };
  }
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return { ok: false, status: 400, payload: { status: 'error', error: { code: 'endpoint_not_allowed', message: 'Endpoint not allowed by this adapter.' } } };
  }

  const response = await fetch(\`\${ABOS_BASE_URL}/functions/tenantCoreApi\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-abos-tenant-key': ABOS_TENANT_API_KEY },
    body: JSON.stringify({ endpoint, params: params || {} }),
  });

  let payload = null;
  try { payload = await response.json(); } catch (_e) { payload = null; }
  if (!payload) {
    return { ok: false, status: 502, payload: { status: 'error', error: { code: 'bad_gateway', message: 'ABOS returned an unreadable response.' } } };
  }
  return { ok: response.ok, status: response.status, payload };
}
`;

  switch (platform) {
    case PLATFORMS.NEXT_APP:
      return `${common}
export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch (_e) { body = {}; }
  const { status, payload } = await callAbos(body.endpoint, body.params);
  return Response.json(payload, { status });
}
`;

    case PLATFORMS.NEXT_PAGES:
      return `${common}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', error: { code: 'method_not_allowed', message: 'Use POST.' } });
  const body = req.body || {};
  const { status, payload } = await callAbos(body.endpoint, body.params);
  return res.status(status).json(payload);
}
`;

    case PLATFORMS.REMIX:
      return `${common}
export async function action({ request }) {
  let body = {};
  try { body = await request.json(); } catch (_e) { body = {}; }
  const { status, payload } = await callAbos(body.endpoint, body.params);
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}
`;

    case PLATFORMS.CLOUDFLARE_WORKER:
      // Workers read config from the env argument, not process.env.
      return `
const ALLOWED_ENDPOINTS = new Set([
  'health', 'whoami', 'search', 'listings.list', 'listings.get',
  'ati.score', 'valuate',
]);

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return Response.json({ status: 'error', error: { code: 'method_not_allowed', message: 'Use POST.' } }, { status: 405 });
    }
    let body = {};
    try { body = await request.json(); } catch (_e) { body = {}; }

    const key = env.${ENV_VAR};
    if (!key) {
      return Response.json({ status: 'error', error: { code: 'not_configured', message: 'ABOS adapter is not configured: set the ${ENV_VAR} secret with \`wrangler secret put ${ENV_VAR}\`.' } }, { status: 500 });
    }
    if (!ALLOWED_ENDPOINTS.has(body.endpoint)) {
      return Response.json({ status: 'error', error: { code: 'endpoint_not_allowed', message: 'Endpoint not allowed by this adapter.' } }, { status: 400 });
    }

    const baseUrl = env.${BASE_URL_VAR} || 'https://aircraftbuyorsell.base44.app';
    const upstream = await fetch(\`\${baseUrl}/functions/tenantCoreApi\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-abos-tenant-key': key },
      body: JSON.stringify({ endpoint: body.endpoint, params: body.params || {} }),
    });
    return new Response(upstream.body, { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
  },
};
`;

    case PLATFORMS.EXPRESS:
      return `${common}
/**
 * Mount with:  app.use('/api/abos', require('./abos/adapter.js'));
 */
module.exports = async function abosAdapter(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', error: { code: 'method_not_allowed', message: 'Use POST.' } });
  const body = req.body || {};
  const { status, payload } = await callAbos(body.endpoint, body.params);
  return res.status(status).json(payload);
};
`;

    default:
      return `${common}
/**
 * Generic adapter. Wire this to whatever HTTP layer your server uses: accept a
 * POST with { endpoint, params }, pass it to handleAbosRequest, and return the
 * result as JSON with the returned status code.
 */
export async function handleAbosRequest(body) {
  const { status, payload } = await callAbos(body?.endpoint, body?.params);
  return { status, payload };
}
`;
  }
}

export function buildAdapter(platform) {
  return `${ADAPTER_HEADER}\n${adapterBody(platform)}`;
}

/**
 * Full artifact set for an install. Returns descriptors; the CLI writes them.
 */
export function buildArtifacts({ tenant, license, features, branding, platform, baseUrl, adapterUrl = '/api/abos' }) {
  const config = buildConfig({ tenant, license, features, branding, adapterUrl });
  const artifacts = [
    { path: CONFIG_FILENAME, contents: `${JSON.stringify(config, null, 2)}\n`, commit: true },
    { path: adapterPathFor(platform), contents: buildAdapter(platform), commit: true },
    { path: ENV_FILENAME, contents: buildEnvTemplate({ tenantId: tenant?.tenant_id, baseUrl }), commit: true },
  ];

  for (const artifact of artifacts) {
    if (/abos_tenant_[0-9a-f]{8}/.test(artifact.contents)) {
      throw new Error(`Refusing to write ${artifact.path}: it contains a tenant API key`);
    }
  }
  return artifacts;
}
