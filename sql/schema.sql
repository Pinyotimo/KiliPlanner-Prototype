-- KiliPlanner — Supabase schema (matches SRS v5.0, §6.2–6.3)
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to run once on a fresh project; re-running will error on "already
-- exists" — that's expected, not a bug.

-- ── Table ──────────────────────────────────────────────────────────────
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in ('water','sewage','waste','pollution','road_damage','encroachment','other')
  ),
  description text not null check (char_length(description) <= 280),
  status text not null default 'open' check (status in ('open','resolved')),
  lat double precision not null,
  lng double precision not null,
  address text,
  accuracy_meters numeric,
  sub_detail text,
  reporter_name text,
  reporter_email text,
  photo_base64 text,
  created_at timestamptz not null default now()
);

create index if not exists idx_issues_category on issues (category);
create index if not exists idx_issues_status on issues (status);
create index if not exists idx_issues_created_at on issues (created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────
-- The anon key is exposed in the frontend bundle by design — RLS is what
-- makes that safe. Public read + insert only; no update/delete from the
-- client in the MVP.
alter table issues enable row level security;

drop policy if exists "public read" on issues;
create policy "public read" on issues
  for select using (true);

drop policy if exists "public insert" on issues;
create policy "public insert" on issues
  for insert with check (true);

-- ── Realtime ───────────────────────────────────────────────────────────
-- Also enable this in the dashboard: Database → Replication → toggle the
-- `issues` table on. The line below does the same thing via SQL, but the
-- toggle is the easiest way to confirm it's on.
alter publication supabase_realtime add table issues;

-- ── Optional: sample rows so the map isn't empty during a dry run ───────
-- Uncomment and adjust coordinates to fall inside your traced boundary
-- before running.
--
-- insert into issues (category, description, lat, lng, address) values
--   ('water', 'Burst pipe near Yaya Centre junction', -1.2935, 36.7845, 'Ngong Road, Kilimani'),
--   ('waste', 'Illegal dumping behind shops', -1.2960, 36.7870, 'Argwings Kodhek Rd'),
--   ('road_damage', 'Road caved in near construction site', -1.2915, 36.7830, 'Kilimani Rd');
