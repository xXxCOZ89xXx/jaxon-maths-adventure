# V3 release follow-up

The standalone offline adventure is ready for consolidated acceptance after automated checks. Keep the draft unmerged until approval.

1. Run the single walkthrough in `V3-PREVIEW.md` and address consolidated feedback.
2. Test on physical iPad Safari. Playwright WebKit installation was blocked by the managed network policy (HTTP 403 `Domain forbidden` on its download hosts); Chromium iPad emulation is not Safari coverage.
3. Provision a **separate staging Supabase project** and dedicated test parent/learner family. Wire a staging-only adapter with no production fallback, then test real login/PIN, sync, offline queue/conflicts, cross-family RLS, server-side reward spending and idempotency. No V3 cloud adapter or production migrations are included in this change.
4. Review migration using synthetic exports plus the existing compatibility tests before connecting any account. The pure V3 migration preserves unknown V2 fields and ownership, but intentionally offers no real-backup import in this offline preview.
5. Review optional gateway/boss puzzles, additional quest variants and narrative depth after the core acceptance. Current quests have three persistent puzzles per world; their fixed values are repeatable for learning and cannot farm XP or completion coins.
6. Keep Practical Maths Town in the backlog. Never redirect the homepage or modify production Supabase as part of these follow-ups. Merging/publishing the replacement game requires explicit approval.
