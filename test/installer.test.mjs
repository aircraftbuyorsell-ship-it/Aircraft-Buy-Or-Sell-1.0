import test from "node:test";
import assert from "node:assert/strict";
import {
  detectPlatform,
  adapterPathFor,
  PLATFORMS,
  BROWSER_ONLY_PLATFORMS,
} from "../installer/lib/platform.mjs";
import {
  STEPS,
  STATUS,
  createInstallState,
  completeStep,
  failStep,
  retryStep,
  recoveryFor,
  progress,
  isComplete,
  renderChecklist,
  reconcileFeatures,
} from "../installer/lib/steps.mjs";
import {
  buildConfig,
  buildAdapter,
  buildArtifacts,
  buildEnvTemplate,
  assertNoCredentials,
  CONFIG_FILENAME,
  ENV_FILENAME,
} from "../installer/lib/generate.mjs";

const TENANT = { tenant_id: "skydeals_europe", display_name: "SkyDeals Europe" };
const LICENSE = { plan: "professional", allowed_capabilities: ["ati_score", "valuation", "search"] };
const FAKE_KEY = `abos_tenant_${"a".repeat(48)}`;

// ── Platform detection ─────────────────────────────────────────────────────

test("detectPlatform identifies Next.js App Router vs Pages Router", () => {
  const appRouter = detectPlatform({
    packageJson: { dependencies: { next: "14.0.0" } },
    files: ["package.json", "app/layout.tsx"],
  });
  assert.equal(appRouter.platform, PLATFORMS.NEXT_APP);
  assert.equal(appRouter.confidence, "high");

  const pagesRouter = detectPlatform({
    packageJson: { dependencies: { next: "13.0.0" } },
    files: ["package.json", "pages/_app.js"],
  });
  assert.equal(pagesRouter.platform, PLATFORMS.NEXT_PAGES);

  // src/ layouts are equally valid.
  assert.equal(
    detectPlatform({ packageJson: { dependencies: { next: "14" } }, files: ["src/app/layout.jsx"] }).platform,
    PLATFORMS.NEXT_APP,
  );

  // Next with no recognizable entry file still resolves, at lower confidence.
  const ambiguous = detectPlatform({ packageJson: { dependencies: { next: "14" } }, files: [] });
  assert.equal(ambiguous.platform, PLATFORMS.NEXT_APP);
  assert.equal(ambiguous.confidence, "medium");
});

test("detectPlatform identifies Cloudflare Workers by config file, not by a wrangler dependency", () => {
  // A project can have wrangler as a devDependency without deploying a Worker
  // (this very repo does), so the config file is the real signal.
  const withConfig = detectPlatform({ packageJson: {}, files: ["wrangler.toml"] });
  assert.equal(withConfig.platform, PLATFORMS.CLOUDFLARE_WORKER);

  const devDepOnly = detectPlatform({
    packageJson: { devDependencies: { wrangler: "^3.0.0", vite: "^5.0.0" } },
    files: ["package.json", "vite.config.js"],
  });
  assert.notEqual(devDepOnly.platform, PLATFORMS.CLOUDFLARE_WORKER);
  assert.equal(devDepOnly.platform, PLATFORMS.VITE_SPA);
});

test("detectPlatform recognizes Remix, Express and generic Node projects", () => {
  assert.equal(
    detectPlatform({ packageJson: { dependencies: { "@remix-run/node": "2" } } }).platform,
    PLATFORMS.REMIX,
  );
  assert.equal(
    detectPlatform({ packageJson: { dependencies: { express: "4" } } }).platform,
    PLATFORMS.EXPRESS,
  );
  assert.equal(detectPlatform({ packageJson: { dependencies: {} } }).platform, PLATFORMS.GENERIC_NODE);
  assert.equal(detectPlatform({}).platform, PLATFORMS.GENERIC_NODE);
  assert.equal(detectPlatform().platform, PLATFORMS.GENERIC_NODE);
});

test("detectPlatform flags browser-only platforms as having no server side", () => {
  const spa = detectPlatform({ packageJson: { devDependencies: { vite: "5" } } });
  assert.equal(spa.platform, PLATFORMS.VITE_SPA);
  assert.equal(spa.serverSide, false, "a static SPA has nowhere safe to hold the tenant key");
  assert.ok(BROWSER_ONLY_PLATFORMS.includes(spa.platform));

  const next = detectPlatform({ packageJson: { dependencies: { next: "14" } }, files: ["app/layout.tsx"] });
  assert.equal(next.serverSide, true);
});

test("detectPlatform is not fooled by prototype keys in dependencies", () => {
  const result = detectPlatform({ packageJson: { dependencies: {} }, files: ["constructor"] });
  assert.equal(result.platform, PLATFORMS.GENERIC_NODE);
});

