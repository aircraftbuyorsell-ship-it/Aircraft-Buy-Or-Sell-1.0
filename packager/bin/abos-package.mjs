#!/usr/bin/env node
/**
 * ABOS White-Label package builder CLI.
 *
 * Assembles the customer-facing distribution (UI kit + SDK + installer +
 * tenant config + docs) into a deterministic archive:
 *
 *   node packager/bin/abos-package.mjs --tenant skydeals_europe --version 1.0.0
 *     -> dist-packages/ABOS-SkyDeals-Europe-v1.0.0.zip
 *
 * What goes in is defined by SOURCE_SETS below and validated by
 * assertPackageSafe(): no credentials, no server-side proprietary logic.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { argv, exit, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

import { generatePackage } from '../lib/build.mjs';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const DEFAULT_OUT_DIR = path.join(REPO_ROOT, 'dist-packages');

/**
 * Source directories copied into the package, and where they land inside it.
 * Deliberately explicit rather than a glob of the repo: an accidental
 * wildcard is exactly how server-side code ends up in a customer download.
 */
const SOURCE_SETS = [
  { from: 'src/white-label', to: 'ui', description: 'White-Label UI Kit and SDK' },
  { from: 'installer', to: 'installer', description: 'Installer' },
];

const DOC_FILES = [
  { from: 'docs/white-label/README.md', to: 'README.md' },
  { from: 'docs/white-label/INSTALLATION.md', to: 'docs/INSTALLATION.md' },
  { from: 'docs/white-label/PARTNER-INTEGRATION.md', to: 'docs/PARTNER-INTEGRATION.md' },
  { from: 'docs/white-label/SECURITY.md', to: 'docs/SECURITY.md' },
];

function parseArgs(args) {
  const options = { tenant: null, version: '1.0.0', platform: 'next-app-router', outDir: DEFAULT_OUT_DIR, licenseId: null, help: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--tenant') options.tenant = args[++i];
    else if (arg === '--version') options.version = args[++i];
    else if (arg === '--platform') options.platform = args[++i];
    else if (arg === '--license-id') options.licenseId = args[++i];
    else if (arg === '--out') options.outDir = path.resolve(args[++i]);
  }
  return options;
}

function printHelp() {
  stdout.write(`
ABOS White-Label Package Builder

Usage
  abos-package --tenant <tenant_id> [options]

Options
  --tenant <id>       Tenant id, e.g. skydeals_europe (required)
  --version <semver>  Package version (default 1.0.0)
  --platform <id>     Target platform for the bundled adapter (default next-app-router)
  --license-id <id>   License id to record in the package manifest
  --out <dir>         Output directory (default dist-packages/)
  --help, -h          Show this help

Packages are deterministic: identical inputs produce an identical archive
and therefore an identical SHA-256, so a published checksum is meaningful.
`);
}

/** Recursively collects files under a directory, skipping noise. */
async function collectFiles(absDir, relBase = '') {
  const collected = [];
  let entries;
  try {
    entries = await readdir(absDir, { withFileTypes: true });
  } catch {
    return collected;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const abs = path.join(absDir, entry.name);
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      collected.push(...(await collectFiles(abs, rel)));
    } else if (entry.isFile()) {
      collected.push({ abs, rel });
    }
  }
  return collected;
}

async function main() {
  const options = parseArgs(argv.slice(2));
  if (options.help) { printHelp(); return 0; }

  if (!options.tenant) {
    stdout.write('Error: --tenant is required.\n\nRun with --help for usage.\n');
    return 1;
  }

  // Tenant presentation config ships in the package; the authoritative
  // license/capability grant does not — it stays server-side.
  const tenantConfigPath = path.join(REPO_ROOT, 'src/white-label/tenants', `${options.tenant}.json`);
  let tenantConfig;
  try {
    tenantConfig = JSON.parse(await readFile(tenantConfigPath, 'utf8'));
  } catch {
    stdout.write(`Error: no tenant config found at src/white-label/tenants/${options.tenant}.json\n`);
    return 1;
  }

  const entries = [];
  for (const set of SOURCE_SETS) {
    const files = await collectFiles(path.join(REPO_ROOT, set.from));
    if (files.length === 0) {
      stdout.write(`Error: source set '${set.from}' is empty — refusing to build an incomplete package.\n`);
      return 1;
    }
    for (const file of files) {
      entries.push({ path: `${set.to}/${file.rel}`, contents: await readFile(file.abs) });
    }
  }

  for (const doc of DOC_FILES) {
    try {
      entries.push({ path: doc.to, contents: await readFile(path.join(REPO_ROOT, doc.from), 'utf8') });
    } catch {
      // Docs are additive; a missing one is reported but not fatal, so a
      // package can still be cut while documentation is in flight.
      stdout.write(`  note: ${doc.from} not found, omitted from package\n`);
    }
  }

  entries.push({
    path: 'tenant.json',
    contents: `${JSON.stringify(tenantConfig, null, 2)}\n`,
  });

  let result;
  try {
    result = generatePackage({
      tenant: { tenant_id: options.tenant, display_name: tenantConfig.display_name },
      license: { id: options.licenseId || `unissued_${options.tenant}` },
      version: options.version,
      platform: options.platform,
      entries,
    });
  } catch (error) {
    stdout.write(`\nPackage build refused: ${error.message}\n\n`);
    return 1;
  }

  await mkdir(options.outDir, { recursive: true });
  const outPath = path.join(options.outDir, result.fileName);
  await writeFile(outPath, result.buffer);
  await writeFile(`${outPath}.sha256`, `${result.sha256}  ${result.fileName}\n`);

  stdout.write(`\n✓ ${result.fileName}\n`);
  stdout.write(`  path:   ${outPath}\n`);
  stdout.write(`  files:  ${result.manifest.file_count}\n`);
  stdout.write(`  bytes:  ${result.buffer.length}\n`);
  stdout.write(`  sha256: ${result.sha256}\n\n`);
  return 0;
}

main()
  .then((code) => exit(code))
  .catch((error) => {
    stdout.write(`\nPackage builder crashed: ${error?.message || error}\n`);
    exit(1);
  });
