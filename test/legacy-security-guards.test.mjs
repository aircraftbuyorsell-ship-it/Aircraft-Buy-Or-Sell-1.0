import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../base44/functions/syncFaaToAtiCard/entry.ts", import.meta.url), "utf8");

test("FAA sync requires a privileged role and sanitizes failures", () => {
  assert.match(source, /isPrivileged/);
  assert.match(source, /Privileged role required/);
  assert.match(source, /FAA sync failed/);
  assert.doesNotMatch(source, /error: error\.message/);
});