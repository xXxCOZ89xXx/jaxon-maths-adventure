> **Owner-confirmed project correction, 29 October 2026:** `sfogrvedypgtxfvecmbx` is **Jaxon’s Maths Adventure - Main**, never a staging target. `mbdelspbjusarbwlltol` was deleted. No hosted staging project currently exists. Earlier labels/instructions below are historical and must not be used to access either ref. Use [the current isolation handoff](STAGING-ISOLATION-STATUS.md) and [working setup guide](SINGLE-CHILD-SETUP.md); never run old commands against Main.

# V5.2 production integration release package — 21 October 2026

**Implemented and locally rehearsed; not applied, deployed or merged.** No genuine account, PIN, family, progress or reward record was accessed or altered. No remote Supabase call or proxy workaround was attempted. The owner-supplied CSV remains outside Git. The next steps concern release review and hosted acceptance, not rebuilding gameplay.

## Final readiness audit — current status

**Owner-completed backup and Windows application recovery are accepted. Do not rerun restoration or ask for private files.** Full PostgreSQL export, encrypted second copy, integrity testing and PARTIAL/application PASS with unchanged archive have been reported and shown. Full Supabase-managed Auth recovery remains unverified.

Read [V52-CUTOVER-RUNBOOK.md](V52-CUTOVER-RUNBOOK.md) for the current exact approval-controlled sequence, recovery decision, fictional-account/network setup and acceptance criteria. The installation package is ready for review; go-live is not yet cleared. The owner must record provider recovery/configuration safeguards (or explicitly decide the remaining recovery risk), arrange supported network/fictional accounts, bind backup/current fingerprints, review Auth/API settings and approve production actions separately.

This audit adds `scripts/prepare-v52-release.cjs`: a single-transaction inactive installer for all four files, canonical restored-state fingerprint query, aggregate phase checks, hashed isolated `site/` and `.nojekyll`. It does not execute SQL or publish. Only `site/` may go to Pages; root live pages remain unchanged. Current prepared site redirects six known legacy/offline preview routes. `003` now explicitly keeps legacy writes blocked during freeze until reviewed rollback. `004` requires an explicit recovery scope and safeguards approval for a PARTIAL receipt; it never upgrades application verification to managed Auth verification. These changes are new-install definitions, not a rerunnable upgrade.

Seven new focused release-delta suites passed (fictional records, network-disabled PG17): package/routing boundaries, all-four atomic failure, inactive identity/account/family preservation, scoped-receipt gating, canonical/aggregate zero-opening checks, frozen legacy-writer denial and explicit rollback. Production build validation passed (nine worlds/55 skills, unchanged gameplay). No local backup-restoration, full gameplay matrix or hosted Auth tests were repeated. Earlier test tables below remain historical. [Current audit evidence](../tests/artifacts/v5-2-release-readiness.json).

Read-only GitHub recheck: PR #2 remains open/draft, Pages still `main:/`, last successful production commit `0d0b0265d75f26efeaaaf9bfeea0f061ded2a5a0`, rollback tag resolves to the same commit. Current Cloud policy still omits the production Pages/Supabase hosts; no new blocked probes or identity calls were attempted.

## Current owner decision: fresh gameplay at launch

The latest owner instruction supersedes the earlier requirement to carry forward game-generated entitlements. Preserve existing Auth accounts/UUIDs/passwords and exact family relationships; explicitly enroll server PINs. Start discovery, mastery, missions, minutes/week totals, coins/bonus, screen-time entitlement/history display, wardrobe/estate/achievements and Town activities at zero. Old records remain privately recoverable and never contribute to the new opening. This decision applies only to this game, not external rewards or account credentials.

**The next safe owner action is the recovery/access decision in [V52-CUTOVER-RUNBOOK.md](V52-CUTOVER-RUNBOOK.md), using the completed backup/recovery evidence.** No production action is authorised in this session. The separate preservation path remains available; do not disguise a fresh reset as zero balances in its manifest.

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
                restoreReceiptSha256: private receipt SHA-256, restoreVerified: true,
                recoveryScope: "application-data-only", managedAuthRecoveryVerified: false,
                managedServiceSafeguardsApproved: true}
