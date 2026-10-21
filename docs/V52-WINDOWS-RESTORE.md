# One-command local backup verification

The owner reports a successful PostgreSQL 17.11 `pg_dump` archive (390,821 bytes), Auth/game-table inventory, tested AES-256 7-Zip encryption and a separate encrypted copy. These are recorded as owner-completed steps. **The actual archive and Windows machine have not been accessed by Codex.** This script performs the next local recovery check; it does not connect to Supabase.

## Run on your Windows PC

Save [Verify-JaxonBackup.ps1](../scripts/windows/Verify-JaxonBackup.ps1) from the current development branch into:

```text
C:\Users\c_mil\Jaxon-Private-Backup\Verify-JaxonBackup.ps1
```

Open an ordinary PowerShell window (Windows administrator mode is not needed), then run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\c_mil\Jaxon-Private-Backup\Verify-JaxonBackup.ps1"
```

This execution-policy option applies to that one process; it does not change Windows' saved policy. Use only the reviewed repository script. When prompted, enter the **local PostgreSQL `postgres` password**, not a Supabase password. Input is hidden. There are no credentials to edit into the script. It uses the already installed PostgreSQL 17 tools in `C:\Program Files\PostgreSQL\17\bin`; only if your installation folder differs, append `-PgBin "YOUR_POSTGRES_17_BIN_FOLDER"`.

Leave the archive at its existing path:

```text
C:\Users\c_mil\Jaxon-Private-Backup\jaxon-production-verified.dump
```

The local server must be running on port **5433**, with the already-created **empty `jaxon_restore_test`** database. The script will refuse an existing restore or any unexpected objects/default grants. It never drops, truncates or resets a database. Do not give it another database or a production connection: those are deliberately not configurable.

## Read the result

Expected successful output:

```text
PARTIAL: application recovery checks PASS
Target: localhost:5433/jaxon_restore_test only. Original archive unchanged: True
```

A private `jaxon-restore-report-<random>.json` summary is saved alongside the backup. It contains counts, backup digest, checks and exclusions, with no records, passwords, PIN hashes or native error logs. Keep that report private with the encrypted backup; it is **not** a complete Supabase restoration receipt and does not automatically approve activation or set `restoreVerified:true`.

Reply with just the result line and, if it failed, the **“Stopped at”** line. No more manual database inspection is requested. Do not upload the backup, export table rows, paste a password or share native PostgreSQL error output. Exit code `0` means the supported application checks passed with **PARTIAL overall scope**; exit code `1` means failure. There is no full-Supabase PASS result.

## What happens automatically

- Fixed `localhost`, numeric loopback address `127.0.0.1`, port 5433, database `jaxon_restore_test`, user `postgres`; inherited `PG*` connection/service/password/options settings are removed from each client process. Server-side identity/version/address checks run before and after restoration. No remote fallback, connection-string parameter or database creation/deletion exists.
- Requires PostgreSQL 17 clients/server and an empty destination with no custom objects/default grants. It restricts PUBLIC connection access **only on this disposable local database** before importing. After restore it revokes PUBLIC schema/table/function access in the recovered application/Auth schemas. Global roles, other databases, production and staging are untouched. These local access restrictions intentionally differ from production permissions.
- Reads the archive inventory/definitions privately, selecting actual archived definitions for the five game tables, `auth.users`, and `auth.identities` when present. Actual archived Auth enum types, relevant sequences, constraints, indexes, RLS-enable flags, standard available extensions and selected Auth/reward helper definitions are recovered. No missing Auth table/function/role is fabricated. The helpers are not invoked to simulate authentication or rewards.
- Explicitly excludes other Auth/service schemas/data, Vault and other managed components, triggers, event triggers, RLS policies, ownership/ACLs, external connections and subscriptions. The summary records known managed extensions and whether available locally. Vault's zero-secret state is owner-reported; the script does not certify Vault contents or recovery. Missing required dependencies abort the restore, rather than creating stubs or retrying past errors.
- Restores selected objects with `pg_restore --exit-on-error --single-transaction`, preserving the original archive. A native restore failure rolls back selected DDL/data. Local connection restrictions may already have been applied. There is no `--clean`, ignored-error loop, `--disable-triggers` or constraint-disabling option.
- Independently counts selected archive COPY rows in memory, compares every restored table's count, checks archived constraints/indexes and sequence values, and checks Auth/game/family/identity references without showing identifiers. Missing essential table/data entries, malformed/INSERT-mode streams, absent expected family accounts, invalid constraints and orphan links fail.
- Verifies the archive SHA-256 before/after and removes temporary inventory lists. No plaintext SQL/data export is written to disk. Passwords are passed only to child client environments; raw client output stays in memory and is suppressed. Run on a trusted private machine without unrelated recording/debugging tools; the restored database itself contains sensitive backup data and must stay private.

## Meaning of PARTIAL and failures

An ordinary PostgreSQL restore can verify this selected application data and its relationships. It cannot certify Supabase Auth services, actual password login, JWT/AMR, API/RPC exposure, original ownership/grants/RLS policies, other Auth tables, managed extensions/functions, email delivery, external configuration, Storage object bytes or provider-level recovery. Counts compare with the **archive**, not live production; archive integrity alone does not establish the original export's full scope or snapshot consistency.

`supabase_vault` is not required for these selected game/account records, so the script excludes it explicitly rather than installing a fake extension. If a selected table actually requires an unavailable dependency, the run fails at restoration. Such a failure is a scoped recovery blocker, not a reason to create fake Auth objects or skip more constraints. Share only the safe result/stage lines so the next session can address that specific dependency.

If it stops at the empty-database check after a successful run, that is expected: a second run cannot overwrite the restored copy. If validation fails **after** restoration committed, the local recovered objects remain for private investigation; do not interpret them as a pass. No automatic cleanup/drop is performed. The owner can later separately authorise resetting this specific disposable test database if necessary.

## Testing and remaining gates

The repository test executes this script with PowerShell 7.4.6 on Linux and actual PostgreSQL 17 tools inside a network-disabled container, using fictional accounts/rows. It checks supported recovery, unchanged archive, secret-free reports, poisoned connection environment, refused nonempty/wrong database/port/nonloopback reported server address and atomic failure on a required missing dependency. A fictional test-only Vault extension supplies a genuine archive extension entry; its local files are removed to test the unavailable-extension case. It is not a Vault emulator or evidence of actual Vault recovery.

Windows PowerShell 5.1 compatibility is the intended script baseline; execution on actual Windows/owner PostgreSQL 17.11 and the genuine archive remains owner-run verification. No production SQL, migration, account change, deployment, merge or live authentication test occurred. A successful scoped report still leaves full Supabase recovery coverage, private receipt/fingerprints, reviewed installation/cutover, hosted Auth/security and physical-iPad acceptance for the release owner; it does not silently clear those gates.
