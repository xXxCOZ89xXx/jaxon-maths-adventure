# Main history activation — prepared, not executed

The disabled installation completed on 20 November 2026. The owner approved that
installation only. Activation still requires its own explicit approval after
reviewing this package. Do not infer it from “continue” or test-project permission.
No genuine backup or learner record is used for development.

## Package and deployment evidence

Generate offline into a new directory:

```sh
node scripts/prepare-main-history-activation.cjs --out /a/new/review-directory
```

The package binds Main `sfogrvedypgtxfvecmbx`, the exact successful installation
envelope and the unchanged `002_enable_retained_history.sql`. It refuses changed
source hashes, another client SHA, absent/enabled/paused/nonempty history, altered
routine contracts or permissions, insufficient operator access and changed Main
activity. It includes a read-only precheck and a manifest with file hashes.

On 20 November Cloudflare API read-back independently verified canonical success
for compatible client `f7be74159137bc3bad289b53df615f9afdf9ad68` on both existing hosts:
private deployment `d0c03eab-afa4-4d3f-82fb-c29a56f20667`, demo
`0483e0f8-eea3-40f3-af8f-63e161f39b9f`. Recheck before proposing execution if either
host changes. A SHA string in SQL is not deployment proof. The demo uses its own
isolated runtime; this Main activation does not change its backend.

## Preservation and change

One bounded transaction takes the same maintenance advisory lock and SHARE table
locks as installation. Under those locks it rechecks source, permissions and
activity and fingerprints every protected table, including Auth users/identities,
private application tables and history stores. Every original ACL/owner/RLS flag
is compared. Only the three known settings keys are masked in row fingerprints:
`enabled`, `write_enabled`, `client_release`. Their exact before/after states are
separately required; unknown settings fields remain protected. Any mismatch or
error rolls back the activation. A conflicting writer times out; do not increase
the timeout to force a busy live system through.

Success changes the singleton settings row from `false/false/null` to
`true/true/f7be741…`. Capability becomes 2. Existing rows are not bulk migrated.
The compatible client can subsequently save full retained history through V2.
Old acknowledged requests still return their original receipts. New stale V1
writes after a V2 save are rejected rather than overwriting newer history.

## Execution and recovery boundary

1. Review the package, exact-head CI evidence and current read-only precheck.
2. Obtain specific owner approval. Only then prefix the exact package in the same
   execution with `SET app.main_history_activation_approved='yes';`. Do not reuse
   installation approval. Finish saving and close devices before execution.
3. Accept only complete transaction success, then independently verify exact
   contracts/grants, enabled and write-enabled, version 2 and the exact client.
   Do not rerun a failed or already-completed package without inspection.
4. Once V2 play is saved, preserve history/readers/backend. Emergency recovery is
   a separately reviewed pause of new history writes, retaining readable history
   and original receipts. Do not drop history or restore the old dump over later
   gameplay. A subsequent migration needs protection including newly saved V2
   history. Full managed Auth/Vault/Storage recovery remains a launch gate.

## Evidence and remaining scope

`test:main-history-activation` covers client/source drift, independent approval,
wrong project, read-only refusal, permission/routine drift, newer activity,
original data/unknown settings/ACL corruption, late rollback and rerun refusal.
`test:main-history-preservation` now uses this exact activation envelope for the
old-retry, >2 MB history roundtrip, stale V1 rejection, sibling isolation and
readable-history/write-pause scenarios. Native PostgreSQL tests exercise its
approval refusal, atomic corruption rollback, successful activation and old retry.
The shared preservation locking mechanism also has a native concurrent-writer
timeout test. These are fictional rehearsals, not independent hosted Auth/API or
physical Safari certification. Hosted synthetic API/recovery and one final grouped
physical iPad acceptance remain open. No manual iPad testing is requested now.
