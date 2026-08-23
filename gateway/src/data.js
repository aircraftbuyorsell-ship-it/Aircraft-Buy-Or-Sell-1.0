// ABOS data handlers — the read surface that replaced the public entity MCP.
//
// base44/mcp/config.json used to serve AircraftListing, AircraftListingReview,
// AviationNewsItem and MarketForecast as unauthenticated `read` operations.
// Those are now []. The replacement path is: MCP client -> worker (Bearer) ->
// mcpDataBridge (gateway secret) -> service-role entity reads with a field
// allowlist. Nothing reachable without a token, and the allowlist lives in one
// file rather than being implied by whatever columns an entity happens to have.
//
// These handlers return plain objects, not Response — apl.js consumes them
// directly, and there is no REST route that needs a Response wrapper.

async function callBridge(env, baseUrl, payload) {
  // env.GATEWAY_SECRET || '' used to send an empty header on a missing
  // binding, which Base44 rejects the same way as a wrong value: a 401 with
  // no signal that the Worker itself is misconfigured. Fail loudly here
  // instead, before a request goes out at all.
  if (!env.GATEWAY_SECRET) {
    const err = new Error('gateway_secret_not_configured');
    err.status = 500;
    throw err;
  }

  const res = await fetch(`${baseUrl}/functions/mcpDataBridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-gateway-secret': env.GATEWAY_SECRET,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const err = new Error(`mcpDataBridge returned non-JSON (${res.status})`);
    err.status = res.status;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(parsed?.error || `mcpDataBridge failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return parsed;
}

export async function handleDealRadar(args = {}, env, baseUrl) {
  return callBridge(env, baseUrl, {
    op: 'deal_radar',
    make: args.make,
    model: args.model,
    status: args.status,
    min_year: args.min_year,
    max_year: args.max_year,
    min_price: args.min_price,
    max_price: args.max_price,
    min_ati_score: args.min_ati_score,
    min_discount_pct: args.min_discount_pct,
    sort: args.sort,
    limit: args.limit,
  });
}

export async function handleFaaRegistry(args = {}, env, baseUrl) {
  return callBridge(env, baseUrl, {
    op: 'faa_registry',
    registration: args.registration,
  });
}

export async function handlePartnerStatus(args = {}, env, baseUrl) {
  return callBridge(env, baseUrl, {
    op: 'partner_status',
    embed_token: args.embed_token,
  });
}
