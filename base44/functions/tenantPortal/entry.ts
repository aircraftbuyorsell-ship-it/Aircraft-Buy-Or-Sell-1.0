import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generateTenantApiKey, hashApiKey } from '../_shared/tenantLicense.mjs';

/**
 * ABOS Partner Portal backend.
 *
 * Serves the logged-in partner their own tenant, license, API keys and
 * downloads, and lets them rotate a key.
 *
 * AUTHORIZATION MODEL — deliberately different from tenantCoreApi:
 *   tenantCoreApi authenticates a MACHINE (a tenant's backend, via a hashed
 *   API key) and answers for exactly that key's tenant.
 *   This function authenticates a PERSON (a logged-in ABOS user session) and
 *   answers only for tenants where that person is the recorded contact.
 *
 * The tenant set is always derived server-side from the session's verified
 * email. A tenant_id in the request is only ever used to SELECT from that
 * derived set, never to look one up directly — otherwise any partner could
 * read another partner's license and keys by guessing a slug (IDOR).
 */

function ok(data: unknown, status = 200) {
  return Response.json({ status: 'success', data }, { status });
}

function fail(status: number, code: string, message: string) {
  return Response.json({ status: 'error', error: { code, message } }, { status });
}

function isAdmin(user: any): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

/** Public shape of a license — never exposes billing identifiers. */
function publicLicense(license: any) {
  if (!license) return null;
  return {
    id: license.id,
    plan: license.plan,
    status: license.status,
    allowed_capabilities: license.allowed_capabilities || [],
    api_rate_plan: license.api_rate_plan || 'free',
    version_channel: license.version_channel || 'stable',
    activated_at: license.activated_at || null,
    expires_at: license.expires_at || null,
  };
}

/** Public shape of a key — the hash never leaves the server. */
function publicKey(key: any) {
  return {
    id: key.id,
    name: key.name || 'Unnamed key',
    key_prefix: key.key_prefix || null,
    status: key.status,
    last_used_at: key.last_used_at || null,
    created_at: key.created_date || null,
  };
}

Deno.serve(async (req: Request) => {
  try {
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }
    if (!user) return fail(401, 'unauthorized', 'Sign in to view your Partner Portal.');

    let body: any = {};
    try { body = await req.json(); } catch (_e) { body = {}; }
    const action = String(body.action || 'overview');

    // ── Resolve which tenants this person may see, from their session ──
    const email = String(user.email || '').toLowerCase();
    const svc = base44.asServiceRole;
    const tenants = isAdmin(user)
      ? await svc.entities.Tenant.filter({}, '-created_date', 100)
      : await svc.entities.Tenant.filter({ contact_email: email }, '-created_date', 50);

    if (!tenants.length) {
      return ok({ tenants: [], tenant: null, license: null, api_keys: [], downloads: [] });
    }

    // A requested tenant_id may only SELECT from the already-authorized set.
    const requestedId = String(body.tenant_id || '').trim();
    const tenant = requestedId
      ? tenants.find((t: any) => t.tenant_id === requestedId)
      : tenants[0];
    if (!tenant) return fail(404, 'tenant_not_found', 'No such tenant for this account.');

    const licenses = await svc.entities.License.filter({ tenant_id: tenant.tenant_id }, '-created_date', 1);
    const license = licenses[0] || null;

    // ── Key rotation ──
    if (action === 'rotate_key') {
      if (!license) return fail(409, 'no_license', 'This tenant has no license to issue a key against.');
      if (license.status !== 'active') {
        return fail(403, 'license_inactive', `Cannot issue a key while the license is ${license.status}.`);
      }

      const { plaintext, prefix } = generateTenantApiKey();
      const created = await svc.entities.TenantApiKey.create({
        tenant_id: tenant.tenant_id,
        license_id: license.id,
        name: String(body.name || '').trim() || 'Rotated key',
        key_prefix: prefix,
        key_hash: await hashApiKey(plaintext),
        status: 'active',
      });

      // The old key is revoked only when explicitly named, so rotation can be
      // done with overlap: issue the new key, deploy it, then revoke the old
      // one. Revoking implicitly would break the partner's live integration
      // the moment they clicked "rotate".
      let revokedId: string | null = null;
      if (body.revoke_key_id) {
        const target = (await svc.entities.TenantApiKey.filter(
          { tenant_id: tenant.tenant_id }, '-created_date', 100,
        )).find((k: any) => k.id === body.revoke_key_id);
        if (target) {
          await svc.entities.TenantApiKey.update(target.id, { status: 'revoked' });
          revokedId = target.id;
        }
      }

      console.log(`Partner Portal: ${email} rotated a key for tenant ${tenant.tenant_id}`);
      return ok({
        api_key: {
          id: created.id,
          key: plaintext,
          key_prefix: prefix,
          note: 'Store this key now — it is shown only once and cannot be recovered.',
        },
        revoked_key_id: revokedId,
      }, 201);
    }

    // ── Key revocation ──
    if (action === 'revoke_key') {
      const keys = await svc.entities.TenantApiKey.filter({ tenant_id: tenant.tenant_id }, '-created_date', 100);
      const target = keys.find((k: any) => k.id === body.key_id);
      // Scoped to this tenant's keys, so a key id from another tenant simply
      // isn't found rather than being revoked.
      if (!target) return fail(404, 'key_not_found', 'No such API key for this tenant.');
      if (target.status === 'revoked') return ok({ id: target.id, status: 'revoked' });
      await svc.entities.TenantApiKey.update(target.id, { status: 'revoked' });
      console.log(`Partner Portal: ${email} revoked key ${target.id} for tenant ${tenant.tenant_id}`);
      return ok({ id: target.id, status: 'revoked' });
    }

    // ── Overview ──
    const apiKeys = await svc.entities.TenantApiKey.filter({ tenant_id: tenant.tenant_id }, '-created_date', 50);
    const acceptances = await svc.entities.ContractAcceptance.filter({ tenant_id: tenant.tenant_id }, '-created_date', 5);

    return ok({
      tenants: tenants.map((t: any) => ({ tenant_id: t.tenant_id, display_name: t.display_name })),
      tenant: {
        tenant_id: tenant.tenant_id,
        display_name: tenant.display_name,
        brand_name: tenant.brand_name || tenant.display_name,
        status: tenant.status,
        primary_color: tenant.primary_color || null,
        logo_url: tenant.logo_url || null,
        custom_domain: tenant.custom_domain || null,
      },
      license: publicLicense(license),
      api_keys: apiKeys.map(publicKey),
      contract: acceptances[0]
        ? {
            agreement_version: acceptances[0].agreement_version,
            accepted_by_email: acceptances[0].accepted_by_email,
            accepted_at: acceptances[0].accepted_at,
          }
        : null,
      downloads: license && license.status === 'active'
        ? [{
            name: `ABOS White-Label Toolset`,
            version: '1.0.0',
            channel: license.version_channel || 'stable',
            // Packages are generated on request rather than pre-built per
            // tenant, so the portal exposes the request endpoint, not a
            // static file URL that would need regenerating on every change.
            request_endpoint: 'functions/tenantPackage',
          }]
        : [],
    });
  } catch (error) {
    console.error('tenantPortal failed:', (error as any)?.message);
    return fail(500, 'internal_error', 'Unable to load the Partner Portal.');
  }
});
