-- KiliPlanner — Supabase schema (matches SRS v5.0, §6.2–6.3)
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to run once on a fresh project; re-running will error on "already
-- exists" — that's expected, not a bug.

-- ── Table ──────────────────────────────────────────────────────────────
create table if not exists report_categories (
  slug text primary key,
  name text not null unique,
  requires_live_photo boolean not null default false,
  requires_geofence boolean not null default true,
  requires_admin_review boolean not null default true,
  minimum_corrobation integer not null default 0 check (minimum_corrobation >= 0),
  allowed_radius_meters numeric not null default 50 check (allowed_radius_meters > 0),
  impact_class text not null default 'NORMAL' check (impact_class in ('NORMAL','HIGH_IMPACT')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into report_categories (
  slug, name, requires_live_photo, requires_geofence,
  requires_admin_review, minimum_corrobation,
  allowed_radius_meters, impact_class
)
values
  ('security', 'Security', true, true, true, 1, 50, 'NORMAL'),
  ('water', 'Water', false, true, true, 0, 50, 'NORMAL'),
  ('sewage', 'Sewage', true, true, true, 1, 50, 'NORMAL'),
  ('waste', 'Waste', true, true, true, 1, 50, 'NORMAL'),
  ('pollution', 'Pollution', false, true, true, 0, 50, 'NORMAL'),
  ('road_damage', 'Road', false, true, true, 0, 50, 'NORMAL'),
  ('construction', 'Construction', true, true, true, 1, 50, 'HIGH_IMPACT'),
  ('land_planning', 'Land/Planning', true, true, true, 1, 50, 'HIGH_IMPACT'),
  ('drainage', 'Drainage', true, true, true, 1, 50, 'NORMAL'),
  ('encroachment', 'Encroachment', true, true, true, 1, 50, 'NORMAL'),
  ('other', 'Other', false, true, true, 0, 50, 'NORMAL')
on conflict (slug) do update set
  name = excluded.name,
  requires_live_photo = excluded.requires_live_photo,
  requires_geofence = excluded.requires_geofence,
  requires_admin_review = excluded.requires_admin_review,
  minimum_corrobation = excluded.minimum_corrobation,
  allowed_radius_meters = excluded.allowed_radius_meters,
  impact_class = excluded.impact_class,
  enabled = true;

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),

  category text not null references report_categories(slug),

  category text not null check (
    category in ('security','water','sewage','waste','pollution','road_damage','encroachment','green_project','other')
  ),

  description text not null check (char_length(description) <= 280),
  status text not null default 'UNVERIFIED' check (status in ('UNVERIFIED','UNDER_REVIEW','CORROBORATED','REJECTED','VERIFIED','RESOLVED')),
  lat double precision not null,
  lng double precision not null,
  address text,
  accuracy_meters numeric,
  sub_detail text,
  reporter_name text,
  reporter_email text,
  photo_base64 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_verified_resident boolean not null default false
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

create table if not exists report_state_transitions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references issues(id) on delete cascade,
  from_state text,
  to_state text not null check (to_state in ('UNVERIFIED','UNDER_REVIEW','CORROBORATED','REJECTED','VERIFIED','RESOLVED')),
  actor_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_state_transitions_report
  on report_state_transitions (report_id, created_at desc);

alter table report_state_transitions enable row level security;

create or replace function public.transition_report_state(
  target_report_id uuid,
  next_state text,
  transition_reason text default null
)
returns public.issues
language plpgsql
security definer
set search_path = public
as $$
declare
  current_report public.issues;
  previous_state text;
  allowed boolean := false;
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') not in ('admin', 'official', 'contractor') then
    raise exception 'Insufficient role for report state transition';
  end if;

  select * into current_report from public.issues where id = target_report_id for update;
  if current_report.id is null then raise exception 'Report not found'; end if;
  previous_state := current_report.status;

  allowed :=
    (current_report.status = 'UNVERIFIED' and next_state in ('UNDER_REVIEW', 'REJECTED'))
    or (current_report.status = 'UNDER_REVIEW' and next_state in ('CORROBORATED', 'REJECTED'))
    or (current_report.status = 'CORROBORATED' and next_state in ('VERIFIED', 'REJECTED'))
    or (current_report.status = 'VERIFIED' and next_state = 'RESOLVED');
  if not allowed then raise exception 'Invalid report state transition'; end if;

  update public.issues
  set status = next_state, updated_at = now()
  where id = target_report_id
  returning * into current_report;

  insert into public.report_state_transitions (report_id, from_state, to_state, actor_id, reason)
  values (target_report_id, previous_state, next_state, auth.uid(), transition_reason);
  return current_report;
end;
$$;
insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', false)
on conflict (id) do nothing;

-- ── Trust and safety identity tables ──────────────────────────────────
-- These tables contain pseudonymous device-risk data only. SMS identity
-- verification is intentionally disabled for now.
create table if not exists resident_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  risk_level text not null default 'unknown' check (
    risk_level in ('unknown','low','medium','high','critical')
  ),
  suspended_until timestamptz
);

