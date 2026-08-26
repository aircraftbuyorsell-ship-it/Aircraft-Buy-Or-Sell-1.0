import test from "node:test";
import assert from "node:assert/strict";
import {
  AbosApiError,
  joinUrl,
  unwrapResponse,
  createBrowserClient,
  createServerClient,
} from "../src/white-label/client.js";

/** Minimal fetch stub that records calls and returns a canned envelope. */
function stubFetch(envelope, { status = 200, json = true } = {}) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init, body: init?.body ? JSON.parse(init.body) : null });
    return {
      status,
      json: async () => {
        if (!json) throw new Error("not json");
        return envelope;
      },
    };
  };
  impl.calls = calls;
  return impl;
}

const successEnvelope = { status: "success", data: { healthy: true } };

test("joinUrl handles slashes without doubling or dropping them", () => {
  assert.equal(joinUrl("https://x.test", "functions/tenantCoreApi"), "https://x.test/functions/tenantCoreApi");
  assert.equal(joinUrl("https://x.test/", "/functions/tenantCoreApi"), "https://x.test/functions/tenantCoreApi");
  assert.equal(joinUrl("https://x.test///", "///a"), "https://x.test/a");
  assert.equal(joinUrl("https://x.test", ""), "https://x.test");
  assert.equal(joinUrl("", "api/abos"), "/api/abos");
});

test("unwrapResponse returns data on success and throws a typed error otherwise", () => {
  assert.deepEqual(unwrapResponse({ status: "success", data: { a: 1 } }), { a: 1 });

  assert.throws(
    () => unwrapResponse({ status: "error", error: { code: "forbidden", message: "nope" } }, { status: 403, endpoint: "ati.score" }),
    (err) => {
      assert.ok(err instanceof AbosApiError);
      assert.equal(err.code, "forbidden");
      assert.equal(err.status, 403);
      assert.equal(err.endpoint, "ati.score");
      assert.equal(err.message, "nope");
      return true;
    },
  );

  // A malformed/empty payload must still throw, not return undefined.
  assert.throws(() => unwrapResponse(null), AbosApiError);
  assert.throws(() => unwrapResponse({}), AbosApiError);
});

test("browser client has no way to accept or send a tenant credential", async () => {
  const fetchImpl = stubFetch(successEnvelope);
  // Even if a caller tries to smuggle a key through the options bag, it must
  // not reach the wire — the browser client simply has no such parameter.
  const client = createBrowserClient({ adapterUrl: "/api/abos", fetchImpl, apiKey: "abos_tenant_leak" });
  await client.health();

  const sent = fetchImpl.calls[0];
  const serialized = JSON.stringify(sent);
  assert.doesNotMatch(serialized, /abos_tenant_leak/, "credential must never appear in a browser request");
  assert.equal(sent.init.headers["x-abos-tenant-key"], undefined);
  assert.equal(sent.url, "/api/abos");
  assert.equal(sent.body.endpoint, "health");
});

test("browser client posts the documented envelope to the customer's adapter", async () => {
  const fetchImpl = stubFetch({ status: "success", data: { total: 0, listings: [] } });
  const client = createBrowserClient({ adapterUrl: "https://customer.test/api/abos/", fetchImpl });
  await client.listListings({ manufacturer: "Cessna", limit: 5 });

  const sent = fetchImpl.calls[0];
  assert.equal(sent.url, "https://customer.test/api/abos");
  assert.deepEqual(sent.body, { endpoint: "listings.list", params: { manufacturer: "Cessna", limit: 5 } });
  assert.equal(sent.init.method, "POST");
  assert.equal(sent.init.headers["Content-Type"], "application/json");
});

test("server client sends the tenant key as a header, never in the body or URL", async () => {
  const fetchImpl = stubFetch(successEnvelope);
  const client = createServerClient({
    apiKey: "abos_tenant_" + "a".repeat(48),
    baseUrl: "https://abos.test",
    fetchImpl,
  });
  await client.whoami();

  const sent = fetchImpl.calls[0];
  assert.equal(sent.init.headers["x-abos-tenant-key"], "abos_tenant_" + "a".repeat(48));
  assert.equal(sent.url, "https://abos.test/functions/tenantCoreApi");
  assert.doesNotMatch(sent.url, /abos_tenant_/, "credential must never be in a URL (they land in logs)");
  assert.doesNotMatch(JSON.stringify(sent.body), /abos_tenant_/, "credential must never be in the body");
});

test("server client refuses to construct without its required inputs", () => {
  assert.throws(() => createServerClient({ baseUrl: "https://abos.test" }), /requires a tenant API key/);
  assert.throws(() => createServerClient({ apiKey: "k" }), /requires the ABOS base URL/);
});

test("server client refuses to run in a browser-like environment", () => {
  const originalWindow = globalThis.window;
  try {
    globalThis.window = { document: {} };
    assert.throws(
      () => createServerClient({ apiKey: "k", baseUrl: "https://abos.test" }),
      (err) => {
        assert.ok(err instanceof AbosApiError);
        assert.match(err.message, /must not run in a browser/);
        return true;
      },
      "a bundler pulling this into client code must fail loudly, not ship the key",
    );
    // The escape hatch exists for SSR/test environments that define window.
    assert.doesNotThrow(() =>
      createServerClient({ apiKey: "k", baseUrl: "https://abos.test", allowBrowser: true }),
    );
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test("clients surface API errors as AbosApiError with status and code intact", async () => {
  const fetchImpl = stubFetch(
    { status: "error", error: { code: "capability_not_licensed", message: "Capability not included in this license" } },
    { status: 403 },
  );
  const client = createBrowserClient({ fetchImpl });
  await assert.rejects(
    () => client.valuate({ registration: "N123AB" }),
    (err) => {
      assert.ok(err instanceof AbosApiError);
      assert.equal(err.status, 403);
      assert.equal(err.code, "capability_not_licensed");
      assert.equal(err.endpoint, "valuate");
      return true;
    },
  );
});

test("clients turn a non-JSON response into a typed error rather than crashing", async () => {
  const fetchImpl = stubFetch(null, { status: 502, json: false });
  const client = createBrowserClient({ fetchImpl });
  await assert.rejects(
    () => client.health(),
    (err) => {
      assert.ok(err instanceof AbosApiError);
      assert.equal(err.status, 502);
      assert.match(err.message, /non-JSON/);
      return true;
    },
  );
});

test("clients expose the same endpoint surface so an adapter can proxy generically", () => {
  const browser = createBrowserClient({ fetchImpl: stubFetch(successEnvelope) });
  const server = createServerClient({
    apiKey: "k",
    baseUrl: "https://abos.test",
    fetchImpl: stubFetch(successEnvelope),
    allowBrowser: true,
  });
  assert.deepEqual(Object.keys(browser).sort(), Object.keys(server).sort());
});
