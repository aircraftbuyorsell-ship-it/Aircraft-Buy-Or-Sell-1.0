-- PlaneFox marketplace listing ingestion → ABOS ATI Passport.
--
-- PlaneFox is an external customer/data provider: its listings are ingested
-- and normalized here as-is (raw_payload) plus a normalized identity
-- projection. This table is never a source for ATI/OMVM computation and
-- never overwrites the Digital Twin system-of-record (public.aircraft_passports).
--
-- Apply through the controlled Supabase migration/setup path.

create table if not exists public.abos_planefox_listings (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'planefox',
  source_type text not null default 'external_marketplace',
  source_record_id text not null,
  source_url text,
  tailnumber text,
  specific_icao_hex text,
  manufacturer text,
  model text,
  serial_number text,
  year integer,
  identity_status text not null default 'UNVERIFIED'
    check (identity_status in ('VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'IDENTITY_CONFLICT')),
  passport_id text,
  raw_payload jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  retrieved_at timestamptz not null default now(),
  source_last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, source_record_id)
);

create index if not exists idx_abos_planefox_listings_tailnumber
  on public.abos_planefox_listings(tailnumber);

create index if not exists idx_abos_planefox_listings_icao_hex
  on public.abos_planefox_listings(specific_icao_hex);

create index if not exists idx_abos_planefox_listings_passport_id
  on public.abos_planefox_listings(passport_id);

alter table public.abos_planefox_listings enable row level security;

-- Service-role ingestion/read only, matching the NTSB/FAA SDR evidence tables.
-- No public write policy.
