# V3 visual review — the explorer’s field journal

Date: 20 October 2026. Branch `codex/v3-adventure-build`, draft PR #2. All review screenshots use deliberately seeded fictional state, including the parent dashboard. No staging family/progress was read to make this album. No manual testing is requested now.

## Open the album without development software

- [Private screenshot gallery](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/)
- [Nine worlds: before and restored](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/worlds.html)
- [All eight Town locations](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/town.html)
- [Versioned gallery source and images](../tests/visual/index.html)

The private links belong to the existing owner-only Site; use the owning ChatGPT account. The album and corrected game are deployed as verified private Site version 2; access remains owner-only. Final source/archive provenance and green 100-case Chromium/WebKit CI are recorded in `V3-TEST-REPORT.md`. Select a thumbnail for its full-size image; use Back to return. Before-this-redesign screenshots are included. Parent captures come from intercepted fictional API responses and are labelled accordingly. Desktop is 1440×1000, iPad portrait 820×1180 and landscape 1180×820; touch layouts are emulated, not physical-device certification.

## Chosen direction

Original 2D isometric dioramas inside a practical field journal. Forest green remains the shared brand accent; cream paper, timber/stone edges, restrained brass highlights and original layered SVG make the UI feel like exploration equipment. Each world has its own atmosphere, architecture, materials and palette. No Minecraft textures, copied character assets, clip-art packs, external fonts, image downloads or 3D engine are used. Scenery is deterministic from saved milestones: opening or admiring a scene never grants rewards.

## The nine worlds

| World | Landscape and restoration |
| --- | --- |
| Number Forest | Deep green sky, layered pine canopy, cutaway grass terrain, flowing river, timber crossing and a workshop; bridge fills in, the dead grove revives and the workshop rises |
| Fraction Desert | Ochre/sandstone, stepped temple, pyramids, dry irrigation cuttings, palms and an oasis; water returns, greenery appears and the temple/pillars grow |
| Algebra Peaks | Blue-grey snow peaks, generator gears, elevator rails and a battery platform; power colours, lift height and connected machinery change |
| Geometry Kingdom | Lavender stone, castle courtyard, battlements, towers and a bridge; low foundations become tall watchtowers with green pennants |
| Ratio Island | Turquoise sea, sand, timber harbour, a sailboat, stores and a lighthouse; pier, vessel and beacon visibly develop |
| Statistics City | Blue/teal skyline, individual towers, observatory, data columns and warm windows; height, neighbourhood lights and observatory restoration change |
| Probability Portal | Violet twilight, crystal pylons and a large framed portal; a dormant dark gate becomes an illuminated patterned gateway |
| Measurement Mines | Mineral terrain, mine entrance, descending rails, cart, lift/machinery and crystals; cart, lamps, equipment and crystals activate |
| Practical Maths Town | A compact isometric high street with eight named, individually coloured buildings, clock, awnings, civic columns, cinema signage and workshop gear; illuminated venues and festival detail reflect progress |

Town visits now enter a close-up venue scene rather than repeating the whole town map. Market/café baskets, a bank ledger, sale labels, station timetables, household bills, leisure tickets and workshop timesheets sit in themed task workbenches. The eight numbered entrances are anchored to the actual roofs, with named keyboard/touch alternatives below. Small phone maps can scroll inside their frame; iPad layouts retain usable touch targets.

## Other improvements

- Framed illustrated home, dark forest navigation, stronger primary action and original SVG navigation/equipment tokens. The nine-world atlas retains free world choice and saved restoration summaries.
- Rebuilt terrain depth, top/side lighting, distant silhouettes, restrained atmospheric details and original gear/architecture. Reduced an overly busy checkerboard during rendered inspection.
- Original layered explorer, wearable colours, glasses/crown/hat details and SVG companions/equipment replace emoji. The 40 catalogue IDs, purchases, slots and ownership logic stay compatible. Some related outfits intentionally share a silhouette.
- Base Camp has an isometric tent, lantern path, workshop, garden, lodge, greenhouse, lookout, noticeboard and placed keepsakes. The visible upgrades derive from durable saved milestones/projects. Keepsakes now have themed plant, gear, journal, vessel, pennant and crystal art rather than one repeated glyph.
- Coloured guide portraits, timber bridge controls, water channels, stone tiles, crate edges, brass-framed clock, receipts and ledgers make the maths objects part of the setting. This remains a 2D task-based adventure, not a free-roaming open-world game.
- Parent journal with readable evidence, safe dates, separate wallet/time cards, blank reward defaults and explicit immutable retry controls. Exact amounts are retained; coin display uses at most two decimals.
- Subtle optional arrival/lantern animation; sound remains optional, motion defaults off, and reduced-motion overrides are honoured. No full-scene animation loop or heavyweight rendering dependency.

