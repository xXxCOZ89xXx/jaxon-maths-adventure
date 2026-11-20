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

## Owner-reported inventory and activity follow-up

The owner returned the Main inventory: all ten required tables present with RLS and no browser-role table grants, all six secure-definer routines present, authenticated request allowed, anonymous request denied, private reset delegate, and history absent. Full definition hashes differed from the LF-only local baseline. A pristine source-only PostgreSQL comparison reproduced **all six owner hashes exactly** by converting only each reviewed function body's LF line endings to CRLF; generated definition headers stayed unchanged. This resolves those digest differences as Windows line endings, without requesting real function bodies or importing any real records. The comparison evidence is private workspace review material, not a report committed to this repository. Table-level grant flags do not by themselves inventory column-level grants; the eventual installation review must include relevant grants and final transaction guards.

`READ-ONLY-MAIN-ACTIVITY.sql` is a separate short, project-guarded read-only query returning only the latest progress, transaction, wallet timer and reset timestamps in UTC. It provides evidence for reviewing newer gameplay writes against the protected snapshot; it is not another restore/backup check and does not itself prove full snapshot coverage. Auth/PIN changes without such timestamps, unsent device work and broader managed-service recovery limits still need their relevant review. A dump file modification time is not automatically its transaction snapshot time. Do not request a repeated restore merely to close the already completed application-data checkpoint.

The generated activity file and manifest match the offline packager. The local network-disabled history suite verifies its exact output field set, UTC timestamp format and wrong-project refusal alongside the existing read-only/write-refusal/preservation checks. On 20 November the owner supplied the aggregate Main result: progress/transactions last written 15 November, wallet activity 28 October, reset timestamp null. The matching result was observed in the existing Supabase editor; Codex did not rerun it. The owner confirmed unchanged login/PIN details since the backup and all devices finished saving. This activity checkpoint is complete. See [the guarded preservation review](MAIN-HISTORY-PRESERVATION.md) for the next exact-source/column-grant checks and disabled installation package. Live installation and activation remain separate proposed changes requiring approval after concrete review.
