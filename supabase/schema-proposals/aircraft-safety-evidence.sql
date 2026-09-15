-- Aircraft safety evidence store for Verification Engine.
-- Official sources: NTSB aviation investigations and FAA Service Difficulty Reports.
-- Apply through the controlled Supabase migration/setup path.

create table if not exists public.abos_ntsb_aviation_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text,
  registration text not null,
  event_date date,
  event_type text,
  damage text,
  make text,
  model text,
  city text,
  state text,
  country text,
  synopsis text,
  source_url text,
  source_updated_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(case_number, registration)
);

create index if not exists idx_abos_ntsb_registration
  on public.abos_ntsb_aviation_cases(registration);

create table if not exists public.abos_faa_sdr (
  id uuid primary key default gen_random_uuid(),
  control_number text,
  registration text not null,
  difficulty_date date,
  submitter_type text,
  make text,
  model text,
  component text,
  description text,
  source_year integer,
  source_url text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(control_number, registration)
);

create index if not exists idx_abos_faa_sdr_registration
  on public.abos_faa_sdr(registration);

alter table public.abos_ntsb_aviation_cases enable row level security;
alter table public.abos_faa_sdr enable row level security;

-- Service-role ingestion/read is used by ABOS functions. No public write policy.
