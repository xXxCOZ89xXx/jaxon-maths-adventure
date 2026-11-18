# Save growth: proposed storage split and migration plan

18 November 2026. Claude findings H3/M4. Design for review, based on released `e5ea809`; no schema, data, storage-key or application behaviour changes are included. Phase 2 is approved for development. Hosted SQL, project creation and release still require their own concrete review.

## Problem and evidence

The 15 November review measured 107 KB for the current save, roughly 2.35 KB more per lesson and 11.4 KB per Town plan. These are historical review measurements, not new access to a learner record. The request contract limits progress to 2,000,000 bytes. An unlimited number of retained runs will eventually reach it; compact request receipts do not bound current progress.

Source inspection at the released version shows:

- `engine.js` appends practice/independent responses under each skill and wording under `seen`, `practiceSeen` and `reviewSeen`.
- `starting-profile.js` retains prior estimates and response snapshots when an area is retaken.
- `town-life.js` retains complete runs, steps, inventory, receipts, decisions and evidence under `adventure.townLifeV2.runs`.
- `cloud-sync.js` sends the whole progress document with each save. Resolving a conflict appends both full copies to local `archives`; pending, latest and unresolved conflict may each hold another copy.
- `004_compact_save_receipts.sql` already avoids storing new complete progress snapshots in request receipts. Existing legacy receipts and exact retry matching are deliberately preserved.

Do not remove historical evidence, trim arrays or weaken the size limit to hide the problem.

## Proposed contract

Keep the current progress endpoint and complete document usable throughout migration. Add a versioned capability rather than changing the meaning of an existing request. Proposed `progressStorageVersion: 2` is independent of `saveReceiptVersion` and `gameResetVersion`. No capability is advertised until both old and new paths are verified together.

| Storage | Contents | Identity and retention |
| --- | --- | --- |
| Current progress | Profile, settings, skill/check summary, reward-display projection, milestones, active/paused tasks and complete snapshots needed to finish them | Existing learner and game generation; revision CAS remains authoritative |
| Learning events | Completed supported practice and independent checks, every response, assistance/skip/source flags, question snapshots and policy version | Immutable event ID, learner, generation, content hash; never inferred from score alone |
| Completed runs | Complete Town/mission/repair runs, steps, receipts, decisions, first-attempt evidence and historical context | Immutable run ID within learner/generation, original source ID and hash |
| Starting estimates | Completed area samples and retake history, including legacy 4/15-question results | Sample ID and version; no conversion into independent mastery |
| Question registry | Stable IDs for new question definitions plus versioned parameters and exact rendered snapshot | An ID never changes when wording changes; immutable content version |
| Request ledger | Existing compact fingerprints, payload binding and original operation results | Existing request IDs and semantics; no time-based expiry of retries |
| Conflict recovery | One reference to the currently unresolved local/remote pair, plus retained historical alternatives outside the hot document | Content-addressed immutable copies; never overwrite an unacknowledged alternative |

Names above are proposed logical entities, not approved SQL table definitions. All physical tables must use the existing server-derived family/learner relationship and generation boundary. A client-supplied learner ID must never select the target. Retained records get the same role isolation as progress; no public registry may contain learner answers or identifiers.

### History remains usable

The new client fetches history with a stable cursor and an as-of revision. Parent evidence, previous starting estimates, replay selection and historical detail must still be available. Mastery decisions currently inspect earlier independent checks: retain the exact requisite policy/spacing data in the current projection and prove it matches the complete history. Never treat an unloaded history page as no evidence. Old completed snapshots remain authoritative when reopened; do not regenerate them from today's content.

Active and paused tasks remain complete, inline snapshots until finished. Archive completed material only after an atomic server acknowledgement of its stored bytes and links. The current document stores immutable references and sufficient summaries; it never depends on content being reconstructed from question wording.

### Stable IDs without rewriting legacy evidence

Introduce IDs for new content in a separately reviewed implementation alongside a content registry. Existing prompt-based exclusions and evidence retain their original strings. A legacy question may receive a namespaced content hash as an additional lookup key, scoped by skill, original metadata and full snapshot; identical wording alone does not establish identity. Do not backfill an answer's meaning from the current generator. The legacy exact snapshot is retained even when a modern definition exists. IDs must be deterministic across devices, replays and retries, and never change mastery policy.

### Atomic saves and offline retries

A V2 save contains the expected revision/generation, immutable history events, current state and one request ID. In one learner-locked transaction the server validates all events, inserts missing immutable records, applies the current document and stores the compact request result. Duplicate event IDs with different content fail. A conflicting revision writes neither events nor current progress. A lost response retries the identical request and returns the original acknowledgement without duplicate records, rewards or progression.

