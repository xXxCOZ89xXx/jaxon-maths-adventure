# Nine-world V3 development QA

Date: 20 October 2026 (Europe/London). Branch: `codex/v3-adventure-build`, continuing draft PR #2 from milestone `bc30d1940d51fb7b234bb8cf1e8e2a518c2db5cf`.

This report covers the expanded fictional **offline development build**. It does not certify a production-connected release. No real learner account, backup, history or Supabase row was used.

## Automated results

| Layer | Result | Coverage |
| --- | --- | --- |
| Branch and PR verification | Passed | Fetched existing development branch; PR #2 remains draft and targets main |
| V2 baseline regression scripts | Passed, 3 scripts | Original 39 skills, 4,680 generated review samples, 780 discovery questions, mocked reward/role boundaries |
| V3 learning/state logic | Passed, 9 suites | All 55 skills, all 1,100 discovery questions, fresh/spaced evidence, guided/mastery separation, legacy migration, active time and 40-item catalogue |
| Nine-world expedition logic | Passed, 8 suites | 123 route/level combinations across 12 repeat seeds; **4,466 generated tasks** solved; teaching gate, suspended visits, varied seeds, finite XP/collections, move validation, camp projects and durable badges |
| Browser end-to-end | Passed, 42/42 | 14 cases each at desktop, iPad portrait and iPad landscape sizes |
| Automated accessibility | Included in browser results | axe WCAG 2 A/AA + 2.1 AA checks, including active new control types, Town, Camp, keyboard/focus, reduced motion, touch sizes and phone/iPad overflow |
| Packaged preview smoke | Passed | Extracted latest ZIP, local assets and a playable Town task |
| Protected-file integrity | Passed, 5 files | Homepage, V2 page, secure adapter and SQL files byte-for-byte unchanged |

Runtime: Node 24.19.0, Playwright 1.64.1, Chromium 154.0.8037.57 on Debian 13. Desktop viewport 1440×1000; iPad portrait 820×1180 and landscape 1180×820 with touch/mobile emulation; phone checks at 390×844. These are Chromium tests, **not Safari/WebKit tests**.

## Browser matrix

The same fourteen cases run in each viewport:

1. Three-choice home, skip/replay tour and nine-world map; complete the original eight introductory quest loops and all 24 original restoration puzzles, reload and inspect camp.
2. Exact mid-quest save/resume with selection/help and keyboard solution.
3. Guided lesson, visual tools, unseen independent questions, exclusion of assisted answers and required reteaching after failure.
4. All 40 wardrobe items, buy/equip persistence, outfit visibility across screens, sensory preferences and fictional parent summary.
5. Concurrent-tab purchase: one ownership entry and one coin charge.
6. Navigation focus, minimum touch targets, reduced motion and responsive overflow.
7. Adaptive discovery, supported/skipped answers, offline interactions, reconnect/reload and unchanged synthetic V2 storage sentinel.
8. Active time accrues; simulated hidden/visibility-change and idle time stop earning. Headless tab visibility is unreliable, so visibility is explicitly simulated rather than claimed as a physical browser-tab test.
9. Corrupt demo save is preserved with a temporary-session warning.
10. All eight Town locations: teach each task, use real UI controls, complete shopping/offers/change, café/bill sharing, bank ledger/savings, discounts/budget, journey/clock, household bills/measures, leisure and workplace tasks; restore Town, earn keepsakes, place one at camp and reload.
11. Optional gateways in all nine worlds at level two, then replay a gateway with fresh values; no duplicate milestones or record rewards.
12. Freely select level three, preserve exact basket/help, switch worlds, reload/Continue, then restore the suspended visit; inspect the phone layout.
13. New Town lesson and unseen independent check: guided work stays learning; a fresh pass establishes practice rather than spaced mastery; immediate retake is disabled.
14. Queue concurrent completion from two tabs under a held Web Lock; exactly one milestone/record is written. Camp project remains unavailable without its required evidence.

A focused additional browser smoke check verifies that new parent activity entries show the fictional world, venue, level and support. A read-only GitHub Actions workflow is included to rerun offline tests and Chromium gameplay on code changes; remote CI status is available on PR #2.

Axe scans include the first encountered interactive mission renderer of each type in Town/gateway playthroughs, not only the completed recap. All browser contexts and fixtures are synthetic and isolated. The harness aborts every nonlocal request and fails on attempted external requests, runtime/console errors or reported CSP violations. V3 additionally uses `connect-src 'none'` and has no cloud adapter.

## Integrity checks

