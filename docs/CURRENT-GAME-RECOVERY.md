# Current family-game recovery checkpoint

19 November 2026. This is the recovery route for the existing family game and the retained-history review, not the older V5.2 fresh-start cutover. No hosted SQL, new service provisioning, dependency installation or release is authorised by this document.

## Owner checkpoint — application recovery passed

On 19 November 2026 the owner reported **PARTIAL: application recovery checks PASS** using the corrected verifier, with the original archive unchanged. This was read-only verification of the already-restored current-game copy. Accept that current application-data check as completed; do not request another export, Docker/WSL installation or repeat restore merely to finish this checkpoint. Keep the earlier reports/databases and both encrypted archive copies.

The final private report remains on the owner's workstation and has not been opened by Codex. Keep it with the protected recovery records; encrypt it before any off-device/cloud copy. This is owner-reported current application recovery, separate from the synthetic CI evidence below. Full managed Auth/service, policies/grants, Vault and Storage recovery are not certified by this result.

Next is the concrete installed-contract/recovery-limit review in [the retained-history release review](../supabase/history/RELEASE-REVIEW.md). Neither this PASS nor the review document executes or authorises hosted SQL. Local synthetic implementation can continue independently under the agreed roadmap.

## What changed, and what did not

The earlier owner-run application restore remains accepted evidence for its original archive and scope. Do not overwrite its archive, database or PARTIAL report. `Verify-JaxonBackup.ps1` was written for five older application tables and selected Auth records. It does not cover today's V3 wallet, receipts, PINs, reset generations or progress tables. Its older project instructions are not current-game instructions.

A fresh export is needed to protect later changes and play. The owner confirmed that the export connection's project reference matches the deployed family game's public configuration; the archive is readable and two password-protected encrypted copies passed 7-Zip tests. Codex has not opened the real dump or private reports. Those initial facts established an exported/protected archive; the later owner checkpoint above records the completed scoped application recovery.

The local Windows PostgreSQL 17.11 server on loopback port 5433 is available. It lacks `supabase_vault`. That blocks an unmodified full Supabase restore to that server; it does **not** prevent an explicitly scoped application-data restore. Docker/WSL are not prerequisites for the scoped check below. The previous attempt to set them up pursued a broader service-recovery rehearsal; that route is paused.

## Minimal current application-data check

The owner runs `scripts/windows/Verify-CurrentGameBackup.ps1` on the trusted backup workstation, with the existing PostgreSQL 17 tools. No Docker, WSL, Node or Supabase CLI is needed there.

The verifier:

- Accepts the explicit local path of the completed custom-format dump. Never upload it. Does not search for, decrypt, modify, replace or remove backup archives.
- Connects only to loopback PostgreSQL port 5433 as the local operator. Ignores inherited libpq connection/service/password options; credentials are prompted privately and supplied only to child processes. No remote database connection or connection-string parameter exists.
- Creates a new random `esa_restore_…` database from template0, checks server identity/version and an empty destination, and revokes PUBLIC connection access. Never reuses, drops or cleans the earlier restore database.
- Requires the archived current-game family/environment, PIN/unlock, progress, wallet, catalogue, transaction, reset and request tables, plus actual archived `auth.users` and `auth.identities`. Includes all other archived public tables and the existing `v52_staging_private` tables rather than assuming a fixed old count. Any future application schema outside that list needs a scope review.
- Restores original supported table/type/index/constraint/sequence definitions and data in one error-stopping transaction. Restores selected actual Auth helper definitions, never dummy Auth or Vault objects. Dependencies outside the supported scope stop the check rather than being fabricated.
- Checks every selected row count and order-independent SHA-256 of the COPY row representations against the archive, plus constraints, indexes, sequence state, family/identity links, current project identity and the progress reset-generation column. COPY formats use UTC/ISO settings locally. A source-format/timezone mismatch fails closed for private review; do not change data or weaken the check to make it pass.
- Suppresses raw PostgreSQL diagnostics and record output. Writes a private aggregate JSON report beside the dump, verifies the archive digest is unchanged, and leaves the isolated recovered database in place. The report still belongs with the private backups; encrypt it before copying off the trusted workstation.

Expected successful console result: **PARTIAL: application recovery checks PASS**. This is deliberately not labelled full Supabase recovery. Do not rerun a failure by stripping objects until it passes. Share only the final status/stopped-stage summary, never the report, data, credentials or raw errors. Testing with PowerShell on Linux and fictional data does not mean the owner's Windows archive has been executed or verified.

The script creates a local database and reads the owner's private dump. It is never run by CI against genuine data or used as a development/learner QA fixture. Keep the machine's existing PostgreSQL access/firewall controls; the script revokes PUBLIC database access but does not configure the server's listener/firewall. It does not prevent access by the local administrator.

## If validation fails after restoration

Do not repeat the export, overwrite the archive or clear the recovery database. The original short failure stage does not identify which validation failed and is not proof of corruption. Keep its private JSON report.

