import test from "node:test";
import assert from "node:assert/strict";

import { PLATFORMS, PLATFORM_LABELS, adapterPathFor } from "../installer/lib/platform.mjs";
import { buildArtifacts, CONFIG_FILENAME, ENV_FILENAME } from "../installer/lib/generate.mjs";
import { PLATFORM_ORDER } from "../src/utils/installPlatforms.js";

// Shapes as tenantPortal's `overview` action returns them, which is what the
// wizard hands straight to buildArtifacts.
const TENANT = {
  tenant_id: "skydeals",
  display_name: "SkyDeals",
  branding: { brand_name: "SkyDeals", primary_color: "#0ea5e9", mode: "dark" },
};
const LICENSE = { plan: "professional", status: "active", features: ["search", "ati"] };

test("the wizard offers every platform the installer supports, exactly once", () => {
  const supported = Object.values(PLATFORMS).sort();
  const offered = [...PLATFORM_ORDER].sort();
  // A platform missing here is unreachable in the UI; a stray one renders a
  // button that generates a broken adapter path.
  assert.deepEqual(offered, supported);
  assert.equal(new Set(PLATFORM_ORDER).size, PLATFORM_ORDER.length);
});

test("every offered platform has a human label", () => {
  for (const platform of PLATFORM_ORDER) {
    const label = PLATFORM_LABELS[platform];
    assert.ok(label && typeof label === "string", `missing label for ${platform}`);
  }
});

test("wizard inputs generate the full artifact set for every platform", () => {
  for (const platform of PLATFORM_ORDER) {
    const files = buildArtifacts({
      tenant: TENANT,
      license: LICENSE,
      features: LICENSE.features,
      branding: TENANT.branding,
      platform,
      baseUrl: "https://aircraftbuyorsell.com",
      adapterUrl: "/api/abos",
    });

    const paths = files.map((f) => f.path);
    assert.ok(paths.includes(CONFIG_FILENAME), `${platform}: missing config`);
    assert.ok(paths.includes(ENV_FILENAME), `${platform}: missing env template`);
    assert.ok(paths.includes(adapterPathFor(platform)), `${platform}: missing adapter`);

    for (const file of files) {
      assert.ok(file.contents.length > 0, `${platform}: ${file.path} is empty`);
    }
  }
});

test("a custom adapter route reaches the generated config", () => {
  const files = buildArtifacts({
    tenant: TENANT,
    license: LICENSE,
    features: LICENSE.features,
    branding: TENANT.branding,
    platform: PLATFORMS.EXPRESS,
    baseUrl: "https://aircraftbuyorsell.com",
    adapterUrl: "/internal/abos-proxy",
  });
  const config = JSON.parse(files.find((f) => f.path === CONFIG_FILENAME).contents);
  assert.equal(config.adapter_url, "/internal/abos-proxy");
});

test("nothing the wizard generates carries a tenant key", () => {
  for (const platform of PLATFORM_ORDER) {
    const files = buildArtifacts({
      tenant: { ...TENANT, api_key: "abos_tenant_deadbeef" },
      license: LICENSE,
      features: LICENSE.features,
      branding: TENANT.branding,
      platform,
      baseUrl: "https://aircraftbuyorsell.com",
    });
    for (const file of files) {
      assert.doesNotMatch(file.contents, /abos_tenant_[0-9a-f]{8}/, `${platform}: ${file.path} leaked a key`);
    }
  }
});
