import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { createZipBlob, crc32, normalizeEntryPath } from "../src/utils/browserZip.js";

const run = promisify(execFile);

async function hasUnzip() {
  try {
    await run("unzip", ["-v"]);
    return true;
  } catch {
    return false;
  }
}

test("crc32 matches the known check value for '123456789'", () => {
  // Standard CRC-32 check vector, so this cannot drift from the packager's.
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
});

test("normalizeEntryPath strips traversal and absolute prefixes", () => {
  assert.equal(normalizeEntryPath("./abos.config.json"), "abos.config.json");
  assert.equal(normalizeEntryPath("/etc/passwd"), "etc/passwd");
  assert.equal(normalizeEntryPath("../../secrets/key"), "secrets/key");
  assert.equal(normalizeEntryPath("a\\b\\c.js"), "a/b/c.js");
  assert.throws(() => normalizeEntryPath("../.."), /Invalid zip entry path/);
});

test("rejects empty input and duplicate paths", () => {
  assert.throws(() => createZipBlob([]), /at least one entry/);
  assert.throws(
    () => createZipBlob([{ path: "a.txt", contents: "x" }, { path: "./a.txt", contents: "y" }]),
    /Duplicate entry/,
  );
});

test("output is deterministic for the same input", async () => {
  const entries = [
    { path: "abos.config.json", contents: '{"version":1}\n' },
    { path: "abos/adapter.js", contents: "export default 1;\n" },
  ];
  const a = Buffer.from(await createZipBlob(entries).arrayBuffer());
  // Reversed input must still produce identical bytes — entries are sorted.
  const b = Buffer.from(await createZipBlob([...entries].reverse()).arrayBuffer());
  assert.deepEqual(a, b);
});

test("produces an archive real unzip can extract", async (t) => {
  if (!(await hasUnzip())) {
    t.skip("unzip not available in this environment");
    return;
  }

  const dir = await mkdtemp(path.join(tmpdir(), "abos-zip-"));
  try {
    const config = '{\n  "version": 1,\n  "tenant_id": "skydeals"\n}\n';
    const adapter = "// ABOS adapter\nexport const ok = true;\n";
    const blob = createZipBlob([
      { path: "abos.config.json", contents: config },
      { path: "abos/adapter.js", contents: adapter },
      { path: ".env.abos.example", contents: "ABOS_TENANT_KEY=\n" },
    ]);

    const archive = path.join(dir, "kit.zip");
    await writeFile(archive, Buffer.from(await blob.arrayBuffer()));

    // -t verifies CRCs of every entry; a malformed archive fails here.
    await run("unzip", ["-t", archive]);
    await run("unzip", ["-q", archive, "-d", path.join(dir, "out")]);

    assert.equal(await readFile(path.join(dir, "out", "abos.config.json"), "utf8"), config);
    assert.equal(await readFile(path.join(dir, "out", "abos", "adapter.js"), "utf8"), adapter);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
