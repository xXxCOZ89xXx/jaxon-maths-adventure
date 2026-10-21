# V5.2 staging reuse — preservation implementation prepared

22 October 2026. The owner completed the approved importer correction: **service_role=false, anon=false, authenticated=false, postgres=true**. This item is closed; do not rerun diagnostics or revoke scripts.

The four existing fictional Auth accounts, both families and their PINs/progress/wallet/history are the preservation baseline. Earlier compatibility/source checks are accepted, including the independently explained LF/CRLF body representation. No further broad audit is requested.

A staging-specific in-place SQL package and matching unpublished private build are now prepared. Read [the upgraded plan](V52-STAGING-UPGRADE-PLAN.md), [owner runbook](V52-STAGING-PRESERVE-RELEASE.md), [source review](V52-STAGING-PRESERVE-REVIEW.md) and [actual readiness evidence](V52-STAGING-PRESERVE-READINESS.md).

The SQL pauses/drains existing RPCs, performs an atomic additive patch with unchanged-original-data assertions, then separately restores only captured access. It never creates accounts/families, resets PINs/progress or runs production activation/import. The build keeps existing storage/queue namespaces and immutable retries; rejected intents stay preserved for reconciliation. Rollback retains all current data and stays closed until a reviewed decision.

**Next owner approval:** the exact hashed staging pause/install/verify/resume package, after reviewing current private staging recovery coverage. No hosted SQL or site publication has occurred. Private-site publication and hosted operations are separate approvals. Cloud Supabase probes remain stopped; previous broad suites and inventories were not repeated.
