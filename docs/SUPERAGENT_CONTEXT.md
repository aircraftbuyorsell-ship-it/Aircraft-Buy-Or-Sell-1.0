# ABOS — Superagent Technical Context

> **Aircraft Buy Or Sell (ABOS)** — Aviation intelligence platform.
> "Carvago for aircraft": paid verification reports + market intelligence for the global aviation community.
> This document teaches an external AI agent the full working system.

---

## 0. Fast Summary (paste this first)

```text
Website URL: https://aircraftbuyorsell.base44.app
What the website does: Aviation verification + market intelligence platform. Sells
  single-aircraft "Aircraft Verification Reports" (ATI — Aircraft Transparency Index)
  as PDFs, plus a marketplace, valuation tools, deal pipeline, and a developer API.
  Federates public data from FAA, EASA, ADS-B, OpenSky, NTSB, and licensed sources.
Main user types: Buyers, Sellers, Brokers, Dealers, Lenders, API Developers, Admins
Important pages: / (Dashboard), /finance-advisor (Aircraft Advisor), /listings,
  /marketspace, /intelligence, /verify, /api, /twin/:registration, /sales-pipeline,
  /pricing, /plans, /my-account, /n-lookup
Main database records: ATIPassport, AircraftListing, FAAAircraft, EngineSpec,
  Lead, SalesPipeline, Entitlement, ReportRequest, PurchasedReport, MarketReport
External services: Supabase (federated FAA data), Stripe (payments), Gmail (email),
  OpenSky / ADS-B.lol (live traffic), Meta Ads + Facebook Pages (marketing),
  GitHub, Google Calendar, Hugging Face, NTSB, EASA
Most important workflows: Aircraft Verification Report purchase→fulfill, FAA registry
  sync, Lead attribution, Listing auto-enrich, Market report generation, Stripe
  webhook→entitlement, Broker alert on traffic
What I must never do: Publish an aircraft without admin approval; expose owner
  contact details publicly; score missing public data as "AVOID" (use
  INSUFFICIENT_DATA); bypass entitlement checks; paste secrets into documents;
  send external messages without approval
```

---

## 1. Website URL & Public Surface

| | |
|---|---|
| **Published app** | https://aircraftbuyorsell.base44.app |
| **Custom domain** | Ask the user (connected separately) |
| **Function URLs (for provider dashboards)** | `https://aircraftbuyorsell.base44.app/functions/<functionName>` |
| **In-app function calls** | Always via SDK: `base44.functions.invoke("name", payload)` — never absolute URLs |

### Core value proposition
**"Verify before you Sell or Buy."** Every aircraft transaction should start with a
verified transparency report. ABOS aggregates public registry + live traffic +
compliance data into a single paid PDF, gated behind entitlement checks.

---

## 2. What the Website Does

ABOS is a **B2B/B2C aviation intelligence platform** with four mega-hubs:

1. **Marketspace** (`/marketspace`) — Aircraft marketplace, deal radar, listings,
   dealer network, partner feeds.
2. **Intelligence** (`/intelligence`) — ATI scoring, valuation studio, market
   reports, analytics, calculators, OMVM valuation engine.
3. **Verify** (`/verify`) — Aircraft Advisor (verification reports), Digital Twin,
   N-Lookup, FAA registry map, live traffic globe, pre-buy inspection.
4. **API** (`/api`) — Developer portal, Core API, OAuth, API keys, integration kit.

### Primary product: Aircraft Verification Report
A **single, paid, one-time report** per registration. The "Carvago model":
- User searches a registration → sees **free public preview** (identity, make/model,
  registry evidence, compliance counts).
- **Premium sections** (ATI score, valuation, deal analysis, full flight history)
  are gated behind an entitlement check (`ATI_FULL_REPORT`).
- After Stripe payment → PDF generated + emailed via Gmail.
- Pricing: **€29 base report**, **€49 valuation report**.

---

## 3. Main User Types

