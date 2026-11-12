# Parent total game reset — review draft

`001_parent_game_reset.sql` is an additive server upgrade for the existing V3 request architecture. It has **not been applied remotely**. Installing it does not execute a reset. No app boot, build, deployment or migration step calls `reset_game`.

A future separately approved release must review and install this upgrade against the verified current backend, then use the reviewed application build. The script refuses installation without the database-owner review setting `app.base_camp_reset_reviewed = yes`; that is an operator preflight, not application reset authorization. Do not run an old request-function replacement over this wrapper. The UI keeps the reset control disabled on an unupgraded backend; ordinary play and old generation-zero queues retain their existing compatibility.

The only runtime reset path is `v3_request(parent_unlock, 'reset_game', args)`. Its authorization comes from the existing `auth.uid()`, unambiguous family role and server-issued PIN unlock. It never accepts a target child ID. Required arguments are a stable request UUID, the displayed progress revision, current game generation and the exact confirmation `RESET ALL GAME PROGRESS`. The parent must deliberately confirm again if the game revision has changed. A lost response can be retried with the same UUID/payload without resetting subsequent play again.

The operation holds the existing learner wallet lock, replaces the entire authoritative progress JSON with `{}`, increments the progress revision and game generation, clears wallet coins/bonus/ownership and all active/opening/redeemed reward entitlements, and revokes learner unlocks. Account identities, passwords, complete PIN records, family links, catalog and environment/access configuration are unchanged. Any error rolls the whole transaction back.

All subsequent writes require the new generation, before transaction receipt lookup or revision/conflict resolution. Old financial request IDs cannot be reused in a new generation. The internal delegate is revoked from client roles; table triggers also fence legacy function invocations already in flight. New clients scope game caches, queues/conflict copies and purchase/reward intents to the verified generation. Earlier local bytes are quarantined, not imported or automatically replayed. A stale active learner session is stopped on server refusal; the learner must unlock again.

This is a reset of active gameplay, not deletion of retained audit records or backups. Historical financial receipts, reset audit metadata and retired legacy records remain inaccessible to ordinary clients and are not used to restore progress. A reviewed administrative rollback/backup restore is outside the game and outside this task. Physically disconnected devices cannot be remotely erased or prevented from displaying their previous offline copy; their old writes are refused when they reconnect. Production already requires online release verification before opening an account.

Synthetic acceptance only:

- `node tests/parent-game-reset-db.cjs` — production-shaped backend in a network-disabled disposable PostgreSQL container.
- `node tests/parent-game-reset-db.cjs --staging` — staging backend with compact receipts in another network-disabled container.
- `npx playwright test -c playwright.parent-reset.config.cjs` — intercepted fictional production build, four layouts.

These commands do not contact hosted Supabase, change a live schema or reset a real learner. Never substitute a live database URL or genuine account into them.
