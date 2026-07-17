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

test('package artifacts contain no common credential value patterns', () => {
  const artifactPaths = [
    'secret-registry.json',
    'templates/.env.example',
    'templates/.dev.vars.example',
    'cloudflare-bindings.json',
    'github-actions-environments.json',
    'provider-rotation-checklist.md',
    'alias-removal-plan.md',
    'evidence-report.md',
    'README.md'
  ];
  const material = artifactPaths.map(read).join('\n');
  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
    /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/
  ];
  for (const pattern of patterns) assert.doesNotMatch(material, pattern);
});

test('blocked, deferred and administration-only credentials cannot enter active runtime', () => {
  const prohibitedLifecycles = new Set(['blocked_pending_provider_confirmation', 'deferred', 'administration_only']);
  const prohibited = new Set(registry.entries
    .filter((entry) => prohibitedLifecycles.has(entry.lifecycle))
    .map((entry) => entry.canonical_name));
  const activeRuntime = new Set([
    ...parseTemplate('templates/.env.example').map(([name]) => name),
    ...parseTemplate('templates/.dev.vars.example').map(([name]) => name),
    ...bindings.pages.variables,
    ...bindings.pages.compatibility_variables,
    ...bindings.workers.variables,
    ...bindings.workers.secrets
  ]);
  for (const name of prohibited) assert.ok(!activeRuntime.has(name), `${name} leaked into active runtime`);
});

test('planned Cloudflare bindings are explicit and lifecycle-consistent', () => {
  const byName = new Map(registry.entries.map((entry) => [entry.canonical_name, entry]));
  const blocked = bindings.planned_bindings.blocked;
  const deferred = bindings.planned_bindings.deferred;
  assert.deepEqual(blocked.map((item) => item.name), ['SAKANA_API_KEY']);
  assert.deepEqual(deferred.map((item) => item.name), ['ALCHEMY_RPC_URL']);
  for (const item of [...blocked, ...deferred]) {
    assert.equal(byName.get(item.name)?.lifecycle, item.lifecycle);
    assert.ok(item.reason);
    assert.ok(item.activation_gate);
    assert.ok(bindings.excluded_from_runtime.includes(item.name));
  }
});

test('administration-only credentials are isolated from generic deployment environments', () => {
  const byName = new Map(registry.entries.map((entry) => [entry.canonical_name, entry]));
  for (const environmentName of actions.generic_deployment_environments) {
    const environment = actions.environments[environmentName];
    for (const name of [...environment.variables, ...environment.secrets]) {
      assert.notEqual(byName.get(name)?.lifecycle, 'administration_only', `${name} leaked into ${environmentName}`);
    }
    assert.ok(!environment.secrets.includes('SUPABASE_MANAGEMENT_TOKEN'));
  }
  const administration = actions.environments.migration_administration;
  assert.equal(administration.protected, true);
  assert.equal(administration.required_reviewers, true);
  assert.equal(administration.deployment_target, 'administration-only');
  assert.deepEqual(administration.secrets, ['SUPABASE_MANAGEMENT_TOKEN']);
});

test('administration-only registry environments exactly match Actions placement', () => {
  const administrationEntries = registry.entries.filter((entry) => entry.lifecycle === 'administration_only');
  assert.ok(administrationEntries.length > 0);
  for (const entry of administrationEntries) {
    const actualEnvironments = Object.entries(actions.environments)
      .filter(([, environment]) => [...environment.variables, ...environment.secrets].includes(entry.canonical_name))
      .map(([name]) => name)
      .sort();
    assert.deepEqual(actualEnvironments, [...entry.environments].sort(), `${entry.canonical_name} environment metadata drift`);
    for (const environmentName of actualEnvironments) {
      const environment = actions.environments[environmentName];
      assert.equal(environment.protected, true);
      assert.equal(environment.required_reviewers, true);
      assert.equal(environment.deployment_target, 'administration-only');
    }
  }
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
