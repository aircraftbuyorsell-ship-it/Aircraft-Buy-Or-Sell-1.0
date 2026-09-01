import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

/**
 * The St. Elmo Cloudflare Worker forwards to NVIDIA using the account's own API
 * key, so every call spends money. It shipped with no inbound check at all:
 * `access-control-allow-origin: "*"`, caller-supplied `messages`, streaming, no
 * cap on max_tokens — and src/lib/abosAgent.js hardcoded its URL into the
 * browser bundle. Anyone reading the bundle could spend the quota.
 *
 * These guard the two halves of the fix: the Worker authenticates its callers,
 * and no browser code calls it directly (the browser cannot hold the secret, so
 * it goes through the authenticated Base44 function instead).
 */

const workers = [
  ["st-elmo", await readFile(new URL("../st-elmo/index.js", import.meta.url), "utf8")],
  ["workers/st-elmo", await readFile(new URL("../workers/st-elmo/index.js", import.meta.url), "utf8")],
];

for (const [name, source] of workers) {
  test(`${name} authorizes before spending the NVIDIA key`, () => {
    const authorizeAt = source.indexOf("await authorize(request, env)");
    // The two workers quote the header name differently, so match either form.
    const upstreamAt = source.search(/["']?authorization["']?\s*:\s*`Bearer \$\{env\.NVIDIA_API_KEY\}`/);
    assert.ok(authorizeAt !== -1, "the completions route must authorize the caller");
    assert.ok(upstreamAt !== -1, "expected the upstream NVIDIA call to be found");
    assert.ok(authorizeAt < upstreamAt, "authorization must happen before the upstream call");
  });

  test(`${name} fails closed when the secret is unset`, () => {
    assert.match(source, /if \(!env\.ST_ELMO_GATEWAY_SECRET\)/, "an unset secret must be rejected, not bypassed");
    assert.match(source, /missing_gateway_secret/);
    assert.ok(
      !/ST_ELMO_GATEWAY_SECRET\s*\)\s*return null/.test(source),
      "an unset secret must never fall open",
    );
  });

  test(`${name} compares the secret without leaking timing`, () => {
    assert.match(source, /timingSafeEqual/);
    assert.ok(
      !/presented === env\.ST_ELMO_GATEWAY_SECRET/.test(source),
      "a plain === comparison leaks the secret by timing",
    );
  });

  test(`${name} rejects a missing or wrong bearer with 401`, () => {
    assert.match(source, /"Unauthorized" \}, 401\)|error: "Unauthorized" \}, 401/);
  });
}

test("the worker entry point resolves from its own config directory", async () => {
  for (const path of ["../st-elmo/wrangler.jsonc", "../workers/st-elmo/wrangler.jsonc"]) {
    const config = await readFile(new URL(path, import.meta.url), "utf8");
    const main = /"main"\s*:\s*"([^"]+)"/.exec(config)?.[1];
    assert.equal(main, "index.js", `${path}: wrangler resolves main relative to the config file, not the repo root`);
  }
});

test("no browser code calls the St. Elmo Worker directly", async () => {
  const offenders = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, dir);
      if (entry.isDirectory()) await walk(url);
      else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        const source = await readFile(url, "utf8");
        if (source.includes("abos-st-elmo.aircraftbuyorsell.workers.dev")) offenders.push(entry.name);
      }
    }
  }
  await walk(new URL("../src/", import.meta.url));
  assert.deepEqual(offenders, [], "the browser cannot hold the shared secret — route via stElmoReasoning");
});
