# V5.2 production integration release package — 21 October 2026

**Implemented and locally rehearsed; not applied, deployed or merged.** No genuine account, PIN, family, progress or reward record was accessed or altered. No remote Supabase call or proxy workaround was attempted. The owner-supplied CSV remains outside Git. The next steps concern release review and hosted acceptance, not rebuilding gameplay.

## Metadata delta resolved

The 705-row export confirms PostgreSQL 17.11; all five existing application tables owned by `postgres`, RLS enabled/not forced; client roles without BYPASSRLS; pgcrypto 1.3 in `extensions`; an identity-backed reward-event sequence; and no application table triggers. Authenticated users can TRUNCATE `learning_progress` and execute `parent_award_maths_once`, but cannot execute the older `parent_award_maths`.

The existing valid unique partial index `maths_reward_event_once` covers parent/request columns. Its withheld predicate is **preserved unchanged**, not guessed or rewritten. Default privileges can grant broad client access to new public objects, so new protected tables/functions explicitly revoke privileges inside their creation transactions. Supabase/platform event-trigger helpers and `pgbouncer.get_auth` are untouched. Optional [targeted preflight](V52-PRODUCTION-PREFLIGHT.sql) checks crypto/reference capabilities, platform event-trigger identities, the retained index predicate as a boolean, and SQL-visible API schema settings without exporting bodies or personal records. Absent SQL settings do not prove active PostgREST exposure.

## Implemented SQL and application

| File | Prepared effect |
| --- | --- |
| [001_secure_backend.sql](../supabase/v51-production/001_secure_backend.sql) | Owner/project/table/RLS/crypto preflight; **inactive** production identity, PIN/unlock, CAS progress, wallet/catalogue and immutable request ledger. Reuses existing `maths_families` IDs/constraints; legacy data/access remains in place initially. |
| [002_catalog.sql](../supabase/v51-production/002_catalog.sql) | Existing 40-item catalogue in the reviewed inactive environment; no optional V2 shop migration or second wallet. |
| [003_activation.sql](../supabase/v51-production/003_activation.sql) | Defines administrator-only activation, freeze, rollback and legacy-write guard. Defining these routines does not activate, import or reset anything. |
| [build-v52-production.cjs](../scripts/build-v52-production.cjs) | Complete static production artifact from the existing connected UI/game. Checked source transformations fail if integration seams drift; staging source/config/build and original live pages are unchanged. |
| [production-cloud.js](../v3/production-cloud.js) | Reusable SDK-injected password Auth/role/PIN/CAS transport, explicit enrollment and role/UUID-checked wallet transport. Financial callers must persist exact request IDs/contents before retries. No legacy fallback. |

The backend checks recent bounded password AMR before PIN enrollment/reset, uses four-/six-digit bcrypt PINs, persistent five-attempt/five-minute cooldowns and hashed Auth-bound/generation-bound tokens. Parent unlocks expire after 15 minutes; learner unlocks after 12 hours. Every protected operation checks the account/role/unlock. PIN row locks coordinate requests with reset/revocation.

Progress saves require immutable request IDs and matching revisions; conflicts preserve complete alternatives. Wallet/progress writes serialize per child. Wallet values never come from client progress JSON. Learners can save/buy/report capped activity; parents alone award/redeem/review offline time. Prices, funds, ownership, exact-once responses, null/invalid/nonfinite inputs and changed-payload request reuse are enforced server-side. The existing learning evidence/teaching engine is unchanged.

Ordinary reads do not initialize wallets. Activation needs one privately reviewed opening per existing family. Bonus and historical redemption totals must match locked legacy server rows. Historical redemptions become `legacy_redeemed`; new redemptions start separately. Verified outstanding entitlement becomes `opening_seconds`, **not fabricated learning**. Ownership uses reviewed catalogue IDs; old client JSON cannot mint ownership or coins. Fresh learning starts only at the explicit future activation; old JSON remains intact.

Activation atomically validates all openings, captures review/ACL snapshots, revokes old client access and both old reward RPCs, adds statement-level legacy-write guards and enables readiness. The guard also protects against privileged/previously entered legacy writers. Identical activation retries do not double-import; changed reviews, overwrite or automatic reactivation after rollback are refused.

