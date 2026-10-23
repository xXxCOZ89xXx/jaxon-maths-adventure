# Avatar attachment fit

Scope: visual placement only, based on development baseline `f321852`. No catalogue, price, ownership, save, reward, authentication or backend changes.

`v3/avatar-art.js` defines named anatomy anchors and category rules, with explicit fit entries for all 34 wearable catalogue items. The six backgrounds retain their existing scenery treatment. Original atlas cells remain the source artwork; measured CSS crop windows remove transparent padding before positioning, so cell padding no longer sets apparent size. The original base proportions are retained with headroom reserved inside the shared 2:3 canvas.

- Headwear rests at the forehead; tall hats have silhouette-specific widths.
- Sunglasses align with the eyes; scarves/medals attach at the neck and watches at the wrist.
- Outfits span shoulders to ankles with item-specific widths; no blanket clothing reduction.
- Packs, shields, wings and the shoulder dragon render behind the body. Wings have their own span; backpack details stay near the upper back rather than below the hips.
- Gloves use separate left/right hand crop windows. Sword/wand handles align with the hand.
- Footwear sits on a shared sole line; companions have individual ground/hover sizes.
- All attachment coordinates are proportional and deterministic; CSS provides a stacked small-screen shop without changing the existing preview interaction.

## Focused local review

Run `npx playwright test -c playwright.avatar-fit.config.cjs`. Existing fictional camp fixtures block every external origin, including both real Supabase hosts. The tests capture seven actual shop combinations plus all 40 items/free appearance choices at 820×1180, 1180×820 and 390×844; exercise every item through equip/reload/unequip/reload without coin or ownership changes; verify proportional geometry, bounds and back/body layering at three avatar sizes; and confirm existing unowned previews never alter saved ownership/equipment.

For baseline captures: `AVATAR_PHASE=before AVATAR_REPORT=/workspace/artifacts/avatar-fit/before-results.json npx playwright test -c playwright.avatar-fit.config.cjs`. This serves the committed `f321852` renderer/CSS locally; gameplay files are not rewritten. Only the three capture cases run in baseline mode; new-behaviour assertions are explicitly skipped.

Then run `node scripts/build-avatar-fit-gallery.cjs`. It embeds the actual PNGs into `/workspace/artifacts/avatar-fit/REVIEW.html` for offline Edge review. `AVATAR_SHOTS` overrides the capture root; pass the same root to the gallery script. The catalogue contact sheets are test-only renderer displays, clearly distinguished from actual shop screenshots.

Existing artwork is fixed front-view 2.5D: outfits and footwear remain separate illustrated layers rather than rigged/animated clothing. Back equipment is intentionally partly occluded from the front. Full outfits mask only the starter clothing; original head, hands and soles remain visible through separate CSS-clipped instances of the original base asset. The space-suit crop excludes a neighbouring cape fringe in the source atlas. Owner visual approval remains required; no release promotion is authorised.

Focused validation: 12 avatar-fit cases (four per viewport) and two retained wardrobe compatibility cases pass in local touch Chromium. Baseline capture produced three capture passes. Physical iPad Safari and owner visual approval are not claimed. No external connections or live-account tests were used.
