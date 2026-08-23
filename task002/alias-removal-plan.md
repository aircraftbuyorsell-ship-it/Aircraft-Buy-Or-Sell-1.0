# TASK-002 Ambiguous Alias Removal Plan

No runtime references are changed by TASK-002. These steps define a future, separately approved migration.

| Current alias | Canonical target | Status | Removal gate |
|---|---|---|---|
| `OpenAI_API_Key_abos_marketspace` | `OPENAI_API_KEY` | Ready to migrate | Server consumer inventory, new key, development/preview verification |
| `SAKANA_12byteflow_API_KEY` | `SAKANA_API_KEY` | Blocked | Confirm actual provider/account and consumer ownership |
| `12byteflow_key` | `SAKANA_API_KEY` | Blocked | Prove same provider and credential class; otherwise create provider-specific name |
| `Default_API_Key` | None until traced | Prohibited | Trace every consumer; replace each use with a provider-specific canonical name |
| `SUPABASE_ACCESS_TOKEN` / Base44 connector `accessToken` | `SUPABASE_MANAGEMENT_TOKEN` | Administration only | Remove runtime management-API dependency; configure scoped runtime credentials directly |
| Connector-derived `service_role` | `SUPABASE_SERVICE_ROLE_KEY` | Migration required | Stop dynamically retrieving service keys; rotate and configure per Worker environment |
| `BASE44_APP_URL` | `ABOS_APP_URL` | Ready to migrate | Canonical domain decision and compatibility regression tests |
| `VITE_BASE44_*` | `VITE_BASE44_COMPAT_*` | Temporary compatibility | Remove after SDK/Core API cutover |

## Safe sequence

1. Locate all consumers and classify browser, runtime, CI/admin or connector usage.
2. Confirm the provider and owner; never infer that two aliases share a value.
3. Create and rotate to the canonical credential separately in each environment.
4. Update runtime references in a dedicated implementation task with rollback.
5. Validate success and denial paths, then revoke the old alias.
6. Remove the alias from Base44/Cloudflare/GitHub only after usage telemetry is clear.
7. Keep escrow aliases deferred and absent from the active launch runtime.
