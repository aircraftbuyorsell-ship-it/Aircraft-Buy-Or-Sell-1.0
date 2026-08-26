import {
  resolveTenantAccess,
  requireTenantCapability,
} from '../_shared/tenantAccessControl.ts';
import {
  capabilityForEndpoint,
  isKnownEndpoint,
  listEndpoints,
} from '../_shared/tenantLicense.mjs';
import { mapListing } from '../_shared/listingMapper.mjs';

/**
 * ABOS Core API — White-Label tenant surface.
 *
 * Authenticates the caller as a Tenant via the x-abos-tenant-key header
 * (see _shared/tenantAccessControl.ts), enforces the tenant's License
 * capabilities server-side, then serves the same data contract as
 * abosCoreApi (shared mapListing) so a white-label customer sees exactly
 * what a direct API customer sees.
 *
 * Deliberately separate from abosCoreApi rather than bolted into it: that
 * function's caller model is "individual ABOS user or their personal API
 * key", with its own tier/scope/entitlement semantics. Tenants are a
 * different principal type with a different authorization source (License,
 * not Entitlement). Mixing them into one auth path is how tenant-breakout
 * bugs get written.
 *
 * Every response is capability-gated. Unknown endpoints are rejected — the
 * endpoint->capability map is closed by default, never open.
 */

function ok(data: unknown) {
  return Response.json({ status: 'success', data });
}

function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return Response.json({ status: 'error', error: { code, message, ...extra } }, { status });
}

Deno.serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  let access: any = null;
  let endpoint: string | null = null;
  let res: Response;

  try {
    let body: any = {};
    try { body = await req.json(); } catch (_e) { body = {}; }
    endpoint = String(body.endpoint || '').replace(/^v1\./, '') || null;
    const params = body.params || {};

    // ── Authenticate the tenant before anything else is read ──
    access = await resolveTenantAccess(req);
    if (!access.ok) {
      res = fail(access.status, 'unauthorized', access.error || 'Unauthorized');
    } else if (!endpoint) {
      res = fail(400, 'missing_endpoint', "Request body must include 'endpoint'.");
    } else if (endpoint === 'health') {
      // Unconditional (post-auth) health check — this is what the installer's
      // "ABOS Core connection" step calls to prove the tenant's key, license
      // and connectivity all work before it writes any config.
      res = ok({
        healthy: true,
        tenant_id: access.tenant.tenant_id,
        license_status: access.license.status,
        server_time: new Date().toISOString(),
      });
    } else if (endpoint === 'whoami') {
      // Identity + entitlement introspection. Returns only this tenant's own
      // record — never another tenant's, and never internal fields such as
      // key hashes or Stripe identifiers.
      res = ok({
        tenant: {
          tenant_id: access.tenant.tenant_id,
          display_name: access.tenant.display_name,
          brand_name: access.tenant.brand_name || access.tenant.display_name,
          status: access.tenant.status,
        },
        license: {
          plan: access.license.plan,
          status: access.license.status,
          allowed_capabilities: access.license.allowed_capabilities || [],
          version_channel: access.license.version_channel || 'stable',
          expires_at: access.license.expires_at || null,
        },
        available_endpoints: listEndpoints(),
      });
    } else if (!isKnownEndpoint(endpoint)) {
      res = fail(404, 'unknown_endpoint', `Unknown endpoint '${endpoint}'.`, { available_endpoints: listEndpoints() });
    } else {
      const capability = capabilityForEndpoint(endpoint);
      const capErr = requireTenantCapability(access, capability!);
      if (capErr) {
        res = capErr;
      } else {
        res = await handleEndpoint(endpoint, params, access);
      }
    }
  } catch (error) {
    console.error(`tenantCoreApi ${requestId} failed:`, (error as any)?.message);
    res = fail(500, 'internal_error', 'Request failed.');
  }

  // Per-tenant request audit. Fire-and-forget: logging must never fail or
  // delay the response, but every tenant call is attributable.
  try {
    if (access?.base44 && access?.tenant) {
      await access.base44.asServiceRole.entities.ApiRequestLog.create({
        request_id: requestId,
        endpoint: endpoint || 'unknown',
        caller_type: 'tenant_api_key',
        api_key_id: access.apiKey?.id || undefined,
        owner_email: access.tenant?.contact_email || undefined,
        status: res.status,
        duration_ms: Date.now() - started,
      });
    }
  } catch (_e) { /* audit logging must never break the request */ }

  const headers = new Headers(res.headers);
  headers.set('X-Request-ID', requestId);
  return new Response(res.body, { status: res.status, headers });
});

async function handleEndpoint(endpoint: string, params: any, access: any): Promise<Response> {
  const base44 = access.base44;

  if (endpoint === 'listings.get') {
    if (!params.id) return fail(400, 'missing_id', "'params.id' is required.");
    let listing: any = null;
    try { listing = await base44.asServiceRole.entities.AircraftListing.get(params.id); } catch (_e) { listing = null; }
    // Public-visibility guard kept inline and explicit here (not hidden in a
    // shared helper) so it is directly greppable and guard-testable per entry
    // point — same reason abosCoreApi keeps its own copy.
    if (!listing || listing.visibility !== 'public' || listing.status !== 'active') {
      return fail(404, 'listing_not_found', 'Listing not found.');
    }
    return ok({ listing: mapListing(listing) });
  }

  if (endpoint === 'listings.list' || endpoint === 'search') {
    const all = await base44.asServiceRole.entities.AircraftListing.filter(
      { status: 'active', visibility: 'public' }, '-created_date', 200,
    );
    const q = (s: unknown) => (s || '').toString().toLowerCase();
    let matches = all;
    if (params.manufacturer) matches = matches.filter((l: any) => q(l.make).includes(q(params.manufacturer)));
    if (params.model) matches = matches.filter((l: any) => q(l.model).includes(q(params.model)));
    if (params.max_price) matches = matches.filter((l: any) => !l.asking_price || l.asking_price <= Number(params.max_price));
    const limit = Math.min(Number(params.limit) || 20, 50);
    return ok({ total: matches.length, listings: matches.slice(0, limit).map(mapListing) });
  }

  // Remaining mapped endpoints (ati.score, ati.report, ati.report.pro,
  // valuate, passport.get, registry.lookup, intelligence.*) are capability-
  // gated above but not yet served here. Returning 501 is deliberate: a
  // tenant whose license grants the capability gets an honest "not yet
  // available" rather than a silent empty success that looks like real data.
  return fail(501, 'not_implemented', `Endpoint '${endpoint}' is not yet available on the white-label surface.`);
}
