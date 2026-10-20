# V3 release follow-up

The nine-world gameplay milestone and isolated secure integration implementation exist on `codex/v3-adventure-build`, draft PR #2. Nothing is merged or connected to production.

1. Follow `V3-SECURE-STAGING.md`: create **jaxon-maths-v3-staging**, verify its identity, explicitly authorise staging-only SQL, provision fictional families, and privately configure/build the separate staging app. No hosted project has been used by this task.
2. Validate actual Supabase Auth password/PIN recovery, signed AMR claims, refresh, PostgREST/RLS and two-device operation there. Automated PostgreSQL and intercepted browser tests do not establish hosted staging acceptance.
3. Validate the parent-reviewed offline-time reconciliation in real staging: automatic credit is connected and clock-capped; a parent can explicitly confirm saved uncredited minutes once. The 60-minute goal and 1:1 conversion remain.
4. Run the one consolidated offline/staging walkthrough in `V3-SECURE-STAGING.md`, including physical iPad Safari and family feedback. WebKit engine CI is an additional check, not a physical iPad result.
5. Review a future production migration separately. Existing V2 records, main, live entry points and production Supabase remain untouched. No real-backup import, homepage change, Pages reconfiguration, merge or production deployment is authorised.
6. Optional later hardening: server-verified academic/activity evidence, cold-offline asset caching, multiple children per parent, and more narrative variants. The current bounded replay templates, 123 mission/level combinations and 41 collectibles remain playable.
