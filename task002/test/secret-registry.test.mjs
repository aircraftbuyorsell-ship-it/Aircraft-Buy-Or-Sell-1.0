import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const registry = json('secret-registry.json');
const bindings = json('cloudflare-bindings.json');
const actions = json('github-actions-environments.json');

function parseTemplate(path) {
  return read(path).split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const split = line.indexOf('=');
      assert.ok(split > 0, `invalid template line: ${line}`);
      return [line.slice(0, split), line.slice(split + 1)];
    });
}

test('registry uses unique normalized canonical names and contains no value fields', () => {
  const names = registry.entries.map((entry) => entry.canonical_name);
  assert.equal(new Set(names).size, names.length);
  for (const entry of registry.entries) {
    assert.match(entry.canonical_name, /^[A-Z][A-Z0-9_]*$/);
    assert.ok(!Object.hasOwn(entry, 'value'));
    assert.ok(!registry.policy.forbidden_canonical_names.includes(entry.canonical_name));
    assert.ok(entry.owner_role);
    assert.ok(entry.target_store);
  }
});

test('ambiguous generic alias has no invented replacement', () => {
  const alias = registry.ambiguous_aliases.find((item) => item.source_name === 'Default_API_Key');
  assert.ok(alias);
  assert.equal(alias.status, 'prohibited');
  assert.equal(alias.replacement, null);
});

test('browser template contains only declared non-secret browser/build bindings', () => {
  const rows = parseTemplate('templates/.env.example');
  const declared = new Map(registry.entries.map((entry) => [entry.canonical_name, entry]));
  for (const [name, value] of rows) {
    const entry = declared.get(name);
    assert.ok(entry, `undeclared browser name: ${name}`);
    assert.notEqual(entry.kind, 'secret');
    assert.ok(['cloudflare_pages_variable', 'cloudflare_build_variable'].includes(entry.target_store));
    assert.match(value, /^<SET_[A-Z0-9_]+>$/);
  }
  assert.equal(new Set(rows.map(([name]) => name)).size, rows.length);
});

test('dev vars use placeholders and exactly the Worker binding names', () => {
  const rows = parseTemplate('templates/.dev.vars.example');
  const expected = new Set([...bindings.workers.variables, ...bindings.workers.secrets]);
  assert.deepEqual(new Set(rows.map(([name]) => name)), expected);
  for (const [, value] of rows) assert.match(value, /^<SET_[A-Z0-9_]+>$/);
});

test('Cloudflare bindings are consistent with registry stores', () => {
  const byName = new Map(registry.entries.map((entry) => [entry.canonical_name, entry]));
  for (const name of bindings.pages.variables) assert.equal(byName.get(name)?.target_store, 'cloudflare_pages_variable');
  for (const name of bindings.pages.compatibility_variables) {
    assert.ok(['cloudflare_pages_variable', 'cloudflare_build_variable'].includes(byName.get(name)?.target_store));
    assert.equal(byName.get(name)?.lifecycle, 'compatibility');
  }
  for (const name of bindings.workers.variables) assert.equal(byName.get(name)?.target_store, 'cloudflare_worker_variable');
  for (const name of bindings.workers.secrets) assert.equal(byName.get(name)?.target_store, 'cloudflare_worker_secret');
});

test('GitHub Actions matrix references declared GitHub-owned names only', () => {
  const byName = new Map(registry.entries.map((entry) => [entry.canonical_name, entry]));
  for (const environment of Object.values(actions.environments)) {
    for (const name of environment.variables) {
      const entry = byName.get(name);
      assert.ok(entry, `undeclared Actions variable: ${name}`);
      assert.ok(['github_environment_variable', 'cloudflare_pages_variable'].includes(entry.target_store));
    }
    for (const name of environment.secrets) {
      assert.equal(byName.get(name)?.target_store, 'github_environment_secret');
    }
  }
  assert.equal(actions.environments.production.protected, true);
  assert.equal(actions.environments.production.required_reviewers, true);
});

test('templates contain no common credential value patterns', () => {
  const material = [read('templates/.env.example'), read('templates/.dev.vars.example')].join('\n');
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
    /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/
  ];
  for (const pattern of patterns) assert.doesNotMatch(material, pattern);
});

test('deferred escrow credentials are absent from active templates and runtime bindings', () => {
  const active = [
    ...parseTemplate('templates/.env.example').map(([name]) => name),
    ...parseTemplate('templates/.dev.vars.example').map(([name]) => name),
    ...bindings.workers.variables,
    ...bindings.workers.secrets
  ];
  assert.ok(!active.includes('ESCROW_API_KEY'));
  assert.ok(!active.includes('ESCROW_API_USER'));
});
