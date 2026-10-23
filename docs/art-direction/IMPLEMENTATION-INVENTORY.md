# Approved artwork: verified inventory and integration plan

22 October 2026. The owner explicitly asks to follow the supplied [implementation prompt](CODEX_IMPLEMENTATION_PROMPT.md) and [art direction](README_ART_DIRECTION.md). Their asset-based direction supersedes the rejected procedural-SVG checkpoint. These instructions do not authorise publication of the next sample.

## Verified current state

- GitHub development HEAD: `eff5d677a8fa18f17de980519bae532a51f19f82`; release HEAD: `2e84e74d9fbcb22208b6332ca98f2cd7466912d3`.
- Retain nine correctly named worlds, 63 mapped skills, 13 expanded banks, prerequisite/mastery work, 27 Town plans, both recipe routes, job shifts and meal-specific maths.
- At the verified `eff5d67` base, `v3/art.js`, `places-art.js` and `visual-sample.js` generated SVG scenery/characters/props. They are existing runtime drawings, **not** approved production artwork. At that base no raster scene, separate prop, character-pose or sprite files existed under the runtime `v3/`, `assets/` or `public/` paths. `icon.svg` remains the application icon.
- PNGs under `tests/artifacts` are screenshots of the earlier running game. They are evidence, not separable art assets and must not become backgrounds or sprite sheets.
- The three supplied text files were read first. All 16 references were then supplied inline and individually inspected; see [reference review](REFERENCE-REVIEW.md). They are not numbered local image files. The prior missing-reference dependency is resolved.
- The original pre-change renderer had no runtime raster assets. This checkpoint adds 14 original purpose-made WebP assets: six continuous scene backgrounds (Camp, kitchen, supermarket, bus station, freight yard, Town), eight transparent props (explorer, pantry, fridge, locomotive, wagon, spaghetti, tomato tin, mince tray). No composite crops or basic SVG replacements are used for these assets. Existing mathematical diagrams and unconverted locations retain their previous renderers.

## Representative asset inventory to produce after reference inspection

| Art assets | Code-rendered overlays | Existing interactive state/engine |
| --- | --- | --- |
| Central Camp terrain/buildings, bridges and blue portals; separate green explorer/NPC poses | Nine exact world names, progress, Continue and navigation labels | World access, camp achievements, avatar/shop/trophy access |
| Home exterior and scenic car/driveway/gardens; separate electricity/gas/water meter housings, bins and mailbox | Accurate meter digits/units, supplied practice values and literal instructions | Three exterior activity types only: meters, recycling, post. Car/gardens/driveway/front door get no extra maths tasks |
| Kitchen shell; purpose-made closed/open cupboard/fridge props, ingredients and equipment | Recipe quantities, portion counts, time, temperature, stock/list counts | Existing saved cooking journeys, cupboard state, inventory, preparation and measuring controls |
| Bus stop/bus; supermarket interior, shelves, checkout, separate products and basket empty/full variants | Timetable, fares, UK denominations, totals and receipts | Same connected trip, list, pretend cash, basket, payment/change and recovery |
| Industrial railway environment, engine, individual cargo wagons and coupling states | Mathematical carriage plates, instructions and feedback | Select/connect/order/replace actual wagons, with tap alternative |
| Consistent front/side/back character poses and wearable layers | Existing equipped/owned-item labels | Existing ownership and parent reward rules; no new unlock economy |

The table describes the eventual roles. Only the representative checkpoint subset is implemented; remaining roles await sample approval. Keep PNG masters and optimised portable WebP/PNG runtime files, with a manifest identifying each original asset, state variant, reference provenance, bounds and anchor. Do not crop tiny props from reference boards or stretch a concept collage into the gameplay background. Generate clean backgrounds and transparent props separately, without baked maths/text. Inspect references one image at a time, then only the relevant small reference subset for each asset.

## Implementation sequence and safeguards

1. Inspect **all 16 numbered images individually** before changing gameplay visuals. Record filenames, intended role, alternatives and approved composition. Generate/review the original scene/prop/character assets against those references; reject visible placeholder quality.
2. Add image layers plus responsive HTML interaction layers to the current renderer. Keep camera/scale consistent and preserve hit targets under aspect-ratio fitting. Render numbers/instructions using HTML/canvas; retain keyboard/tap controls, selected states and reduced motion. Keep everything as static, host-portable assets.
3. Build the representative Camp → home → bus → supermarket/checkout → kitchen adventure and separate freight puzzle. Reuse saved snapshots/IDs, immutable pending saves and educational evidence. Eight existing logical Camp milestones remain intact; map the four approved exterior art stages to saved progression explicitly after reference review, rather than changing unlock thresholds or discarding old achievements.
4. Run focused touch/layout, correct/wrong/hint, save/reopen/offline and relevant parent-control checks with synthetic data. Inspect actual iPad-sized renders. Present the playable sample for owner approval **before** full visual rollout or release promotion.
5. After that approval, complete the remaining world/Town art, Camp stages and educational work, then acceptance and the already-established release process. No new hosting project, account, database migration, commercial functionality or manual deployment upload.

Checkpoint status: implemented and exercised with fictional progress; see [playable review](CHECKPOINT.md). Next owner action is review of the actual rendered sample. Keep release/ipad unchanged until that approval and subsequent full-rollout acceptance.
