# Base Camp imagery audit and proposed replacement set

Audited against `release/ipad` at `f1b88c95326e6ba5145e8abd97306df0431b3a1a` (12 November 2026). No artwork has been replaced, generated or added. The numbered composite reference boards mentioned in the older art brief are absent from this checkout; the comparison uses current integrated world scenes and supplied approved guide portraits instead.

## Current inventory and reuse

These three sections do **not** load standalone images for their objects. Their basic appearance comes from inline SVG and CSS in these files:

| Current imagery | Location | Size / background | Uses and reuse |
| --- | --- | --- | --- |
| Earned keepsakes: plant, gear, document, cup, flag and generic crystal | `v3/art.js`, `keepsake(c)` | SVG viewBox 80 × 80, transparent; rendered 75 × 75 in display slots, 62 × 62 on small touch, 56 × 56 in collection | “Your adventures on display” and “Keepsake collection” in `v3/adventure-ui.js:collection`. Also embedded into legacy SVG camp interiors by `v3/places-art.js:camp` and the original `v3/art.js:camp` fallback. Not used by other current activity or shop screens. |
| Community greenhouse, Explorer lookout, Town noticeboard; planned/built variants differ only in opacity | `v3/art.js`, `project(id,built)` | SVG viewBox 200 × 160; transparent; rendered around 180 × 140 | “Build something that stays” only, via `v3/adventure-ui.js:collection`. Legacy camp interior draws its own project geometry in `v3/places-art.js`, rather than calling `project`. |
| Display plinths, empty diamond marker, project panels and collection cards | `v3/style.css`: `.display-plinth`, `.project-art`, `.keepsake`; empty marker in `v3/adventure-ui.js` | CSS gradients / borders, no image files | Display, project and collection surfaces on Base Camp only. Existing marker retained; no new symbols or substitute art introduced. |

The same Base Camp view is served through the offline entry point, private app and isolated demo builds. Compiled copies are not separate source assets. No other current screen directly calls `A.keepsake` or `A.project`; world activity illustrations and wardrobe icons use separate renderers. The active camp interior is the fixed asset checkpoint scene; the detailed SVG interior is a retained fallback. Integrating raster keepsakes there later needs a deliberate renderer change: the fallback currently embeds SVG by string substitution.

### Existing image files used around Base Camp and as comparison references

| Files | Intended use / reuse | Dimensions / background |
| --- | --- | --- |
| `v3/assets/rollout/camp1.webp`, `camp2.webp`, `camp3.webp`, `camp4.webp` | Current Base Camp exterior and earned-home planner; paired logical levels 1–2, 3–4, 5–6, 7–8 | 1536 × 1024 opaque scenes |
| `v3/assets/checkpoint/camp.webp` | Current “Inside your Base Camp” navigation scene, from `v3/asset-checkpoint.js` | 1536 × 1024 opaque scene |
| `v3/assets/rollout/forest.webp`, `desert.webp`, `geometry.webp`, `ratio.webp`, `statistics.webp`, `probability.webp`, `measure.webp` | Subject world cards, world scenes and mission backdrops, via `v3/world-art.js` | 1536 × 1024 opaque scenes; exact inventory/hashes in `v3/assets/rollout/manifest.json` |
| `v3/assets/checkpoint/rail.webp`, `town.webp` | Algebra freight and Town scenes via asset checkpoint renderer | 1536 × 1024 opaque scenes; `v3/assets/checkpoint/manifest.json` |
| `v3/assets/world-guide-portraits-preview/number-forest-guide.webp`, `fraction-desert-guide.webp`, `algebra-peaks-guide.webp`, `geometry-kingdom-guide.webp`, `ratio-island-guide.webp`, `statistics-city-guide.webp`, `probability-portal-guide.webp`, `measurement-mines-guide.webp`, `practical-maths-town-guide.webp` | Approved supplied primary guides in lessons, world missions and related guide panels, via `v3/guide-portraits.js` | 560 × 700 RGBA, transparent; originals/hashes in that directory’s `manifest.json` |

Separately, `v3/assets/painted-forest-preview/number-forest-painted-backdrop.jpg` and `v3/assets/fraction-desert-preview/fraction-desert-painted-backdrop.jpg` belong to the optional offline art comparison build. They are not the current source entry point’s world backgrounds and should not be confused with approved integrated replacements.

## Specific style differences

