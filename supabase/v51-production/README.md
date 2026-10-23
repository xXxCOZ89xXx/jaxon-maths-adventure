# V5.2 production integration package

**Draft SQL and complete application build are implemented and locally rehearsed. No production execution, deployment or merge occurred.** Read [the release package](../../docs/V52-PRODUCTION-RELEASE.md) for metadata conclusions, installation/cutover/rollback instructions, test boundaries and owner release gates.

- `001_secure_backend.sql`: guarded inactive backend, protected PIN/unlock, CAS, wallet/ledger and identity/role/request APIs. No Auth or family recreation.
- `002_catalog.sql`: existing 40-item catalogue in the reviewed inactive production environment.
- `003_activation.sql`: shared audited activation core, preserved reviewed-opening API, legacy writer guard, freeze and rollback.
- `004_fresh_start.sql`: separately approved fresh-start API, zero opening, private archive/backup receipts and release epoch. Definitions remain inactive; no reset occurs at installation.

The current owner decision is a fresh gameplay opening with existing accounts/family rows preserved. Read the [private backup/restore guide](../../docs/V52-BACKUP-RESTORE.md) before future installation. Keep the original preservation mode separate; do not falsify its balances. Files are for a new installation, not a rerunnable upgrade over an older package.

Production SQL is separate from staging. Do not blindly run it. Verify the project and private backup/restore, review schema drift, PIN transition and a private trusted opening manifest. No app, CLI or CI runner applies SQL.

Current final sequence: [V52-CUTOVER-RUNBOOK.md](../../docs/V52-CUTOVER-RUNBOOK.md). The owner completed encrypted backup/integrity and PARTIAL application recovery; do not repeat it. `npm run prepare:production-release` builds an ignored, hashed package: one atomic inactive installer for all four files, read-only checks and isolated `site/`. Only `site/` is publishable. No SQL is executed. Use the complete generated installer once; do not then run the originals again. Fresh receipts now explicitly declare recovery scope and managed-service safeguards; freeze keeps legacy writes blocked until reviewed rollback.

Focused final-preparation commands: `npm run test:release-readiness`, `npm run test:production-build`. Historical broader commands below remain available; they are not a request to rerun completed recovery/gameplay.

Local commands using fictional records:

```text
npm run test:production-preparation
npm run test:production-build
npm run test:production-security
npm run test:fresh-start
npm run test:production-browser
```

`npm run build:production` requires explicit `V51_PRODUCTION_PROJECT_REF`, `V51_PRODUCTION_AUTHORIZED_REF`, `V51_PRODUCTION_URL`, `V51_PRODUCTION_ANON_KEY`. Only the matching public browser key is allowed. Output `production-dist/` is ignored and must be empty. Building does not connect, apply SQL or deploy. `production-test-dist/` is a separate ignored test artifact with a fictional key and intercepted network. Publish neither tests/SQL/CSVs nor private backups.

The owner already supplied all 705 rows from [the metadata script](../../docs/V51-PRODUCTION-METADATA.sql). Do not repeat that investigation. [Targeted preflight](../../docs/V52-PRODUCTION-PREFLIGHT.sql) covers the intentionally omitted platform/reference checks. If a CSV export is needed, run that read-only script manually in SQL Editor, export the single result grid completely and store it outside Git; no credentials or personal rows are requested.
