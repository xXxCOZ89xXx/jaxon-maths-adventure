# V2 → V3 production release plan — prepared, not executed

**Latest continuation:** the owner has now authorised website replacement and accepts loss of the small amount of learning progress. Earlier permission restrictions in this historical plan are superseded. Accounts, PINs and security must still be preserved. Actual production discovery, rollback tag, current integration blockers and owner access requirements are recorded in [V5.1 live release status](V51-LIVE-RELEASE.md). No production rollout or database modification has occurred.

Status: no production access, export, schema change, account change, deployment, homepage replacement or merge is authorised by this task. PR #2 stays draft. Initial real staging checks below are owner-reported. Automated tests use fictional fixtures or isolated PostgreSQL.

## Preconditions and decision gates

- [ ] Complete the single later acceptance session in `V3-OUTSTANDING-ISSUES.md`; do not request more manual tests during this development task.
- [ ] Resolve live family/API security, physical Safari, two-device/conflict behaviour and email recovery configuration. A recovery 429 is not successful email delivery. No SMTP or rate-limit changes are part of this task.
- [ ] Review actual V2 production schema/identity compatibility in a separately approved read-only task. The V3 standalone schema cannot be applied blindly alongside existing V2 tables/functions. `maths_families` may already have different constraints, policies or relationships; compare definitions and Auth identity links before writing any production SQL.
- [ ] Decide in advance whether to reuse Auth identities with carefully reviewed relationships or use an explicit account migration. Never infer role from editable user metadata, silently create a new learner, or drop existing family links.
- [ ] Approve the exact version, reviewed migration, data-handling location, owners and rollback thresholds before any production operation. No script in this task exports real data or performs a production migration.

## Backup and manifest (future authorised work only)

Quiesce V2 writes for a short agreed window or take a consistent transaction snapshot and establish an explicit cutover watermark. Otherwise new rewards or answers between backup and cutover can be lost or counted twice. Save encrypted backups with restricted access and retention, outside Git/PRs/static hosting. Record schema versions, row counts, timestamps, authenticated family/child mapping, SHA-256 checksums and authoritative ledger totals. Verify restore into a disposable restricted environment before authorising cutover; a downloaded JSON file alone is not a verified database backup.

Inventory separately: complete learning state and unknown fields; skill/mastery and original assessment timestamps/support labels; active learning totals and weekly buckets; learning/bonus coin balances; redeemed/available screen time; owned/equipped catalogue IDs; parent settings; family relationships and Auth identities; durable transaction IDs and revision counters. Do not export account passwords, PINs or service-role keys into a game backup. PIN re-enrolment must remain password-backed if required by the approved identity plan.

## Mapping and integrity rules

1. Preserve all V2 skill/evidence fields exactly. Existing mastery remains legacy evidence; never manufacture fresh V3 independent checks or mark guided work as independent. Unknown fields survive. Keep an archive of the entire source envelope.
2. Preserve exact authoritative numeric balances; two-decimal formatting affects display only. Wallet balances come from the existing server authority, not an untrusted browser snapshot. Reconcile ledger totals before importing. Do not interpret learning total minutes as automatically available screen time when some time has already been redeemed; preserve redemption and bonus ledgers separately.
3. Preserve owned catalogue IDs and valid equipped slots; do not repurchase imported cosmetics or award restoration XP merely for importing. Existing 40 IDs remain unchanged.
4. Use an explicit verified one-to-one child/family mapping. The current V3 adapter supports one child per parent and rejects ambiguous links; multiple-child families are a release blocker until a reviewed selection/mapping design exists.
5. Use a reviewed administrator-only importer with stable migration IDs, a source checksum and a destination revision guard. Reject an existing V3 destination rather than overwrite it. The existing staging-only `v3_admin_import` is a test precedent, not an approved production script; it does not by itself establish compatibility with the production reward/schema model.
6. Validate row counts and invariants in a disposable rehearsal before cutover: no missing skills/checks/history, exact wallet/redemption totals, all owned IDs preserved, correct parent relationships, no cross-family reads, and no extra rewards on retries. Browser copies cannot mint authoritative ownership or coins.

## Synthetic rehearsal included here

`node tests/v3-release-rehearsal.cjs` operates only on a hard-coded fictional V2 history. It verifies an immutable SHA-256 backup, lossless field migration (including exact fractional balance, evidence, time, parent/family settings, wardrobe and unknown data), idempotency, preservation of a supported unfinished quest, no fabricated fresh checks and byte-equivalent rollback. Real PostgreSQL tests separately verify privileged import refusal over existing data, role/RLS boundaries, wallet integrity and CAS/retry behaviour. These checks are necessary groundwork, not a live-data migration rehearsal or complete production-schema reconciliation.

## Reversible hosting and cutover

Keep V2 and its original storage namespace, homepage, assets and rollback URL available. Deploy the approved V3 version to a separate restricted opt-in route/origin first, with a separate storage namespace and a production configuration that is designed/reviewed explicitly; the present builder intentionally accepts staging and must not simply be repointed at production. Retain an immutable V2 asset release and exact V3 source/config identifiers. Do not let V2 and V3 independently write incompatible reward or learning records. Establish one server authority and a single write owner per learner during cutover.

After future approval, migrate a small agreed cohort, verify balances/history/roles, and monitor error rates, conflicts, saving, recovery and active-time accounting. Switch the homepage or GitHub Pages settings only under the separate release approval. Keep private staging fictional and independent.

## Rollback

Trigger rollback for any lost history, cross-family access, unauthorised rewards, unexplained wallet difference, repeated sign-in loop, broken physical Safari flow or failed cloud save. Freeze affected V3 writes, preserve new V3 changes/transaction IDs in a restricted incident archive, then restore the previous app/configuration. Do not blindly restore an old database snapshot over new legitimate learning or payments: reconcile post-cutover deltas through a reviewed incident procedure first. Verify V2 can read the retained source format and reconcile the authoritative ledger. A server/schema rollback and an asset rollback are distinct operations; reversible app hosting alone does not guarantee reversible data writes. Record the outcome and require a new release decision.

## Readiness

Automated tests and private visual review can be completed autonomously. Production is **not release-approved**. Outstanding external/device/security acceptance is consolidated in `V3-OUTSTANDING-ISSUES.md`; no real-data operation or production rollout has been performed.
