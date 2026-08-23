import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * mcpDataBridge — read-only data surface for the Cloudflare MCP gateway.
 *
 * Why this exists
 * ---------------
 * The app's native MCP endpoint (base44/mcp/config.json) used to expose
 * AircraftListing, AircraftListingReview, AviationNewsItem and MarketForecast
 * as public `read` operations with "auth": "none". That endpoint sits BESIDE
 * the Cloudflare worker, not behind it, so the worker's Bearer token protected
 * nothing — anyone with the URL could bulk-export the inventory and the
 * proprietary MarketForecast IP in structured form.
 *
 * Those operations are now []. Everything a caller legitimately needs comes
 * through here instead: one auth check, one service-role client, one place
 * where the field allowlists live. Same consolidation principle applied to
 * OMVM in v5.1 — one implementation, not two.
 *
 * Auth: gateway secret only (the omvmV5Score pattern). No user session path,
 * because every caller is a machine arriving via the worker.
 *
 * Body: { op: 'deal_radar' | 'faa_registry' | 'partner_status', ...params }
 */

// Constant-time comparison via SHA-256 of both sides, so neither the secret's
// contents nor its length leak through response timing.
async function timingSafeEqual(a: string | null, b: string | null): Promise<boolean> {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const va = new Uint8Array(ha), vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

// ── Field allowlists ───────────────────────────────────────────────────
// Allowlist, never denylist. A denylist leaks every field added later.

// `owner` is deliberately absent. It identifies the seller, and this data
// leaves the platform to third-party MCP clients — including, potentially,
// competitors. Omitting it keeps this a market-data surface rather than a
// lead list, and keeps it outside GDPR personal-data scope.
function mapListing(l: any) {
  return {
    id: l.id,
    registration: l.registration || null,
    make: l.make || null,
    model: l.model || null,
    year: l.year ?? null,
    total_time: l.total_time ?? null,
    engine_hours: l.engine_hours ?? null,
    tbo: l.tbo ?? null,
    asking_price: l.asking_price ?? null,
    currency: l.currency || 'USD',
    status: l.status || null,
    ati_score: l.ati_score ?? null,
    omvm_value: l.omvm_value ?? null,
    deal_score: l.deal_score ?? null,
    deal_label: l.deal_label || null,
    discount_pct: l.discount_pct ?? null,
    photo_url: l.photo_url || null,
    created_at: l.created_date,
  };
}

// FAA registry data is public record, so registrant name/city/state are not
// withheld here — but they are the reason this op is rate-limited upstream and
// capped at a single tail number per call rather than offered as a bulk export.
function mapFaa(a: any) {
  return {
    n_number: a.n_number || null,
    serial_number: a.serial_number || null,
    make: a.make || null,
    model: a.model || null,
    year_mfr: a.year_mfr ?? null,
    mfr_mdl_code: a.mfr_mdl_code || null,
    type_aircraft: a.type_aircraft || null,
    type_engine: a.type_engine || null,
    engine_mfr: a.engine_mfr || null,
    engine_model: a.engine_model || null,
    horsepower: a.horsepower ?? null,
    thrust: a.thrust ?? null,
    mode_s_hex: a.mode_s_hex || null,
    status_code: a.status_code || null,
    type_registrant: a.type_registrant || null,
    registrant_name: a.name || null,
    registrant_state: a.state || null,
    registrant_country: a.country || null,
    fract_owner: a.fract_owner || null,
    cert_issue_date: a.cert_issue_date || null,
    air_worth_date: a.air_worth_date || null,
    expiration_date: a.expiration_date || null,
    last_action_date: a.last_action_date || null,
  };
}

// ── deal_radar ─────────────────────────────────────────────────────────

async function opDealRadar(base44: any, p: any) {
  const limit = Math.min(Math.max(Number(p.limit) || 25, 1), 100);

  const filter: Record<string, unknown> = {};
  if (p.make) filter.make = p.make;
  if (p.model) filter.model = p.model;

  // Only listings the platform itself treats as publicly visible. Without this
  // the op would happily serve drafts and withdrawn inventory.
  filter.status = p.status || 'active';
  filter.visibility = 'public';

  // Over-fetch, then narrow in memory — the numeric predicates below are ranges
  // and the entity filter only does equality.
  const rows = await base44.asServiceRole.entities.AircraftListing.filter(
    filter,
    p.sort || '-created_date',
    500
  );

  const minYear = Number(p.min_year) || null;
  const maxYear = Number(p.max_year) || null;
  const minPrice = Number(p.min_price) || null;
  const maxPrice = Number(p.max_price) || null;
  const minAti = Number(p.min_ati_score) || null;
  const minDiscount = Number(p.min_discount_pct) || null;

  const matched = rows.filter((r: any) => {
    if (minYear && Number(r.year) < minYear) return false;
    if (maxYear && Number(r.year) > maxYear) return false;
    if (minPrice && Number(r.asking_price) < minPrice) return false;
    if (maxPrice && Number(r.asking_price) > maxPrice) return false;
    if (minAti && Number(r.ati_score ?? 0) < minAti) return false;
    if (minDiscount && Number(r.discount_pct ?? 0) < minDiscount) return false;
    return true;
  });

  return {
    op: 'deal_radar',
    total_matched: matched.length,
    returned: Math.min(matched.length, limit),
    truncated: matched.length > limit,
    listings: matched.slice(0, limit).map(mapListing),
    provenance: {
      sources: [{ source: 'abos_listings', label: 'ABOS AircraftListing', redistributable: true }],
      note: 'Seller identity omitted by design; this is market data, not a lead list.',
    },
  };
}

// ── faa_registry ───────────────────────────────────────────────────────

async function opFaaRegistry(base44: any, p: any) {
  const raw = String(p.registration || '').trim().toUpperCase();
  if (!raw) return { error: 'registration required' };

  // US N-numbers are stored without the N prefix.
  const nNumber = raw.replace(/^N/, '').replace(/[^A-Z0-9]/g, '');
  if (!nNumber) return { error: 'registration must be a US N-number' };

  const [aircraftRows, docRows] = await Promise.all([
    base44.asServiceRole.entities.FAAAircraft.filter({ n_number: nNumber }, '-created_date', 1),
    base44.asServiceRole.entities.FAADocIndex.filter({ n_number: nNumber }, '-created_date', 1),
  ]);

  const aircraft = aircraftRows[0] || null;
  const docs = docRows[0] || null;

  // Transaction signals. A bill-of-sale count above one means the airframe has
  // changed hands more than once on record; security-agreement filings that
  // have never been released indicate an outstanding lien. Both are things a
  // buyer would otherwise only find during a title search.
  const bos = Number(docs?.bos_count ?? 0);
  const sa = Number(docs?.sa_count ?? 0);
  const rel = Number(docs?.rel_count ?? 0);
  const openLiens = Math.max(sa - rel, 0);

  const signals = {
    total_documents: Number(docs?.total_docs ?? 0),
    bill_of_sale_count: bos,
    security_agreement_count: sa,
    release_count: rel,
    open_liens: openLiens,
    lien_status: !docs ? 'unknown' : openLiens > 0 ? 'encumbered' : 'clear_on_record',
    ownership_changes_on_record: Math.max(bos - 1, 0),
    latest_filing: docs?.latest_filing || null,
    registration_expired:
      aircraft?.expiration_date && !Number.isNaN(Date.parse(aircraft.expiration_date))
        ? Date.parse(aircraft.expiration_date) < Date.now()
        : null,
  };

  // Dealer presence in the registrant's state. Useful context for who is likely
  // moving the aircraft; not a contact list, so it returns counts and names only.
  let dealers: any[] = [];
  if (aircraft?.state) {
    try {
      const rows = await base44.asServiceRole.entities.DealerLocation.filter(
        { state: aircraft.state },
        '-created_date',
        10
      );
      dealers = rows.map((d: any) => ({ name: d.name || null, city: d.city || null, state: d.state || null }));
    } catch (_e) {
      dealers = [];
    }
  }

  return {
    op: 'faa_registry',
    found: !!aircraft,
    registration: `N${nNumber}`,
    aircraft: aircraft ? mapFaa(aircraft) : null,
    transaction_signals: docs || aircraft ? signals : null,
    area_dealers: dealers,
    provenance: {
      sources: [
        { source: 'faa_acftref', label: 'FAA Aircraft Registry (public record)', redistributable: true },
        { source: 'faa_docindex', label: 'FAA Document Index (public record)', redistributable: true },
      ],
      note: docs ? null : 'No DOCINDEX row for this tail — transaction signals are unproven, not clear.',
    },
  };
}

// ── partner_status ─────────────────────────────────────────────────────

async function opPartnerStatus(base44: any, p: any) {
  const embedToken = String(p.embed_token || '').trim();
  if (!embedToken) return { error: 'embed_token required' };

  // Scoped by the caller's own token — never a listing. A partner proves which
  // record they may see by presenting the token that record is keyed on.
  const rows = await base44.asServiceRole.entities.PartnerConfig.filter(
    { embed_token: embedToken },
    '-created_date',
    1
  );
  if (rows.length === 0) return { error: 'invalid embed_token' };
  const partner = rows[0];

  // embed_token and stripe_connect_id are never echoed back. The caller already
  // holds the token, and the Stripe account ID is not theirs to receive here.
  return {
    op: 'partner_status',
    partner: {
      partner_name: partner.partner_name || null,
      brand_name: partner.brand_name || null,
      is_active: partner.is_active === true,
      allowed_domains: Array.isArray(partner.allowed_domains) ? partner.allowed_domains : [],
      allowed_steps: Array.isArray(partner.allowed_steps) ? partner.allowed_steps : [],
      allowed_payment_methods: Array.isArray(partner.allowed_payment_methods)
        ? partner.allowed_payment_methods
        : [],
      languages: Array.isArray(partner.languages) ? partner.languages : [],
      default_language: partner.default_language || null,
      widget_height: partner.widget_height ?? null,
      primary_color: partner.primary_color || null,
      logo_url: partner.logo_url || null,
    },
    revenue: {
      revenue_share_pct: partner.revenue_share_pct ?? null,
      total_volume: partner.total_volume ?? 0,
      total_transactions: partner.total_transactions ?? 0,
      revenue_share_owed: partner.revenue_share_owed ?? 0,
      total_paid_out: partner.total_paid_out ?? 0,
      payout_configured: !!partner.stripe_connect_id,
    },
    // An inactive partner or one with no domain lock is a live misconfiguration,
    // so it is surfaced rather than left for the partner to discover in traffic.
    warnings: [
      partner.is_active === true ? null : 'partner is inactive — widget calls will be rejected',
      Array.isArray(partner.allowed_domains) && partner.allowed_domains.length > 0
        ? null
        : 'no allowed_domains configured — origin lock fails open',
      partner.stripe_connect_id ? null : 'no Stripe Connect account — payouts cannot settle',
    ].filter(Boolean),
  };
}

const OPS: Record<string, (b: any, p: any) => Promise<any>> = {
  deal_radar: opDealRadar,
  faa_registry: opFaaRegistry,
  partner_status: opPartnerStatus,
};

Deno.serve(async (req) => {
  try {
    const expected = Deno.env.get('GATEWAY_SECRET') ?? null;
    if (!expected) {
      // Fail closed. This function has no user-session path, so without a
      // configured secret there is no way to authorise anyone — and defaulting
      // to open is exactly the mistake this file was written to undo.
      return Response.json({ error: 'gateway_secret_not_configured' }, { status: 503 });
    }
    if (!(await timingSafeEqual(req.headers.get('x-gateway-secret'), expected))) {
      return Response.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const handler = OPS[String(body.op || '')];
    if (!handler) {
      return Response.json(
        { error: 'unknown_op', supported: Object.keys(OPS) },
        { status: 400 }
      );
    }

    const base44 = createClientFromRequest(req);
    const result = await handler(base44, body);
    if (result?.error) return Response.json(result, { status: 400 });
    return Response.json(result);
  } catch (error) {
    console.error('mcpDataBridge error:', error);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
});
