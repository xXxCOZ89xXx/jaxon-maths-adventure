# Playable graphical-direction checkpoint

**Owner review required before the remaining visual rollout. Nothing from this checkpoint is published to the live iPad game.**

These captures come from real running game screens in Chromium with iPad touch emulation, not generated concept art. The source runs in the normal offline camp and the fictional staging build. Original SVG primitives, layered environments and native controls keep it portable between static hosts; there is no external asset service, 3D engine or animation loop.

| Screen | Playable behaviour |
| --- | --- |
| [Town map](../tests/artifacts/major-town-map-1180.png) | Eight building entrances, roads, crossings and district details. Home opens all plan categories; suitable businesses start employee plans. |
| [Kitchen](../tests/artifacts/major-kitchen-1180.png) | Opening cupboard/fridge compartments, identifying stock, recording quantities, opening the actual recipe card and resuming saved work. |
| [Supermarket](../tests/artifacts/major-market-1180.png) | Selecting shelf products, adding/removing basket contents, updating the visible basket and carrying the same list/cash/receipts through the journey. |
| [Industrial railway](../tests/artifacts/major-freight-1180.png) | Original freight locomotive, small bogies, container wagons, rails and couplings. Tap to connect a carriage, replace a wrong connection, or assemble the ordered wagon train. |

To play the development sample locally: `npm ci`, `node tests/prepare-v3.cjs`, then `python3 tests/serve-preview.py`; open `http://127.0.0.1:4173/v3-adventure.html`. This is fictional offline state, not a way to access real accounts. `preview-dist/PLAY-V3.html` is also generated as a self-contained offline review artifact; it is not a hosted deployment and iPad Files is not a reliable HTML-app launcher.

In the game: Worlds → Practical Maths Town → choose a category/plan or the original Bolognese journey; use the Home map entrance to return to the plan chooser. For freight: Worlds → Algebra Peaks → Mountain railway → start the task. All three difficulty choices remain available. Keyboard/tap alternatives avoid requiring precise dragging. Reduced-motion behaviour and no mandatory sound are retained.

Alongside the sample, all seven jobs now offer two actual shifts that change the saved wages, finish time and later allocation. Clothing/leisure have additional contextual work. Meals add different tasks: tray comparison, pancake batches, vegetable weighing, coordinated rice/sauce timing and original-recipe preparation time. All 27 plan IDs and older journey snapshots remain supported.

**Remaining work after visual approval:** roll the approved style through the other world/venue environments; expand the remaining question-bank/teaching coverage; deepen travel/appointment recovery and further cooking/shop decisions; finish long-term retention/size and full-upgrade acceptance. Current travel plans still ask the learner to correct an unsuitable timetable choice rather than simulate a missed appointment and rebuild the whole day. Kitchen preparation uses ordering, measurement and equipment controls, not simulated chopping or heat. Some produce/packaging art and other venues retain their earlier graphics. This is a proposed direction, not the finished major upgrade.

Focused verification: 48 representative browser cases passed in portrait/landscape, followed by six changed-meal cases; generated-question, prerequisite/mastery, published-snapshot, pending-save and parent-control checks passed using fictional data. Physical Safari is not certified by Chromium emulation.

The only owner decision at this checkpoint is whether to approve or revise the four-screen visual direction. Keep `release/ipad` unchanged until that approval and the completed upgrade's acceptance gates.
