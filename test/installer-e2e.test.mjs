import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const INSTALLER = fileURLToPath(new URL("../installer/bin/abos-install.mjs", import.meta.url));
const TENANT_KEY = `abos_tenant_${"a".repeat(48)}`;

/**
 * Mock ABOS Core. Records requests so tests can assert on what the installer
 * actually sent (in particular: that the key travels as a header).
 */
async function startMockAbos({ license, tenant, failWith = null } = {}) {
  const requests = [];
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : {};
      requests.push({ url: req.url, headers: req.headers, body });
      res.setHeader("Content-Type", "application/json");

      if (failWith) {
        res.statusCode = failWith.status;
        res.end(JSON.stringify({ status: "error", error: { code: failWith.code, message: failWith.message } }));
        return;
      }
      if (body.endpoint === "whoami") {
        res.end(JSON.stringify({ status: "success", data: { tenant, license } }));
        return;
      }
      if (body.endpoint === "health") {
        res.end(JSON.stringify({ status: "success", data: { healthy: true, tenant_id: tenant.tenant_id } }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ status: "error", error: { code: "unknown_endpoint", message: "unknown" } }));
    });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

async function makeProject({ files = {}, packageJson = null } = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), "abos-installer-e2e-"));
  if (packageJson) await writeFile(path.join(dir, "package.json"), JSON.stringify(packageJson, null, 2));
  for (const [filePath, contents] of Object.entries(files)) {
    const target = path.join(dir, filePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  return dir;
}

async function runInstaller(args, { cwd } = {}) {
  try {
    const { stdout, stderr } = await execFileAsync("node", [INSTALLER, ...args], {
      cwd,
      // --yes keeps it non-interactive; env must not leak a real key in.
      env: { ...process.env, ABOS_TENANT_API_KEY: "", NO_COLOR: "1" },
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code ?? 1, stdout: error.stdout || "", stderr: error.stderr || "" };
  }
}

const LICENSE = {
  plan: "professional",
  status: "active",
  allowed_capabilities: ["ati_score", "valuation", "search"],
};
const TENANT = {
  tenant_id: "skydeals_europe",
  display_name: "SkyDeals Europe",
  brand_name: "SkyDeals",
  status: "active",
};

test("installer completes a full Next.js App Router install end to end", async (t) => {
  const abos = await startMockAbos({ license: LICENSE, tenant: TENANT });
  const dir = await makeProject({
    packageJson: { name: "customer-site", dependencies: { next: "14.0.0" } },
    files: { "app/layout.tsx": "export default function L({children}){return children}" },
  });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  const result = await runInstaller(
    ["--yes", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl],
    { cwd: dir },
  );

  assert.equal(result.code, 0, `installer failed:\n${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Installation complete/);
  assert.match(result.stdout, /SkyDeals Europe/);
  assert.match(result.stdout, /Next\.js \(App Router\)/);

  // Every lifecycle step from the brief must have been walked and marked done.
  for (const label of [
    "Welcome", "License activation", "Tenant identification", "Platform detection",
    "Configuration", "Branding", "Feature selection", "ABOS Core connection",
    "Health check", "Install", "Validation", "Complete",
  ]) {
    assert.match(result.stdout, new RegExp(`✓ ${label.replace(/[.()]/g, "\\$&")}`), `step '${label}' never completed`);
  }

  // The adapter landed in the App Router location.
  const adapter = await readFile(path.join(dir, "app/api/abos/route.js"), "utf8");
  assert.match(adapter, /export async function POST/);
  assert.match(adapter, /x-abos-tenant-key/);
  assert.match(adapter, /process\.env\.ABOS_TENANT_API_KEY/);

  const config = JSON.parse(await readFile(path.join(dir, "abos.config.json"), "utf8"));
  assert.equal(config.tenant_id, "skydeals_europe");
  assert.equal(config.plan, "professional");
  assert.deepEqual(config.enabled_features, ["ati_score", "valuation", "search"]);

  const envTemplate = await readFile(path.join(dir, ".env.abos.example"), "utf8");
  assert.match(envTemplate, /^ABOS_TENANT_API_KEY=$/m, "env template must ship empty");
});

test("the installed key never appears in any generated file", async (t) => {
  const abos = await startMockAbos({ license: LICENSE, tenant: TENANT });
  const dir = await makeProject({
    packageJson: { name: "customer-site", dependencies: { next: "14.0.0" } },
    files: { "app/layout.tsx": "x" },
  });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  await runInstaller(["--yes", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl], { cwd: dir });

  for (const file of ["abos.config.json", ".env.abos.example", "app/api/abos/route.js"]) {
    const contents = await readFile(path.join(dir, file), "utf8");
    assert.ok(
      !contents.includes(TENANT_KEY),
      `${file} contains the tenant API key — it must only ever live in the environment`,
    );
  }
});

test("installer sends the key as a header, never in the URL or body", async (t) => {
  const abos = await startMockAbos({ license: LICENSE, tenant: TENANT });
  const dir = await makeProject({ packageJson: { dependencies: { express: "4" } } });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  await runInstaller(["--yes", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl], { cwd: dir });

  assert.ok(abos.requests.length >= 2, "expected whoami + health calls");
  for (const request of abos.requests) {
    assert.equal(request.headers["x-abos-tenant-key"], TENANT_KEY);
    assert.ok(!request.url.includes(TENANT_KEY), "key must never be in a URL — URLs land in access logs");
    assert.ok(!JSON.stringify(request.body).includes(TENANT_KEY), "key must never be in a request body");
  }
});

test("installer refuses a static SPA rather than generating an insecure integration", async (t) => {
  const abos = await startMockAbos({ license: LICENSE, tenant: TENANT });
  const dir = await makeProject({ packageJson: { devDependencies: { vite: "5.0.0" } } });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  const result = await runInstaller(
    ["--yes", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl],
    { cwd: dir },
  );

  assert.equal(result.code, 1, "must fail rather than proceed");
  assert.match(result.stdout, /no server side to hold your API key/);
  assert.match(result.stdout, /What to do:/, "must give recovery guidance, not just an error");

  // Critically: nothing was written.
  await assert.rejects(() => readFile(path.join(dir, "abos.config.json"), "utf8"));
});

test("installer fails with actionable guidance when the license is rejected", async (t) => {
  const abos = await startMockAbos({
    license: LICENSE, tenant: TENANT,
    failWith: { status: 401, code: "unauthorized", message: "Invalid or revoked tenant API key" },
  });
  const dir = await makeProject({ packageJson: { dependencies: { next: "14" } }, files: { "app/layout.tsx": "x" } });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  const result = await runInstaller(
    ["--yes", "--key", "abos_tenant_wrong", "--dir", dir, "--base-url", abos.baseUrl],
    { cwd: dir },
  );

  assert.equal(result.code, 1);
  assert.match(result.stdout, /Invalid or revoked tenant API key/);
  assert.match(result.stdout, /Partner Portal/, "recovery guidance must tell the user where to get a valid key");
  assert.match(result.stdout, /✗ License activation/);
  await assert.rejects(() => readFile(path.join(dir, "abos.config.json"), "utf8"), "nothing may be written on failure");
});

test("installer only enables licensed features and says so when it drops one", async (t) => {
  const abos = await startMockAbos({
    tenant: TENANT,
    license: { plan: "starter", status: "active", allowed_capabilities: ["ati_score"] },
  });
  const dir = await makeProject({ packageJson: { dependencies: { express: "4" } } });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  const result = await runInstaller(
    ["--yes", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl],
    { cwd: dir },
  );

  assert.equal(result.code, 0);
  const config = JSON.parse(await readFile(path.join(dir, "abos.config.json"), "utf8"));
  assert.deepEqual(config.enabled_features, ["ati_score"], "must not enable unlicensed features");
  assert.equal(config.plan, "starter");
});

test("dry run writes nothing but reports what it would write", async (t) => {
  const abos = await startMockAbos({ license: LICENSE, tenant: TENANT });
  const dir = await makeProject({ packageJson: { dependencies: { next: "14" } }, files: { "app/layout.tsx": "x" } });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  const result = await runInstaller(
    ["--yes", "--dry-run", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl],
    { cwd: dir },
  );

  assert.equal(result.code, 0);
  assert.match(result.stdout, /Would write:/);
  assert.match(result.stdout, /abos\.config\.json/);
  assert.match(result.stdout, /nothing was written/);
  await assert.rejects(() => readFile(path.join(dir, "abos.config.json"), "utf8"));
});

test("installer refuses to clobber an existing install without --force", async (t) => {
  const abos = await startMockAbos({ license: LICENSE, tenant: TENANT });
  const dir = await makeProject({
    packageJson: { dependencies: { express: "4" } },
    files: { "abos.config.json": '{"tenant_id":"someone_else"}' },
  });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  const blocked = await runInstaller(
    ["--yes", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl],
    { cwd: dir },
  );
  assert.equal(blocked.code, 1);
  assert.match(blocked.stdout, /already exists/);
  assert.match(blocked.stdout, /--force/);

  // The pre-existing config must be untouched.
  const preserved = JSON.parse(await readFile(path.join(dir, "abos.config.json"), "utf8"));
  assert.equal(preserved.tenant_id, "someone_else");

  // With --force it proceeds and overwrites.
  const forced = await runInstaller(
    ["--yes", "--force", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl],
    { cwd: dir },
  );
  assert.equal(forced.code, 0, forced.stdout);
  const overwritten = JSON.parse(await readFile(path.join(dir, "abos.config.json"), "utf8"));
  assert.equal(overwritten.tenant_id, "skydeals_europe");
});

test("installer generates a Cloudflare Worker adapter when a wrangler config is present", async (t) => {
  const abos = await startMockAbos({ license: LICENSE, tenant: TENANT });
  const dir = await makeProject({
    packageJson: { name: "worker-site" },
    files: { "wrangler.toml": 'name = "customer-worker"\n' },
  });
  t.after(async () => { await abos.close(); await rm(dir, { recursive: true, force: true }); });

  const result = await runInstaller(
    ["--yes", "--key", TENANT_KEY, "--dir", dir, "--base-url", abos.baseUrl],
    { cwd: dir },
  );

  assert.equal(result.code, 0, result.stdout);
  assert.match(result.stdout, /wrangler secret put/, "should tell Worker users how to set the secret");
  const adapter = await readFile(path.join(dir, "abos/worker-adapter.js"), "utf8");
  assert.match(adapter, /export default \{/);
  assert.match(adapter, /env\.ABOS_TENANT_API_KEY/);
  assert.doesNotMatch(adapter, /process\.env/, "Workers have no process.env");
});
