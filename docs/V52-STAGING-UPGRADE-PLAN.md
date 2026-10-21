# V5.2 staging preservation upgrade — design only

Status: 21 October 2026. Branch `codex/v3-adventure-build`; latest reviewed head `683b149dadf42cdd53f548586a3e4475c450fbbc`. **No upgrade SQL is supplied or executed. A separate single-permission correction is proposed only; no SQL execution, hosted testing, activation or publication is authorised by this design.** Existing staging is `sfogrvedypgtxfvecmbx`; production is outside scope.

## Accepted owner results

The owner ran the compatibility file in the correct staging project and reports **8 PASS / 5 REVIEW / 1 expected FAIL**. Four email-confirmed Auth accounts, two independent families and four linked PIN rows pass. The staging table contract, family structure, all 40 catalogue item/price pairs and absence of V5.2 activation overlap pass. These are owner-run results, not a new Codex connection or a rerun of completed inventories.

The initial combined migration footprint reported zero missing routines and six differences; the subsequent owner-run targeted diagnostic supersedes that source-review finding: all six bodies are EXACT and execution attributes/search paths match. SQL migration history is unavailable; Auth history has 82 entries. Manual SQL Editor installs may have no Supabase CLI migration ledger. Neither absence of that ledger nor an Auth migration count establishes a broken installation or the installed application version. Do not manufacture migration-history rows. Auth/API service settings remain REVIEW. The production new-install package remains an expected FAIL on existing staging.

## Resolved routine diagnostic; one permission correction proposed

The latest owner-run diagnostic gives **five PASS / one FAIL**. All six bodies are EXACT matches, with expected search paths and execution attributes. The sole failure is `service_role` EXECUTE on `public.v3_admin_import(uuid,jsonb)`; PUBLIC, anon and authenticated are denied. No further source export, formatting investigation or six-routine rerun is needed. Treat the previous combined fingerprint count as superseded, not as evidence of six security regressions.

The source and setup guide describe an owner-run, one-time fictional fixture importer; the current staging app has no importer call. Its REVOKE excludes PUBLIC/anon/authenticated but omits service_role, permitting retained/default access. The grant's exact origin was not investigated and is not needed to remove this unused route. Recommend revoking service_role EXECUTE, while retaining owner access.

This is a SECURITY INVOKER routine, so it does not elevate callers to the function owner. Ordinary browser roles cannot call it. It can seed arbitrary reviewed-fixture progress/balances/ownership for a linked learner only while both progress and wallet rows are absent, and cannot overwrite existing rows. The incremental risk is limited within the already privileged service boundary, but access is unnecessary and contrary to the owner-only operating model. No compromise or public exploit is established; removing EXECUTE does not remove any separately granted service table access.

Read [V52-STAGING-IMPORTER-PERMISSION.md](V52-STAGING-IMPORTER-PERMISSION.md) and its [guarded SQL proposal](V52-STAGING-IMPORTER-REVOKE.sql). It contains exactly one persistent operation: `REVOKE EXECUTE ON FUNCTION public.v3_admin_import(uuid,jsonb) FROM service_role RESTRICT;`. It includes before/after effective-access checks, staging/definition/owner guards and atomic failure if inherited access or dependent grants prevent the narrow correction. No default privileges, role memberships, other functions or data are changed. **Separate execution approval is required; no correction has been applied.**

## Proposed in-place staging design

### Preserve the existing authority

Keep Auth users/identities/passwords, existing family rows and their child-UUID PK unchanged. Keep every original column in `v3_pins`, `v3_unlocks`, `v3_progress`, `v3_wallet`, `v3_catalog` and `v3_transactions` unchanged during installation. This includes PIN hashes/generations/attempt counters/cooldowns, unexpired unlocks, progress JSON/unknown fields/revisions/timestamps, coin and bonus balances, credited and redeemed time, purchases, activity clock and immutable request payloads/results.

Do not import, recreate, initialise missing learner rows automatically, reseed the catalogue, recalculate rewards from client JSON, move redeemed time between fields, renumber revisions or clear retry history. If the existing two linked learners lack required progress/wallet rows, stop and propose that specific initialisation separately. Preservation must be verified against a quiescent before/after baseline, not inferred from row counts.

