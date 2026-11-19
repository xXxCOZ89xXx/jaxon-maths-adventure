# Applied database scripts: dated evidence log

Updated 18 November 2026. This log distinguishes a source report from a new hosted verification. It is not an installer, an instruction to run SQL, or permission to reset a learner. No hosted SQL or real-account operation was performed while preparing it.

| Recorded | Script | Reported status | Evidence and limit |
| --- | --- | --- | --- |
| 18 Nov 2026 | `base-camp/001_parent_game_reset.sql` | Installed on the live family project by 15 Nov 2026; no reset run as of that review | Owner-supplied **Build brief for Codex: fixes from the 15 November review**, Phase 2 Docs item: “It is installed on the live project (checked read only, 15 Nov). No reset has been run.” This is Claude's reported verification, not a fresh Codex check. Exact installation time, executed file hash and installed function hashes were not supplied. |

Current repository file SHA-256 for the reset installer is `97619e3fbc141de1f9a68b0ac3ee9e069f13676f6160a231923c066761ecb131` at the Phase 2 baseline `e5ea809`. This identifies the source under review; it does **not** prove that these exact bytes were executed remotely. Historical installers must not be rerun to establish a hash.

Other older schema/receipt installers are documented in their own upgrade notes, but a complete, owner-attested execution history is not available here. Successful application/deployment checks alone do not establish which script was run or its exact installation date. Do not mark a draft or parked migration applied by inference.

For each future separately approved database change, append: execution timestamp and timezone, verified project reference/environment, repository commit and actual executed script hash, operator confirmation, aggregate read-only verification result, backup/restore verification reference (private; no backup data), and rollback compatibility notes. Do not record credentials, PINs, Auth identifiers, learner answers or personal record contents in this log.

Before any future SQL: retain an encrypted consistent backup and a reviewed restore procedure, verify the exact current function definitions/capabilities, and obtain approval for that specific migration. Preserve pending browser queues. The current environment name also affects the reset wrapper's account-opening branch; see the separate Phase 2 environment migration plan before changing it.

19 November 2026: `history/001_retained_history.sql` and `history/002_enable_retained_history.sql` are a **review package only; neither has been run on the hosted database**. Disposable network-disabled PostgreSQL rehearsals are development evidence, not installation evidence. See [the package and execution order](history/README.md).
