# One main map per area

Base: verified current release/ipad at 914724a6a9fc4cb199b9c38c607af8a6dd6f2934. Development branch: codex/single-area-maps. The separate cooking PR is not included.

## What changed

Every area now starts with its existing normal world map and a compact **Repair and restoration challenge** panel. The panel shows the next incomplete stage, its maths and starting-point prerequisites, the existing recommended next step, and saved stage progress. **Open repair challenge · stages and saved progress** expands the existing three-stage flow using a native keyboard-accessible disclosure with a visible focus outline.

Town's duplicate top repair map is removed. Its normal building map moves into the overview; the released Home exterior selector stays available under Optional exploration. The other eight areas keep their existing normal map artwork and mission pins, with repair-object overlays shown in challenge scenes rather than on the main screen. All map artwork, mission routes and repair stages are retained.

Pausing a restoration challenge returns to its own area screen. The existing pause mechanism still records the exact activity, question, tools and resume route. Home and World map remain explicit destinations. Normal lessons and other activities retain their existing pause destination.

## Preservation and limits

No restoration engine, assessment gate, adaptive placement, task-generation, save/recovery, reward, account or database source is changed. Historical task snapshots, stage IDs, milestones and completed evidence use the existing code. No resets or migrations are needed. All browser fixtures are fictional; private requests are intercepted and the public demo is browser-only with external traffic blocked. No hosted accounts or learner data are accessed.

Desktop, iPad portrait, iPad landscape and small-touch dimensions are emulated in Chromium/Edge. Physical iPad Safari acceptance is not claimed. This branch is for review only; no merge or deployment.

## Verification and review materials

The focused matrix checks all nine areas in both actual private-fixture and demo build paths: one main map, prerequisites, a real repair-task answer, exact unfinished resume after pause and reload, same-area return, completed recaps and retained completion evidence. Separate guard checks cover pausing another activity while an unfinished repair exists.

Commands: npm run test:area-maps; npm test; node tests/guided-progression.cjs; node tests/save-recovery.cjs; node tests/v3-cloud.cjs. The area suite is added to the normal required CI workflow, without removing or weakening existing checks. Full screenshot evidence for all four sizes is uploaded with that workflow.

- [Before/after gallery for all nine areas](review/area-maps/GALLERY.md)
- [Machine-readable results](review/area-maps/TEST-RESULTS.json)

Local result: **72/72 area cases and 8/8 unrelated-pause guard cases passed**. All 16 guided progression/recovery logic groups, 4 save/recovery groups, 4 cloud-sync suites, npm regression checks and demo isolation build checks passed.
The existing real starting-point-to-repair gate regression also passed at all four sizes (4/4), without awarding independent mastery.
