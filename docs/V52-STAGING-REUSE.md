# V5.2 staging reuse — compatibility results reviewed

Status: 21 October 2026. Staging `sfogrvedypgtxfvecmbx` only. **Design/diagnostic preparation; no Supabase changes, upgrade execution, activation, merge or deployment.** Preserve all four existing fictional accounts, both families, PINs, progress, wallets, purchases and request history.

## Results accepted from the owner

The owner ran [V52-STAGING-COMPATIBILITY.sql](V52-STAGING-COMPATIBILITY.sql) in the correct project: **8 PASS / 5 REVIEW / 1 expected FAIL**. Four confirmed Auth accounts, two independent families, four PIN rows, staging table/family structure, all 40 catalogue entries and absence of V5.2 activation overlap pass. Do not repeat this inventory.

The six expected routines exist, but their combined source/attribute fingerprints differ. SQL migration history is unavailable and Auth history has 82 rows; these facts alone neither identify the installed application version nor require a migration-history repair. Auth/API service configuration remains REVIEW. The unmodified production installer is still an expected FAIL.

## Minimum next owner action

1. Verify project ref `sfogrvedypgtxfvecmbx` in the Supabase dashboard.
2. Open a **new SQL Editor query as postgres**, paste the entire [V52-STAGING-ROUTINE-DIAGNOSTIC.sql](V52-STAGING-ROUTINE-DIAGNOSTIC.sql), and run once.
3. Share only its **six-row result grid**. No schema dump, function definitions, passwords, PINs, tokens or account data are requested. If it errors, stop; run only `ROLLBACK;` if the editor reports an open/aborted transaction, and share the error code/line without personal data.

This diagnostic reads only routine/role catalogs in a read-only transaction. It compares quoted committed source **as data**, never executes it, reads no application/Auth records and returns no raw definitions or secret setting values. It separates raw/token-equivalent body matches, empty search-path representations, execution attributes and narrow execute grants.

`FORMATTING_ONLY` is a conservative lexical match that retains literal/identifier contents and token boundaries. Unsupported lexical forms remain REVIEW unless raw source matches. A PASS means equivalence to the **legacy staging baseline**, not V5.2 security approval. Changed tokens or unresolved metadata need targeted review; prohibited access or execution-context changes fail. Never modify a routine or grant simply to force PASS.

## Upgrade decision and approval boundaries

A preservation-only V5.2 staging upgrade remains feasible in principle. The concrete design, targeted preconditions, private staging recovery safeguards, atomic installation/rollback and shortest hosted-test path are in [V52-STAGING-UPGRADE-PLAN.md](V52-STAGING-UPGRADE-PLAN.md).

The plan retains existing Auth/family/PIN state and every original progress/wallet/request column, adds zero-valued wallet compatibility fields and a staging version marker, applies reviewed RPC hardening in place and preserves browser queues and old committed retries. It does not initialise/reset data or use production activation/readiness/identity. Neither the fresh-start nor existing preserve-reviewed production activation preserves current staging gameplay.

Before any future execution: resolve only routine drift, prepare and rehearse the exact patch/rollback with fictional data, protect current staging state privately, and obtain explicit approval of the concrete staging-only package. An installer must not delete history or restore an old dump over newer activity. Private hosting and normal hosted operations require their own approved scope. No Auth/credential/PIN change, new account, production installation, activation, merge or deploy is included.

Cloud Supabase probes remain stopped. No completed security inventory or browser suite was repeated. The new diagnostic has static scope/delimiter and local lexical-model checks; Codex has not executed it in PostgreSQL or Supabase. The next step is the six-row grid above, not another full inventory or backup upload.
