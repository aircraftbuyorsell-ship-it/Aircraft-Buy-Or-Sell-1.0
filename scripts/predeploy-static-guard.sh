#!/usr/bin/env bash
set -euo pipefail

readonly FRONTEND_WORKFLOW=".github/workflows/deploy-cloudflare-pages.yml"

echo "ABOS static frontend deployment guard"

if [[ ! -f "$FRONTEND_WORKFLOW" ]]; then
  echo "ERROR: $FRONTEND_WORKFLOW is missing."
  exit 1
fi

FORBIDDEN_WORKER_COMMANDS=(
  "wrangler versions upload"
  "wrangler deploy"
)

for command in "${FORBIDDEN_WORKER_COMMANDS[@]}"; do
  if grep -nF "$command" "$FRONTEND_WORKFLOW"; then
    echo "ERROR: Worker deployment command detected in the frontend workflow: $command"
    echo "The ABOS frontend must use 'wrangler pages deploy dist'."
    exit 1
  fi
done

if ! grep -qF "wrangler@4 pages deploy dist" "$FRONTEND_WORKFLOW"; then
  echo "ERROR: Cloudflare Pages deployment command is missing from $FRONTEND_WORKFLOW."
  exit 1
fi

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

echo "Static frontend deployment guard passed."
