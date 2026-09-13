# ABOS White-Label — Changelog

All notable changes to the customer-facing package. Versions follow semver;
the package version is stamped in `abos-package-manifest.json`.

## 1.0.0 — 2026-09-13

First general-availability release of the installation pack.

### Included
- **UI Kit** (`ui/`): `TenantThemeProvider`, `AtiScoreCard`,
  `AircraftIntelligenceCard`, theme helpers with WCAG contrast resolution.
- **SDK** (`ui/client.js`): `createBrowserClient()` (credential-free) and
  `createServerClient()` (refuses to run in a browser).
- **Installer** (`installer/`): 12-step guided CLI, `npx abos-install`,
  non-interactive `--yes --key` mode, `--dry-run`, platform detection for
  Next.js (App/Pages), Remix, Express, Cloudflare Workers, generic Node;
  refuses static SPAs.
- **Adapters**: server-side proxy with endpoint allowlist; the tenant key is
  read from `ABOS_TENANT_API_KEY` only.
- **Docs**: README, INSTALLATION, PARTNER-INTEGRATION, SECURITY,
  THREAT-MODEL, LICENSE-AGREEMENT, this CHANGELOG.
- **Integrity**: deterministic archive, per-file SHA-256 manifest, published
  `.sha256` checksum.

### Security guarantees
- No credential is ever written to a generated file; the installer and the
  packager both abort if anything key-shaped is detected.
- No ATI / OMVM scoring logic ships in the package; it stays in ABOS Core.