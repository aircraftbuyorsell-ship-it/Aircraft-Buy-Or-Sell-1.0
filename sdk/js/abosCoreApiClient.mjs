/**
 * Minimal JS SDK client for ABOS Core API v1.
 *
 * Server-side only. base44/functions/abosCoreApiV1/entry.ts requires the
 * ABOS_GATEWAY_SHARED_SECRET header — it only accepts requests through the
 * configured API gateway (the Cloudflare Worker gateway described in
 * architecture/AD-026-api-deployment-boundary.md is not deployed yet). Do
 * not import this from browser code: it would either fail (no secret
 * available client-side) or leak the gateway secret if you hardcoded one.
 *
 * Until the gateway is live, call this from trusted server-side contexts
 * (another Base44 function, a CLI, a test harness) with the shared secret
 * from your own environment.
 */

export class AbosCoreApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `ABOS Core API request failed with status ${status}`);
    this.status = status;
    this.code = body?.error?.code || 'UNKNOWN_ERROR';
    this.requestId = body?.error?.request_id || null;
    this.details = body?.error?.details || {};
  }
}

export function createAbosCoreApiClient({
  baseUrl,
  gatewaySecret,
  credential, // { bearer: '...' } or { apiKey: '...' }
  fetchImpl = fetch,
}) {
  if (!baseUrl) throw new TypeError('baseUrl is required');
  if (!gatewaySecret) throw new TypeError('gatewaySecret is required — see module doc comment');
  if (!credential || (!credential.bearer && !credential.apiKey)) {
    throw new TypeError('credential.bearer or credential.apiKey is required');
  }

  const baseHeaders = {
    'content-type': 'application/json',
    'x-abos-gateway-secret': gatewaySecret,
    ...(credential.bearer
      ? { authorization: `Bearer ${credential.bearer}` }
      : { 'x-abos-api-key': credential.apiKey }),
  };

  async function request(method, path, body) {
    const res = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: baseHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new AbosCoreApiError(res.status, json);
    return json;
  }

  return {
    /**
     * Matches OpenAPI operationId `searchListings` (POST /api/v1/search).
     * @param {string} query - natural language or keyword search text
     * @param {{pageSize?: number, cursor?: string|null}} [opts]
     */
    async searchListings(query, opts = {}) {
      return request('POST', '/api/v1/search', {
        query,
        page_size: opts.pageSize ?? 20,
        cursor: opts.cursor ?? null,
      });
    },

    /** Matches operationId `getAircraft` (GET /api/v1/aircraft/{aircraft_id}). */
    async getAircraft(aircraftId) {
      return request('GET', `/api/v1/aircraft/${encodeURIComponent(aircraftId)}`);
    },

    /** Matches operationId `getListing` (GET /api/v1/listings/{listing_id}). */
    async getListing(listingId) {
      return request('GET', `/api/v1/listings/${encodeURIComponent(listingId)}`);
    },
  };
}
