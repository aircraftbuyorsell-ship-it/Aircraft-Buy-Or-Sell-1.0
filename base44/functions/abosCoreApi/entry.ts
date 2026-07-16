import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VALID_SCOPES = ['listing:read', 'listing:write', 'search:read', 'intelligence:read'];

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

function maskRegistration(registration) {
  const value = String(registration || '').trim();
  if (!value) return null;
  return value.length <= 2 ? '•••' : `${value.slice(0, 1)}•••${value.slice(-1)}`;
}

function mapListing(l, includeRegistration = false) {
  return {
    id: l.id,
    registration: includeRegistration ? (l.registration || null) : maskRegistration(l.registration),
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
        matches: matches.slice(0, 20).map((listing) => mapListing(listing, caller.type === 'user')),
      });
    }

    // ═══════════════ VALUATION ═══════════════
    if (endpoint === 'valuate') {
      const scopeErr = requireScope('intelligence:read');
      if (scopeErr) return scopeErr;
      const { manufacturer, model } = params;
      if (!manufacturer || !model) return apiError(400, 'missing_aircraft', "'params.manufacturer' and 'params.model' are required.");

      const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the ABOS OMVM (Observed Market Value Model) aircraft valuation engine. Estimate the current fair market value in USD.

AIRCRAFT:
Manufacturer: ${manufacturer}
Model: ${model}
Year: ${params.year || 'unknown'}
Airframe hours: ${params.hours || 'unknown'}

Base your estimate on typical 2025-2026 market medians for this make/model/year class (Controller, Trade-A-Plane, VREF style comps). Be conservative and realistic — a Cessna 150 is ~$25-45k, a 2021 PC-12 NGX ~$5M, a 2018 Citation Latitude ~$7M.

Return ONLY valid JSON with: estimated_value (USD int), range_min, range_max, confidence (0-1), rationale (max 40 words).`,
        response_json_schema: {
          type: 'object',
          properties: {
            estimated_value: { type: 'number' },
            range_min: { type: 'number' },
            range_max: { type: 'number' },
            confidence: { type: 'number' },
            rationale: { type: 'string' },
          },
        },
      });

      await trackUsage();
      return apiSuccess({
        aircraft: { manufacturer, model, year: params.year || null, hours: params.hours || null },
        estimated_value: result.estimated_value,
        range: { min: result.range_min, max: result.range_max },
        currency: 'USD',
        confidence: result.confidence,
        rationale: result.rationale,
        model_version: 'omvm-llm-v1',
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
      return apiSuccess({ listing: mapListing(listing, caller.type === 'user') });
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
      return apiSuccess({ total: matches.length, listings: matches.slice(0, limit).map((listing) => mapListing(listing, caller.type === 'user')) });
    }

    if (endpoint === 'listings.create') {
      const scopeErr = requireScope('listing:write');
      if (scopeErr) return scopeErr;
      const { manufacturer, model } = params;
      if (!manufacturer || !model) return apiError(400, 'missing_aircraft', "'params.manufacturer' and 'params.model' are required.");
      const owners = await base44.asServiceRole.entities.User.filter({ email: caller.email });
      const ownerId = owners[0]?.id;
      const listing = await base44.asServiceRole.entities.AircraftListing.create({
        make: manufacturer,
        model,
        year: params.year || undefined,
        registration: params.registration || undefined,
        asking_price: params.price || undefined,
        currency: params.currency || 'USD',
        total_time: params.hours || undefined,
        status: 'draft',
        visibility: 'private',
        owner: ownerId || undefined,
        source_url: params.source_url || undefined,
      });
      await trackUsage();
      return apiSuccess({
        id: listing.id,
        status: 'draft',
        note: 'Listing created as draft. Review and activate it in the ABOS app.',
      });
    }

    return apiError(404, 'unknown_endpoint',
      "Unknown endpoint. Valid: search, valuate, intelligence.extract, listings.get, listings.list, listings.create, keys.create, keys.list, keys.revoke");
}