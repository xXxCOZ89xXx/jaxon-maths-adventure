-- TEST PROJECT ONLY: vyxvemtevkxlwqzelghj. No passwords, account creation or progress writes.
-- Run the whole file once after the four reserved fictional accounts are created.
BEGIN;
SET LOCAL search_path='';
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
SELECT pg_advisory_xact_lock(hashtextextended('esa-synthetic-family-links',0));
DO $link$
DECLARE identity jsonb; valid_users integer;
BEGIN
 IF current_user<>'postgres' THEN RAISE EXCEPTION 'Test setup requires the postgres SQL-editor role'; END IF;
 identity:=public.v3_identity();
 IF identity->>'projectRef' IS DISTINCT FROM 'vyxvemtevkxlwqzelghj'
 OR identity->>'environmentKind' IS DISTINCT FROM 'synthetic-test'
 OR identity->>'syntheticOnly' IS DISTINCT FROM 'true'
 OR identity->>'syntheticContractVersion' IS DISTINCT FROM '1'
 THEN RAISE EXCEPTION 'Exact installed synthetic test project required'; END IF;
 LOCK TABLE auth.users,auth.identities IN SHARE MODE;
 LOCK TABLE public.maths_families IN SHARE ROW EXCLUSIVE MODE;
 -- This initial fixture setup is only for the four exact admin-managed test identities.
 IF (SELECT count(*) FROM auth.users)<>4 THEN RAISE EXCEPTION 'Exactly four reserved test accounts required; no accounts will be changed'; END IF;
 SELECT count(*) INTO valid_users FROM
 (VALUES('parent-a@esa-test.invalid'),('learner-a@esa-test.invalid'),
        ('parent-b@esa-test.invalid'),('learner-b@esa-test.invalid')) expected(email)
 WHERE (SELECT count(*) FROM auth.users u WHERE lower(u.email)=expected.email)=1
 AND EXISTS(SELECT 1 FROM auth.users u WHERE lower(u.email)=expected.email AND u.email_confirmed_at IS NOT NULL);
 IF valid_users<>4 THEN RAISE EXCEPTION 'Four unique admin-confirmed reserved test accounts required'; END IF;
 IF EXISTS(SELECT 1 FROM public.maths_families f WHERE NOT EXISTS(
 SELECT 1 FROM (VALUES('learner-a@esa-test.invalid','parent-a@esa-test.invalid'),
 ('learner-b@esa-test.invalid','parent-b@esa-test.invalid')) pair(child_email,parent_email)
 JOIN auth.users c ON lower(c.email)=pair.child_email
 JOIN auth.users p ON lower(p.email)=pair.parent_email
 WHERE f.child_user_id=c.id AND f.parent_user_id=p.id))
 THEN RAISE EXCEPTION 'Existing family links differ; stop and inspect, never overwrite'; END IF;
 INSERT INTO public.maths_families(child_user_id,parent_user_id)
 SELECT c.id,p.id FROM (VALUES('learner-a@esa-test.invalid','parent-a@esa-test.invalid'),
 ('learner-b@esa-test.invalid','parent-b@esa-test.invalid')) pair(child_email,parent_email)
 JOIN auth.users c ON lower(c.email)=pair.child_email
 JOIN auth.users p ON lower(p.email)=pair.parent_email
 ON CONFLICT(child_user_id) DO NOTHING;
 IF (SELECT count(*) FROM public.maths_families)<>2 THEN RAISE EXCEPTION 'Expected exactly two test-family links'; END IF;
END $link$;
COMMIT;
-- Aggregate result only; never return account IDs, emails, credentials or saved records.
SELECT jsonb_build_object('projectRef',public.v3_identity()->>'projectRef',
 'syntheticOnly',true,'familiesLinked',(SELECT count(*) FROM public.maths_families),
 'testAccounts',(SELECT count(*) FROM auth.users)) AS test_family_setup;
