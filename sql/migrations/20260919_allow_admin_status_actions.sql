-- Let admin planners intentionally set any supported workflow status.
-- Official and contractor accounts remain restricted to sequential transitions.
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
  actor_role text;
  allowed boolean := false;
begin
  actor_role := coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '');
  if actor_role not in ('admin', 'official', 'contractor') then
    raise exception 'Insufficient role for report state transition';
  end if;

  if next_state not in ('UNVERIFIED', 'UNDER_REVIEW', 'CORROBORATED', 'VERIFIED', 'RESOLVED', 'REJECTED') then
    raise exception 'Unsupported report state';
  end if;

  select * into current_report
  from public.issues
  where id = target_report_id
  for update;
  if current_report.id is null then raise exception 'Report not found'; end if;
  previous_state := current_report.status;

  allowed := actor_role = 'admin';
  if not allowed then
    allowed :=
      (current_report.status = 'UNVERIFIED' and next_state in ('UNDER_REVIEW', 'REJECTED'))
      or (current_report.status = 'UNDER_REVIEW' and next_state in ('CORROBORATED', 'REJECTED'))
      or (current_report.status = 'CORROBORATED' and next_state in ('VERIFIED', 'REJECTED'))
      or (current_report.status = 'VERIFIED' and next_state = 'RESOLVED');
  end if;
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

revoke execute on function public.transition_report_state(uuid, text, text) from public, anon;
grant execute on function public.transition_report_state(uuid, text, text) to authenticated;
notify pgrst, 'reload schema';