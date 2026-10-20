# Codex build instructions — Jaxon's Maths Adventure V3

This file governs V3 development, currently on `codex/v3-adventure-build` in draft PR #2. The user’s 20 October continuation approval includes Practical Maths Town as the ninth current world, deeper gameplay in all nine worlds, and explorer/camp improvements. Read `docs/V3-ADVENTURE-BRIEF.md` and `docs/V3-TEST-ISOLATION.md` first. The user has approved the complete adventure redesign and prefers one major acceptance test near completion instead of repeated requests for manual tests.

## Non-negotiable safety and integrity
- Work on the existing `codex/v3-adventure-build` development branch. Do not commit to or merge into `main`; do not overwrite or replace `index.html` (the original live game) or the existing `v2-game-test.html` on `main`.
- Never authenticate as the real learner, run tests against the real learner's Supabase Auth identity, reset or alter the real learner's saved `maths_learning` record, or send test scores/rewards into production.
- A test account is **not** a reused browser session of the real learner. Tests must use local mocks/in-memory fixtures and, later if required, a separate staging Supabase project with dedicated parent and learner identities and their own family row.
- During automated tests, deny outbound network connections to the production Supabase host. Use test-specific keys/configuration and storage namespaces. Do not put credentials, service role keys, PINs, real learner identifiers, or downloaded personal data in the repository.
- Do not apply, migrate, drop, truncate, or alter any production Supabase schema. `supabase/v2-bonus-shop-migration.sql` is a **draft**, not approved or deployed. Preserve the secure server-side parent reward model and its role boundaries.
- Learning remains 60 active minutes per week, with 1 minute of active learning earning 1 minute of screen-time reward (10 min -> 10 min).
- Wrong answers, choosing "I don't know", and taking hints are safe and supported. Only independently correct fresh/spaced assessments can count toward independent mastery; do not award mastery from merely opening a lesson or clicking a game interaction.
- Do not create endless XP or coins from low-effort clicks, repeated reset loops, or immediate retakes. Keep gameplay fun and avoid time pressure, failure penalties, or public leaderboards.

## Implementation approach
- Implement the complete agreed plan in `docs/V3-ADVENTURE-BRIEF.md`, not just another large question bank. Prioritise strong visual gameplay, touch usability, and meaningful persistent world progress.
- Retain the original 8 worlds / 39 skills and extend them with Practical Maths Town and its everyday skills; preserve existing V2 schema compatibility and defensive loading of old progress. Treat existing V2 QA checks as a baseline, expanding them as features are introduced.
- Refactor the single-file V2 architecture carefully into testable modules if useful, without breaking saved states or existing learner and parent roles. Avoid proprietary Minecraft art and use original voxel-inspired artwork.
- Implement iteratively within this one task. Run tests during development. Fix regressions and document any that remain. Only seek user input for a genuinely blocking external dependency (such as provisioning a **separate** staging Supabase project or reviewing a production deployment).
- Prefer one comprehensible final acceptance walkthrough for the user, after a playable full build and automated QA; do not send the user a series of tiny manual tests.
- Make a clear draft PR #2 from `codex/v3-adventure-build` to `main` for review, **do not merge** without explicit approval. The finished deliverable includes a preview and a clear test report; do not claim browser tests unless they have been run.

## Key project links
- GitHub repository: `xXxCOZ89xXx/jaxon-maths-adventure`.
- Existing V2 test page on main: `v2-game-test.html`. Original live homepage: `index.html`.
- Existing regression scripts: `tests/v2-learning-regression.cjs`, `tests/v2-discovery-regression.cjs`, `tests/v2-bonus-shop-regression.cjs`.
- Database drafts: `supabase/v2-bonus-shop-migration.sql` plus earlier family/rewards migrations; **read only** until separately approved.
