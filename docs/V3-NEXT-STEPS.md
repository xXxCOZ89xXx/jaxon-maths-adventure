# V3 release follow-up

Current continuation: the owner has confirmed initial real staging sign-in/PIN/lock/save/reward/shop/visible-family checks. Visual redesign, a verified private version-2 gallery/game, green 100-case hosted browser QA and autonomous reliability/release preparation are complete; no further manual tests are requested yet. Use `V3-VISUAL-REVIEW.md`, `V3-RELIABILITY-SECURITY-REVIEW.md`, `V3-OUTSTANDING-ISSUES.md` and `V3-PRODUCTION-RELEASE-PLAN.md` for the current consolidated status. Older setup/run evidence below remains historical.

The nine-world gameplay milestone and isolated secure integration implementation exist on `codex/v3-adventure-build`, draft PR #2. Nothing is merged or connected to production.

1. Database/account setup is owner-completed; do not repeat migrations. The configured staging build is deployed owner-private at https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site . Follow `V3-STAGING-ACTIVATION.md` for the remaining staging-only Auth redirect settings and one combined acceptance session. The Cloud proxy rejects the staging host (403); no live staging success is claimed.
2. Validate actual Supabase Auth password/PIN recovery, signed AMR claims, refresh, PostgREST/RLS and two-device operation there. Automated PostgreSQL and intercepted browser tests do not establish hosted staging acceptance.
3. Validate the parent-reviewed offline-time reconciliation in real staging: automatic credit is connected and clock-capped; a parent can explicitly confirm saved uncredited minutes once. The 60-minute goal and 1:1 conversion remain.
4. Run the one consolidated offline/staging walkthrough in `V3-SECURE-STAGING.md`, including physical iPad Safari and family feedback. WebKit engine CI is an additional check, not a physical iPad result.
5. Review a future production migration separately. Existing V2 records, main, live entry points and production Supabase remain untouched. No real-backup import, homepage change, Pages reconfiguration, merge or production deployment is authorised.
6. Optional later hardening: server-verified academic/activity evidence, cold-offline asset caching, multiple children per parent, and more narrative variants. The current bounded replay templates, 123 mission/level combinations and 41 collectibles remain playable.
