-- Allow authenticated planner accounts to call the protected status RPC.
-- The function itself validates app_metadata.role and runs as its owner,
-- so no public UPDATE policy is needed on public.issues.
revoke execute on function public.transition_report_state(uuid, text, text)
  from public, anon;
grant execute on function public.transition_report_state(uuid, text, text)
  to authenticated;

-- Older installations used the legacy public status value "open". Map it to
-- the first state understood by the planner state machine.
update public.issues
set status = 'UNVERIFIED'
where status = 'open';

notify pgrst, 'reload schema';