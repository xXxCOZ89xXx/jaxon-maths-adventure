# Main-game history contract — read-only inventory

19 November 2026. The owner-confirmed test installation/activation preserved the original rows and now advertises history version 2. Test automatic builds have been restored. These rehearsals do not establish what is installed on the existing family game.

The next operation is **read-only**, in **Jaxon's Maths Adventure - Main**, reference `sfogrvedypgtxfvecmbx`. It is separate from any live update and requires no repeated backup/restore merely to inspect catalogue metadata. Current application-data recovery is already owner-confirmed complete. Actual live installation/activation still needs the separately reviewed snapshot/recovery-limit/preservation package and owner approval.

`supabase/history/main-review/READ-ONLY-MAIN-CONTRACT.sql` is a single complete query. It binds the existing reviewed `000_preflight.sql` to the Main reference using `SET LOCAL` inside `BEGIN READ ONLY`; a wrong project/operator is refused. It returns only project identity, required-table/RLS/grant flags, secure routine metadata/definition hashes and whether history is already installed. No progress, wallets, PIN hashes, Auth users, account IDs, SQL routine bodies or private backup reports are returned. No installation, activation, grants, account or application-data updates are included. The database transaction itself rejects writes.

Generate from this checkout with:

```sh
node scripts/prepare-main-history-review.cjs --out /a/new/review-directory
```

The original preflight source is unchanged and SHA-256-bound; the exact complete query and manifest are committed for operator review without another local software installation. Do not combine it with an installation/activation file. Source changes require a new review.

Run only that complete read-only file in a new Main-project SQL-editor query as postgres and share its aggregate JSON. Metadata booleans/digests are an inventory, not automatic proof of equivalence or full hosted/API security. Do not paste learner records or full private reports to investigate a discrepancy. Review any unexpected result before proposing a concrete live change.

The fictional network-disabled history database suite verifies the generated file/manifest, wrong-target and source-drift refusal, leaked-grant detection, unchanged fixture progress and rejection of an injected UPDATE in the read-only transaction. Existing full history rehearsals also pass for disabled installation, rollback, >2MB history restoration, immutable requests, V1 bridging/refusal, family/role isolation, write pause and reset fencing. None of these tests query the real Main service.
