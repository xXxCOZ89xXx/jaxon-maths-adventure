# Saving and receipt upgrade — development only

Owner measurements: database 18 MB; ledger 7.1 MB physical, 835 rows including 681 full snapshots (~18 MB logical payload); largest save ~32.7 KB. No space emergency or reset is needed. Test data is disposable only with separate reset approval.

## Changes

- `v3/cloud-sync.js`: exact V1 pending requests/archives remain; duplicate content differing only by local revision is not re-uploaded. Added durable financial-intent recovery: persist a successful receipt before refreshing the wallet; retry lost responses with the same request ID; recover independently of shop buttons. Authentication/transport uncertainty preserves the intent. Only explicit business rejections can discard it. Parent retries remain deliberate.
- `v3/staging-app.js`: immediate local saves; routine cloud saves at approximately 30-second intervals, with forced recovery/checkpoints on reconnect, reopen, visibility changes and save/exit. Each routine flush sends one saved request; later edits remain queued. Confirmed purchase recovery refreshes the displayed wallet. No storage keys or existing progress/task formats are changed; one additive session capability marker prevents new builds using an unverified backend while offline.
- `supabase/v3-staging/004_compact_save_receipts.sql`: additive column and internal canonicalisation helper; new receipts retain only SHA-256 request fingerprints, operation-specific metadata and original results. No new receipt retains full progress, even in arbitrary extra request fields. Numeric normalisation preserves jsonb numeric equality. A before-insert guard also compacts an old RPC invocation already in flight at the migration boundary. Legacy rows are not altered, deleted or backfilled and continue exact payload comparison. CAS, per-learner locking, role/PIN checks, wallets, prices, reward arithmetic, owner and grants remain unchanged.
- Identity advertises `saveReceiptVersion:1`. The new app fails closed before game writes if the capability is absent; the old app ignores it and works against the migrated backend.

Small receipts still grow with requests and are retained for late offline retries. This corrects full-snapshot multiplication; it does not introduce a dangerous time-based deletion policy. Current progress remains in `v3_progress`. Historical ledger storage does not shrink automatically. No historical mastery or journey data is trimmed.

## Reviewed compatibility and safeguards

The migration accepts only project `sfogrvedypgtxfvecmbx` and the reviewed original 001 RPC/identity bodies, owner, definer state and search path. It tolerates only line-ending differences. Unexpected live definitions stop the transaction; do not weaken the guard. It is one-shot; use verification instead of rerunning it. A 5-second lock timeout avoids waiting indefinitely behind gameplay. A failure rolls the whole migration back.

Review performed through a separate preservation/security pass and executable isolated PostgreSQL tests: unchanged legacy progress, wallets, PINs and transactions; late-error rollback; wrong-project/baseline rejection; fingerprint content binding and numeric equality; old retries; an old in-flight writer crossing the migration boundary; new CAS conflicts; duplicate purchase/heartbeat/reward/redemption handling; family and role isolation; direct table denial and helper privacy. This is Codex's review, not an external independent sign-off. Owner/independent SQL review is required before live execution.

Rollback: before COMMIT, PostgreSQL automatically rolls back on failure. After installation, keep the receipt-aware backend and revert only the application to `15e934d` if necessary. The old client remains compatible. **Do not restore the original RPC or drop the receipt column/helper once compact receipts exist:** that would break retry matching. A full database restore would overwrite later writes and needs separate approval/reconciliation. No destructive rollback or reset is included.

## Exact owner execution and release order

1. Review the migration and test evidence; retain a verified consistent private backup of current Auth/family/PIN/progress/wallet/transaction data and schema. Preserve browser pending queues. Do not upload backups to GitHub or chat. No reset is needed.
2. In staging project `sfogrvedypgtxfvecmbx`, owner executes **only** `supabase/v3-staging/004_compact_save_receipts.sql` after approval. Never apply the old installer or parked V5.2 migration package.
3. Run `supabase/v3-staging/004_verify_receipts.sql` read-only. Expect correct project/security flags true and zero `unexpected_new_snapshots`. Existing legacy snapshot count is retained. The deployed old client can continue working; its newly accepted saves now generate compact receipts.
4. Verify new application capability, save/reopen/offline recovery and purchase retry against the migrated environment using the approved test accounts. Compare receipt aggregates before/after and confirm no new full snapshots. Do not clear existing queues or manufacture rewards for a real learner. Local migrated-PostgreSQL/client integration has already been tested, but this hosted check is still pending.
5. Enable the required GitHub branch rule below, require a green exact-candidate `save-and-recovery` check, review/approve the release PR, then promote. No promotion/deployment is part of this development task.

## Automated release gate

`.github/workflows/v3-offline-qa.yml` runs on every development push and pull request to `release/ipad`/`main`. It replaces the stale broad historical workflow with focused current saving, isolated migrated PostgreSQL, purchase, role, pending-save/reopen and representative full-journey checks. No skip flags or live database credentials are used. `npm run test:ipad-release` runs the same checks locally. CI uses the local Docker socket and network-disabled fictional database.

**Owner setting still required:** GitHub repository → Settings → Rules → Rulesets → New branch ruleset. Target `release/ipad`, activate it, require a pull request and the status check **`save-and-recovery`**, block force pushes/deletion, and do not grant routine bypass. Keep the existing Pages release branch/integration unchanged. The connected tools cannot administer GitHub branch rules; a workflow alone cannot stop someone directly pushing to a branch. This setting is required before the next promotion.

For scripted promotion, `scripts/check-ipad-promotion.cjs <40-character SHA>` verifies the exact candidate's successful GitHub Actions check, rejects skip flags and requires the owner's `IPAD_RECEIPT_MIGRATION_VERIFIED=1` attestation. It is read-only and does not push. `GITHUB_TOKEN` is a normal CI read token, not a request for an owner API credential. The required PR check is the primary workflow.

## Scope limits

Nine worlds, 63 skills, 27 Town plans plus original recipes, eight Camp stages, 40 shop IDs/prices, 60-minute target and 1:1 rewards are unchanged. No live SQL, data reset, account/PIN changes, hosting/visibility changes, main merge or release promotion occurred. Years 6–9 work remains paused until this saving upgrade is verified and released.
