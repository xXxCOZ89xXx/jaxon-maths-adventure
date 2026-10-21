# V5.2 staging preservation upgrade — design only

Status: 21 October 2026. Branch `codex/v3-adventure-build`; reviewed starting head `8cf12fcc3b958bef8f07a18ac8eea9459172a146`. **No upgrade SQL is supplied or executed. No hosted testing, activation or publication is authorised by this design.** Existing staging is `sfogrvedypgtxfvecmbx`; production is outside scope.

## Accepted owner results

The owner ran the compatibility file in the correct staging project and reports **8 PASS / 5 REVIEW / 1 expected FAIL**. Four email-confirmed Auth accounts, two independent families and four linked PIN rows pass. The staging table contract, family structure, all 40 catalogue item/price pairs and absence of V5.2 activation overlap pass. These are owner-run results, not a new Codex connection or a rerun of completed inventories.

Migration footprints have zero missing routines and six changed definitions/attributes. SQL migration history is unavailable; Auth history has 82 entries. Manual SQL Editor installs may have no Supabase CLI migration ledger. Neither absence of that ledger nor an Auth migration count establishes a broken installation or the installed application version. Do not manufacture migration-history rows. Auth/API service settings remain REVIEW. The production new-install package remains an expected FAIL on existing staging.

## What is known about the six differences

The old check collapses raw source MD5, SECURITY DEFINER, language, return type and one exact `search_path` setting representation into one counter. Six differences therefore do **not** prove six changed bodies, six vulnerabilities or six intended V5.2 fixes. Local extraction verified all six expected MD5s against the committed staging SQL; no baseline-hash correction is justified.

A routine can differ harmlessly in indentation, line endings outside literals, unquoted identifier case or comments. An empty path may be represented as `search_path=` or `search_path=""`; both exclude a named schema, but the original query accepted only the second form. This is a diagnostic hypothesis, not a finding about the live database. Conversely, the following are meaningful: changed literal values or operators; removed family/role/unlock checks; different password-AMR window/cast; cooldown/generation handling; row locking; save revision/replay logic; wallet arithmetic; identity marker or auto-initialisation; and changed execution context, defaults or grants.

Run only [V52-STAGING-ROUTINE-DIAGNOSTIC.sql](V52-STAGING-ROUTINE-DIAGNOSTIC.sql) next. It reads `pg_proc` and related metadata for the same six signatures and returns **six rows**, separating:

- raw-source equality from conservative token-equivalent formatting/comments;
- the old exact path test from equivalent empty-path forms;
- definer, owner, language, return type, parameter names/defaults and other execution attributes;
- effective execute access for PUBLIC, anon, authenticated and service_role.

It never calls the routines or reads account/application rows. It compares quoted repository bodies as data and returns neither live definitions nor literal/token contents, settings values, credentials or personal identifiers. In particular, service-role access to the administrator-only importer is checked rather than assumed safe from the original REVOKE statement or schema defaults.

`EXACT` / `FORMATTING_ONLY` with expected attributes/access permits **PASS against the legacy staging baseline**, not certification of V5.2 security. Quoted literal/identifier contents and token boundaries are retained; whitespace inside literals is significant. Backslashes, dollar quoting and block comments force REVIEW unless raw source already matches. This deliberately incomplete lexical comparison does not pretend to be an SQL/PLpgSQL semantic parser. An unrecognised body/default/configuration remains REVIEW; a nonempty/absent path, changed definer context or prohibited runtime grant is FAIL. No live changes should be made just to obtain PASS.

If the six rows identify token changes, those routines alone still need an exact private source comparison; do not export a whole schema or post unknown function bodies that might contain hardcoded identifiers/secrets. Resolve that targeted gap before an executable upgrade is approved. No cause for the six live differences is asserted yet.

## Proposed in-place staging design

### Preserve the existing authority

Keep Auth users/identities/passwords, existing family rows and their child-UUID PK unchanged. Keep every original column in `v3_pins`, `v3_unlocks`, `v3_progress`, `v3_wallet`, `v3_catalog` and `v3_transactions` unchanged during installation. This includes PIN hashes/generations/attempt counters/cooldowns, unexpired unlocks, progress JSON/unknown fields/revisions/timestamps, coin and bonus balances, credited and redeemed time, purchases, activity clock and immutable request payloads/results.

