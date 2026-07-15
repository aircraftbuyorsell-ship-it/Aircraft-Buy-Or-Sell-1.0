# ABOS Capability Registry v0.1

**Status:** Initial inventory from uploaded Base44 source snapshot  
**Rule:** A capability is not considered platform-ready until contract, runtime, SDK, tests and migration evidence exist.

## Capability States

- `Legacy`: implemented primarily through Base44 UI/functions/entities.
- `Candidate`: identified but not yet contract-reconciled.
- `RC`: contract/runtime package has passed its defined release-candidate gates.
- `Extracting`: implementation is actively moving out of Base44.
- `Platform`: runs through the independent ABOS Platform runtime.

## Registry

| Capability | Existing evidence | Current state | Target service | Initial priority |
|---|---|---|---|---:|
| API Key Management | `abosCoreApi`, `ApiKey`, `ApiRequestLog` | Candidate | Identity / Developer Service | P0 |
| Aircraft Search | `abosCoreApi`, `Listings`, `Marketplace`, search components | Candidate | Search Service | P0 |
| Aircraft Retrieval | `AircraftListing`, `FAAAircraft`, `GlobalRegistry` | Candidate | Aircraft Identity Service | P0 |
| Listing Retrieval | `AircraftListing`, `listings.get`, `listings.list` | Candidate | Listing Service | P0 |
| Listing Creation | `listings.create`, listing pages and forms | Legacy | Listing Service | P0 |
| OMVM Valuation | `omvmV5Score`, `marketExpertValuation`, `Valuation` | Candidate | Valuation Service | P0 |
| ATI Scoring | `atiScoreNative`, `atiFullReportScore`, `orchestrateATIScoring` | Legacy | ATI Service | P1 |
| ATI Passport | `ATIPassport`, `ATICard`, ATI entities | Legacy | Aircraft Intelligence Service | P1 |
| Verification | `atiVerifyProcess`, registry and certificate functions | Legacy | Verification Service | P1 |
| Buyer Matching | `cmrMatchEngine`, `onBuyerInterest`, `DealRadar` | Legacy | Matching Service | P1 |
| Negotiation Brief | `cmrNegoBrief`, `sakanaDealBrief` | Legacy | Deal Intelligence Service | P2 |
| Market Intelligence | market analytics, reports, forecasts and HF functions | Legacy | Market Intelligence Service | P2 |
| Live Traffic | OpenSky and traffic functions/entities | Legacy | Traffic Integration Service | P2 |
| Messaging / Notifications | email summaries, alerts, connector use | Legacy | Messaging Service | P2 |
| Payments | Stripe checkout/webhook functions and billing entities | Legacy | Payment Service | P0 |
| Escrow | escrow functions/entities and USDC monitor | Legacy / Deferred | Future Transaction Service | Deferred |
| Documents / Vault | `VaultDocument`, `anchorVaultDocument`, `xmlReader` | Legacy | Document Service | P2 |
| Pre-buy Inspection | `managePreBuyInspection`, page/entity | Legacy | Inspection Service | P2 |
| Developer Portal | `Developers`, `CoreAPI`, `IntegrationKit` | Legacy | Developer Platform | P1 |
| Partner Integrations | `PartnerConfig`, feeds, webhooks, `intelExchange` | Legacy | Integration Service | P2 |
| Analytics | market, feature, funnel and behavior artifacts | Legacy | Analytics Service | P3 |
| Account Deletion / Privacy | account-deletion and cleanup functions/entities | Legacy | Identity / Compliance Service | P0 |
| Workflow Registry | `Workflow`, `listWorkflows`, `Workflows` | Legacy | Automation Control Plane | P3 |
| Skill Invocation | `SkillDefinition`, invokeSkill family | Legacy | Skill Runtime | P3 |

## First Proof-of-Concept Capability

`Aircraft Search` is the recommended first extracted vertical slice because it can validate:

- APL intent semantics;
- deterministic retrieval;
- canonical Aircraft/Listing DTOs;
- Cloudflare Worker routing;
- Supabase read access;
- generated SDK usage;
- MCP adapter mapping;
- a new UI page running beside the legacy page.

## Capability Package Requirements

Each capability directory must eventually include:

```text
README.md
apl.schema.json
adl.schema.json
openapi.yaml
runtime/
sdk/
mcp/
tests/
ui-reference/
migration.md
security.md
release-gate.md
```

Do not create empty placeholder implementations merely to satisfy this layout. Add files as the capability enters active delivery.