| Type | What they do | Key pages |
|---|---|---|
| **Buyer** | Verify aircraft before purchase, get ATI report, compare listings | `/finance-advisor`, `/verify`, `/compare` |
| **Seller** | List aircraft, get valuation, attract verified buyers | `/listings`, `/valuation-studio` |
| **Broker** | Manage deal pipeline, assign to aircraft, earn commissions | `/sales-pipeline`, `/experts` |
| **Dealer** | Bulk listings, dealer network, partner feeds | `/marketspace`, `/partner-portal` |
| **Lender** | Investment briefs, escrow, valuation | `/investment-brief`, `/escrow-agreement` |
| **API Developer** | Core API, OAuth, webhooks, tool marketplace | `/api`, `/developers`, `/developers/core-api` |
| **Admin** | Full backend, settings, monetization, marketing | `/admin/*`, `/admin/settings`, `/admin/monetization` |

---

## 4. Important Pages (routes from `src/App.jsx`)

### Primary hubs
| Route | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Landing, aircraft search hero, platform stats |
| `/finance-advisor` | Aircraft Advisor (PricingAdvisor) | **Primary verification flow** — calls `aircraftDataHub` |
| `/listings` | Listings | Aircraft marketplace grid |
| `/marketspace` | Marketspace Hub | Tab-based hub for marketplace tools |
| `/intelligence` | Intelligence Hub | Tab-based hub for analytics/scoring |
| `/verify` | Verify Hub | Tab-based hub for verification tools |
| `/api` | API Hub | Tab-based hub for developer tools |

### Verification & intelligence
| Route | Purpose |
|---|---|
| `/twin/:registration` | Digital Twin — federated aircraft profile |
| `/n-lookup` | N-Number registry search |
| `/ati-passport/:listingId` | ATI Passport detail (Digital Twin) |
| `/ati-card/:cardCode` | Public ATI Card (shareable) |
| `/deal-radar` | Deal radar — hot deals |
| `/ati-quick-score` | Quick ATI score lookup |
| `/ati-full-report` | Full ATI report (paid) |
| `/ati-verify` | ATI verify session |
| `/pre-buy-inspection` | Pre-buy inspection workspace |
| `/traffic` | Live traffic globe (FAA map / OpenSky) |
| `/registry-comparator` | Compare aircraft across registries |

### Marketplace & deals
| Route | Purpose |
|---|---|
| `/marketplace` | Public marketplace |
| `/sales-pipeline` | Deal pipeline (broker workflow) |
| `/experts` | Expert network (cross-checks, valuations) |
| `/compare` | Side-by-side aircraft comparison |
| `/valuation-studio` | OMVM valuation engine |
| `/omvm-valuation` | Valuation page |
| `/market-reports` | Auto-generated market reports |
| `/cross-border-bridge` | Cross-border transfer logistics |

### Calculators
| Route | Purpose |
|---|---|
| `/calculators` | Calculators hub |
| `/opex-calculator` | Operating cost |
| `/leasing-calculator`, `/insurance-calculator` | Ownership costs |
| `/avionics-upgrade-calculator`, `/exterior/interior-refurbishment-calculator` | Upgrade ROI |
| `/fractional-calculators` | Fractional ownership |

### Platform & accounts
| Route | Purpose |
|---|---|
| `/pricing`, `/plans` | Pricing & subscription plans |
| `/my-account` | User account settings |
| `/billing`, `/wallet` | Billing & ABOS wallet |
| `/subscription` | Subscription management |
| `/my-reports` | Purchased reports |
| `/affiliate-dashboard` | Affiliate program |
| `/partner-portal` | Partner/tenant portal |
| `/install` | White-label install wizard |

### Legal
| Route | Purpose |
|---|---|
| `/terms-of-service`, `/privacy-policy`, `/cookie-policy` | Standard legal |
| `/gdpr-compliance`, `/legal/dsa`, `/legal/ai-transparency`, `/legal/ip-notice` | EU compliance |
| `/affiliate-agreement`, `/escrow-agreement` | Partner agreements |

---

## 5. Main Database Records (Entities)

Entities live in `base44/entities/*.jsonc`. All have built-in: `id`, `created_date`,
`updated_date`, `created_by_id`.

### Core aircraft intelligence
| Entity | Purpose |
|---|---|
| **ATIPassport** | Digital Twin — the master aircraft profile. Holds ATI scores (8 dimensions × 15pts = 120), data integrity shield, broker assignment, engine life. |
| **AircraftListing** | Marketplace listing (make, model, price, ATI score, deal score, photo) |
| **FAAAircraft** | FAA registry record (n_number, serial, year, status, mode_s_hex) |
| **EngineSpec** | Engine specifications (TBO, HP, fuel type) — synced from Supabase |
| **EngineMaintenance** | Engine life calculation (remaining hours, service bulletins) |
| **ATIVerifySession** | Verification session record |
| **ATIVerifyScore** | ATI verify scoring result |
| **ATIVerifyDocument** | Uploaded verification documents |
| **GlobalRegistry** | International registry cache |
| **AircraftDamageEvent** | NTSB damage history |
| **AircraftAlert** | User alert on aircraft changes |
| **MarketComparable** | Market comparable sales data |