create index if not exists idx_resident_identities_risk
  on resident_identities (risk_level);

alter table resident_identities drop column if exists phone_hash;
alter table resident_identities drop column if exists verification_status;
alter table resident_identities drop column if exists last_verified_at;
alter table report_categories drop column if exists requires_verified_resident;

create table if not exists resident_devices (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references resident_identities(id) on delete cascade,
  device_identifier text not null,
  device_type text not null default 'unknown' check (
    device_type in ('web','ios','android','unknown')
  ),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  risk_score numeric(5,2) not null default 0 check (risk_score >= 0 and risk_score <= 100),
  status text not null default 'active' check (
    status in ('active','blocked','retired')
  ),
  unique (resident_id, device_identifier)
);

create index if not exists idx_resident_devices_resident
  on resident_devices (resident_id);
create index if not exists idx_resident_devices_status
  on resident_devices (status);

create table if not exists report_audit_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete set null,
  resident_id uuid references resident_identities(id) on delete set null,
  event_type text not null,
  risk_score numeric(5,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists report_submission_attempts (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references resident_identities(id) on delete cascade,
  device_id uuid references resident_devices(id) on delete set null,
  created_at timestamptz not null default now(),
  outcome text not null check (outcome in ('accepted','rejected')),
  reason text
);

create index if not exists idx_report_attempts_resident_time
  on report_submission_attempts (resident_id, created_at desc);

create table if not exists trust_action_events (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references resident_identities(id) on delete set null,
  action_type text not null check (action_type in ('HIGH_IMPACT_REPORT','NORMAL_REPORT','ENDORSEMENT','COMMENT')),
  device_risk_signal text,
  network_risk_signal text,
  velocity_score numeric(5,2) not null default 0 check (velocity_score >= 0 and velocity_score <= 100),
  location_score numeric(5,2) not null default 0 check (location_score >= 0 and location_score <= 100),
  content_score numeric(5,2) not null default 0 check (content_score >= 0 and content_score <= 100),
  evidence_score numeric(5,2) not null default 0 check (evidence_score >= 0 and evidence_score <= 100),
  coordination_score numeric(5,2) not null default 0 check (coordination_score >= 0 and coordination_score <= 100),
  behavior_risk_score numeric(5,2) not null default 0 check (behavior_risk_score >= 0 and behavior_risk_score <= 100),
  risk_action text not null default 'NORMAL' check (risk_action in ('NORMAL','MONITOR','CAPTCHA_MANUAL_REVIEW','TEMPORARY_SUSPENSION_RECOMMENDED')),
  captcha_required boolean not null default false,
  captcha_verified boolean not null default false,
  outcome text not null check (outcome in ('accepted','rejected','flagged')),
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_trust_action_resident_time
  on trust_action_events (resident_id, action_type, created_at desc);

create table if not exists trust_risk_flags (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references resident_identities(id) on delete set null,
  action_type text not null,
  flag_type text not null check (flag_type in ('COORDINATION_RISK','CAPTCHA_REQUIRED','RATE_LIMITED','TEMPORARY_SUSPENSION_RECOMMENDED')),
  risk_score numeric(5,2) not null check (risk_score >= 0 and risk_score <= 100),
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_trust_risk_flags_open
  on trust_risk_flags (resident_id, resolved_at, created_at desc);

create table if not exists anomaly_events (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid references resident_identities(id) on delete set null,
  action_type text not null,
  anomaly_type text not null check (anomaly_type in ('VELOCITY_SPIKE','NEW_ACCOUNT_VELOCITY','IMPOSSIBLE_TRAVEL','REPEATED_REPORT_LOCATION','GPS_ACCURACY_SHIFT','REPORT_LOCATION_FAR','CONTENT_DUPLICATE','REPEATED_KEYWORDS','CROSS_CATEGORY_COPY','EXCESSIVE_LINKS','SUSPICIOUS_TEXT','DUPLICATE_EVIDENCE','CROSS_RESIDENT_EVIDENCE','EVIDENCE_TIMESTAMP_MISMATCH','EVIDENCE_LOCATION_FAR','SHARED_DEVICE_SIGNAL','SHARED_NETWORK_SIGNAL','ENDORSEMENT_BURST','LOCATION_TARGETING_CLUSTER','IDENTICAL_CROSS_ACCOUNT_WORDING')),
  risk_score numeric(5,2) not null check (risk_score >= 0 and risk_score <= 100),
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_anomaly_events_type_time
  on anomaly_events (anomaly_type, created_at desc);

alter table anomaly_events enable row level security;

alter table trust_action_events enable row level security;
alter table trust_risk_flags enable row level security;

create table if not exists issue_upvotes (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  resident_id uuid references resident_identities(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (issue_id, resident_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  resident_id uuid references resident_identities(id) on delete set null,
  author_name text,
  content text not null check (char_length(content) between 1 and 1000),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  is_official boolean not null default false
);

create index if not exists idx_comments_issue_time on comments (issue_id, created_at);
alter table issue_upvotes enable row level security;
alter table comments enable row level security;

alter table report_audit_events enable row level security;
alter table report_submission_attempts enable row level security;

create table if not exists report_evidence (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  storage_path text not null unique,
  captured_at timestamptz not null,
  capture_latitude double precision,
  capture_longitude double precision,
  location_accuracy numeric,
  mime_type text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  file_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_evidence_hash on report_evidence (file_hash);

create table if not exists location_verifications (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references issues(id) on delete cascade,
  resident_id uuid references resident_identities(id) on delete set null,
  user_lat double precision not null,
  user_lng double precision not null,
  report_lat double precision not null,
  report_lng double precision not null,
  distance numeric not null check (distance >= 0),
  gps_accuracy numeric,
  allowed_radius numeric not null,
  location_verification text not null check (location_verification in ('verified','uncertain','failed')),
  suspicious_signals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_location_verifications_report on location_verifications (report_id);
create index if not exists idx_location_verifications_result on location_verifications (location_verification);
create index if not exists idx_location_verifications_resident_time on location_verifications (resident_id, created_at desc);

alter table location_verifications enable row level security;

alter table report_evidence enable row level security;
alter table report_categories enable row level security;

drop policy if exists "public read enabled report categories" on report_categories;
create policy "public read enabled report categories"
  on report_categories for select using (enabled = true);

-- Authenticated clients must not be able to read or mutate these tables
-- directly. The verification Edge Function uses the service role, which
-- bypasses RLS, to create and update records after OTP verification.
alter table resident_identities enable row level security;
alter table resident_devices enable row level security;

-- Only the database decides whether a report carries the public verified
-- badge. The client cannot promote itself by inserting true.
create or replace function public.set_issue_verification_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_verified_resident := false;
  return new;
end;
$$;

drop trigger if exists set_issue_verification_status on public.issues;
create trigger set_issue_verification_status
before insert on public.issues
for each row execute function public.set_issue_verification_status();

-- ── Row Level Security ────────────────────────────────────────────────
-- The anon key is exposed in the frontend bundle by design — RLS is what
-- makes that safe. Public read + insert only; no update/delete from the
-- client in the MVP.
alter table issues enable row level security;

drop policy if exists "public read" on issues;
create policy "public read" on issues
  for select using (true);

drop policy if exists "public insert" on issues;
-- Report inserts are performed only by the trusted submit-report function.

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
