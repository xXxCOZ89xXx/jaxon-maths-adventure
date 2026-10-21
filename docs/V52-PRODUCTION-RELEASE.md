# V5.2 production integration release package — 21 October 2026

**Implemented and locally rehearsed; not applied, deployed or merged.** No genuine account, PIN, family, progress or reward record was accessed or altered. No remote Supabase call or proxy workaround was attempted. The owner-supplied CSV remains outside Git. The next steps concern release review and hosted acceptance, not rebuilding gameplay.

## Current owner decision: fresh gameplay at launch

The latest owner instruction supersedes the earlier requirement to carry forward game-generated entitlements. Preserve existing Auth accounts/UUIDs/passwords and exact family relationships; explicitly enroll server PINs. Start discovery, mastery, missions, minutes/week totals, coins/bonus, screen-time entitlement/history display, wardrobe/estate/achievements and Town activities at zero. Old records remain privately recoverable and never contribute to the new opening. This decision applies only to this game, not external rewards or account credentials.

**The next safe owner action is the private backup and restoration checklist in [V52-BACKUP-RESTORE.md](V52-BACKUP-RESTORE.md).** No production action is authorised in this session. The separate preservation path remains available; do not disguise a fresh reset as zero balances in its manifest.

## Metadata delta resolved

The 705-row export confirms PostgreSQL 17.11; all five existing application tables owned by `postgres`, RLS enabled/not forced; client roles without BYPASSRLS; pgcrypto 1.3 in `extensions`; an identity-backed reward-event sequence; and no application table triggers. Authenticated users can TRUNCATE `learning_progress` and execute `parent_award_maths_once`, but cannot execute the older `parent_award_maths`.

The existing valid unique partial index `maths_reward_event_once` covers parent/request columns. Its withheld predicate is **preserved unchanged**, not guessed or rewritten. Default privileges can grant broad client access to new public objects, so new protected tables/functions explicitly revoke privileges inside their creation transactions. Supabase/platform event-trigger helpers and `pgbouncer.get_auth` are untouched. Optional [targeted preflight](V52-PRODUCTION-PREFLIGHT.sql) checks crypto/reference capabilities, platform event-trigger identities, the retained index predicate as a boolean, and SQL-visible API schema settings without exporting bodies or personal records. Absent SQL settings do not prove active PostgREST exposure.

## Implemented SQL and application

| File | Prepared effect |
| --- | --- |
| [001_secure_backend.sql](../supabase/v51-production/001_secure_backend.sql) | Owner/project/table/RLS/crypto preflight; **inactive** production identity, PIN/unlock, CAS progress, wallet/catalogue and immutable request ledger. Reuses existing `maths_families` IDs/constraints; legacy data/access remains in place initially. |
| [002_catalog.sql](../supabase/v51-production/002_catalog.sql) | Existing 40-item catalogue in the reviewed inactive environment; no optional V2 shop migration or second wallet. |
| [003_activation.sql](../supabase/v51-production/003_activation.sql) | Shared atomic activation core with audited mode, preserved `v3_admin_activate(jsonb)` preservation interface, freeze/rollback and legacy-write guard. Definitions stay inactive. |
| [004_fresh_start.sql](../supabase/v51-production/004_fresh_start.sql) | Separate `v3_admin_activate_fresh_start(jsonb)`; explicit reset/backup approval, private legacy archive, exact family/fingerprint checks and release epoch. Installing it does not activate/reset. |
| [V52-FRESH-START-PREFLIGHT.sql](V52-FRESH-START-PREFLIGHT.sql) | Owner-run read-only hashes/counts of the legacy snapshot/permissions, tied to an exported backup snapshot; no personal rows or credentials returned. |
| [build-v52-production.cjs](../scripts/build-v52-production.cjs) | Complete static production artifact from the existing connected UI/game. Checked source transformations fail if integration seams drift; staging source/config/build and original live pages are unchanged. |
| [production-cloud.js](../v3/production-cloud.js) | Reusable SDK-injected password Auth/role/PIN/CAS transport, explicit enrollment and role/UUID-checked wallet transport. Financial callers must persist exact request IDs/contents before retries. No legacy fallback. |

