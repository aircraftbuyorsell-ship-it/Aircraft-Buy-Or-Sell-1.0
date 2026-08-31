#!/usr/bin/env node
/**
 * ABOS White-Label Installer.
 *
 * Drives the install lifecycle in installer/lib/steps.mjs, which holds all the
 * logic; this file is the I/O layer (prompts, filesystem, network) around it.
 *
 * Usage:
 *   npx abos-install                      interactive
 *   npx abos-install --key abos_tenant_…  non-interactive (CI)
 *   npx abos-install --dry-run            show what would be written
 *   npx abos-install --help
 */

import { readFile, writeFile, mkdir, readdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout, argv, exit, env } from 'node:process';

import { detectPlatform, adapterPathFor, PLATFORMS, PLATFORM_LABELS } from '../lib/platform.mjs';
import {
  createInstallState, completeStep, failStep, renderChecklist,
  reconcileFeatures, recoveryFor, isComplete,
} from '../lib/steps.mjs';
import { buildArtifacts, CONFIG_FILENAME } from '../lib/generate.mjs';

const DEFAULT_BASE_URL = 'https://aircraftbuyorsell.base44.app';

const COLORS = {
  reset: '[0m', bold: '[1m', dim: '[2m',
  green: '[32m', red: '[31m', yellow: '[33m', cyan: '[36m',
};
// Respect NO_COLOR and non-TTY output so logs stay readable.
const useColor = stdout.isTTY && !env.NO_COLOR;
const c = (color, text) => (useColor ? `${COLORS[color]}${text}${COLORS.reset}` : text);

function parseArgs(args) {
  const options = { dryRun: false, force: false, verbose: false, help: false, key: null, dir: process.cwd(), platform: null, baseUrl: env.ABOS_BASE_URL || DEFAULT_BASE_URL, yes: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--verbose') options.verbose = true;
    else if (arg === '--yes' || arg === '-y') options.yes = true;
    else if (arg === '--key') options.key = args[++i];
    else if (arg === '--dir') options.dir = path.resolve(args[++i]);
    else if (arg === '--platform') options.platform = args[++i];
    else if (arg === '--base-url') options.baseUrl = args[++i];
  }
  return options;
}

function printHelp() {
  stdout.write(`
${c('bold', 'ABOS White-Label Installer')}

  Installs the ABOS aircraft intelligence integration into your project.

${c('bold', 'Usage')}
  abos-install [options]

${c('bold', 'Options')}
  --key <key>        Tenant API key (or set ABOS_TENANT_API_KEY).
                     Prompted for interactively if omitted.
  --dir <path>       Project directory to install into (default: cwd)
  --platform <id>    Force a platform adapter instead of detecting one.
                     One of: ${Object.values(PLATFORMS).join(', ')}
  --base-url <url>   ABOS Core base URL (default: ${DEFAULT_BASE_URL})
  --dry-run          Show what would be written, write nothing
  --force            Overwrite existing ABOS files
  --yes, -y          Accept defaults without prompting (for CI)
  --verbose          Print full error detail
  --help, -h         Show this help

${c('bold', 'Security')}
  Your tenant API key is never written into generated files. It belongs in an
  environment variable read only by your server-side adapter.

`);
}

function banner() {
  stdout.write(`\n${c('bold', 'ABOS WHITE-LABEL INSTALLER')}\n${c('dim', '─'.repeat(48))}\n\n`);
}

function showProgress(state) {
  stdout.write(`\n${renderChecklist(state)}\n\n`);
}

function reportFailure(state, stepId, options) {
  const step = state.steps.find((s) => s.id === stepId);
  stdout.write(`\n${c('red', '✗ ' + (step?.label || stepId) + ' failed')}\n`);
  stdout.write(`  ${step?.error?.message || 'Unknown error'}\n\n`);
  stdout.write(`${c('yellow', 'What to do:')}\n  ${step?.error?.recovery || recoveryFor(stepId)}\n\n`);
  if (options.verbose && step?.error?.detail) stdout.write(`${c('dim', step.error.detail)}\n\n`);
}

async function fileExists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

async function listProjectFiles(dir) {
  // A shallow listing plus the few nested entry files detection cares about;
  // walking a whole project (node_modules included) would be needlessly slow.
  const found = [];
  try {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
      found.push(entry.name);
      if (entry.isDirectory() && ['app', 'pages', 'src'].includes(entry.name)) {
        try {
          for (const child of await readdir(path.join(dir, entry.name), { withFileTypes: true })) {
            found.push(`${entry.name}/${child.name}`);
            if (child.isDirectory() && ['app', 'pages'].includes(child.name)) {
              for (const grand of await readdir(path.join(dir, entry.name, child.name))) {
                found.push(`${entry.name}/${child.name}/${grand}`);
              }
            }
          }
        } catch { /* unreadable subdirectory is not fatal for detection */ }
      }
    }
  } catch { /* unreadable project directory is handled by the caller */ }
  return found;
}

