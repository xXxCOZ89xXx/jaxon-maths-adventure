# Town recipe ingredient artwork integration

10 November 2026 · feature branch `codex/town-recipes-and-ingredient-art` · integration base `40682a08f14332f8365165a8145730514d309857`.

[Before/after gallery](gallery/GALLERY.md) · [Downloadable HTML gallery](gallery/index.html) · [Original asset metadata and SHA-256](../../../v3/assets/ingredients/manifest.json) · [Ingredient/flow mappings](../recipes/current-ingredient-art.json) · [Delivered and remaining artwork manifest](../recipes/ingredient-art-manifest.json) · [Validation summary](VALIDATION.json).

## What changed

Extracted only the 27 PNGs in the supplied ZIP's `assets/` folder into `v3/assets/ingredients/`, preserving their descriptive filenames and exact original bytes. All 27 extracted SHA-256 values match their ZIP entries. The source ZIP, README and preview HTML are not shipped with the game; their contents were treated as asset-reference material.

The original shared product renderer uses keyword and atlas fallbacks, which gave some recipe ingredients generic props (for example, olive oil appeared as a box). Explicit recipe label/pack mappings now select the supplied ingredient art while other Town uses retain the shared renderer.

A recipe-only renderer selects the correct ingredient image in cupboard/fridge stock, shopping-list controls and saved lists, supermarket shelves, baskets, carried inventory, recipe cards and applicable weighing/measuring steps. Aliases cover existing saved labels, including retained spaghetti/tinned-tomato/lentil journeys and legacy peppers. Fresh tomatoes and tinned chopped tomatoes remain distinct. Legacy dairy milk, generic cheese, flour, mince and pizza bases retain existing artwork because the supplied oat-milk/mozzarella images would be incorrect substitutes. Unneeded chocolate/drink shelf extras also retain their existing visuals.

The normal product renderer and other Town activities retain their original artwork. The demo's strict image allowlist now includes the 27 PNGs; production/staging fixture builders already copy the shared asset directory. PNG MIME support was added to local/demo test servers. No hosting, demo isolation, account, reward or database configuration changed.

## Visual and accessibility checks

Images use `object-fit: contain`, without clipping or source-image edits. Wrappers fit existing stock buttons, shelf controls and basket slots. Visible ingredient names, usable pack contents, quantities and fictional prices remain code-rendered text. Recipe-card thumbnails are decorative alongside table row headers; other product wrappers retain accessible ingredient names. Art is never the sole means of identifying an ingredient or its quantity.

All assets have meaningful transparent pixels and visible silhouettes. Twenty-six files are 1254 × 1254; `pasta.png` is 1312 × 1199, despite the supplied README describing all images as square. Containment preserves that image's full silhouette and proportions. No asset required cropping, stretching or replacement. Original PNGs total 27,873,049 bytes (about 26.6 MiB); they remain unoptimised originals and load as used by recipe screens.

Recipe cards and long stock/basket panels scroll vertically at small touch sizes. Captures scroll to the ingredient controls to make the art reviewable. The gallery includes all five recipe cards, cupboard/fridge stock, shopping lists, shelves, basket pack selection, carried inventory and measuring/weighing, across desktop, iPad portrait, iPad landscape and small touch layouts, with private-game and offline-demo examples.

Screen sizes are emulated Chromium/Edge, not physical iPad Safari. Physical iPad Safari remains **untested**.

## Preservation and isolation

Recipe definitions, quantities, pack sizes, costs, routing, answer logic and saved-run snapshots are unchanged by this integration. `v3/town-life.js`, `v3/town-content.js` and `v3/journey.js` have no integration diff. The only `app.js` change selects the recipe-specific visual renderer. Completed and unfinished progress, unrelated activities, assessments, coins, purchases and rewards are preserved through existing mechanisms.

Private-game tests use the real production build path with fictional login/PIN/save responses intercepted locally. Demo tests use browser-only fictional storage, block external traffic and confirm absence of cloud/account integration. No real learner data or hosted backend was accessed. Cloudflare Access, live/demo settings and `release/ipad` were not changed. No merge, release PR or deployment was performed.

## Validation

- recipeGameplay: **64/64 passed**, no skipped or flaky cases.
- beforeGallery: **72/72 passed**, no skipped or flaky cases.
- finalRecipeArt: **72/72 passed**, no skipped or flaky cases.
- townRouting: **32/32 passed**, no skipped or flaky cases.
- cookingRecovery: **32/32 passed**, no skipped or flaky cases.
- demoActivities: **24/24 passed**, no skipped or flaky cases.
- productionBrowser: **6/6 passed**, no skipped or flaky cases.

The machine-readable [validation summary](VALIDATION.json) records final browser counts. Checks cover all 27 image mappings, hashes, RGBA transparency, correct loaded dimensions in both builds, full-image containment, legacy fallbacks, recipe-only scope, all five recipe flows, exact resume/replay, unrelated save preservation, Town routing, cooking recovery, demo isolation and production build/login recovery.

Offline suites passed: `npm test`, curriculum/audit (all 222 mission/level combinations), recipe checks (741 stages), Town checks (2,235 stages), save/recovery (four groups), gameplay quality, production build, production preparation (10 suites), demo source parity/allowlist and standalone demo browser checks (desktop and both iPad orientations).

The full recipe gameplay suite passed **64/64**. After the final container-size adjustment, the focused art suite replays the complete pasta flow in both builds at all four sizes, checks all five recipe cards and directly tests passata, oat-milk and carrot measuring/weighing snapshots. The before gallery uses the exact pre-art commit, independently built with fictional configuration.

An initial focused-art run passed 40 cases and failed eight because the new test incorrectly required a supplied ingredient PNG on the water-measuring step. Water has no supplied image; the expectation was corrected while actual supplied ingredient steps received explicit image checks. This was a test-assumption failure, not a recipe-routing defect.

### Additional unchanged legacy failure

`node tests/v52-staging-preserve.cjs` fails before its suites with `Staging source changed` / `1 !== 2` in `scripts/build-v52-staging.cjs:6`. The same command produces the same failure on the untouched exact pre-art commit `40682a0`. Its staging application and builder also match current `release/ipad` (`7955861433337b61ba5bde28ae030c8f3325c935`) byte-for-byte:

- `v3/staging-app.js`: Git blob `61c0ef13f081eac74e714a39af08006255f06fa0`.
- `scripts/build-v52-staging.cjs`: Git blob `93c7916c955d8c80efcd2ac07912f46997fb69ef`.

The assertion and account/save code were left unchanged. This legacy staging-transform failure does not affect the passing production fixture, offline demo or targeted cooking recovery tests; it is recorded separately rather than hidden or weakened.

Development remains on the existing feature branch for owner review. No claim of hosted or physical-device acceptance is made.
