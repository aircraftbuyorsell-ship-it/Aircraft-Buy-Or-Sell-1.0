import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const REQUIRED_FILES = [
  'base44/functions/abosCoreApi/entry.ts',
  'base44/functions/abosOpenApiSpec/entry.ts',
  '.github/workflows/deploy-cloudflare-pages.yml',
  'scripts/predeploy-static-guard.sh',
];

const ENDPOINTS = [
  'search',
  'valuate',
  'intelligence.extract',
  'listings.get',
  'listings.list',
  'listings.create',
  'keys.create',
  'keys.list',
  'keys.revoke',
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

export function runPreflight() {
  const errors = [];
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(root, file))) errors.push(`missing required file: ${file}`);
  }
  if (errors.length) return { ok: false, errors };

  const api = read('base44/functions/abosCoreApi/entry.ts');
  const spec = read('base44/functions/abosOpenApiSpec/entry.ts');
  const pagesWorkflow = read('.github/workflows/deploy-cloudflare-pages.yml');
  const staticGuard = read('scripts/predeploy-static-guard.sh');

  if (!api.includes('Deno.serve')) errors.push('Core API entrypoint is not a Deno function');
  if (!api.includes("endpoint || ''")) errors.push('Core API endpoint discriminator is missing');
  if (!spec.includes("openapi: '3.0.3'")) errors.push('OpenAPI source is missing or not OpenAPI 3.0.3');

  for (const endpoint of ENDPOINTS) {
    if (!api.includes(`endpoint === '${endpoint}'`)) errors.push(`Core API endpoint missing: ${endpoint}`);
  }

  for (const endpoint of ENDPOINTS.slice(0, 6)) {
    if (!spec.includes(`endpointParam('${endpoint}'`)) errors.push(`OpenAPI endpoint missing: ${endpoint}`);
  }

  if (!pagesWorkflow.includes('wrangler@4 pages deploy dist')) {
    errors.push('Pages workflow must deploy dist with wrangler pages deploy');
  }
  for (const command of ['wrangler versions upload', 'wrangler deploy']) {
    if (pagesWorkflow.includes(command)) errors.push(`Worker command leaked into Pages workflow: ${command}`);
  }
  if (!staticGuard.includes('dist/index.html')) errors.push('Static guard does not verify dist/index.html');

  return {
    ok: errors.length === 0,
    errors,
    checked: { endpoints: ENDPOINTS, pages_static_deployment: true, worker_runtime: 'separate boundary' },
  };
}

if (process.argv[1] && process.argv[1].endsWith(path.join('scripts', 'core-api', 'rc-preflight.mjs'))) {
  const result = runPreflight();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
