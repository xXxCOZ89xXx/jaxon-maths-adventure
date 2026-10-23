# V3 immersive adventure iteration

20 October 2026 · `codex/v3-adventure-build` · draft PR #2. This continues the approved visual foundation and preserves the nine worlds, 55 skills and existing saved-state/security model.

## Review the change

[Play the owner-private staging game](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/) · [Compare the seven requested screens](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/compare.html) · [Complete gallery](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/).

`tests/visual/foundation/` preserves the exact previous home, map, quest, market, camp, wardrobe and portrait quest images. `tests/visual/after/` contains fresh fictional captures. The comparison page pairs each previous image with the corresponding new full-size image. Portrait quests now use full-page captures so the whole answer area can be reviewed. Screenshots are evidence from emulated layouts, not physical iPad certification.

## What is different

- **Environmental depth:** distant silhouettes, middle-distance objects, edge scenery and foreground objects surround the existing restoration landmarks. Forest trees/birds/waterfall, desert pyramids/dunes/palms, snow peaks/cable cars, castle walls, sea/sails/waves, city lights, a portal star field/crystals, mine ceilings/minerals and Town neighbourhoods give the nine worlds different settings. Existing restoration geometry and permanent milestones remain the source of progress.
- **Larger places:** the atlas uses three larger destinations per desktop row; world overviews give more space to scenery and stack on tablets. Three labelled, keyboard-accessible scene entrances in each original world open its actual expeditions at the chosen difficulty. The existing eight Town entrances remain.
- **World stages:** quests and visits put a wide landscape, guide dock and foreground workbench in one stage. A bridge apparatus shows the explorer at the selected destination, and moves as the learner chooses a number. Irrigation/portal controls, stone tiles, packing crates and a shopping counter keep their real interaction and teaching systems. Recognisable original apples, milk and bread replace abstract supermarket glyphs. Maths still has readable prompts and native controls; this iteration does not implement free walking or a universal physics simulation.
- **Characters:** the explorer has a smile, eyebrows, scarf, stitching, satchel and a waving in-world pose. Guides now have readable faces and distinct hair, skin tones, clothes and vocational headwear/accessories rather than recoloured tiny bodies. Rowan, Saff, Finn, Kit, Marin, Ada, Nova, Flint and Town guides use these original SVG components. All 40 catalogue IDs, ownership and equipment selections are preserved.
- **Camp as a place:** a large camp map has tent, garden, gate and building entrances. They lead to three visual keepsake plinths with accessible selectors and illustrated greenhouse/lookout/noticeboard projects. The actual chosen keepsake appears on the camp stand. Earned structures remain visible in a compact strip; long achievement/collection lists move into optional journals. Project progress and all original build requirements remain. Camp actions never manufacture learning credit.
- **Portrait number line:** every possible destination is a visible, ordered, wrapping choice with a minimum 44-pixel target. The continuous bridge preview retains evenly spaced ticks and the selected marker. No answer is concealed in a horizontal scrolling strip; ordinary page scrolling reaches the rest of the stage. Save & exit remains visible on tablets.
- **Returning and rewards:** saved visits still resume precisely. A small crest arrival and restoration pulse mark completion; camp changes remain persistent. Motion follows the existing preference and reduced-motion setting. No perpetual particles, camera movement, autoplay audio, timers or new reward sources were added.

## Integrity and performance

The change is in rendering, layout and navigation into existing missions. It introduces no learning-data migration, changes to mastery, account/PIN logic, cloud save protocol, wallet, SQL or production configuration. Guided work remains distinct from independent mastery. The 60-minute goal, 10 coins per genuinely active minute and 1:1 screen time remain.

Artwork is deterministic inline SVG/CSS with bounded object counts, no external assets/fonts/runtime dependencies, canvas loop or 3D engine. Initial game download excludes the screenshot album. Capture timings are local automation timings, not a physical-device frame-rate measurement. The atlas renders nine SVG scenes at once; actual older-iPad memory/scroll performance still belongs in the existing combined acceptance session. Exact DOM counts and capture timings are in `tests/visual/manifest.json`.

## Next custom-asset workflow

A further art pass can improve personality and immersion without changing the engine. Prepare a consistent model sheet for the explorer and nine lead guides (front/three-quarter view, neutral/thinking/encouraging/celebrating poses), then export a small original transparent SVG or compressed sprite atlas. Commission unique close-up bridge, irrigation, generator, harbour and mine machinery plus recognisable interiors for each Town venue. Match perspective, lighting and silhouette across assets; provide reduced-motion stills and strict iPad download/memory budgets. Current portraits share a component family and some keepsakes still share category artwork. Those are the clearest remaining artistic opportunities.

Keep interaction hit areas and accessible text separate from replacement art. Review provenance and visual consistency, integrate into the existing renderer, and rerun the same gameplay/contrast/touch/screenshot checks. No custom external art was generated or copied in this iteration, and no asset commissioning is required to open the playable update.

## Verification and limits

See [current QA](V3-TEST-REPORT.md) for final counts and deployment provenance. New browser coverage checks every bridge destination, marker movement and reload, minimum touch sizes, camp keyboard entrances without rewards, and the actual expedition opened by each original world's landscape entrances. Existing gameplay, independent learning, family isolation, PIN, queue/conflict, bonus and shop tests continue.

Hosted staging configuration matches the approved project, but the Cloud proxy rejects the read-only identity request with CONNECT 403 before contacting Supabase. Authenticated cloud browser tests are explicitly intercepted fictional APIs; database checks use isolated PostgreSQL with fictional claims. The owner-reported hosted checks remain separate evidence. Physical iPad Safari and the existing combined two-family session remain pending; no passwords, PINs or personal learning records were requested or read.
