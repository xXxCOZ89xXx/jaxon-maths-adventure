# World-map marker bounds

Release baseline: `9a63750ab5687ea28e65150c5f8185b29e04974a`, verified against the remote `release/ipad` before creating `fix/world-map-marker-bounds` on 11 November 2026.

## Confirmed cause and correction

`V3Adventure.routes(world)` combines the three original subject-world routes with curriculum routes. Number Forest therefore has eight valid routes; the other subject worlds have four to eleven. `worldPage()` rendered every route but indexed three-entry x/y arrays. For routes 4 onward it emitted `left:undefined%;top:undefined%`. The browser discarded those declarations, placed the absolutely positioned buttons at the navigation element's static position after the artwork, and stacked them. The `translate(-50%,-50%)` transform pushed them partly left of the map. Number Forest's last marker, **8**, covered markers 4–7. The artwork's `overflow:hidden` could not clip them because the marker navigation was its sibling.

The renderer now calculates a finite percentage position for every route, with up to four columns and sufficient spacing for the current route lists. The navigation explicitly covers the map bounds. Edge labels open inward, and top-row labels open below their buttons. No marker is concealed, clipped away or removed. Existing numbering, accessible names, action/route IDs and selected difficulty are retained. Route definitions, prerequisites, repair stages, save formats, mastery and reward logic are unchanged. Town retains its existing building navigation.

## Validation coverage

The new `test:map-markers` suite covers all nine worlds at:

| Project | CSS viewport | Input |
| --- | --- | --- |
| Desktop Chromium | 1440 × 1000 | Mouse and keyboard |
| iPad portrait Chromium | 820 × 1180 | Emulated touch and keyboard |
| iPad landscape Chromium | 1180 × 820 | Emulated touch and keyboard |
| Small touch Chromium | 360 × 800 | Emulated touch and keyboard |

Each case checks numeric percentage coordinates, artwork containment, minimum 44px targets, visible controls, distinct numbered pins, usable target centres, correct labels and existing action IDs. It activates every numbered route, including curriculum routes. Town's eight building controls are checked for containment, labels, existing actions and usable centres; their deliberately building-sized hit regions are preserved.

Repair checks cover unassessed/locked entry, all three stages ready in sequence, each stage paused and resumed after reload with its exact task snapshot, and all three completed recaps. Completed records, milestones, assessment evidence, coins, equipment and unknown future fields remain intact. Fixtures are fictional; all non-loopback browser traffic is intercepted and denied, or handled by the existing fictional cloud adapter in the private-build suite. No real account or learner service is accessed.

Physical iPad Safari is not tested by these Chromium viewport simulations. No release PR, merge or deployment is part of this change.

## Reproduction commands

```sh
npm ci
npm test
npm run test:map-markers
npm run test:area-maps
```

Local Linux runs can use `V3_CHROMIUM_EXECUTABLE=/usr/bin/chromium`. CI uses its installed Playwright Chromium. The new suite is included in the existing offline QA workflow, with screenshots and browser results uploaded as review evidence.

To capture the unchanged release baseline with all its local script dependencies:

```sh
mkdir -p work/marker-baseline
git archive 9a63750ab5687ea28e65150c5f8185b29e04974a v3-adventure.html v3 v2-review-bank.js v2-guided-teaching.js v2-maths-tools.js v2-extra-tools.js | tar -x -C work/marker-baseline
MARKER_BASELINE=1 npm run test:map-markers
```

Baseline mode explicitly asserts the original invalid coordinates and, for Number Forest, that marker 8 crosses the left and bottom edges. Normal mode checks the repaired geometry and persistence. Browser JSON reports and full captures are written to `work/map-markers/`; selected release and fixed captures are also committed below for review without running the game.

## Screenshot gallery

Each cell links to the unchanged release (**before**), the fixed map with no repairs complete (**after**), and the fixed map with all three stages complete (**complete**). These are captures of the actual local renderer using fictional saved state.

