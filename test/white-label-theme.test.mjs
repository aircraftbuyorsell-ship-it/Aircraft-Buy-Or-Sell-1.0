import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THEME,
  normalizeHexColor,
  contrastRatio,
  readableTextColor,
  safeImageUrl,
  resolveTenantTheme,
  themeToCssVariables,
  scoreBand,
  SCORE_BANDS,
} from "../src/white-label/theme.js";

test("normalizeHexColor accepts valid hex, expands shorthand, rejects everything else", () => {
  assert.equal(normalizeHexColor("#0EA5E9"), "#0ea5e9");
  assert.equal(normalizeHexColor("  #abc  "), "#aabbcc");
  assert.equal(normalizeHexColor("#FFF"), "#ffffff");

  assert.equal(normalizeHexColor("red"), null);
  assert.equal(normalizeHexColor("#12345"), null);
  assert.equal(normalizeHexColor("rgb(1,2,3)"), null);
  assert.equal(normalizeHexColor(""), null);
  assert.equal(normalizeHexColor(undefined), null);
  assert.equal(normalizeHexColor(0x0ea5e9), null, "numbers are not accepted");
});

test("contrastRatio matches known WCAG values", () => {
  // Black on white is the maximum possible ratio.
  assert.ok(Math.abs(contrastRatio("#000000", "#ffffff") - 21) < 0.01);
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  // Order must not matter.
  assert.equal(contrastRatio("#000000", "#ffffff"), contrastRatio("#ffffff", "#000000"));
});

test("readableTextColor always picks the more legible foreground", () => {
  assert.equal(readableTextColor("#ffffff"), "#000000");
  assert.equal(readableTextColor("#000000"), "#ffffff");
  assert.equal(readableTextColor("#0f172a"), "#ffffff", "dark navy gets white text");
  assert.equal(readableTextColor("#fbbf24"), "#000000", "bright amber gets black text");

  // Whatever brand color a tenant picks, the derived pair must clear WCAG AA
  // for large text (3:1) — this is the guarantee that makes branding safe.
  for (const brand of ["#0ea5e9", "#dc2626", "#fbbf24", "#059669", "#7c3aed", "#f5c242", "#111111", "#eeeeee"]) {
    const fg = readableTextColor(brand);
    assert.ok(
      contrastRatio(brand, fg) >= 3,
      `${brand} on ${fg} = ${contrastRatio(brand, fg).toFixed(2)}:1, below 3:1`,
    );
  }
});

test("safeImageUrl allows only http(s) and rejects script-bearing URLs", () => {
  assert.equal(safeImageUrl("https://cdn.example.com/logo.png"), "https://cdn.example.com/logo.png");
  assert.equal(safeImageUrl("http://example.com/a.svg"), "http://example.com/a.svg");

  assert.equal(safeImageUrl("javascript:alert(1)"), null);
  assert.equal(safeImageUrl("JavaScript:alert(1)"), null);
  assert.equal(safeImageUrl("data:image/svg+xml,<svg onload=alert(1)>"), null);
  assert.equal(safeImageUrl("vbscript:msgbox"), null);
  assert.equal(safeImageUrl("file:///etc/passwd"), null);
  assert.equal(safeImageUrl("not a url"), null);
  assert.equal(safeImageUrl(""), null);
  assert.equal(safeImageUrl(undefined), null);
});

test("resolveTenantTheme falls back to safe defaults for missing or hostile config", () => {
  const empty = resolveTenantTheme({});
  assert.equal(empty.primaryColor, DEFAULT_THEME.primaryColor);
  assert.equal(empty.brandName, DEFAULT_THEME.brandName);
  assert.equal(empty.logoUrl, null);
  assert.equal(empty.mode, "light");

  for (const hostile of [null, undefined, "string", 42, []]) {
    const theme = resolveTenantTheme(hostile);
    assert.equal(theme.primaryColor, DEFAULT_THEME.primaryColor);
    assert.ok(theme.onPrimaryColor);
  }

  const badValues = resolveTenantTheme({
    primary_color: "not-a-color",
    logo_url: "javascript:alert(1)",
    mode: "neon",
  });
  assert.equal(badValues.primaryColor, DEFAULT_THEME.primaryColor, "invalid color falls back");
  assert.equal(badValues.logoUrl, null, "unsafe logo URL is dropped");
  assert.equal(badValues.mode, "light", "unknown mode falls back");
});