async function callAbos(baseUrl, key, endpoint, params = {}) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/functions/tenantCoreApi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-abos-tenant-key': key },
    body: JSON.stringify({ endpoint, params }),
  });
  let payload = null;
  try { payload = await response.json(); } catch { payload = null; }
  if (!payload) throw new Error(`ABOS returned an unreadable response (HTTP ${response.status})`);
  if (payload.status !== 'success') {
    throw new Error(payload.error?.message || `ABOS request failed (HTTP ${response.status})`);
  }
  return payload.data;
}

async function main() {
  const options = parseArgs(argv.slice(2));
  if (options.help) { printHelp(); return 0; }

  banner();
  let state = createInstallState();
  const rl = (!options.yes && stdin.isTTY)
    ? readline.createInterface({ input: stdin, output: stdout })
    : null;
  const ask = async (question, fallback = '') => {
    if (!rl) return fallback;
    const answer = (await rl.question(question)).trim();
    return answer || fallback;
  };

  try {
    // ── Welcome ──
    stdout.write(`Installing into ${c('cyan', options.dir)}\n`);
    if (options.dryRun) stdout.write(c('yellow', 'Dry run — no files will be written.\n'));
    state = completeStep(state, 'welcome');
    showProgress(state);

    // ── License activation ──
    let key = options.key || env.ABOS_TENANT_API_KEY;
    if (!key) {
      key = await ask('Enter your ABOS tenant API key: ');
    }
    if (!key) {
      state = failStep(state, 'license_activation', new Error('No tenant API key provided.'));
      reportFailure(state, 'license_activation', options);
      return 1;
    }

    let identity;
    try {
      identity = await callAbos(options.baseUrl, key, 'whoami');
    } catch (error) {
      state = failStep(state, 'license_activation', error);
      reportFailure(state, 'license_activation', options);
      return 1;
    }
    const license = identity.license || {};
    const tenant = identity.tenant || {};
    stdout.write(`  License: ${c('bold', license.plan || 'unknown')} (${license.status})\n`);
    state = completeStep(state, 'license_activation', { license });

    // ── Tenant identification ──
    if (!tenant.tenant_id) {
      state = failStep(state, 'tenant_identification', new Error('ABOS did not return an active tenant for this key.'));
      reportFailure(state, 'tenant_identification', options);
      return 1;
    }
    stdout.write(`  Organization: ${c('bold', tenant.display_name || tenant.tenant_id)}\n`);
    state = completeStep(state, 'tenant_identification', { tenant });
    showProgress(state);

    // ── Platform detection ──
    let detection;
    if (options.platform) {
      if (!Object.values(PLATFORMS).includes(options.platform)) {
        state = failStep(state, 'platform_detection', new Error(`Unknown platform '${options.platform}'.`));
        reportFailure(state, 'platform_detection', options);
        return 1;
      }
      detection = { platform: options.platform, label: PLATFORM_LABELS[options.platform], confidence: 'high', reason: 'specified with --platform', serverSide: true };
    } else {
      let packageJson = null;
      try {
        packageJson = JSON.parse(await readFile(path.join(options.dir, 'package.json'), 'utf8'));
      } catch { packageJson = null; }
      detection = detectPlatform({ packageJson, files: await listProjectFiles(options.dir) });
    }
    stdout.write(`  Platform: ${c('bold', detection.label)} ${c('dim', `(${detection.reason})`)}\n`);

    if (!detection.serverSide) {
      // Refusing here is the whole point: a static SPA has nowhere to hold the
      // key, and generating a browser-side integration would leak it to every
      // visitor. Better to stop than to ship something insecure.
      state = failStep(
        state, 'platform_detection',
        new Error(`${detection.label} has no server side to hold your API key.`),
        'Your ABOS tenant key must be used from a server. Deploy a small backend (a Next.js route, an Express endpoint, or a Cloudflare Worker) and re-run the installer there with --platform, then point your SPA at that adapter URL.',
      );
      reportFailure(state, 'platform_detection', options);
      return 1;
    }
    state = completeStep(state, 'platform_detection', { detection });

    // ── Configuration ──
    const configPath = path.join(options.dir, CONFIG_FILENAME);
    if (await fileExists(configPath) && !options.force) {
      state = failStep(state, 'configuration', new Error(`${CONFIG_FILENAME} already exists.`), `An ABOS integration is already installed here. Re-run with --force to overwrite it, or remove ${CONFIG_FILENAME} first.`);
      reportFailure(state, 'configuration', options);
      return 1;
    }
    const adapterUrl = await ask(`Adapter URL path [${c('dim', '/api/abos')}]: `, '/api/abos');
    state = completeStep(state, 'configuration', { adapterUrl });

    // ── Branding ──
    const brandName = await ask(`Brand name [${c('dim', tenant.brand_name || tenant.display_name)}]: `, tenant.brand_name || tenant.display_name);
    const primaryColor = await ask(`Primary color [${c('dim', '#0EA5E9')}]: `, '#0EA5E9');
    state = completeStep(state, 'branding', { branding: { brand_name: brandName, primary_color: primaryColor, mode: 'light' } });
    showProgress(state);

    // ── Feature selection ──
    const licensed = license.allowed_capabilities || [];
    stdout.write(`  Licensed features: ${licensed.length ? licensed.join(', ') : c('yellow', 'none')}\n`);
    const featureAnswer = await ask(`Enable which features? [${c('dim', 'all licensed')}]: `, '');
    const requested = featureAnswer ? featureAnswer.split(',').map((f) => f.trim()).filter(Boolean) : undefined;
    const reconciled = reconcileFeatures(requested, licensed);
    if (!reconciled.ok) {
      // Not fatal — we proceed with the licensed subset — but the customer is
      // told plainly, because silently dropping a requested feature would
      // surface later as a confusing 403 in production.
      stdout.write(c('yellow', `  Not included in your license, skipped: ${reconciled.rejected.join(', ')}\n`));
    }
    state = completeStep(state, 'feature_selection', { features: reconciled.enabled });

    // ── ABOS Core connection + health check ──
    try {
      await callAbos(options.baseUrl, key, 'health');
    } catch (error) {
      state = failStep(state, 'core_connection', error);
      reportFailure(state, 'core_connection', options);
      return 1;
    }
    state = completeStep(state, 'core_connection');
    stdout.write(`  ${c('green', 'ABOS Core reachable')}\n`);
    state = completeStep(state, 'health_check');
    showProgress(state);

    // ── Install ──
    const artifacts = buildArtifacts({
      tenant, license,
      features: reconciled.enabled,
      branding: state.data.branding,
      platform: detection.platform,
      baseUrl: options.baseUrl,
      adapterUrl: state.data.adapterUrl,
    });

    if (options.dryRun) {
      stdout.write(`${c('yellow', 'Would write:')}\n`);
      for (const artifact of artifacts) stdout.write(`  ${artifact.path} ${c('dim', `(${artifact.contents.length} bytes)`)}\n`);
      stdout.write(`\n${c('yellow', 'Dry run complete — nothing was written.')}\n\n`);
      return 0;
    }

    try {
      for (const artifact of artifacts) {
        const target = path.join(options.dir, artifact.path);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, artifact.contents, 'utf8');
        stdout.write(`  ${c('green', 'wrote')} ${artifact.path}\n`);
      }
    } catch (error) {
      state = failStep(state, 'install', error);
      reportFailure(state, 'install', options);
      return 1;
    }
    state = completeStep(state, 'install', { artifacts: artifacts.map((a) => a.path) });

    // ── Validation ──
    const missing = [];
    for (const artifact of artifacts) {
      if (!(await fileExists(path.join(options.dir, artifact.path)))) missing.push(artifact.path);
    }
    if (missing.length) {
      state = failStep(state, 'validation', new Error(`Expected files are missing after install: ${missing.join(', ')}`));
      reportFailure(state, 'validation', options);
      return 1;
    }
    state = completeStep(state, 'validation');
    state = completeStep(state, 'complete');
    showProgress(state);

    stdout.write(`${c('green', c('bold', 'Installation complete.'))}\n\n`);
    stdout.write(`${c('bold', 'Next steps')}\n`);
    stdout.write(`  1. Copy .env.abos.example to .env and set ABOS_TENANT_API_KEY to your key.\n`);
    if (detection.platform === PLATFORMS.CLOUDFLARE_WORKER) {
      stdout.write(`     For Workers: ${c('cyan', 'wrangler secret put ABOS_TENANT_API_KEY')}\n`);
    }
    stdout.write(`  2. Make sure .env is gitignored — the key must never be committed.\n`);
    stdout.write(`  3. Import the UI kit in your app:\n`);
    stdout.write(`     ${c('dim', "import { TenantThemeProvider, AtiScoreCard, createBrowserClient } from '@abos/white-label';")}\n`);
    stdout.write(`  4. Deploy, then load a page using the components to verify.\n\n`);

    return isComplete(state) ? 0 : 1;
  } finally {
    if (rl) rl.close();
  }
}

main()
  .then((code) => exit(code))
  .catch((error) => {
    stdout.write(`\n${c('red', 'Installer crashed:')} ${error?.message || error}\n`);
    stdout.write(`${c('dim', 'This is a bug. Re-run with --verbose and report it to ABOS support.')}\n\n`);
    if (argv.includes('--verbose')) stdout.write(`${error?.stack || ''}\n`);
    exit(1);
  });
