// ABOS White-Label SDK — API clients.
//
// SECURITY BOUNDARY — the single most important design constraint in this SDK:
//
//   A TenantApiKey is a SERVER-SIDE credential. It is never, under any
//   circumstance, present in browser code.
//
// The two clients below make that boundary structural rather than advisory:
//
//   createBrowserClient()  -> talks to the CUSTOMER'S OWN backend adapter.
//                             Physically cannot send a tenant key: it has no
//                             parameter to accept one.
//   createServerClient()   -> runs in the customer's backend. Holds the tenant
//                             key and calls ABOS Core. Throws if constructed
//                             in a browser-like environment.
//
// Request flow:
//   Browser (createBrowserClient)
//     -> Customer backend adapter (createServerClient)
//       -> ABOS Core (tenantCoreApi, x-abos-tenant-key)

const DEFAULT_TIMEOUT_MS = 15000;

export class AbosApiError extends Error {
  constructor(message, { status, code, endpoint } = {}) {
    super(message);
    this.name = 'AbosApiError';
    this.status = status ?? null;
    this.code = code ?? null;
    this.endpoint = endpoint ?? null;
  }
}

/** Joins a base URL and path without producing duplicate or missing slashes. */
export function joinUrl(baseUrl, path) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  const suffix = String(path || '').replace(/^\/+/, '');
  if (!base) return `/${suffix}`;
  return suffix ? `${base}/${suffix}` : base;
}

/**
 * Normalizes an ABOS API envelope ({status:'success'|'error', data|error})
 * into either the payload or a thrown AbosApiError.
 */
export function unwrapResponse(payload, { status, endpoint } = {}) {
  if (payload && payload.status === 'success') return payload.data;
  const error = (payload && payload.error) || {};
  throw new AbosApiError(error.message || 'ABOS request failed', {
    status,
    code: error.code || null,
    endpoint,
  });
}

function isBrowserLike() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

async function postJson(url, { body, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl }) {
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) throw new AbosApiError('No fetch implementation available');

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await doFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller ? controller.signal : undefined,
    });
    let payload = null;
    try { payload = await response.json(); } catch (_e) { payload = null; }
    if (!payload) {
      throw new AbosApiError(`ABOS returned a non-JSON response (HTTP ${response.status})`, {
        status: response.status,
        endpoint: body?.endpoint,
      });
    }
    return unwrapResponse(payload, { status: response.status, endpoint: body?.endpoint });
  } catch (error) {
    if (error instanceof AbosApiError) throw error;
    if (error?.name === 'AbortError') {
      throw new AbosApiError(`ABOS request timed out after ${timeoutMs}ms`, { endpoint: body?.endpoint });
    }
    throw new AbosApiError(error?.message || 'ABOS request failed', { endpoint: body?.endpoint });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Browser client. Calls the customer's own backend adapter, which is
 * responsible for attaching the tenant key server-side.
 *
 * Note there is deliberately no way to pass a credential here.
 *
 * @param {object} options
 * @param {string} options.adapterUrl Customer's backend endpoint, e.g. '/api/abos'
 */
export function createBrowserClient({ adapterUrl = '/api/abos', fetchImpl, timeoutMs } = {}) {
  const call = (endpoint, params = {}) =>
    postJson(joinUrl(adapterUrl, ''), {
      body: { endpoint, params },
      fetchImpl,
      timeoutMs,
      // Cookies/session belong to the customer's own site, so same-origin
      // credentials are the adapter's concern, not ours.
    });

  return {
    call,
    health: () => call('health'),
    whoami: () => call('whoami'),
    search: (params) => call('search', params),
    listListings: (params) => call('listings.list', params),
    getListing: (id) => call('listings.get', { id }),
    atiScore: (params) => call('ati.score', params),
    valuate: (params) => call('valuate', params),
  };
}

/**
 * Server client for the customer's backend adapter. Holds the tenant API key
 * and calls ABOS Core directly.
 *
 * Throws if constructed in a browser-like environment — a bundler pulling this
 * into client code should fail loudly at runtime rather than silently shipping
 * a tenant credential to every visitor.
 */
export function createServerClient({ apiKey, baseUrl, fetchImpl, timeoutMs, allowBrowser = false } = {}) {
  if (!allowBrowser && isBrowserLike()) {
    throw new AbosApiError(
      'createServerClient must not run in a browser: it holds a tenant API key. Use createBrowserClient and proxy through your own backend.',
    );
  }
  if (!apiKey) throw new AbosApiError('createServerClient requires a tenant API key');
  if (!baseUrl) throw new AbosApiError('createServerClient requires the ABOS base URL');

  const call = (endpoint, params = {}) =>
    postJson(joinUrl(baseUrl, 'functions/tenantCoreApi'), {
      body: { endpoint, params },
      headers: { 'x-abos-tenant-key': apiKey },
      fetchImpl,
      timeoutMs,
    });

  return {
    call,
    health: () => call('health'),
    whoami: () => call('whoami'),
    search: (params) => call('search', params),
    listListings: (params) => call('listings.list', params),
    getListing: (id) => call('listings.get', { id }),
    atiScore: (params) => call('ati.score', params),
    valuate: (params) => call('valuate', params),
  };
}
