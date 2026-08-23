import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export type AccessTier = 'T1' | 'T2' | 'T3';
export type AccessRole = 'user' | 'admin' | 'super_admin';
export type Capability = 'api_read' | 'api_write' | 'llm_models' | 'mcp' | 'valuation' | 'advanced_reports' | 'advanced_intelligence' | 'ati_score' | 'ati_full_report' | 'verification_pack' | 'broker';

const TIER_RANK: Record<AccessTier, number> = { T1: 1, T2: 2, T3: 3 };

function normalizeTier(value: unknown): AccessTier {
  const v = String(value || '').toLowerCase();
  if (v === 'enterprise' || v === 't3') return 'T3';
  if (v === 'pro' || v === 't2') return 'T2';
  return 'T1';
}

export function isPrivileged(user: any): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

export async function resolveAccess(req: Request) {
  const base44 = createClientFromRequest(req);
  let user: any = null;
  try { user = await base44.auth.me(); } catch (_) { user = null; }
  if (!user) return { ok: false, status: 401, error: 'Unauthorized', base44, user: null };
  if (isPrivileged(user)) return { ok: true, status: 200, base44, user, role: user.role, tier: 'T3' as AccessTier, source: 'admin', entitlements: [] };

  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email }, '-created_date', 1);
  const profile = profiles[0] || null;
  if (profile?.status === 'suspended') return { ok: false, status: 403, error: 'Account suspended', base44, user, profile, entitlements: [] };

  const entitlements = await base44.asServiceRole.entities.Entitlement.filter({ user_email: user.email, status: 'active' }, '-created_date', 100);
  return { ok: true, status: 200, base44, user, profile, role: 'user' as AccessRole, tier: normalizeTier(profile?.tier || user?.tier), source: 'profile', entitlements };
}

export function allowsTier(access: any, minimumTier: AccessTier): boolean {
  return !!access?.ok && TIER_RANK[access.tier as AccessTier] >= TIER_RANK[minimumTier];
}

function hasEntitlement(access: any, productKey: string, registration?: string): boolean {
  if (access?.role === 'admin' || access?.role === 'super_admin') return true;
  return (access?.entitlements || []).some((e: any) => e.product_key === productKey && e.status === 'active' && (e.scope === 'global' || !registration || String(e.aircraft_registration || '').toUpperCase() === String(registration).toUpperCase()));
}

export function canUseCapability(access: any, capability: Capability, registration?: string): boolean {
  if (!access?.ok) return false;
  if (access.role === 'admin' || access.role === 'super_admin') return true;
  switch (capability) {
    case 'api_read': return allowsTier(access, 'T1');
    case 'api_write': return allowsTier(access, 'T2');
    case 'llm_models':
    case 'mcp': return allowsTier(access, 'T2') || hasEntitlement(access, 'PRO');
    case 'valuation': return allowsTier(access, 'T2') || hasEntitlement(access, 'VALUATION_STUDIO', registration);
    case 'advanced_reports': return allowsTier(access, 'T2') || hasEntitlement(access, 'ATI_FULL_REPORT', registration);
    case 'advanced_intelligence': return allowsTier(access, 'T2');
    case 'ati_score': return allowsTier(access, 'T1') || hasEntitlement(access, 'ATI_SCORE', registration);
    case 'ati_full_report': return allowsTier(access, 'T2') || hasEntitlement(access, 'ATI_FULL_REPORT', registration);
    case 'verification_pack': return allowsTier(access, 'T2') || hasEntitlement(access, 'VERIFICATION_PACK', registration);
    case 'broker': return allowsTier(access, 'T3') || hasEntitlement(access, 'BROKER');
    default: return false;
  }
}

export function requireCapability(access: any, capability: Capability, registration?: string) {
  if (!access?.ok) return Response.json({ error: access?.error || 'Unauthorized' }, { status: access?.status || 401 });
  if (!canUseCapability(access, capability, registration)) return Response.json({ error: 'Feature not available for this account or entitlement', capability, aircraft_registration: registration || null }, { status: 403 });
  return null;
}

export async function requirePaidEntitlement(req: Request, productKey: string, aircraftRegistration?: string) {
  const access = await resolveAccess(req);
  if (!access.ok) return { access, response: Response.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 }) };
  if (access.role === 'admin' || access.role === 'super_admin') return { access, response: null };
  if (access.tier === 'T2' && productKey === 'ATI_FULL_REPORT') return { access, response: null };
  if (!hasEntitlement(access, productKey, aircraftRegistration)) return { access, response: Response.json({ error: 'Paid entitlement required', product_key: productKey, aircraft_registration: aircraftRegistration || null }, { status: 403 }) };
  return { access, response: null };
}
