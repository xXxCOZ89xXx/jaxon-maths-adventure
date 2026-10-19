-- Run AFTER supabase/v2-parent-security.sql has completed successfully.
-- Replace the two UUID placeholders with the existing Auth user IDs.
-- Parent = original family email account; child = newly created learner account.
-- Never use passwords, PINs, or email addresses in this script.
begin;
insert into public.maths_families (parent_user_id,child_user_id)
values (
  'REPLACE-WITH-PARENT-USER-UUID'::uuid,
  'REPLACE-WITH-JAXON-USER-UUID'::uuid
);
commit;

-- Read-only verification (run separately if desired):
-- select id, parent_user_id, child_user_id, created_at from public.maths_families;
