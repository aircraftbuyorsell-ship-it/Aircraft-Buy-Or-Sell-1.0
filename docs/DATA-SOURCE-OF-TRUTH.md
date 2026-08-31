# Source of truth: Supabase

**Decision:** Supabase is always the source of truth. Where the same fact exists
in both Supabase and Base44, Supabase wins and Base44 is treated as a cache.

This is the standing rule for new work. It is *not* yet true of the whole
platform — the sections below record exactly where it holds today and where it
does not, so nobody has to re-derive it.

## Where it already holds

| Data | Supabase table | Rows | Status |
|---|---|---|---|
| FAA registry | `faa_registry` | 308,985 | authoritative |
| Aircraft reference | `faa_acftref` | 93,572 | authoritative |
| Engine reference | `faa_engine` | 4,743 | authoritative |
| Dealers | `faa_dealers` | 12,507 | authoritative |
| Live traffic | `live_traffic` | 1.7M | authoritative |
| OpenSky metadata | `opensky_aircraft_metadata` | 519,969 | authoritative |

`aircraftDataHub` resolves engine identity Supabase-first (`faa_engine` before
Base44 `EngineSpec`). `EngineSpec` remains only as a fallback for aircraft the
FAA table does not cover — it is a copy produced by the `enginespec_sync` mode
of `syncFaaFromSupabase`, so when the two disagree, the copy is the stale one.

**Known gap:** `faa_engine` has no TBO column (`code, mfr, model, type,
horsepower, thrust`). `engine_tbo_hours` therefore still comes from `EngineSpec`
or the ATI card. Adding TBO to Supabase would close the last engine exception.

## Where it does NOT hold yet

These live in Base44. Their Supabase counterparts exist but are **empty**, so
pointing the app at them today would show nothing:

| Data | Base44 | Supabase counterpart | Rows there |
|---|---|---|---|
| Listings | `AircraftListing` (23) | `aircraftbuyorsell_listings` | 0 |
| ATI cards | `ATICard` (72) | `ati_cards` | 0 |
| Users / auth | `User` (10+) | `users` / `profiles` | 1 / 0 |
| Tenants, licences | `Tenant`, `License` | — | no table |
| Stripe events | `WebhookEvent` | `stripe_webhook_events` | 0 |
| Dealer directory | `DealerLocation` (99) | `faa_dealers` is a different set | — |

`aircraftbuyorsell_sync_logs` is empty: the listings sync has never run.
`aircraftDataHub` reads `aircraftbuyorsell_listings` but never writes it, so
those lookups always return nothing.

Moving these is a migration, not a config change — auth is the hard part. Until
it happens, Base44 remains the system of record for business data, and the risk
to avoid is writing business data to Supabase *partially*: that is what would
create two diverging databases. Today there is only one.

## Rules for new work

1. New reference or analytical data goes to Supabase, never to a Base44 entity.
2. Never add a second home for a fact that already has one.
3. When a Supabase count is unavailable, render it as missing — never substitute
   a literal. `Analytics.jsx` used to fall back to hardcoded numbers that matched
   the live row counts, which made a broken query indistinguishable from a
   working one.
