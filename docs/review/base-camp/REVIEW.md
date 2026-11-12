# Base Camp review — 12 November 2026

Feature branch: `codex/base-camp-progression-refresh`. Started from verified `release/ipad` head `f1b88c95326e6ba5145e8abd97306df0431b3a1a`, which contains the last confirmed `9a63750a`. The initial checkout was clean on `work` at `0d0b026`; that branch was left intact. No release PR, merge or deployment is part of this task.

[Open the before/after screenshot gallery](index.html) · [Artwork inventory and style audit](ART-AUDIT.md) · [Complete proposed asset manifest](proposed-assets.json)

## Result

A new or reset save starts at **Base Camp Level 1** with **zero completed projects**, no placed keepsakes and no earned milestones. Loading or entering camp no longer promotes the home to a higher level. The learner earns the existing unique milestones, then chooses **Build Level N upgrade** to complete the current level and advance one level. Future level controls stay disabled; only earned homes can be previewed. The planner names the next upgrade, explains its features, shows the total and remaining milestones, and explains how to earn them.

The eight home thresholds remain `0, 4, 10, 18, 30, 45, 65, 85`. Home upgrades do not consume milestones. Project thresholds remain `12, 30, 60` for the greenhouse, lookout and noticeboard. Hints remain welcome, duplicate milestone IDs do not count twice, and repeated activities do not duplicate progress. Coins, XP rules, mastery, active learning time and 1:1 screen-time rewards are unchanged.

“Build something that stays” uses only actual saved `campProjects` completions. Reaching the homestead no longer marks the greenhouse as built. Planned pictures are explicitly labelled **not built yet**; a completed-project count distinguishes milestone eligibility from actual building completion. Completed builds save and resume after leaving camp and reloading. The original SVGs and all raster artwork remain; one legacy scene condition was corrected so it cannot depict the community greenhouse solely from the home level. The fixed current camp backdrop remains existing scenery, not evidence that a project has been completed.

## Existing saves and Jaxon

**No automatic reset occurs on startup or deployment. No reset is required for compatibility.** Existing saved home levels, explicitly built projects, keepsake placements and other progress remain. No custom migration was added to preserve Jaxon’s disposable camp progression.

If Jaxon already has a higher saved home level, he will keep it. **To play the new progression from Level 1 and zero building progress, his game would need a separately authorised explicit reset before that playthrough.** This task does not perform or add a live reset. The existing activity Reset button continues to reset only its named activity; it is not a whole-game/camp reset.

## Visual refresh preparation

The audit identifies the current inline SVG renderers, CSS surfaces, image paths, dimensions and reuse. It compares them with integrated world scenes and supplied approved guide portraits. The **54-file proposal** specifies 41 stable-identity keepsakes, three empty display surfaces, one optional collection surface, six planned/built project card images and three completed scene props, with paths, dimensions, transparency and reuse per asset. No replacement images, generated art, placeholders or new symbolic drawings have been integrated. The owner can supply or approve the coordinated set separately.

## Functional before/after evidence

All captures use fictional local fixtures, never learner backups or live accounts. Some fixtures deliberately include fictional balances, a completed starting profile and cosmetic ownership to check that camp actions leave them unchanged; empty camp progress is tested independently of those fields. “Milestone-ready” uses the same 30 unique milestones and no explicitly built project in each version: before, loading grants Level 5 and the greenhouse appears built; after, it remains Level 1 and zero builds until the learner acts.