```

This is a field specification, **not runnable production JSON**. Do not include bonus, remaining entitlement or ownership fields in fresh family entries; they are rejected. Full existing family count and every row's family/parent/child identity must match, without creating Auth/family records. The backup receipt is a recorded administrator acknowledgement, not automated proof that external files were restored. Its explicit scope refers to the completed PARTIAL application recovery; safeguards approval must follow the owner decision in the current runbook, never an automatic flag.

Inside the shared locked transaction, fresh activation rejects existing new-backend progress/wallet/PIN/unlock/transaction rows, changed legacy data/balances/permissions or mismatched families. It archives all five legacy tables in `v51_private.fresh_start_archive`, stores fingerprints and receipt, creates `{}` progress and default-zero authoritative wallets, revokes legacy client access/RPCs, guards old writes and enables readiness. No historical `bonus`, `opening_seconds`, `legacy_redeemed`, ownership or evidence is imported. The private archive schema/table/functions deny PUBLIC/anon/authenticated/service-role access; its table has RLS and no client policies. Administrator access is necessary for recovery. Original legacy records also remain intact.

The activation audit includes the mode, exact review and original ACL snapshot. Any failure rolls back the archive, wallets, revocations and readiness together. Identical retries while ready return `alreadyActivated`; changed reviews or replay after freeze/rollback fail. Preserve mode remains `v3_admin_activate(review)` with real reviewed historical values; it rejects fresh manifests. No automatic archive import or deletion helper exists.

The identity API now includes nonsecret `activationId` and `activationMode`. Production game cache, progress queue, unlock, remote cache and financial intent keys include that release UUID. The reusable adapter does the same for its queue. Old keys/PIN data remain untouched but are not read or replayed by a fresh release. Cold startup requires successful live identity/readiness verification, including the fresh activation UUID; offline startup cannot reuse a previous verification. An already-open learner session retains its existing offline save behaviour. A frozen backend denies writes; any later reactivation requires a separately reviewed procedure.

The production build pins project/ref/URL/public key and requires `{name:"jaxon-maths-production",projectRef:"mbdelspbjusarbwlltol",contractVersion:1,ready:true}` before login. It uses separate storage/Auth namespaces, normal SDK password login/PKCE recovery, explicit PIN enrollment/reset, same-tab resume, Web Locks, saves/conflicts, parent controls and server wallet updates. Existing device PIN storage is preserved; it cannot be automatically converted to bcrypt. Known digits can be explicitly enrolled after password sign-in under the reviewed transition. Parent history distinguishes old redemptions, opening entitlement and new activity/redemptions. Goal/rates remain 60 minutes/week, ten coins/minute and 1:1 screen time.

Earlier ignored `production-dist/` was built/validated using only the homepage's existing **browser-public** configuration, held in memory and not printed. It was not opened against production, uploaded or committed. No service-role key was used. CLI builds accept explicit `V51_PRODUCTION_*` configuration only, with no staging fallback. For this final release use the freshly sealed `release-preparation-dist/site/`, not an older build directory. Only publish the validated static output, never the repository, tests, SQL, `.env`, CSVs or private backups. No app auth bypass, test session or public fictional identity is included.

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

## Exact owner-controlled sequence

Use [V52-CUTOVER-RUNBOOK.md](V52-CUTOVER-RUNBOOK.md) as the single current sequence. Resolve recovery/access decisions and protected fictional families, bind the backup baseline to drained production, seal/review the package, approve and run **the complete generated install-inactive.sql once**, verify inactive aggregates/API/Auth configuration, separately approve fresh activation/scoped receipt, verify zero openings and fictional canary, then separately approve the Pages artifact release and complete live/iPad acceptance. Do not also run the four originals after the atomic installer or execute an older package over the current definitions.

Only owner-approved production actions may change the database, Auth/API settings or Pages. No app/CI installer exists. SQL, private receipts and package metadata must never be copied into the published site. New audit/archive/ledger state should be protected after activation while retaining the unchanged original backup.

## Freeze and rollback

1. Under owner incident approval, run `set app.v51.rollback_authorized='yes'; select public.v3_admin_freeze();` together. It waits for protected writes, disables readiness and revokes unlocks **without restoring old client access**. The audited `legacy_restored` flag keeps even privileged legacy writes blocked until explicit rollback.
2. Preserve new progress, wallet/opening snapshots and transaction IDs privately. Reconcile all post-cutover deltas and cosmetic/entitlement treatment before resuming old authority. Do not restore an old database snapshot over legitimate changes. If any new transactions exist, the rollback helper refuses restoration without explicit `app.v51.rollback_reconciled='yes'`; this is an owner acknowledgement, not automatic accounting reconciliation.
3. Call `v3_admin_rollback()` with the rollback setting and reconciliation acknowledgement when required. It restores captured legacy application access, **excluding destructive/unnecessary table grants** (TRUNCATE, DELETE, REFERENCES, TRIGGER). The old non-retry-safe function stays unavailable to authenticated users; captured retry-safe legacy execution is restored. New V3 records/PINs/ledger are retained; automatic reactivation/overwrite is refused.
4. Restore reviewed static code/configuration from the rollback tag with a new release/revert commit, not a force push. Verify the bookmarked route and old login/save/reward behaviour under the strengthened baseline. Static and database rollback are distinct; do not drop V3 data, delete accounts or reset PINs to make rollback appear clean.

## Remaining release gates

The code/installer/site package is prepared for explicit owner review and production approval. The existing encrypted export/integrity/Windows application recovery is **completed**; do not repeat it or access its private report. Full managed Auth recovery remains unverified and requires the provider recovery/configuration safeguards or explicit owner risk decision documented in the current runbook. SQL receipt scope must stay honest.

Supported production network access, securely provisioned/allowlisted fictional families, current snapshot/permission fingerprints and schema preflight, actual Auth/API/redirect settings, SQL/activation/release approvals and hosted/physical-iPad acceptance remain. Adding fictional families or new activity after the backup requires current-state backup coverage; never substitute a new fingerprint without it. No production action, genuine account change, deployment or merge has occurred. The next session should consume the owner's recovery/access decisions and approve the concrete sealed inactive installer; preserve completed gameplay and recovery work.
