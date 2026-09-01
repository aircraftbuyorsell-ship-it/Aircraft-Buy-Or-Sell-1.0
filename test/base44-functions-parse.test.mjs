import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

/**
 * The Base44 Deno functions have no static checking at all: eslint.config.js
 * scopes itself to the Vite app, so `npx eslint base44/functions/...` reports
 * "File ignored because no matching configuration was supplied", and the Vite
 * build never sees them either. A syntax error in one of these 150+ server
 * functions therefore ships and fails at runtime, on a live request.
 *
 * This parses each one. It is not a type check — it is the floor: the file must
 * at least be syntactically valid before it can be deployed.
 *
 * It also catches redeclaration, which parsing alone does not: `const access`
 * followed by `let access` in the same scope is a semantic error, so the parser
 * accepts it happily and Deno throws on the first request. Full type checking is
 * not on the table here (Deno globals and `npm:` specifiers would drown it), so
 * the program is built with no lib and no resolution and only redeclaration
 * diagnostics are read — the rest is expected noise.
 */

// 2451 cannot redeclare block-scoped variable; 2300 duplicate identifier;
// 2403 conflicting variable declaration.
const REDECLARATION_CODES = new Set([2451, 2300, 2403]);

const functionsDir = new URL("../base44/functions/", import.meta.url);

async function entryFiles() {
  const entries = await readdir(functionsDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "_shared") continue;
    const url = new URL(`${entry.name}/entry.ts`, functionsDir);
    try {
      files.push([entry.name, url, await readFile(url, "utf8")]);
    } catch {
      // Not every directory carries an entry.ts; only parse what exists.
    }
  }
  return files;
}

const files = await entryFiles();

test("there are Base44 functions to check", () => {
  assert.ok(files.length > 50, `expected the function set, found ${files.length}`);
});

for (const [name, url, source] of files) {
  test(`${name}/entry.ts parses`, () => {
    const sourceFile = ts.createSourceFile(String(url), source, ts.ScriptTarget.ESNext, true);
    const diagnostics = sourceFile.parseDiagnostics || [];
    const details = diagnostics.map((diagnostic) => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
      return `${line + 1}:${character + 1} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`;
    });
    assert.deepEqual(details, [], `${name}/entry.ts has syntax errors`);
  });
}

test("no Base44 function redeclares a variable in the same scope", () => {
  const paths = files.map(([, url]) => fileURLToPath(url));
  const program = ts.createProgram(paths, {
    noResolve: true,
    allowJs: true,
    skipLibCheck: true,
    noLib: true,
    types: [],
  });

  const offenders = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => REDECLARATION_CODES.has(diagnostic.code) && diagnostic.file)
    .map((diagnostic) => {
      const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const relative = diagnostic.file.fileName.split("/base44/functions/")[1] || diagnostic.file.fileName;
      return `${relative}:${line + 1} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`;
    });

  assert.deepEqual([...new Set(offenders)], []);
});
