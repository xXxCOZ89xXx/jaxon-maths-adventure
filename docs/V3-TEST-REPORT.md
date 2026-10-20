# Town architecture and eight-stage estate QA — 20 October 2026

Current implementation: `79bd9f3`; final screenshot tree: `624c9d6`; save-acknowledgement test correction: `b9b3b23`, branch `codex/v3-adventure-build`. PR #2 remains draft. [Changes, progression, compatibility and optional asset workflow](V3-TOWN-ESTATE-EXPANSION.md).

| Evidence | Actual result and scope |
| --- | --- |
| V2 / V3 logic | Three V2 regression scripts, 29 V3 engine/expedition/estate/cloud suites, presentation checks and synthetic migration/rollback rehearsal pass; includes five new estate suites |
| Local browser matrix | **93/93 passed**, no skipped/unexpected/flaky cases, desktop and iPad portrait/landscape Chromium. Final keypad/shaft/project-label refinements followed this run; the hosted matrix covers the final frozen tree |
| Database security | **14 real isolated PostgreSQL suites passed**, network-disabled container and fictional Auth claims; not hosted Supabase certification |
| Visual capture | **74 fresh fictional game captures**, no overflow, console/rendering errors or external requests; **92-image album** with earlier comparisons and mocked parent screens retained |
| Packaged gallery | Complete/worlds/Town/old comparison/estate/estate comparison/architecture pages decode **92/18/19/14/8/5/17 images**; no errors or external requests. New pages fit desktop and both iPad orientations |
| Build and preservation | Configured staging build/sign-in/PIN/assets/nine worlds/40 items pass; fixture preparation preserves deployable bytes. All five protected live/V2/SQL hashes match their original baseline; configured public key absent from tracked files |
| Hosted final Chromium/WebKit | **Passed 124/124 cases**, including iPad WebKit; [run 39475831278](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39475831278), final tested tree `b9b3b23`. Decoded job logs report 124 passed (9.7m); logic/build/PostgreSQL/preview packaging all passed |
| Owner-private deployment | **Version 4 deployed successfully**, same [private HTTPS URL](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/); one owner, no groups or external visitors, rechecked after deployment |

New browser checks exercise all eight Town entrances and exact-task-preserving exterior/interior switches, every earned camp stage, all key machinery, compatible equipment/rewards, reload persistence, reduced motion, one-time celebrations and preview-only stage selection. Existing activity tests verify no credit through camp/navigation/decorations; teaching, independent mastery, PINs, permissions, family isolation, cloud save/recovery, CAS/offline queues, bonus coins and purchases retain their coverage.

Actual read-only network result: all four environment values validate against `sfogrvedypgtxfvecmbx` / `https://sfogrvedypgtxfvecmbx.supabase.co`; the public key is present and redacted. The proxy returns **CONNECT 403 before contacting Supabase**, so live identity, anonymous table restrictions and authenticated operations are not independently verified here. No credentials or staging learner records were requested, read or reset. Owner-reported hosted checks remain separate evidence; intercepted browser responses and fictional PostgreSQL claims are explicitly isolated tests.

Current machine evidence is `tests/artifacts/v3-estate-results.json`, retaining all 93 actual local case names/statuses/timing, plus `v3-estate-gallery.json` and `v3-estate-gallery-layout.json`. Historical generic browser artifacts remain historical. Current image deliverables are in `tests/visual/after/`, including all eight exteriors, all eight camp stages and representative iPad activities.

The final private archive matches all **122** built application files byte for byte. Pushed Site source: `09002c0fefce666f7994569d8579a89458b83bc3`; local tar SHA-256: `d7c533d8242b95908b804db456dfad5929661bb83c5f056c95723a2f60f29528`. Deployment: `appgdep_6ad7b48dd36c8191b107670c710aac55`; saved version: `appgprj_6ad746f124fc8191b3f3845f9dff577b~appgver_c0dcd942c9e88191bc6603bdb38868e9`. Native saved-version provenance matches that source commit. The native archive reports 123 files including hosting manifest and content hash `sha256:e2410b7ce04abdd94c2c0633a73ae515147fce080c2ac53ab49ef90ce7eabeb7`; this is separate from the supplied tar SHA-256. Independent remote-archive byte comparison is unavailable. Native deployment success and owner-only audience are verified; packaged pages were tested locally.

