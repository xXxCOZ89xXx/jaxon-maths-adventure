# Jaxon's Maths Adventure — Approved Artwork Handover

## Purpose
Visual direction/reference set for development branch `codex/v3-adventure-build`. The artwork has been approved as *concept art*, not as pixel-perfect UI specifications or already-integrated game sprites.

## Approved images
See `reference_images/` numbered in intended review order. Some of the Town concept boards are alternatives/variations; the original approved Town overview and home kitchen establish the visual quality, while later boards show location types and people. The final house exterior WITH car and driveway is approved: car, gardens, front door and driveway are scenery, not separate tasks.

## Locked identity and gameplay
- Connected world map, Base Camp central, bridges and blue portals. Nine existing worlds, exact names: Number Forest, Fraction Desert, Algebra Peaks, Geometry Kingdom, Ratio Island, Statistics City, Probability Portal, Measurement Mines, Practical Maths Town.
- Entrance scenes per world. Mature, detailed original voxel/2.5D look, not preschool art or rudimentary SVG shapes. Populate world with purposeful characters; main character in green.
- Base Camp interior + four external upgrade stages. Visual evolution must correspond to actual saved progress; avatar shop, trophy display, world access and progress remain usable.
- Practical Maths Town connected travels between shops, transport, jobs, leisure, library, home. Home activities only: realistic UK electricity/gas/water meter readings, bins/recycling and postbox/mail; separate cooking activities inside. The car/driveway/gardens/front door remain environmental decoration/navigation only, with no extra maths challenges.
- Interactive objects: open cupboards, visible ingredient inventory, recipe cards, shelves, movable baskets, correct UK money/timetables, scales and other maths tools. All displayed numeric or instructional text is code-rendered for mathematical accuracy, NOT baked into decorative image.
- Main character, supporting NPCs and optional avatar appearance: create consistent front/side/back poses, expression and wearable layers.
- Existing town plans and all nine worlds remain available. Exact locations and scene content should follow current gameplay, not arbitrary details/hallucinated text in generated board images.
- Industrial freight train in Algebra Peaks: sophisticated rail/engineering design, not toy train; physically connect/order/select cars as maths objects.

## Crucial production distinction
These reference PNGs are **composite illustrations**. They are not separable sprites, layered scenes or interactive DOM components. Codex must not simply stretch a collage into a background, crop tiny objects from composite images as a substitute for proper art, or replace gameplay with non-interactive posters. Make/source purpose-made *original* game assets based on approved references: individual backgrounds, transparent interactive props and UI layers with state variants (open/closed, selected/disabled, empty/full, etc.). If available tooling cannot produce equivalent visual quality, identify the asset gap and stop before approving or rolling out a visually inferior result.

## Recommended integration checkpoint
Build one representative playable section: Base Camp/world navigation -> home cupboard -> list -> bus -> supermarket -> checkout -> cooking, plus an interactive Algebra train puzzle. Demonstrate iPad viewport/screenshots, accurate live text and touch behavior. Keep `release/ipad` untouched until visual acceptance and full educational tests.

## Development status
Latest user-reported live release: `2e84e74`; first educational/graphics dev checkpoint `eff5d67` with 63 skills, 13 expanded. Do not assume these are current HEAD; verify repo before work. Preserve existing stored progress, PINs, parent privileges, coins, weekly 60-minute goal and 1:1 screen time reward.

## Compliance/rights
These were generated for this project. Do not copy Mojang/Minecraft branding, protected textures or proprietary character artwork. Similar voxel/block aesthetic is fine with original assets. Any NPC faces/outfits should be age-respectful and diverse without relying on identifiable real-person likeness.
