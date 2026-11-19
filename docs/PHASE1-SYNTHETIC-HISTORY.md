# Retained-history installation rehearsal — synthetic project only

19 November 2026. Prepared for the owner-authorised new test service. **Not a live installation or activation.** The test baseline, two fictional families, four private-credential accounts, parent/learner browser journeys and exact Site URL/redirect are owner-confirmed configured. Full API/isolation/recovery acceptance remains open. Codex's current runtime still has the old network policy despite the owner publishing an updated reusable environment; do not repeat that settings loop or discard this chat.

## Purpose and exact scope

The remaining Phase 1 live-history operation needs a concrete installed-contract and preservation review. First rehearse the additive installation against the new synthetic service using the same unchanged reviewed `supabase/history/001_retained_history.sql`, SHA-256 `3cdad342ebfecff2c28c32299573cbaa679c06d86b099e1a54a988a2f916f185`. The existing family project remains untouched. History activation is a separate step, even on test.

The offline generator `scripts/prepare-synthetic-history.cjs` verifies that source hash, then assembles a single transaction bound to `vyxvemtevkxlwqzelghj`. It requires postgres, the installed synthetic identity/capability and exactly the four reserved fictional accounts. No database connection or privileged credentials are used by the generator. It creates no users or family links and changes no PINs or progress.

Inside the generated SQL, the original ten application tables are locked and fingerprinted before installation; every original row, including unknown fields, wallet values, PIN records, request contents and catalog/identity data, is compared again before commit. Fingerprints stay inside a temporary transaction-local table; no account IDs, records, PIN hashes or function bodies are returned. A mismatch raises an error and rolls back the installation. The script also checks that both history switches are off, no history nodes/roots exist and the synthetic identity survives. Original SQL files are never edited.

The exact generated review SQL and hash manifest are committed under `supabase/synthetic/history/`. Reproduce them with:

```sh
node scripts/prepare-synthetic-history.cjs --out /a/new/review-directory
```

Generation refuses an existing output directory. The operator's committed file contains all settings; no manually prepended lines or separate session query is needed. The temporary snapshot is not a general backup or an application-data restore, and it does not certify provider Auth/Storage recovery. The owner’s existing scoped application-data backup checkpoint remains complete.

## Owner-run check

In the NEW test project only, run the complete `INSTALL-TEST-HISTORY.sql` in one new postgres SQL-editor query. Retain the script's own RLS statements; do not ask the editor to inject replacements. No live/demo approval is needed for this authorised test work. If the script reports a mismatch, existing installation or lock error, stop and inspect it; never delete records or bypass a guard to force it through.

The final aggregate result `test_history_install` must identify the test project and show:

- `syntheticOnly: true`
- `historyInstalled: true`
- `historyEnabled: false`
- `historyWritesEnabled: false`
- `originalRowsPreservedDuringInstall: true`
- `progressStorageVersion: 1`

Only this summary is needed in chat/Notion. A later activation package must bind the actual deployed compatible test client SHA and verify V1 acknowledgements, V2 transport, reset/isolation and preservation. Rehearsing here does not authorise live installation or activation. Do not restore an old backup over later play, drop history after V2 writes, or combine household/environment renaming with this operation.

## Validation

The complete generated SQL/manifest match the generator byte for byte. The existing fictional container suite now includes ten groups: wrong-target refusal; source drift refusal; atomic late failure; simulated application-row corruption triggering rollback; real nonempty fictional progress and wallet preservation; synthetic identity retention; disabled capability behaviour; and rerun refusal, alongside the original baseline/link/PIN/retry/reset groups. Containers have no network and use no genuine records or provider accounts. Source lint/format/status pass. Existing full regression and 56-case browser results remain earlier dated evidence, not new hosted acceptance.

## Separate test activation

The owner returned the expected disabled-install summary, including `originalRowsPreservedDuringInstall: true`. That is owner-run hosted evidence; Codex has not independently connected to the test API.

Cloudflare read-back verified the running test client is `cbee972f7e176471611e1749c8f48cac2aec0d44`, deployment `fbd18a8f-644f-4938-a7da-15c5772f3ebf`. Automatic builds for **only** `everyday-skills-synthetic` were paused before preparing the activation package. The existing site continues serving that version; preview builds remain disabled. This prevents committing the operator script from changing the client SHA it records. Do not enable test automatic builds until the activation checkpoint is resolved. Existing live/demo and marketing hosting are untouched.

`scripts/prepare-synthetic-history-activation.cjs` verifies unchanged activation source `002_enable_retained_history.sql` and the exact previously reviewed preservation envelope. Its committed `supabase/synthetic/history-activation/ACTIVATE-TEST-HISTORY.sql` is one complete query, bound to the exact test project and the verified running client above. It requires a fresh disabled history installation, compares all ten original application tables again, enables history and writes, records that exact client SHA and checks capability version 2 before commit. Errors roll back the settings and any injected row change. No accounts, PINs, wallet amounts or existing progress are changed by activation itself. New client saves may subsequently write retained history.

The expected aggregate `test_history_activation` result reports the test reference, `historyEnabled: true`, `historyWritesEnabled: true`, `progressStorageVersion: 2`, `originalRowsPreservedDuringActivation: true` and the client release above. Owner execution remains pending until that result is returned. After verification, restore test automatic builds for later test development; explicitly review compatibility before deploying changed runtime code. Main-game installation/activation still needs its separate approval.

The focused local suite now has eleven groups. Additional cases reject an unreviewed client SHA/source, wrong project and repeated activation; prove rollback after a late error and injected application-row corruption; preserve old save/reward acknowledgements; save/read/retry a V2 history node; and refuse a new stale V1 overwrite after V2 data exists. These remain fictional, network-disabled tests, not provider/API or physical Safari certification. Once V2 writes exist, keep compatible history readers; the reviewed emergency action pauses new V2 writes rather than dropping nodes or restoring old functions.

## Owner-confirmed activation checkpoint

The owner returned the expected test activation result: reference vyxvemtevkxlwqzelghj, syntheticOnly true, enabled/writes true, capability2, client cbee972f7e176471611e1749c8f48cac2aec0d44 and originalRowsPreservedDuringActivation true. Test auto-builds were restored afterward by API; previews remain disabled. The earlier hold/pending statements above describe the preparation stage and are now resolved. No live operation was included. Next is the separate read-only Main installed-contract inventory; see MAIN-HISTORY-CONTRACT-REVIEW.md. Full independent deployed API/isolation and deliverable-email recovery remain open.
