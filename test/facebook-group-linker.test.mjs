import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyPost,
  extractRegistration,
  isOwnActivity,
  shouldAutoComment,
} from "../base44/functions/_shared/facebookGroupLinker.mjs";

// A) FAA registration inside a sale post
test("For sale Piper PA-28R-180 N7692J -> registration match", () => {
  const result = classifyPost("For sale Piper PA-28R-180 N7692J, 1234 TT, great condition");
  assert.equal(result.status, "MATCHED");
  assert.equal(result.registration, "N7692J");
  assert.match(result.destination_url, /\/n-lookup\?registration=N7692J/);
  assert.match(result.destination_url, /utm_source=facebook/);
  assert.ok(result.comment.includes(result.destination_url));
});

// B) EASA registration
test("Cessna 152 OK-PES for sale -> registration match", () => {
  const result = classifyPost("Cessna 152 OK-PES for sale, low hours, based in Europe");
  assert.equal(result.status, "MATCHED");
  assert.equal(result.registration, "OK-PES");
  assert.match(result.destination_url, /registration=OK-PES/);
});

// C) Listing without a tail number but with enough identifying fields
test("Piper for sale, no tail number, with price/year -> listing detection", () => {
  const result = classifyPost("Piper Cherokee for sale, 1978, asking $45,000, 3200 TT");
  assert.equal(result.registration, null);
  assert.ok(["MATCHED", "SKIPPED"].includes(result.status));
  if (result.status === "MATCHED") {
    assert.ok(result.listing.make);
    assert.match(result.destination_url, /\/listings\?search=/);
  }
});

// D) Unrelated chatter must be skipped
test("Great flying today -> SKIP", () => {
  const result = classifyPost("Great flying today, beautiful weather over the valley!");
  assert.equal(result.status, "SKIPPED");
  assert.equal(result.registration, null);
});

// E) Same post processed twice must be idempotent at the caller level.
// classifyPost itself is pure/stateless; dedup is the webhook's job, but we
// confirm the same input always yields the same deterministic decision so a
// dedup-by-post-id check upstream is sufficient and safe.
test("classifyPost is deterministic for repeated input (dedup precondition)", () => {
  const text = "For sale Piper PA-28R-180 N7692J";
  const first = classifyPost(text);
  const second = classifyPost(text);
  assert.deepEqual(first, second);
});

// F) ABOS's own comment/event must not be reprocessed
test("isOwnActivity flags ABOS's own page/app activity", () => {
  const ownEvent = { from: { id: "PAGE123" } };
  const otherEvent = { from: { id: "SOMEONE_ELSE" } };
  assert.equal(isOwnActivity(ownEvent, { pageId: "PAGE123" }), true);
  assert.equal(isOwnActivity(otherEvent, { pageId: "PAGE123" }), false);
  assert.equal(isOwnActivity(null, { pageId: "PAGE123" }), false);
});

// G) Invalid / unrecognizable registration-looking text should not match
test("invalid registration-like token -> SKIP", () => {
  const result = classifyPost("Row 12A seat assignment confirmed, see you at gate 7");
  assert.equal(result.status, "SKIPPED");
});

// H) Registry NOT_FOUND is a webhook-layer concern, not the classifier's;
// confirm the classifier never asserts a positive/negative verdict on the
// aircraft itself — only that identity information was found.
test("classifyPost never claims verification/safety in generated copy", () => {
  const result = classifyPost("For sale Cessna 172 N123AB, 2010, $180,000");
  assert.equal(result.status, "MATCHED");
  const banned = /\b(verified|safe|accident.free|best price)\b/i;
  assert.doesNotMatch(result.comment, banned);
});

test("extractRegistration returns null for plain text", () => {
  assert.equal(extractRegistration("just chatting about the weather"), null);
});

test("shouldAutoComment defaults to disabled", () => {
  const matched = classifyPost("For sale Cessna 172 N123AB, 2010, $180,000");
  assert.equal(shouldAutoComment(matched, {}), false);
  assert.equal(shouldAutoComment(matched, { enabled: true, minConfidence: 0.99 }), false);
  assert.equal(shouldAutoComment(matched, { enabled: true, minConfidence: 0.5 }), true);
});
