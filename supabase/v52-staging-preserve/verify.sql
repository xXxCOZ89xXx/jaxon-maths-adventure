-- Owner-only aggregate post-upgrade check. Read only; never calls application RPCs.
begin read only;
set local search_path='';
select v52_staging_private.assert_target();
select (select state from v52_staging_private.control) as state,
 (select staging_upgrade_version from public.v3_environment) as staging_version,
 v52_staging_private.data_digest()=(select before_digest from v52_staging_private.control) as original_data_unchanged_before_testing,
 (select count(*)=4 from auth.users) as four_accounts,
 (select count(*)=2 from public.maths_families) as two_families,
 (select count(*)=4 from public.v3_pins) as four_preserved_pin_rows,
 not exists(select 1 from public.v3_wallet where opening_seconds<>0 or legacy_redeemed<>0) as zero_compatibility_fields,
 not has_function_privilege('service_role','public.v3_admin_import(uuid,jsonb)','EXECUTE') as importer_denied;
rollback;
