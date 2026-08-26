// Platform detection for the ABOS White-Label Installer.
//
// Pure: takes an already-read package.json (and a list of files present in the
// target directory) and reports which platform adapter to generate. Doing no
// I/O here keeps detection unit-testable and lets the CLI decide how to read
// the project.
//
// Per the product brief: the customer should only need Wrangler when their own
// deployment architecture actually requires it. Wrangler is a Cloudflare
// deployment tool, not an ABOS requirement — so it is one adapter among
// several, never a precondition for installing.

export const PLATFORMS = Object.freeze({
  NEXT_APP: 'next-app-router',
  NEXT_PAGES: 'next-pages-router',
  REMIX: 'remix',
  EXPRESS: 'express',
  CLOUDFLARE_WORKER: 'cloudflare-worker',
  VITE_SPA: 'vite-spa',
  GENERIC_NODE: 'generic-node',
});

/** Human-readable description per platform, shown in the installer UI. */
export const PLATFORM_LABELS = Object.freeze(Object.assign(Object.create(null), {
  [PLATFORMS.NEXT_APP]: 'Next.js (App Router)',
  [PLATFORMS.NEXT_PAGES]: 'Next.js (Pages Router)',
  [PLATFORMS.REMIX]: 'Remix',
  [PLATFORMS.EXPRESS]: 'Express / Node server',
  [PLATFORMS.CLOUDFLARE_WORKER]: 'Cloudflare Worker',
  [PLATFORMS.VITE_SPA]: 'Vite single-page app',
  [PLATFORMS.GENERIC_NODE]: 'Generic Node.js project',
}));

/**
 * Platforms that cannot host a server-side adapter themselves. A pure static
 * SPA has nowhere safe to keep the tenant key, so the installer must warn
 * rather than generate something insecure.
 */
export const BROWSER_ONLY_PLATFORMS = Object.freeze([PLATFORMS.VITE_SPA]);

function deps(pkg) {
  return {
    ...(pkg?.dependencies || {}),
    ...(pkg?.devDependencies || {}),
  };
}

function has(pkg, name) {
  return Object.prototype.hasOwnProperty.call(deps(pkg), name);
}

/**
 * Detects the target platform.
 *
 * @param {object} options
 * @param {object|null} options.packageJson Parsed package.json, if present.
 * @param {string[]} options.files Paths (relative, posix-style) present in the project.
 * @returns {{platform: string, label: string, confidence: 'high'|'medium'|'low', reason: string, serverSide: boolean}}
 */
export function detectPlatform({ packageJson = null, files = [] } = {}) {
  const fileSet = new Set((files || []).map((f) => String(f).replace(/^\.\//, '')));
  const hasFile = (path) => fileSet.has(path);
  const hasAnyFile = (...paths) => paths.some(hasFile);

  const result = (platform, confidence, reason) => ({
    platform,
    label: PLATFORM_LABELS[platform] || platform,
    confidence,
    reason,
    serverSide: !BROWSER_ONLY_PLATFORMS.includes(platform),
  });

  // Cloudflare Workers are identified by their config file, not by a dependency:
  // wrangler is frequently a devDependency in projects that don't deploy a Worker.
  if (hasAnyFile('wrangler.toml', 'wrangler.json', 'wrangler.jsonc')) {
    return result(PLATFORMS.CLOUDFLARE_WORKER, 'high', 'found a wrangler config file');
  }

  if (has(packageJson, 'next')) {
    // App Router and Pages Router need different adapter shapes, so distinguish
    // them by directory layout rather than guessing.
    if (hasAnyFile('app/layout.tsx', 'app/layout.js', 'app/layout.jsx', 'src/app/layout.tsx', 'src/app/layout.js', 'src/app/layout.jsx')) {
      return result(PLATFORMS.NEXT_APP, 'high', 'next dependency with an app/ directory');
    }
    if (hasAnyFile('pages/_app.tsx', 'pages/_app.js', 'pages/_app.jsx', 'src/pages/_app.tsx', 'src/pages/_app.js', 'src/pages/_app.jsx')) {
      return result(PLATFORMS.NEXT_PAGES, 'high', 'next dependency with a pages/ directory');
    }
    // Default to App Router: it's the current Next.js default for new projects.
    return result(PLATFORMS.NEXT_APP, 'medium', 'next dependency found, but no recognizable app/ or pages/ entry file');
  }

  if (has(packageJson, '@remix-run/node') || has(packageJson, '@remix-run/server-runtime')) {
    return result(PLATFORMS.REMIX, 'high', 'remix server runtime dependency');
  }

  if (has(packageJson, 'express')) {
    return result(PLATFORMS.EXPRESS, 'high', 'express dependency');
  }

  if (has(packageJson, 'vite')) {
    return result(PLATFORMS.VITE_SPA, 'medium', 'vite dependency with no server framework detected');
  }

  if (packageJson) {
    return result(PLATFORMS.GENERIC_NODE, 'low', 'package.json found but no recognized framework');
  }

  return result(PLATFORMS.GENERIC_NODE, 'low', 'no package.json found');
}

/** Where the generated server adapter belongs for a given platform. */
export function adapterPathFor(platform) {
  switch (platform) {
    case PLATFORMS.NEXT_APP: return 'app/api/abos/route.js';
    case PLATFORMS.NEXT_PAGES: return 'pages/api/abos.js';
    case PLATFORMS.REMIX: return 'app/routes/api.abos.js';
    case PLATFORMS.EXPRESS: return 'abos/adapter.js';
    case PLATFORMS.CLOUDFLARE_WORKER: return 'abos/worker-adapter.js';
    case PLATFORMS.VITE_SPA: return 'abos/adapter.js';
    default: return 'abos/adapter.js';
  }
}
