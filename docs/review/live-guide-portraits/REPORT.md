# Production guide portraits verification

27 October 2026. Feature branch codex/painted-forest-preview, continued from d2703f4. Release baseline 5ed0f4c6f00cc050bfc69c9d2c881dbd23d6c4e5.

The shared entry v3-adventure.html loads the approved portrait renderer and CSS before the game. Mapping and 80 × 110 contain sizing reuse the approved preview. The nine original 560 × 700 transparent WebPs remain byte-identical to d2703f4. Primary world guides change only; player/profile art and other Town hosts remain original. Original guide markup stays visible until image load and returns automatically on image error. No inline event handlers are needed under CSP.

Both the production builder and the existing private game's build-v3-staging.cjs path include the shared layer and exclude painted backgrounds and development art controls/assets. The name of the latter builder is historical; no hosting/backend/settings change was made. Both built-game paths were tested with fictional intercepted identities only. No remote request was allowed to continue.

The production builder's old full-text replacement omitted the receipt verification added to staging-app.js. Its replacement now checks exactly one identity-error branch and its whitespace-normalized current guard, failing closed on a changed guard. Production continues to reject identity errors unconditionally, and preserves project name/ref, contract/readiness, activation and saveReceiptVersion checks. staging-app.js and backend-config.js are unchanged.

Production regression tests now open and close the existing workshop dialog, exercise the existing reconnect flush after batched edits, and check recovery after a deliberately lost acknowledgement on reload. No gameplay, save, queue or authentication source was changed for these test corrections. Separate Playwright output directories avoid artifact deletion between suites.

All final checks passed: 174 scoped Chromium browser checks (45 production portraits/identity, 27 private-game-builder portraits, 24 production regression, 30 offline portraits, 9 forest + 9 desert fallback, 14 iPad save/recovery, 16 gameplay models), plus baseline, curriculum, touch, gameplay logic, both build tests and preview build. CI save-and-recovery now also runs both build tests and production/private-game portrait suites before merge.

Screenshots: desktop 1440 × 1000, iPad portrait 820 × 1180, landscape 1180 × 820. Each of nine guides has before/after panels and a full viewport capture for each layout. Before uses retained original guides; no development switch is shipped. All 54 built-game background-image pixel comparisons are identical across portrait toggles. These now isolate the background image from interactive foreground overlays; see ../ratio-pixel-regression/REPORT.md for the reproduced hover-control rasterization failure and test correction. Canvas checks match original transparent-pixel counts and transparent corners. Every portrait fits its panel without cropping or heading overlap.

Visual limits: physical iPad Safari remains untested. Existing player overlap with some world landmark captions is unchanged; no guide crop or checkerboard was observed. Screenshots use fictional accounts and are not hosted learner acceptance.

Downloadable gallery: https://chatgpt.com/space/page_a310d0ac8fb88191893a62539bec0e68 . Earlier offline reviews remain available there. Release status is recorded by the pull request and exact merge/deployment check, not inferred from these local tests.