test("resolveTenantTheme accepts both snake_case (API) and camelCase (JS config) keys", () => {
  const snake = resolveTenantTheme({ brand_name: "SkyDeals", primary_color: "#123456", logo_url: "https://x.test/l.png" });
  const camel = resolveTenantTheme({ brandName: "SkyDeals", primaryColor: "#123456", logoUrl: "https://x.test/l.png" });
  assert.deepEqual(snake, camel);
  assert.equal(snake.brandName, "SkyDeals");
  assert.equal(snake.primaryColor, "#123456");
});

test("resolveTenantTheme derives an always-legible foreground for the tenant's brand color", () => {
  const theme = resolveTenantTheme({ primary_color: "#f5c242" });
  assert.equal(theme.onPrimaryColor, readableTextColor("#f5c242"));
  assert.ok(contrastRatio(theme.primaryColor, theme.onPrimaryColor) >= 3);
});

test("resolveTenantTheme falls back through brand_name -> display_name -> default", () => {
  assert.equal(resolveTenantTheme({ brand_name: "A", display_name: "B" }).brandName, "A");
  assert.equal(resolveTenantTheme({ display_name: "B" }).brandName, "B");
  assert.equal(resolveTenantTheme({ brand_name: "   " , display_name: "B" }).brandName, "B", "whitespace-only is not a name");
  assert.equal(resolveTenantTheme({}).brandName, DEFAULT_THEME.brandName);
});

test("themeToCssVariables emits a complete, scoped token set for both modes", () => {
  const required = [
    "--abos-wl-primary", "--abos-wl-on-primary", "--abos-wl-background",
    "--abos-wl-surface", "--abos-wl-border", "--abos-wl-text",
    "--abos-wl-text-muted", "--abos-wl-track", "--abos-wl-font", "--abos-wl-radius",
  ];
  for (const mode of ["light", "dark"]) {
    const vars = themeToCssVariables(resolveTenantTheme({ primary_color: "#0ea5e9", mode }));
    for (const key of required) {
      assert.ok(vars[key], `${mode} theme missing ${key}`);
    }
    // Body text must be readable on the mode's own background.
    assert.ok(
      contrastRatio(vars["--abos-wl-text"], vars["--abos-wl-background"]) >= 4.5,
      `${mode}: text on background must clear WCAG AA (4.5:1)`,
    );
  }

  // Every token name is namespaced, so an embedded widget can't collide with
  // or leak into the host page's variables.
  const vars = themeToCssVariables(resolveTenantTheme({}));
  for (const key of Object.keys(vars)) {
    assert.ok(key.startsWith("--abos-wl-"), `${key} is not namespaced`);
  }
});

test("themeToCssVariables accepts a raw tenant config as well as a resolved theme", () => {
  const fromRaw = themeToCssVariables({ primary_color: "#123456" });
  const fromResolved = themeToCssVariables(resolveTenantTheme({ primary_color: "#123456" }));
  assert.deepEqual(fromRaw, fromResolved);
});

test("scoreBand assigns the correct band at and around every boundary", () => {
  assert.equal(scoreBand(100).label, "Excellent");
  assert.equal(scoreBand(80).label, "Excellent");
  assert.equal(scoreBand(79).label, "Good");
  assert.equal(scoreBand(65).label, "Good");
  assert.equal(scoreBand(64).label, "Fair");
  assert.equal(scoreBand(50).label, "Fair");
  assert.equal(scoreBand(49).label, "Poor");
  assert.equal(scoreBand(0).label, "Poor");
});

test("scoreBand clamps out-of-range and non-numeric scores instead of throwing", () => {
  assert.equal(scoreBand(150).label, "Excellent");
  assert.equal(scoreBand(-10).label, "Poor");
  assert.equal(scoreBand(NaN).label, "Poor");
  assert.equal(scoreBand(undefined).label, "Poor");
  assert.equal(scoreBand("not a number").label, "Poor");
  assert.equal(scoreBand("85").label, "Excellent", "numeric strings are coerced");
});

test("score band colors are not tenant-configurable and stay legible", () => {
  // A tenant must never be able to recolor ABOS's assessment — e.g. make
  // "Poor" read as green. The bands are frozen module constants.
  assert.ok(Object.isFrozen(SCORE_BANDS));
  for (const band of SCORE_BANDS) {
    assert.ok(Object.isFrozen(band));
    assert.ok(contrastRatio(band.color, "#ffffff") >= 3, `${band.label} must be legible on white`);
  }
});
