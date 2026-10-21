# V5.2 staging reuse — final diagnostic reviewed

Status: 21 October 2026. Staging `sfogrvedypgtxfvecmbx` only. **No Supabase SQL executed or changes applied by Codex.** Preserve all four existing fictional accounts, both families, PINs, progress, wallets, purchases and request history.

The owner reports the original compatibility inventory passed the expected preservation prerequisites (8 PASS / 5 REVIEW / 1 expected FAIL). The subsequent routine diagnostic now resolves source review: **five PASS / one FAIL; all six bodies EXACT; all search paths and execution attributes match**. Only the importer has unexpected service_role EXECUTE. PUBLIC, anon and authenticated cannot execute it. Do not repeat inventories, export definitions or rerun the six-routine diagnostic.

## Recommendation and minimum next action

Review [V52-STAGING-IMPORTER-PERMISSION.md](V52-STAGING-IMPORTER-PERMISSION.md) and [V52-STAGING-IMPORTER-REVOKE.sql](V52-STAGING-IMPORTER-REVOKE.sql), then explicitly approve **only the single-function staging EXECUTE revoke**. Do not execute it before that separate approval.

The importer is documented as an owner-run fixture tool, is not used by the staging app and is unnecessary for preserving existing learners. The proposal removes only service_role EXECUTE, retains owner access and verifies before/after permissions within a guarded transaction. It changes no functions, other grants, default privileges, accounts or records.

Its incremental security risk is limited: it is SECURITY INVOKER, ordinary browser roles are denied, and it cannot overwrite existing progress/wallet rows. A privileged service caller could initialise an absent linked learner's state, so the unused route should be closed. The finding does not establish a public exploit or compromise, and revocation cannot remove the service role's separate table privileges.

## Shortest remaining V5.2 path

After separate correction approval/application/verification, prepare and rehearse the in-place preservation patch and staging build against the now-confirmed exact routine baseline; offline preparation can proceed independently. Review the concrete package with current private staging recovery coverage, explicitly approve installation, verify unchanged state, and separately approve a private artifact update and hosted smoke using the **same four accounts and known PINs**.

The [upgrade plan](V52-STAGING-UPGRADE-PLAN.md) retains all existing data and immutable retries, adds only needed compatibility metadata/fields and reviewed RPC hardening, and preserves browser queues. Neither production installer nor fresh-start/preserve-reviewed production activation is suitable for existing staging. Approval of the revoke includes none of those operations.

Auth/API service configuration and actual hosted Auth/AMR remain pending. No PIN reset, new account, learning-data clearing, broad audit/test rerun or backup upload is needed for the next action. Cloud Supabase probing remains stopped. SQL preparation received static review only; no migration, activation, merge or deployment occurred.
