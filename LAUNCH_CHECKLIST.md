# ABOS White-Label v1.0.0 Launch Checklist

**Target:** Production-ready tenant provisioning + installer purchase flow  
**Status:** Phase 7-10 completion  
**Timeline:** August 27, 2026

---

## ✅ PHASE 1-2: Tenant Provisioning (THIS PHASE - 20 min)

### Step 1: Provision SkyDeals Europe Tenant

**Via Base44 Admin Panel or API:**

```bash
POST https://YOUR_BASE44_DOMAIN/functions/tenantProvision
{
  "tenant_id": "skydeals_europe",
  "display_name": "SkyDeals Europe",
  "contact_email": "hello@skydealseurope.com",
  "plan": "professional",
  "agreement_version": "2026-08-26",
  "accepted_by_email": "hello@skydealseurope.com"
}
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "tenant_id": "skydeals_europe",
    "license_id": "lic_...",
    "api_key": "abos_tenant_[48_hex_chars]",
    "api_key_prefix": "abos_tenant_...",
    "capabilities": ["search", "ati_score", "ati_basic_report", "valuation", "market_intelligence"],
    "rate_limit": { "rpm": 300, "rpd": 20000 },
    "expires_at": null
  }
}
```

**Save:** The `api_key` (shown only once) and `license_id`.

---

### Step 2: Provision Adam Test Tenant (Unlimited)

```bash
POST https://YOUR_BASE44_DOMAIN/functions/tenantProvision
{
  "tenant_id": "adam_test",
  "display_name": "Adam Test Tenant",
  "contact_email": "adam@aircraftbuyorsell.com",
  "plan": "enterprise",
  "agreement_version": "2026-08-26",
  "accepted_by_email": "adam@aircraftbuyorsell.com"
}
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "tenant_id": "adam_test",
    "license_id": "lic_...",
    "api_key": "abos_tenant_[48_hex_chars]",
    "api_key_prefix": "abos_tenant_...",
    "capabilities": ["ati_score", "ati_basic_report", "ati_pro_report", "valuation", "aircraft_passport", "n_reg_lookup", "market_intelligence", "advanced_intelligence", "search"],
    "rate_limit": { "rpm": 10000, "rpd": 1000000 },
    "expires_at": null
  }
}
```

**Save:** The `api_key` and `license_id`.

---

## ✅ PHASE 3: Download Endpoint (60 min)

**Creates:** POST `/api/tenantCoreApi/download-installer`

```typescript
// Authentication via x-abos-tenant-key header
// Returns: checksummed installer package for the tenant's plan

POST /api/tenantCoreApi/download-installer
Headers:
  x-abos-tenant-key: abos_tenant_...
  Content-Type: application/json

Response (200 OK):
  Content-Type: application/zip
  Content-Disposition: attachment; filename="ABOS-SkyDeals-Europe-v1.0.0.zip"
  Content-Length: 36492
  X-Checksum: sha256=...
```

---

## ✅ PHASE 4: Partner Portal UI (45 min)

**Components:**
- License status badge (ACTIVE / TRIAL / EXPIRED)
- Days remaining (for trial tenants)
- "Download Installer" button
- Package checksum display
- Rate limit info

**Trial Badge Example:**
```
Trial Expires in 13 days
€690/mo → Upgrade to continue
```

**Unlimited Badge Example:**
```
Enterprise License
Unlimited access
Renewed: Never
```

---

## ✅ PHASE 5: End-to-End Test (35 min)

### Test 1: Stripe Checkout Flow (Trial Tenant)

1. Visit `/api` → click "Start 14-day trial" (Professional plan)
2. Authenticate as test user
3. Stripe checkout → read agreement → complete payment
4. Webhook creates: Tenant → License → TenantApiKey → ContractAcceptance
5. Redirect to `/partner-portal?checkout=success`
6. Verify: License shows "Trial Expires in 13 days"
7. Download button works → file is valid ZIP

### Test 2: Admin-Provisioned Tenant (SkyDeals)

