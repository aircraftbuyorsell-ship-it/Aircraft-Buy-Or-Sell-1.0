# ABOS Core API RC preparation

The Core API remains a separate runtime boundary from the static frontend.

## RC preflight

Run this before starting an RC implementation or runtime deployment:

```bash
npm run core-api:preflight
npm test
```

The preflight verifies:

- the Core API and OpenAPI source files exist;
- the documented endpoint set is present in both sources;
- the frontend workflow deploys only `dist/` through Cloudflare Pages;
- Worker deployment commands are absent from the Pages workflow;
- the static guard still verifies `dist/index.html`.

This is a structural gate. It does not deploy the API, change Cloudflare bindings, or publish a public API.

## Runtime boundary

- Frontend: Cloudflare Pages, static `dist/`.
- Factory: local control-plane files, `do_not_deploy`.
- Core API: separate Base44/Deno function boundary under `base44/functions/abosCoreApi`.

The RC implementation must preserve this separation and add runtime changes in a dedicated follow-up PR.