test("adapterPathFor returns a platform-appropriate path for every platform", () => {
  for (const platform of Object.values(PLATFORMS)) {
    const path = adapterPathFor(platform);
    assert.ok(path && !path.startsWith("/"), `${platform} must map to a relative path`);
  }
  assert.equal(adapterPathFor(PLATFORMS.NEXT_APP), "app/api/abos/route.js");
  assert.equal(adapterPathFor(PLATFORMS.NEXT_PAGES), "pages/api/abos.js");
});

// ── Install lifecycle ──────────────────────────────────────────────────────

test("install state starts at welcome with everything else pending", () => {
  const state = createInstallState();
  assert.equal(state.currentStep, "welcome");
  assert.equal(state.steps[0].status, STATUS.ACTIVE);
  assert.ok(state.steps.slice(1).every((s) => s.status === STATUS.PENDING));
  assert.equal(progress(state).done, 0);
  assert.equal(isComplete(state), false);
});

test("completing steps advances the flow and accumulates data immutably", () => {
  const initial = createInstallState();
  const afterWelcome = completeStep(initial, "welcome");

  assert.equal(initial.currentStep, "welcome", "original state must not be mutated");
  assert.equal(afterWelcome.currentStep, "license_activation");
  assert.equal(afterWelcome.steps[0].status, STATUS.DONE);

  const afterLicense = completeStep(afterWelcome, "license_activation", { license: LICENSE });
  const afterTenant = completeStep(afterLicense, "tenant_identification", { tenant: TENANT });
  assert.deepEqual(afterTenant.data.license, LICENSE);
  assert.deepEqual(afterTenant.data.tenant, TENANT, "earlier step data persists");
});

test("walking every step reaches completion at 100%", () => {
  let state = createInstallState();
  for (const step of STEPS) state = completeStep(state, step);
  assert.equal(isComplete(state), true);
  assert.equal(progress(state).percent, 100);
  assert.equal(state.currentStep, "complete");
});

test("a failed step does not advance and carries actionable recovery guidance", () => {
  const state = completeStep(createInstallState(), "welcome");
  const failed = failStep(state, "license_activation", new Error("Invalid or revoked tenant API key"));

  assert.equal(failed.failed, true);
  assert.equal(failed.currentStep, "license_activation", "must not advance past a failure");
  assert.equal(failed.steps[1].status, STATUS.FAILED);
  assert.match(failed.steps[1].error.message, /Invalid or revoked/);
  assert.ok(failed.steps[1].error.recovery.length > 20, "recovery guidance must be substantive");
  assert.match(failed.steps[1].error.recovery, /Partner Portal/);
});

test("every step has real recovery guidance, not a generic placeholder", () => {
  const generic = recoveryFor("nonexistent_step");
  for (const step of STEPS) {
    const recovery = recoveryFor(step);
    assert.ok(recovery && recovery.length > 20, `${step} lacks recovery guidance`);
    if (!["welcome", "complete"].includes(step)) {
      assert.notEqual(recovery, generic, `${step} falls through to the generic message`);
    }
  }
});

test("retrying a failed step clears the error and resumes there", () => {
  const state = completeStep(createInstallState(), "welcome");
  const failed = failStep(state, "license_activation", "boom");
  const retried = retryStep(failed, "license_activation");

  assert.equal(retried.failed, false);
  assert.equal(retried.steps[1].status, STATUS.ACTIVE);
  assert.equal(retried.steps[1].error, null);
  assert.equal(retried.currentStep, "license_activation");

  // And the flow can continue normally afterwards.
  const recovered = completeStep(retried, "license_activation", { license: LICENSE });
  assert.equal(recovered.currentStep, "tenant_identification");
});

test("unknown step ids are rejected rather than silently ignored", () => {
  const state = createInstallState();
  assert.throws(() => completeStep(state, "not_a_step"), /Unknown installer step/);
  assert.throws(() => failStep(state, "not_a_step", "x"), /Unknown installer step/);
  assert.throws(() => retryStep(state, "not_a_step"), /Unknown installer step/);
});

test("renderChecklist shows the brief's marker format", () => {
  let state = createInstallState();
  state = completeStep(state, "welcome");
  state = completeStep(state, "license_activation");
  const output = renderChecklist(state);

  assert.match(output, /✓ Welcome/);
  assert.match(output, /✓ License activation/);
  assert.match(output, /▸ Tenant identification/);
  assert.match(output, /○ Branding/);

  const failed = failStep(state, "tenant_identification", "nope");
  assert.match(renderChecklist(failed), /✗ Tenant identification/);
});

// ── Feature reconciliation ─────────────────────────────────────────────────

test("reconcileFeatures never enables a feature the license does not grant", () => {
  const licensed = ["ati_score", "search"];

  const overreach = reconcileFeatures(["ati_score", "valuation", "advanced_intelligence"], licensed);
  assert.deepEqual(overreach.enabled, ["ati_score"]);
  assert.deepEqual(overreach.rejected, ["valuation", "advanced_intelligence"]);
  assert.equal(overreach.ok, false, "requesting unlicensed features must be reported, not silently dropped");

  const exact = reconcileFeatures(["ati_score", "search"], licensed);
  assert.equal(exact.ok, true);
  assert.deepEqual(exact.enabled, ["ati_score", "search"]);
});