### Sales & CRM
| Entity | Purpose |
|---|---|
| **Lead** | Sales lead (name, email, aircraft preference, status, affiliate chain) |
| **LeadEvent** | Attribution events (card views, clicks, conversions) |
| **SalesPipeline** | Deal pipeline (steps, broker, buyer, sale amount) |
| **DealerLead** | Dealer-specific leads |
| **DealerLocation** | Dealer geographic locations |
| **BrokerProfile** | Broker profiles |
| **BrokerAgreement** | Broker agreement records |
| **BrokerAlert** | Broker notification triggers |
| **CommissionLedger** | Commission accounting |
| **Settlement** | Settlement records |
| **EscrowTransaction** | Escrow deal records |

### Marketplace & cards
| Entity | Purpose |
|---|---|
| **ATICard** | Shareable aircraft intelligence card |
| **ATICardReview** | Card reviews |
| **AircraftListingReview** | Listing reviews |
| **PartnerListingFeed** | Partner feed ingestion config |
| **PartnerConfig** | White-label partner config |
| **NewPlaneBrowser** | New aircraft browser data |

### Market intelligence
| Entity | Purpose |
|---|---|
| **MarketReport** | Auto-generated market reports |
| **MarketForecast** | Market forecasts |
| **MarketComparable** | Comparable sales |
| **OmvmValuation** | OMVM valuation results |
| **OmvmMarketAnalysis** | Market analysis runs |
| **OmvmCalibrationRun** | Valuation calibration |
| **DealRadar** | Hot deal detection |
| **AviationNewsItem** | Aviation news items |

### Monetization & entitlements
| Entity | Purpose |
|---|---|
| **Entitlement** | Product access grants (ATI_FULL_REPORT, PRO, API_*, etc.) |
| **ReportRequest** | Verification report purchase funnel (email→payment→delivery) |
| **PurchasedReport** | Delivered reports |
| **ReportCreditBalance** | Report pack credits |
| **ReportCreditTransaction** | Credit ledger |
| **Order** | Generic orders |
| **PaymentEvent** | Payment events |
| **BillingEvent** | Billing events |
| **SubscriptionManagement** | Subscription records |
| **TierChange** | Tier change logs |

### Platform & API
| Entity | Purpose |
|---|---|
| **Tenant** | White-label tenant |
| **License** | White-label license |
| **TenantApiKey** | Tenant API keys |
| **ContractAcceptance** | License acceptance audit |
| **ApiKey** | Developer API keys |
| **ApiMonthlyUsage** | API usage tracking |
| **ApiRequestLog** | API request logs |
| **ApiAccessApproval** | API access approvals |
| **OAuthClient** | OAuth client apps |
| **OAuthAuthorizationCode** | OAuth auth codes |
| **ToolIntegration** | Marketplace tool integrations |
| **ToolInvocation** | Tool invocation logs |
| **DeveloperAccount** | Developer accounts |
| **WebhookConfig** | Webhook configurations |

### Verification & safety
| Entity | Purpose |
|---|---|
| **VerificationClaim** | Verification claims |
| **VerificationSession** | Verification sessions |
| **PreBuyInspection** | Pre-buy inspection records |
| **ExpertCrossCheck** | Expert cross-check requests |
| **ExpertBid** | Expert bids on cross-checks |
| **ExpertProfile** | Expert profiles |
| **ExpertValuation** | Expert valuations |
| **VaultDocument** | Secure document vault |
| **BillOfSaleDraft** | Bill of sale drafts |
| **OwnershipTrace** | Ownership history trace |

### Marketing & social
| Entity | Purpose |
|---|---|
| **MarketingCampaign** | Meta ad campaigns |
| **MarketingPost** | Published social posts |
| **SocialPublishConfig** | Social publishing config |
| **FacebookGroupEvent** | Facebook group webhook events |
| **ScraperRun** | Data scraper run logs |
| **AviationNewsItem** | News items |

