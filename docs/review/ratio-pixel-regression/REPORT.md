# Ratio Island background pixel comparison

The required CI check in PR 7 failed in the private-game builder's Ratio Island iPad landscape case at commit 9270e93. The scene screenshot included the interactive supply-crates control, restoration labels and player as well as the background image.

## Reproduction and cause

Downloaded the failed CI trace from run 40580721607, job 122459049310. Its before/after trace frames differ at the rounded corners of the highlighted supply-crates control. Repeated the unchanged world/guide screenshot sequence locally at 1180 × 820 with the same fictional connected build. Twenty isolated runs initially passed; repeating the same screenshot/toggle cycle within one page reproduced the failure at cycle 2 without changing application code, input state or artwork.

The lossless 1102 × 736 composite PNGs differ at 12 pixels, maximum channel difference 3. Ten pixels sit at the control's rounded top corners and two in its translucent control/label area. The control has fractional geometry (left 556.9375, top 396.4375, width 363.65625, height 198.34375). The background, scene, control, guide and avatar rectangles, hover state and scroll offsets are identical before and after. Scene DOM, avatar DOM and saved JSON also remain equal. This is foreground control rasterization/compositing after the screenshot scrolling cycle, not changed background artwork or guide pixels. The guide starts below the world at viewport y 890.078125 during these world captures.

Local Chromium is 154; the failed CI uses Playwright's bundled Chromium 156. Downloading the latter into this environment is blocked by the managed CDN network policy. The local browser nevertheless reproduces the same affected control and strict pixel-comparison failure. The updated required CI runs on its original bundled browser; no browser/runner/workflow changes are used to avoid the failure.

## Test correction

Capture the full actual .scene-background image with Playwright's temporary screenshot stylesheet hiding sibling foreground layers and scene pseudo-elements only during that one capture. The application stylesheet and runtime are unchanged. Compare PNG buffers exactly, with zero tolerance. Also compare the background URL, natural size, document rectangle, fit, filter, opacity and transform. Preserve the full scene DOM, avatar and save equality assertions.

Keep the guide's identity/file-byte, alpha, sizing, cropping, visibility and image-error fallback checks separate. Normal guide/context screenshots still include all controls and the player. In Ratio Island on every layout and both builders, assert that hovering the foreground control changes the old composite, while leaving the background capture identical. Apply a test-only grayscale filter to the background and assert that the strict comparison detects it, then remove the filter and assert original equality. A real background change therefore cannot pass by being classified as foreground noise. No skip, retry, tolerance or production art change was introduced.

The corrected focused Ratio Island case passed 10 consecutive iPad landscape runs. Local reruns passed 45 production portrait/identity, 27 private-game portrait, 24 production regression, 14 save/recovery and 30 offline preview portrait checks, plus both build tests and baseline logic. These outcomes are recorded in validation.json; the new required CI result is recorded by PR 7. The two background-layer PNGs in this gallery are identical; the original composite PNGs retain all 12 changed pixels for independent inspection.

No production/application source, portrait asset, background asset, player/profile artwork, save behavior, account, Supabase or production setting changes are part of this correction. Physical iPad Safari remains untested.