The current section objects have broad flat fills, few material details, heavy simple outlines and inconsistent perspectives. The planned and completed project pictures show the same whole building at different opacity, which does little to distinguish unbuilt from built. Keepsakes are selected by name substrings rather than identity: “Copper compass” matches “pass” and gets a document picture. Multiple distinct objects share generic artwork.

The integrated forest and desert scenes have detailed timber, stone, foliage and metal, coherent directional sunlight, ambient shadows and layered depth. Approved guide portraits use textured painted fabric/leather, warm skin shading, deliberate highlights and mature proportions. A coordinated replacement should match the scenes’ crafted 2.5D objects and the portraits’ material/lighting quality while retaining clear silhouettes at small sizes. Do not crop objects from scenes or composite boards.

## Proposed asset manifest

`proposed-assets.json` is the complete per-file proposal: **54 files**, including **41 identity-keyed keepsakes**, 3 display surfaces, 1 collection surface, 6 project-card variants and 3 camp-scene project props. Paths are reserved proposals; none exist yet.

| Set / proposed paths | Approximate dimensions | Background requirement | Intended use / reuse |
| --- | --- | --- | --- |
| `v3/assets/base-camp/display-{shelf,garden,gate}.webp` | 1200 × 480 | Opaque scene, calm central object area; empty by default, no fixed trophies | Three display slots, keeping HTML controls and earned object layers separate |
| `v3/assets/base-camp/collection-surface.webp` | 1600 × 400 | Opaque timber/stone surface; quiet area for live heading, no trophies/text | Optional collection header, coordinated palette rather than a separate illustration per card |
| `v3/assets/base-camp/keepsakes/{world}-{route}.webp` | 512 × 512 each | True transparent RGBA, 10% safe padding, consistent object angle and light | Same identity-specific art in display, collection and appropriately adapted camp placement renderer; never grant ownership from image presence |
| `v3/assets/base-camp/projects/{greenhouse,lookout,noticeboard}-{planned,built}.webp` | 768 × 576 each | Transparent; aligned ground line and contact shadows; planned state visibly incomplete | Project cards; planned artwork must not imply a completed building. Counters and Build controls remain live HTML |
| `v3/assets/base-camp/projects/{greenhouse,lookout,noticeboard}-scene.webp` | 640 × 640 each | Transparent; match camp scene projection/scale, with separate shadow layer if required | Scene props shown only for actual saved completed projects; separate from card composition |

Deliver original PNG masters plus WebP exports with alpha preserved where specified. No baked-in labels, numbers, progress bars, locks or buttons. Review one keepsake and both states of one project together at desktop and touch sizes before approving the whole set. Do not substitute emojis, CSS drawings, placeholders or unapproved generated images. Integration is a separate owner-approved task; any future change to static camp scenery needs its own reviewed layering plan.

## Before screenshots

Captured locally from the exact baseline, using fictional empty, collected and milestone-ready fixtures. The collection screenshot opens the collection details so the art is visible.

| Layout | Adventure display | Keepsake collection | Build projects | Planner / functional baseline |
| --- | --- | --- | --- | --- |
| Desktop 1440 × 1000 | [Display](before/desktop-chromium/adventure-display.jpg) | [Collection](before/desktop-chromium/keepsake-collection.jpg) | [Build](before/desktop-chromium/build-projects.jpg) | [Milestone-ready planner](before/desktop-chromium/milestone-ready-planner.jpg) |
| iPad portrait 820 × 1180 | [Display](before/ipad-portrait-chromium/adventure-display.jpg) | [Collection](before/ipad-portrait-chromium/keepsake-collection.jpg) | [Build](before/ipad-portrait-chromium/build-projects.jpg) | [Milestone-ready planner](before/ipad-portrait-chromium/milestone-ready-planner.jpg) |
| iPad landscape 1180 × 820 | [Display](before/ipad-landscape-chromium/adventure-display.jpg) | [Collection](before/ipad-landscape-chromium/keepsake-collection.jpg) | [Build](before/ipad-landscape-chromium/build-projects.jpg) | [Milestone-ready planner](before/ipad-landscape-chromium/milestone-ready-planner.jpg) |
| Small touch 360 × 800 | [Display](before/small-touch/adventure-display.jpg) | [Collection](before/small-touch/keepsake-collection.jpg) | [Build](before/small-touch/build-projects.jpg) | [Milestone-ready planner](before/small-touch/milestone-ready-planner.jpg) |
