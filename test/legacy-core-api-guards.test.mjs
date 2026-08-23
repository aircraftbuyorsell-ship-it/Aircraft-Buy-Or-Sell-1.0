import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../base44/functions/abosCoreApi/entry.ts", import.meta.url), "utf8");

test("legacy Core API does not accept body API keys or return private listings", () => {
  assert.match(source, /req\.headers\.get\('x-abos-key'\)/);
  assert.doesNotMatch(source, /body\.api_key/);
  assert.match(source, /listing\.visibility !== 'public'/);
  assert.match(source, /listing\.status !== 'active'/);
  assert.doesNotMatch(source, /error: error\.message/);
});