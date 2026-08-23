# TASK-002 Provider Ownership and Rotation Checklist

Record dates, people and secret values only in the approved external secret-management system. This file tracks responsibilities and checks, never credentials.

| Provider/class | Accountable owner | Rotation trigger | Required checks |
|---|---|---|---|
| Cloudflare deployment | Platform Administration | 90 days, role change or suspected exposure | Environment-scoped token; no DNS/account-wide permission unless required; production approval enabled |
| Supabase runtime | Data Platform | 90 days, project change or RLS incident | Separate project/environment; service role never reaches browser; RLS verified before publishable-key use |
| Supabase management | Platform Administration | 90 days or administrator change | CI/admin only; absent from public runtime; project scope minimized |
| Stripe API | Payments | 90 days or payment incident | Test/live separation; server only; old key revoked after verification |
| Stripe webhook | Payments | Endpoint recreation or suspected exposure | Unique per environment and endpoint; raw-body signature failure tested |
| AI providers | AI Platform | 90 days, provider change or quota incident | Server-side gateway only; project/model/quota restrictions; logging redaction |
| OpenSky | Integrations | 90-180 days or OAuth client change | Unique OAuth client per environment; token response restricted to authorized server flow |
| Alchemy | Integrations | Before deferred feature activation and every 90 days | Tokenized RPC URL treated as secret; network/method restrictions enabled |
| Base44 compatibility | Migration | Every cutover checkpoint | Compatibility vars only in approved environments; removal milestone recorded |
| Escrow | Payments | Before any future activation | Absent from launch runtime; separate approval and security review required |

## Per-rotation procedure

- [ ] Confirm provider, account, project and owner.
- [ ] Create a new environment-specific credential; do not copy the Base44 value by default.
- [ ] Apply least privilege, API restrictions, quotas and allowlists.
- [ ] Store through the environment's approved secret mechanism.
- [ ] Test success, denial and expired/revoked behavior without logging the value.
- [ ] Deploy to development, then preview; require approval for production.
- [ ] Revoke the previous credential only after verified cutover.
- [ ] Record owner, rotation timestamp, expiry and evidence externally.
- [ ] Confirm repository, issues, prompts, artifacts and logs contain no value.
