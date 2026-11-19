# Retained-history release review — prepared, not executed

19 November 2026. This handoff separates the completed current application recovery from the remaining specific live review. It does not authorise or run hosted SQL, provision projects, merge, deploy or change hosting/Auth.

## Verified position

- Existing game/demo branding release: merge `21237873a04ce1306b8596d1097b234098300f01`, both hosting checks previously verified. This client already supports the disabled/absent history capability and V2 after approved activation.
- Owner confirmed the backup source matches the deployed family game's public project reference. Export/readability, two encrypted password-protected copies and current **PARTIAL application recovery checks PASS** are owner-reported complete. Original archive unchanged; real archive/report were not accessed by Codex. No repeated backup/tool installation is required merely to finish that checkpoint.
- Prepared SQL/client behaviour has fictional PostgreSQL/browser evidence. The actual installed request/reset definitions, grants, history state and later-play/snapshot freshness have not been inspected by this package.
- Full managed-service recovery is not certified. Review its relevance to this particular change without relabelling application recovery as a complete Supabase restore.

## Exact script package

SHA-256 hashes below bind the reviewed files; any content change requires renewed review.

| File | SHA-256 |
| --- | --- |
| `000_preflight.sql` | `0c708db5f507ae9e24dd8294e2e16093bb6edf092f5b56831a4348380f6dec3d` |
| `001_retained_history.sql` | `3cdad342ebfecff2c28c32299573cbaa679c06d86b099e1a54a988a2f916f185` |
| `002_enable_retained_history.sql` | `2d476e63b98e0290d1a0ee1051f3e5a9576fdaaeb009a731a7dcbfacc90f0b2d` |

## Changes and boundaries

| Step | What it does | What must precede it |
| --- | --- | --- |
| `000_preflight.sql` | Read-only transaction; checks operator/project and outputs required-table/RLS/grant flags and request/reset/helper definition hashes. Does not output learner rows or function bodies. | Review permission for the actual project and the completed backup checkpoint. Set the independently verified expected reference in the same owner session. This is prepared, not run live. |
| `001_retained_history.sql` | Transactionally creates three private history/settings tables and helpers; preserves old request/identity functions under compatibility names and installs wrappers. Leaves capability disabled. Does not migrate existing learner rows. | Review actual installed reset/request baseline and grants, the exact script hashes, backup/snapshot freshness and relevant operational recovery limits. Specific owner installation approval. |
| `002_enable_retained_history.sql` | Separately records exact deployed compatible client SHA and enables history writes/capability. Later saves may store immutable nodes and references. | Verified disabled installation, compatibility/retry/preservation evidence and specific owner cutover approval. Client SHA must be the actual deployed merge, not a branch tip. |

These scripts do not create/replace Auth users, change passwords, consume Vault secrets, move Storage bytes, change family identities or perform the separate family/test environment rename. Actual installed code drift must still be checked: source inspection alone cannot establish what runs on the hosted project.

## Remaining review evidence

1. Match the real installed metadata to the reviewed secure baseline: project, required reset delegate, definer/owner/search-path properties, table isolation and RPC grants. A digest is an inventory, not automatic proof of equivalence. Do not print or publish real private reports or learner records.
2. Confirm the protected snapshot still covers the intended cutover state. Preserve device-only queues and acknowledgements; later material play/writes need protection before SQL. Do not overwrite an older archive or clear a browser to make the check pass.
3. Record the relevant operational recovery route/access and residual managed-service limits. Application records and archived Auth users/identities have passed scoped recovery; other Auth/service state, permissions, Vault/configuration and Storage bytes remain unverified. No empty-Vault/unused-Storage/provider-backup assumption is accepted without evidence. The free-plan dashboard upgrade message does not establish a provider restore route. Any residual-risk decision must name its actual scope.
4. Review additive installation separately from capability activation. Establish pre/post preservation evidence and ensure installation still advertises capability 1. Keep the live project and original identifiers unchanged.
5. Review original V1 request acknowledgement/retry, CAS conflict, PIN/role boundaries, two-device/old-client behaviour, reset fencing, history integrity and error/recovery evidence. Existing network-disabled fictional tests provide preparation evidence, not real hosted API certification.

## Rollback and later backups

Before activation, leave disabled additive tables/helpers in place. After V2 writes exist, retain readable history and the compatible backend; the reviewed emergency action is to pause new V2 writes while keeping history enabled/readable. Do not drop history, restore old function bodies or overwrite subsequent play with this earlier dump as routine rollback. Further live migrations need current protection that includes any new history records.

## Next authorised development work

Prepare the isolated synthetic environment and household/session foundation under the agreed UK roadmap while these operator checks are pending. Use fictional identities only; no real-data QA, new hosted projects, real child selection or Auth/family/environment cutover is implied. Parent/child portals, selected /game and /account and /demo routes, full Phase 2b, payments and launch gates remain in the shared plan. Keep one grouped physical Safari acceptance near the end.
