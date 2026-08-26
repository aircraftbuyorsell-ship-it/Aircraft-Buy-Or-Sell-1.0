# Partner Integration Guide

Reference for the White-Label UI Kit and SDK. Assumes you've run the installer
([INSTALLATION.md](INSTALLATION.md)).

## Theming

Wrap anything ABOS in a `TenantThemeProvider`. It reads your `tenant.json` and
applies your branding as scoped CSS variables.

```jsx
import { TenantThemeProvider } from './ui/index.js';
import tenant from './tenant.json';

<TenantThemeProvider tenant={tenant}>
  {/* ABOS components here */}
</TenantThemeProvider>
```

Tokens are applied to a wrapper element, not `:root`, so an embedded ABOS
component can't bleed styles into your page or be broken by yours.

### Configurable

| Key | Meaning | Default |
|---|---|---|
| `brand_name` | Name shown in component chrome | `display_name` |
| `logo_url` | Logo URL — **http(s) only** | none |
| `primary_color` | Hex accent color | `#0EA5E9` |
| `mode` | `light` or `dark` | `light` |
| `font_family` | CSS font stack | Inter + system stack |
| `radius` | CSS border radius | `0.75rem` |

Invalid values fall back to defaults rather than propagating — a malformed
color won't produce a broken page, and a `javascript:` logo URL is dropped.

### Derived, not configurable

**Foreground color** is computed from your brand color by WCAG contrast, so no
brand choice can produce illegible text.

**Score band colors** (Excellent / Good / Fair / Poor) are fixed. An ATI score
must read identically across every deployment — a tenant able to recolor "Poor"
to green would be misrepresenting ABOS's assessment to a buyer.

### Overriding styles

Every token is namespaced `--abos-wl-*`. Override them on a wrapper:

```css
.my-abos-wrapper { --abos-wl-radius: 0; --abos-wl-surface: #fafafa; }
```

## Components

### `<AtiScoreCard>`

```jsx
<AtiScoreCard score={82} registration="N123AB" />
```

| Prop | Type | Notes |
|---|---|---|
| `score` | number \| null | 0–100. `null`/absent renders "—", not 0. |
| `registration` | string | Optional tail number |
| `attribution` | string | Default `"Powered by ABOS ATI"` |
| `className` | string | Extra classes on the container |

An unscored aircraft renders an explicit em dash and "not scored" — never a
zero, which would read as a terrible score rather than a missing one.

### `<AircraftIntelligenceCard>`

```jsx
<AircraftIntelligenceCard listing={listing} onSelect={(l) => router.push(`/aircraft/${l.id}`)} />
```

| Prop | Type | Notes |
|---|---|---|
| `listing` | object | A listing in ABOS Core API v1 shape |
| `onSelect` | function | Optional. Makes the card keyboard-accessible. |

Every intelligence field is optional and renders "—" when absent.

### Attribution

Components carry a visible ABOS attribution. White-labelling covers
presentation, not provenance: a buyer relying on an aircraft assessment is
entitled to know whose assessment it is. Don't remove it.

## SDK

### Browser

```js
import { createBrowserClient } from './ui/index.js';
const abos = createBrowserClient({ adapterUrl: '/api/abos' });
```

Calls your backend adapter. **Cannot** hold a credential.

### Server

```js
import { createServerClient } from './ui/index.js';
const abos = createServerClient({
  apiKey: process.env.ABOS_TENANT_API_KEY,
  baseUrl: process.env.ABOS_BASE_URL,
});
```

Holds your key. Throws if it runs in a browser.

### Methods

Both clients expose the same surface:

| Method | Endpoint | Capability |
|---|---|---|
| `health()` | `health` | — |
| `whoami()` | `whoami` | — |
| `search(params)` | `search` | `search` |
| `listListings(params)` | `listings.list` | `search` |
| `getListing(id)` | `listings.get` | `search` |
| `atiScore(params)` | `ati.score` | `ati_score` |
| `valuate(params)` | `valuate` | `valuation` |
| `call('ati.report', params)` | `ati.report` | `ati_basic_report` |
| `call('ati.report.pro', params)` | `ati.report.pro` | `ati_pro_report` |
| `call(endpoint, params)` | any allowlisted | varies |

### ATI reports

`ati.report` takes `params.aircraft_data` — a free-text listing or spec dump —
and optionally `params.registration`. It returns the assessment: total score,
rating band, per-dimension scores, executive summary, extracted spec table and
OMVM range.

`ati.report.pro` returns the same assessment plus ABOS's reasoning: each
dimension's justification, strengths, risks and missing data, and the
recommendations. The score itself is identical between tiers — the tier
changes how much analysis you receive, never the assessment.

Report generation is LLM-backed and considerably slower and costlier than the
other endpoints. It is billed through your plan rather than per report, so
your licence's rate limit is what bounds it — budget for that when calling it
on a user-facing path.

### Errors

Failures throw `AbosApiError`:

```js
import { AbosApiError } from './ui/index.js';

try {
  await abos.valuate({ registration: 'N123AB' });
} catch (error) {
  if (error instanceof AbosApiError) {
    // error.status  → HTTP status
    // error.code    → machine-readable code
    // error.endpoint→ which call failed
  }
}
```

| Status | Code | Meaning |
|---|---|---|
| 401 | `unauthorized` | Key invalid/revoked, or adapter unconfigured |
| 403 | `capability_not_licensed` | Your license doesn't grant it |
| 404 | `unknown_endpoint` | Not a real endpoint |
| 429 | `rate_limited` | Slow down |
| 501 | `not_implemented` | Licensed but not yet available |
| 502 | `bad_gateway` | ABOS unreachable or unreadable |

**Handle 403 as a product state, not a bug.** It means the customer isn't
licensed for that feature — hide it, or offer an upgrade path.

### Checking capabilities

```js
const { license } = await abos.whoami();
if (license.allowed_capabilities.includes('valuation')) {
  // render valuation UI
}
```

Use this for UX only. The API enforces capabilities regardless of what your UI
does — as it must, since client-side checks can be bypassed.

## Adding an endpoint

The generated adapter has an `ALLOWED_ENDPOINTS` allowlist so it can't be used
as an open proxy against your quota. To use an endpoint your license includes:

```js
const ALLOWED_ENDPOINTS = new Set([
  'health', 'whoami', 'search', 'listings.list', 'listings.get',
  'ati.score', 'valuate',
  'intelligence.market',   // added
]);
```

Note this change — re-running the installer with `--force` regenerates the
adapter.

## Multiple tenants

If you operate several brands, keep one tenant config per brand and select at
render time:

```jsx
<TenantThemeProvider tenant={tenantConfigs[brandId]}>
```

Each tenant needs its own license and key from ABOS. One key cannot serve
multiple tenants — it resolves server-side to exactly one.

## Production checklist

- [ ] `.env` gitignored; key set in your hosting platform's secrets
- [ ] `health` returns success from your deployed adapter
- [ ] Your own auth runs before the adapter forwards (if you have accounts)
- [ ] Per-user rate limiting in front of the adapter
- [ ] 403s handled as a product state
- [ ] Absent scores/valuations render as "—", verified with real sparse data
- [ ] ABOS attribution visible
- [ ] Package checksum verified before install