The production build pins project/ref/URL/public key and requires `{name:"jaxon-maths-production",projectRef:"mbdelspbjusarbwlltol",contractVersion:1,ready:true}` before login. It uses separate storage/Auth namespaces, normal SDK password login/PKCE recovery, explicit PIN enrollment/reset, same-tab resume, Web Locks, saves/conflicts, parent controls and server wallet updates. Existing device PIN storage is preserved; it cannot be automatically converted to bcrypt. Known digits can be explicitly enrolled after password sign-in under the reviewed transition. Parent history distinguishes old redemptions, opening entitlement and new activity/redemptions. Goal/rates remain 60 minutes/week, ten coins/minute and 1:1 screen time.

The actual ignored `production-dist/` was built/validated using only the homepage's existing **browser-public** configuration, held in memory and not printed. It was not opened against production, uploaded or committed. No service-role key was used. CLI builds accept explicit `V51_PRODUCTION_*` configuration only, with no staging fallback. Only publish the validated static output, never the repository, tests, SQL, `.env`, CSVs or private backups. No app auth bypass, test session or public fictional identity is included.

## Actual test evidence

[Scope/counts and source hashes](../tests/artifacts/v5-2-verification.json) · [Production PostgreSQL output](../tests/artifacts/v5-2-production-security.txt).

| Check | Result and practical boundary |
| --- | --- |
| Production migration/security | **18 suites passed** in disposable PostgreSQL 17, network disabled. Reconstructed five-table schema/functions/grants with fictional accounts; guarded/inactive install, failed-cutover atomicity, exact-once openings, grants/RLS, PIN AMR/cooldown/recovery, family/role denial, concurrent CAS/retries, wallet/prices/ownership, finite inputs, clock caps, entitlement/history, freeze/reconciliation gates, rollback and pre-migration backup restoration into a separate disposable database. |
| Production browser | **18/18 passed**, six cases each on desktop/iPad portrait/iPad landscape Chromium: readiness gate, normal SDK login/wrong PIN, enrollment, lost-save/resume/lock, parent history/reward, PKCE request and legacy bookmark routing. All nonlocal traffic intercepted or denied. [Report](../tests/artifacts/v5-2-production-browser.json). |
| Adapter/config | **9 suites passed**: inert construction, public configuration/identity validation, enrollment, role/UUID transport, expired/cross-account tokens, exact drafts/retries, CAS alternatives and modules-only packaging. |
| Production artifact | Strict public configuration/CSP/local assets; nine worlds/55 skills; unchanged gameplay bytes; tests/SQL/private files excluded; nonempty output protected. Configured artifact built without connecting. |
| Existing logic | `npm test` passed: V2 compatibility, engines/evidence/sync/fixtures and 1,107 renderer variants. |
| Staging regression | **14/14 PostgreSQL suites** plus **4 targeted desktop browser cases** passed (login/PIN/save, parent and recovery/rate limits). Staging client/SQL/config/builder bytes unchanged. |

The rehearsal deliberately uses a **synthetic** partial-index predicate; production's omitted predicate is not assumed or needed by the new code. Plain PostgreSQL does not reproduce Supabase platform event triggers, Auth JWT acceptance, PostgREST cache/exposure or email delivery. Browser APIs are intercepted. These are not hosted Auth/RLS certification. The historical 344 gameplay cases were not rerun. Physical iPad Safari and real multi-device/offline recovery remain pending. Activity credit remains clock-capped client reporting, not proof of genuine mathematical work or resistance to simulated activity at the permitted wall-clock rate.

## Future installation and cutover — owner controlled

Nothing below has been executed remotely. Current instructions still prohibit production migration, deployment and merge.

1. Verify the production project in the dashboard, schema drift/targeted preflight and private backup/restore. Preserve `rollback/production-before-v51-0d0b026`; re-record current hosting/commit if changed. Last observed production was `0d0b0265d75f26efeaaaf9bfeea0f061ded2a5a0`, Pages legacy `main:/`, HTTPS, no custom domain. Workspace source backups are not durable database backups.
2. Review all SQL and approve the PIN/accounting transition. Administrator settings are explicit acknowledgements, not cryptographic attestation of the selected database. SQL must run as `postgres`; guard checks fail rather than weaken permissions or rewrite unexpected schema.
3. When separately authorised, prefix **each whole file** 001, 002 and 003 in order with the following in the **same SQL Editor execution**. Pooled editor connections may not retain settings between runs:

   ```sql
   set app.v51.migration_authorized = 'yes';
   set app.v51.authorized_ref = 'mbdelspbjusarbwlltol';
   -- then the complete corresponding migration file
   ```

   Files are transactional. Do not run fragments, substitute staging SQL or auto-apply through app/CI. Backend remains inactive; old application access is unchanged at this stage.
