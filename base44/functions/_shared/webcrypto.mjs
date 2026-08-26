// Runtime-portable Web Crypto.
//
// Global `crypto` (the Web Crypto API) exists in Deno, Cloudflare Workers and
// Node 19+, but NOT in Node 18 — where it lives at `node:crypto`.webcrypto
// instead. This repo's CI matrix includes 18.x, and several modules under
// base44/functions are deliberately written as portable .mjs so they can be
// exercised by `node --test` as well as run on Base44's Deno runtime, so they
// need a resolution that works in every one of those.
//
// The dynamic import is only evaluated when there's no global crypto, so in
// Deno/Workers it never runs and no `node:` specifier is ever resolved — which
// matters because pulling node:crypto unconditionally into a Worker bundle
// would require nodejs_compat.
export const webcrypto = globalThis.crypto ?? (await import('node:crypto')).webcrypto;

export default webcrypto;
