#!/usr/bin/env node

/**
 * White-Label Deployment Verification Script
 * Validates that the ABOS White-Label toolset is properly deployed and configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(symbol, message, color = 'reset') {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

function fileExists(filePath) {
  return fs.existsSync(path.resolve(rootDir, filePath));
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(path.resolve(rootDir, filePath), 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

async function runChecks() {
  console.log(`${colors.blue}White-Label Deployment Verification${colors.reset}\n`);

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  // Check 1: Core files exist
  console.log(`${colors.blue}Core Files${colors.reset}`);
  const coreFiles = [
    'src/white-label/index.js',
    'src/white-label/client.js',
    'src/white-label/theme.js',
    'src/white-label/TenantThemeProvider.jsx',
    'docs/white-label/README.md',
    'docs/white-label/INSTALLATION.md',
    'docs/white-label/SECURITY.md',
  ];

  coreFiles.forEach(file => {
    if (fileExists(file)) {
      log('✓', file, 'green');
      passCount++;
    } else {
      log('✗', file, 'red');
      failCount++;
    }
  });

  // Check 2: Tenant configurations
  console.log(`\n${colors.blue}Tenant Configurations${colors.reset}`);
  const tenantsDir = path.resolve(rootDir, 'src/white-label/tenants');
  if (fs.existsSync(tenantsDir)) {
    const tenantFiles = fs.readdirSync(tenantsDir).filter(f => f.endsWith('.json'));
    if (tenantFiles.length > 0) {
      log('✓', `Found ${tenantFiles.length} tenant(s)`, 'green');
      passCount++;

      tenantFiles.forEach(file => {
        const tenant = readJsonFile(path.join('src/white-label/tenants', file));
        if (tenant && tenant.tenant_id && tenant.display_name) {
          log('  ✓', `${tenant.display_name} (${tenant.tenant_id})`, 'green');
          passCount++;
        }
      });
    } else {
      log('⚠', 'No tenant configurations found', 'yellow');
      warnCount++;
    }
  }

  // Check 3: Installer exists
  console.log(`\n${colors.blue}Installer${colors.reset}`);
  if (fileExists('installer/bin/abos-install.mjs')) {
    log('✓', 'Installer present', 'green');
    passCount++;
  } else {
    log('✗', 'Installer missing', 'red');
    failCount++;
  }

  // Check 4: Adapter templates
  console.log(`\n${colors.blue}Platform Adapters${colors.reset}`);
  const adapters = [
    'installer/templates/next-app-router.js',
    'installer/templates/next-pages-router.js',
    'installer/templates/remix.js',
    'installer/templates/express.js',
    'installer/templates/cloudflare-worker.js',
  ];

  adapters.forEach(adapter => {
    if (fileExists(adapter)) {
      log('✓', path.basename(adapter), 'green');
      passCount++;
    } else {
      log('⚠', path.basename(adapter) + ' not found', 'yellow');
      warnCount++;
    }
  });

  // Check 5: Gateway configuration
  console.log(`\n${colors.blue}Cloudflare Workers${colors.reset}`);
  if (fileExists('gateway/wrangler.toml')) {
    const wranglerContent = fs.readFileSync(path.resolve(rootDir, 'gateway/wrangler.toml'), 'utf-8');
    if (wranglerContent.includes('abos-widget-gateway')) {
      log('✓', 'Gateway worker configured', 'green');
      passCount++;
    }
  } else {
    log('⚠', 'Gateway wrangler.toml not found', 'yellow');
    warnCount++;
  }

  if (fileExists('security-worker/wrangler.toml')) {
    log('✓', 'Security worker configured', 'green');
    passCount++;
  }

  // Check 6: Test files
  console.log(`\n${colors.blue}Test Coverage${colors.reset}`);
  const testFiles = [
    'test/white-label-client.test.mjs',
    'test/white-label-theme.test.mjs',
    'test/white-label-tenant-config.test.mjs',
  ];

  testFiles.forEach(file => {
    if (fileExists(file)) {
      log('✓', path.basename(file), 'green');
      passCount++;
    } else {
      log('⚠', path.basename(file) + ' not found', 'yellow');
      warnCount++;
    }
  });

  // Check 7: Package manifest
  console.log(`\n${colors.blue}Package Manifest${colors.reset}`);
  if (fileExists('abos-package-manifest.json')) {
    log('✓', 'Package manifest present', 'green');
    passCount++;
  } else {
    log('⚠', 'Package manifest not found', 'yellow');
    warnCount++;
  }

  // Summary
  console.log(`\n${colors.blue}Summary${colors.reset}`);
  log('✓', `${passCount} checks passed`, 'green');
  if (warnCount > 0) {
    log('⚠', `${warnCount} warnings`, 'yellow');
  }
  if (failCount > 0) {
    log('✗', `${failCount} checks failed`, 'red');
  }

  const status = failCount === 0 ? 'READY' : 'ISSUES';
  console.log(`\n${colors.blue}Status: ${status}${colors.reset}`);

  return failCount === 0 ? 0 : 1;
}

process.exit(await runChecks());
