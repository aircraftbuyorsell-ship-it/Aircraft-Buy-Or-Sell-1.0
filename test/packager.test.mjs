import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createZip, crc32, sha256, normalizeEntryPath } from "../packager/lib/zip.mjs";
import {
  generatePackage,
  buildManifest,
  assertPackageSafe,
  packageFileName,
} from "../packager/lib/build.mjs";

const execFileAsync = promisify(execFile);

const TENANT = { tenant_id: "skydeals_europe", display_name: "SkyDeals Europe" };
const LICENSE = { id: "lic_123", plan: "professional" };
const ENTRIES = [
  { path: "README.md", contents: "# ABOS White-Label\n" },
  { path: "sdk/client.js", contents: "export const x = 1;\n" },
  { path: "config/abos.config.json", contents: '{"tenant_id":"skydeals_europe"}\n' },
];

// ── Zip correctness ────────────────────────────────────────────────────────

test("crc32 matches known reference values", () => {
  // Well-known CRC-32 check values.
  assert.equal(crc32(Buffer.from("")), 0);
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
  assert.equal(crc32(Buffer.from("The quick brown fox jumps over the lazy dog")), 0x414fa339);
});

test("generated zip has a valid structure and correct entry count", () => {
  const zip = createZip(ENTRIES);
  assert.equal(zip.readUInt32LE(0), 0x04034b50, "must start with a local file header");

  // Locate the end-of-central-directory record at the tail.
  const eocdOffset = zip.length - 22;
  assert.equal(zip.readUInt32LE(eocdOffset), 0x06054b50, "must end with an EOCD record");
  assert.equal(zip.readUInt16LE(eocdOffset + 10), ENTRIES.length, "EOCD entry count must match");
});

test("zip output is byte-for-byte deterministic across runs", () => {
  const first = createZip(ENTRIES);
  const second = createZip(ENTRIES);
  assert.deepEqual(first, second);
  assert.equal(sha256(first), sha256(second));

  // Input order must not affect output — entries are sorted internally.
  const shuffled = createZip([ENTRIES[2], ENTRIES[0], ENTRIES[1]]);
  assert.equal(
    sha256(shuffled),
    sha256(first),
    "the same file set in a different order must produce an identical archive",
  );
});

test("zip embeds no wall-clock timestamp", () => {
  // If the writer used Date.now(), two archives built moments apart would
  // differ. This is what makes a published package checksum meaningful.
  const a = createZip([{ path: "a.txt", contents: "hello" }]);
  const b = createZip([{ path: "a.txt", contents: "hello" }]);
  assert.equal(sha256(a), sha256(b));
  // DOS date field of the first local header should be the fixed 1980 value.
  assert.equal(a.readUInt16LE(12), 0x0021);
  assert.equal(a.readUInt16LE(10), 0);
});

test("the real unzip tool can read and verify the archive", async (t) => {
  // Hand-rolled zip writers are exactly the kind of thing that passes its own
  // tests and produces archives nothing else can open, so verify against the
  // system unzip rather than only against our own parser.
  const dir = await mkdtemp(path.join(tmpdir(), "abos-zip-"));
  t.after(() => rm(dir, { recursive: true, force: true }));

  const zipPath = path.join(dir, "test.zip");
  await writeFile(zipPath, createZip(ENTRIES));

  try {
    await execFileAsync("unzip", ["-t", zipPath]);
  } catch (error) {
    if (error.code === "ENOENT") return t.skip("unzip not available in this environment");
    throw new Error(`unzip -t rejected the archive: ${error.stdout || error.message}`);
  }

  const extractDir = path.join(dir, "out");
  await execFileAsync("unzip", ["-q", zipPath, "-d", extractDir]);
  const top = (await readdir(extractDir)).sort();
  assert.deepEqual(top, ["README.md", "config", "sdk"]);
});

test("zip rejects path traversal, absolute paths and duplicates", () => {
  assert.throws(() => normalizeEntryPath("../../etc/passwd"), /traverse upwards/);
  assert.throws(() => normalizeEntryPath("/etc/passwd"), /must be relative/);
  assert.throws(() => normalizeEntryPath("C:/windows/system32"), /must not be absolute/);
  assert.throws(() => normalizeEntryPath(""), /empty path/);
  assert.throws(() => normalizeEntryPath("a//b"), /empty segment/);

  // Windows separators are normalized rather than rejected.
  assert.equal(normalizeEntryPath("sdk\\client.js"), "sdk/client.js");
  assert.equal(normalizeEntryPath("./README.md"), "README.md");

  assert.throws(
    () => createZip([{ path: "a.txt", contents: "1" }, { path: "./a.txt", contents: "2" }]),
    /Duplicate entry/,
  );
  assert.throws(() => createZip([]), /at least one entry/);
});

// ── Package safety ─────────────────────────────────────────────────────────

test("assertPackageSafe refuses anything credential-shaped", () => {
  const cases = [
    { contents: `const k = "abos_tenant_${"a".repeat(48)}";`, label: /tenant API key/ },
    { contents: `const k = "abos_live_${"b".repeat(24)}";`, label: /user API key/ },
    { contents: 'const k = "sk_live_abcdefghijklmno";', label: /Stripe secret key/ },
    { contents: "-----BEGIN RSA PRIVATE KEY-----", label: /private key/ },
    { contents: `token = "ghp_${"c".repeat(24)}"`, label: /GitHub token/ },
  ];
  for (const { contents, label } of cases) {
    assert.throws(() => assertPackageSafe([{ path: "leak.js", contents }]), label);
  }

  assert.doesNotThrow(() => assertPackageSafe(ENTRIES));
});

