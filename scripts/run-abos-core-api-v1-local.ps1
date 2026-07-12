$ErrorActionPreference = "Stop"
npm ci --ignore-scripts
node --test test/abosCoreApiV1.test.mjs test/stripe-entitlement-guard.test.mjs test/legacy-security-guards.test.mjs test/legacy-core-api-guards.test.mjs
node scripts/validate-abos-core-openapi.mjs
npm run build
