import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

// A ContractAcceptance records an agreement_version. That identifier is only
// meaningful if it resolves back to the exact text the signer accepted — an
// acceptance record pointing at text nobody can produce is worthless as
// evidence. These tests keep that property true.
const agreementsDir = new URL("../docs/white-label/agreements/", import.meta.url);

const files = (await readdir(agreementsDir)).filter((f) => f.endsWith(".md"));

/**
 * Collapses blockquote markers and line wrapping so a clause can be matched as
 * a phrase rather than as whatever happened to fit on one line. Without this,
 * reflowing a paragraph would break these tests for no real reason.
 */
function normalize(text) {
  return text.replace(/^\s*>\s?/gm, "").replace(/\s+/g, " ");
}

test("at least one agreement version exists", () => {
  assert.ok(files.length > 0, "no agreement text to resolve acceptance records against");
});

test("every agreement filename is a usable version identifier", () => {
  for (const file of files) {
    const version = file.replace(/\.md$/, "");
    // Date-stamped (2026-08-26) or semver (1.0.0). Anything else can't be
    // matched reliably to a stored agreement_version.
    assert.ok(
      /^\d{4}-\d{2}-\d{2}$/.test(version) || /^\d+\.\d+\.\d+$/.test(version),
      `${file}: version must be a date stamp or semver`,
    );
  }
});

test("every agreement declares its own version, matching its filename", async () => {
  for (const file of files) {
    const text = normalize(await readFile(new URL(file, agreementsDir), "utf8"));
    const version = file.replace(/\.md$/, "");
    assert.match(
      text,
      new RegExp(`Version:\\s*\`${version}\``),
      `${file}: must state its version identifier in the text`,
    );
  }
});

test("an unreviewed agreement says so unmissably", async () => {
  // Recording acceptance of unreviewed text is fine as an audit record, but it
  // must never be mistaken for a vetted, enforceable contract. If a version is
  // ever legally reviewed, this notice is what gets removed — deliberately.
  for (const file of files) {
    const text = normalize(await readFile(new URL(file, agreementsDir), "utf8"));
    const reviewed = /LEGALLY REVIEWED BY/i.test(text);
    if (!reviewed) {
      assert.match(text, /NOT LEGALLY REVIEWED/i, `${file}: unreviewed text must say so`);
      assert.match(text, /has not been reviewed by a qualified lawyer/i);
    }
  }
});

test("every agreement covers the terms the product actually depends on", async () => {
  // These aren't legal opinions — they're the clauses the implementation
  // relies on. If the text stops covering them, the code is enforcing rules
  // the agreement doesn't state.
  const required = [
    { pattern: /non-exclusive/i, why: "licence grant" },
    { pattern: /ABOS Core is \*\*not\*\* licensed/i, why: "proprietary logic retained server-side" },
    { pattern: /never embed, transmit or expose them in browser-delivered code/i, why: "credential handling — the installer's core constraint" },
    { pattern: /alter the presentation of an ATI Score/i, why: "score bands are not tenant-configurable" },
    { pattern: /not an appraisal/i, why: "assessments are opinions, not guarantees" },
    { pattern: /declined valuation is not a statement that an aircraft has no value/i, why: "refused valuations render null, never zero" },
    { pattern: /rate limits apply per Tenant/i, why: "per-tenant limits can't distinguish End Users" },
  ];
  for (const file of files) {
    const text = normalize(await readFile(new URL(file, agreementsDir), "utf8"));
    for (const { pattern, why } of required) {
      assert.match(text, pattern, `${file}: missing clause covering ${why}`);
    }
  }
});

test("unfilled placeholders are visible, not silently blank", async () => {
  // A template with blanks is fine; a template whose blanks look like settled
  // terms is dangerous. Bracketed placeholders make them obvious on review.
  for (const file of files) {
    const text = normalize(await readFile(new URL(file, agreementsDir), "utf8"));
    const reviewed = /LEGALLY REVIEWED BY/i.test(text);
    if (!reviewed) {
      assert.match(text, /\[[A-Z0-9 \/\][^\]]*\]/, `${file}: expected visible [PLACEHOLDER] fields`);
    }
  }
});