Do not import, recreate, initialise missing learner rows automatically, reseed the catalogue, recalculate rewards from client JSON, move redeemed time between fields, renumber revisions or clear retry history. If the existing two linked learners lack required progress/wallet rows, stop and propose that specific initialisation separately. Preservation must be verified against a quiescent before/after baseline, not inferred from row counts.

### Minimal additive schema and RPC changes

Prepare a NEW staging-only migration after resolving live drift; never adapt the production installer by replacing its project ref.

1. Guard the exact staging marker and approved observed routine/schema version, and reject activation/private-production overlap. The owner separately verifies the physical project in the dashboard. Preserve existing family shape; no production legacy-table dependencies.
2. Add `opening_seconds` and `legacy_redeemed` to `v3_wallet` as nonnegative numeric fields defaulting to zero. Keep all old wallet columns unchanged. Zero opening seconds leaves `active_seconds/60 - redeemed` unchanged; no historical entitlement is copied or credited twice. Existing `redeemed` remains cumulative staging redemption, with a cumulative label in the staging UI.
3. Add only a staging upgrade-version field to `v3_environment`; retain its name/ref and no production readiness/PIN-transition/fresh-start flags. Set the reviewed version in the same atomic patch after preservation assertions. Extend `v3_identity` additively with that version; no `v3_admin_activate*` entry point or activation epoch is used.
4. Use `CREATE OR REPLACE` only for reviewed routine deltas, keeping signatures, parameter names, return shapes and explicit grants. Retain server-derived roles. Harden the password-AMR window, role-length PIN validation, PIN-generation/request locking, bounded safe revisions, finite numeric arguments and exact operation-argument checks from the V5.2 contract. Replacing code must not invoke PIN enrollment/reset or invalidate existing unlocks.
5. Make the request read branch side-effect free. Serialize mutations with the existing learner wallet lock and pin-generation check. Existing request IDs/payloads/results remain authoritative: after account/role/unlock verification, operation-specific role authorization and a valid request identity, check for a committed exact replay **before applying new payload restrictions**. Return its original result without side effects; changed payload/operation is denied. This preserves historical accepted requests even if an old payload would not be accepted as a new operation. New calls receive strict V5.2 validation. The empty read/lock argument conventions stay compatible.
6. Leave the privileged importer unused and keep it inaccessible to runtime roles. Any required targeted ACL correction must be declared in the proposed migration/approval, never silently applied now. Preserve RLS and deny direct client table access.

There must be no broad function/table grant changes, production legacy-write retirement, private archive creation or full-schema replacement. The eventual installer changes staging behaviour when committed, so approval must expressly cover those code/metadata changes; this design does not grant execution approval.

### Staging build and durable browser state

Reuse the current gameplay and connected UI, with a staging-specific build that verifies the real staging ref/name and expected upgrade version. Do not relax `Backend.productionConfig`, spoof a production marker or repoint the production bundle. Keep production and offline boundaries intact.

Retain the existing staging origin and auth/game/sync/intent storage keys and contents. Do not add a fresh-start namespace/epoch, sign everyone out, clear caches or rewrite queued request IDs. Preserve queued immutable requests, later drafts, conflicts and archives. A committed historical replay receives its original result, including its old response shape; the staging adapter must tolerate additive wallet fields. An uncommitted pending operation rejected by new validation remains intact with an explicit review/retry path, not a fabricated replacement or a silent drop. Require live upgrade-version verification before the new build sends upgraded operations; offline drafts remain preserved. Avoid two concurrent writer builds sharing one browser state.

## Minimum gates before approval

These are implementation/release gates, **not another owner inventory to perform now**.

