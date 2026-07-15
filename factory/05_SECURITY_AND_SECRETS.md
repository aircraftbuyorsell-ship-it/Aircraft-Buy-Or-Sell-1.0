# ABOS Security and Secrets Migration Inventory

**Status:** Initial focused inventory from uploaded source snapshot  
**Coverage note:** This is not an exhaustive Codex Security repository scan. It is a migration-focused secret and trust-boundary inventory.

## Initial Findings

- No common hardcoded private-key, GitHub token, Google API key or JWT patterns were found by the initial focused pattern scan.
- The application references 20 named environment variables across Base44 functions and frontend configuration.
- Frontend code uses publishable Base44 and Supabase configuration values.
- Privileged provider credentials are expected in the Base44 runtime and will not transfer automatically to Cloudflare.
- Connector definitions request access to GitHub, Supabase, Gmail, Google Docs, Google Calendar and Search Console; these permissions must be reauthorized and minimized in the target environment.

## Environment Variable Inventory

| Current name | Sensitivity | Target store | Migration rule |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Critical | Cloudflare Worker secret | Rotate and set server-side only |
| `STRIPE_WEBHOOK_SECRET` | Critical | Cloudflare Worker secret | Create environment-specific webhook endpoint and rotate |
| `SUPABASE_SERVICE_ROLE_KEY` | Critical | Cloudflare Worker secret | Never expose to browser; rotate before cutover |
| `SUPABASE_ACCESS_TOKEN` | Critical administrative | CI/administration secret only | Do not make available to public runtime unless required |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable | Frontend environment | Use only with verified RLS policies |
| `VITE_SUPABASE_URL` | Publishable configuration | Frontend and Worker environment | Environment-specific value |
| `ANTHROPIC_API_KEY` | Critical | AI gateway Worker secret | Provider routing only through server-side policy |
| `OpenAI_API_Key_abos_marketspace` | Critical | AI gateway Worker secret | Rename to a normalized target name and rotate |
| `GOOGLE_API_KEY` | Critical | AI gateway Worker secret | Restrict by API and environment where possible |
| `HUGGINGFACE_API_KEY` | Critical | AI gateway Worker secret | Scope and rotate |
| `NVIDIA_API_KEY` | Critical | AI gateway Worker secret | Scope and rotate |
| `SAKANA_12byteflow_API_KEY` | Critical | AI gateway Worker secret | Confirm provider ownership and rotate |
| `12byteflow_key` | Critical / duplicate alias | Remove after migration | Consolidate naming |
| `Default_API_Key` | Critical / ambiguous | Replace with provider-specific name | Ambiguous shared key names are prohibited |
| `OPENSKY_CLIENT_ID` | Sensitive | Integration Worker secret | Environment-specific OAuth credential |
| `OPENSKY_CLIENT_SECRET` | Critical | Integration Worker secret | Rotate and store server-side |
| `ALCHEMY_RPC_URL` | Sensitive endpoint credential | Worker secret | Treat embedded tokenized URL as secret |
| `ESCROW_API_KEY` | Critical | Deferred transaction secret store | Do not migrate into active launch runtime |
| `ESCROW_API_USER` | Sensitive | Deferred transaction secret store | Do not migrate into active launch runtime |
| `BASE44_APP_URL` | Configuration | Remove or compatibility configuration | Replace with canonical application URL |

## Frontend Configuration

The source snapshot also references:

- `VITE_BASE44_APP_ID`;
- `VITE_BASE44_APP_BASE_URL`;
- `VITE_BASE44_FUNCTIONS_VERSION`.

These values are part of the legacy client coupling. New UI code must use the ABOS SDK and target environment configuration rather than Base44 function URLs.

## Target Secret Ownership

| Secret class | Owner |
|---|---|
| Runtime provider credentials | Cloudflare Worker secrets |
| Database service credentials | Cloudflare Worker secrets / controlled migration jobs |
| CI deployment credentials | GitHub Actions environments |
| Publishable frontend values | Cloudflare Pages environment variables |
| Supabase auth provider secrets | Supabase Auth provider configuration |
| Local development values | untracked `.dev.vars` / `.env.local` files |

## Mandatory Migration Procedure

1. Inventory the value owner and current Base44 usage.
2. Create a normalized target name.
3. Rotate the credential instead of copying the current value when possible.
4. Configure development, preview and production separately.
5. verify least privilege and provider restrictions;
6. update runtime references;
7. test authentication and failure behavior;
8. revoke the old Base44 credential after verified cutover;
9. record rotation date and owner outside source control.

## Prohibited Actions

- Do not paste secret values into Codex, Cowork, issues or documentation.
- Do not commit `.env`, `.dev.vars` or service-role credentials.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` from browser code.
- Do not expose AI provider keys to the React client.
- Do not use one generic API key for multiple unrelated providers.
- Do not migrate escrow credentials into the first production wave.

## Security Priorities

### P0

- normalize secret names;
- design Cloudflare secret bindings;
- verify Supabase RLS before frontend cutover;
- preserve Stripe webhook signature verification;
- separate preview and production credentials.

### P1

- reduce connector scopes;
- centralize AI provider calls behind an execution policy;
- add secret scanning to CI;
- add dependency and authorization checks.

## Required CI Controls

- secret scanning;
- dependency audit;
- OpenAPI validation;
- contract breaking-change detection;
- lint and typecheck;
- migration dry run;
- tests for authentication and permission denial.