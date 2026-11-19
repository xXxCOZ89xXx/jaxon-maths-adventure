# Retained-history storage — review package

Not installed or enabled on the hosted database. All execution evidence here is from a disposable, network-disabled PostgreSQL instance with fictional families. The family environment rename is separate work; this package keeps its existing identity and all Auth/PIN/wallet contracts.

## Contracts

`001_retained_history.sql` is additive and leaves the new capability disabled. Private immutable tree nodes and committed root records belong to the server-derived learner and game epoch. Current saves contain verified roots, with active/paused task snapshots inline. Current progress keeps the existing 2,000,000-byte server limit; ordinary multi-year-history fixtures produce a much smaller current projection. The client rejects an over-budget active document and preserves it rather than trimming it.

`read_v2`, `history_get`, `history_has`, `history_put` and `save_v2` use the existing authenticated/PIN-unlocked request entry point. Reads are bounded pages; missing or hash-invalid pages stop restoration. Node hashes bind the exact UTF-8 node body, while the current document and its roots are bound to the existing idempotent save receipt. Uploading an unlinked node cannot change progress or earn rewards. A revision conflict commits no current progress; unlinked nodes remain private retained material, never visible learning evidence.

Existing receipts and financial intents are unchanged. A delayed V1 exact retry still returns its original acknowledgement. An uncommitted old writer cannot overwrite a V2 projection. The compatible client preserves the original request and asks for an explicit full-version conflict choice; its original bytes are retained in IndexedDB before the old cache is replaced by a marker that old code cannot silently interpret as fresh progress.

The local IndexedDB backend atomically stores immutable nodes and document references. Queue/latest/cache keys and Auth/PIN keys retain their existing names and scope. Full history is hydrated in memory before the existing learning/evidence code runs; it is not silently treated as empty or reconstructed from today's generators. Old conflict alternatives remain outside the hot cache through immutable roots. Storage/quota errors preserve the last durable document and the unsent request.

## Review and execution order

1. The owner takes a consistent **encrypted backup**, including schema, Auth/family/PIN mappings, wallet, receipt/reset tables and progress, and verifies how to restore it. Preserve/export any unresolved device queues as well. No hosted inspection or backup is claimed by this task.
2. Compare the installed secure request/reset definitions and grants with the reviewed baseline. Confirm the actual project reference independently. In the intended SQL session, set `app.history_expected_project_ref` to that reference and `app.history_storage_reviewed` to `yes`, then execute **001**. It must leave all pre-existing rows unchanged and `progressStorageVersion` at 1.
3. Deploy the compatible application through normal passing PR checks and the existing Git-connected hosting. It continues using V1 while the capability is disabled.
4. Review old-client/retry, cross-family/PIN, two-device, write-error, reset and recovery evidence. In the intended project session set `app.history_cutover_reviewed` to `yes`, the same expected project reference, and `app.history_client_release` to the **exact verified deployed merge SHA**. Execute **002** only after the backup and client review are complete.
5. The compatible client verifies capability 2, hydrates retained history and uses V2 only for newly created requests. Pending V1 bytes are not rewritten into a V2 request. Committed root records are inserted in the same transaction as progress and its receipt; older root records remain available through the bounded `history_roots` endpoint, including after an explicit full-version conflict choice. Upload/backfill is resumable because node content IDs are deterministic; the old complete copy remains available until its verified replacement is durable.

After cutover, pause new V2 writes with `UPDATE public.v3_history_settings SET write_enabled=false WHERE singleton` only as a separately reviewed operational action. Keep `enabled=true` so existing history remains readable. Do not restore old function bodies, drop history, clear device stores, truncate receipts or restore an old backup over subsequent play as a routine rollback.

## Verification and limits

Run `node tests/history-storage.cjs`, `node tests/history-storage-db.cjs`, and the history-storage Playwright cases. The database test covers rollback, >2MB exact retained history, immutable retries, V1 refusal/acknowledgements, roles, cross-family reads, write pause and epoch fencing. Browser cases cover lost acknowledgements, reload and explicit V1 conflict recovery with original bytes retained. The standard save/recovery gate remains required.

A learner may still exceed the active-document budget by pausing an unsupported number or size of tasks; the app must explain the limit and preserve the complete original data. Large histories require sufficient device IndexedDB capacity and memory for complete hydration; exhaustion stops safely and requires recovery, rather than claiming unlimited local capacity. No automatic deletion/retention job or server-node garbage collection is included. Full multi-learner account selection remains design-only.