4. Privately prepare/review a manifest: `migrationId` (stable UUID), `pinTransitionApproved:true`, `families` with exactly one `{child,bonus,remaining_minutes,legacy_redeemed,owned}` per existing family. Keep real UUIDs/balances private. Zero remaining entitlement needs verification; learning-reset permission does not waive legitimate rewards. Preserve local PIN configuration and existing Auth/family identities.
5. Schedule maintenance/drain old traffic. Under separate cutover approval, run `set app.v51.cutover_authorized='yes'; select public.v3_admin_activate(<PRIVATE_REVIEW_JSON>::jsonb);` in one owner execution. The placeholder is not a runnable manifest. Validation failures abort all changes. Locks, guards and revocations establish one wallet authority.
6. Configure Auth Site URL/redirect allowlist for **https://xxxcoz89xxx.github.io/jaxon-maths-adventure/** and the exact `index.html` path if recovery is requested there. Securely supply authorised fictional live accounts and supported network access for verification; do not reuse Jaxon's session or expose credentials/private staging. Confirm actual public RPC exposure/schema refresh in Supabase.
7. Prepare a reviewed release commit from the exact validated static artifact through existing Pages `main:/`. **Merging the development branch alone is insufficient**: its root homepage intentionally remains the old game. The release must explicitly copy the built homepage/public config/compiled entry/assets and deliberately retire/redirect bookmarked legacy routes such as `/v2-game-test.html`. No release commit or deployment was made here.
8. Verify Pages build, normal fictional learner/parent password+PIN login, wrong PIN, parent-only controls/direct denials, save/reload, purchase/award/redemption retries, family isolation and recovery. Then complete the existing [physical-iPad checklist](V51-LIVE-RELEASE.md#physical-ipad-acceptance--pending). Record blocked tests honestly; do not disable security to pass.

## Freeze and rollback

1. Under owner incident approval, run `set app.v51.rollback_authorized='yes'; select public.v3_admin_freeze();` together. It waits for protected writes, disables readiness and revokes unlocks **without restoring old client access**.
2. Preserve new progress, wallet/opening snapshots and transaction IDs privately. Reconcile all post-cutover deltas and cosmetic/entitlement treatment before resuming old authority. Do not restore an old database snapshot over legitimate changes. If any new transactions exist, the rollback helper refuses restoration without explicit `app.v51.rollback_reconciled='yes'`; this is an owner acknowledgement, not automatic accounting reconciliation.
3. Call `v3_admin_rollback()` with the rollback setting and reconciliation acknowledgement when required. It restores captured legacy application access, **excluding destructive/unnecessary table grants** (TRUNCATE, DELETE, REFERENCES, TRIGGER). The old non-retry-safe function stays unavailable to authenticated users; captured retry-safe legacy execution is restored. New V3 records/PINs/ledger are retained; automatic reactivation/overwrite is refused.
4. Restore reviewed static code/configuration from the rollback tag with a new release/revert commit, not a force push. Verify the bookmarked route and old login/save/reward behaviour under the strengthened baseline. Static and database rollback are distinct; do not drop V3 data, delete accounts or reset PINs to make rollback appear clean.

## Remaining release gates

Local implementation and rehearsal can proceed without further bulk metadata collection; they are complete for this package. The owner still needs private backup/restore, SQL/opening/PIN-transition approval, bookmarked-route/reward-entitlement confirmation, actual API/Auth redirect settings, protected fictional accounts/network access, and a reviewed artifact-to-Pages cutover/rollback window. The targeted preflight handles the small intentionally omitted platform/reference checks without another 705-row export.

Real hosted Auth AMR/JWT acceptance, recovery email/redirect delivery, PostgREST rules/cache, family isolation, cross-device/offline recovery and physical Safari remain release acceptance gates. The next session should review this package and new owner evidence, resolve those gates under its instruction, and preserve the completed gameplay.
