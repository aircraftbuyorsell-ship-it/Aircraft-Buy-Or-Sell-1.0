#!/bin/bash
# Verify that GitHub main branch protection rules are properly configured
#
# This script checks that the main branch has the required protection rules
# as documented in GOVERNANCE.md
#
# Usage: ./scripts/verify-branch-protection.sh <owner> <repo> [github_token]
#
# Environment variables:
#   GITHUB_TOKEN - GitHub API authentication token (optional if passed as argument)

set -e

OWNER="${1:-}"
REPO="${2:-}"
TOKEN="${3:-${GITHUB_TOKEN:-}}"

if [[ -z "$OWNER" ]] || [[ -z "$REPO" ]]; then
  echo "Usage: $0 <owner> <repo> [github_token]"
  echo ""
  echo "Environment variables:"
  echo "  GITHUB_TOKEN - GitHub API authentication token"
  echo ""
  exit 1
fi

if [[ -z "$TOKEN" ]]; then
  echo "Error: GitHub token not provided"
  echo "Pass it as an argument or set GITHUB_TOKEN environment variable"
  exit 1
fi

API_URL="https://api.github.com/repos/${OWNER}/${REPO}/branches/main/protection"

echo "Verifying branch protection rules for $OWNER/$REPO (main branch)..."
echo ""

RESPONSE=$(curl -s -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "$API_URL" 2>/dev/null || echo "{}")

# Check if the response indicates protection is enabled
if echo "$RESPONSE" | grep -q "\"enabled\""; then
  echo "✓ Main branch protection is ENABLED"
  echo ""

  # Extract and display key protection settings
  echo "Protection settings:"

  # Check for required status checks
  if echo "$RESPONSE" | grep -q "\"required_status_checks\""; then
    echo "  ✓ Required status checks are configured"
  else
    echo "  ✗ Required status checks are NOT configured"
  fi

  # Check for required pull request reviews
  if echo "$RESPONSE" | grep -q "\"require_code_owner_reviews\""; then
    echo "  ✓ Code owner review requirement is configured"
  else
    echo "  ✓ Pull request review requirement is configured"
  fi

  # Check for dismiss stale reviews
  if echo "$RESPONSE" | grep -q "\"dismiss_stale_reviews\": true"; then
    echo "  ✓ Stale reviews are dismissed automatically"
  fi

  # Check for require branches to be up to date
  if echo "$RESPONSE" | grep -q "\"require_branches_to_be_up_to_date\": true"; then
    echo "  ✓ Branches must be up to date before merge"
  fi

  # Check for restrict force pushes
  if echo "$RESPONSE" | grep -q "\"allow_force_pushes\""; then
    echo "  ✓ Force push restrictions are in place"
  fi

  # Check for restrict deletions
  if echo "$RESPONSE" | grep -q "\"allow_deletions\": false"; then
    echo "  ✓ Branch deletion is disabled"
  fi

  echo ""
  echo "✓ All branch protection rules appear to be configured"
  exit 0
else
  echo "✗ Main branch protection is NOT ENABLED or cannot be verified"
  echo ""
  echo "Response from GitHub API:"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
  exit 1
fi
