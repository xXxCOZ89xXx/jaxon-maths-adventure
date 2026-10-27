# Fraction Desert painted art preview

Development branch: `codex/painted-forest-preview`, continued from verified local
commit `79cb584afc386fe8529ec9cd413a7a098ebf200e`. `AGENTS.md` was read before edits;
the initial working tree was clean.

## Review downloads

Open `index.html` in the extracted review ZIP for matching before/after world
screenshots and guide-panel captures on desktop (1440 × 1000), iPad portrait
(820 × 1180) and iPad landscape (1180 × 820). Restored-world captures are also
included. These are original screenshots of the running standalone offline
artifact with isolated fictional progress, not recreated illustrations.

The gallery and individual images are also attached to the existing private
review Page approved by the owner. No localhost link is needed to review them.

## Implementation and fallback

The supplied JPEG backdrop and WebP portrait were added, without re-encoding,
under `v3/assets/fraction-desert-preview/`. Its manifest records dimensions,
checksums and alpha measurements. All previous artwork remains intact.

The backdrop sits behind Fraction Desert's existing scene. The same vertical
blend used by Number Forest fades the upper scenery while retaining the original
playable foreground, canal/waterwheel objects, restoration layers, navigation,
labels and task controls. Saff's new portrait appears only in her guide panel.
The player avatar, profile picture and wardrobe are unchanged.

The existing **Development art preview** switch now offers **Painted worlds +
guides** and **Current artwork** for both Number Forest and Fraction Desert.
The switch changes presentation without reloading or editing saved progress.
`?art=current` selects the fallback at load; no art preference is added to saves.

Only `build-v3-preview.cjs` injects the new module and styles. It embeds both
desert images, alongside the retained forest assets, in `PLAY-V3.html`. The
ordinary source entry, production/staging scripts and configuration are unchanged.
The offline artifact retains script hashes and `connect-src 'none'`.

Build locally with `npm run build:preview`. Focused validation is
`npx playwright test -c playwright.painted-desert.config.cjs`.

## Transparency and checks

The portrait is 560 × 700 RGBA. Alpha spans 0–255 with 149,965 fully transparent
pixels and alpha 0 at all four corners. The browser independently decodes and
checks these values. The rendered guide panel was inspected against its solid
green background: no checkerboard or rectangular backdrop is visible.

See `validation.json` for exact final commands and results. The focused checks
cover byte-identical embedded images, portrait alpha, the art fallback,
unchanged save/avatar markup/route geometry, before and restored states,
landmark navigation, solving a canal puzzle, restoration after reload, and
advancing to the next puzzle. They deny all external origins and check console
errors and horizontal overflow. Number Forest regression checks verify the
previous preview still behaves correctly.

Curriculum, touch and gameplay browser checks are targeted to Fraction Desert
and fraction activities; the focus-sensitive timer check is run serially. The
iPad save/recovery gate includes its full local logic/database/browser checks.
All tests use synthetic fixtures; no real learner data or accounts are used.

| Check | Final result |
| --- | --- |
| Offline preview build, syntax and diff checks | Passed |
| Fraction Desert preview | 9 passed, all three requested layouts |
| Number Forest preview regression | 9 passed, all three requested layouts |
| Baseline `npm test` | Passed |
| Curriculum and touch logic/audits | Passed |
| Targeted fractions curriculum browser check | 3 passed |
| Targeted fractions gameplay quality check | Logic passed; 2 browser checks passed |
| Fraction direct-practice touch check | 3 passed |
| Full iPad save/recovery gate | Logic/database passed; 14 browser checks passed |
| Existing active-learning timer check, isolated | 2 passed; iPad portrait failed |

The timer assertion expects active minutes greater than zero after a committed
edit but receives zero in iPad portrait. It failed in the initial combined touch
run and again when rerun alone. That check uses the ordinary source entry,
without the art modules; its test, entry, app, engine and touch code are all
byte-identical to base `79cb584`. The earlier forest review also recorded
intermittent failures of this check. This preview does not change timer logic;
the failure remains open and the full regression run is not claimed green.

## Visual limits

- The retained playable foreground and painted backdrop have different styles
  and perspectives. The approved soft blend leaves faint traces of the former
  upper scenery; this remains a visual prototype.
- Existing route pins can overlap restoration captions, and later curriculum
  routes share a fallback pin position near the lower-left corner. This is also
  present in the current-art captures; the preview keeps existing navigation
  positions. The opaque caption backgrounds retain contrast.
- iPad portrait scrolls to the guide below the scene. The development control
  adds header height. No horizontal overflow was found in the tested layouts.
- iPad checks use Chromium touch emulation. Physical iPad Safari is untested.

No push, merge, deployment, production setting change, real account access or
learner-data access was performed. The preview can be reverted without any save
migration; the in-game current-art switch provides the immediate fallback.