## Capture, inspection and performance

`npm run capture:visual` records 52 fictional game screens across desktop/iPad, fails on unexpected external requests, rendering/console errors and horizontal page overflow, and writes `tests/visual/manifest.json`. It covers home/map/camp/wardrobe/quest/recap in all three layouts, nine before/restored world pairs on desktop and eight Town visits on desktop plus portrait. The browser suite adds three fictional parent screenshots; five baseline screenshots make a 60-image album. `npm run build:gallery` builds the static lazy-loaded review pages.

Rendered home/atlas, all nine restoration pairs, all eight Town venues, parent journal and representative iPad/camp/wardrobe/quest layouts were inspected. Generated pine path errors were caught by browser console QA and fixed. Restored camp placement titles were retained after a regression test caught their omission. The final report records the last capture/test/deployment results; do not infer unrun physical-device checks from these images.

All artwork is local SVG/CSS. Art plus stylesheet is approximately 70 KB before compression; gallery images are separate and load only when reviewing the album, not during play. The capture manifest records DOM/SVG size and reload-plus-capture time for diagnosis (roughly 4,800 nodes at the heaviest atlas). Capture timing is not a physical iPad frame-rate benchmark. Existing input editors avoid full-page rendering on every typed character; activity ticks save without redrawing scenes.

## Additional custom artwork

No external artwork is needed for the implemented game. These optional commissioned assets would add personality beyond the current geometric art; they are not represented as already completed:

| Optional asset | Exact brief and size |
| --- | --- |
| `assets/optional/guides/<guide-name>-portrait.webp` | One original half-body portrait per named guide in `V3Engine.worlds` and `V3Town.venues`; 512×640 transparent WebP, under 80 KB each. Consistent three-quarter voxel/isometric figure, mature early-teen adventure tone, tailored role/tool/colour, soft upper-left light. No copied game skins, text or branded props. Use neutral/speaking poses only if separately supplied |
| `assets/optional/worlds/{number,fractions,algebra,geometry,ratio,statistics,probability,measure,town}-mural.avif` | Nine original 1600×1000 atmosphere paintings matching the corresponding row above, under 180 KB each, clear lower-centre terrain/activity space. Keep controls, labels and restoration layers in SVG; do not bake them into a backdrop. Current scenes remain the functional fallback |
| `assets/optional/keepsakes-atlas.webp` | 1792×1536 transparent atlas, 7×6 cells of 256×256 for the 41 named keepsakes returned by `V3Adventure.collections` across all routes, final cell empty; under 250 KB. Original recognisable miniature relics, common perspective/light, no text or emoji. Supply a JSON cell-to-keepsake-ID map before integration |

These are enhancement briefs, not blocking missing files. Do not load nonexistent assets or replace the authored scenes with unreviewed generated placeholders.

## Remaining presentation / usability concerns

Physical Safari performance, real touch comfort and final learner taste await the single later acceptance session. The full wardrobe and mature camp collection can be long pages; named filters/section headings help, but final feedback may favour a more compact journal. Guide and outfit silhouettes are deliberately reused; bespoke poses could improve character identity. World scenes and authored workbenches support exploration by choosing places/tasks; they do not offer free walking. Production readiness, live API/security gates, email configuration and future migration are tracked only in `V3-OUTSTANDING-ISSUES.md` and `V3-PRODUCTION-RELEASE-PLAN.md`.
