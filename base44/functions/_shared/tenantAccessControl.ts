import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  hashApiKey,
  isLicenseActive,
  canTenantUseCapability as canUseCapabilityPure,
  checkRateLimit,
} from './tenantLicense.mjs';

// Deliberately distinct from accessControl.ts's user-session auth: a tenant
// caller is a customer organization's own backend/installer, never an ABOS
// browser session, so it authenticates via a hashed API key header instead
// of createClientFromRequest's user auth.
const TENANT_KEY_HEADER = 'x-abos-tenant-key';

export interface TenantAccess {
  ok: boolean;
  status: number;
  error?: string;
  base44?: any;
  tenant?: any;
  license?: any;
  apiKey?: any;
}

/**
 * Resolves the caller identified by the x-abos-tenant-key header into its
 * Tenant + License + TenantApiKey records, enforcing (in order): key
 * validity, license activity, tenant activity, rate limit. Every check is
 * server-side against stored records — nothing here trusts client-supplied
 * tenant_id/license_id/capabilities.
 */
export async function resolveTenantAccess(req: Request): Promise<TenantAccess> {
  const base44 = createClientFromRequest(req);
  const raw = req.headers.get(TENANT_KEY_HEADER) || '';
  if (!raw) return { ok: false, status: 401, error: 'Missing tenant API key', base44 };

  const hash = await hashApiKey(raw);
  const keys = await base44.asServiceRole.entities.TenantApiKey.filter({ key_hash: hash }, '-created_date', 1);
  const apiKey = keys[0];
  if (!apiKey || apiKey.status !== 'active') {
    return { ok: false, status: 401, error: 'Invalid or revoked tenant API key', base44 };
  }

  const license = await base44.asServiceRole.entities.License.get(apiKey.license_id).catch(() => null);
  if (!isLicenseActive(license)) {
    return { ok: false, status: 403, error: 'License is not active', base44, apiKey };
  }

  // Defence in depth: the key and the licence each carry a tenant_id, and the
  // tenant below is resolved from the LICENCE. If those two ever disagree —
  // admin error, a bad migration, or some future provisioning path — the key
  // would silently operate as whichever tenant the licence names, reading that
  // tenant's data and spending their quota. Nothing should be able to create
  // such a pairing (tenantProvision writes both from one value), so treat it
  // as corruption and refuse rather than picking a side.
  if (apiKey.tenant_id && apiKey.tenant_id !== license.tenant_id) {
    console.error(
      `Refusing tenant key ${apiKey.id}: key tenant '${apiKey.tenant_id}' does not match licence tenant '${license.tenant_id}'`,
    );
    return { ok: false, status: 403, error: 'Credential is not valid for this licence', base44, apiKey };
  }

  const tenants = await base44.asServiceRole.entities.Tenant.filter({ tenant_id: license.tenant_id }, '-created_date', 1);
  const tenant = tenants[0];
  if (!tenant || tenant.status !== 'active') {
    return { ok: false, status: 403, error: 'Tenant is not active', base44, license, apiKey };
  }

  const rate = checkRateLimit(
    {
      minuteStart: apiKey.rate_minute_start ? Date.parse(apiKey.rate_minute_start) : 0,
      minuteCount: apiKey.rate_minute_count || 0,
      dayStart: apiKey.rate_day_start ? Date.parse(apiKey.rate_day_start) : 0,
      dayCount: apiKey.rate_day_count || 0,
    },
    license.api_rate_plan || 'free',
  );
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      error: rate.reason === 'rate_limited' ? 'Rate limit exceeded' : 'Daily limit exceeded',
      base44, tenant, license, apiKey,
    };
  }

  // Fire-and-forget usage/window update — never blocks or fails the response.
  base44.asServiceRole.entities.TenantApiKey.update(apiKey.id, {
    last_used_at: new Date().toISOString(),
    rate_minute_start: new Date(rate.state.minuteStart).toISOString(),
    rate_minute_count: rate.state.minuteCount,
    rate_day_start: new Date(rate.state.dayStart).toISOString(),
    rate_day_count: rate.state.dayCount,
  }).catch((err: any) => console.warn(`Failed to persist tenant rate-limit state for key ${apiKey.id}: ${err?.message}`));

  return { ok: true, status: 200, base44, tenant, license, apiKey };
}

export function canTenantUseCapability(access: TenantAccess, capability: string): boolean {
  if (!access?.ok) return false;
  return canUseCapabilityPure(access.license, capability);
}

/** Response helper mirroring accessControl.ts's requireCapability shape. */
export function requireTenantCapability(access: TenantAccess, capability: string): Response | null {
  if (!access?.ok) return Response.json({ error: access?.error || 'Unauthorized' }, { status: access?.status || 401 });
  if (!canTenantUseCapability(access, capability)) {
    return Response.json({ error: 'Capability not included in this license', capability }, { status: 403 });
  }
  return null;
}
