# V5.2 staging preservation review

22 October 2026. Review covers the new `supabase/v52-staging-preserve/` package, staging-only builder and queue compatibility module. This is source review plus focused fictional rehearsal, not hosted Supabase security certification.

## Scope and preservation findings

- The importer correction is complete by owner report: runtime EXECUTE denied, postgres allowed. This package requires that state and never replaces/calls the importer.
- The target is the existing staging marker/ref, four Auth accounts and two independent fictional families. Production overlap and an existing upgrade-control schema are hard stops. The marker is not physical identity proof; the owner also verifies the dashboard ref.
- Installation changes two zero-valued wallet compatibility fields, one staging version field, four RPC bodies and protected upgrade metadata. It performs no Auth/family/PIN/progress/wallet-original-column/transaction DML. Existing PIN attempts/cooldowns/generations and unexpired capabilities remain intact.
- A server-side SHA-256 comparison covers every original column, including unknown JSON fields and retry payload/results. Snapshots are taken only after pause/drain/locks. Raw account/PIN/game data is neither returned nor persisted in the control record; only digests and routine definitions/grants are stored privately.
- Original and installed bodies are checked against reviewed LF/CRLF fingerprints. Other source differences are not silently accepted. Installed permissions/RLS/private metadata access are checked before reopening. A late mismatch aborts the whole upgrade transaction.

## Security and isolation findings

- All maintenance controls require postgres plus explicit staging execution acknowledgements. Runtime roles cannot use the private schema, table or helpers. Helpers run with caller rights and an empty search path. Default privileges are not altered.
- Only the five existing game RPC entry points are paused, then their captured intended grants are restored. Unexpected roles, grant options or inherited effective access cause a stop. The importer remains denied. No permission broadening is used to pass a test.
- Family roles stay server-derived. Request operations validate a live account-bound PIN-generation capability and operation-specific role. Reads no longer initialise rows. PIN updates retain recent bounded password-AMR checks, and requests hold the PIN-row lock while verifying generation.
- Exact historical request retries return their original result before new payload restrictions, but after authorization; payload/operation changes for a reused ID are rejected. New requests require valid shapes, bounded active seconds and finite values. Safe revision limits and CAS prevent stale saves from overwriting newer state. Wallet authority remains on the server, with unchanged cumulative entitlement and 10 coins/1 screen minute per eligible active minute.
- Staging configuration is pinned; production validation is unchanged. The new artifact omits production adapters, and its CSP admits only the staging endpoint. Version-2 verification is required on startup. It retains existing origin/storage/lock namespaces, pending request IDs, drafts and archives.
- The transformed transaction handler retains old extra fields, exact stored intent bytes while pending and rejected requests. It clears only a successfully confirmed completed intent. Stricter validation can block an uncommitted legacy intent; the documented private reconciliation stop preserves it rather than inventing a replacement.

## Rollback and limits

Pause and drain are separate from the atomic upgrade so old in-flight calls cannot race routine replacement. A failure may leave maintenance closed; this is explicit in the approval scope. Recovery does not reset users or automatically restore access.

Freeze retains all activity and capabilities. Rollback restores captured code while retaining all current data, additive columns and immutable history; it refuses nonzero new-field use. Restoring weaker original validation and reopening a legacy baseline require an explicit risk acknowledgement and incident scope. No pre-upgrade dump is restored over new activity. Publishing any older/newer artifact remains separately approved.

Before hosted execution the owner still needs current private staging recovery coverage, actual Auth/API schema/redirect confirmation and the exact reviewed package hashes. A SQL acknowledgement is not a backup or dashboard check. Hosted JWT/AMR/refresh, real-device behaviour and email recovery are not certified by fictional claims. No code-only review can prove learner activity; existing server-clock caps and parent-reviewed offline credit remain the boundary.

Focused evidence is in `tests/artifacts/v52-staging-preserve-db.json` and `v52-staging-preserve-client.json`. Only these new preservation/rollback/build/queue cases were run; previous inventories and broad gameplay/security suites were not repeated.
