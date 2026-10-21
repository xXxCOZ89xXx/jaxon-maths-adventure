# V5.2 private backup and restoration guide

**Preparation only. No production backup, restoration or SQL execution has been performed by Codex.** The next safe owner action is to arrange an encrypted, independently restorable backup and a private restoration rehearsal, before authorising any installation or activation. Do not paste the backup, identities, credentials or review manifest into chat, GitHub, CI or public logs.

## What must survive

Confirm the dashboard project reference is **`mbdelspbjusarbwlltol`**, the existing production project for Jaxon's Maths Adventure. `sfogrvedypgtxfvecmbx` is separate staging. Check the direct database host/project in the dashboard; do not infer production from a website preview.

Preserve a full logical database export where supported, including relevant `auth` records (users, encrypted password representations, identities and required related tables), all family rows and their exact UUIDs, all five existing application tables, functions/policies/grants/constraints/indexes/sequences and required extensions. The old five tables are `maths_families`, `learning_progress`, `maths_learning`, `maths_rewards`, `maths_reward_events`. Backup coverage must include their entire contents, not just the new V3 schema. Existing credentials and family relationships must survive; do not reset passwords or create replacement users as a recovery shortcut.

Keep an encrypted configuration inventory: PostgreSQL/extension versions, required roles/ownership/grants, Auth Site URL/redirects, email provider and recovery settings, signing configuration and supported recovery method, deployed static application/configuration and production commit. Use the provider's approved secret-management/export procedure for secrets; do not publish or log signing keys, API keys or database passwords. `pg_dump` does not export cluster roles or external service settings. If using a roles export, review it privately for provider compatibility and sensitive material before any isolated restore; do not overwrite managed roles blindly.

If Supabase Storage is used, inventory buckets, policies and object references and separately preserve the actual object bytes through an authorised method. Database dumps may contain storage metadata but do not back up stored object files. Check whether other external services or Edge Functions need independent source/configuration backup. Record “not used, verified” only after checking. Device-only legacy PIN/local-progress data is outside the database: preserve trusted device storage privately if required, without clearing it or converting hashes. New server PIN enrollment remains explicit after password sign-in.

## Provider backups and independent exports

Record the actual Supabase plan's backup/PITR availability, retention, restore permissions and scope from the dashboard/provider documentation. Do not assume a plan includes downloadable backups, Storage bytes, external Auth settings or all managed-service recovery. A dashboard backup entry or `pg_restore --list` alone is not proof of an independent restorable export. Keep both provider recovery options and a separately encrypted, verified export where supported. If managed objects cannot be exported/restored with the available account, document the exact gap and obtain provider-supported recovery access before activation; do not label a partial dump “full”.

## Tools, access and private workspace

The owner/operator needs authorised database backup and recovery access, compatible PostgreSQL 17 client tools (`psql`, `pg_dump`, `pg_restore`), an isolated compatible restoration target, encryption tools such as `age` or GPG, private encrypted storage, enough disk space, and a recovery key held separately. Use a trusted operator workstation. Production access is owner-controlled; no network bypass is required or authorised.

Use `pg_service.conf` and a protected `PGPASSFILE` (mode `0600`), with dashboard-provided connection details and TLS certificate verification. Examples below assume a local service named `jaxon_production`; it is not a supplied credential. Prefer the direct database/session connection: transaction pooling cannot hold the snapshot session used below. Do not place passwords in commands, shell history, environment dumps, recordings or shared logs. Keep the private workspace outside the repository, cloud build directories and public sync folders; restrict directory access (`0700`). The following commands are templates for the owner, **not commands executed here**.

## Consistent backup and matching fingerprint

1. Before installing 001–004, schedule maintenance and drain old game sessions/writers. Record the current production code commit/deployment settings and preserve the existing rollback tag. Stop automatic jobs that might alter the five legacy tables during the backup/cutover window. Do not weaken RLS or grants to make an export work.
2. In a persistent owner `psql` session (terminal A), start a consistent snapshot and block legacy table writes. This takes a `SHARE` lock on all five tables; it can wait for existing writers and will block new writes until commit. Set a suitable lock timeout for the maintenance window and abort on timeout rather than leaving an abandoned transaction.

   ```sql
   BEGIN ISOLATION LEVEL REPEATABLE READ;
   SET LOCAL lock_timeout = '10s';
   LOCK TABLE public.maths_families, public.learning_progress,
     public.maths_learning, public.maths_rewards, public.maths_reward_events
     IN SHARE MODE;
   \i /PRIVATE_PATH/V52-FRESH-START-PREFLIGHT.sql
   SELECT pg_export_snapshot();
   ```

   Use the repository's [read-only fingerprint query](V52-FRESH-START-PREFLIGHT.sql). It returns only two SHA-256 fingerprints (including security policies/routine-definition digests) and aggregate row counts, not personal rows, passwords, hashes or credentials. Save results privately with the backup. It internally reads legacy records to compute a canonical UTC fingerprint; those records are not returned. Keep terminal A connected until the dump finishes.
3. In terminal B, export the **same database and exported snapshot** using the authorised backup role. Replace the snapshot placeholder with terminal A's result, not a guessed value:

   ```sh
   pg_dump --dbname=service=jaxon_production --format=custom \
     --snapshot=REPLACE_WITH_EXPORTED_SNAPSHOT --file=/PRIVATE_PATH/database.dump
   ```

   Do not use schema/table exclusions for a claimed full backup. Inspect stderr/exit status privately; any inaccessible Auth/managed schema, skipped data or unsupported dependency is a release blocker until resolved through a supported procedure. The account must have the required read/reference/backup privileges; do not grant clients access. The database dump includes Auth credentials where permitted, so treat every byte as highly sensitive.
