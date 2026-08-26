# Security

## The credential model

You hold one credential: a **tenant API key** (`abos_tenant_...`). It
authorizes API calls billed to your organization and scoped to your license.

It is a **server-side credential**. Treat it exactly as you would a database
password.

| Do | Don't |
|---|---|
| Store it in an environment variable or secret manager | Commit it, or paste it into a config file |
| Read it only in backend code | Prefix it `NEXT_PUBLIC_`/`VITE_`/`REACT_APP_` |
| Send it as the `x-abos-tenant-key` header | Put it in a URL or query string |
| Rotate it if it may have been exposed | Share one key across unrelated systems |

**Why never a URL:** query strings are recorded in browser history, proxy logs,
CDN logs and server access logs. A key in a URL should be assumed compromised.

## How the SDK enforces this

The credential boundary is structural, not advisory:

- **`createBrowserClient()`** has no parameter capable of accepting a
  credential. Passing one is ignored and never reaches the network.
- **`createServerClient()`** throws if it detects a browser environment. If a
  bundler pulls it into client code, you get a loud runtime failure instead of
  a silent leak.
- **Generated adapters** read the key from the environment only. The installer
  refuses to write a credential into any generated file, and re-checks each
  artifact before writing it.
- **Generated packages** are scanned at build time. A package containing
  anything key-shaped fails to build.

## Why your integration needs a server side

The installer refuses to install into a browser-only project. Any key shipped
to a browser is readable by every visitor — via devtools, view-source, or the
bundle itself. There is no obfuscation that changes this.

If you have no backend, deploy one small function. See
[INSTALLATION.md](INSTALLATION.md#if-you-use-a-static-spa-vite-cra-plain-html).

## Your adapter is a trust boundary

The generated adapter is a proxy that attaches your key to outbound requests.
Anyone who can reach it can spend your quota — within the limits it enforces.

It ships with an **endpoint allowlist** so it isn't an open proxy. Beyond that,
consider:

- **Authenticate your own users** before the adapter forwards anything, if your
  site has accounts. The adapter does not know who your users are.
- **Rate-limit per user**, not just in aggregate. ABOS rate-limits per tenant;
  that won't stop one abusive user consuming your whole quota.
- **Validate parameters** you pass through, especially anything user-supplied.
- **Don't log request bodies** to a destination where the key could appear —
  though the adapter never puts the key in a body.

## Server-side enforcement

Client-side checks are UX, never security. ABOS Core independently verifies, on
every request:

- the key is valid and not revoked
- the license is active and unexpired
- the tenant is active
- the license grants the requested capability
- the request is within rate limits

`abos.config.json`'s `enabled_features` exists so your UI can hide what you
aren't licensed for. Editing it grants nothing — the API is authoritative.

## Tenant isolation

Your key resolves to exactly one tenant, server-side, from the stored key
record. Tenant identity is never read from request data, so no request can
address another tenant's data by asserting a different id.

## If a key is exposed

Assume the worst and move fast:

1. **Revoke it** in the Partner Portal, or ask ABOS to revoke it. Revocation is
   immediate — the next request with that key fails.
2. **Issue a replacement** and deploy it to your environment/secrets.
3. **Purge the exposure**: rotate the secret in every environment, and if it was
   committed, remember that deleting the file does not remove it from git
   history — the key stays readable in the history until rotated.
4. **Ask ABOS for usage records** for the exposure window if you need to
   establish what was accessed.

Rotating the key is the fix. Removing the commit is cleanup.

## Verifying a package

Packages are deterministic — identical inputs produce a byte-identical archive.
So a checksum mismatch means the file is not what ABOS published.

```bash
sha256sum -c ABOS-YourCompany-v1.0.0.zip.sha256
```

`abos-package-manifest.json` inside the package carries a SHA-256 per file, so
tampering is detectable per-file rather than only in aggregate.

Only install packages obtained from your Partner Portal.

## What we don't ship you

Packages never contain ABOS server-side logic: ATI scoring, valuation, data
orchestration, entitlement enforcement. The package builder refuses to include
those paths. If you find server-side ABOS source in a package, that's a defect —
report it.

## Reporting a vulnerability

Report suspected vulnerabilities in the toolset — in this package or in ABOS
Core — through your Partner Portal support channel, or per the root
[SECURITY.md](../../SECURITY.md) policy. Please don't file security issues as
public GitHub issues.
