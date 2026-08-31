import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const hub = await readFile(
  new URL("../base44/functions/aircraftDataHub/entry.ts", import.meta.url),
  "utf8",
);

// Pins the decision in docs/DATA-SOURCE-OF-TRUTH.md: Supabase (engineRef, from
// faa_engine) resolves before Base44's EngineSpec copy. A future edit that puts
// engineSpec first would silently make the stale copy win again.
for (const field of ["engine_mfr", "engine_model", "engine_type"]) {
  test(`${field} resolves from Supabase before the Base44 copy`, () => {
    const line = hub.split("\n").find((l) => l.trim().startsWith(`${field}:`));
    assert.ok(line, `${field} not found`);

    const supabaseAt = line.indexOf("engineRef?.");
    const base44At = line.indexOf("engineSpec?.");
    assert.ok(supabaseAt !== -1, `${field} no longer reads engineRef`);
    if (base44At !== -1) {
      assert.ok(
        supabaseAt < base44At,
        `${field} puts the Base44 EngineSpec copy ahead of Supabase`,
      );
    }
  });
}

test("horsepower and thrust stay Supabase-first", () => {
  for (const field of ["horsepower", "thrust"]) {
    const line = hub.split("\n").find((l) => l.trim().startsWith(`${field}:`));
    assert.ok(line, `${field} not found`);
    assert.match(line, /engineRef\?\./, `${field} no longer reads Supabase first`);
  }
});

test("the TBO exception is documented where it is made", () => {
  // faa_engine has no TBO column, so this one field cannot be Supabase-first
  // yet. The comment must survive, or the exception looks like an oversight.
  const idx = hub.indexOf("engine_tbo_hours:");
  assert.ok(idx !== -1, "engine_tbo_hours not found");
  assert.match(hub.slice(Math.max(0, idx - 300), idx), /no TBO column/);
});
