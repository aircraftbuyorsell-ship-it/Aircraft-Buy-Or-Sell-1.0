import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.25.0';
import { resolveAccess, requireCapability } from '../_shared/accessControl.ts';

const VALID_SCOPES = ['listing:read', 'listing:write', 'search:read', 'intelligence:read', 'report:paid'];
const REPORT_CREDIT_PRICE_USD = 29;

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function apiError(status, code, message) {
  return Response.json({ status: 'error', error: { code, message } }, { status });
}

function apiSuccess(data) {
  return Response.json({ status: 'success', data });
}

function mapListing(l) {
  return {
    id: l.id,
    registration: l.registration || null,
    aircraft: { manufacturer: l.make, model: l.model, year: l.year || null },
    price: l.asking_price ? { value: l.asking_price, currency: l.currency || 'USD' } : null,
    location: null,
    status: l.status,
    intelligence: {
      ati_score: l.ati_score ?? null,
      omvm_value: l.omvm_value ?? null,
      deal_score: l.deal_score ?? null,
      deal_label: l.deal_label || null,
      discount_pct: l.discount_pct ?? null,
    },
    summary: l.ai_summary || null,
    photo_url: l.photo_url || null,
    created_at: l.created_date,
  };
}

const PLAN_LIMITS = {
  free: { rpm: 20, rpd: 500 },
  pro: { rpm: 300, rpd: 20000 },
  enterprise: { rpm: 10000, rpd: 1000000 },
};

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const ctx = {};
  let res;
  try {
    res = await handleRequest(req, ctx);
  } catch (error) {
    res = Response.json({ status: 'error', error: { code: 'internal_error', message: error.message } }, { status: 500 });
  }
  // ── Audit log — fire-and-forget, never breaks the response ──
  try {
    if (ctx.base44) {
      await ctx.base44.asServiceRole.entities.ApiRequestLog.create({
        request_id: requestId,
        endpoint: ctx.endpoint || 'unknown',
        caller_type: ctx.callerType || 'anonymous',
        api_key_id: ctx.apiKeyId || undefined,
        owner_email: ctx.email || undefined,
        status: res.status,
        duration_ms: Date.now() - started,
      });
    }
  } catch (_e) { /* audit logging must never fail the request */ }
  const headers = new Headers(res.headers);
  headers.set('X-Request-ID', requestId);
  return new Response(res.body, { status: res.status, headers });
});