The first hosted run passed 121 cases, including every WebKit case, but three Chromium variants of an existing camp-navigation test read the initial local storage before the asynchronous Web Locks save completed. The test now awaits the persisted Camp view instead of treating click completion as a save acknowledgement. All three corrected cases pass locally; the final full hosted result is recorded above. Application/build bytes did not change for that correction.

No known new functional defect remains from automated QA and screenshot inspection. Physical iPad Safari/performance, actual cross-device/offline recovery, direct hosted API enforcement and deferred recovery delivery remain for the existing combined family session later. No additional manual test is requested now. Production, real records, main, live homepage and GitHub Pages are untouched.

Prior iteration reports below are historical.

---

# Immersive world stages and interactive camp — 20 October 2026

Current game code: `924718d` on `codex/v3-adventure-build`; PR #2 remains draft. [What changed and remaining custom-asset work](V3-IMMERSIVE-ADVENTURE.md) · [seven paired comparisons](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/compare.html).

| Evidence | Result / scope |
| --- | --- |
| V2 / learning / gameplay / sync | All three V2 regression scripts, 24 V3 suites, display/recovery tests and synthetic compatibility/migration/rollback rehearsal pass |
| Local browser matrix | **84/84 passed**, 0 skipped/unexpected/flaky, final code tree; desktop, iPad portrait and landscape Chromium, including contrast/keyboard/touch and learning-record/reward preservation |
| Additional small-screen check | Camp entrances at 390px are at least 44px and do not overlap; keyboard links reach usable displays. Also covered by the full matrix |
| Database security | **14 real isolated PostgreSQL suites pass**, network-disabled Docker and fictional Auth claims; no hosted Supabase authentication or RLS certification |
| Visual QA | **52 fresh fictional game captures** across three layouts; **67-image album**, including three mocked parent dashboards, five older comparisons and seven preserved foundation images; seven new before/after pairs |
| Packaged gallery | All **67 / 18 / 16 / 14** images decode on complete/worlds/Town/comparison pages; no broken resources, console errors or external requests |
| Staging build | Pinned project/URL/key validation (key redacted), complete sign-in/PIN entry, nine worlds, 40 catalogue items and assets pass. Fixture preparation cannot overwrite deployable files |
| Protected files | All five original live/V2/SQL SHA-256 hashes unchanged; configured publishable key absent from tracked GitHub files |
| Hosted Chromium / WebKit | **Passed 112/112 cases**, including iPad WebKit; [run 39440319406](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39440319406), final code `924718d`; decoded hosted job logs report 112 passed (9.0m). All logic/build/PostgreSQL steps passed. |
| Owner-private Site | **Version 3 deployed successfully**, same [private URL](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/); one owner, no groups or external visitors. |

New functional checks verify all bridge destinations fit without horizontal scrolling, a changed destination moves the explorer and survives reload without granting mastery/milestones, camp keyboard entrances never earn coins/time, and all eight original worlds' scene entrances open actual expeditions. Existing learning, gateway, Town, PIN/login/lock, parent roles, family isolation, cloud retry/CAS/offline queue, bonus and purchase checks continue. Review found and fixed low-contrast workbench copy, missing earned-structure labels, a hidden tablet Save & exit control and potential phone camp-target overlap.

Actual read-only staging audit: all four configured variables validate against `sfogrvedypgtxfvecmbx` and `https://sfogrvedypgtxfvecmbx.supabase.co`; the publishable key is redacted. The environment proxy rejected CONNECT with **403 before contacting Supabase**, so no live identity/table-denial or authenticated success is claimed. Existing owner-reported hosted sign-in/PIN/save/bonus/shop/family-separation checks remain separate evidence. No credentials were requested and no live learner records were read.

Current compact machine evidence is `tests/artifacts/v3-immersive-results.json`, with all 84 local case names/project/statuses and actual timings; packaged-gallery checks are `v3-immersive-gallery.json`. Full hosted artifacts belong to the linked workflow run. Earlier generic `tests/artifacts/` captures/reports remain historical; current visual deliverables are `tests/visual/after/` and `tests/visual/compare.html`.

