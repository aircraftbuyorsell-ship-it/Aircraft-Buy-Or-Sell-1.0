import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  validateProvisionRequest,
  defaultCapabilitiesForPlan,
  generateTenantApiKey,
  hashApiKey,
} from '../_shared/tenantLicense.mjs';

/**
 * White-Label Toolset tenant provisioning.
 *
 * Creates, in one auditable operation: a ContractAcceptance record, a Tenant,
 * a License, and the tenant's first TenantApiKey. Admin-only — this is an
 * internal back-office operation, not a self-serve endpoint. The commercial
 * flow (Stripe checkout -> webhook -> provisioning) calls this after payment
 * confirmation; it is deliberately not reachable by an unauthenticated buyer.
 *
 * A license is never created without a recorded contract acceptance: the
 * agreement_version and accepted_by_email are required inputs, validated in
 * the shared pure module before anything is written.
 */

const AGREEMENT_TYPE = 'white_label_license_agreement';

function isAdmin(user: any): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

function ok(data: unknown, status = 200) {
  return Response.json({ status: 'success', data }, { status });
}

function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return Response.json({ status: 'error', error: { code, message, ...extra } }, { status });
}

Deno.serve(async (req: Request) => {
  try {
    const base44 = createClientFromRequest(req);

    let user: any = null;
    try { user = await base44.auth.me(); } catch (_e) { user = null; }
    if (!user) return fail(401, 'unauthorized', 'Authentication required.');
    if (!isAdmin(user)) return fail(403, 'admin_required', 'Tenant provisioning is an administrative operation.');

    let body: any = {};
    try { body = await req.json(); } catch (_e) { body = {}; }

    const { valid, errors, normalized } = validateProvisionRequest(body);
    if (!valid) return fail(400, 'invalid_request', 'Provisioning request is invalid.', { errors });

    const { tenantId, displayName, contactEmail, plan, agreementVersion, acceptedByEmail } = normalized;

    // tenant_id is the stable identifier every other record references, so a
    // collision must be a hard failure rather than silently reusing/overwriting
    // an existing customer's tenant.
    const existing = await base44.asServiceRole.entities.Tenant.filter({ tenant_id: tenantId }, '-created_date', 1);
    if (existing.length > 0) {
      return fail(409, 'tenant_exists', `Tenant '${tenantId}' already exists.`);
    }

    const nowIso = new Date().toISOString();

    // Contract acceptance is recorded first: if any later step fails, the
    // acceptance record is still the truthful account of what was agreed and
    // when. It is never back-dated to match the license.
    const acceptance = await base44.asServiceRole.entities.ContractAcceptance.create({
      tenant_id: tenantId,
      agreement_type: AGREEMENT_TYPE,
      agreement_version: agreementVersion,
      accepted_by_email: acceptedByEmail,
      accepted_by_name: String(body.accepted_by_name || '').trim() || undefined,
      accepted_at: String(body.accepted_at || '').trim() || nowIso,
      ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || undefined,
      user_agent: (req.headers.get('user-agent') || '').slice(0, 500) || undefined,
    });

    const tenant = await base44.asServiceRole.entities.Tenant.create({
      tenant_id: tenantId,
      display_name: displayName,
      contact_email: contactEmail,
      status: 'active',
      brand_name: String(body.brand_name || '').trim() || displayName,
      logo_url: String(body.logo_url || '').trim() || undefined,
      primary_color: String(body.primary_color || '').trim() || undefined,
      custom_domain: String(body.custom_domain || '').trim() || undefined,
      allowed_domains: Array.isArray(body.allowed_domains)
        ? body.allowed_domains.map((d: unknown) => String(d).trim().toLowerCase()).filter(Boolean)
        : [],
    });

    // Capabilities come from the plan's server-side default set. A caller may
    // narrow them (add-on downgrades / bespoke deals) but may NOT widen beyond
    // what the plan grants — otherwise provisioning would become a way to mint
    // an enterprise-capability license on a starter plan.
    const planCapabilities = defaultCapabilitiesForPlan(plan);
    const requested = Array.isArray(body.allowed_capabilities) ? body.allowed_capabilities.map(String) : null;
    const capabilities = requested
      ? requested.filter((c: string) => planCapabilities.includes(c))
      : planCapabilities;

    const license = await base44.asServiceRole.entities.License.create({
      tenant_id: tenantId,
      plan,
      status: 'active',
      allowed_capabilities: capabilities,
      api_rate_plan: plan === 'enterprise' ? 'enterprise' : plan === 'professional' ? 'pro' : 'free',
      version_channel: body.version_channel === 'beta' ? 'beta' : 'stable',
      activated_at: nowIso,
      expires_at: String(body.expires_at || '').trim() || undefined,
      stripe_customer_id: String(body.stripe_customer_id || '').trim() || undefined,
      stripe_subscription_id: String(body.stripe_subscription_id || '').trim() || undefined,
    });

    // Link the acceptance to the license now that it exists, so the audit
    // trail resolves in both directions.
    await base44.asServiceRole.entities.ContractAcceptance.update(acceptance.id, { license_id: license.id })
      .catch((err: any) => console.warn(`Failed to link acceptance ${acceptance.id} to license ${license.id}: ${err?.message}`));

    const { plaintext, prefix } = generateTenantApiKey();
    const keyHash = await hashApiKey(plaintext);
    const apiKey = await base44.asServiceRole.entities.TenantApiKey.create({
      tenant_id: tenantId,
      license_id: license.id,
      name: String(body.key_name || '').trim() || 'Initial provisioning key',
      key_prefix: prefix,
      key_hash: keyHash,
      status: 'active',
    });

    console.log(`✓ Provisioned tenant '${tenantId}' (license ${license.id}, plan ${plan}) by ${user.email}`);

    return ok({
      tenant: { id: tenant.id, tenant_id: tenantId, display_name: displayName, status: 'active' },
      license: { id: license.id, plan, status: 'active', allowed_capabilities: capabilities },
      contract_acceptance: { id: acceptance.id, agreement_version: agreementVersion, accepted_by_email: acceptedByEmail },
      api_key: {
        id: apiKey.id,
        key: plaintext,
        key_prefix: prefix,
        note: 'Store this key now — it is shown only once and cannot be recovered.',
      },
    }, 201);
  } catch (error) {
    // Never leak internal error detail to the caller; log it for operators.
    console.error('tenantProvision failed:', (error as any)?.message);
    return fail(500, 'internal_error', 'Provisioning failed.');
  }
});
