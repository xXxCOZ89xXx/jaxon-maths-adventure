# Avatar attachment fit — owner review only

The current follow-up compares against `a1f14cf`. It changes presentation only: existing catalogue IDs, artwork files, prices, ownership, economy, gameplay, saved JSON, namespaces, authentication and backend configuration are unchanged. Keep `release/ipad` and the live game unchanged.

## Atlas and placement corrections

- Explorer helmet and hard hat use individual widths and cropped front brims, excluding the rear opening/strap silhouette. Headphones have their own smaller fit.
- Jacket and hoodie use separate shoulder and leg crops joined at the waist. The source's detached collar/hood artwork is excluded, retaining the original base head, hair, hands and soles.
- Back items have raised upper-back anchors and individual offsets, with z-order below the body. Wings are raised without changing their span. Packs/shield/parachute retain recognisable edge silhouettes.
- Sunglasses are smaller. Medal/scarf attach at the neck. The watch rotates around the wrist above the hand. Glove crops swap sides and rotate fingers downward. Sword/wand handles pivot at the hand and render behind an original hand fragment.
- All seven catalogue companions restore the pre-`a1f14cf` attachment frame: left 76%, top 66%, width 40%, height 32%. Their intentional overflow is allowed by the geometry checks.
- Expression atlas cells contain complete heads. Only their inner face is now shown; no complete extra head, hair or ear is drawn. Non-default hair masks the original upper hair. A small skin-only sample from the same atlas fills the exposed forehead behind the new hair; this prevents a transparent forehead gap.
- **Footwear limitation:** the upgrade atlas contains angled shoes, not front-facing pairs. Options 1–3 now reuse the existing front-facing starter sole/geometry with brown, blue and gold material colours. They do not introduce newly illustrated boot shapes. This corrects orientation while keeping the artwork source unchanged; distinct front-facing boot silhouettes would require separately approved artwork.
- Free appearance option 0 and all six background presentations are preserved pixel-for-pixel in the focused browser comparisons.

## Focused local review

`npx playwright test -c playwright.avatar-fit.config.cjs` runs 18 cases: six per viewport at 820×1180, 1180×820 and 390×844. Existing camp fixtures deny every external origin, including both actual Supabase hosts. Coverage includes all 40 catalogue items, equip/reload/unequip/reload with unchanged coins/ownership, existing read-only unowned preview, proportional geometry/layering, single-head expression cropping, frontal footwear, wrist/grip placement, restored companion dimensions, and byte-identical rendered PNG comparisons for option 0/backgrounds against the baseline.

Baseline captures: `AVATAR_PHASE=before AVATAR_REPORT=/workspace/artifacts/avatar-fit-followup/before-results.json npx playwright test -c playwright.avatar-fit.config.cjs --grep 'actual shop combinations'`. It serves committed `a1f14cf` renderer/CSS locally without rewriting gameplay files. Baseline capture runs three cases; final assertions run without skips.

`node scripts/build-avatar-fit-gallery.cjs` creates `/workspace/artifacts/avatar-fit-followup/REVIEW.html` and three smaller self-contained HTML galleries. Pass a root directory as the first argument to change the gallery destination; `AVATAR_SHOTS` changes test capture destination. Each viewport includes seven actual shop equipment combinations, four actual free-appearance shop screenshots and a contact sheet of all 40 items/options 0–3. Contact sheets are clearly labelled test-only displays using the actual renderer. Original and revised captures remain paired; no concept art is substituted.

Existing wardrobe compatibility check: `ROLLOUT_REPORT=/workspace/artifacts/avatar-fit-followup/retained-wardrobe-results.json npx playwright test -c playwright.rollout.config.cjs --grep 'Layered wardrobe'`.

The art remains fixed-view 2.5D, not a rigged character. Back equipment is intentionally partly occluded. Physical iPad Safari and owner approval are not claimed. No release publication is authorised.

Validation for this follow-up: 18 focused cases passed (no skips/flakes/failures), two retained wardrobe compatibility cases passed, and all 12 visual/geometry/preservation cases passed again after the final headphone-opening mask. Baseline capture: three cases passed. The gallery contains 72 paired PNGs across the three viewports, including appearance options 0–3. All screenshots use local fictional state; no real account or pending save was read or altered.
