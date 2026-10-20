# V3 release follow-up

Practical Maths Town, deeper nine-world expeditions and optional gateways are part of the current offline build. They are no longer backlog items. Keep draft PR #2 unmerged until review and release approval.

1. Run the consolidated nine-world walkthrough in `V3-PREVIEW.md`; collect feedback once and fix confirmed issues.
2. Test on physical iPad Safari. Managed-network policy blocked WebKit downloads with HTTP 403 `Domain forbidden`; Chromium touch emulation is not Safari coverage.
3. Provision a **separate staging Supabase project** and fictional test family before implementing real V3 cloud integration. Test login/PIN, save/sync conflict recovery, cross-family RLS, server-side rewards, spending and retry idempotency there. No production migration or real learner access is authorized by this build.
4. Review synthetic V2/old-V3 migration and test results before connecting any account. The preview intentionally has no real-backup import or production fallback.
5. Review prices, reading load, difficulty progression and practical usefulness with the intended learner. The activity rates and deductions are fictional examples; they are not live tariffs or real payroll rules.
6. Extend narrative/mission variants if acceptance calls for them. Current build has 123 mission/level combinations, three tasks each, 41 keepsakes, camp projects and the original restoration quests. Replays vary values but never create endless completion rewards.
7. Cross-device saves, cold-offline asset caching and live parent workflows remain separate integration work. Do not redirect the homepage, merge or publish the replacement game without explicit approval.
