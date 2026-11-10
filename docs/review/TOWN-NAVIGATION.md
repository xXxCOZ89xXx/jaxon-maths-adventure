# Town navigation and full-width map — review report

Base: `release/ipad` at `7955861433337b61ba5bde28ae030c8f3325c935` (verified again during final validation). Feature branch: `codex/town-navigation-layout`. Development only: no release PR, merge or deployment.

[Before/after gallery](town-navigation/GALLERY.md)

## Reproduction and cause

The exact released build was archived and built separately. Fully assessed fictional saves opened all nine listed destinations plus Town Festival at Levels 1–3 in both the production and public demo builds. This did **not** reproduce an unconditional broken generator, overlay intercept or dead click handler.

A legacy fictional save with completed Level 1 Supermarket and Shopping Centre visits, no completed Bank visit, and incomplete Number Forest/Town starting points reproduced the private build's unavailable controls. The central starting-profile policy disables mission actions. Previously the nearby Visit/Gateway controls only exposed a generic tooltip; the actionable starting-point notice was at the top of the long area page. Changing level correctly could not bypass that gate. Each locked Town control now visibly names every missing area and links to the next starting point. Native disabled semantics and assessment requirements remain intact.

The public demo deliberately permits exploration without completing the optional starting profile. Its corresponding legacy fixture was already able to enter these visits. This policy is preserved: it neither imposes the private admission gate on the demo nor fabricates completed assessment answers. Repair skill-discovery gates remain unchanged in both builds.

Two shared route-state hazards were also corrected. Without an explicit preference, the difficulty selector showed the world recommendation while individual Visit buttons used route-specific recommendations. Town Visit actions now use the displayed level and retain route recommendations as advice. Also, an older `pausedActivity` pointer had priority in Continue over a newly selected mission or completion recap. An explicit Town Visit now clears that transient pointer, preserving older saved runs and suspended snapshots. Unfinished visits resume their original task snapshot; completed visits replay at the selected level.

A fictional Node reproduction against the exact release confirmed the Continue hazard: selecting Supermarket and then continuing reopened the older paused travel-library plan while the market mission remained selected. The updated path continues the market mission and retains the older plan unchanged. This is also covered by a regression assertion.

Explicit Town Visit startup is atomic: a content-generation failure cannot partially replace current saved work and produces a visible explanation. Unknown routes and invalid legacy levels have explanations and working alternatives. Entering a destination does not award evidence, mastery or rewards.

## Layout and Festival

The existing Town map now occupies the full available content width. The repair entry follows the “A town full of possibilities” heading, rather than sharing the map's side column. There is still exactly one main map. Repair stages, recommendation, requirements, completed records and unfinished task snapshots use the existing flow.

The Festival uses the same admission and explicit Visit path as the other destinations. Available controls open the gateway route; blocked private controls name the starting points and provide a working prerequisite button. Tests exercise touch and keyboard entry, the first answer, exact reload, the complete supported answer flow, completion, Continue and replay.

## Validation

All fixtures are fictional. Production-path tests build the real production entry point with a fake public key and intercept authentication/storage services. The demo uses isolated browser storage, blocks external origins and has no cloud context. These are local build-path checks, not tests against a real learner or a hosted private session.

[Machine-readable test summary](town-navigation/test-results.json) · [All destination/level audits](town-navigation/destination-audits.json)

| Check | Result |
| --- | --- |
| New production/demo routing matrix, all four sizes | 40 passed; all 30 route/level combinations in each build/layout |
| Exact unchanged-release baseline audit/captures | 16 passed |
| Existing Town/curriculum/gameplay/save browser cases, final run | 31 passed; 1 existing landscape representative skip |
| Retained Town repair: gates, unfinished/completed resume, return | 8 passed, private/demo at all four sizes |
| Fictional production login/save-response-loss/resume/lock and cache recovery | 6 passed |
| Existing public-demo activity suite | 18 passed |
| Demo isolation and exact source/rebuild parity | Passed; desktop and both iPad layouts, no external requests |
| Before/after gallery capture | 16 passed |
| Existing café worker against unchanged release, current selectors/flow | 2 passed |
| npm test, including new visit audit | Passed; 30 combinations × 3 seeds, 594 tasks, atomic failure and state-preservation checks |
| Existing Town engine | Passed; 27 scenarios, 2,091 stages |
| Curriculum, gameplay/action coverage, save/recovery and cloud unit checks | Passed |
| Production packaging and isolated staging-build checks | Passed |

The route matrix covers Supermarket, Corner Café, Community Bank, Shopping Centre, Bus & Train Station, Neighbourhood Home, Cinema & Leisure, Workshop Workplace, the curriculum Town-day mission and Town Festival, each at Levels 1–3. It checks selected difficulty, a first answer, exact draft resume after returning/reload, completed Level 1 visits, unvisited Bank, invalid saved levels and private admission explanations. Separate full-flow cases complete and replay Supermarket/Festival while retaining unrelated paused work, records, purchases and assessment evidence.

Initial regression observations are retained for review. Old café test selectors failed on both the unchanged release and feature branch; these now use the current building entrance and assert the visible activity name plus saved employment scenario. An initial unchanged-release portrait run then failed its final-cash solved assertion, and one feature shopping run similarly failed after automatic answer progression. The Town test now accepts a solved task or verifies exactly one saved stage advance, avoiding a second submission into the following task; full completion, reload, replay and accessibility assertions remain. The final unchanged-release café and feature results are above. An unrelated measurement-to-algebra cross-tab case timed out once waiting for its heading, after passing earlier; it passed the final rerun without any change to that test or application route.

On Windows, existing Python web-server configurations were run through ignored local configs using the repository's loopback Node server and installed Edge. The permanent new suite is reproducible with `npm run test:town-navigation`; `npm test` includes its engine audit. Existing CI checks were not changed or weakened. No PR was opened, and this new feature branch is outside the existing push workflow filters, so GitHub required-check execution awaits a later authorised PR.

## Scope and limits

Runtime changes are confined to Town Visit admission/routing, its controls and map/repair layout in the shared app. The demo allowlist checker also normalizes Windows directory separators before comparing the exact inventory; its content, credentials, network and CSP checks are unchanged. Regression tests and review screenshots accompany the change.

No reward, account, database, backend, hosting or Access code/settings were changed. No real learner data was read or written. The separately reported parent-tab reward race is outside this change. Chromium/Edge device emulation is used for desktop, iPad portrait, iPad landscape and small touch screens. Physical iPad Safari is **untested**. PostgreSQL/Docker acceptance was not run; no SQL changes are included.
