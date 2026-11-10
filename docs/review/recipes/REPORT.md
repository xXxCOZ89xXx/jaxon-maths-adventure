# Town recipes and ingredient-art preparation

Base: `codex/town-navigation-layout` at `dadb2fdf895bbf21b348697a816e73dc5ff3f165`. Feature branch: `codex/town-recipes-and-ingredient-art`. The clean base was verified before creating the branch. No release PR, merge or deployment.

[Recipe sources and complete recipe quantities](../../TOWN-RECIPE-SOURCES.md) · [Ingredient-art audit](INGREDIENT-ART.md) · [Proposed asset manifest](ingredient-art-manifest.json) · [Current image inventory](current-ingredient-art.json) · [Before/after gallery](gallery/GALLERY.md)

## Recipes and quantities

New runs of the five existing IDs (`cook-pasta`, `cook-curry`, `cook-pizza`, `cook-soup`, `cook-pancakes`) now use practical tomato pasta, mild chickpea coconut curry, vegetable flatbread pizza, carrot/red lentil soup and banana oat pancakes. Instructions are original adaptations of the linked sources; no publisher photos are used. The curry contains no required chilli or hot paste.

The old plans largely counted packs, sometimes without a stated usable size. The refreshed snapshots distinguish recipe quantities, stock pack counts, missing whole packs and usable contents. A 400 g chickpea tin adds 240 g drained chickpeas; missing purchases round up to whole packs. Checkout charges for packs, while carried stock and cooking consumption use g/ml/items/teaspoons. Required pantry basics are counted too. Water is provided at home. Optional additions are labelled separately and are outside the required shopping calculation. Prices remain fictional.

Levels 1–3 make 2, 4 and 6 servings. Cards show base and batch quantities, prep/cook/total estimates, batch capacity, heat guidance, allergens and adult kitchen-help notes. Oven temperatures are labelled conventional/fan; hob and frying-pan recipes use heat guidance rather than pretending a hob has a precise temperature dial. The flow retains measuring, comparing stock, serving scaling, pack rounding, budgeting, payment/change, clock calculations and leftovers.

An explicit readiness stage checks carried usable quantities before preparation; assisted skipping cannot create missing food. The finish stage checks stock again before consuming it. Every ingredient’s unused quantity remains in that run. Inventory remains activity-local, as before; this does not introduce a global pantry or transfer another plan’s ingredients. Replay creates a new fictional day and keeps the completed run.

## Saved work and Town navigation

Existing V1/V2 recipe IDs, stored steps, cards, units, drafts, receipts, inventories and completed runs are retained. Old unfinished runs resume their saved recipe; replay uses the refreshed version. Five exact pre-refresh partial snapshots are included as fictional compatibility fixtures. Original Bolognese/lentil content generation was compared with the base across 18 tier/seed combinations and remains identical.

Explicit plan/recipe selection now clears only the old transient Continue pointer. That includes the retained V1 route. Other paused runs remain in the existing saved-activity book. The Town map, repair placement, difficulty-aware Visit actions and the base branch’s activity-specific routing are retained.

The expanded ingredient lists exposed a desktop storage layout that assumed three illustrated shelves: later rows could overlap the controls below. New-recipe rows now flow vertically at every size, with non-overlap regression checks. A readable pack chooser inside the basket provides an alternative to selecting scene shelf targets; it uses the same existing actions and images. Legacy recipe layouts remain available.

## Ingredient-art preparation

The audit resolves 46 current ingredient/pack label variants through the actual shared image-rendering chain and lists their files, atlas positions, locations and reuse. It also lists retained scenery/storage images. The proposed manifest specifies 41 coordinated individual assets, dimensions, transparency, intended use and reuse across storage, shelves, list, basket and recipe. Optional and legacy ingredients are distinguished.

Existing art is unchanged. Known mismatches include flatbreads showing a loaf, some ingredients showing a box, and labels containing “teaspoons” resolving to the tea/cup image. The audit compares actual sheets and the independent pasta image with the approved Town portrait and kitchen scene, including texture, light, framing, alpha edges and cropping. The owner can review the manifest and provide coordinated approved images for later integration. No replacement ingredient art was created, generated or integrated; the committed images are gameplay screenshots.