### Admin & system
| Entity | Purpose |
|---|---|
| **AdminSettings** | Admin configuration |
| **AdminAuditTrail** | Admin action audit |
| **AdminDashboard** | Admin dashboard config |
| **AppConfig** | App configuration |
| **FeatureToggle** | Feature flags |
| **FeatureRollout** | Feature rollout state |
| **FeatureRequest** | User feature requests |
| **FeatureVote** | Feature votes |
| **FeatureUsageMetric** | Usage analytics |
| **UserBehavior** | Behavior tracking (GDPR-bounded) |
| **DecisionLog** | Decision audit |
| **PermissionLog** | Permission change log |
| **SuspensionEvent** | Account suspensions |
| **AccountDeletion** | GDPR deletion requests |
| **RewardMilestone** | Reward milestones |
| **UsageRecord** | Usage records |
| **TokenTransaction** | Token economy ledger |
| **SkillDefinition** | Skill definitions |
| **StartupProject** | Startup hub projects |
| **EditorProfile** | Content editor profiles |
| **UserProfile** | Extended user profile |

### Aviation services
| Entity | Purpose |
|---|---|
| **AviationService** | Mechanics, FBOs, flight schools, dealers |
| **TrafficSnapshot** | Live traffic snapshots |
| **TrafficAppearance** | Traffic appearance records |
| **LaddBlockList** | LADD privacy block list |
| **FAADocIndex** | FAA document index |
| **NTSBDamageIndexChunk** | NTSB damage index (chunked) |
| **AirmanReleaseMonitor** | FAA airman release monitoring |

### Sync helpers
| Entity | Purpose |
|---|---|
| **ABOSDataRegistry** | Data source registry |
| **AffiliateLink** | Affiliate links |
| **SalesFunnel** | Sales funnel configs |
| **Workflow** | Workflow definitions (entity-backed) |

> **User** is built-in (never created manually — invite via `base44.users.inviteUser`).

---

## 6. External Services & Integrations

### Connectors (OAuth-managed)
| Service | integration_type | Purpose |
|---|---|---|
| **Supabase** | `supabase` | Federated FAA registry data, live traffic, aircraft catalog |
| **Gmail** | `gmail` | Report PDF delivery, notifications |
| **Google Calendar** | `googlecalendar` | Escrow/deal scheduling |
| **Google Drive/Docs/Sheets** | `googledrive`, `googledocs`, `googlesheets` | Document export |
| **GitHub** | `github` | Feature request sync, repo sync |
| **Meta Ads** | `meta_ads` | Ad campaign management |
| **Facebook Pages** | `facebook_pages` | Social publishing |
| **Instagram** | `instagram` | Social publishing |
| **Hugging Face** | `hugging_face` | AI model inference |
| **HubSpot** | `hubspot` | CRM sync |
| **DocuSign** | `docusign` | Broker agreements |
| **Google Search Console/Analytics** | — | SEO/analytics |

### External APIs (via backend functions + secrets)
| Service | Secret(s) | Purpose |
|---|---|---|
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments, entitlement provisioning |
| **OpenSky** | (connector token) | Live ADS-B traffic |
| **ADS-B.lol / ADS-BDB** | (public API) | Flight history, Mode-S identity |
| **NTSB** | `NTSB_API_KEY` | Damage history |
| **Supabase Management** | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Project management, read-only SQL |
| **Supabase (client)** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend client |
| **OpenAI** | `OpenAI_API_Key_abos_marketspace` | LLM inference |
| **Anthropic** | `ANTHROPIC_API_KEY` | LLM inference |
| **NVIDIA** | `NVIDIA_API_KEY`, `NVIDIABuild-Autogen-12` | AI inference |
| **Google/Gemini** | `Gemini_API_Key`, `google_oauth_client_secret` | LLM, web search |
| **HuggingFace** | `HUGGINGFACE_API_KEY` | Model hosting |
| **Cloudflare** | `CLOUDFLARE_API_TOKEN`, `Cloudflare_API_Key` | Workers, gateway |
| **Superagent** | `SUPERAGENT_API_KEY`, `st_elmo_api_key` | St. Elmo AI agent |
| **12byteflow** | `12byteflow_key`, `12byteflow-api-client`, `SAKANA_12byteflow_API_KEY` | Sakana AI integration |
| **Base44** | `BASE44_API_KEY`, `BASE44_APP_URL`, `base44-agent-api` | Platform API |
| **MCP** | `MCP_BARIER_TOKEN` | MCP server auth |
| **Gateway** | `GATEWAY_SECRET` | Core API gateway |
| **SSO** | `sso_client_id`, `sso_client_secret`, `sso_name`, `sso_discovery_url` | SSO provider |
| **Automation** | `ABOS_AUTOMATION_SECRET` | Internal automation auth |
| **Meta webhooks** | `META_VERIFY_TOKEN` | Facebook webhook verification |
| **FB automation** | `FB_AUTO_COMMENT_ENABLED`, `FB_AUTO_COMMENT_MIN_CONFIDENCE` | Auto-comment config |