The backend checks recent bounded password AMR before PIN enrollment/reset, uses four-/six-digit bcrypt PINs, persistent five-attempt/five-minute cooldowns and hashed Auth-bound/generation-bound tokens. Parent unlocks expire after 15 minutes; learner unlocks after 12 hours. Every protected operation checks the account/role/unlock. PIN row locks coordinate requests with reset/revocation.

Progress saves require immutable request IDs and matching revisions; conflicts preserve complete alternatives. Wallet/progress writes serialize per child. Wallet values never come from client progress JSON. Learners can save/buy/report capped activity; parents alone award/redeem/review offline time. Prices, funds, ownership, exact-once responses, null/invalid/nonfinite inputs and changed-payload request reuse are enforced server-side. The existing learning evidence/teaching engine is unchanged.

Ordinary reads do not initialize wallets. **Alternative preservation mode** needs one privately reviewed opening per existing family. Bonus and historical redemption totals must match locked legacy server rows. Historical redemptions become `legacy_redeemed`; new redemptions start separately. Verified outstanding entitlement becomes `opening_seconds`, **not fabricated learning**. Ownership uses reviewed catalogue IDs; old client JSON cannot mint ownership or coins. Fresh learning starts only at the explicit future activation; old JSON remains intact.

Activation atomically validates all openings, captures review/ACL snapshots, revokes old client access and both old reward RPCs, adds statement-level legacy-write guards and enables readiness. The guard also protects against privileged/previously entered legacy writers. Identical activation retries do not double-import; changed reviews, overwrite or automatic reactivation after rollback are refused.

### Exact fresh-start contract

Install 001–004 in order, only in the separately authorised future maintenance window. `003` now records `mode` on `v3_activation`; `004` requires a new, inactive installation. These are installation files, not rerunnable upgrades. If an earlier package was installed anywhere, stop and prepare a reviewed compatibility upgrade; do not rerun CREATE statements over it.

Fresh activation requires **both** `app.v51.cutover_authorized='yes'` and `app.v51.fresh_start_authorized='yes'`, administrator `postgres`, and `public.v3_admin_activate_fresh_start(review)`. The owner privately supplies:

```text
mode: "fresh-start"
migrationId: stable UUID for this activation
pinTransitionApproved: true
gameplayResetApproved: true
legacyFingerprint: SHA-256 from the backed-up legacy snapshot
permissionFingerprint: SHA-256 of reviewed legacy owners/RLS policies/ACLs and reward routine definitions
families: exactly [{familyId: existing UUID, parent: existing UUID, child: existing UUID}, ...]
backupReceipt: {archiveId: UUID, backupSha256: plaintext dump SHA-256,
                restoreReceiptSha256: private receipt SHA-256, restoreVerified: true}
```

This is a field specification, **not runnable production JSON**. Do not include bonus, remaining entitlement or ownership fields in fresh family entries; they are rejected. Full existing family count and every row's family/parent/child identity must match, without creating Auth/family records. The backup receipt is a recorded administrator acknowledgement, not automated proof that external files were restored.

Inside the shared locked transaction, fresh activation rejects existing new-backend progress/wallet/PIN/unlock/transaction rows, changed legacy data/balances/permissions or mismatched families. It archives all five legacy tables in `v51_private.fresh_start_archive`, stores fingerprints and receipt, creates `{}` progress and default-zero authoritative wallets, revokes legacy client access/RPCs, guards old writes and enables readiness. No historical `bonus`, `opening_seconds`, `legacy_redeemed`, ownership or evidence is imported. The private archive schema/table/functions deny PUBLIC/anon/authenticated/service-role access; its table has RLS and no client policies. Administrator access is necessary for recovery. Original legacy records also remain intact.