The final private archive matches all **93** built files byte for byte. Site source `945512d84b4c2e7e70bec5c5341e76eb2cab235a`; archive SHA-256 `fb225af07a673a55535c5a42d3d311ba8421fadf6b997d243097d5df39cae1df`. Deployment `appgdep_6ad77f0512388191a3e9bd57a0c19164`; saved version `appgprj_6ad746f124fc8191b3f3845f9dff577b~appgver_e936893be2f08191ad0ea49efbbeb55a`. Native source provenance matches the pushed Site commit. The native archive content hash is `sha256:ed09714178a6a403348b309d39429348b2c314e8f628cb4a9e2e2a3f1ea38e5f` (94 files including hosting manifest); this is recorded separately from the supplied local tar SHA-256. Native archive download was unavailable, so independent remote-byte comparison is not claimed. Deployment success and owner-only access are verified by native Site results; packaged pages were browser-tested locally.

Physical iPad Safari, actual cross-device/offline recovery and direct hosted API security remain in the existing single combined acceptance plan. Optional custom character pose sheets, unique landmark machinery/interiors and individual keepsake art are documented, rather than presented as completed assets. No additional manual session is requested now. No production records/schema/settings, GitHub main, live homepage or GitHub Pages changed.

The prior reports below describe earlier versions.

---

# Visual redesign, reliability and release-preparation QA — 20 October 2026

Current code: `1a1b63b` on `codex/v3-adventure-build`; PR #2 remains draft. [Visual review](V3-VISUAL-REVIEW.md), [independent code/security review](V3-RELIABILITY-SECURITY-REVIEW.md), [one outstanding-issues list](V3-OUTSTANDING-ISSUES.md) and [unexecuted production plan](V3-PRODUCTION-RELEASE-PLAN.md).

| Current evidence | Result / scope |
| --- | --- |
| V2 regressions / V3 curriculum-gameplay-sync | 3 V2 scripts and 24 V3 suites pass; 55 skills, 1,100 discovery questions, exact saved state and compatibility preserved |
| New display/release checks | Display-only coin/time/date/recovery helper tests and fixed synthetic historical-data migration/rollback rehearsal pass |
| PostgreSQL security | 14 actual disposable network-disabled PostgreSQL suites pass, using fictional Auth claims; no hosted Auth/PostgREST or real accounts |
| Full local Chromium browser run | 75/75 passed; 0 skipped, unexpected or flaky; desktop/iPad portrait/landscape. Later skyline-only polish is captured again and covered by final hosted CI |
| Activity/recovery/award additions | Genuine control change required for a bounded activity window; no idle pointer/Tab/no-op/menu/refresh credit; hidden/queued state checks; one mocked 429 recovery request without retry; lost parent award retains exact immutable intent after reload |
| Visual capture | 52 game captures pass overflow, console/rendering and blocked-network checks, plus 3 fictional parent captures and 5 old-design comparisons: 60-image static album. Actual rendered scenes/contact sheets inspected; floating skyline windows and sign overlap corrected |
| Build guards | Complete configured staging build and all assets/PIN/sign-in/nine worlds/40 items verified; fictional preparation cannot replace any deployable byte |
| Dependency / protected files | npm audit: 0 vulnerabilities; all 5 original protected live/V2/SQL hashes unchanged |
| Hosted Chromium/WebKit | **Passed** [final run 39431994656](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39431994656): **100/100 Chromium/WebKit browser cases**, all logic/rehearsal/build/PostgreSQL checks for final code `1a1b63b` |
| Existing private staging | **Version 2 deployed successfully** at the existing private URL; source `e168af86`, saved-version provenance and matching archive verified. Access rechecked: owner only, no groups/other viewers/external visitors |

The packaged gallery browser check decoded all 60 index images, 18 restoration images and 16 Town images without broken resources, console errors or unexpected external requests. Hosted success/count are verified from run/job state and the 100-passed annotation, not a downloaded hosted browser JSON. Deployment `appgdep_6ad7706e30e48191b49c776a87921383`, saved version `appgprj_6ad746f124fc8191b3f3845f9dff577b~appgver_8b3e96e735e081919be6d68e67967929`, Site-source SHA `e168af86d731cea6d646a97614735b375e20f7b1`, archive SHA-256 `4359854a2db8f7c9e35264bf929f40e851d1c4828359c080b622cf49bd708df8`. Current machine evidence: `tests/artifacts/v3-visual-redesign-results.json` and `v3-visual-hosted-ci.json`.