> **All secrets are stored securely** — never paste values into documents, code, or chat.

---

## 7. Technical Wiring — Key Flows

### Flow A: Aircraft Verification Report (primary product)

```text
User searches registration (/finance-advisor)
→ PricingAdvisor.jsx calls base44.functions.invoke("aircraftDataHub", {registration})
→ aircraftDataHub federates: FAA registry, ACFTREF, engine ref, AD/STC, filing signals,
   OpenSky, ADS-B.lol history, marketplace listing
→ Returns: aircraft identity + provenance + data_sufficiency + compliance + activity + premium(locked)
→ If data_sufficiency == "insufficient" → render INSUFFICIENT_DATA card (no score)
→ If sufficient + user has ATI_FULL_REPORT entitlement → show ATI score + valuation
→ If not entitled → show "Unlock Full Intelligence Report" CTA
→ User clicks → startCheckout → stripeCreateCheckout (Stripe Checkout, €49)
→ Stripe payment → success_url redirect → reportFulfill function
→ reportFulfill: verify Stripe session → generate PDF (jsPDF) → send via Gmail
→ ReportRequest status: email_captured → pending_payment → paid → delivered
```

**Wiring detail:**
```text
Page: /finance-advisor?registration=N6241Z
Button: "View Full Intelligence Report"
Input: registration (URL param)
API: aircraftDataHub (free preview), stripeCreateCheckout (payment),
     reportFulfill (delivery), abosEntitlements (access check)
Database: ATIPassport, ReportRequest, Entitlement, FAAAircraft, EngineSpec
Trigger: User search (manual) + Stripe payment success (redirect)
Result: PDF emailed to buyer, ReportRequest.status = "delivered"
Error handling: INSUFFICIENT_DATA state for missing public data;
  "No registry match" amber card for unknown registrations;
  redirect to login if unauthenticated
```

### Flow B: Digital Twin initialization

```text
User views /twin/:registration or triggers ATI analysis
→ initDigitalTwin function
→ Queries FAAAircraft, GlobalRegistry, creates/updates ATIPassport
→ dataIntegrityShield: cross-checks FAA vs ADS-B vs adsbdb (3-source agreement)
→ Confidence badge: verified (3 sources) / caution (2) / unverified (1)
→ Engine match: EngineSpec by engine_code → TBO, HP, fuel type
→ Stores: registration, icao_hex, serial, engine_spec_id, ati_total
```

### Flow C: Marketplace listing

```text
Seller creates listing (/listings)
→ AircraftListing entity (make, model, price, registration, photos)
→ RLS: only owner or admin can create/update/delete; public listings visible to all
→ autoEnrichListing workflow: fetch FAA data, auto-populate year/serial
→ autoScoreFAA: compute ATI score from registry completeness
→ autoValuateOnCardAttach: OMVM valuation when ATI card attached
→ onListingATIUpdate: re-score when listing data changes
→ Listing visible in marketplace + deal radar
```

### Flow D: Lead attribution (affiliate)

```text
Visitor arrives via /l/:slug (affiliate link)
→ affiliateTrack function: records click, session, chain_slugs
→ Lead form submitted → Lead created with affiliate_chain_slugs
→ LeadEvent: lead_created (attribution_key prevents duplicates)
→ Workflow: Affiliate Lead Attribution → cmrLeadScore → status update
→ If converted → Affiliate Pipeline Conversion → commission calculation
```

### Flow E: Stripe payment → entitlement

```text
User pays (report, plan, pack)
→ Stripe Checkout → stripeWebhook (webhook endpoint)
→ Verifies signature (STRIPE_WEBHOOK_SECRET)
→ Creates Entitlement: {user_email, product_key, scope, stripe_payment_id, status:"active"}
→ For ATI_FULL_REPORT: aircraft-scoped entitlement
→ Report fulfillment: reportFulfill generates + emails PDF
```

