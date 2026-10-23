# V5.2 staging preservation upgrade — prepared implementation

22 October 2026. **Code, owner-run SQL and an unpublished matching staging build are prepared; no Supabase migration or publication occurred.** Target: `sfogrvedypgtxfvecmbx` only. Read the [execution/acceptance runbook](V52-STAGING-PRESERVE-RELEASE.md), [source review](V52-STAGING-PRESERVE-REVIEW.md) and [readiness report](V52-STAGING-PRESERVE-READINESS.md).

## Completed prerequisites

Accept the owner-run compatibility results: four confirmed accounts, two independent families, four PIN rows, original staging/family structure, 40 catalogue pairs and no production activation overlap. The routine discrepancy was LF/CRLF representation of the reviewed source, with all execution attributes matching. The owner has now successfully completed the separately approved importer correction: service_role/anon/authenticated EXECUTE=false, postgres=true. Do not repeat the revoke, inventories, source exports or old diagnostics.

## Implemented architecture

The new `supabase/v52-staging-preserve/` package is an in-place staging upgrade. It does not reuse or repoint the production installer, create users/families, call an importer, reset PINs, install fresh openings or activate production APIs.

1. **Pause first.** Guard the exact staging marker and known LF/CRLF source fingerprints; require the completed importer denial and owner recovery acknowledgement. Capture existing routine definitions/grants privately, then close only the five game RPC entry points to runtime roles. Commit that pause so later installation can drain previously entered requests.
2. **Atomic additive patch.** Refuse other active/idle-in-transaction client sessions, lock the affected data and check only required delta preconditions. Add two zero wallet fields and the staging version marker; replace identity/set-PIN/unlock/request routines with reviewed V5.2-compatible staging definitions. Family role resolution remains unchanged. Preserve every original field, verified by server-side SHA-256 comparison before/after. Pin attempts, generations, cooldowns and unlock tokens are not reset.
3. **Harden without breaking authority.** PIN enrollment uses bounded real password AMR when a user deliberately enrolls/recovers, with no enrollment performed at installation. Requests validate account-bound generation/unlock and operation role, retain CAS and server wallet authority, and reject invalid new arguments. Historical exact retries return original results before tightened argument restrictions; changed-payload replay is denied. Reads do not initialise absent rows. Missing rows/invalid values stop installation instead of being repaired.
4. **Keep the accounting.** Coins, bonus, active seconds, redeemed totals, purchases and request ledger stay unchanged. `opening_seconds=0` and `legacy_redeemed=0` add no credit and move no historical values. The staging UI labels redemption as cumulative history, keeping the 60-minute goal, ten coins per active minute and 1:1 screen time.
5. **Resume explicitly.** After aggregate verification, restore only the captured intended EXECUTE grants. Private metadata/helper access and importer denial are retained. No default privileges or other permissions are broadened. Expected installed-body fingerprints, RLS and new-field protection are checked before reopening.

## Build and old browser/offline state

`scripts/build-v52-staging.cjs` builds separately into `v52-staging-dist/`; `prepare-v52-staging.cjs` creates a hash manifest with separate `sql/` and `site/` under ignored `v52-staging-package/`. Neither executes SQL or publishes. Production builders/configuration, original homepage, offline source and original staging builder remain unchanged. New artifact CSP/config/version checks require the exact staging target and omit production modules.

Keep the existing private origin, storage namespaces and Web Lock. Auth sessions, PIN capabilities, progress revisions, immutable pending IDs/payloads, later drafts, conflicts and archives are retained. An exact historical transaction with extra fields is resent intact. A rejected uncommitted legacy intent remains blocked and preserved for private reconciliation, never silently cleared or assigned a new ID. Cold offline startup waits for version verification; warm verified offline drafts remain local. Do not clear storage or leave an older writing tab active during maintenance.

## Rollback and minimum gates

Private recovery coverage must be for current staging state; the completed production backup is not substituted and no backup upload/repeated restoration is requested. The private control record captures definitions/grants and digests, not account/PIN/game rows. API exposure of its private schema must remain disabled.

Freeze is explicit and retains all data/capabilities. Rollback stays closed, restores captured code while retaining additive columns and every current save/wallet/request record, and refuses nonzero new-field use. Restoring weaker legacy validation/reopening requires an explicit incident decision and risk acknowledgement. Never restore an old dump over newer activity or automatically regrant the importer. Publishing any fallback is a separate approval.

The new focused six database and four client/build suites passed; no prior broad suite or inventory was rerun. Hosted Auth/API/JWT/AMR/refresh, physical-device acceptance and actual target guards remain pending owner execution. See the runbook for the exact short acceptance plan using the existing four accounts and known PINs.

**Next approval:** review source/file hashes and current private staging recovery coverage, then approve only the concrete staging pause/install/verify/resume package. Publication and hosted mutating tests remain separate. No Supabase change is authorised by preparing this implementation.
