import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import {
  resolveTenantTheme,
  themeToCssVariables,
  contrastRatio,
} from "../src/white-label/theme.js";
import {
  isValidTenantId,
  WHITE_LABEL_CAPABILITIES,
  PLAN_CAPABILITIES,
} from "../base44/functions/_shared/tenantLicense.mjs";

const tenantsDir = new URL("../src/white-label/tenants/", import.meta.url);

async function loadTenantConfigs() {
  const files = (await readdir(tenantsDir)).filter((f) => f.endsWith(".json"));
  const configs = [];
  for (const file of files) {
    const raw = await readFile(new URL(file, tenantsDir), "utf8");
    configs.push({ file, config: JSON.parse(raw) });
  }
  return configs;
}

const tenantConfigs = await loadTenantConfigs();

test("at least one reference tenant config ships with the kit", () => {
  assert.ok(tenantConfigs.length > 0, "expected at least the SkyDeals Europe reference tenant");
  assert.ok(
    tenantConfigs.some(({ config }) => config.tenant_id === "skydeals_europe"),
    "SkyDeals Europe reference tenant must exist",
  );
});

test("every tenant config has a valid tenant_id matching its filename", () => {
  for (const { file, config } of tenantConfigs) {
    assert.ok(isValidTenantId(config.tenant_id), `${file}: invalid tenant_id '${config.tenant_id}'`);
    assert.equal(
      file,
      `${config.tenant_id}.json`,
      `${file}: filename must match tenant_id so lookups are unambiguous`,
    );
  }
});

test("every tenant config resolves to a legible, safe theme", () => {
  for (const { file, config } of tenantConfigs) {
    const theme = resolveTenantTheme(config);

    // The declared brand color must survive resolution — if it doesn't, the
    // config has an invalid color that silently fell back to the default.
    if (config.primary_color) {
      assert.equal(
        theme.primaryColor,
        config.primary_color.toLowerCase(),
        `${file}: primary_color did not resolve; it is probably malformed`,
      );
    }

    assert.ok(
      contrastRatio(theme.primaryColor, theme.onPrimaryColor) >= 3,
      `${file}: brand color is not legible against its derived foreground`,
    );

    const vars = themeToCssVariables(theme);
    assert.ok(
      contrastRatio(vars["--abos-wl-text"], vars["--abos-wl-background"]) >= 4.5,
      `${file}: body text fails WCAG AA against the background`,
    );

    // A logo URL that doesn't survive safeImageUrl means the config declared
    // one that would be silently dropped at render time.
    if (config.logo_url) {
      assert.ok(theme.logoUrl, `${file}: logo_url is set but was rejected as unsafe`);
    }
  }
});

test("tenant configs only reference real capabilities and never over-claim their plan", () => {
  for (const { file, config } of tenantConfigs) {
    const declared = config.expected_capabilities || [];
    for (const capability of declared) {
      assert.ok(
        WHITE_LABEL_CAPABILITIES.includes(capability),
        `${file}: '${capability}' is not a real white-label capability`,
      );
    }
    // Whatever a config advertises must be satisfiable by at least one real
    // plan — otherwise the installer would preselect features no license can
    // ever grant, and the API would 403 them at runtime.
    if (declared.length) {
      const satisfiable = Object.values(PLAN_CAPABILITIES).some((planCaps) =>
        declared.every((c) => planCaps.includes(c)),
      );
      assert.ok(satisfiable, `${file}: expected_capabilities exceed every available plan`);
    }
  }
});

test("tenant configs carry no credentials or authorization state", () => {
  // A tenant config file is shipped inside the customer's package and is
  // therefore public. Authorization lives in the License entity, server-side.
  const forbidden = [
    "api_key", "apiKey", "key_hash", "secret", "token", "password",
    "stripe_customer_id", "stripe_subscription_id", "allowed_capabilities", "status",
  ];
  for (const { file, config } of tenantConfigs) {
    for (const key of forbidden) {
      assert.ok(
        !(key in config),
        `${file}: must not contain '${key}' — it is either a credential or authorization state that belongs server-side`,
      );
    }
    const serialized = JSON.stringify(config);
    assert.doesNotMatch(serialized, /abos_tenant_/, `${file}: contains what looks like a tenant API key`);
    assert.doesNotMatch(serialized, /abos_live_/, `${file}: contains what looks like a user API key`);
    assert.doesNotMatch(serialized, /sk_(test|live)_/, `${file}: contains what looks like a Stripe secret key`);
  }
});

test("no SkyDeals-specific branding is hardcoded into the white-label kit", async () => {
  // The whole point of the tenant config is that the kit stays generic.
  const kitFiles = [
    "../src/white-label/theme.js",
    "../src/white-label/client.js",
    "../src/white-label/index.js",
    "../src/white-label/TenantThemeProvider.jsx",
    "../src/white-label/components/AtiScoreCard.jsx",
    "../src/white-label/components/AircraftIntelligenceCard.jsx",
  ];
  for (const path of kitFiles) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(source, /skydeals/i, `${path} must not mention any specific tenant`);
    assert.doesNotMatch(source, /#0b5fff/i, `${path} must not hardcode a tenant's brand color`);
  }
});
