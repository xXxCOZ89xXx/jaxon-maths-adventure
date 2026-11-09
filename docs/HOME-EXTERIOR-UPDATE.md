# Home exterior and activity selection

Baseline: protected `release/ipad` at `0a036f6c824c2aa79becefa200f6c364295726e9` (PR #11 merge). The earlier general review was pinned to `3823ecb`; this is a focused Home change, not a repeat of that review.

## Root cause

All three exterior choices used the same `town|home|tier` mission key. `V7Home.start` deliberately chose any existing Home snapshot and returned before assigning the newly selected type. A paused Home route could therefore override the requested activity. The activity dialog also identifies runs by the mission key, so using one identity prevented clean presentation-state changes between exterior activities.

New exterior runs use a Home-kind suffix. Existing legacy keys, snapshots, task versions, tiers, drafts and completion records remain valid and are not migrated or rewritten. Selecting an activity looks up only that kind, parks the current run through the existing suspended-mission map, and updates Continue to the explicit choice. No global reset is used. Saved activity labels distinguish Post, Bins and Utilities. Scoped Get unstuck restarts through the Home task factory and keeps its existing archive behavior.

## Exterior

The existing `home-exterior.webp` is unchanged. Permanent labels and scene-aligned buttons cover the postbox, bins and utility housings. All targets are at least 44 CSS pixels, with separated touch targets on a 360 px viewport, keyboard focus outlines, accessible names and a collapsible text alternative below the image. The old button row above the artwork is removed. The Town Home entrance focuses the exterior selector; active Home scenes allow changing objects and returning to the exterior. A single hotspot tap opens the selected workbench immediately, with a return-to-exterior control inside it. Car, front door, driveway and gardens remain scenery.

## Private game and demo

The existing private connected path uses `scripts/build-v3-staging.cjs`; automated QA uses its explicitly fictional `staging-fixture-dist` output, never configured deployable credentials. The public builder is `demo/build.cjs` (release wrapper `demo/release-build.cjs`). Both copy the same Home, mission, navigation, scene and artwork modules. There is no separate demo Home implementation.

The hosted public demo was tested in a fresh browser session on 9 November 2026: Post opened Post, then both Bins and Utilities reopened Post; zero external requests and no cloud context. Public Home/mission/scene source hashes match the release baseline and its build-info manifest. The private hostname returned Cloudflare Access HTTP 302; no sign-in or learner-data access was attempted. Its runtime behavior was reproduced using the actual connected build path with intercepted fictional services. Hosted private after-login acceptance is therefore not claimed.

The demo retains `connect-src 'none'`, its own browser-storage namespace, no Supabase/SDK/backend/account files and no login. Cloudflare Access, deployment settings, account settings, reward code, schemas, learner records and unrelated Town activities are untouched. No merge or deployment is authorised or performed.

## Verification

Focused logic: **23 passing cases**, covering all six switches with current/legacy snapshots, exact resume after a completed step, unrelated visits, completed records and scoped restart archives. The full `npm test` regression suite passed.

The Home browser matrix checks both build paths at 1440×1000 desktop, 820×1180 iPad portrait, 1180×820 iPad landscape and 360×800 small touch. It exercises all six switches before and after completion, actual workbench identity, pause/reload/resume, exterior returns, all three keyboard alternatives, accessible names, focus rings, 44 px targets and non-overlap. [Before/after screenshots](review/home-exterior/SCREENSHOTS.md) are committed; the delivered gallery includes both builds and all four sizes.

The existing recovery suite passes all six cases on desktop (touch-enabled for its tap-only helper) and both iPad orientations, plus four on small touch: **22/24**. Two small-touch cooking cases cannot tap the Spaghetti stock control because overlapping cooking content intercepts it. Both failures were reproduced against the unchanged `0a036f6` build. They are outside Home and remain unchanged. The initial desktop context without touch support was corrected for this suite’s tap-only helper.

Demo source parity/rebuild isolation, all three layout privacy checks, production/staging build checks, cloud sync, save/purchase recovery and guided progression checks passed. Final browser counts: **Home 8/8**, **demo activities 24/24**, **recovery 22/24** (the two reproduced baseline cooking failures above). [Machine-readable results](review/home-exterior/TEST-RESULTS.json) include the run summaries. Re-run focused coverage with `npm run test:home`; the Home logic suite also runs under `npm test`, and the existing save/recovery CI job runs the browser matrix and uploads its evidence.

On this Windows host the installed Edge executable is supplied through `V3_CHROMIUM_EXECUTABLE`; these are Chromium/touch-emulation tests, not physical iPad Safari acceptance. The demo's existing URL-path inventory requires slash normalization on Windows; `tests/prepare-home.cjs` scopes that adjustment to its build/check process. Production build code is unchanged.

The full local `test:ipad-release` command passes its cloud, save/recovery and release-gate sections but cannot run the disposable PostgreSQL section because Docker is not installed (`spawnSync docker ENOENT`). Browser recovery coverage is run separately; database integration acceptance is not claimed.
