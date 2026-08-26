// ABOS White-Label package builder.
//
// Produces the customer-specific archive described in the product brief:
//   generatePackage(tenantId, licenseId, version, platform)
//     -> ABOS-SkyDeals-Europe-v1.0.0.zip
//
// Two hard rules, both enforced by assertions here and by tests:
//
//  1. NO CREDENTIALS. A package is a file a customer downloads, stores, and
//     often commits. It contains no API key, no Stripe id, no secret. The
//     customer authenticates by pasting their key into the installer, which
//     puts it in their environment.
//
//  2. NO PROPRIETARY INTELLIGENCE. The package ships the distribution layer
//     (UI kit, SDK, adapters, config, docs) — never ATI/valuation scoring
//     logic. That stays server-side in ABOS Core, which is the entire
//     commercial basis of the product.

import { createZip, sha256, normalizeEntryPath } from './zip.mjs';

export const PACKAGE_FORMAT_VERSION = 1;

/** Files/dirs that must never be included, whatever a manifest says. */
const FORBIDDEN_PATH_PATTERNS = Object.freeze([
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)\.git(\/|$)/i,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)wrangler\.toml$/i,
  /\.pem$/i,
  /\.key$/i,
  /(^|\/)id_rsa/i,
]);

/** Content patterns that indicate a credential leaked into a package file. */
const CREDENTIAL_PATTERNS = Object.freeze([
  { pattern: /abos_tenant_[0-9a-f]{16}/, label: 'ABOS tenant API key' },
  { pattern: /abos_live_[0-9a-f]{16}/, label: 'ABOS user API key' },
  { pattern: /sk_(test|live)_[A-Za-z0-9]{10}/, label: 'Stripe secret key' },
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: 'private key' },
  { pattern: /\bghp_[A-Za-z0-9]{20}/, label: 'GitHub token' },
]);

/**
 * Server-side-only source paths. If any of these ever appear in a package
 * manifest it means proprietary logic is about to be shipped to a customer.
 */
const PROPRIETARY_PATH_PATTERNS = Object.freeze([
  /(^|\/)base44\/functions\//,
  /(^|\/)gateway\/src\//,
  /(^|\/)security-worker\//,
  /(^|\/)ati\.js$/,
  /(^|\/)omvm/i,
]);

export function packageFileName({ displayName, tenantId, version }) {
  // "SkyDeals Europe" -> "SkyDeals-Europe"; falls back to the tenant slug.
  const name = String(displayName || tenantId || 'Customer')
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const safeVersion = String(version || '0.0.0').replace(/^v/, '');
  return `ABOS-${name || 'Customer'}-v${safeVersion}.zip`;
}

/**
 * Validates every entry destined for a package. Throws on the first problem —
 * a package builder that "mostly" excludes credentials is not useful.
 */
export function assertPackageSafe(entries) {
  for (const entry of entries) {
    const entryPath = normalizeEntryPath(entry.path);

    for (const pattern of FORBIDDEN_PATH_PATTERNS) {
      if (pattern.test(entryPath)) {
        throw new Error(`Refusing to package '${entryPath}': matches a forbidden path pattern`);
      }
    }
    for (const pattern of PROPRIETARY_PATH_PATTERNS) {
      if (pattern.test(entryPath)) {
        throw new Error(`Refusing to package '${entryPath}': server-side proprietary logic must not ship to customers`);
      }
    }

    const contents = Buffer.isBuffer(entry.contents) ? entry.contents.toString('utf8') : String(entry.contents ?? '');
    for (const { pattern, label } of CREDENTIAL_PATTERNS) {
      if (pattern.test(contents)) {
        throw new Error(`Refusing to package '${entryPath}': contains what looks like a ${label}`);
      }
    }
  }
  return true;
}

/**
 * Builds the package manifest — the authoritative record of what a given
 * package contains, so a download can be audited after the fact.
 */
export function buildManifest({ tenantId, licenseId, version, platform, entries, builtAt }) {
  const files = entries
    .map((entry) => ({
      path: normalizeEntryPath(entry.path),
      sha256: sha256(Buffer.isBuffer(entry.contents) ? entry.contents : Buffer.from(String(entry.contents), 'utf8')),
      bytes: Buffer.byteLength(Buffer.isBuffer(entry.contents) ? entry.contents : String(entry.contents)),
    }))
    .sort((a, b) => (a.path < b.path ? -1 : 1));

  return {
    format_version: PACKAGE_FORMAT_VERSION,
    tenant_id: tenantId,
    license_id: licenseId,
    version: String(version).replace(/^v/, ''),
    platform,
    // Caller-supplied so a rebuild of a historical package reproduces its
    // bytes exactly. Defaults to epoch rather than now(), keeping the default
    // build deterministic.
    built_at: builtAt || '1980-01-01T00:00:00.000Z',
    file_count: files.length,
    files,
  };
}

/**
 * Generates a complete customer package.
 *
 * @returns {{fileName: string, buffer: Buffer, sha256: string, manifest: object}}
 */
export function generatePackage({ tenant, license, version, platform, entries, builtAt }) {
  if (!tenant?.tenant_id) throw new Error('generatePackage requires a tenant with a tenant_id');
  if (!license?.id) throw new Error('generatePackage requires a license with an id');
  if (!version) throw new Error('generatePackage requires a version');
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('generatePackage requires package entries');

  assertPackageSafe(entries);

  const manifest = buildManifest({
    tenantId: tenant.tenant_id,
    licenseId: license.id,
    version,
    platform,
    entries,
    builtAt,
  });

  const allEntries = [
    ...entries,
    { path: 'abos-package-manifest.json', contents: `${JSON.stringify(manifest, null, 2)}\n` },
  ];

  // Re-check with the manifest included — belt and braces, since the manifest
  // is generated from customer data.
  assertPackageSafe(allEntries);

  const buffer = createZip(allEntries);
  return {
    fileName: packageFileName({ displayName: tenant.display_name, tenantId: tenant.tenant_id, version }),
    buffer,
    sha256: sha256(buffer),
    manifest,
  };
}