## Validation

[Machine-readable results](test-results.json)

| Check | Result |
| --- | --- |
| Full five-recipe production/demo gameplay matrix, all four sizes | 56 passed |
| Final visible-card gallery checks and retained V1 selection/Continue | 16 passed; covers all five cards in every build/viewport |
| Final complete small-touch pasta, production and demo | 2 passed |
| Existing Town routing, difficulty, locks, map/repair layout, completion/Continue | 32 passed across all four sizes |
| Existing cooking and immutable save/recovery | 32 passed across all four sizes |
| Existing offline-demo activity suite | 18 passed |
| Fictional production login, save-response loss, resume/lock and cache recovery | 6 passed |
| Exact-base before captures | 8 passed |
| Recipe engine conservation/scaling/stock guards, 5 recipes × 3 levels × 3 seeds | Passed; 741 stages, five frozen legacy snapshots, switching/Continue |
| Existing Town engine | Passed; 27 scenarios, 2,235 stages |
| Core npm regression, curriculum, gameplay/action and save/purchase checks | Passed |
| Production/staging packaging; demo source/rebuild parity | Passed |
| Demo browser isolation | Passed at desktop and both iPad sizes; external requests blocked |

The main matrix completes each meal, records stock and missing packs through the actual controls, shops, pays, cooks and checks leftovers. It pauses a draft, selects Bank at Level 2, checks Continue selects Bank, resumes the exact recipe, reloads completion and replays without removing the completed run. Separate fixtures block cooking when stock is insufficient. All service-facing tests are fictional/intercepted, not hosted acceptance or real Supabase testing.

Visual inspection caught the new recipe card remaining collapsed because the existing opener matched only the old class string. That opener was corrected; final checks require an open card and visible table. All five cards were checked again at every build/viewport, and complete small-touch production/demo pasta was rerun. The gallery was recaptured around the ingredients and pack controls rather than only the modal header.

**Unchanged-base observation:** the initial parallel before capture had one small-touch demo saved-stage assertion failure (7 passed, 1 failed). The exact unchanged base passed all eight cases serially, including the final focused captures. This is recorded separately and is not claimed fixed by the new recipes. No checks were disabled or hidden. Physical iPad Safari was not tested.

The permanent recipe suite is reproducible with `npm run test:recipes`; its default browser matrix includes the 56 main cases and eight V1 selection cases. The optional gallery check adds eight build/viewport cases, each viewing all five cards. `npm test` includes the new engine checks. On Windows, existing Python-server configs used an ignored local wrapper with the repository loopback Node server; installed Edge supplied Chromium emulation. No workflows were changed.

## Changed files and boundaries

Runtime: `v3/town-life.js` (recipe definitions, selection pointer and stock guard), `v3/town-content.js` (new recipe snapshots and quantity arithmetic), `v3/journey.js` (legacy explicit-selection pointer), `v3/adventure-ui.js` (cards/unit display), `v3/scene-interactions.js` (stock grouping and basket choice), `v3/app.js` (inventory/receipt quantity formatting), `v3/style.css` (recipe table, pack chooser and expanded stock rows).

Supporting changes: recipe engine/browser tests and config, frozen fictional legacy fixtures/helper, a focused existing heat-setting assertion, npm test scripts, source documentation, the art audit script/manifests and review screenshots. The existing art renderer files and image assets are unchanged.

All service-facing browser tests use fictional/intercepted production or staging fixtures. The demo remains browser-only with external requests blocked. No real learner session or data was accessed. No reward, account, database, Supabase, Cloudflare or Access settings/code were changed. The separate parent-tab reward race remains outside this work. Physical iPad Safari is **untested**; desktop/iPad/small-touch results use Chromium/Edge emulation. No GitHub required checks are claimed: no PR was opened and this branch is outside existing push filters.
