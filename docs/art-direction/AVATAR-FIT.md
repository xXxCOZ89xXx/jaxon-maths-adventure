# Avatar shop — retained choices and fit review

This follow-up starts at `8023a7c` and is for owner review only. Do not promote it to `release/ipad` or publish it. Original artwork, catalogue definitions/IDs/prices, economy, save format, storage namespaces, authentication and backend configuration are unchanged.

## Active shop and saved compatibility

The shop and renderer share `V7Avatar.isActiveItem`. There are 29 active choices: seven Headwear, seven Outfits, Magic wings, Cool sunglasses, seven Companions and six Backgrounds. Eleven retired IDs remain in `V3Curriculum.catalog` and saved ownership/equipment arrays: `jetpack`, `rucksack`, `shield`, `parachute`, `dragon`, `medal`, `watch`, `scarf`, `gloves`, `sword`, `wand`.

Retired choices are hidden in every shop filter, cannot be previewed or dispatched as a new purchase/equip action, and never render from stale equipped IDs. No loader migration or save cleanup occurs. Existing pending saves, receipts and purchase intents are untouched. The renderer treats saved appearance values 1–3 as original option 0 without rewriting settings; only the original appearance is offered. This changes presentation, not historical ownership or learning data. The owned count still includes historical purchases.

## Visual corrections

- Forest cap and Golden crown reduce from 30% to 25% of the avatar canvas. Wizard hat retains its 27% width and existing crop/aspect. Hat front masks remove the rear underside; the attachment anchor compensates for the trimmed silhouette so the front brim meets the forehead. Original upper hair is clipped only while wearing a hat. Headphones retain their existing fit/open-face mask.
- Jacket and hoodie shoulder/leg crops remain unchanged. Sharp suit, cape, space suit and ninja outfit now use individually measured shoulder starts (85, 87, 88 and 90 atlas-cell pixels) and separate leg crops, excluding the detached rear collars. The original head, neck, hands and approved front-facing soles remain.
- Wings shift left by two canvas percentage points and remain behind the body.
- All seven companions retain their larger 40% × 32% attachment frame, moved from centre x=96% to x=79% (bounds 59–99%). They fit beside the avatar inside the actual preview panel and viewport, rather than relying on contact-sheet overflow.
- All six backgrounds, original appearance 0, jacket and hoodie are compared against `8023a7c` using byte-identical rendered PNGs. No asset files changed.

## Focused local review

Run `npx playwright test -c playwright.avatar-fit.config.cjs`: 18 cases, six each at 820×1180, 1180×820 and 390×844. The existing fictional camp fixture denies every external origin, including both Supabase projects. Coverage includes all 40 definitions, every retained equip/reload/unequip/reload, all retired UI choices and stale equipped IDs, legacy appearance settings/reopening, unchanged coins/ownership/learning fields, unowned read-only previews, proportional placement/layering, every companion's actual preview bounds, hat/collar contracts, and pixel preservation.

Baseline capture: `AVATAR_PHASE=before AVATAR_REPORT=/workspace/artifacts/avatar-shop-selection/before-results.json npx playwright test -c playwright.avatar-fit.config.cjs --grep 'actual shop combinations'`. This serves committed `8023a7c` renderer/CSS locally; it does not rewrite game files.

Retained compatibility: `ROLLOUT_REPORT=/workspace/artifacts/avatar-shop-selection/retained-wardrobe-results.json npx playwright test -c playwright.rollout.config.cjs --grep 'Layered wardrobe'` (two viewport cases).

`node scripts/build-avatar-fit-gallery.cjs` generates self-contained HTML galleries in `/workspace/artifacts/avatar-shop-selection/`, including separate iPad portrait, landscape and small-screen downloads. `AVATAR_SHOTS` overrides the capture root; the gallery script takes that root as its first argument. Actual shop combinations are paired against the baseline, plus all 40 definition compatibility sheets, legacy appearance 0–3 screenshots and current active-catalogue sheets. The contact sheets are clearly labelled test displays of the real renderer, not new game screens or concept artwork.

The art remains fixed-view 2.5D with cropped atlas layers, rather than a rigged character. Hat brim edges and outfit joins still need owner visual approval. Automated Chromium touch viewports do not establish physical iPad Safari acceptance. The live game, release branch, Cloudflare and Supabase remain unchanged.

Validation: all 18 focused cases passed in the final run, with zero skips, flakes or failures; both retained wardrobe cases and all three baseline-capture cases passed. The final run uses non-empty fictional skill/check/weekly progress and checks every shop filter. Equip actions retain their normal revision increments; opening/reloading legacy appearance and retired equipment does not rewrite the stored state. Reports: `/workspace/artifacts/avatar-shop-selection/final-results.json` and `retained-wardrobe-results.json`. Screenshots: `before/` and `after/` in the same directory. The owner-facing private review page includes embedded PNGs and downloadable self-contained HTML galleries for all three sizes.