### Minimal additive schema and RPC changes

Prepare a NEW staging-only migration against the accepted exact routine baseline; never adapt the production installer by replacing its project ref. The importer permission correction is a separate approval item and need not block offline package preparation.

1. Guard the exact staging marker and approved observed routine/schema version, and reject activation/private-production overlap. The owner separately verifies the physical project in the dashboard. Preserve existing family shape; no production legacy-table dependencies.
2. Add `opening_seconds` and `legacy_redeemed` to `v3_wallet` as nonnegative numeric fields defaulting to zero. Keep all old wallet columns unchanged. Zero opening seconds leaves `active_seconds/60 - redeemed` unchanged; no historical entitlement is copied or credited twice. Existing `redeemed` remains cumulative staging redemption, with a cumulative label in the staging UI.
3. Add only a staging upgrade-version field to `v3_environment`; retain its name/ref and no production readiness/PIN-transition/fresh-start flags. Set the reviewed version in the same atomic patch after preservation assertions. Extend `v3_identity` additively with that version; no `v3_admin_activate*` entry point or activation epoch is used.
4. Use `CREATE OR REPLACE` only for reviewed routine deltas, keeping signatures, parameter names, return shapes and explicit grants. Retain server-derived roles. Harden the password-AMR window, role-length PIN validation, PIN-generation/request locking, bounded safe revisions, finite numeric arguments and exact operation-argument checks from the V5.2 contract. Replacing code must not invoke PIN enrollment/reset or invalidate existing unlocks.
5. Make the request read branch side-effect free. Serialize mutations with the existing learner wallet lock and pin-generation check. Existing request IDs/payloads/results remain authoritative: after account/role/unlock verification, operation-specific role authorization and a valid request identity, check for a committed exact replay **before applying new payload restrictions**. Return its original result without side effects; changed payload/operation is denied. This preserves historical accepted requests even if an old payload would not be accepted as a new operation. New calls receive strict V5.2 validation. The empty read/lock argument conventions stay compatible.
6. Leave the privileged importer unused and retain owner-only access after the separately approved service_role correction. Verify its effective runtime EXECUTE denial after any routine replacement; do not rerun the old importer migration or silently broaden default privileges. Preserve RLS and deny direct client table access.

There must be no broad function/table grant changes, production legacy-write retirement, private archive creation or full-schema replacement. The eventual installer changes staging behaviour when committed, so approval must expressly cover those code/metadata changes; this design does not grant execution approval.

### Staging build and durable browser state

Reuse the current gameplay and connected UI, with a staging-specific build that verifies the real staging ref/name and expected upgrade version. Do not relax `Backend.productionConfig`, spoof a production marker or repoint the production bundle. Keep production and offline boundaries intact.

Retain the existing staging origin and auth/game/sync/intent storage keys and contents. Do not add a fresh-start namespace/epoch, sign everyone out, clear caches or rewrite queued request IDs. Preserve queued immutable requests, later drafts, conflicts and archives. A committed historical replay receives its original result, including its old response shape; the staging adapter must tolerate additive wallet fields. An uncommitted pending operation rejected by new validation remains intact with an explicit review/retry path, not a fabricated replacement or a silent drop. Require live upgrade-version verification before the new build sends upgraded operations; offline drafts remain preserved. Avoid two concurrent writer builds sharing one browser state.

## Minimum gates before approval

These are implementation/release gates, **not another owner inventory to perform now**.

