# ABOS White-Label Toolset

Aircraft intelligence — ATI scoring, valuation, market data — rendered in your
brand, on your site.

This package contains everything you need to integrate: a UI kit, an SDK, a
server-side adapter for your platform, and an installer that wires them
together.

## What you get

| Component | Location in this package | Purpose |
|---|---|---|
| White-Label UI Kit | `ui/` | React components that render ABOS intelligence in your branding |
| SDK / API client | `ui/client.js` | Typed helpers for calling ABOS through your backend |
| Installer | `installer/` | Sets up config, branding and a server adapter for your stack |
| Tenant config | `tenant.json` | Your organization's branding and enabled features |
| Package manifest | `abos-package-manifest.json` | Per-file checksums for auditing this download |

## What ABOS keeps

ABOS Core remains authoritative for everything that produces a judgement:
ATI scoring, valuation (OMVM), report generation, data orchestration,
entitlement enforcement, rate limiting and audit. Those run on ABOS servers and
are not included in this package.

That split is deliberate and matters to you in one practical way: **your
integration always reflects current ABOS intelligence**, with no model or
scoring logic to update on your side.

## The 60-second version

```bash
# 1. Install (from the root of your project)
node installer/bin/abos-install.mjs

# 2. Put your key in the environment (never in code)
cp .env.abos.example .env
#   then edit .env and set ABOS_TENANT_API_KEY

# 3. Use the components
```

```jsx
import { TenantThemeProvider, AtiScoreCard, createBrowserClient } from './ui/index.js';
import tenant from './tenant.json';

const abos = createBrowserClient({ adapterUrl: '/api/abos' });

export default function AircraftPage({ registration }) {
  const [score, setScore] = useState(null);
  useEffect(() => {
    abos.atiScore({ registration }).then((r) => setScore(r.ati_score));
  }, [registration]);

  return (
    <TenantThemeProvider tenant={tenant}>
      <AtiScoreCard score={score} registration={registration} />
    </TenantThemeProvider>
  );
}
```

## The one security rule

**Your ABOS tenant API key is a server-side credential.** It authorizes calls
billed to your account. It belongs in an environment variable read only by your
backend adapter.

The SDK is built so this is hard to get wrong:

- `createBrowserClient()` has **no parameter that accepts a credential**. It
  calls your own backend, which attaches the key.
- `createServerClient()` holds the key and **throws if it detects a browser**,
  so a bundler pulling it into client code fails loudly rather than shipping
  your key to every visitor.

Never prefix the key with `NEXT_PUBLIC_`, `VITE_`, or any other public env
prefix. Never commit a filled-in `.env`.

See [SECURITY.md](SECURITY.md) for the full model.

## How requests flow

```
Your website (browser)
  └─ createBrowserClient()  ← no credential here
       │
       ▼
Your backend adapter        ← your ABOS key lives here, server-side only
       │
       ▼
ABOS Core API               ← verifies your license, enforces your capabilities
       │
       ▼
ATI / valuation / intelligence
```

## Documentation

- [INSTALLATION.md](INSTALLATION.md) — installer walkthrough, platform notes, troubleshooting
- [PARTNER-INTEGRATION.md](PARTNER-INTEGRATION.md) — components, SDK reference, theming
- [SECURITY.md](SECURITY.md) — credential handling, what to do if a key leaks

## Verifying this download

Every package ships `abos-package-manifest.json` with a SHA-256 for each file,
and the download is published alongside a `.sha256` checksum:

```bash
sha256sum -c ABOS-YourCompany-v1.0.0.zip.sha256
```

Package builds are deterministic: the same inputs always produce a
byte-identical archive, so a checksum that doesn't match means the file is not
what ABOS published.

## Support

Contact your ABOS representative, or the support address in your Partner
Portal. Include your `tenant_id` (in `tenant.json`) and, for install problems,
the full installer output — it names the failing step and the recovery action.