test("assertPackageSafe refuses forbidden paths even with innocuous content", () => {
  for (const badPath of [".env", "config/.env.production", "node_modules/x/index.js", ".git/config", "certs/server.pem", "keys/deploy.key"]) {
    assert.throws(() => assertPackageSafe([{ path: badPath, contents: "harmless" }]), /forbidden path pattern/, `${badPath} should be refused`);
  }
});

test("assertPackageSafe refuses to ship server-side proprietary logic to customers", () => {
  // The commercial basis of the product is that ATI/valuation logic stays
  // server-side. Packaging it would give it away.
  for (const proprietary of [
    "base44/functions/abosCoreApi/entry.ts",
    "gateway/src/ati.js",
    "security-worker/src/index.js",
    "lib/omvmScoring.js",
  ]) {
    assert.throws(
      () => assertPackageSafe([{ path: proprietary, contents: "// logic" }]),
      /proprietary logic must not ship/,
      `${proprietary} should be refused`,
    );
  }
});

// ── Package generation ─────────────────────────────────────────────────────

test("packageFileName matches the format from the product brief", () => {
  assert.equal(
    packageFileName({ displayName: "SkyDeals Europe", version: "1.0.0" }),
    "ABOS-SkyDeals-Europe-v1.0.0.zip",
  );
  assert.equal(packageFileName({ displayName: "SkyDeals Europe", version: "v1.2.3" }), "ABOS-SkyDeals-Europe-v1.2.3.zip");
  // Names that would produce an unsafe filename are sanitized.
  assert.equal(packageFileName({ displayName: "../../etc", version: "1.0.0" }), "ABOS-etc-v1.0.0.zip");
  assert.equal(packageFileName({ displayName: "A/B  Aviation", version: "1.0.0" }), "ABOS-AB-Aviation-v1.0.0.zip");
  assert.equal(packageFileName({ tenantId: "fallback_id", version: "1.0.0" }), "ABOS-fallback_id-v1.0.0.zip");
});

test("generatePackage produces a deterministic, hashable archive", () => {
  const first = generatePackage({ tenant: TENANT, license: LICENSE, version: "1.0.0", platform: "next-app-router", entries: ENTRIES });
  const second = generatePackage({ tenant: TENANT, license: LICENSE, version: "1.0.0", platform: "next-app-router", entries: ENTRIES });

  assert.equal(first.fileName, "ABOS-SkyDeals-Europe-v1.0.0.zip");
  assert.equal(first.sha256, second.sha256, "the same inputs must produce the same package hash");
  assert.match(first.sha256, /^[0-9a-f]{64}$/);
});

test("generatePackage embeds an auditable manifest of every file", () => {
  const result = generatePackage({ tenant: TENANT, license: LICENSE, version: "1.0.0", platform: "express", entries: ENTRIES });
  const { manifest } = result;

  assert.equal(manifest.tenant_id, "skydeals_europe");
  assert.equal(manifest.license_id, "lic_123");
  assert.equal(manifest.version, "1.0.0");
  assert.equal(manifest.platform, "express");
  assert.equal(manifest.file_count, ENTRIES.length);

  // Every file is individually hashed, so a modified package is detectable
  // per-file rather than only in aggregate.
  for (const file of manifest.files) {
    assert.match(file.sha256, /^[0-9a-f]{64}$/);
    assert.ok(file.bytes > 0);
  }
  const paths = manifest.files.map((f) => f.path);
  assert.deepEqual(paths, [...paths].sort(), "manifest files must be sorted for stable diffs");
});

test("generatePackage refuses to build when an entry carries a credential", () => {
  assert.throws(
    () => generatePackage({
      tenant: TENANT, license: LICENSE, version: "1.0.0", platform: "express",
      entries: [...ENTRIES, { path: "leak.js", contents: `key="abos_tenant_${"a".repeat(48)}"` }],
    }),
    /tenant API key/,
  );
});

test("generatePackage validates its required inputs", () => {
  const base = { tenant: TENANT, license: LICENSE, version: "1.0.0", platform: "express", entries: ENTRIES };
  assert.throws(() => generatePackage({ ...base, tenant: {} }), /tenant_id/);
  assert.throws(() => generatePackage({ ...base, license: {} }), /license with an id/);
  assert.throws(() => generatePackage({ ...base, version: null }), /requires a version/);
  assert.throws(() => generatePackage({ ...base, entries: [] }), /requires package entries/);
});

test("buildManifest defaults to a fixed timestamp so default builds stay reproducible", () => {
  const a = buildManifest({ tenantId: "t", licenseId: "l", version: "1.0.0", platform: "express", entries: ENTRIES });
  const b = buildManifest({ tenantId: "t", licenseId: "l", version: "1.0.0", platform: "express", entries: ENTRIES });
  assert.equal(a.built_at, b.built_at);
  assert.equal(a.built_at, "1980-01-01T00:00:00.000Z");

  // An explicit timestamp is honored, so a historical package can be rebuilt.
  const stamped = buildManifest({ tenantId: "t", licenseId: "l", version: "1.0.0", platform: "express", entries: ENTRIES, builtAt: "2026-08-26T00:00:00.000Z" });
  assert.equal(stamped.built_at, "2026-08-26T00:00:00.000Z");
});