The activation audit includes the mode, exact review and original ACL snapshot. Any failure rolls back the archive, wallets, revocations and readiness together. Identical retries while ready return `alreadyActivated`; changed reviews or replay after freeze/rollback fail. Preserve mode remains `v3_admin_activate(review)` with real reviewed historical values; it rejects fresh manifests. No automatic archive import or deletion helper exists.

The identity API now includes nonsecret `activationId` and `activationMode`. Production game cache, progress queue, unlock, remote cache and financial intent keys include that release UUID. The reusable adapter does the same for its queue. Old keys/PIN data remain untouched but are not read or replayed by a fresh release. Cold startup requires successful live identity/readiness verification, including the fresh activation UUID; offline startup cannot reuse a previous verification. An already-open learner session retains its existing offline save behaviour. A frozen backend denies writes; any later reactivation requires a separately reviewed procedure.

The production build pins project/ref/URL/public key and requires `{name:"jaxon-maths-production",projectRef:"mbdelspbjusarbwlltol",contractVersion:1,ready:true}` before login. It uses separate storage/Auth namespaces, normal SDK password login/PKCE recovery, explicit PIN enrollment/reset, same-tab resume, Web Locks, saves/conflicts, parent controls and server wallet updates. Existing device PIN storage is preserved; it cannot be automatically converted to bcrypt. Known digits can be explicitly enrolled after password sign-in under the reviewed transition. Parent history distinguishes old redemptions, opening entitlement and new activity/redemptions. Goal/rates remain 60 minutes/week, ten coins/minute and 1:1 screen time.

The actual ignored `production-dist/` was built/validated using only the homepage's existing **browser-public** configuration, held in memory and not printed. It was not opened against production, uploaded or committed. No service-role key was used. CLI builds accept explicit `V51_PRODUCTION_*` configuration only, with no staging fallback. Only publish the validated static output, never the repository, tests, SQL, `.env`, CSVs or private backups. No app auth bypass, test session or public fictional identity is included.

## Actual test evidence — fresh-start continuation

[Fresh-start evidence and source hashes](../tests/artifacts/v5-2-fresh-start-verification.json) · [Fresh PostgreSQL output](../tests/artifacts/v5-2-fresh-start-security.txt). Earlier `v5-2-verification.json` and `v5-2-production-security.txt` describe the previous preservation package; they are retained as historical evidence, not rewritten to claim new tests.

| Check | Result and boundary |
| --- | --- |
| Fresh-start PostgreSQL | **14 suites passed**, disposable PG17 with network disabled and fictional records/claims. Full fictional pre-migration dump/restoration, unchanged Auth credential sentinels/family UUIDs, backup fingerprints/timezone stability, separate approvals, hostile/mismatched state, interrupted-transaction atomicity, exactly-once activation, all zero openings/new discovery, private archive denials, old-writer retirement, PIN enrollment/wrong PIN, first answered discovery plus clock-simulated eligible minute earning ten coins/one screen minute, parent rewards/new purchase/isolation, concurrent CAS and freeze/reconciliation/rollback. |
| Preservation PostgreSQL | **18 existing suites passed again** after refactoring activation, including independent fictional pre-migration backup restoration and reviewed entitlement/history. |
| Production browser | **24/24 passed**: eight each on desktop/iPad portrait/iPad landscape Chromium. Existing six flows plus fresh zero-opening/new discovery/save-refresh isolation from old queues/caches and fresh parent zero-history ignoring old financial intent. All remote traffic intercepted/denied. [Current report](../tests/artifacts/v5-2-production-browser.json). |
| Adapter/config | **10 suites passed**, including fresh epoch validation and isolation of preserved old pending saves; existing Auth/PIN/CAS boundaries retained. |
| Production artifact | Build verification passed: strict public config/CSP/assets, nine worlds/55 skills, unchanged gameplay, no tests/SQL/private files. Actual ignored configured artifact rebuilt locally without connecting. |
| Existing logic | `npm test` passed, including compatibility/learning/evidence/sync/fixtures and **1,107** renderer variants. |
| Staging | Source/SQL/builder/root live page bytes unchanged; staging build isolation passed. Previous 14 SQL/4 targeted browser results remain historical; those suites were not rerun for this production-only change. |

