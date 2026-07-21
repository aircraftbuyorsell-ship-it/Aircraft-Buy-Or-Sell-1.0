# ABOS Core API Gateway

Cloudflare Worker that sits in front of `base44/functions/abosCoreApiV1` and is the only thing
allowed to hold `X-ABOS-Gateway-Secret`. See `architecture/AD-026-api-deployment-boundary.md` and
`docs/protocol/capabilities/aircraft-search/README.md` for why this exists.

## Status: written and tested, not deployed

- `src/worker.mjs` — the actual gateway logic (transport only: secret injection, path rewrite,
  CORS; no business logic — that all stays in `abosCoreApiV1`, already tested there).
- `test/worker.test.mjs` — 3 tests covering the request rewrite, GET/HEAD-without-body handling,
  and header stripping. `node --test gateway/test/worker.test.mjs` — all passing.
- `npx wrangler deploy --dry-run` bundles cleanly from this directory.
- **Not deployed.** Needs two things this repo doesn't have:
  1. **Working Cloudflare account access** — the Cloudflare MCP connector was intermittently
     unavailable in the session this was written in.
  2. **This app's actual Base44 base URL** (`https://<something>.base44.app`) — that's
     deployment-specific and isn't (and shouldn't be) committed to the repo.

## Deploying it for real

```bash
cd gateway
npx wrangler secret put GATEWAY_SECRET   # paste a long random value — must exactly match
                                          # ABOS_GATEWAY_SHARED_SECRET set on the Base44 side
                                          # for the abosCoreApiV1 function
npx wrangler deploy \
  --var BASE44_APP_BASE_URL:https://<your-app>.base44.app \
  --var CORS_ALLOWED_ORIGINS:https://aircraftbuyorsell.com
```

Then set `ABOS_GATEWAY_SHARED_SECRET` (same value as `GATEWAY_SECRET` above) and
`ABOS_CORS_ALLOWED_ORIGINS` as Base44 environment variables for the `abosCoreApiV1` function.
Also set `ABOS_PUBLIC_ID_SALT` (any long random value, used to derive opaque `lst_`/`ac_` IDs —
see `base44/functions/abosCoreApiV1/entry.ts`) if it isn't already.

Once deployed, point a real domain/route at the Worker (`gateway/wrangler.toml` has a commented
example for `api.abos.group`), and `sdk/js/abosCoreApiClient.mjs` becomes callable from anywhere
with `baseUrl` pointed at that domain — no more gateway-secret requirement for external callers,
since the Worker holds it instead of them.

## Why a separate Worker instead of extending the existing CF Pages deploy

`.github/workflows/deploy-cloudflare-pages.yml` (branch `fix/cloudflare-pages-deployment-v2`,
unmerged) explicitly guards against deploying Workers through that pipeline — it's Pages-only by
design. This gateway is deployed independently via `wrangler deploy` from this directory, not
through that workflow.