1. **Resolve only the six-routine drift.** Review the diagnostic rows; obtain a private targeted source diff only for unresolved bodies. Reuse all accepted family/Auth/catalogue/schema results. Review only the relevant Auth dashboard settings (private signup policy, exact existing private-origin recovery redirects, intended public RPC exposure) before hosted work. SQL cannot certify these or real JWT/AMR.
2. **Protect current staging state privately.** Have a current recoverable staging application snapshot and exact previous definitions/grants/version plus the existing private artifact/build reference. Include PIN/unlock/progress/wallet/request history; do not upload them to Git/chat. The completed production backup is not a staging snapshot. No repeat production restoration or full security inventory is required.
3. **Check only the proposed delta preconditions.** In the protected execution/rehearsal path, verify both existing learners have required rows, revisions are safe integers, wallet/added-field values satisfy the new finite/nonnegative rules, and owned items/retry records fit the unchanged contract. Unexpected values stop installation without repair or rounding. Produce booleans/digests privately, not record dumps.
4. **Rehearse the exact candidate and rollback on fictional data only.** Focus on unchanged original columns/PIN state and relationships; a late-error atomic rollback; old exact replay including previously accepted extra fields; changed replay denial and stale CAS denial; new validation without unintended writes; generation locking; read with no row creation; retained browser queues; and rollback without losing post-upgrade state. Reuse previous gameplay/security evidence; no broad suite rerun.
5. **Approve a concrete staging-only package.** Review its diff, checksum, observed-state guards, preservation assertions, exact maintenance/grant scope and rollback. Explicit approval covers installation only. Hosting changes and normal hosted operations need their own scope; production SQL/activation, credentials/PIN changes, account provisioning, merge and deployment are not included.

## Atomic installation and rollback safeguards

During a separately approved execution, briefly block new application RPC execution through a narrow reviewed maintenance/grant plan and drain already-running requests before taking the final baseline. Merely closing a browser or locking tables does not prove an old routine invocation cannot resume after replacement. Save the actual narrow ACLs, use bounded locks/timeouts, and fail closed if quiescence cannot be established.

Within one error-stopping transaction, lock the affected staging tables, recheck the guarded version/definitions, add columns and replace reviewed routines, and compare **all original-column values** plus Auth/family/PIN/catalogue/request invariants with the private baseline. Set the staging version last. Any mismatch rolls the entire patch back. Restore only reviewed intended RPC access after the invariant check; a failed patch may leave the separately committed maintenance gate closed until the owner restores the captured safe access. No per-account reset is a recovery step.

Keep additive columns on rollback. Before any new activity, reverting code/metadata/grants can use the exact captured baseline subject to security review. After new activity, freeze writes under explicit incident scope and retain all new progress, balances, ownership and request rows; use a reviewed compatible routine/build fallback. Do not restore a pre-upgrade dump over newer activity or drop the new fields/history. Do not blindly restore old routines/grants if the diagnostic found a security flaw; remain in maintenance until a safe fallback is ready. Unlock revocation or account/PIN changes are separate decisions, not automatic rollback actions.

## Shortest route to hosted V5.2 testing

Owner six-row diagnostic → resolve any remaining routine-only drift → prepare/rehearse the minimal preservation patch and staging build → review and explicitly approve the concrete staging install → verify unchanged protected state and staging identity/version → separately approve updating the existing private staging artifact → one concise hosted smoke using the **same four accounts and known PINs**.

Initial hosted checks use normal password Auth and known-PIN unlock, correct role/family views and unchanged progress/wallet display, then explicitly authorised incremental save/retry/CAS/wallet checks. No fresh account, PIN reset, wrong-PIN cooldown exercise, artificial fresh opening, arbitrary fixture overwrite or clearing of history is needed. Keep destructive/invalid cases in disposable tests. Auth recovery delivery or credential changes remain separate; do not reset a current PIN to test the bounded-AMR code. Cloud Supabase probing remains stopped; owner browser results are distinct from local/mock evidence.

Current verification: static SQL scope/delimiter checks and a local lexical-model check of six reference bodies (format/comment equivalence and changed literal/operator/token rejection). No PostgreSQL runtime test or Supabase query was run by Codex. No completed security inventory, browser matrix or migration suite was repeated.

**Next owner action:** run the whole six-row routine diagnostic once in a new SQL Editor query as postgres in staging `sfogrvedypgtxfvecmbx`, and share only that result grid.
