import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm, mkdir, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const PACKAGER = path.join(REPO_ROOT, "packager/bin/abos-package.mjs");
const TENANT_KEY = `abos_tenant_${"e".repeat(48)}`;

/**
 * The full customer journey, exercised for real:
 *   build package -> download -> extract -> run the installer from it ->
 *   verify the resulting integration works.
 *
 * This is the "reproducible installation" acceptance criterion from the
 * product brief. Everything here runs actual binaries against actual files.
 */

async function hasUnzip() {
  try { await execFileAsync("unzip", ["-v"]); return true; } catch { return false; }
}

async function startMockAbos({ tenant, license }) {
  const requests = [];
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : {};
      requests.push({ headers: req.headers, body });
      res.setHeader("Content-Type", "application/json");
      if (body.endpoint === "whoami") {
        res.end(JSON.stringify({ status: "success", data: { tenant, license } }));
      } else if (body.endpoint === "health") {
        res.end(JSON.stringify({ status: "success", data: { healthy: true } }));
      } else if (body.endpoint === "listings.list") {
        res.end(JSON.stringify({
          status: "success",
          data: { total: 1, listings: [{ id: "l1", registration: "N123AB", aircraft: { manufacturer: "Cessna", model: "172", year: 2019 }, price: { value: 250000, currency: "USD" }, status: "active", intelligence: { ati_score: 82, omvm_value: 240000 } }] },
        }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ status: "error", error: { code: "unknown_endpoint", message: "unknown" } }));
      }
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    requests,
    close: () => new Promise((r) => server.close(r)),
  };
}

const TENANT = { tenant_id: "skydeals_europe", display_name: "SkyDeals Europe", brand_name: "SkyDeals", status: "active" };
const LICENSE = { plan: "professional", status: "active", allowed_capabilities: ["ati_score", "valuation", "search"] };