The verifier now accepts optional `-ValidationReportPath` pointing to that **original completed-restore report**, beside the same dump. It validates the archive digest, earlier unchanged-archive flag, completed-restore checkpoint and strict loopback/port/random-database target pattern. It inspects that existing recovery database with PostgreSQL transactions forced read-only; it skips database creation, restore and permission-changing commands. It writes a separate summary and preserves the original report and database. A subsequent diagnostic-only report is not a substitute for the original completed-restore report.

Specific validation stages identify row counts, COPY content (by ordinal, without table/record output), constraints, indexes, sequences or identity checks. Console diagnostic codes come from fixed verifier messages or fixed PowerShell error categories. Arbitrary native/SQL/record errors remain private. A mismatch still fails; the diagnostic does not waive checks or repair/rewrite any records.

Windows PowerShell 5.1 reproduced an empty-table verifier defect: its array overload binding could throw ArgumentNullException during row sorting. The helper now skips unnecessary sorting for empty/single-element arrays and explicitly encodes a string. Six synthetic helper cases pass on actual Windows PowerShell 5.1; the twelve database rehearsals still pass on Linux. These are verifier tests, not verification of the owner's recovered data.

Twelve fictional checks cover this mode, including matching-report/unchanged-archive guards, missing dependencies, empty/null/binary/multiline values, CRLF tool output, unchanged database lists/data and server rejection of an injected diagnostic write. The owner subsequently reported the scoped PASS recorded above. No managed-service recovery is certified.

## Scope relative to retained-history installation

| Change | Recovery implication |
| --- | --- |
| `001_retained_history.sql` | Creates disabled private history tables/helpers, retains prior request/identity functions under their compatibility names, and installs wrappers. Does not rewrite existing game rows, create Auth users, reset passwords, read Vault secrets or move Storage bytes. Requires installed reset/request/grant review and the verified backup checkpoint. |
| `002_enable_retained_history.sql` | Separately enables V2 capability after compatible client verification. Later saves may store history nodes and references; data-preservation/retry/old-client evidence is mandatory. |
| Reversing after V2 writes | Keep history readable and use the reviewed write-pause/compatibility route. Do not drop history, restore old function bodies or overwrite subsequent play with this earlier backup as routine rollback. Fresh backups must cover any later history rows before further live changes. |
| Household, Auth, domain and payment changes | Separate later packages with their own recovery/security coverage. Passing this data check does not authorise them. |

The narrow check addresses recoverability of the application records touched by this sequence, using the tools already installed. It does **not** silently waive the managed-service gap or complete the live cutover gate.

## Explicit remaining limits and release gates

The verifier excludes other managed Auth tables/services, Vault, other managed schemas/extensions, triggers, RLS policies, owners/grants and API/runtime authorisation. The original full dump is retained unchanged; exclusions apply only to this recovery exercise. A PASS verifies neither production permissions nor functioning login/email/PIN RPCs. Cluster roles, JWT/signing/email configuration and actual Storage object bytes are not recovered by a database dump alone.

Before hosted storage installation, record the supported operational recovery route and review any residual managed-service dependency relevant to this project. Do not assume Vault is empty, Storage unused, free-plan provider backups available or an archive listing equivalent to a restore. Any owner decision accepting a residual limitation must name its scope; a generic “continue” does not certify service recovery. No such decision is recorded by this package.

The prepared `supabase/history/000_preflight.sql` provides a read-only, project-guarded installed-contract inventory after backup acceptance and review permission: routine-definition hashes, owner/search-path/definer flags, table RLS and client grant checks. It reads no learner records and is not a substitute for recovery or permission review. It has only been rehearsed on synthetic local PostgreSQL.

Also review the actual installed request/reset definitions and grants, source/deployment hashes, save/receipt preservation and whether new play makes the protected snapshot stale. The concrete SQL installation/activation remains a separately reviewed step. No blanket approval, fresh-start migration or replacement Auth identity is implied.

Broader Supabase-service recovery remains a commercial launch gate. Review that independently before external users; do not force a full Docker/WSL setup merely to prepare local code while live operations are paused.

## Work that can proceed meanwhile

Safe local synthetic implementation and review can continue independently of this owner-run check: isolated test configuration, household/session contract prototypes and portal designs under the approved UK roadmap. They must not enable real child selection, alter existing identities/queues, provision hosted projects or deploy themselves. Domain rollout still needs the website-source handoff and reviewed routing. Keep the grouped physical iPad acceptance near the end of the assembled launch build.

## Prepared verification evidence

[The fictional rehearsal record](../tests/artifacts/current-game-recovery-verification.json) records twelve owner-script recovery cases, the read-only contract checks, the retained-history database rehearsal, passing game regressions/lint/format/status checks and 56 Chromium save/recovery cases. This is preparation evidence, separate from the owner-reported Windows application recovery above; it does not certify full managed-service recovery. The script remains a reviewable owner-run tool; no merge or deployment was performed by this preparation.