async function handleRequest(req, ctx) {
    const base44 = createClientFromRequest(req);
    ctx.base44 = base44;
    let body = {};
    try { body = await req.json(); } catch (_e) { body = {}; }
    // API versioning: 'v1.' prefix is optional — v1 is the current contract.
    const endpoint = String(body.endpoint || '').replace(/^v1\./, '') || null;
    const params = body.params || {};
    ctx.endpoint = endpoint;
    if (!endpoint) return apiError(400, 'missing_endpoint', "Request body must include 'endpoint'.");

    // ── Resolve caller: API key (external) or logged-in user (in-app console) ──
    const apiKeyRaw = req.headers.get('x-abos-key') || body.api_key || null;
    let caller = null;
    if (apiKeyRaw) {
      const hash = await sha256(apiKeyRaw);
      const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: hash }, undefined, 1);
      const key = keys[0];
      if (!key) return apiError(401, 'invalid_api_key', 'Unknown API key.');
      if (key.status !== 'active') return apiError(401, 'api_key_revoked', 'This API key has been revoked.');
      if (key.expires_at && new Date(key.expires_at) < new Date()) {
        return apiError(401, 'api_key_expired', 'This API key has expired.');
      }
      caller = { type: 'api_key', key, scopes: key.scopes || [], email: key.owner_email };
    } else {
      let user = null;
      try { user = await base44.auth.me(); } catch (_e) { user = null; }
      if (!user) return apiError(401, 'unauthorized', 'Provide an x-abos-key header or authenticate as a user.');
      caller = { type: 'user', user, scopes: ['*'], email: user.email };

      // Central ABOS tier gate. Authorization is resolved server-side before any
      // endpoint data is read. Admin/super_admin are T3; normal users resolve
      // T1/T2/T3 from UserProfile. Frontend-supplied tier values are ignored.
      const access = await resolveAccess(req);
      if (!access.ok) return apiError(access.status, 'unauthorized', access.error || 'Unauthorized');
      ctx.access = access;
    }

    ctx.callerType = caller.type;
    ctx.email = caller.email;
    if (caller.type === 'api_key') ctx.apiKeyId = caller.key.id;

    // ── Rate limiting (API key callers, per plan) ──
    if (caller.type === 'api_key') {
      const plan = PLAN_LIMITS[caller.key.plan] || PLAN_LIMITS.free;
      const now = Date.now();
      let mStart = caller.key.rate_minute_start ? Date.parse(caller.key.rate_minute_start) : 0;
      let mCount = caller.key.rate_minute_count || 0;
      if (!mStart || now - mStart >= 60000) { mStart = now; mCount = 0; }
      let dStart = caller.key.rate_day_start ? Date.parse(caller.key.rate_day_start) : 0;
      let dCount = caller.key.rate_day_count || 0;
      if (!dStart || now - dStart >= 86400000) { dStart = now; dCount = 0; }
      if (mCount >= plan.rpm) {
        return apiError(429, 'rate_limited', `Rate limit exceeded: ${plan.rpm} requests/minute on the '${caller.key.plan || 'free'}' plan.`);
      }
      if (dCount >= plan.rpd) {
        return apiError(429, 'daily_limit_exceeded', `Daily limit exceeded: ${plan.rpd} requests/day on the '${caller.key.plan || 'free'}' plan.`);
      }
      caller.rate = { mStart, mCount, dStart, dCount };
    }

    const hasScope = (s) => caller.scopes.includes('*') || caller.scopes.includes(s);
    const capabilityForEndpoint = (ep) => {
      if (ep === 'search' || ep === 'listings.get' || ep === 'listings.list' || ep === 'whoami') return 'api_read';
      if (ep === 'listings.create') return 'api_write';
      if (ep === 'valuate') return 'valuation';
      if (ep === 'intelligence.extract') return 'llm_models';
      if (ep === 'report.get' || ep === 'report.checkout') return 'advanced_reports';
      return null;
    };
    const capability = capabilityForEndpoint(endpoint);
    if (capability) {
      if (caller.type === 'user') {
        const capErr = requireCapability(ctx.access, capability);
        if (capErr) return apiError(capErr.status, 'feature_not_available', `Feature '${capability}' is not available for the current plan.`);
      } else {
        const keyTier = caller.key.plan === 'enterprise' ? 'T3' : caller.key.plan === 'pro' ? 'T2' : 'T1';
        const keyAccess = { ok: true, tier: keyTier, user: null };
        const capErr = requireCapability(keyAccess, capability);
        if (capErr) return apiError(capErr.status, 'feature_not_available', `API key plan does not include '${capability}'.`);
      }
    }
    const requireScope = (s) => (hasScope(s) ? null : apiError(403, 'insufficient_scope', `This endpoint requires the '${s}' scope.`));

    const trackUsage = async () => {
      if (caller.type !== 'api_key') return;
      try {
        const r = caller.rate || { mStart: Date.now(), mCount: 0, dStart: Date.now(), dCount: 0 };
        await base44.asServiceRole.entities.ApiKey.update(caller.key.id, {
          request_count: (caller.key.request_count || 0) + 1,
          last_used_at: new Date().toISOString(),
          rate_minute_start: new Date(r.mStart).toISOString(),
          rate_minute_count: r.mCount + 1,
          rate_day_start: new Date(r.dStart).toISOString(),
          rate_day_count: r.dCount + 1,
        });
      } catch (_e) { /* usage tracking must never break the response */ }
    };

    // ═══════════════ WHOAMI — caller identity + granted scopes ═══════════════
    // The Cloudflare gateway calls this before running an APL-served tool.
    // Those tools execute with the gateway's own GATEWAY_SECRET, outside this
    // function's request path, so they cannot rely on the requireScope()
    // checks below — the gateway has to ask what the calling key is allowed
    // to do and enforce it itself. Returns no secrets: no key material, no
    // hash, no prefix.
    if (endpoint === 'whoami') {
      await trackUsage();
      return apiSuccess({
        caller_type: caller.type,
        email: caller.email,
        scopes: caller.scopes,
        plan: caller.type === 'api_key' ? (caller.key.plan || 'free') : (ctx.access?.tier || 'T1'),
        role: caller.type === 'user' ? (ctx.access?.role || 'user') : 'api_key',
        tier: caller.type === 'user' ? (ctx.access?.tier || 'T1') : null,
      });
    }

    // ═══════════════ KEY MANAGEMENT (user session only) ═══════════════
    if (endpoint === 'keys.create' || endpoint === 'keys.list' || endpoint === 'keys.revoke') {
      if (caller.type !== 'user') return apiError(403, 'user_session_required', 'API key management requires a logged-in user session.');
      const userEmail = caller.user.email;

      if (endpoint === 'keys.create') {
        const name = (params.name || '').trim();
        if (!name) return apiError(400, 'missing_name', "'params.name' is required.");
        const scopes = Array.isArray(params.scopes) && params.scopes.length
          ? params.scopes.filter((s) => VALID_SCOPES.includes(s))
          : ['listing:read', 'search:read', 'intelligence:read'];
        if (!scopes.length) return apiError(400, 'invalid_scopes', `Valid scopes: ${VALID_SCOPES.join(', ')}`);
        const bytes = crypto.getRandomValues(new Uint8Array(24));
        const secret = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
        const plaintext = `abos_live_${secret}`;
        const hash = await sha256(plaintext);
        let expiresAt = null;
        if (params.expires_days && Number(params.expires_days) > 0) {
          expiresAt = new Date(Date.now() + Number(params.expires_days) * 86400000).toISOString();
        }
        const record = await base44.asServiceRole.entities.ApiKey.create({
          owner_email: userEmail,
          name,
          key_prefix: plaintext.slice(0, 16) + '…',
          key_hash: hash,
          scopes,
          plan: 'free',
          status: 'active',
          expires_at: expiresAt || undefined,
          request_count: 0,
        });
        return apiSuccess({
          id: record.id,
          api_key: plaintext,
          key_prefix: record.key_prefix,
          scopes,
          expires_at: expiresAt,
          note: 'Store this key now — it is shown only once.',
        });
      }

      if (endpoint === 'keys.list') {
        const keys = await base44.asServiceRole.entities.ApiKey.filter({ owner_email: userEmail }, '-created_date', 50);
        return apiSuccess({
          keys: keys.map((k) => ({
            id: k.id, name: k.name, key_prefix: k.key_prefix, scopes: k.scopes || [],
            plan: k.plan || 'free',
            status: k.status, expires_at: k.expires_at || null,
            request_count: k.request_count || 0, last_used_at: k.last_used_at || null,
            created_at: k.created_date,
          })),
        });
      }

      // keys.revoke
      if (!params.id) return apiError(400, 'missing_id', "'params.id' is required.");
      const key = await base44.asServiceRole.entities.ApiKey.get(params.id);
      if (!key || (key.owner_email !== userEmail && caller.user.role !== 'admin')) {
        return apiError(404, 'key_not_found', 'API key not found.');
      }
      await base44.asServiceRole.entities.ApiKey.update(key.id, { status: 'revoked' });
      return apiSuccess({ id: key.id, status: 'revoked' });
    }

    // ═══════════════ SEARCH — chat-first natural language ═══════════════
    if (endpoint === 'search') {
      const scopeErr = requireScope('search:read');
      if (scopeErr) return scopeErr;
      const query = (params.query || '').trim();
      if (!query) return apiError(400, 'missing_query', "'params.query' is required (natural language search).");

      const intent = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the ABOS aviation search intent parser. Parse this aircraft marketplace query into structured filters.

QUERY: "${query}"

Rules:
- intent: BUY, SELL, VALUE, or INFO
- manufacturer: canonical manufacturer name if mentioned (Cessna, Piper, Pilatus, Beechcraft, Cirrus, Daher...), else null
- model: model name/number if mentioned (e.g. "Citation Latitude", "PC-12 NGX", "172"), else null
- budget_max: max budget as USD integer if mentioned (convert EUR ~1.1x), else null
- region: region/country if mentioned, else null

Return ONLY valid JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            intent: { type: 'string' },
            manufacturer: { type: ['string', 'null'] },
            model: { type: ['string', 'null'] },
            budget_max: { type: ['number', 'null'] },
            region: { type: ['string', 'null'] },
          },
        },
      });

      const all = await base44.asServiceRole.entities.AircraftListing.filter(
        { status: 'active', visibility: 'public' }, '-created_date', 200,
      );
      const q = (s) => (s || '').toString().toLowerCase();
      let matches = all;
      if (intent.manufacturer) matches = matches.filter((l) => q(l.make).includes(q(intent.manufacturer)));
      if (intent.model) {
        const tokens = q(intent.model).split(/[\s-]+/).filter(Boolean);
        matches = matches.filter((l) => {
          const hay = `${q(l.make)} ${q(l.model)}`;
          return tokens.some((t) => hay.includes(t));
        });
      }
      if (intent.budget_max) matches = matches.filter((l) => !l.asking_price || l.asking_price <= intent.budget_max);
      matches.sort((a, b) => (b.ati_score || 0) - (a.ati_score || 0));

      await trackUsage();
      return apiSuccess({
        query,
        intent,
        total_matches: matches.length,
        matches: matches.slice(0, 20).map(mapListing),
      });
    }

    // ═══════════════ VALUATION ═══════════════
    if (endpoint === 'valuate') {
      const scopeErr = requireScope('intelligence:read');
      if (scopeErr) return scopeErr;
      const { manufacturer, model } = params;
      if (!manufacturer || !model) return apiError(400, 'missing_aircraft', "'params.manufacturer' and 'params.model' are required.");

      // Delegate to the real OMVM v5 engine (log-linear depreciation curve
      // fit on actual AircraftListing comps + engine-wear adjustment + live
      // grounded web market search), instead of asking a bare LLM to guess a
      // number with zero data grounding. The bare-LLM approach is what
      // produced implausible values for edge cases (e.g. 1979 Cessna 172XP) —
      // an ungrounded model has nothing to anchor a numeric estimate to.
      let v5;
      try {
        // MUST be asServiceRole. abosCoreApi is the API-key surface: callers
        // authenticate with x-abos-key, which Base44 knows nothing about, so
        // the plain client carries no Base44 credentials and an internal
        // invoke through it cannot resolve the app — it fails with
        // "App not found". Every other data access in this function already
        // goes through asServiceRole; this one call was the exception, which
        // is why 'valuate' was the only broken endpoint on the whole surface.
        const v5res = await base44.asServiceRole.functions.invoke('omvmV5Score', {
          aircraft: {
            make: manufacturer,
            model,
            year: params.year || null,
            engine_hours: params.hours || null,
          },
        });
        v5 = v5res.data;
      } catch (v5err) {
        return apiError(502, 'valuation_engine_unavailable', `OMVM engine call failed: ${v5err.message}`);
      }

      await trackUsage();

      if (!v5 || v5.status === 'insufficient_comparables' || v5.omvm_value == null) {
        return apiSuccess({
          aircraft: { manufacturer, model, year: params.year || null, hours: params.hours || null },
          estimated_value: null,
          range: { min: null, max: null },
          currency: 'USD',
          confidence: null,
          rationale: v5?.message || 'No comparable listings and no live market data — not enough evidence for a defensible valuation.',
          model_version: 'omvm-v5',
        });
      }

      const spread = Math.round(v5.omvm_value * 0.15);
      return apiSuccess({
        aircraft: { manufacturer, model, year: params.year || null, hours: params.hours || null },
        estimated_value: v5.omvm_value,
        range: {
          min: v5.market_intelligence?.live_min_price ?? Math.max(0, v5.omvm_value - spread),
          max: v5.market_intelligence?.live_max_price ?? v5.omvm_value + spread,
        },
        currency: 'USD',
        confidence: typeof v5.confidence === 'string' ? v5.confidence.toLowerCase() : v5.confidence,
        rationale: v5.market_intelligence?.notes || `OMVM v5 comp-based valuation (${v5.comp_sample ?? 0} comparable listing(s), ${v5.confidence || 'unknown'} confidence).`,
        model_version: 'omvm-v5',
      });
    }

    // ═══════════════ INTELLIGENCE — free-text listing extraction ═══════════════
    if (endpoint === 'intelligence.extract') {
      const scopeErr = requireScope('intelligence:read');
      if (scopeErr) return scopeErr;
      const text = (params.text || '').trim();
      if (!text) return apiError(400, 'missing_text', "'params.text' is required.");

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the ABOS listing extraction engine. Extract structured aircraft listing data from this free-form text (e.g. a Facebook group post).

TEXT:
${text}

Return ONLY valid JSON with: intent (SELL/BUY/CHARTER/INFO), manufacturer, model, year, registration, price (number or null), currency (USD/EUR/GBP/CZK/CHF or null), location, hours (airframe total time or null), confidence (0-1). Use null for anything not present.`,
        response_json_schema: {
          type: 'object',
          properties: {
            intent: { type: 'string' },
            manufacturer: { type: ['string', 'null'] },
            model: { type: ['string', 'null'] },
            year: { type: ['number', 'null'] },
            registration: { type: ['string', 'null'] },
            price: { type: ['number', 'null'] },
            currency: { type: ['string', 'null'] },
            location: { type: ['string', 'null'] },
            hours: { type: ['number', 'null'] },
            confidence: { type: 'number' },
          },
        },
      });

      await trackUsage();
      return apiSuccess(result);
    }

    // ═══════════════ LISTINGS ═══════════════
    if (endpoint === 'listings.get') {
      const scopeErr = requireScope('listing:read');
      if (scopeErr) return scopeErr;
      if (!params.id) return apiError(400, 'missing_id', "'params.id' is required.");
      let listing = null;
      try { listing = await base44.asServiceRole.entities.AircraftListing.get(params.id); } catch (_e) { listing = null; }
      if (!listing || (listing.visibility !== 'public' && caller.type === 'api_key')) {
        return apiError(404, 'listing_not_found', 'Listing not found.');
      }
      await trackUsage();
      return apiSuccess({ listing: mapListing(listing) });
    }

    if (endpoint === 'listings.list') {
      const scopeErr = requireScope('listing:read');
      if (scopeErr) return scopeErr;
      const all = await base44.asServiceRole.entities.AircraftListing.filter(
        { status: 'active', visibility: 'public' }, '-created_date', 200,
      );
      const q = (s) => (s || '').toString().toLowerCase();
      let matches = all;
      if (params.manufacturer) matches = matches.filter((l) => q(l.make).includes(q(params.manufacturer)));
      if (params.model) matches = matches.filter((l) => q(l.model).includes(q(params.model)));
      if (params.max_price) matches = matches.filter((l) => !l.asking_price || l.asking_price <= Number(params.max_price));
      const limit = Math.min(Number(params.limit) || 20, 50);
      await trackUsage();
      return apiSuccess({ total: matches.length, listings: matches.slice(0, limit).map(mapListing) });
    }

    if (endpoint === 'listings.create') {
      const scopeErr = requireScope('listing:write');
      if (scopeErr) return scopeErr;
      const { manufacturer, model } = params;
      if (!manufacturer || !model) return apiError(400, 'missing_aircraft', "'params.manufacturer' and 'params.model' are required.");

      // ── Duplicate gate ────────────────────────────────────────────────
      // Registration is the aircraft identity key. Normalize before lookup so
      // n638lk / N638LK / " N638LK " cannot create separate listings.
      const normalizedRegistration = params.registration
        ? String(params.registration).trim().toUpperCase()
        : '';
      if (normalizedRegistration) {
        const existing = await base44.asServiceRole.entities.AircraftListing.filter(
          { registration: normalizedRegistration }, '-created_date', 10,
        );
        if (existing.length) {
          const canonical = existing[0];
          return apiError(409, 'duplicate_listing',
            `Aircraft ${normalizedRegistration} already has an ABOS listing (${canonical.id}). Update the existing listing instead of creating another.`);
        }
      }

      const owners = await base44.asServiceRole.entities.User.filter({ email: caller.email });
      const ownerId = owners[0]?.id;
      const listing = await base44.asServiceRole.entities.AircraftListing.create({
        make: manufacturer,
        model,
        year: params.year || undefined,
        asking_price: params.price || undefined,
        currency: params.currency || 'USD',
        total_time: params.hours || undefined,
        status: 'draft',
        visibility: 'private',
        owner: ownerId || undefined,
        source_url: params.source_url || undefined,
        registration: normalizedRegistration || undefined,
      });
      await trackUsage();
      return apiSuccess({
        id: listing.id,
        status: 'draft',
        note: 'Listing created as draft. Review and activate it in the ABOS app.',
      });
    }

    // ═══════════════ REPORT — API-key-native paid ATI Full Report ═══════════════
    // Two-step entitlement flow, distinct from the web app's subscription-tier
    // and email-funnel report systems (stripeWebhook / reportCheckout /
    // reportFulfill), neither of which an x-abos-key caller can reach:
    //   1) report.checkout — buy N credits, returns a Stripe Checkout URL.
    //      stripeWebhook grants them on 'checkout.session.completed' via
    //      metadata.type === 'report_credits' + metadata.api_key_id.
    //   2) report.get — spends 1 credit, returns the full 8-dimension report.
    //      No credits → structured payment_required, not a bare 403, so an
    //      agent can surface a checkout link instead of just failing.
    if (endpoint === 'report.checkout') {
      const scopeErr = requireScope('report:paid');
      if (scopeErr) return scopeErr;
      if (caller.type !== 'api_key') {
        return apiError(400, 'api_key_required', 'report.checkout is for API-key callers. Logged-in users buy reports in the ABOS app.');
      }
      const credits = Math.max(1, Math.min(100, Number(params.credits) || 1));
      let session;
      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          customer_email: caller.email || undefined,
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: REPORT_CREDIT_PRICE_USD * 100,
              product_data: {
                name: credits === 1 ? 'ABOS ATI Full Report credit' : `ABOS ATI Full Report credits (${credits})`,
                description: 'Redeemable via the ABOS API / MCP report.get endpoint.',
              },
            },
            quantity: credits,
          }],
          success_url: params.success_url || 'https://aircraftbuyorsell.com/api-credits?success=true',
          cancel_url: params.cancel_url || 'https://aircraftbuyorsell.com/api-credits?canceled=true',
          metadata: {
            type: 'report_credits',
            api_key_id: caller.key.id,
            credits: String(credits),
            owner_email: caller.email || '',
          },
        });
      } catch (err) {
        return apiError(502, 'checkout_unavailable', `Stripe checkout failed: ${err.message}`);
      }
      await trackUsage();
      return apiSuccess({
        checkout_url: session.url,
        credits,
        price_usd: REPORT_CREDIT_PRICE_USD * credits,
        note: 'Credits are granted automatically once payment completes. Call report.get after paying.',
      });
    }

    if (endpoint === 'report.get') {
      const scopeErr = requireScope('report:paid');
      if (scopeErr) return scopeErr;
      const aircraftData = (params.aircraft_data || '').trim();
      if (!aircraftData) return apiError(400, 'missing_aircraft_data', "'params.aircraft_data' is required (free-text listing / spec dump).");

      if (caller.type === 'api_key') {
        const remaining = caller.key.report_credits || 0;
        if (remaining <= 0) {
          return Response.json({
            status: 'payment_required',
            error: {
              code: 'no_report_credits',
              message: 'No ATI Full Report credits remaining. Call report.checkout to buy more.',
            },
            checkout_endpoint: 'report.checkout',
          }, { status: 402 });
        }
        // Decrement first — if scoring then fails, the credit is still spent
        // (matches how the email-funnel Stripe charge isn't refunded on a
        // downstream PDF/email failure either). Acceptable for v1; revisit if
        // scoring failure rate turns out to be non-trivial.
        await base44.asServiceRole.entities.ApiKey.update(caller.key.id, {
          report_credits: remaining - 1,
        });
      }

      let report;
      try {
        const res = await base44.asServiceRole.functions.invoke('atiReportScoreInternal', {
          aircraft_data: aircraftData,
          registration: params.registration || undefined,
        });
        report = res.data;
      } catch (err) {
        return apiError(502, 'report_generation_failed', `ATI report scoring failed: ${err.message}`);
      }
      if (report?.error) {
        return apiError(502, 'report_generation_failed', report.error);
      }

      await trackUsage();
      return apiSuccess({
        report,
        credits_remaining: caller.type === 'api_key' ? Math.max(0, (caller.key.report_credits || 0) - 1) : null,
      });
    }

    return apiError(404, 'unknown_endpoint',
      "Unknown endpoint. Valid: whoami, search, valuate, intelligence.extract, listings.get, listings.list, listings.create, report.checkout, report.get, keys.create, keys.list, keys.revoke");
}