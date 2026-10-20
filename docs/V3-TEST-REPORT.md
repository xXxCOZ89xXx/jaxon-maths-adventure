# V3 Test Camp QA report

Date: 20 October 2026 (Europe/London). Build branch: `codex/v3-adventure-build`, based on fetched `v3-adventure-redesign` commit `664b631ab0f02cdeec3ece3d56d610fb6787be13`.

This report covers the standalone fictional **offline preview**, not a production-connected V3 release. No real learner login, backup, saved history or Supabase record was used. No SQL was applied, and the live homepage was not replaced.

## Results

| Layer | Result | Scope |
| --- | --- | --- |
| GitHub connectivity | Passed | Requested `git ls-remote origin refs/heads/v3-adventure-redesign`, fetch, verified/read all three required instruction files |
| Existing V2 learning regression | Passed | 39 skills, 4,680 generated review samples, repeat-practice flows, visual-tool support |
| Existing V2 discovery regression | Passed | 780 questions, four unique choices and exactly one valid answer |
| Existing V2 reward regression | Passed | Fake-Supabase missing-schema handling, learner balance, server-only purchases, parent/unlinked boundaries |
| V3 pure logic | Passed, 9 suites | All eight worlds, all 39 skills, all 780 discovery choices, synthetic V2 migration, mastery separation, fresh/spaced gating, rewards, wardrobe and suspended quests |
| Browser end-to-end | Passed, 27/27 | Nine cases in each of desktop, iPad portrait and iPad landscape Chromium |
| Automated accessibility | Included in browser results | axe WCAG 2 A/AA and 2.1 AA checks on tested screens, touch-size checks, focus, keyboard, reduced motion and overflow at phone/iPad/desktop sizes |
| Packaged preview smoke | Passed | Extracted ZIP served separately; loaded assets and completed a fraction puzzle without runtime errors |
| Protected-file integrity | Passed | Five protected files byte-for-byte unchanged from the fetched branch; SHA-256 evidence saved |

Runtime: Node 24.19.0, Playwright 1.64.1, system Chromium 154.0.8037.57 on Debian 13. Browser profiles are fresh isolated contexts with fictional fixture data. Tests never reuse a personal browser session. iPad tests use Chromium mobile/touch emulation at 820×1180 and 1180×820; desktop is 1440×1000 and responsive checks include 390×844.

## Browser cases

Each viewport runs the same nine cases:

1. Home, skip/replay tour and all eight worlds; use actual puzzle controls to solve all 24 restoration stages; reload preserves milestones; no mastery from quests.
2. Save halfway through Number Forest, reload, resume exact stage/selection/hint and use keyboard controls.
3. Guided lesson and visual tools; practice questions excluded from the fresh check; hinted answers excluded from independent score; failed check requires reteaching.
4. Forty wardrobe items, buy/equip, unchanged balance on reload, outfit visible across screens, comfort preferences and fictional parent summary.
5. Two same-origin tabs purchase concurrently; one ownership entry and one coin charge. Web Locks serialize writes.
6. Navigation focus, button hit targets, reduced-motion preference and horizontal-overflow checks.
7. Adaptive discovery chooses an easier band after supported/skipped work without granting mastery; interactions remain usable while network is offline; save survives reconnect/reload; a synthetic V2 storage sentinel is unchanged.
8. Active learning earns time. Simulated `document.hidden`/visibility-change events and idle time stop earning. Headless tab visibility is unreliable, so this is explicitly simulated browser integration coverage, with additional pure time-accounting tests.
9. Corrupt demo storage stays intact with a visible temporary-session warning; the app remains playable without silently overwriting the saved text.

The harness aborts every nonlocal request and fails on any attempt, browser runtime/console error or reported Content Security Policy violation. V3 itself has no cloud adapter and sets `connect-src 'none'`. Successful final runs therefore contain no production-Supabase or other nonlocal browser requests.

## Learning and reward integrity

- Guided quest completion changes durable story milestones only. It does not write academic mastery.
- Fresh checks use unseen generated questions and score the first answer without help. Assisted, wrong and skipped answers cannot become independent successes by retrying the same card.
- A fresh pass marks independent practice; a due delayed pass can establish mastery. Immediate successful retakes are blocked. Failed checks require another lesson/practice visit.
- The 60-minute weekly goal and 1:1 screen-time conversion are retained. Coins accrue at ten per active minute, separately from screen-time. Time is bounded per tick and excluded for hidden, idle, completed-task and navigation screens.
- Milestones award 100 explorer XP once. Replaying a quest or refreshing cannot multiply XP or award completion coins. Camp upgrades are additive milestone cosmetics.
- Migration preserves synthetic V2 balances, ownership, skill records, weekly data and unknown fields. The preview intentionally has no import or account-linking flow for personal records.

## Defects found and corrected

Rapid taps originally raced asynchronous saves. Writes now queue under a same-origin Web Lock; tests wait for the save transaction rather than assuming click delivery means persistence. V2 visual tools needed their original presentation-mode adapter. Small-screen grid intrinsic sizing caused horizontal overflow and was corrected. Final algebra/mines restoration stages gained distinct artwork. Suspended quests and latest-activity resume were added to avoid losing context when switching activities. Floating-point rounding at earned-minute boundaries was corrected. Corrupt saves now remain preserved with an explicit warning.

## Outstanding issues and release limits

- **Safari/WebKit untested.** Playwright WebKit installation failed with HTTP 403 `Domain forbidden` at `cdn.playwright.dev` and `playwright.download.prss.microsoft.com`. No proxy bypass was attempted. Physical iPad Safari is still required; Chromium touch emulation is not a Safari pass.
- **Staging cloud acceptance not run.** No separate staging Supabase project is configured. Real V3 login/PIN, sync/conflict recovery, parent bonus awards, server coin spending, cross-family RLS and retries remain release-blocking integration work. Existing V2 mocked reward regressions pass, but they do not prove live staging security. The V3 parent screen is expressly a fictional summary and has no privileged actions.
- **Offline persistence is device-local.** The already-loaded app works without a network, but there is no service worker for a cold offline launch, cross-device sync or recovery after clearing browser storage. A browser without Web Locks is limited to one Test Camp tab and shows a warning on saves.
- **Content depth:** three repeatable puzzles per world are playable. Optional boss/gateway challenges, more quest variants and deeper narrative are follow-up work. Practical Maths Town remains backlogged.
- **Acceptance pending:** automated accessibility and visual checks cannot replace a physical iPad review or the single family acceptance session. See `V3-PREVIEW.md` for the consolidated 20–30 minute walkthrough.

All final automated checks pass. This change must remain draft/unmerged until review and explicit release approval.

## Reproduction and evidence

Run `npm ci --cache /tmp/jaxon-npm-cache`, `npm test`, then `npm run test:e2e`. Chromium is expected at `/usr/bin/chromium`; change the explicit path for another machine. No production environment variables are needed.

- `tests/artifacts/v3-unit-results.txt`: complete offline regression output.
- `tests/artifacts/v3-browser-results.json`: machine-readable Playwright results and timing.
- `tests/artifacts/v3-protected-files.json`: protected-file hashes and unchanged checks.
- `tests/artifacts/*-home.png`, `*-camp.png`, `phone-quest.png`: actual browser screenshots inspected for layout.
- `docs/V3-PREVIEW.md`: preview startup and single final acceptance session.
- `docs/V3-NEXT-STEPS.md`: staging, Safari and release follow-up.