### Flow F: FAA registry sync

```text
Scheduled workflow: "FAA Registry Sync"
→ syncFaaFromSupabase function
→ Pulls FAA registry from Supabase → syncs to FAAAircraft entity
→ importFaaToSupabase: imports raw FAA data into Supabase tables
→ createFaaAtiCards: generates ATI cards from registry
→ syncFaaToAtiCard: updates cards on registry changes
```

### Flow G: Live traffic ingestion

```text
Scheduled workflow: "Live Traffic Ingestion"
→ ingestLiveTraffic function → OpenSky / ADS-B.lol API
→ Stores TrafficSnapshot, updates TrafficAppearance
→ Broker Alert workflow: notifies assigned brokers on new sightings
→ Aircraft Alert Matcher: notifies users watching an aircraft
```

### Flow H: Market report generation

```text
Scheduled workflow: "Market Reports — Daily Auto-Generate"
→ generateMarketReport function
→ Computes analytics from AircraftListing + MarketComparable
→ Stores MarketReport entity
→ Optionally publishes to Facebook/social (SocialPublishConfig)
```

---

## 8. Key Backend Functions (important ones)

### Verification & intelligence
```text
Function: aircraftDataHub
Inputs: { registration }
Checks: user authenticated, access tier resolved
Action: Federates FAA registry, ACFTREF, engine ref, AD/STC, filings,
        OpenSky, ADS-B history, marketplace → unified payload
Failure: 404 (not found), 401 (unauthorized), 502 (data source unavailable)
Success: { found, aircraft, compliance_intelligence, activity_intelligence,
          certificates, traffic, registry_filings, premium(unlocked?), data_sources }
```

```text
Function: atiFullReportScore
Inputs: { aircraft_data (JSON), registration }
Checks: data sufficiency (year/serial/airworthiness present) → INSUFFICIENT_DATA if missing;
        ATI_REPORT entitlement (paid)
Action: Scores 8 ATI dimensions via LLM, generates valuation, strengths/risks
Failure: INSUFFICIENT_DATA (no charge), 402 (not entitled)
Success: { total, score_label, dimensions, omvm_low/high, summary, recommendations }
```

```text
Function: initDigitalTwin
Inputs: { registration }
Action: Creates/updates ATIPassport from FAA + ADS-B + global registry
Success: ATIPassport with icao_hex, serial, engine match, confidence badge
```

```text
Function: reportCheckout
Inputs: { registration, email, returnUrl }
Action: Creates ReportRequest, init Digital Twin, Stripe Checkout session (€49)
Success: { checkoutUrl, requestId }
```

```text
Function: reportFulfill
Inputs: { session_id }
Checks: Stripe session verified (paid), idempotency (already delivered?)
Action: Generates PDF (jsPDF), sends via Gmail
Success: { delivered: true }
Failure: 402 (not paid), email delivery error (status=failed)
```

### Sales & CRM
```text
Function: cmrLeadScore
Inputs: { lead_id }
Action: Scores lead (buyer qualification, aircraft match, budget fit)
Success: Lead status updated, score stored
```

```text
Function: cmrMatchEngine
Inputs: { buyer_profile, aircraft_criteria }
Action: Matches buyers to aircraft, returns compatibility scores
```

```text
Function: orchestrateSalesStep
Inputs: { pipeline_id, step_id }
Action: Executes a sales pipeline step (verification, document, valuation, etc.)
```

### Marketplace
```text
Function: autoEnrichListing
Inputs: { listing_id }
Action: Fetches FAA data, populates year/serial/engine from registry
```

```text
Function: applyValuationToListing
Inputs: { listing_id, valuation }
Action: Applies OMVM valuation to listing, updates deal_score
```

### Payments
```text
Function: stripeCreateCheckout
Inputs: { priceId, returnUrl, report_registration, product_key }
Action: Creates Stripe Checkout session
Success: { sessionUrl }
```

```text
Function: stripeWebhook
Inputs: Stripe webhook (raw body + signature)
Checks: signature verification
Action: Provisions entitlements on payment, triggers fulfillment
```

```text
Function: abosEntitlements
Inputs: { action: "check"|"grant"|"revoke", product_key, aircraft_registration }
Action: Check/grant/revoke product access
Success: { entitled: boolean }
```

