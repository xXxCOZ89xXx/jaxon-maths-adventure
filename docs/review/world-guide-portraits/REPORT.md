# Nine world guide portrait preview

Branch: `codex/painted-forest-preview`. Started from clean local commit
`d0dcacacdd654c86887ee083a2716ee30d00f3e5`, with `AGENTS.md` reviewed.

## Mapping

| World | Primary guide | Supplied file |
| --- | --- | --- |
| Number Forest | Rowan | number-forest-guide.webp |
| Fraction Desert | Saff | fraction-desert-guide.webp |
| Algebra Peaks | Finn | algebra-peaks-guide.webp |
| Geometry Kingdom | Kit | geometry-kingdom-guide.webp |
| Ratio Island | Marin | ratio-island-guide.webp |
| Statistics City | Ada | statistics-city-guide.webp |
| Probability Portal | Nova | probability-portal-guide.webp |
| Measurement Mines | Flint | measurement-mines-guide.webp |
| Practical Maths Town | Ellis | practical-maths-town-guide.webp |

The nine primary guide names come from the existing world registry. Distinct
Town venue hosts such as Priya, Sam and Jess keep their existing appearances;
the Town portrait belongs to Ellis. Town screenshots use his actual gateway
guide panel. Existing guide names, story copy and gameplay remain unchanged.

## Portraits only and fallback

The original WebPs were copied byte-for-byte into
`v3/assets/world-guide-portraits-preview/`; their manifest records file hashes
and alpha measurements. Each image is 560 × 700 RGBA, with alpha 0 at every
corner. All nine transparent pixel counts are independently checked by browser
canvas decoding against the source audit. No images were re-encoded or flattened.

The preview-only module wraps `V3Art.guide`. It does not override scene or avatar
rendering, edit saved progress, or change any existing background source, asset,
style or art preference. It is injected only by the offline preview builder;
production configuration and the ordinary source entry are unchanged.

**Guide portraits → New world guides** shows the supplied set. **Previous
guides** restores the appearance from the starting commit. This separate
selector leaves the existing background/art selector alone. `?guides=previous`
starts with the prior guides. Preferences remain transient and never enter
learner saves. Existing original sprite artwork and the earlier Rowan/Saff
portraits remain available through their previous controls.

The slot remains 80 × 110 CSS pixels, matching the previous guide layout.
`object-fit: contain` preserves the entire portrait at its original aspect ratio,
with a transparent background and no cropping. The player avatar, profile picture,
wardrobe, world landmarks, labels and task controls are untouched.

## Review files

Extract the main gallery ZIP and open `index.html`. It includes matching
before/after panels for all nine primary guides in all three layouts (54 PNGs),
plus one full game capture per layout, this report and machine-readable checks.
Separate layout packages contain all nine full game captures for each layout.
The desktop context set is split into two ZIPs to keep each download small.
All screenshots are actual game renders with fictional isolated saves.

- Desktop Chromium: 1440 × 1000.
- iPad portrait Chromium touch emulation: 820 × 1180.
- iPad landscape Chromium touch emulation: 1180 × 820.

The images and downloadable packages are attached to the approved private
review Page. They do not require a localhost connection or a running game server.
Physical iPad Safari rendering remains untested.

## Verification

See `validation.json` for final command results and the 27 per-world/layout
records. Thirty focused browser checks verify correct mappings, byte-identical
embedded files, alpha counts, full uncropped portrait bounds, no guide/text
overlap or horizontal overflow, save/profile invariance, fallback operation,
non-preview isolation and zero unexpected external requests or console errors.

For every world and layout, the scene screenshot before and after switching
portraits must be byte-identical. Scene HTML, background selection and player
markup are also compared. This verifies that portrait selection does not alter
backgrounds or player appearance. Existing tracked `v3/` files are checked
against the starting commit; the new portrait module/styles/assets are additive.

The previous forest/desert preview checks run with `PREVIOUS_GUIDES=1` and save
their screenshots to `work/`, preserving the earlier review captures. Baseline,
curriculum/touch logic, targeted gameplay models and the complete local iPad
save/recovery gate provide regression coverage. The timer issue recorded in
the preceding desert review is outside this portrait-only change; no timer code
is modified or claimed fixed.

| Check | Result |
| --- | --- |
| Preview build, JavaScript syntax, `git diff --check` | Passed |
| New nine-guide browser checks | 30 passed |
| Prior Number Forest and Fraction Desert art checks | 18 passed |
| Baseline `npm test` | Passed |
| Curriculum and touch logic/audits | Passed |
| All-world gameplay model browser checks | 16 passed |
| Complete local iPad save/recovery gate | Logic/database passed; 14 browser checks passed |
| Background pixel comparisons | Identical in all 27 world/layout cases |

The scoped run has 78 passing browser checks and no failures. Existing tracked
`v3/` files and the ordinary source entry are unchanged from the starting commit.

Reproduce the main checks with:

```sh
npm run build:preview
npx playwright test -c playwright.guide-portraits.config.cjs
```

## Limits

The portraits retain the established compact guide-panel size. No new clipping,
checkerboard, text overlap or horizontal overflow was observed. The existing
background style blend and map pin/caption overlap from earlier previews remain
as before. The additional development selector can increase header height on
narrow layouts. Those development controls do not change the game artwork.

No push, merge, deployment, production setting change, real account access or
learner-data access was performed. A local revert removes this portrait layer
without any save migration.
