#!/bin/bash
# Provision ABOS white-label reference tenants (Phase 1-2)
#
# This script provisions two reference tenants:
# 1. SkyDeals Europe - Professional plan, 14-day trial
# 2. Adam Test - Enterprise plan, unlimited, free forever
#
# Requirements:
#   - base44 CLI installed and authenticated as admin
#   - ABOS_BASE44_DOMAIN environment variable set (e.g., https://base44.example.com)
#   - Admin credentials with tenantProvision permissions
#
# Usage: ./scripts/provision-tenants.sh [base44_domain]

set -e

DOMAIN="${1:-${ABOS_BASE44_DOMAIN:-}}"

if [[ -z "$DOMAIN" ]]; then
  echo "Error: Base44 domain not provided"
  echo ""
  echo "Usage: $0 <base44_domain>"
  echo "  or set ABOS_BASE44_DOMAIN environment variable"
  echo ""
  echo "Example:"
  echo "  ABOS_BASE44_DOMAIN=https://base44.example.com ./scripts/provision-tenants.sh"
  echo "  ./scripts/provision-tenants.sh https://base44.example.com"
  exit 1
fi

ENDPOINT="${DOMAIN}/functions/tenantProvision"

echo "Provisioning ABOS white-label tenants..."
echo "Endpoint: $ENDPOINT"
echo ""

# ───────────────────────────────────────────────────────────────────────────
# Phase 1: Provision SkyDeals Europe (Professional plan, 14-day trial)
# ───────────────────────────────────────────────────────────────────────────

echo "Step 1: Provisioning SkyDeals Europe..."
echo ""

SKYDEALS_RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "skydeals_europe",
    "display_name": "SkyDeals Europe",
    "contact_email": "hello@skydealseurope.com",
    "plan": "professional",
    "agreement_version": "2026-08-26",
    "accepted_by_email": "hello@skydealseurope.com",
    "accepted_by_name": "SkyDeals Admin"
  }')

echo "$SKYDEALS_RESPONSE" | jq .

if echo "$SKYDEALS_RESPONSE" | jq -e '.status == "success"' > /dev/null 2>&1; then
  SKYDEALS_API_KEY=$(echo "$SKYDEALS_RESPONSE" | jq -r '.data.api_key.key')
  SKYDEALS_LICENSE_ID=$(echo "$SKYDEALS_RESPONSE" | jq -r '.data.license.id')

  echo ""
  echo "✓ SkyDeals Europe provisioned successfully"
  echo "  License ID: $SKYDEALS_LICENSE_ID"
  echo "  API Key: $SKYDEALS_API_KEY"
  echo "  ⚠️  Save this API key now — it is shown only once"
  echo ""
else
  echo "✗ Failed to provision SkyDeals Europe"
  exit 1
fi

# ───────────────────────────────────────────────────────────────────────────
# Phase 2: Provision Adam Test Tenant (Enterprise plan, unlimited)
# ───────────────────────────────────────────────────────────────────────────

echo "Step 2: Provisioning Adam Test Tenant (Enterprise, unlimited)..."
echo ""

ADAM_RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "adam_test",
    "display_name": "Adam Test Tenant",
    "contact_email": "adam@aircraftbuyorsell.com",
    "plan": "enterprise",
    "agreement_version": "2026-08-26",
    "accepted_by_email": "adam@aircraftbuyorsell.com",
    "accepted_by_name": "Adam Test"
  }')

echo "$ADAM_RESPONSE" | jq .

if echo "$ADAM_RESPONSE" | jq -e '.status == "success"' > /dev/null 2>&1; then
  ADAM_API_KEY=$(echo "$ADAM_RESPONSE" | jq -r '.data.api_key.key')
  ADAM_LICENSE_ID=$(echo "$ADAM_RESPONSE" | jq -r '.data.license.id')

  echo ""
  echo "✓ Adam Test Tenant provisioned successfully"
  echo "  License ID: $ADAM_LICENSE_ID"
  echo "  API Key: $ADAM_API_KEY"
  echo "  ⚠️  Save this API key now — it is shown only once"
  echo ""
else
  echo "✗ Failed to provision Adam Test Tenant"
  exit 1
fi

# ───────────────────────────────────────────────────────────────────────────
# Summary
# ───────────────────────────────────────────────────────────────────────────

echo ""
echo "✓ Phase 1-2: Tenant Provisioning Complete"
echo ""
echo "Summary:"
echo "  • SkyDeals Europe (Professional, 14-day trial)"
echo "    License: $SKYDEALS_LICENSE_ID"
echo "    API Key: $SKYDEALS_API_KEY"
echo ""
echo "  • Adam Test (Enterprise, unlimited)"
echo "    License: $ADAM_LICENSE_ID"
echo "    API Key: $ADAM_API_KEY"
echo ""
echo "Next steps (Phase 5-6):"
echo "  1. Test Stripe checkout flow with trial tenant"
echo "  2. Verify Partner Portal shows license status"
echo "  3. Test installer download"
echo "  4. Create GitHub release v1.0.0"
echo ""