| Layout | Before planner | After planner | Before projects | After projects | Saved completed builds |
| --- | --- | --- | --- | --- | --- |
| Desktop | [Before](before/desktop-chromium/milestone-ready-planner.jpg) | [After](after/desktop-chromium/milestone-ready-planner.jpg) | [Before](before/desktop-chromium/milestone-ready-builds.jpg) | [After](after/desktop-chromium/milestone-ready-builds.jpg) | [Two saved builds](after/desktop-chromium/completed-builds.jpg) |
| iPad portrait | [Before](before/ipad-portrait-chromium/milestone-ready-planner.jpg) | [After](after/ipad-portrait-chromium/milestone-ready-planner.jpg) | [Before](before/ipad-portrait-chromium/milestone-ready-builds.jpg) | [After](after/ipad-portrait-chromium/milestone-ready-builds.jpg) | [Two saved builds](after/ipad-portrait-chromium/completed-builds.jpg) |
| iPad landscape | [Before](before/ipad-landscape-chromium/milestone-ready-planner.jpg) | [After](after/ipad-landscape-chromium/milestone-ready-planner.jpg) | [Before](before/ipad-landscape-chromium/milestone-ready-builds.jpg) | [After](after/ipad-landscape-chromium/milestone-ready-builds.jpg) | [Two saved builds](after/ipad-landscape-chromium/completed-builds.jpg) |
| Small touch | [Before](before/small-touch/milestone-ready-planner.jpg) | [After](after/small-touch/milestone-ready-planner.jpg) | [Before](before/small-touch/milestone-ready-builds.jpg) | [After](after/small-touch/milestone-ready-builds.jpg) | [Two saved builds](after/small-touch/completed-builds.jpg) |

Additional empty-save captures, all three art sections, sequential claimed Level 5 and full camp screenshots are in the gallery. Before captures were produced from an isolated archive of the exact release commit; after captures use the feature source.

## Validation

Validation results are recorded in `validation.json`; the final outcome and remaining limitations are below.

All browser tests deny unexpected external origins; mock cloud tests intercept fictional requests in memory. PostgreSQL checks use local network-disabled disposable containers and synthetic identities. No hosted Supabase, learner records, Cloudflare API/Access settings, parent/account configuration or deployment actions were accessed or changed. Build checks write local artifacts only.

Physical iPad Safari remains untested; iPad results use Chromium touch emulation at 820 × 1180 and 1180 × 820, alongside desktop 1440 × 1000 and small touch 360 × 800. Artwork integration remains a separate review.

| Check | Result |
| --- | --- |
| `npm test` | Passed full baseline logic suite, including camp, save/cloud, rewards, curriculum and account boundaries |
| `npm run test:base-camp` | 8 logic suites and 12 browser checks passed across all four layouts |
| Existing expedition camp checks | 6 passed: all eight earned levels, four exterior appearances, celebration and saved ownership |
| Existing rollout camp check | 2 passed, both iPad orientations |
| `npm run test:curriculum` / `npm run test:touch` | 12 curriculum suites (2,988 fictional task completions) and 9 touch suites passed |
| Staging and production build checks | Both passed; local output only, approved artwork preserved |
| `npm run test:ipad-release` | Final full run passed: cloud/save logic, 10 network-disabled PostgreSQL checks, gameplay logic and all 14 browser checks |
| `npm run test:gameplay-quality` | Logic checks passed. Full browser run: 41 passed, 7 failed; details below |

The broad gameplay browser run is **not fully green**. Six failures are stale recipe assertions for curry, soup and pancakes in both iPad orientations: the test expects `undefined °C` although these recipes use a hob. The same three failures reproduce on the untouched release at iPad portrait. The seventh was a missing Playwright trace file after another runner cleaned the parent output directory; that place-value case passed on an isolated rerun. No unrelated recipe/gameplay code was changed to work around these checks.

An earlier full save/recovery run had one “Catch the bus home” assertion failure. The feature and baseline each passed two isolated repeats, and the final complete save/recovery run passed all 14 cases. The first failed result is recorded in the machine-readable report rather than omitted. The test server and artifact output directories were separated for the final reruns.

Reviewer entry point: open `index.html` for side-by-side captures, inspect `ART-AUDIT.md` and `proposed-assets.json`, then review the small application diff. Future artwork integration should use the stable keepsake identities in the proposal, not name-substring matching. This branch is for review only.
