# Installation

## Before you start

You need:

- **Node.js 18 or newer** on the machine running the installer.
- **Your ABOS tenant API key**, issued in the Partner Portal. It looks like
  `abos_tenant_` followed by 48 hex characters, and is shown **once** at issue.
  If you no longer have it, ask ABOS to issue a replacement — keys are stored
  hashed and cannot be recovered.
- **A project with a server side.** See [Platform support](#platform-support).

## Running the installer

From the root of your project (the directory containing `package.json`):

```bash
node installer/bin/abos-install.mjs
```

The installer walks twelve steps and prints a live checklist:

```
✓ Welcome
✓ License activation
✓ Tenant identification
✓ Platform detection
▸ Configuration
○ Branding
○ Feature selection
○ ABOS Core connection
○ Health check
○ Install
○ Validation
○ Complete
```

### Non-interactive / CI

```bash
node installer/bin/abos-install.mjs --yes --key "$ABOS_TENANT_API_KEY"
```

### Options

| Option | Effect |
|---|---|
| `--key <key>` | Tenant API key. Also read from `ABOS_TENANT_API_KEY`. |
| `--dir <path>` | Project directory to install into (default: current directory) |
| `--platform <id>` | Force an adapter instead of detecting one |
| `--base-url <url>` | ABOS Core base URL |
| `--dry-run` | Print what would be written, write nothing |
| `--force` | Overwrite an existing ABOS installation |
| `--yes`, `-y` | Accept defaults without prompting |
| `--verbose` | Full error detail |
| `--help`, `-h` | Usage |

**Preview before committing to anything:**

```bash
node installer/bin/abos-install.mjs --dry-run --key "$ABOS_TENANT_API_KEY"
```

## What gets written

| File | Commit it? | Purpose |
|---|---|---|
| `abos.config.json` | Yes | Tenant id, branding, enabled features. Contains no secrets. |
| `<adapter path>` | Yes | Your server-side proxy to ABOS. Path depends on platform. |
| `.env.abos.example` | Yes | Template. Ships **empty** — you fill in the real key in `.env`. |

Your key is written to **none** of these.

## Platform support

The installer detects your stack and generates a matching adapter.

| Platform | Detected by | Adapter written to |
|---|---|---|
| Next.js (App Router) | `next` dependency + `app/` | `app/api/abos/route.js` |
| Next.js (Pages Router) | `next` dependency + `pages/` | `pages/api/abos.js` |
| Remix | `@remix-run/*` | `app/routes/api.abos.js` |
| Express / Node | `express` dependency | `abos/adapter.js` |
| Cloudflare Workers | a `wrangler.toml`/`.jsonc` file | `abos/worker-adapter.js` |
| Generic Node | fallback | `abos/adapter.js` |

Cloudflare Workers detection keys off the **presence of a wrangler config
file**, not a `wrangler` dependency — many projects carry wrangler as a
devDependency without deploying a Worker.

### If you use a static SPA (Vite, CRA, plain HTML)

The installer will **refuse to install** and explain why. This is intentional:
a browser-only project has nowhere safe to keep your API key, and generating a
client-side integration would expose it to every visitor.

You need a small backend. Any of these work:

- A single serverless function (Vercel, Netlify, Cloudflare Workers)
- An existing API server you already run
- A minimal Express app

Deploy one, run the installer there with `--platform`, then point your SPA at
that adapter URL:

```js
const abos = createBrowserClient({ adapterUrl: 'https://api.yoursite.com/abos' });
```

## After installing

**1. Set your key.**

```bash
cp .env.abos.example .env
# edit .env: ABOS_TENANT_API_KEY=abos_tenant_...
```

Cloudflare Workers use secrets rather than `.env`:

```bash
wrangler secret put ABOS_TENANT_API_KEY
```

**2. Confirm `.env` is gitignored.**

```bash
git check-ignore .env && echo "ignored — good" || echo "NOT IGNORED — fix this"
```

**3. Verify the connection.**

```bash
curl -X POST http://localhost:3000/api/abos \
  -H 'Content-Type: application/json' \
  -d '{"endpoint":"health"}'
```

Expect `{"status":"success","data":{"healthy":true,...}}`.

## Troubleshooting

Every installer failure names the step and the recovery action. The common
ones:

### "Invalid or revoked tenant API key"

The key was rejected. Check for a copy/paste truncation, confirm the license is
active in the Partner Portal, and confirm you're using a tenant key
(`abos_tenant_...`) rather than a personal ABOS key (`abos_live_...`).

### "License is not active"

Your key is valid but the license is `pending`, `suspended`, `expired` or
`revoked`. This is an account matter — contact ABOS.

### "abos.config.json already exists"

An ABOS integration is already installed. Re-run with `--force` to overwrite,
or delete the file first.

### "ABOS adapter is not configured: ABOS_TENANT_API_KEY is unset"

The adapter is deployed but can't see the key. Confirm `.env` is loaded by your
framework (Next.js and Remix load it automatically; plain Express needs
`dotenv`), that the variable name matches exactly, and that you **restarted**
after setting it. On Workers, confirm `wrangler secret list` shows it.

### "Endpoint not allowed by this adapter"

The generated adapter ships an allowlist so it can't be used as an open proxy
against your quota. To use an endpoint your license includes but the allowlist
omits, add it to `ALLOWED_ENDPOINTS` in the adapter.

### "Capability not included in this license"

Your license doesn't grant that capability. `whoami` returns what it does
grant:

```bash
curl -X POST http://localhost:3000/api/abos \
  -H 'Content-Type: application/json' -d '{"endpoint":"whoami"}'
```

### Features are missing from `abos.config.json`

The installer only enables capabilities your license actually grants, and says
so when it drops one. Enabling a feature you aren't licensed for would produce
an integration that fails in production instead of at install time.

## Upgrading

Re-run the installer from a newer package with `--force`. It overwrites
`abos.config.json`, the adapter and the env template — it does **not** touch
your `.env` or any code you wrote.

If you customized the generated adapter (extra allowlist entries, logging), note
those changes before upgrading and re-apply them after.
