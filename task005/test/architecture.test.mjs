import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchBar } from "../dist/components/SearchBar.js";
import { SearchFeedback } from "../dist/components/SearchFeedback.js";
import { SearchResultCard } from "../dist/components/SearchResultCard.js";
import { AircraftSearchV2 } from "../dist/components/AircraftSearchV2.js";
import { FixtureAircraftSearchAdapter, searchFixtures } from "../dist/fixtures.js";

const root = new URL("../src/", import.meta.url);
const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else files.push(target);
  }
  return files;
};

test("presentation source contains no direct storage, legacy client, endpoint or fetch access", async () => {
  const files = (await walk(root.pathname)).filter((file) => /\.(ts|tsx)$/.test(file));
  const source = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
  assert.doesNotMatch(source, /supabase/i);
  assert.doesNotMatch(source, /base44\.(entities|functions)|from\s+["'][^"']*base44/i);
  assert.doesNotMatch(source, /\/api\/v1\/search/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.match(source, /AircraftSearchAdapter/);
});

test("shared search bar has native form, label, hint and canonical length limit", () => {
  const markup = renderToStaticMarkup(React.createElement(SearchBar, {
    value: "Citation",
    onChange() {},
    onSubmit() {},
  }));
  assert.match(markup, /role="search"/);
  assert.match(markup, /<label for=/);
  assert.match(markup, /type="search"/);
  assert.match(markup, /maxlength="500"/i);
  assert.match(markup, /aria-describedby=/);
});

test("invalid query is wired through aria-invalid and aria-errormessage", () => {
  const markup = renderToStaticMarkup(React.createElement(SearchBar, {
    value: "",
    onChange() {},
    onSubmit() {},
    errorMessage: "Enter an aircraft search query.",
  }));
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /aria-errormessage=/);
  assert.doesNotMatch(markup, /role="alert"/);
});

test("invalid state produces one live alert while input error remains descriptive", () => {
  const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(SearchBar, {
      value: "",
      onChange() {},
      onSubmit() {},
      errorMessage: "Enter an aircraft search query.",
    }),
    React.createElement(SearchFeedback, {
      state: { kind: "invalid", message: "Enter an aircraft search query." },
    }),
  ));
  assert.equal((markup.match(/role="alert"/g) ?? []).length, 1);
  assert.equal((markup.match(/Enter an aircraft search query\./g) ?? []).length, 2);
});

test("loading and failure feedback expose screen-reader state", () => {
  const loading = renderToStaticMarkup(React.createElement(SearchFeedback, { state: { kind: "loading", query: "Citation" }, onRetry() {} }));
  assert.match(loading, /aria-live="polite"/);
  assert.match(loading, /aria-busy="true"/);
  const failure = renderToStaticMarkup(React.createElement(SearchFeedback, { state: { kind: "failure", failure: "unauthorized", message: "Sign in.", retryAfterSeconds: null, request: { query: "Citation" } } }));
  assert.match(failure, /role="alert"/);
  assert.match(failure, /tabindex="-1"/);
});

test("local validation has no retry and auth actions are host callbacks", () => {
  const invalid = renderToStaticMarkup(React.createElement(SearchFeedback, {
    state: { kind: "invalid", message: "Enter a query." },
  }));
  assert.match(invalid, /Check your search/);
  assert.doesNotMatch(invalid, /Try again/);
  assert.doesNotMatch(invalid, /<button/);

  const unauthorized = renderToStaticMarkup(React.createElement(SearchFeedback, {
    state: { kind: "failure", failure: "unauthorized", message: "Sign in.", retryAfterSeconds: null, request: { query: "Citation" } },
    onRequestAuthentication() {},
  }));
  assert.match(unauthorized, />Sign in<\/button>/);
});

test("Mode-A disclosure and native radio group are unconditional", () => {
  const markup = renderToStaticMarkup(React.createElement(AircraftSearchV2, {
    adapter: new FixtureAircraftSearchAdapter("success"),
  }));
  assert.match(markup, /typed fixture data · no live API connection/);
  assert.match(markup, /<fieldset/);
  assert.match(markup, /<legend>Search input mode<\/legend>/);
  assert.equal((markup.match(/type="radio"/g) ?? []).length, 2);
  assert.doesNotMatch(markup, /role="tab/);
  assert.doesNotMatch(markup, /<main/);
});

test("multiple search widgets receive independent native radio group names", () => {
  const adapter = new FixtureAircraftSearchAdapter("success");
  const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
    React.createElement(AircraftSearchV2, { adapter }),
    React.createElement(AircraftSearchV2, { adapter }),
  ));
  const names = [...markup.matchAll(/type="radio" name="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(names.length, 4);
  assert.equal(names[0], names[1]);
  assert.equal(names[2], names[3]);
  assert.notEqual(names[0], names[2]);
});

test("approved card image suppresses referrer and unsafe image falls back", () => {
  const approved = structuredClone(searchFixtures.success.results[0]);
  approved.primary_image_url = "https://images.example.test/a.jpg";
  const approvedMarkup = renderToStaticMarkup(React.createElement(SearchResultCard, { listing: approved, approvedImageHosts: ["images.example.test"] }));
  assert.match(approvedMarkup, /referrerpolicy="no-referrer"/i);
  assert.match(approvedMarkup, /Fixture — not live/);

  const unsafe = structuredClone(approved);
  unsafe.primary_image_url = "data:image/png;base64,abc";
  const unsafeMarkup = renderToStaticMarkup(React.createElement(SearchResultCard, { listing: unsafe, approvedImageHosts: ["images.example.test"] }));
  assert.doesNotMatch(unsafeMarkup, /<img/);
  assert.match(unsafeMarkup, /Aircraft image unavailable/);
});

test("result and error focus targets plus append state are implemented", async () => {
  const component = await readFile(new URL("../src/components/AircraftSearchV2.tsx", import.meta.url), "utf8");
  assert.match(component, /resultsFocusRef\.current\?\.focus\(\)/);
  assert.match(component, /feedbackFocusRef\.current\?\.focus\(\)/);
  assert.match(component, /tabIndex=\{-1\}/);
  assert.match(component, /aria-busy=\{loadMoreState\.kind === "loadingMore"\}/);
  assert.match(component, /Existing results are still available/);
  assert.match(component, /Retry additional results/);
  assert.doesNotMatch(component, /lastQuery/);
});

test("responsive stylesheet defines desktop, tablet and mobile result layouts", async () => {
  const css = await readFile(new URL("../src/search-v2.css", import.meta.url), "utf8");
  assert.match(css, /grid-template-columns:\s*repeat\(3/);
  assert.match(css, /@media \(max-width: 64rem\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(2/);
  assert.match(css, /@media \(max-width: 42rem\)/);
  assert.match(css, /grid-template-columns:\s*1fr/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test("legacy coexistence is explicit and no host route file is present", async () => {
  const report = await readFile(new URL("../reports/route-component-proposal.md", import.meta.url), "utf8");
  assert.match(report, /\/search-v2/);
  assert.match(report, /Do not replace or redirect `\/listings`/);
  assert.match(report, /feature-flagged/);
});
