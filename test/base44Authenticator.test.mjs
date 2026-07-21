import test from "node:test";
import assert from "node:assert/strict";
import { createBase44Authenticator } from "../base44/functions/abosCoreApiV1/adapters/base44Authenticator.mjs";

const ACTIVE_KEY = {
  id: "internal-key-record",
  status: "active",
  scopes: ["search:read", "listing:read"],
  plan: "partner",
  expires_at: "2030-01-01T00:00:00.000Z",
};

function fakeBase44(records = [ACTIVE_KEY]) {
  const calls = [];
  return {
    calls,
    client: {
      asServiceRole: {
        entities: {
          ApiKey: {
            async filter(...args) {
              calls.push(args);
              return records;
            },
          },
        },
      },
    },
  };
}

const hashCredential = async (value) => `hash:${value}`;
const fixedNow = () => Date.parse("2026-07-14T00:00:00.000Z");

test("authenticator accepts one documented API key transport", async () => {
  const fake = fakeBase44();
  const authenticate = createBase44Authenticator({ base44: fake.client, hashCredential, now: fixedNow });
  const principal = await authenticate(new Request("https://example.test", {
    headers: { "X-ABOS-API-Key": "secret-key" },
  }));

  assert.equal(principal.type, "api_key");
  assert.deepEqual(principal.scopes, ["listing:read", "listings:read", "search:read"]);
  assert.deepEqual(fake.calls[0], [{ key_hash: "hash:secret-key" }, undefined, 1]);
});

test("authenticator accepts bearer transport", async () => {
  const fake = fakeBase44();
  const authenticate = createBase44Authenticator({ base44: fake.client, hashCredential, now: fixedNow });
  const principal = await authenticate(new Request("https://example.test", {
    headers: { Authorization: "Bearer secret-key" },
  }));
  assert.equal(principal.plan, "partner");
});

test("authenticator rejects undocumented legacy header", async () => {
  const fake = fakeBase44();
  const authenticate = createBase44Authenticator({ base44: fake.client, hashCredential, now: fixedNow });
  await assert.rejects(
    authenticate(new Request("https://example.test", { headers: { "X-ABOS-Key": "legacy" } })),
    (error) => error.code === "AUTHENTICATION_REQUIRED" && error.status === 401,
  );
  assert.equal(fake.calls.length, 0);
});

test("authenticator rejects multiple credential transports", async () => {
  const fake = fakeBase44();
  const authenticate = createBase44Authenticator({ base44: fake.client, hashCredential, now: fixedNow });
  await assert.rejects(
    authenticate(new Request("https://example.test", {
      headers: { Authorization: "Bearer first", "X-ABOS-API-Key": "second" },
    })),
    (error) => error.code === "MULTIPLE_CREDENTIALS" && error.status === 400,
  );
  assert.equal(fake.calls.length, 0);
});

test("authenticator rejects unsupported authorization schemes", async () => {
  const fake = fakeBase44();
  const authenticate = createBase44Authenticator({ base44: fake.client, hashCredential, now: fixedNow });
  await assert.rejects(
    authenticate(new Request("https://example.test", { headers: { Authorization: "Basic abc" } })),
    (error) => error.code === "INVALID_AUTHORIZATION_SCHEME" && error.status === 401,
  );
});

test("authenticator rejects expired and malformed expiry records", async () => {
  for (const expires_at of ["2020-01-01T00:00:00.000Z", "not-a-date"]) {
    const fake = fakeBase44([{ ...ACTIVE_KEY, expires_at }]);
    const authenticate = createBase44Authenticator({ base44: fake.client, hashCredential, now: fixedNow });
    await assert.rejects(
      authenticate(new Request("https://example.test", { headers: { "X-ABOS-API-Key": "secret" } })),
      (error) => error.code === "INVALID_API_KEY" && error.status === 401,
    );
  }
});

test("authenticator fails closed on invalid identity-store responses", async () => {
  const fake = fakeBase44(null);
  const authenticate = createBase44Authenticator({ base44: fake.client, hashCredential, now: fixedNow });
  await assert.rejects(
    authenticate(new Request("https://example.test", { headers: { "X-ABOS-API-Key": "secret" } })),
    (error) => error.code === "IDENTITY_STORE_UNAVAILABLE" && error.status === 503,
  );
});