Owner reports successful real staging account/PIN/lock/refresh/bonus/purchase and visible two-family separation. The agent did not use those accounts, read their progress or send live recovery requests. Direct hosted API/RLS, actual recovery delivery, physical iPad Safari and cross-device acceptance remain pending, consolidated for later rather than requested now. Browser cloud responses are intercepted fictional APIs; isolated SQL uses emulated signed claim context. The synthetic backup/rollback exercise is not a production-data rehearsal.

Production records/schema/settings, the live homepage, GitHub Pages and GitHub main were not touched. Optional custom-art briefs and honest 2D/performance limits are in the visual review. The pre-iteration test reports below are historical.

---

# Private staging activation QA — 20 October 2026

The owner-completed staging database configuration is now built and deployed at the [owner-private HTTPS site](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site). Only the owner is allowed; no groups or external visitors. [Setup, exact live limits and one combined two-family/iPad session](V3-STAGING-ACTIVATION.md).

| Current run | Result and scope |
| --- | --- |
| Cloud configuration | Both project refs and URL match `sfogrvedypgtxfvecmbx`; public key present, accepted by validator, never printed and absent from tracked GitHub files |
| Live identity RPC | **Blocked** by proxy CONNECT 403; no Supabase response, no live authenticated tests, no hosted-RLS success claimed |
| V2 regression | **3 scripts passed** |
| V3 learning/gameplay/sync | **24 suites passed**, including 55 skills, 4,466 generated task instances, preserved V2 data and immutable retry/CAS conflicts |
| Actual isolated PostgreSQL | **14 security suites passed**; expanded assertions check all eight RLS-enabled tables against anon and all four fictional family actors, anonymous RPC restrictions, role PIN lengths, permissions, rewards, recovery and concurrency |
| Full local browser suite | **66/66 passed**, 0 skipped, flaky or unexpected; desktop and iPad portrait/landscape Chromium; about 4.9 minutes. Cloud responses are mocked |
| Staging build and fixture isolation | **Passed**: complete asset/syntax checks, sign-in/PIN entry, nine worlds, 40 items; mock preparation cannot replace any deployable bytes |
| npm audit | **0 vulnerabilities** |
| Protected file integrity | **5/5 original hashes retained**: live homepage, V2 page, old adapter and two old SQL drafts |
| Local WebKit / physical Safari | WebKit download blocked by proxy 403; physical iPad Safari not run |
| New hosted Chromium/WebKit CI | **Passed** [run 39411280360](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39411280360): **88/88 Chromium/WebKit cases**, all 14 PostgreSQL/24 V3/3 V2 checks and build checks, for code commit `cf2ddc1` |

The initial browser run was interrupted after changing fixture output paths; the table reports only the completed clean rerun. The final deployed static assets match `staging-dist/`. Native hosting deployment/access verification proves the private deployment, not live game authentication or Supabase RLS. No production records, accounts, schema, GitHub Pages settings or live entry points were changed. PR #2 remains draft and unmerged.

Hosted success and the 88-case count were verified through run/job state and the test-result annotation. Artifact storage download is blocked by the Cloud proxy; the hosted browser JSON was not downloaded. The [QA artifact](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39411280360/artifacts/12260320684) remains available through GitHub.

Machine-readable current evidence: `tests/artifacts/v3-staging-activation-results.json`, `v3-live-staging.json` and `v3-browser-results.json`. Text logs: `v3-staging-security-results.txt`, `v3-staging-unit-results.txt`. Existing reports below are historical; their earlier setup instructions and "nothing deployed" statements describe those earlier runs.

---

# Secure integration continuation QA

Date: 20 October 2026. Branch: `codex/v3-adventure-build`, draft PR #2. **Implementation is tested with fictional data; no hosted Supabase staging acceptance has occurred.**