test("full journey: build package -> extract -> install -> working integration", async (t) => {
  if (!(await hasUnzip())) return t.skip("unzip not available in this environment");

  const workDir = await mkdtemp(path.join(tmpdir(), "abos-roundtrip-"));
  const abos = await startMockAbos({ tenant: TENANT, license: LICENSE });
  t.after(async () => { await abos.close(); await rm(workDir, { recursive: true, force: true }); });

  // ── 1. Build the package (as ABOS would, on purchase) ──
  const outDir = path.join(workDir, "packages");
  const build = await execFileAsync("node", [
    PACKAGER, "--tenant", "skydeals_europe", "--version", "1.0.0",
    "--license-id", "lic_roundtrip", "--out", outDir,
  ]);
  assert.match(build.stdout, /ABOS-SkyDeals-Europe-v1\.0\.0\.zip/);

  const zipPath = path.join(outDir, "ABOS-SkyDeals-Europe-v1.0.0.zip");
  const checksumFile = await readFile(`${zipPath}.sha256`, "utf8");
  assert.match(checksumFile, /^[0-9a-f]{64}\s+ABOS-SkyDeals-Europe-v1\.0\.0\.zip$/m);

  // ── 2. Verify the published checksum matches the artifact ──
  const { stdout: shaOut } = await execFileAsync("sha256sum", [zipPath]).catch(() => ({ stdout: "" }));
  if (shaOut) {
    assert.equal(shaOut.split(/\s+/)[0], checksumFile.split(/\s+/)[0], "published checksum must match the artifact");
  }

  // ── 3. Extract, as the customer would ──
  const extractDir = path.join(workDir, "extracted");
  await execFileAsync("unzip", ["-q", zipPath, "-d", extractDir]);

  const manifest = JSON.parse(await readFile(path.join(extractDir, "abos-package-manifest.json"), "utf8"));
  assert.equal(manifest.tenant_id, "skydeals_europe");
  assert.equal(manifest.license_id, "lic_roundtrip");
  assert.equal(manifest.version, "1.0.0");

  // Every file the manifest claims must actually be present.
  for (const file of manifest.files) {
    const contents = await readFile(path.join(extractDir, file.path));
    assert.equal(contents.length, file.bytes, `${file.path} size does not match the manifest`);
  }

  // ── 4. The extracted package must carry no credentials ──
  const walk = async (dir) => {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...(await walk(abs)));
      else out.push(abs);
    }
    return out;
  };
  for (const file of await walk(extractDir)) {
    const contents = await readFile(file, "utf8");
    assert.ok(!/abos_tenant_[0-9a-f]{16}/.test(contents), `${file} contains a tenant API key`);
    assert.ok(!/sk_(test|live)_[A-Za-z0-9]{10}/.test(contents), `${file} contains a Stripe secret`);
  }

  // ── 5. The package must not contain server-side proprietary logic ──
  const allPaths = (await walk(extractDir)).map((p) => path.relative(extractDir, p));
  for (const forbidden of ["base44", "gateway/src", "security-worker"]) {
    assert.ok(
      !allPaths.some((p) => p.includes(forbidden)),
      `package leaks server-side code: ${forbidden}`,
    );
  }

  // ── 6. Run the installer FROM the extracted package ──
  const customerProject = path.join(workDir, "customer-site");
  await mkdir(path.join(customerProject, "app"), { recursive: true });
  await writeFile(path.join(customerProject, "package.json"), JSON.stringify({ name: "customer-site", dependencies: { next: "14.0.0" } }));
  await writeFile(path.join(customerProject, "app/layout.tsx"), "export default function L({children}){return children}");

  const installerPath = path.join(extractDir, "installer/bin/abos-install.mjs");
  const install = await execFileAsync("node", [
    installerPath, "--yes", "--key", TENANT_KEY,
    "--dir", customerProject, "--base-url", abos.baseUrl,
  ], { env: { ...process.env, NO_COLOR: "1", ABOS_TENANT_API_KEY: "" } });

  assert.match(install.stdout, /Installation complete/);
  assert.match(install.stdout, /SkyDeals Europe/);

  // ── 7. The installed integration must be correct and credential-free ──
  const config = JSON.parse(await readFile(path.join(customerProject, "abos.config.json"), "utf8"));
  assert.equal(config.tenant_id, "skydeals_europe");
  assert.deepEqual(config.enabled_features, ["ati_score", "valuation", "search"]);

  const adapter = await readFile(path.join(customerProject, "app/api/abos/route.js"), "utf8");
  assert.ok(!adapter.includes(TENANT_KEY), "the adapter must not inline the key");
  assert.match(adapter, /process\.env\.ABOS_TENANT_API_KEY/);

  // ── 8. The generated adapter must actually work against ABOS ──
  // Load it with the env var set, and prove it proxies a real call.
  const adapterModulePath = path.join(workDir, "adapter-under-test.mjs");
  await writeFile(adapterModulePath, adapter);
  process.env.ABOS_TENANT_API_KEY = TENANT_KEY;
  process.env.ABOS_BASE_URL = abos.baseUrl;
  try {
    const { POST } = await import(`file://${adapterModulePath}`);
    const response = await POST(new Request("http://localhost/api/abos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: "listings.list", params: { limit: 5 } }),
    }));
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.status, "success");
    assert.equal(payload.data.listings[0].registration, "N123AB");
    assert.equal(payload.data.listings[0].intelligence.ati_score, 82);

    // The adapter must have sent the key as a header to ABOS.
    const proxied = abos.requests.at(-1);
    assert.equal(proxied.headers["x-abos-tenant-key"], TENANT_KEY);

    // And it must refuse endpoints outside its allowlist.
    const blocked = await POST(new Request("http://localhost/api/abos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: "admin.dropDatabase", params: {} }),
    }));
    assert.equal(blocked.status, 400);
    assert.equal((await blocked.json()).error.code, "endpoint_not_allowed");
  } finally {
    delete process.env.ABOS_TENANT_API_KEY;
    delete process.env.ABOS_BASE_URL;
  }
});

test("package builds are reproducible across separate invocations", async (t) => {
  const workDir = await mkdtemp(path.join(tmpdir(), "abos-repro-"));
  t.after(() => rm(workDir, { recursive: true, force: true }));

  const runBuild = async (name) => {
    const out = path.join(workDir, name);
    await execFileAsync("node", [PACKAGER, "--tenant", "skydeals_europe", "--version", "1.0.0", "--license-id", "lic_same", "--out", out]);
    return readFile(path.join(out, "ABOS-SkyDeals-Europe-v1.0.0.zip"));
  };

  const [first, second] = [await runBuild("a"), await runBuild("b")];
  assert.deepEqual(first, second, "two separate builds of the same inputs must be byte-identical");
});