1. **Close only the single importer permission finding.** Source/attribute drift is resolved by the owner's exact-match results. Review/approve the single-function revoke separately and use its built-in before/after checks; do not repeat the diagnostic or inventory. Reuse all accepted family/Auth/catalogue/schema results. Review only the relevant Auth dashboard settings (private signup policy, exact existing private-origin recovery redirects, intended public RPC exposure) before hosted work. SQL cannot certify these or real JWT/AMR.
2. **Protect current staging state privately.** Have a current recoverable staging application snapshot and exact previous definitions/grants/version plus the existing private artifact/build reference. Include PIN/unlock/progress/wallet/request history; do not upload them to Git/chat. The completed production backup is not a staging snapshot. No repeat production restoration or full security inventory is required.
3. **Check only the proposed delta preconditions.** In the protected execution/rehearsal path, verify both existing learners have required rows, revisions are safe integers, wallet/added-field values satisfy the new finite/nonnegative rules, and owned items/retry records fit the unchanged contract. Unexpected values stop installation without repair or rounding. Produce booleans/digests privately, not record dumps.
4. **Rehearse the exact candidate and rollback on fictional data only.** Focus on unchanged original columns/PIN state and relationships; a late-error atomic rollback; old exact replay including previously accepted extra fields; changed replay denial and stale CAS denial; new validation without unintended writes; generation locking; read with no row creation; retained browser queues; and rollback without losing post-upgrade state. Reuse previous gameplay/security evidence; no broad suite rerun.
5. **Approve a concrete staging-only package.** Review its diff, checksum, observed-state guards, preservation assertions, exact maintenance/grant scope and rollback. Explicit approval covers installation only. Hosting changes and normal hosted operations need their own scope; production SQL/activation, credentials/PIN changes, account provisioning, merge and deployment are not included.

## Atomic installation and rollback safeguards

During a separately approved execution, briefly block new application RPC execution through a narrow reviewed maintenance/grant plan and drain already-running requests before taking the final baseline. Merely closing a browser or locking tables does not prove an old routine invocation cannot resume after replacement. Save the actual narrow ACLs, use bounded locks/timeouts, and fail closed if quiescence cannot be established.

Within one error-stopping transaction, lock the affected staging tables, recheck the guarded version/definitions, add columns and replace reviewed routines, and compare **all original-column values** plus Auth/family/PIN/catalogue/request invariants with the private baseline. Set the staging version last. Any mismatch rolls the entire patch back. Restore only reviewed intended RPC access after the invariant check; a failed patch may leave the separately committed maintenance gate closed until the owner restores the captured safe access. No per-account reset is a recovery step.

Keep additive columns on rollback. Before any new activity, reverting code/metadata/grants can use the exact captured baseline subject to security review. After new activity, freeze writes under explicit incident scope and retain all new progress, balances, ownership and request rows; use a reviewed compatible routine/build fallback. Do not restore a pre-upgrade dump over newer activity or drop the new fields/history. Do not blindly restore old routines/grants if the diagnostic found a security flaw; remain in maintenance until a safe fallback is ready. Unlock revocation or account/PIN changes are separate decisions, not automatic rollback actions.

## Shortest route to hosted V5.2 testing

Approve/apply/verify the single importer EXECUTE correction separately → prepare/rehearse the minimal preservation patch and staging build (offline preparation may proceed before the correction) → review and explicitly approve the concrete staging install → verify unchanged protected state and staging identity/version → separately approve updating the existing private staging artifact → one concise hosted smoke using the **same four accounts and known PINs**.

Initial hosted checks use normal password Auth and known-PIN unlock, correct role/family views and unchanged progress/wallet display, then explicitly authorised incremental save/retry/CAS/wallet checks. No fresh account, PIN reset, wrong-PIN cooldown exercise, artificial fresh opening, arbitrary fixture overwrite or clearing of history is needed. Keep destructive/invalid cases in disposable tests. Auth recovery delivery or credential changes remain separate; do not reset a current PIN to test the bounded-AMR code. Cloud Supabase probing remains stopped; owner browser results are distinct from local/mock evidence.

Current verification: accepted owner-run diagnostic (five PASS, one narrowly scoped permission FAIL; all bodies EXACT), plus static scope review of the single-permission proposal. No PostgreSQL/Supabase SQL was executed by Codex. No completed security inventory, browser matrix or migration suite was repeated. Approval of the permission correction does not approve installing the V5.2 patch or publishing the build.

**Next owner action:** review [V52-STAGING-IMPORTER-REVOKE.sql](V52-STAGING-IMPORTER-REVOKE.sql) and explicitly approve only its single-function staging EXECUTE revoke; do not execute before approval.
