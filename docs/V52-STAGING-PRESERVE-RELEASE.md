# V5.2 preservation staging package — review before execution

Prepared 22 October 2026 for **sfogrvedypgtxfvecmbx only**. No hosted SQL, activation or publication has occurred. The owner has completed the importer correction: service_role/anon/authenticated EXECUTE=false; postgres=true. Do not repeat it or the preceding inventories.

## Contents and isolation

- `supabase/v52-staging-preserve/000_pause.sql`: guarded, owner-only metadata capture and narrow temporary RPC pause.
- `001_upgrade.sql`: atomic additive columns and four reviewed RPC replacements; unchanged original-data assertions; stays closed.
- `002_resume.sql`: restore only captured runtime EXECUTE grants after verification.
- `003_freeze.sql` / `004_rollback.sql`: separately approved incident controls; retain data and additive columns, no dump overwrite.
- `verify.sql`: owner-only aggregate read-only verification before hosted activity.
- `scripts/build-v52-staging.cjs`: matching unpublished staging site in `v52-staging-dist/`.
- `scripts/prepare-v52-staging.cjs`: hashes SQL, site and compiler inputs into ignored `v52-staging-package/`. It never invokes a SQL client, authenticates or deploys. Only `site/` is a future hosting candidate; SQL/manifest/private metadata are not website assets.

The existing production installer/build, original homepage, V2 and original staging builder are unchanged. The new artifact omits production adapter/config modules and restricts network CSP to the exact staging host. Nine worlds/55 skills and gameplay assets remain unchanged. Fixtures and private data are not included.

## Preparation and sealing

Use the existing private `V3_STAGING_*` browser-public configuration; never supply a service/secret key. Run `npm ci --ignore-scripts`, then `npm run prepare:staging-preserve`. `V52_STAGING_SOURCE_COMMIT` may name the exact reviewed source commit; a null sourceCommit is a draft, not a sealed execution artifact. Compare manifest source/file hashes with the reviewed commit before approval. Output directories must be empty; the builder refuses to clear a previous artifact. Retain an earlier artifact under a separate protected name if rebuilding.

No key is printed by preparation. The browser-public key necessarily appears in the private site configuration, not in the SQL, source repository or approval text. No network request to Supabase is made by preparation.

## What installation preserves

All Auth records, family links, PIN hashes/generations/cooldowns, unlock capabilities, progress JSON/unknown fields/revisions/timestamps, coins/bonus/time/redemption totals, purchased IDs and immutable transaction payloads/results stay unchanged. Only wallet `opening_seconds`/`legacy_redeemed` are added as zero, and a staging version marker becomes 2. No production ready/PIN-transition/activation flags or fresh opening are used. Missing rows or invalid existing values stop installation rather than being repaired or initialised.

The private schema stores prior routine definitions/grants and aggregate data digests, never a gameplay/PIN export. Runtime roles have neither schema nor helper/table access; the table uses RLS. Do not expose `v52_staging_private` through the API. The owner must confirm the actual active exposed-schema setting in the dashboard; SQL session settings cannot certify it.

## Browser and offline compatibility

Retain the **same private staging origin** and existing auth/game/queue/intent keys. Close old writing tabs/devices for the maintenance window after their drafts are locally saved; do not clear storage, sign everyone out or discard offline drafts. The new artifact uses the same Web Lock and queue format. It requires a successful live identity/version check before opening; cold offline startup waits, preserving all bytes. An already-open verified learner can retain offline drafts as before.

The server returns an exact historical retry result before new argument restrictions, after account/unlock/operation-role checks. The client resends the old request ID and whole payload, including historical extra fields. Rejected transaction intents are retained, including server validation errors. A new uncommitted intent that fails stricter validation remains blocked for private owner reconciliation; never clear it automatically, edit its request ID or silently turn it into a new transaction. Successful confirmed operations clear their own completed intent normally. No automatic wallet re-import or progress reseed occurs.

## Owner execution sequence — NOT authorised yet

Review the concrete SQL/site hashes and a current **private staging** recovery snapshot plus the previous private artifact reference. Keep the data and rollback metadata private; no upload, production backup repetition or additional broad inventory is requested. The backup flag below is an owner acknowledgement, not proof of recovery.

After explicit approval of this staging-only pause/install/resume scope, verify the dashboard project ref and use `postgres` in a new SQL Editor query. Prefix **each** execution with:

```sql
set app.v52.staging_upgrade_authorized='yes';
set app.v52.staging_ref='sfogrvedypgtxfvecmbx';
```

For the first pause only, also acknowledge the actual private staging recovery coverage:

```sql
set app.v52.staging_backup_verified='yes';
```

1. Execute **all of `000_pause.sql` once**. It verifies the known LF/CRLF routine bodies and importer denial, captures only definitions/grants, and commits revocation of EXECUTE on five normal game entry points from runtime roles. Normal game calls will be unavailable during maintenance. Never rerun this phase over the private control schema.
2. Drain outstanding requests; execute **all of `001_upgrade.sql` once**. It refuses other active/idle-in-transaction client sessions, locks the affected data, checks only delta preconditions and compares SHA-256 digests of every original column before/after. It sets the staging version last and commits `installed_closed`. No app function is invoked.
3. Execute `verify.sql` before testing. Expect `installed_closed`, version 2, all booleans true. A false unchanged-data result is a stop, not a reason to replace the baseline. No personal records are returned.
4. Execute **all of `002_resume.sql`**. It verifies routine and data preservation again and restores only the recorded grants; expect `open`. The importer stays denied. This completes only the approved backend upgrade. It does not approve publishing the new private site.

Do not run a file in fragments, use the production installer, call import/activation, change PINs or retry past a failed guard. If an error leaves an aborted transaction, run only `ROLLBACK;`. A failed upgrade transaction rolls back its columns/functions/data metadata; the separately committed pause can remain closed. Leave it closed until a reviewed recovery decision. SQL Editor may display only the last result set; guards enforce the checks regardless.

## Rollback and interruption safeguards

The active-request check is necessary: a table lock alone does not stop an already-entered old routine from resuming after replacement. Revoking first and draining before the locked installation closes that race. Short timeouts fail closed without deleting data or sessions.

After separate incident approval, add `set app.v52.rollback_authorized='yes';` and run `003_freeze.sql`. It closes the five runtime RPC entry points and retains PINs/unlocks and every record. Before a code rollback, explicitly review the weaker original AMR/validation behaviour; acknowledge `set app.v52.legacy_resume_risks_reviewed='yes';`. Run `004_rollback.sql` only while frozen/drained. It restores the captured original definitions, leaves additive columns, preserves **all current data including post-upgrade activity**, marks version 1 and stays closed. It refuses nonzero compatibility fields rather than discarding their meaning.

`002_resume.sql` may reopen a paused/rolled-back version-1 baseline only with that explicit legacy-risk acknowledgement. This is not an automatic error handler or a recommended downgrade to weaker checks. The new version-2 site refuses cold startup against version 1. Restoring an older private artifact requires separate publication approval. Never restore a pre-upgrade dump over later saves/rewards or automatically regrant the importer. If safe rollback is uncertain, remain closed and retain both artifacts and data.

## Focused acceptance plan

Before approving execution, use the new `test:staging-preserve` and `test:staging-preserve-db` results; do not rerun completed gameplay/security matrices. Local PG claims are fictional, not hosted Auth verification.

After backend installation and separate private-site publication approval:

1. Use the same four allowlisted fictional accounts and their **known existing PINs**. Verify correct role/family views, retained progress/drafts/revisions, balances/time and purchased items. No enrollment/reset, deliberate wrong-PIN cooldown or fresh opening is required.
2. Confirm the version-2 staging identity, intended private origin/API exposure and normal real Auth/JWT/refresh behaviour. Review the exact existing Auth redirects/signup policy. Recovery-email or credential-changing tests remain separate.
3. Under explicit hosted-operation scope, make one incremental learner save, lose/retry a response, and retry an existing pending transaction without a new ID. Check a stale second-device revision conflicts without overwriting. Keep both drafts/archives; confirm replay creates no duplicate reward/purchase.
4. Review the linked parent's evidence and one separately approved small wallet operation; confirm cumulative totals and family isolation. Use no real learner records. Finish one physical iPad Safari keyboard/touch/save/resume smoke. Preserve all legitimate test activity.

Current evidence: six focused disposable-PG preservation/rollback suites and four offline client/build/queue suites. No hosted V5.2 SQL/Auth, physical iPad test, migration execution on Supabase or publication is claimed.

**Next approval required:** the concrete staging-only maintenance/pause → additive upgrade → verification → resume package, with current private staging recovery coverage. Publication and hosted mutating acceptance remain separate approvals.
