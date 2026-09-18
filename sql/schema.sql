-- KiliPlanner — Supabase schema (matches SRS v5.0, §6.2–6.3)
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to run once on a fresh project; re-running will error on "already
-- exists" — that's expected, not a bug.

-- ── Table ──────────────────────────────────────────────────────────────
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in ('security','water','sewage','waste','pollution','road_damage','encroachment','green_project','other')
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

-- Keep existing installations compatible with security priority reports.
alter table issues add column if not exists is_security_alert boolean not null default false;
alter table issues add column if not exists unsafe_time text;
alter table issues add column if not exists device_id uuid;
alter table issues add column if not exists upvotes integer not null default 1;
alter table issues add column if not exists updated_at timestamptz;

do $$
begin
  alter table issues drop constraint if exists issues_category_check;
  alter table issues add constraint issues_category_check check (
    category in ('security','water','sewage','waste','pollution','road_damage','encroachment','green_project','other')
  );
exception when duplicate_object then
  null;
end $$;

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

-- ── Geo-fenced resident alerts ───────────────────────────────────────
-- Browsers periodically publish their last permitted location. A security
-- alert creates one queued notification for each recently active device
-- within 500 metres of the report pin.
create table if not exists device_pings (
  device_id uuid primary key,
  lat double precision not null,
  lng double precision not null,
  notifications_enabled boolean not null default false,
  last_seen_at timestamptz not null default now()
);

create table if not exists geo_alert_notifications (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references device_pings(device_id) on delete cascade,
  issue_id uuid not null references issues(id) on delete cascade,
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (device_id, issue_id)
);

alter table device_pings enable row level security;
alter table geo_alert_notifications enable row level security;

drop policy if exists "public device ping upsert" on device_pings;
create policy "public device ping upsert" on device_pings
  for insert with check (true);
drop policy if exists "public device ping update" on device_pings;
create policy "public device ping update" on device_pings
  for update using (true) with check (true);
drop policy if exists "public device notification read" on geo_alert_notifications;
create policy "public device notification read" on geo_alert_notifications
  for select using (true);
drop policy if exists "public device notification acknowledge" on geo_alert_notifications;
create policy "public device notification acknowledge" on geo_alert_notifications
  for update using (true) with check (true);

create or replace function enqueue_nearby_security_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_security_alert is true or new.category = 'security' then
    insert into geo_alert_notifications (device_id, issue_id)
    select p.device_id, new.id
    from device_pings p
    where p.notifications_enabled
      and p.last_seen_at > now() - interval '15 minutes'
      and 6371000 * 2 * asin(sqrt(
        power(sin(radians(p.lat - new.lat) / 2), 2) +
        cos(radians(new.lat)) * cos(radians(p.lat)) *
        power(sin(radians(p.lng - new.lng) / 2), 2)
      )) <= 500
    on conflict (device_id, issue_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists security_alert_geo_fanout on issues;
create trigger security_alert_geo_fanout
after insert on issues
for each row execute function enqueue_nearby_security_alert();

alter publication supabase_realtime add table geo_alert_notifications;

-- Green Pin proposals are community planning ideas. Officials may review them,
-- but their issue status must remain immutable.
create or replace function prevent_green_project_status_change()
returns trigger
language plpgsql
as $$
begin
  if old.category = 'green_project' and new.status is distinct from old.status then
    raise exception 'Green Pin project statuses cannot be changed by officials';
  end if;
  return new;
end;
$$;

drop trigger if exists green_project_status_immutable on issues;
create trigger green_project_status_immutable
before update on issues
for each row execute function prevent_green_project_status_change();

-- ── Optional: sample rows so the map isn't empty during a dry run ───────
-- Uncomment and adjust coordinates to fall inside your traced boundary
-- before running.
--
-- insert into issues (category, description, lat, lng, address) values
--   ('water', 'Burst pipe near Yaya Centre junction', -1.2935, 36.7845, 'Ngong Road, Kilimani'),
--   ('waste', 'Illegal dumping behind shops', -1.2960, 36.7870, 'Argwings Kodhek Rd'),
--   ('road_damage', 'Road caved in near construction site', -1.2915, 36.7830, 'Kilimani Rd');