---

## 9. Workflows (automated processes)

Workflows live in `base44/workflows/*.jsonc`. Trigger types: `scheduled`,
`entity`, `connector`, `app_user_auth`, `app_publish`, `app_payment`.

### Scheduled
| Workflow | Schedule | Purpose |
|---|---|---|
| FAA Registry Sync | scheduled | Sync FAA data from Supabase |
| Live Traffic Ingestion | scheduled | Pull ADS-B/OpenSky traffic |
| Daily Aviation News Pipeline | scheduled | Generate + publish news |
| Weekly Market Forecast Generation | scheduled | Market forecast |
| Weekly Pipeline Email Summary | scheduled | Broker pipeline digest |
| Market Reports — Daily Auto-Generate | scheduled | Market analytics reports |
| OMVM v5 Recalc on Price Change | entity (AircraftListing) | Re-value on price change |
| Data Integrity Shield | entity (ATIPassport) | Cross-source validation |

### Entity-triggered
| Workflow | Trigger | Purpose |
|---|---|---|
| Auto-Enrich Listing from Registry | Listing created | Populate from FAA |
| Auto-Valuate on ATICard Attach | Card attached | Run OMVM |
| Buyer Interest — Notify Brokers | Buyer interest event | Broker alert |
| Affiliate Lead Attribution | Lead created | Attribute to affiliate |
| Lead Auto-Score (CMR) | Lead created | Score lead |
| Affiliate Pipeline Conversion | Lead converted | Commission calc |
| Pipeline Status Change Notification | Pipeline updated | Notify parties |
| Broker Alert — Notify on New Traffic | Traffic snapshot | Broker notification |
| Aircraft Alert Matcher | Traffic snapshot | User alert match |
| Expert Valuation Submitted | Expert valuation | Score + notify owner |
| Listing View — Deal Wizard Check-In | Listing viewed | Deal wizard prompt |
| Seller listing fee assignment | Listing created | Apply fee |
| Buyer Trial Ending Notice | Scheduled | Trial expiry email |

### Connector-triggered
| Workflow | Trigger | Purpose |
|---|---|---|
| Facebook Listing Publisher | Facebook webhook | Auto-publish listings |
| Sync Feature Requests to GitHub | GitHub webhook | Mirror feature requests |

### Data hygiene
| Workflow | Purpose |
|---|---|
| P0 — DeveloperAccount 1:1 per user on create | Dedup |
| P0 — UserProfile 1:1 dedup on create | Dedup |
| P0 — AircraftListing 1:1 per registration on create | Dedup |
| P0 — PartnerConfig unique embed_token on create | Dedup |
| UserBehavior GDPR Cleanup (90-day) | Privacy compliance |
| Meta Ads Budget Optimizer | Ad spend optimization |
| FAA Airman Release Monitor | Airman monitoring |
| Escrow — Email Notifications on Status Change | Escrow comms |

---

## 10. Standing Rules (persistent instructions)

```text
NEVER publish an aircraft listing without admin approval.
NEVER expose owner contact details (name, email, phone) publicly — mask as "****".
NEVER score missing public data as "AVOID" — return INSUFFICIENT_DATA with missing_public_fields.
ALWAYS verify the registration number before creating a Digital Twin or report.
ALWAYS check entitlements (ATI_FULL_REPORT, ATI_REPORT, PRO, API_*) before revealing premium data.
ALWAYS use EUR for European listings and report pricing (€29 base, €49 valuation).
NEVER bypass Row-Level Security (RLS) — use base44.asServiceRole only in backend functions.
NEVER paste API keys, secrets, or tokens into documents, chat, or frontend code.
ASK for approval before sending external messages (email, social posts, push).
NEVER auto-publish to Facebook/Instagram without SocialPublishConfig enabled + admin approval.
ALWAYS label data sources (FAA Registry, ADS-B, OpenSky, Marketplace) for transparency.
NEVER claim unverified data as fact — use confidence badges (verified/caution/unverified).
ALWAYS handle INSUFFICIENT_DATA gracefully — recommend owner records, don't fabricate scores.
NEVER store large content (base64, PDFs, blobs) in entity fields — use file_url.
```

---

## 11. Brand & Design System

