# Painted Forest development preview

Branch: `codex/painted-forest-preview`.
Base: merge commit `5ed0f4c6f00cc050bfc69c9d2c881dbd23d6c4e5`.
Read `AGENTS.md` and verified both the fetched `release/ipad` head and local HEAD
before editing. The release branch remains unchanged.

## Play and compare

```sh
npm ci
npm run build:preview
npm run preview
```

Open <http://localhost:4173/preview-dist/PLAY-V3.html>.
Use **Development art preview** in the Test Camp strip to switch between
**Painted forest + Rowan** and **Current artwork** without reloading or editing
the save. `?art=current` opens directly with the fallback. The preference is
transient; a normal reload defaults to painted unless the URL selects current.

The build embeds both new images and all local stylesheets in `PLAY-V3.html`.
It retains hash-authorised scripts and `connect-src 'none'`.

## Changes and reversal

- The supplied ZIP contains JPEG and WebP files, rather than PNGs. Both were
  added under `v3/assets/painted-forest-preview/` without re-encoding. The
  manifest records dimensions, SHA-256 checksums and alpha measurements.
- The painted image sits behind the Number Forest scene. A vertical mask fades
  only the original scenery's upper portion into the backdrop; the existing
  foreground, bridge, restoration objects, route buttons and task controls remain.
- Rowan's new portrait is visible only inside Rowan guide panels. The player
  avatar, header/profile picture, wardrobe and other guides are unchanged.
- Only `build-v3-preview.cjs` injects this experiment. The source offline entry
  point, staging and production build scripts/configuration are unchanged.
- No original artwork was overwritten or removed. The current-art switch
  removes the mask and hides the added backdrop/portrait. Reverting this branch's
  commit removes the complete experiment without any save migration.

## Alpha and screenshots

The supplied Rowan WebP is 512 × 640 RGBA. Alpha spans 0–255, with 140,438 fully
transparent pixels; all four corners have alpha 0. Browser canvas decoding
independently verifies the transparent pixel count. The portrait was inspected
in the real guide panel: no checkerboard or rectangular background appears.

[Open screenshot gallery](index.html). Each layout folder contains matching
`before-world.png` / `after-world.png`, `before-rowan.png` / `after-rowan.png`,
an isolated `after-rowan-panel.png`, and `after-restored.png`:

- Desktop Chromium: 1440 × 1000.
- iPad portrait Chromium touch emulation: 820 × 1180.
- iPad landscape Chromium touch emulation: 1180 × 820.

These are screenshots of the actual standalone offline game with isolated
fictional progress. “Before” uses the current-art fallback in the same preview,
with identical state and scene geometry. Physical iPad Safari remains untested.
Direct `file://` launch could not be verified because this environment's Chromium
policy rejects file navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`) before the app
loads. The requested localhost preview was tested successfully.

## Validation

See `validation.json` for the final command results. Focused browser tests cover
all three layouts, byte-identical embedded assets, browser-decoded portrait alpha,
zero console/runtime errors or external requests, no horizontal overflow,
unchanged saves/avatar markup/route geometry when switching art, landmark
navigation, before/restored states, solving a bridge puzzle and retaining its
restoration after reload. They also verify other worlds/guides and the ordinary
source entry retain current art.

Reproduce focused checks with:

```sh
npm run build:preview
npx playwright test -c playwright.painted-forest.config.cjs
```

Final results:

| Check | Result |
| --- | --- |
| Focused painted-art browser tests | 9 passed across all three layouts |
| `npm test` | Passed |
| `npm run test:curriculum` | Passed |
| `npm run test:touch` | Passed |
| `npm run test:curriculum-browser` | 81 passed |
| `npm run test:gameplay-quality` | Logic checks and 48 browser tests passed |
| `npm run test:ipad-release` | Logic/database checks and 14 browser tests passed |
| Initial `npm run test:touch-browser` | 55 passed; 2 timer assertions failed |
| Isolated timer-test rerun | All 3 layouts passed |
| Final `npm run build:preview`, JavaScript syntax, `git diff --check` | Passed |
| Requested preview URL | HTTP 200 |

The initial touch run overlapped separate browser work. Its two failures were
the existing focus-sensitive active-learning timer assertion (expected minutes
greater than zero; observed zero) in iPad portrait and landscape. Rerunning
`npx playwright test -c playwright.touch.config.cjs --grep 'Cancelled movement and Escape'`
alone passed all three variants. The test uses the unchanged ordinary source
entry point, which does not load the art experiment. No timer or gameplay code
was changed to obtain the passing rerun.

## Visual limits

- This is a blended backdrop prototype: the painted landscape and existing
  foreground use different perspectives/styles. The soft transition can show
  faint traces of the original upper scenery. It is not a newly painted unified
  scene.
- Existing world-map route pins can overlap restoration captions; later added
  curriculum routes also share a fallback pin position near the lower-left
  edge. This is visible in the current-art screenshots too. The preview keeps
  their existing positions and navigation.
- iPad portrait requires scrolling to the guide beneath the scene. The art
  comparison control adds development-only header height. No horizontal overflow
  was observed in the three tested layouts.

No release PR, merge, deployment, production configuration change, real account
access or learner-data access was performed.
