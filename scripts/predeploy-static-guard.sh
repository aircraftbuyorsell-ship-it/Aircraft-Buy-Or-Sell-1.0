#!/usr/bin/env bash
set -euo pipefail

echo "ABOS static deployment guard"

FORBIDDEN_PATTERNS=(
  "wrangler versions upload"
  "wrangler deploy"
)

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
  matches=$(grep -RInF \
    --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude='predeploy-static-guard.sh' \
    "$pattern" . || true)

  if [[ -n "$matches" ]]; then
    echo "$matches"
    echo "ERROR: Worker deployment command detected: $pattern"
    echo "The ABOS frontend must be deployed as a static Cloudflare Pages site."
    exit 1
  fi
done

rm -rf dist
npm run build

test -d dist || {
  echo "ERROR: dist/ was not created."
  exit 1
}

test -f dist/index.html || {
  echo "ERROR: dist/index.html is missing."
  exit 1
}

echo "Static deployment guard passed."
