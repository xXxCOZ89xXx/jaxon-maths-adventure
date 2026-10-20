# V3 hands-on maths: interactive coordinates and reusable activity requirements

Updated 20 October 2026. Design feedback from Jaxon's parent; this supersedes the earlier V2 branch review for these requirements. Codex's V3 build is in progress. Keep this as a specification rather than modifying its in-progress source.

## Geometry: coordinate plotting must be a real graph

The earlier preview was **incorrect** because it used 6×6 square buttons each labelled with its own coordinates, effectively providing the answers.

Required:
- Display a two-dimensional Cartesian plane with horizontal **x** and vertical **y** axes, numbered at their tick marks, with grid lines and visible intersections. Do **not** print (x, y) answers next to every dot.
- Ask the learner to plot a target point such as (3, 2). They tap/drag a marker to a **point at the intersection** of two grid lines, not inside a labelled tile.
- Keep a selected-point marker, submit/check button, feedback and hints. Avoid displaying the coordinate pair of a selected intersection as a visible answer cue before checking; point coordinates can be exposed to assistive tech to make the task usable.
- Enable touch or mouse pointer selection and movement, as well as keyboard operation with visible focus. Markers/targets need generous hit areas; use non-colour-only feedback.
- Introduce all four quadrants and negative coordinates when appropriate to Jaxon's assessed level; positive first-quadrant practice is an early starting level only.
- For future harder problems, provide plot-a-route, reflection across an axis, transformations and distance on a coordinate plane, always preserving actual numbered axes.

An isolated demonstration has been updated at:
`world-interactions-preview.html`
(https://xxxcoz89xxx.github.io/jaxon-maths-adventure/world-interactions-preview.html).

## V3 interactivity across all worlds
- Most practice content should be **interactive-first**, rather than all multiple-choice or typed questions: draggable/tappable number objects, fraction shading, bar modelling, sliders, shape building, labels, graphs and other hands-on manipulation.
- Practical Maths Town particularly should feel like doing actual tasks: fill shopping baskets, price stock/clothing, apply discounts, pay and give change, weigh goods, split quantities and fill containers.
- Fraction areas should support shading portions of bars, circles and area models by touch or drag, matching equivalent fractions and recombining pieces.
- Reusable activity primitives should accept structured problem/answer data so difficulty and content can adapt across worlds. Don't build only a single hardcoded question per activity.
- All interactions must work on Jaxon's iPad, include tap-to-select alternatives to drag gestures, offer full keyboard access, maintain readable feedback, use first-attempt vs assisted mastery tracking, and avoid corrupting/creating rewards from activity repetition.
- Progress writes must obey learner/parent RLS and server-authoritative reward controls before integration into the secure game.

## Hidden “Easter eggs”
- Jaxon means **secret videogame discoveries** (hidden objects, rooms, characters, animations, collectibles), not literal eggs. These should be exploration extras and can have optional scavenger-hunt collection progress. No pressure or mandatory hunting.
- Do not award unbounded coins or screen-time from hidden discoveries.

## Release status
The coordinates example in the isolated preview is changed and programmatically checked for: 36 distinct selectable intersections, tick labels on both axes, no visible per-cell coordinate text, and correct placement of marker at (3, 2). Full browser/iPad interaction and integration into V3 are **not yet tested or delivered**.

Do not overwrite Codex's work in progress merely to import this preview. Review its finished implementation and adapt this requirement to V3's activity architecture.