1. Login as adam@aircraftbuyorsell.com
2. Base44 redirects to `/partner-portal`
3. Shows: SkyDeals license (ACTIVE, Professional, 300 rpm limit)
4. Download button works → returns correct package
5. Verify checksum: `sha256 -c ABOS-SkyDeals-Europe-v1.0.0.zip.sha256`

### Test 3: API Key Authentication

```bash
# Valid key (should proxy to Core API)
curl -H "x-abos-tenant-key: abos_tenant_..." \
  https://api.aircraftbuyorsell.com/tenantCoreApi/search \
  -d '{"query": "Citation Latitude"}'
# → 200 OK with results

# Invalid key (should reject)
curl -H "x-abos-tenant-key: abos_tenant_invalid..." \
  https://api.aircraftbuyorsell.com/tenantCoreApi/search
# → 401 Unauthorized
```

---

## ✅ PHASE 6: Release (20 min)

### Create GitHub Release

```bash
git tag -a v1.0.0 -m "ABOS White-Label v1.0.0 - Production Ready"
git push origin v1.0.0
```

### GitHub Release Notes (template):

```markdown
# ABOS White-Label v1.0.0

Production-ready white-label SaaS platform for the aircraft marketplace.

## What's Included

- **Multi-Tenant Architecture**: Tenant/License/ApiKey entities with capability-based access
- **Stripe Integration**: Self-serve checkout with 14-day trial for Starter/Professional plans
- **Automatic Provisioning**: Webhook creates tenant records on payment completion
- **Partner Portal**: License management, API key retrieval, installer download
- **Verified Packages**: Deterministic builds with SHA-256 checksums
- **Rate Limiting**: Per-plan sliding-window rate limits (20-10k rpm)
- **Security**: Hashed API keys, capability gating, audit logging

## Plans

| Plan | Price | Trial | Capabilities | Rate Limit |
|------|-------|-------|--------------|-----------|
| Starter | €690/mo | 14 days | search, ati_score | 20 rpm, 500 rpd |
| Professional | €1,890/mo | 14 days | search, ati_score, ati_basic_report, valuation, market_intelligence | 300 rpm, 20,000 rpd |
| Enterprise | Custom | N/A | All (9 capabilities) | 10k rpm, 1M rpd |

## Getting Started

1. Visit https://aircraftbuyorsell.com/api
2. Choose Starter or Professional
3. Complete Stripe checkout (14-day free trial)
4. Download installer from Partner Portal
5. Install in your backend
6. Start calling `/tenantCoreApi` endpoints

## Testing

Test tenant (unlimited, for development):
- Email: adam@aircraftbuyorsell.com
- Plan: Enterprise
- API Key: abos_tenant_[obtained via admin provisioning]

## Documentation

- [GOVERNANCE.md](./GOVERNANCE.md) - Branch protection & development workflow
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture & data model
- [docs/white-label/](./docs/white-label/) - Installation & integration guides

## Verified

- ✅ 188 tests passing (Node 18, 20, 22)
- ✅ Build succeeds with Partner Portal
- ✅ Package round-trip verified (build → extract → install → proxy)
- ✅ Stripe webhook idempotency tested
- ✅ Rate limiting verified
- ✅ Security review completed

## Support

Report issues via GitHub Issues or email support@aircraftbuyorsell.com

---

Generated: 2026-08-27  
Version: 1.0.0  
```

---

## 🚀 SUCCESS CRITERIA

- [ ] Both tenants provisioned (SkyDeals + Adam)
- [ ] Download endpoint returns valid ZIP with correct checksum
- [ ] Partner Portal shows license status and trial countdown
- [ ] Stripe test checkout creates tenant automatically
- [ ] API key authentication works (valid key proxies, invalid rejects)
- [ ] v1.0.0 tag pushed to GitHub
- [ ] GitHub release published with complete notes

---

**Estimated Total Time:** 220 minutes (3h 40m)  
**Buffer:** 80 minutes → still under 5-hour limit  
**Status:** READY TO EXECUTE
