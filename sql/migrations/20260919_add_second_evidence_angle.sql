-- Add the second live camera angle used to confirm report evidence.
-- Safe to run on databases that already have this column.
alter table public.issues
  add column if not exists photo_base64_second text;

-- Ask PostgREST to reload its table schema immediately.
notify pgrst, 'reload schema';