| Layer | Completed local result | Scope |
| --- | --- | --- |
| Existing V2 regression scripts | 3 passed | Original learning/discovery/shop integrity |
| V3 gameplay/state logic | 20 suites passed | 55 skills, 123 mission/level combinations, 4,466 task instances |
| Durable cloud sync | 4 suites passed | Fail-closed config, response-loss retries, concurrent flush, full-state conflicts, corrupt-cache preservation |
| Actual PostgreSQL security | 14 suites passed | Migration guard, bcrypt/PIN cooldown, server unlocks, family/RLS boundaries, role checks, idempotent wallet, CAS concurrency, parent-reviewed offline credit, PIN recovery/revocation |
| Full Chromium browser regression | 60/60 passed | Desktop, iPad portrait and landscape; existing gameplay plus initial five cloud/preview cases per project |
| Final cloud/preview browser checks | 21/21 passed | Seven cases per Chromium project, including PKCE recovery, live shop-balance refresh and explicit conflict handling |
| Final parent-evidence refinement | 3/3 passed | Real curriculum IDs; guided/fresh/struggle evidence distinct; offline-time confirmation and accessible controls |
| npm dependency audit | 0 vulnerabilities | Installed lockfile at test time |

The focused browser passes overlap the full run; they are not 84 distinct local cases. The current complete suite contains **66 distinct Chromium cases**, or **88 with the hosted iPad WebKit project**. Final hosted [run 39385393158](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39385393158) passed **all 88 browser cases, including WebKit, all 14 PostgreSQL security suites, all 24 V3 logic/sync suites and all three existing V2 regression scripts** for code commit `986b345962c0a5d821fe22ea46c884d677a07378`. All workflow steps succeeded, and the [playable preview artifact](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39385393158/artifacts/12247702744) was uploaded. Synthetic API responses test the official client and UI; they do not test actual Supabase Auth or PostgREST. The PostgreSQL container uses `--network none` and emulates Auth claim context; no hosted database, real identity or production network request is involved.

Verified fixes include the generated staging lock controls, a Supabase thenable being mistaken for a Promise during locking, a header ARIA role, stable PIN/recovery forms, a correctly labelled parent action selector, hidden navigation overriding CSS display, server-wallet refresh during an open shop, revision rechecks before remote replacement, and database readiness against the final TCP listener rather than PostgreSQL's temporary initialization socket. Tests allow fractional server-time credit without assuming a CI command completes within one second. A final hardening uses a monotonic server reward clock even when an earlier transaction acquires the wallet lock later. The new delayed-transaction regression passes the fix and was verified to fail the old implementation.

Preview delivery is now `preview-dist/PLAY-V3.html` plus README in the **v3-offline-playable-preview** Actions artifact. All scripts/styles are embedded; scripts have CSP hashes and cloud `connect-src 'none'` remains. A browser test verifies no asset or cloud requests after loading the single HTML. Local `file://` navigation is blocked by this managed Chromium's administrator policy, so actual file opening is not claimed as tested. Local WebKit downloads again returned HTTP 403 `Domain forbidden`; no restrictions were bypassed. Hosted CI successfully installed and tested WebKit using its normal runner environment.

**Remaining release gates:** provision/verify/authorise a separate `jaxon-maths-v3-staging` project; test real Auth AMR/password/PIN recovery, email, token refresh, hosted SQL/RLS and multi-device operation; physical iPad Safari and one family acceptance session. Offline learning evidence queues, but rewards for offline minutes need explicit parent review/confirmation. Cold-offline asset caching and multiple children per parent are not implemented. Client-reported academic/activity evidence is not cryptographic anti-cheat. See `V3-SECURE-STAGING.md` for exact setup, security limits and the one consolidated walkthrough.

Main, both protected game entry points, the old adapter and both existing database drafts remain unchanged. Nothing was deployed, merged or connected to production.

---

## Earlier nine-world gameplay milestone (historical report)

# Nine-world V3 development QA

Date: 20 October 2026 (Europe/London). Branch: `codex/v3-adventure-build`, continuing draft PR #2 from milestone `bc30d1940d51fb7b234bb8cf1e8e2a518c2db5cf`.

