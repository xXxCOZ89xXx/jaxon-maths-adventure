-- Read-only aggregate inventory. No records, secrets or physical-project attestation.
-- Select the owner's NEW test project vyxvemtevkxlwqzelghj in the dashboard first.
BEGIN READ ONLY;
SELECT jsonb_build_object(
 'intendedProjectRef','vyxvemtevkxlwqzelghj',
 'physicalProjectMustBeCheckedInDashboard',true,
 'authUserCount',(SELECT count(*) FROM auth.users),
 'authIdentityCount',(SELECT count(*) FROM auth.identities),
 'nonExtensionPublicRelationCount',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_class'::regclass
 AND d.objid=c.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e')),
 'nonExtensionPublicFunctionCount',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass
 AND d.objid=p.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e')),
 'existingSyntheticMarker',to_regnamespace('esa_test_private') IS NOT NULL,
 'pgcryptoSchema',(SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pgcrypto')
) AS precheck;
COMMIT;
-- The installer separately checks types, Storage, prerequisites and privileges.
-- Zero counts alone do not authorise installation or identify the hosted project.