| World | Desktop | iPad portrait | iPad landscape | Small touch |
| --- | --- | --- | --- | --- |
| Number Forest | [before](screenshots/before/desktop-chromium/number-0.jpg) · [after](screenshots/after/desktop-chromium/number-0.jpg) · [complete](screenshots/after/desktop-chromium/number-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/number-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/number-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/number-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/number-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/number-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/number-3.jpg) | [before](screenshots/before/small-touch/number-0.jpg) · [after](screenshots/after/small-touch/number-0.jpg) · [complete](screenshots/after/small-touch/number-3.jpg) |
| Fraction Desert | [before](screenshots/before/desktop-chromium/fractions-0.jpg) · [after](screenshots/after/desktop-chromium/fractions-0.jpg) · [complete](screenshots/after/desktop-chromium/fractions-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/fractions-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/fractions-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/fractions-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/fractions-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/fractions-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/fractions-3.jpg) | [before](screenshots/before/small-touch/fractions-0.jpg) · [after](screenshots/after/small-touch/fractions-0.jpg) · [complete](screenshots/after/small-touch/fractions-3.jpg) |
| Algebra Peaks | [before](screenshots/before/desktop-chromium/algebra-0.jpg) · [after](screenshots/after/desktop-chromium/algebra-0.jpg) · [complete](screenshots/after/desktop-chromium/algebra-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/algebra-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/algebra-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/algebra-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/algebra-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/algebra-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/algebra-3.jpg) | [before](screenshots/before/small-touch/algebra-0.jpg) · [after](screenshots/after/small-touch/algebra-0.jpg) · [complete](screenshots/after/small-touch/algebra-3.jpg) |
| Geometry Kingdom | [before](screenshots/before/desktop-chromium/geometry-0.jpg) · [after](screenshots/after/desktop-chromium/geometry-0.jpg) · [complete](screenshots/after/desktop-chromium/geometry-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/geometry-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/geometry-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/geometry-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/geometry-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/geometry-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/geometry-3.jpg) | [before](screenshots/before/small-touch/geometry-0.jpg) · [after](screenshots/after/small-touch/geometry-0.jpg) · [complete](screenshots/after/small-touch/geometry-3.jpg) |
| Ratio Island | [before](screenshots/before/desktop-chromium/ratio-0.jpg) · [after](screenshots/after/desktop-chromium/ratio-0.jpg) · [complete](screenshots/after/desktop-chromium/ratio-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/ratio-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/ratio-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/ratio-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/ratio-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/ratio-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/ratio-3.jpg) | [before](screenshots/before/small-touch/ratio-0.jpg) · [after](screenshots/after/small-touch/ratio-0.jpg) · [complete](screenshots/after/small-touch/ratio-3.jpg) |
| Statistics City | [before](screenshots/before/desktop-chromium/statistics-0.jpg) · [after](screenshots/after/desktop-chromium/statistics-0.jpg) · [complete](screenshots/after/desktop-chromium/statistics-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/statistics-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/statistics-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/statistics-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/statistics-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/statistics-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/statistics-3.jpg) | [before](screenshots/before/small-touch/statistics-0.jpg) · [after](screenshots/after/small-touch/statistics-0.jpg) · [complete](screenshots/after/small-touch/statistics-3.jpg) |
| Probability Portal | [before](screenshots/before/desktop-chromium/probability-0.jpg) · [after](screenshots/after/desktop-chromium/probability-0.jpg) · [complete](screenshots/after/desktop-chromium/probability-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/probability-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/probability-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/probability-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/probability-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/probability-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/probability-3.jpg) | [before](screenshots/before/small-touch/probability-0.jpg) · [after](screenshots/after/small-touch/probability-0.jpg) · [complete](screenshots/after/small-touch/probability-3.jpg) |
| Measurement Mines | [before](screenshots/before/desktop-chromium/measure-0.jpg) · [after](screenshots/after/desktop-chromium/measure-0.jpg) · [complete](screenshots/after/desktop-chromium/measure-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/measure-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/measure-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/measure-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/measure-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/measure-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/measure-3.jpg) | [before](screenshots/before/small-touch/measure-0.jpg) · [after](screenshots/after/small-touch/measure-0.jpg) · [complete](screenshots/after/small-touch/measure-3.jpg) |
| Practical Maths Town | [before](screenshots/before/desktop-chromium/town-0.jpg) · [after](screenshots/after/desktop-chromium/town-0.jpg) · [complete](screenshots/after/desktop-chromium/town-3.jpg) | [before](screenshots/before/ipad-portrait-chromium/town-0.jpg) · [after](screenshots/after/ipad-portrait-chromium/town-0.jpg) · [complete](screenshots/after/ipad-portrait-chromium/town-3.jpg) | [before](screenshots/before/ipad-landscape-chromium/town-0.jpg) · [after](screenshots/after/ipad-landscape-chromium/town-0.jpg) · [complete](screenshots/after/ipad-landscape-chromium/town-3.jpg) | [before](screenshots/before/small-touch/town-0.jpg) · [after](screenshots/after/small-touch/town-0.jpg) · [complete](screenshots/after/small-touch/town-3.jpg) |

## Results

- `npm test`: passed.
- `test:map-markers`: **36/36 passed**, all nine worlds × four viewports, including every numbered route and all three repairs.
- Release-baseline reproduction: **36/36 passed**, confirming invalid coordinates in the unchanged release and the detached Number Forest marker 8 at every viewport.
- `test:area-maps`: **80/80 passed** across private and demo builds at all four sizes, including playable repairs, exact mid-task resume, completed recaps and paused-check preservation.
- Negative control: normal geometry checks correctly reject the unchanged release at small touch for overlapping markers. This expected failure is separate from the passing fixed-code matrix.
- `git diff --check` and JavaScript syntax checks: passed.

The machine-readable case results are in [results.json](results.json). Hosted CI was not triggered because no PR is being opened and this feature branch is not a configured push trigger. Physical iPad Safari remains untested; all requested viewport sizes were checked locally with Chromium.
