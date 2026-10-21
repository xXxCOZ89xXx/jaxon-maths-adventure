# V5.2 staging reuse: owner-run compatibility check

Status: prepared 21 October 2026; **not run against Supabase**. Scope is staging `sfogrvedypgtxfvecmbx` only. Preserve the four existing fictional Auth accounts, both families, all existing PINs and progress. No account creation, credential change, migration, activation, merge or deployment is authorised.

## Minimum owner action

1. Open Supabase **SQL Editor** in staging and verify the dashboard project ref is exactly `sfogrvedypgtxfvecmbx`.
2. Open [V52-STAGING-COMPATIBILITY.sql](V52-STAGING-COMPATIBILITY.sql), copy the entire file into a **new query**, select the database role **postgres**, and run once.
3. Share only its 14-row **Check / Result / Details** grid. No other exports, account details, passwords or PINs are needed. If it errors, stop; run only `ROLLBACK;` if the editor reports an open/aborted transaction, and share the error code and line without personal data. Do not edit around a failed check or run any installer.

The file opens a read-only, repeatable-read transaction with short local timeouts and ends with ROLLBACK. It executes only catalog reads and fixed SELECT aggregates through PostgreSQL's built-in `query_to_xml`; it creates no helper functions or temporary tables. Missing tables/columns skip dependent aggregate reads. Use a fresh editor query so transaction controls cannot affect unrelated pending work.

## What the Results table means

- **PASS**: that particular observed metadata/aggregate condition matches the documented staging baseline. It is not permission to upgrade.
- **REVIEW**: unavailable metadata, an untracked/manual migration, source drift (including whitespace), or a decision requiring a tailored plan.
- **FAIL**: a prerequisite does not match, or the proposed as-is installer is incompatible. Stop and review; never delete/recreate records to force a PASS.

Checks cover the eight staging tables and required column types, six routine signatures/source fingerprints (without calling them), migration-history availability/counts, the staging marker, four confirmed Auth accounts, two independent Auth-linked families, staging family PK/FKs, PIN row/link coverage, and the exact 40-item catalogue. Counts are the only account/PIN data returned. Progress, wallet and transaction contents, PIN hashes, emails and account IDs are not read or returned. Source fingerprints are migration footprints, not a new security audit or proof that every installed database property is identical.

**Auth configuration limitation:** Auth schema/migration metadata is observable in SQL. Signup policy, SMTP/recovery delivery, Site URL/redirect allowlist, actual password AMR/JWT and current API schema exposure are service configuration/runtime properties; this query deliberately reports REVIEW rather than guessing from database session settings. It neither signs in nor sends recovery mail. A later approved step can review those specific dashboard settings without returning credentials or changing them. No additional owner settings checklist is requested now.

## Compatibility conclusion from committed source

Reviewed source: branch `codex/v3-adventure-build`, commit `f0b2d50c7d8b78a939fa5d66c7c686ba118ff020`; staging migrations `supabase/v3-staging/001_secure_core.sql` through `003_import_compatibility.sql`, V5.2 production backend/activation/fresh-start definitions, `v3/backend-config.js` and the production build.

| Finding | Result | Meaning |
| --- | --- | --- |
| Latest release-readiness handover pushed to correct branch | PASS | Present at the reviewed commit. This continuation adds the previously missing staging-reuse instructions. |
| Live staging compatibility | REVIEW | Pending the owner-run Results grid; previous owner setup reports are historical evidence. |
| Run the unmodified V5.2 production installer on existing staging | FAIL | It is a new installation with production-ref guards, five legacy-table expectations and colliding existing `v3_*` names; fresh-start paths also expect production family `id`/timestamps. Do not repoint guards or drop/recreate staging. |
| Preserve accounts, families, server PINs and existing gameplay | REVIEW | Feasible in principle with a separately reviewed, staging-specific upgrade; none is supplied or approved here. |

The staging family table uses the learner UUID as its primary key and a required parent UUID. Normal role resolution does not require production-style family IDs, so families do not need replacement. Existing staging already has server PINs; their hashes, generations and associated state must remain intact, with no silent enrollment/reset. Shared RPC names and progress/wallet contracts offer reuse, but V5.2 adds bounded password-AMR checks, request/revision validation, wallet opening fields and activation/readiness semantics that need a tailored upgrade.

**Neither existing activation path is a preservation-only staging upgrade.** Fresh-start intentionally resets opening gameplay; even `preserve-reviewed` inserts empty progress and derives openings from legacy production rewards rather than retaining the existing staging progress/wallet/ledger. Do not invoke either. Do not call `v3_request(...,'read',...)` as an inspection shortcut: the old staging implementation can insert initial wallet/progress rows during a read.

The production build is pinned to production identity/contract and uses different cache/activation namespaces. It must not be pointed at staging or made to accept a spoofed production marker. A future staging-specific path must retain proper project isolation and explicitly handle existing drafts, revisions and retry intents.

## Separate approval before any upgrade

After reviewing this grid, any implementation/execution proposal must specify an in-place staging-only migration; protection and rollback of current staging state; unchanged Auth/family/PIN state; preservation of complete progress/revisions, authoritative balances/time/ownership and immutable transaction/retry history; and a compatible staging-only build/cache plan. No importer, new accounts/families, fresh openings or reset is necessary for this read-only check.

SQL execution, any settings/permission or credential change, unlock/session invalidation, activation and publication each require their own explicit scope. Production installation/activation and merge/deploy remain separate and prohibited. Existing production backup/recovery evidence is not a backup of staging; no backup upload or repeated restoration/security/browser suite is requested here.

## Connectivity and documentation record

Cloud Supabase probing is stopped by owner instruction. The preceding HTTPS request failed before CONNECT with `curl: (7) Failed to connect to proxy port 8080 after 0 ms: Could not connect to server`, HTTP/CONNECT codes 000. That does not establish resolution of the earlier CONNECT 403. No new probe was attempted in this continuation.

GitHub was inspected through the connected GitHub API. At the reviewed head, `docs/CODEX-HANDOVER.md` was committed/pushed; `docs/V52-STAGING-REUSE.md` did not exist. This continuation commits only documentation: this guide, the owner-run read-only SQL and the handover update. No Supabase SQL was executed; no browser/security suites were repeated. The SQL received static scope/source review, not hosted execution or a PostgreSQL runtime pass.