test("reconcileFeatures defaults to exactly the licensed set and handles empty input", () => {
  assert.deepEqual(reconcileFeatures(undefined, ["a", "b"]).enabled, ["a", "b"]);
  assert.deepEqual(reconcileFeatures(null, []).enabled, []);
  assert.deepEqual(reconcileFeatures(["a"], []).enabled, []);
  assert.equal(reconcileFeatures(["a"], undefined).ok, false);
});

// ── Artifact generation ────────────────────────────────────────────────────

test("generated config never contains the tenant API key", () => {
  const config = buildConfig({
    tenant: TENANT,
    license: LICENSE,
    features: ["ati_score"],
    branding: { primary_color: "#0b5fff" },
  });
  const serialized = JSON.stringify(config);
  assert.doesNotMatch(serialized, /abos_tenant_/);
  assert.equal(config.tenant_id, "skydeals_europe");
  assert.ok(config.$note.includes("NOT stored here"));
});

test("assertNoCredentials rejects credential-shaped content", () => {
  assert.throws(() => assertNoCredentials({ api_key: "x" }), /forbidden key/);
  assert.throws(() => assertNoCredentials({ nested: { secret: "x" } }), /forbidden key 'nested.secret'/);
  assert.throws(() => assertNoCredentials({ note: FAKE_KEY }), /tenant API key/);
  assert.throws(() => assertNoCredentials({ note: "sk_live_abcdef" }), /Stripe secret key/);
  assert.doesNotThrow(() => assertNoCredentials({ tenant_id: "x", enabled_features: ["ati_score"] }));
});

test("buildArtifacts produces a config, an adapter and an env template with no key in any of them", () => {
  const artifacts = buildArtifacts({
    tenant: TENANT,
    license: LICENSE,
    features: ["ati_score", "valuation"],
    branding: { primary_color: "#0b5fff", brand_name: "SkyDeals" },
    platform: PLATFORMS.NEXT_APP,
    baseUrl: "https://abos.test",
  });

  const paths = artifacts.map((a) => a.path);
  assert.ok(paths.includes(CONFIG_FILENAME));
  assert.ok(paths.includes(ENV_FILENAME));
  assert.ok(paths.includes("app/api/abos/route.js"));

  for (const artifact of artifacts) {
    assert.doesNotMatch(artifact.contents, /abos_tenant_[0-9a-f]{8}/, `${artifact.path} leaks a key`);
  }
});

test("every platform adapter reads the key from the environment, never inlines it", () => {
  for (const platform of Object.values(PLATFORMS)) {
    const adapter = buildAdapter(platform);
    assert.doesNotMatch(adapter, /abos_tenant_[0-9a-f]{8}/, `${platform} adapter inlines a key`);
    assert.match(adapter, /ABOS_TENANT_API_KEY/, `${platform} adapter must read the env var`);
    // The key must be sent as a header, never as a query parameter where it
    // would be captured by access logs.
    assert.doesNotMatch(adapter, /\?.*key=/, `${platform} adapter puts the key in a URL`);
    assert.match(adapter, /x-abos-tenant-key/, `${platform} adapter must send the key as a header`);
  }
});

test("every platform adapter restricts which endpoints it will proxy", () => {
  // An open proxy would let anyone who can reach the customer's site spend
  // their ABOS quota on any endpoint their license grants.
  for (const platform of Object.values(PLATFORMS)) {
    const adapter = buildAdapter(platform);
    assert.match(adapter, /ALLOWED_ENDPOINTS/, `${platform} adapter is an open proxy`);
    assert.match(adapter, /endpoint_not_allowed/, `${platform} adapter must reject disallowed endpoints`);
  }
});

test("the Cloudflare adapter reads config from env, not process.env", () => {
  const worker = buildAdapter(PLATFORMS.CLOUDFLARE_WORKER);
  assert.match(worker, /env\.ABOS_TENANT_API_KEY/);
  assert.doesNotMatch(worker, /process\.env/, "Workers have no process.env");
  assert.match(worker, /wrangler secret put/, "should tell the user how to set the secret");
});

test("env template warns against public-prefixing the key and is not itself a secret", () => {
  const template = buildEnvTemplate({ tenantId: "skydeals_europe", baseUrl: "https://abos.test" });
  assert.match(template, /ABOS_TENANT_API_KEY=$/m, "must ship empty, never pre-filled");
  assert.match(template, /NEXT_PUBLIC_/, "must warn about public env prefixes");
  assert.match(template, /never commit/i);
  assert.doesNotMatch(template, /abos_tenant_[0-9a-f]{8}/);
});