```text
Brand: ABOS — Aircraft Buy Or Sell
Slogan: "Verify before you Sell or Buy"
Primary product: Aircraft Verification Report (Carvago model)

Design system: base44/virtual/DESIGN_SYSTEM.md (read this before building UI)

Color palette:
  Light mode: warm paper #F5F5F0 canvas, navy #0A3C75 links, charcoal #1A1814 text
  Gold accent: #E0B034 (light) / #D4A017 (dark)
  Dark mode: #0B1220 canvas, gold #D4A017, neon accents

Typography: Work Sans (heading + body), Courier Prime (monospace metrics)
Aesthetic: "Instrument Panel" for Intelligence Hub (dark slate, tabular monospace)
Verification flow: "Cebia-style" (high-trust, immediate identification, clear CTA)

Key UI patterns:
  - Gold-accented gradient card headers for all hubs
  - Tab-based navigation within hubs (URL ?tab= persistence)
  - Provenance pills on every data field (source attribution)
  - INSUFFICIENT_DATA amber card (not red/negative)
  - "No registry match" amber card (not a negative finding)
  - Regulatory trust strip in footer (FAA, EASA, ICAO, NTSB, OpenSky, EU legislation)
  - Responsive: mobile-first, 16:9 + 9:16 aspect ratio support
  - Theme: follows system dark mode if no local setting
```

---

## 12. Architecture Notes

```text
Frontend: React + Vite + Tailwind CSS + shadcn/ui
  - Pages: src/pages/*.jsx
  - Components: src/components/**/*.jsx
  - Layout: src/components/Layout.jsx (drawer + header + footer)
  - Router: src/App.jsx (all routes)
  - SDK client: src/api/base44Client.js (pre-initialized base44)

Backend: Deno functions in base44/functions/*/entry.ts
  - Shared utils: base44/functions/_shared/
  - Secrets: accessed via Deno.env.get("SECRET_NAME")
  - Connectors: base44.asServiceRole.connectors.getConnection("type")

Database: Base44 entities (base44/entities/*.jsonc) + Supabase (federated FAA data)
  - Entity SDK: base44.entities.EntityName.list/filter/create/update/delete
  - Supabase REST: accessed via service role key in backend functions

External gateway: Cloudflare Workers (core-api, security-worker) — for public API

Sync: GitHub 2-way repo sync available; Vite for builds

Key SDK patterns:
  base44.entities.X.list('-created_date', 20)        // sort, limit
  base44.entities.X.filter({status:'active'}, '-created_date', 10)
  base44.entities.X.create({...})
  base44.entities.X.update(id, {...})
  base44.functions.invoke("aircraftDataHub", {registration})
  base44.auth.me() / base44.auth.redirectToLogin() / base44.auth.logout()
  base44.users.inviteUser("email", "user"|"admin")
  base44.integrations.Core.InvokeLLM({prompt, response_json_schema, model})
  base44.integrations.Core.SendEmail({to, subject, body})
  base44.integrations.Core.UploadPublicFile({file})
  base44.analytics.track({eventName, properties})
```

---

## 13. Known Issues & Constraints

- Non-N-registered aircraft lack photo auto-fetch (no FAA photo source)
- Facebook publishing requires active Page access (Meta App Review pending for Groups API)
- Anonymous OpenSky access is rate-limited
- Owner masking is inconsistent across lookup paths (being standardized)
- NoRegistryMatch component exists but is not wired in all lookup paths
- B2B features (team workspaces, seat management, pooled allowances) not yet built
- Finder fee / commission calculations are inconsistent across flows
- Dashboard and NLookup handle registration normalization differently

---

## 14. How to Use This Context

1. **For new features**: Find the relevant flow above, check existing entities/functions,
   reuse before creating new ones.
2. **For data questions**: Check entity schemas in `base44/entities/`, use `read_file`.
3. **For integrations**: Check authorized connectors list, load usage guides via
   `get_connectors_info(["type"])` before writing connector code.
4. **For payments**: Stripe is the only available provider in this region (CZ).
5. **For secrets**: Never ask for values — they're stored securely. Reference by name.
6. **For UI**: Read `base44/virtual/DESIGN_SYSTEM.md` before building or restyling.
7. **For workflows**: Use `get_capability_guide("workflows")` before authoring.
8. **For agents**: Use `get_capability_guide("agents")` before creating in-app agents.

---

*Last updated: 2026-09-16. Compiled from live app structure.*