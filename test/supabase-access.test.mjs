import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  ACCESS_STAGES,
  SupabaseAccessError,
  getSupabaseManagementToken,
  readSupabaseEnv,
  resolveSupabaseAccess,
} from "../base44/functions/_shared/supabaseAccess.mjs";

const envOf = (values) => ({ get: (key) => values[key] });
const PROJECT_REF = "bsvrcnyslqrotpllwfzm";

const keysResponse = (keys) => async () => ({ ok: true, json: async () => keys });

test("function secrets are used before any network call", async () => {
  let fetched = false;
  const access = await resolveSupabaseAccess({
    env: envOf({ SUPABASE_URL: "https://ref.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "service-key" }),
    projectRef: PROJECT_REF,
    getConnection: () => { throw new Error("connector must not be consulted"); },
    fetchImpl: () => { fetched = true; throw new Error("no network expected"); },
  });

  assert.equal(access.source, ACCESS_STAGES.ENV);
  assert.equal(access.restUrl, "https://ref.supabase.co");
  assert.equal(access.serviceKey, "service-key");
  assert.equal(fetched, false, "the secrets path must not touch the Management API");
});

test("the ABOS_-prefixed secret names are honoured too", () => {
  const { url, key } = readSupabaseEnv(envOf({
    ABOS_SUPABASE_URL: "https://alt.supabase.co",
    ABOS_SUPABASE_SERVICE_ROLE_KEY: "alt-key",
  }));
  assert.equal(url, "https://alt.supabase.co");
  assert.equal(key, "alt-key");
});

test("a trailing slash on the URL does not produce a double slash", async () => {
  const access = await resolveSupabaseAccess({
    env: envOf({ SUPABASE_URL: "https://ref.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "k" }),
    projectRef: PROJECT_REF,
  });
  assert.equal(access.restUrl, "https://ref.supabase.co");
});

test("an env that throws on read falls through instead of crashing", async () => {
  const access = await resolveSupabaseAccess({
    env: { get: () => { throw new Error("permission denied"); } },
    projectRef: PROJECT_REF,
    getConnection: async () => ({ accessToken: "token" }),
    fetchImpl: keysResponse([{ name: "service_role", api_key: "from-connector" }]),
  });
  assert.equal(access.source, ACCESS_STAGES.CONNECTOR);
});

test("the fallback addresses the project by ref instead of listing every project", async () => {
  const urls = [];
  await resolveSupabaseAccess({
    env: envOf({}),
    projectRef: PROJECT_REF,
    getConnection: async () => ({ accessToken: "token" }),
    fetchImpl: async (url) => { urls.push(url); return { ok: true, json: async () => [{ name: "service_role", api_key: "k" }] }; },
  });

  assert.deepEqual(urls, [`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`]);
  assert.ok(!urls.some((url) => url.endsWith("/v1/projects")), "project discovery is pure overhead when the ref is known");
});

test("the fallback builds the REST URL from the project ref", async () => {
  const access = await resolveSupabaseAccess({
    env: envOf({}),
    projectRef: PROJECT_REF,
    getConnection: async () => ({ accessToken: "token" }),
    fetchImpl: keysResponse([{ name: "anon", api_key: "a" }, { name: "service_role", api_key: "s" }]),
  });
  assert.equal(access.restUrl, `https://${PROJECT_REF}.supabase.co`);
  assert.equal(access.serviceKey, "s");
});

// Every failure below used to surface as the same "Aircraft data source
// unavailable" 502, which is not something you can debug from a log.
test("a connector failure names the connector stage", async () => {
  await assert.rejects(
    resolveSupabaseAccess({
      env: envOf({}),
      projectRef: PROJECT_REF,
      getConnection: async () => { throw new Error("token expired"); },
    }),
    (error) => {
      assert.ok(error instanceof SupabaseAccessError);
      assert.equal(error.stage, ACCESS_STAGES.CONNECTOR);
      assert.match(error.message, /token expired/);
      return true;
    },
  );
});

test("a connector returning no token is distinguished from one that throws", async () => {
  await assert.rejects(
    resolveSupabaseAccess({ env: envOf({}), projectRef: PROJECT_REF, getConnection: async () => ({}) }),
    (error) => error.stage === ACCESS_STAGES.CONNECTOR && /no access token/.test(error.message),
  );
});

test("a Management API error names the api_keys stage and its status", async () => {
  await assert.rejects(
    resolveSupabaseAccess({
      env: envOf({}),
      projectRef: PROJECT_REF,
      getConnection: async () => ({ accessToken: "token" }),
      fetchImpl: async () => ({ ok: false, status: 401 }),
    }),
    (error) => error.stage === ACCESS_STAGES.API_KEYS && /401/.test(error.message),
  );
});

test("a project with no service_role key names that stage", async () => {
  await assert.rejects(
    resolveSupabaseAccess({
      env: envOf({}),
      projectRef: PROJECT_REF,
      getConnection: async () => ({ accessToken: "token" }),
      fetchImpl: keysResponse([{ name: "anon", api_key: "a" }]),
    }),
    (error) => error.stage === ACCESS_STAGES.SERVICE_ROLE_KEY,
  );
});

test("no secrets and no connector is reported as a configuration problem", async () => {
  await assert.rejects(
    resolveSupabaseAccess({ env: envOf({}), projectRef: PROJECT_REF }),
    (error) => error.stage === ACCESS_STAGES.ENV && /SUPABASE_SERVICE_ROLE_KEY/.test(error.message),
  );
});

test("no secret ever appears in an error message", async () => {
  const error = await resolveSupabaseAccess({
    env: envOf({}),
    projectRef: PROJECT_REF,
    getConnection: async () => ({ accessToken: "super-secret-token" }),
    fetchImpl: async () => ({ ok: false, status: 403 }),
  }).catch((e) => e);
  assert.ok(!error.message.includes("super-secret-token"));
});

// The compliance enrichment already degrades to an empty list, so a connector
// problem must cost the enrichment rather than the whole aircraft lookup.
test("the management token is best-effort and never throws", async () => {
  assert.equal(await getSupabaseManagementToken(async () => { throw new Error("down"); }), null);
  assert.equal(await getSupabaseManagementToken(async () => ({})), null);
  assert.equal(await getSupabaseManagementToken(undefined), null);
  assert.equal(await getSupabaseManagementToken(async () => ({ accessToken: "t" })), "t");
});

test("aircraftDataHub no longer lists every project on each request", async () => {
  const source = await readFile(new URL("../base44/functions/aircraftDataHub/entry.ts", import.meta.url), "utf8");
  assert.ok(!source.includes("'https://api.supabase.com/v1/projects'"), "project discovery must be gone");
  assert.match(source, /resolveSupabaseAccess\(/);
  assert.match(source, /stage: error\?\.stage/, "a 502 must name the stage that failed");
});
