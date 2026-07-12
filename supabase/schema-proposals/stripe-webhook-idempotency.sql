-- Proposal only. Do not apply to production without migration review and approval.
-- Purpose: make Stripe event processing idempotent before any entitlement grant.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  payment_id text,
  status text not null check (status in ('processing', 'processed', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_code text
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

-- The webhook service role must claim an event with an atomic insert:
-- insert ... on conflict (event_id) do nothing returning event_id;
-- Only the session that receives a row may grant entitlements.
-- The entitlement grant and status='processed' update must execute in one database transaction.