Keep existing queue keys and V1 pending request bytes. V1 requests are drained unchanged; never convert an in-flight request to V2. New later edits wait behind it. Only newly created requests use V2 after live capability verification. Offline opening must not assume a newly installed capability. Quota/storage/write errors preserve original bytes and provide an actionable recovery message; never silently delete a cache.

### One conflict copy in the hot path

One unresolved pair can be referenced in the current queue. Prior conflict alternatives are first copied to a local immutable recovery store (for example IndexedDB), verified by hashes, then acknowledged by the queue pointer update. A crash at any step must leave at least the old complete copy or verified references. Server upload of recovery alternatives is optional and requires the same authorisation as other learner history. If the recovery store cannot be written, keep the original archive bytes and stop compaction. This reduces repeated copying without deleting the user's alternatives or permitting unsafe field-wise merges.

## Migration and compatibility sequence

1. **Review and backup:** obtain a consistent encrypted backup of schema and Auth/family/PIN/progress/wallet/ledger/history, with a restore procedure; preserve pending browser queues. Confirm exact project and the installed wrapper/receipt/reset capabilities using aggregate read-only checks. The owner runs no script before separate approval.
2. **Isolated rehearsal:** implement additive schema and new RPCs in a network-disabled local PostgreSQL database; create a separate fictional hosted project only after its provisioning is authorised. Include the currently installed reset wrapper, not just the original installer. No data from the real learner is needed.
3. **Additive installation:** create private history tables and internal helpers, indexes, constraints and grants. Keep the old RPC and identity contract working. No existing columns, snapshots or receipts are dropped or rewritten. Test old clients during this boundary.
4. **Bounded backfill:** for each learner/generation, derive deterministic IDs from the original location and canonical contents. Copy original snapshots in resumable batches, with source revision/hash checkpoints. Keep source JSON until complete counts/hashes, detail rendering and retry behaviour are verified. A changed source revision invalidates that batch's completion claim. Do not take a long lock across all learners.
5. **Compatibility bridge:** the V1 endpoint must accept old whole-document writes, including delayed/offline requests, without deleting archived events or restoring obsolete generations. It must still return the original V1 result on an exact retry. Define and test the old-client read strategy before publishing: either complete reconstruction stays under its limit, or old clients get a non-destructive update-required response. Never return an incomplete document that the old app could save over history.
6. **V2 client preview:** implement history paging and reference resolution, retain legacy snapshot readers and the unchanged queue namespace, and verify all evidence and task screens with fictional fixtures. No automatic migration of unresolved queues or conflicts.
7. **Cutover review:** publish the capability only after the bridge, client, rollback path and backup verification pass together. Promote through normal PR checks and existing Git-connected hosting. If history hydration exceeds the old response budget, stop and resolve the compatibility design; do not raise the save limit or clear data.
8. **Observe:** use aggregate byte/count/latency metrics without recording answers, identifiers or analytics events. There is no automatic deletion/retention job in this proposal. Any eventual removal of a redundant inline copy requires separately reviewed per-record acknowledgement and a proven legacy bridge.

## Required evidence before implementation can ship

- Generated multi-year histories with all 96 skills, every Town plan, area retakes and old snapshots; measure current-save bytes separately from total retained history. Proposed targets: current state stays below 500 KB in that fixture; ordinary new requests send no previously archived history. Define an explicit supported cap for simultaneous paused snapshots instead of silently discarding them.
- Identical visible evidence, rewards, milestones, question exclusion and mastery decisions before/after; exact values, order, legacy metadata and unknown fields preserved.
- Old app/new backend, new app/new backend, delayed V1 queue, V2 queue, pending financial intents and reset-generation fencing; two devices, revisions, concurrent inserts, lost responses and late retries.
- Partial backfill, duplicate IDs, changed hashes, late transaction errors, missing pages, disconnected open/reload, full local storage and crash between recovery-store writes. No partial commit or implicit reset.
- Parent/learner and cross-family isolation, revoked helper grants, no direct table writes; database and browser tests deny external destinations.
- Explicit pagination behaviour in parent evidence and completed-run reopening; no claim of empty history while a page is missing.

## Rollback and open decisions

Before capability cutover, revert the app and leave unused additive tables in place. After V2 history exists, an old app is safe only through the tested bridge; retain the new backend and disable new writes through a non-destructive update-required path if necessary. Do not drop history tables, restore old function bodies or restore a backup over subsequent gameplay as a routine rollback.

Review must settle: physical schema/RPC names, local recovery-store quota/export UX, history page size and ordering, supported paused-task budget, old-client response-limit handling, registry identity/version rules, and how parent history spans game resets without exposing retired data. Multi-learner selection and new mastery rules remain Phase 3. No migration SQL or history-compaction application code should be written from this proposal until these contract decisions are reviewed.