Hosted CI passed **45/45 browser cases in 3.8 minutes**, plus all offline logic checks, for gameplay commit `3481b767eec8bd19f6fe8e561c23c1d30889cafd`: [successful run](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/actions/runs/39355378027). The final Node coverage is nine learning/state suites plus eleven expedition/practical suites, alongside three V2 baseline scripts.

This report covers the expanded fictional **offline development build**. It does not certify a production-connected release. No real learner account, backup, history or Supabase row was used.

## Automated results

| Layer | Result | Coverage |
| --- | --- | --- |
| Branch and PR verification | Passed | Fetched existing development branch; PR #2 remains draft and targets main |
| V2 baseline regression scripts | Passed, 3 scripts | Original 39 skills, 4,680 generated review samples, 780 discovery questions, mocked reward/role boundaries |
| V3 learning/state logic | Passed, 9 suites | All 55 skills, all 1,100 discovery questions, fresh/spaced evidence, guided/mastery separation, legacy migration, active time and 40-item catalogue |
| Nine-world expedition logic | Passed, 11 suites | 123 route/level combinations across 12 repeat seeds; **4,466 generated tasks** solved; teaching gate, suspended visits, varied seeds, finite XP/collections, move validation, camp projects and durable badges |
| Browser end-to-end | Passed, 45/45 hosted CI; local full 42/42 + focused 15/15 | 15 cases each at desktop, iPad portrait and iPad landscape sizes |
| Automated accessibility | Included in browser results | axe WCAG 2 A/AA + 2.1 AA checks, including active new control types, Town, Camp, keyboard/focus, reduced motion, touch sizes and phone/iPad overflow |
| Packaged preview smoke | Passed | Extracted latest ZIP, local assets and a playable Town task |
| Protected-file integrity | Passed, 5 files | Homepage, V2 page, secure adapter and SQL files byte-for-byte unchanged |

Runtime: Node 24.19.0, Playwright 1.64.1, Chromium 154.0.8037.57 on Debian 13. Desktop viewport 1440×1000; iPad portrait 820×1180 and landscape 1180×820 with touch/mobile emulation; phone checks at 390×844. These are Chromium tests, **not Safari/WebKit tests**.

## Browser matrix

The same fifteen cases run in each viewport:

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

15. Higher-level negative coordinates and clockwise/anticlockwise turn composition, with known expected positions and final orientations.

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
- Best-value shopping alternates the cheaper pack across return visits. Higher cinema levels compare eligible single tickets with pair offers. Fixed cost/quantity examples and a browser smoke check verify those choices.
- New travel/timetable/activity check generators vary the quantities that determine the answer; 2,880 practical question samples are checked for answer variety. Workplace saving goals also vary across return visits, with explicit teaching about rounding up whole weeks.
- Mission seed mixing was corrected so three tasks within a visit use distinct values, including gateways. Higher levels now add negative coordinates and composed turns; fixed mathematical examples and UI playthroughs verify them.
- Move validation rejects invalid amounts, counterfeit denomination values and out-of-sequence ledger posting.
- Migration now defends the new mission extension; saved task state and one-time rewards are tested across reloads, world switches and concurrent tabs.

A further hosted run exposed a keyboard-focus race during queued saves. Rendering now restores the control focused when the transaction executes, rather than returning focus to the previously clicked control. The keyboard resume test deliberately holds a Web Lock, moves focus while the save is queued, releases it and verifies that the intended next control retains focus. Preference changes keep their native controls intact while saving. Six focused keyboard/preference cases pass across all viewports.

Initial hosted CI exposed a preference-test timing race in all three viewports: the test reloaded after changing the checkbox but before the asynchronous device save had completed. It now waits for the persisted motion/sound value before reloading; the app explicitly announces preference saving. GitHub failure annotations now expose exact errors through the supported API, and a concurrency group avoids duplicate push/PR runs.

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
- `tests/artifacts/v3-hosted-ci.json`: successful hosted-run metadata and 45-case summary.
- `tests/artifacts/v3-protected-files.json`: unchanged protected-file hashes.
- Screenshots: home/camp, Town/collection in each viewport and phone quest.
- `V3-CONTINUATION.md`: gameplay/state scope.
- `V3-PREVIEW.md`: local preview and consolidated acceptance.