- Every mission task begins with an explanation and easier example. Submitting while still in teaching mode is rejected.
- Wrong plans remain editable and show supportive worked teaching. Help changes the support record; it cannot become independent academic mastery.
- Only separate fresh, first-answer checks can establish independent practice, with delayed checks required for mastery. All 55 skills run through that pipeline in logic tests.
- A world/route/level has one completion milestone, regardless of attempt seed or repeats. A world/route has one keepsake across levels. Repeated scene clicks, decoration and project-building do not grant XP or completion coins.
- There are 123 finite mission/level reward IDs, 41 keepsake IDs, and the retained original 24 restoration milestones. Gameplay recommendations use recent mission support; they are not labelled independent assessment.
- The weekly target remains 60 active minutes. Screen-time remains 1:1; learning coins remain ten per active minute. Exercise balances, purchase baskets, bills, change and wages never touch that economy.
- The existing V3 save envelope/namespace stays compatible. A versioned `adventure` extension stores active and suspended task specs, seed, values and help state. Legacy V2 and earlier V3 skill, ownership, currency, weekly and unknown fields are preserved. Malformed new mission/record fields are discarded without losing those older fields.
- Earned academic celebration badges persist after later struggle while current skill mastery can correctly return to learning. Camp projects and keepsakes are additive.

## Defects corrected during this continuation

- Lower-contrast gateway copy and locked camp labels were corrected after axe reported them.
- Phone counters/envelopes were reorganised to retain 44px controls without overflowing.
- Native arrival-time input replaced an awkward minutes-after-midnight editor.
- Town lessons are collapsed behind a clear curriculum entry instead of exposing sixteen skill cards immediately.
- Practical assessment generators use integer-pence arithmetic and supplied fictional rates/deductions; question choices remain distinct and answer keys valid.
- Move validation rejects invalid amounts, counterfeit denomination values and out-of-sequence ledger posting.
- Migration now defends the new mission extension; saved task state and one-time rewards are tested across reloads, world switches and concurrent tabs.

Development test-harness fixes included selecting explicit difficulty after adaptive suggestions changed, targeting feedback rather than native output elements, returning to the map before visiting another world, and correcting an accidentally recursive test helper. These were fixed before final QA; they are not outstanding product defects.

## Outstanding release limits

- **Physical iPad Safari/WebKit:** not tested. The previous installation attempt was blocked by HTTP 403 `Domain forbidden` at Playwright download hosts. This continuation did not bypass network policy. Chromium mobile/touch emulation does not prove Safari behaviour.
- **Separate staging cloud:** not configured. V3 real login/PIN, cloud save/conflicts, cross-family RLS, server-side rewards and spending/retry integration remain untested and release-blocking. Existing V2 mock tests do not substitute for staging security validation. The V3 parent page is a fictional local summary with no privileged actions.
- **User acceptance:** the expanded one-session walkthrough is ready in `V3-PREVIEW.md`; no repeated family sign-offs were requested. Physical touch comfort, narrative appeal and suitability of difficulty/examples still need that consolidated review.
- **Offline limits:** loaded interactions work offline. Cold-offline launch has no service-worker cache; device storage clearing loses this fictional save. Cross-device sync remains future staging work. Browsers without Web Locks are limited to one preview tab with a warning.
- **Content limits:** replay generators provide varied arithmetic within bounded activity templates. They do not claim an unlimited procedurally authored story or complete coverage of UK finance/payroll law. Bills, interest, fares, jobs and deductions are explicitly fictional, simplified learning situations.

Do not merge, publish a replacement homepage or change production Supabase without explicit approval. The offline development expansion and the production release are separate milestones.

## Evidence and reproduction

```sh
npm ci --cache /tmp/jaxon-npm-cache
npm test
npm run test:e2e
```

Local Chromium defaults to `/usr/bin/chromium`; set `V3_CHROMIUM_EXECUTABLE` for another installation. GitHub CI uses Playwright’s installed browser. No cloud credentials are required.

- `tests/artifacts/v3-unit-results.txt`: complete baseline and V3 logic output.
- `tests/artifacts/v3-browser-results.json`: machine-readable results/timing.
- `tests/artifacts/v3-summary.json`: consolidated results and preview checksum.
- `tests/artifacts/v3-protected-files.json`: unchanged protected-file hashes.
- Screenshots: home/camp, Town/collection in each viewport and phone quest.
- `V3-CONTINUATION.md`: gameplay/state scope.
- `V3-PREVIEW.md`: local preview and consolidated acceptance.
