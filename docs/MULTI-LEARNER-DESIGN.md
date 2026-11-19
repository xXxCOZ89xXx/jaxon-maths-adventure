# Multi-learner accounts: design, not enabled

The current server role contract requires exactly one matching family relationship. Adding a second child row alone is unsafe. This phase creates no accounts, changes no memberships/PINs, and adds no child selector.

## Proposed model

Use stable families, learner profiles and membership records. A membership binds an Auth identity to a family and a role; a learner profile owns progress, wallet, history and reset generations. Existing learner Auth IDs and child identifiers remain authoritative aliases rather than being replaced. Backfill the existing one-parent/one-child relationship additively and verify counts and hashes before enabling new selection.

A server-side selection operation must validate the authenticated parent's membership and bind an unlock token to one authorised learner, role and membership generation. Learner accounts remain bound to their own learner. Every progress/history/wallet/reset request derives its learner from that token and revalidates membership; a supplied learner ID cannot grant access. Revocation retires only affected tokens. Parents must never acquire learner write powers through selecting a profile.

## Existing clients and device data

Keep V1 role/unlock/request functions available for the existing unambiguous relationship. Never reinterpret an old token after a parent changes selection. Where more than one relationship makes a legacy request ambiguous, refuse it without changing data and provide an update path.

Future caches, history stores, pending requests and intents must include both the authenticated identity and the selected authorised learner. Keep existing keys and exact pending bytes until the original learner is verified, its queue is acknowledged or explicitly recovered, and a new scoped store is durable. Do not move an unresolved queue to another child. Switching profiles requires flushing or preserving the current learner's work and disposing in-memory handlers; closing a tab alone does not prove acknowledgement.

Wallet balances, shop ownership, active time, the weekly target, screen-time conversion, mastery and reset generations belong to each learner. Family billing, if later approved, must remain independent of these educational records. Parent evidence pages must require a verified selection and label the learner clearly; missing history must not appear as no learning.

## Migration and rollback evidence

Before any implementation/cutover: review the new role/RLS/RPC contract, take and verify an encrypted backup, and rehearse on a separate fictional project. Test two parents, two learners, multiple families, revoked membership, stale selection tokens, parallel tabs, delayed V1/V2 requests, purchases, parent rewards, reset epochs and offline switching. Verify the original Auth IDs, PIN mappings, wallet/history totals and request acknowledgements before/after.

Before activation, leave additive tables unused and retain the old path. After activation, an old app is safe only through the tested compatibility bridge; disable selection/writes non-destructively rather than assigning an ambiguous request or restoring an old backup over subsequent play.
