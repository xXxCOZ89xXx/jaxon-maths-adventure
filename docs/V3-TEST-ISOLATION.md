# V3 Test Isolation and Single Final Acceptance Plan
Status: Approved testing specification. Tier A offline fixtures, interception and Playwright coverage now exist; see `V3-TEST-REPORT.md` for actual results. **No staging deployment exists.** The aim is zero test writes to Jaxon's real learning/rewards records.

## What "one big test near the end" means
- **Codex runs automated tests repeatedly during development**, correcting bugs without asking the family to click through every feature.
- Near completion, present one consolidated 20–30 minute acceptance session using a realistic **throwaway test learner** and test parent. Report tested outcomes and remaining defects together.
- After acceptance, merge/publish only with explicit approval. The real learner's history remains untouched during development, automated QA and acceptance.

## Environment isolation (strict)
### Tier A: default local/automated testing — NO real Supabase traffic
- Use a local test web server/Playwright with a stubbed cloud adapter or intercepted/blocked network traffic. Run both learner and parent roles with synthetic data.
- The test harness should fail closed: if a live Supabase call would be made, fail the test rather than allow it. Deny all production Supabase URL requests.
- Simulate logins/PIN screens without storing real credentials; use dummy users only. Keep fake data in test fixtures/in-memory DB.
- Use unique test browser contexts/storage keys per test, and clean up on completion. Never import, reset or mutate an existing personal learner backup or progress file.
- Differentiate unit tests, logic/integration tests, visual snapshots and end-to-end tests. A JS syntax pass is **not** a browser gameplay pass.

### Tier B: full cloud acceptance — separate staging Supabase project
**Recommended for final real cloud-sync test.** Provision a **separate Supabase project** with its own public URL, anon key and database. Do not point staging at the production project.
- Create one staging learner Auth user and one staging parent Auth user with a dedicated `maths_families` family relation. These identities must NOT have any link to Jaxon's production child ID.
- Apply reviewed existing V2 family/reward schema *in staging only*. Apply optional V3/bonus-shop migrations in staging after review there. Do not migrate production as part of QA.
- Use names like `test-learner`, `test-parent` in fixtures; credentials and keys are environment variables/secrets, never committed.
- Staging app/build URL must have explicit staging cloud configuration with no production fallback. A missing staging URL should visibly disable cloud and error; never silently switch to production.
- Use a distinct browser origin when possible. If it must share an origin with other builds, use a dedicated localStorage namespace and never read or write V2/production keys.
- Dedicated parent PIN (6 digits) and learner PIN (4 digits) may be used with test accounts only. No real family credentials necessary.
- All fixture data can be destroyed after QA, without any effect on Jaxon's records.

### Optional fallback if a second Supabase project is unavailable
A separate *test family* (test parent + test learner, linked to each other) inside the current project could isolate by `child_user_id` under Row Level Security. However, this is **less safe than a separate project** and should not be used until tests prove it cannot touch any real family row. Prefer Tier A for nearly all tests. Explicit user approval is required before creating identities or making writes in the current project.

## Playwright-style final automated test matrix
1. Start new learner with mock/staging sign-in and PIN; first-run introduction can be skipped/replayed.
2. Load the eight world map on desktop, iPad portrait and iPad landscape; readable and no overlapping controls.
3. Enter Number Forest, learn skill, use guided choices, solve a bridge repair puzzle, see visual world restoration.
4. Save mid-quest and reload; resume exact puzzle/scene; earn rewards only once.
5. Visit each of the seven other worlds; run one typical interactive maths puzzle; verify world progress.
6. Wrong answer and "I don't know" show helpful teaching, never punishment or grade inflation.
7. Complete a lesson with hints and show assisted outcome separately from independent first-try score.
8. Take a fresh independent check; verify it excludes already seen questions. Spaced revisit only when due.
9. With a failed check, reteaching is required; immediate reattempt is blocked.
10. Shop buy/equip/unequip; existing 40 item IDs and owned cosmetics survive reload.
11. Avatar visuals consistently reflect equipped items in map, camp, quest and shop.
12. Base Camp builds unlock at valid milestones, persist across reload, and don't duplicate rewards.
13. Weekly goal 60 active minutes, rewards are 1:1, and hidden/inactive tab time is not counted.
14. Parent dashboard shows correct summary from staging learner, not another account; parent actions remain parent-only.
15. Parent bonus coin award and optional secure coin spending (only in staging with migration), including idempotent retries and unaffordable items.
16. Learner account is denied direct parent award/update access; cross-family RLS attempts fail.
17. Network/offline interruption and refresh do not corrupt progress; queue/recovery does not duplicate rewards.
18. Sound preference, reduced motion, keyboard navigation and touch-size checks.
19. Mobile Safari-style, Chrome/Edge desktop viewport and where possible iPad WebKit engine smoke tests.
20. No third-party analytics or personal identifiers sent from fixtures; no requests to production Supabase.

Use console-error inspection, network logs and screenshots for regression diagnosis. Tests should be deterministic with fixed clocks/random seeds as necessary. Save a machine-readable test report and a short human-readable QA summary in the branch.

## Final acceptance with the user
Do not request individual feature-by-feature approvals while building. When the game is complete enough:
- Provide one simple **V3 test preview** link that is clearly separate from the real game.
- Give one temporary learner test account and, if desired, a test parent account (sign-in performed privately in the app/browser, not credentials published in the repository or chat). Alternatively use a clearly marked offline Demo/Test Mode with fake saved state.
- Provide a short walkthrough covering Home → Number Forest quest → world restoration → avatar/camp → another world → parent dashboard, plus a simple feedback checklist.
- Explain exactly which test data will be discarded and confirm the real learner's cloud account and existing results were never used.
- Fix consolidated feedback, rerun automation, then ask for **one release approval** before merging or turning on new production database features.

## Release blocking conditions
- Any attempted call to production Supabase from automated/staging tests.
- Any possible overwrite/reset of the existing learner progress or tests using the real child ID.
- Rewards or mastery granted through repeatedly clicking non-learning UI.
- Auth role separation, RLS or parent reward boundary regression.
- Serious iPad/touch usability blockers, loss of saved quest state, repeated sign-in loops, or leaking credentials.
- Unreviewed DB migrations or unexpected writes to the real database.

## Future implementation items, not yet complete
- A fully isolated local preview/demo mode, with cloud networking disabled.
- E2E test fixtures/staging setup and Playwright tests.
- A separate staging Supabase project and test family (user action only if necessary).
- One consolidated acceptance preview and report.

Read this file as **the testing specification**, not a claim these systems already exist.

## Secure integration implementation update
New staging-only migrations, official Auth client integration, server PIN/unlock checks, CAS sync and atomic wallet operations now exist. `tests/v3-postgres.cjs` runs real PostgreSQL in a disposable **network-disabled** Docker container with fictional auth claims. Browser cloud tests intercept every synthetic backend request; all unexpected external traffic fails. These tests do not connect to hosted Supabase. The current setup and single combined acceptance walkthrough are `V3-SECURE-STAGING.md`; its status supersedes the older "future implementation" list above. Remote SQL still requires verified project identity and explicit staging authorisation.