4. After successful export, commit terminal A to release locks. Keep the application in maintenance. Later writes make the fingerprint stale; fresh activation deliberately refuses them. Retake the backup and restoration verification if the five tables change; never overwrite the manifest fingerprints just to silence a mismatch. Fingerprints do not replace a full schema-drift review or protect arbitrary external configuration.
5. Record tool/database versions, exact backup scope, timestamp, project reference, source commit, row counts, both fingerprints, backup UUID (`archiveId`) and SHA-256 of the plaintext dump in a private manifest. Verify family and Auth identity consistency privately. Do not print records into a shared terminal log.

## Encryption, integrity and retention

Encrypt the dump, manifest, relevant configuration and later restoration receipt before moving them off the trusted workstation. For example, `age -p -o /PRIVATE_PATH/database.dump.age /PRIVATE_PATH/database.dump` prompts privately for a passphrase; never pass the passphrase as a command argument. A recipient public-key workflow is preferable when an established recovery key exists. Encrypt the manifest/receipt as well. Keep recovery keys separately with documented owner access; a backup without a recoverable key is not usable.

Record SHA-256 of the encrypted files for transport integrity, and the plaintext dump digest **inside the encrypted manifest**. In `backupReceipt.backupSha256`, use that plaintext dump digest consistently. Verify decryption and the digest before restoration, and verify the encrypted copy after transport. Keep at least two access-controlled copies with a retention policy that includes the entire rollback window and historical records. Plaintext temporary files require encrypted disks and controlled cleanup; deletion alone is not guaranteed secure erasure on SSD/snapshots. Never commit any backup or real-data restoration evidence. The SQL archive is a second protected database copy, not an independent durable backup.

## Required isolated restoration rehearsal

Restore into a disposable, private, compatible Supabase environment or provider-supported recovery target with matching roles/extensions/Auth dependencies. An ordinary PostgreSQL container is useful for fictional rehearsal, but does not reproduce hosted Auth, managed extensions or Storage. A restore with skipped managed objects must not be accepted as complete. Use no public Auth endpoint and no outbound email/webhooks/jobs; contain actual restored data and restrict access to the authorised operator. Do not point the application or real users at this target.

An operator can inspect a dump's object inventory with `pg_restore --list`. After preparing required dependencies/roles in the isolated target, use an error-stopping restore such as `pg_restore --exit-on-error --single-transaction --dbname=service=jaxon_restore /PRIVATE_PATH/database.dump`. Use a supported Supabase restore procedure if managed objects require it. Keep failures private and resolve them; do not skip constraints, silently ignore errors or invent missing schema. Do not use `--clean` against production or any non-disposable target.

Verify privately, without shared row output:

- Required schemas, owners, RLS/policies, client grants, functions, indexes, triggers and sequence values match the inventory; managed-role differences have a reviewed explanation.
- Auth UUIDs, email/password credential representations and relevant identity links are unchanged; exact parent/child/family rows and foreign-key consistency match. Do not perform destructive authentication against genuine accounts. Real hosted login acceptance later uses authorised fictional accounts.
- All five legacy table row counts and data digests match, including old rewards/progress. If a restore normalises managed privileges, distinguish this from data integrity and document it; production permission fingerprints must match the production source review.
- The restored old game/data can be recovered under the documented provider-supported procedure, and required Auth/external settings and Storage bytes have explicit coverage. Recovery must not depend on the new game's zero wallet.
- Rehearse the reviewed migration and fresh activation only on a **fictional** clone; this repository's tests demonstrate that procedure. Do not release restored genuine data to test tools/CI.

Write a private restoration receipt with archive ID, encrypted backup location/reference, plaintext digest, scope, target type/versions, restore command/procedure, exit status, verification results, limitations, operator and timestamp. Hash that receipt; its digest is `restoreReceiptSha256`. Store it encrypted with the backup. The SQL gate checks receipt fields and explicit owner acknowledgement; **it cannot prove that an external file was backed up or restored**. Set `restoreVerified:true` only after the owner/operator has completed this work successfully.

## Owner verification checklist — not yet completed

- [ ] Correct production project/connection confirmed; current deployment commit/settings recorded.
- [ ] Maintenance/drain arranged; full snapshot taken before installation and no later legacy writes.
- [ ] Full supported DB/Auth/family/legacy coverage verified; roles/extensions/external Auth settings recorded privately.
- [ ] Storage use checked; actual object bytes backed up separately when applicable.
- [ ] Export succeeded without ignored errors; counts/fingerprints and dump digest recorded privately.
- [ ] Encrypted independent copies and separately recoverable keys verified; provider recovery scope/retention recorded.
- [ ] Isolated restoration completed; identities/credentials/relationships, records and security metadata verified.
- [ ] Encrypted restoration receipt and its SHA-256 retained; recovery permissions/operator available.
- [ ] Fresh-start decision and explicit PIN enrollment approved; every existing family reviewed with exact UUIDs.
- [ ] Release/rollback window and reconciliation responsibility agreed; no stale fingerprint substituted.

Only after these boxes are backed by evidence should the owner approve a concrete migration/cutover. Share only a redacted status and blockers with the next Codex session. Keep real identifiers, receipts containing private details and all secrets outside Git/chat.
