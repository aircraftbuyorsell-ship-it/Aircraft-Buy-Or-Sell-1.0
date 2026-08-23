import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { PUBLIC_LISTING_SELECT } from "../src/supabase-repository.mjs";

test("public read-row schema rejects internal fields and accepts the minimal public row", async () => {
  const schema = JSON.parse(await readFile(new URL("../read-model/public-listing-row.schema.json", import.meta.url), "utf8"));
  const ajv = new Ajv2020({ strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const row = {
    public_listing_id: "lst_0123456789abcdef01234567",
    public_aircraft_id: "ac_0123456789abcdef01234567",
    make: "Cessna", model: "Citation Latitude", status: "active", visibility: "public",
  };
  assert.equal(validate(row), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...row, owner: "internal-owner" }), false);
  assert.equal(validate({ ...row, id: "internal-id" }), false);
  assert.equal(validate({ ...row, source_record_id: "0123456789abcdef01234567" }), false);
  assert.equal(validate({ ...row, visibility: "private" }), false);
});

test("repository projection exactly matches the public row schema properties", async () => {
  const schema = JSON.parse(await readFile(new URL("../read-model/public-listing-row.schema.json", import.meta.url), "utf8"));
  assert.deepEqual(PUBLIC_LISTING_SELECT.split(",").sort(), Object.keys(schema.properties).sort());
});

test("database preflight is read-only", async () => {
  const sql = await readFile(new URL("../read-model/preflight.sql", import.meta.url), "utf8");
  const statements = sql.replace(/^\s*--.*$/gm, "").split(";").map((statement) => statement.trim()).filter(Boolean);
  assert.ok(statements.length >= 6);
  assert.ok(statements.every((statement) => /^select\b/i.test(statement)));
  const executable = statements.join(";\n");
  assert.match(executable, /abos_public_listings_v1/);
});