The synthetic schema/partial-index fixture does not reproduce hosted Supabase Auth/JWT/AMR, managed event triggers, PostgREST exposure/cache or recovery delivery. Browser requests are intercepted; backup restoration uses fictional records and is not evidence of an actual production backup. Clock manipulation is test-only; activity remains wall-clock-capped client reporting, not proof of real learning. The historical 344-case browser matrix was not rerun. Physical iPad Safari and actual multi-device/offline acceptance remain pending.

## Final release sequence — owner controlled, not executed

The owner completes or supervises every production/database/credential action. Automation can assist read-only checks, private exports/restoration, reviewed SQL execution and artifact verification **only after separate explicit authorisation and trusted access**; no current app/CLI/CI runner applies SQL. Do not merge/deploy during this task.

| Step | Owner action | Safe automation / acceptance evidence |
| --- | --- | --- |
| **1. Production preflight** | Confirm dashboard project, current schema/permissions/roles/versions, actual bookmarked route and hosting commit/settings. Last observed production: `0d0b0265d75f26efeaaaf9bfeea0f061ded2a5a0`, Pages legacy `main:/`, `https://xxxcoz89xxx.github.io/jaxon-maths-adventure/`. Preserve `rollback/production-before-v51-0d0b026`; re-record if changed. | Owner-run [targeted preflight](V52-PRODUCTION-PREFLIGHT.sql), plus private read-only counts/fingerprints. Do not repeat the bulk analysis. |
| **2. Private backup** | Drain old writers under maintenance; take full supported DB/Auth/family/legacy export, configuration/Storage coverage and encrypted independent copies. | Approved trusted backup tools; [backup guide](V52-BACKUP-RESTORE.md) snapshot/lock procedure, private hashes/counts. No real data in Git/CI. |
| **3. Verify restoration** | Restore privately in a compatible isolated target, verify identity/password/family/data/security coverage, retain encrypted receipt; resolve any omitted managed dependencies. | Error-stopping restoration and private integrity comparisons; receipt hashes/reference. A dump inventory alone is insufficient. |
| **4. Reviewed SQL installation** | Review all four files, PIN transition and schema compatibility; supply separate installation approval. Run full files 001,002,003,004 in order, with settings below in each same execution. | Transactional fail-closed installation; confirm ready=false and legacy state unchanged. No blind rerun over prior installations. |
| **5. Owner-approved fresh activation** | Privately review every family and the real backup/fingerprints; approve explicit gameplay reset and PIN enrollment. Run the fresh API with both flags and the real private manifest. | Atomic validation/archive/zero initialization/retirement; verify audited fresh mode, zero wallets/progress, exact Auth/family equality and client denials. Do not substitute zero preservation values. |
| **6. Application release** | Approve a reviewed commit publishing the exact validated artifact through existing Pages `main:/` and retiring legacy routes. Configure Auth Site URL/redirect allowlist for the intended URL (and exact `index.html` recovery path if used); verify actual RPC exposure/schema cache. | Build/asset/hash checks and Pages status. **Merging the development branch alone is insufficient**: its root homepage is still the old game. Release requires explicit artifact copying in a reviewed release commit. No release commit prepared/applied here. |
| **7. Auth and PIN verification** | Supply authorised fictional learner/parent accounts through a secure channel and supported network access. Verify password login, explicit first server PIN enrollment, wrong PIN, lock/reset/recovery and actual hosted AMR acceptance. | Normal SDK flows only; parent-only controls/direct denials and family isolation. Record identity 403/blocking honestly. Never use Jaxon's identity for destructive tests. |
| **8. First-time learner** | Check first discovery, all nine worlds/55 skills, hints/safe wrong answers and initial empty ownership/estate/Town. | Approved fictional UI checks; no old mastery, minutes, purchases or history after login/refresh. |
| **9. Wallet and progress** | Review first genuine learning minute and parent reward rules, save/resume/two-device conflicts, purchases/retry loss, zero historical/opening entitlement. | Expect 10 coins/minute and 1:1 screen time; 60-minute weekly goal. Wallet direct edits/learner rewards/cross-family access must be denied. |
| **10. Physical iPad** | Use a real iPad Safari to complete [acceptance checklist](V51-LIVE-RELEASE.md#physical-ipad-acceptance--pending): login/PIN, map, typed answers, tap/drag, bill split, fractions/coordinates, teaching, save/resume, connected shopping/cooking. | Device/layout emulation is supporting evidence only; mark physical checks pending until performed. |
| **11. Rollback if needed** | Freeze, take private post-release backup and reconcile all genuine new activity/financial effects before restoring old authority/code. | Helpers below preserve new records/archive; restore static release separately. Never overwrite live records with an old dump merely to undo release. |

For each whole installation file in step 4, use the following prefix in the **same SQL Editor execution**, since pooled sessions may not retain settings:

```sql
set app.v51.migration_authorized = 'yes';
set app.v51.authorized_ref = 'mbdelspbjusarbwlltol';
-- then the complete reviewed corresponding file, not fragments
```

Step 5 is a different future owner execution: set `app.v51.cutover_authorized='yes'` and `app.v51.fresh_start_authorized='yes'`, then call `public.v3_admin_activate_fresh_start(<PRIVATE_REVIEW_JSON>::jsonb)`. The placeholder is deliberately not runnable. Keep real family IDs/records/receipts out of shared artifacts. Unexpected state must abort and be reviewed, not cleared. After success, back up the new audit/private archive and backend along with the unchanged legacy tables; retain the original encrypted pre-installation backup.

## Freeze and rollback

1. Under owner incident approval, run `set app.v51.rollback_authorized='yes'; select public.v3_admin_freeze();` together. It waits for protected writes, disables readiness and revokes unlocks **without restoring old client access**.
2. Preserve new progress, wallet/opening snapshots and transaction IDs privately. Reconcile all post-cutover deltas and cosmetic/entitlement treatment before resuming old authority. Do not restore an old database snapshot over legitimate changes. If any new transactions exist, the rollback helper refuses restoration without explicit `app.v51.rollback_reconciled='yes'`; this is an owner acknowledgement, not automatic accounting reconciliation.
3. Call `v3_admin_rollback()` with the rollback setting and reconciliation acknowledgement when required. It restores captured legacy application access, **excluding destructive/unnecessary table grants** (TRUNCATE, DELETE, REFERENCES, TRIGGER). The old non-retry-safe function stays unavailable to authenticated users; captured retry-safe legacy execution is restored. New V3 records/PINs/ledger are retained; automatic reactivation/overwrite is refused.
4. Restore reviewed static code/configuration from the rollback tag with a new release/revert commit, not a force push. Verify the bookmarked route and old login/save/reward behaviour under the strengthened baseline. Static and database rollback are distinct; do not drop V3 data, delete accounts or reset PINs to make rollback appear clean.

## Remaining release gates

Fresh implementation and local rehearsal are complete. No production backup, SQL installation, reset, deployment or merge occurred. Owner backup/restoration evidence, production drift/security review, fresh/PIN-transition cutover approval, actual Auth/API/redirect configuration, protected fictional hosted accounts and supported identity-network access remain necessary. The old requirement to preserve unused game-generated rewards is superseded by the explicit fresh decision; those records must still remain recoverable. The private backup receipt cannot substitute for actual restoration work.

Real hosted Auth/JWT/AMR, recovery delivery, PostgREST access/cache, cross-family denials, multi-device/offline behaviour and physical Safari remain unverified. The next session should consume the owner's redacted backup/preflight evidence, review the exact release package and obtain the separately authorised production action scope. Do not repeat gameplay development or bulk schema collection; do not silently migrate/deploy/merge.
