import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export type AccessTier = 'T1' | 'T2' | 'T3';
export type AccessRole = 'user' | 'admin' | 'super_admin';

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

  if (isPrivileged(user)) {
    return { ok: true, status: 200, base44, user, role: user.role as AccessRole, tier: 'T3' as AccessTier, source: 'admin' };
  }

  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email }, '-created_date', 1);
  const profile = profiles[0] || null;
  const tier = normalizeTier(profile?.tier || user?.tier);

  if (profile?.status === 'suspended') {
    return { ok: false, status: 403, error: 'Account suspended', base44, user, profile, role: 'user' as AccessRole, tier };
  }

  return { ok: true, status: 200, base44, user, profile, role: 'user' as AccessRole, tier, source: 'profile' };
}

export function allowsTier(access: any, minimumTier: AccessTier): boolean {
  return !!access?.ok && TIER_RANK[access.tier as AccessTier] >= TIER_RANK[minimumTier];
}

export function requireTier(access: any, minimumTier: AccessTier) {
  if (!access?.ok) return Response.json({ error: access?.error || 'Unauthorized' }, { status: access?.status || 401 });
  if (!allowsTier(access, minimumTier)) {
    return Response.json({ error: 'Upgrade required', required_tier: minimumTier, current_tier: access.tier }, { status: 403 });
  }
  return null;
}

export function requireCapability(access: any, capability: string) {
  if (!access?.ok) return Response.json({ error: access?.error || 'Unauthorized' }, { status: access?.status || 401 });
  if (isPrivileged(access.user)) return null;

  const t = access.tier as AccessTier;
  const free = new Set(['basic_search', 'listing_read', 'registry_lookup', 'aircraft_photo', 'easa_ad_lookup', 'ati_quick_score', 'aviation_news', 'api_read']);
  const pro = new Set(['llm_models', 'mcp', 'advanced_intelligence', 'advanced_reports', 'valuation', 'market_report', 'listing_write', 'api_write']);
  const enterprise = new Set(['enterprise_api', 'full_intelligence', 'full_verification', 'integrations', 'white_label', 'contract_entitlement']);

  const allowed = t === 'T1' ? free.has(capability)
    : t === 'T2' ? (free.has(capability) || pro.has(capability))
    : (free.has(capability) || pro.has(capability) || enterprise.has(capability));

  if (!allowed) return Response.json({ error: 'Feature not available on current plan', capability, current_tier: t }, { status: 403 });
  return null;
}
