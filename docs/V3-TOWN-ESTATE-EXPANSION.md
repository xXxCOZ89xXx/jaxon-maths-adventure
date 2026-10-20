# Practical Maths Town and the eight-stage estate

The approved illustrated/isometric adventure continues on `codex/v3-adventure-build`, draft PR #2. The residence itself grows from a tent into a multi-wing mansion. Town buildings now have separate architectures and cutaway interiors, while every existing task, teaching flow, hint and skill remains available.

## Review the finished scenes

[Owner-private game](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/) · [Town exterior/interior pairs](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/architecture.html) · [Five-stage side-by-side comparison](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/estate-compare.html) · [All eight camp stages](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/estate.html) · [Complete 92-image album](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/)

The Site gate uses the owning ChatGPT account; the game then uses the existing fictional staging families. Captures contain synthetic local state, not those accounts or records. No additional manual test session is requested. Current deployment and automated evidence are recorded at the top of [the QA report](V3-TEST-REPORT.md).

## Eight recognisable venues

| Venue | Exterior and plot | Interior and preserved activity |
| --- | --- | --- |
| Supermarket | Wide, low modern shop, glass entrance/windows, trolley bay, loading area and parking | Stock shelves, baskets and checkout/till; order totals, packs and change |
| Corner Café | Compact corner footprint, striped awning, outdoor tables, planters and menu | Food counter, tables, till and orders; totals, sharing and measures |
| Community Bank | Stone frontage, pillars, raised steps, secure entrance and ATM keypad | Teller counters, vault, cash machine and balance board; fictional account arithmetic |
| Shopping Centre | Larger connected storefronts, glazed entrance tower and different departments | Department displays and sale/budget boards; discounts, comparisons and budgets |
| Bus & Train Station | Clocked station canopy, track/platform, bus shelter, timetable and ticket points | Train, bus, platform furniture, clock and timetable; arrivals, tickets and elapsed time |
| Neighbourhood Home | Two-storey pitched-roof house, chimney, driveway/car, garden and domestic plot | Kitchen counter/sink, utility meters and table; bills, household budgets and measuring |
| Cinema & Leisure | Wide marquee, film posters, ticket entrance and sports annex | Screen, rows of seats and sports court; bookings, ticket totals and schedules |
| Workshop & Workplace | Sawtooth industrial roof, roller door, loading crates and safety/clock-in features | Benches, machinery, clock and timesheet; shifts, breaks and wages |

The Town map joins these plots with roads, pavements, crossings, lights, planting, benches and small figures. Numbered building entrances and the text links both open the existing activity. The interior/exterior switch keeps the exact current task, selections and visit; it does not restart a mission or grant credit. Readouts in the interiors use the current fictional exercise values.

## Eight stages, one evolving home

| Stage | Unique milestones | Visible development |
| --- | ---: | --- |
| 1. Wilderness Camp | 0 | Starter tent, fire, backpack and crate |
| 2. Established Campsite | 4 | Larger tent, awning, fence, storage, lanterns and garden patch |
| 3. Explorer’s Cabin | 10 | Timber cabin replaces the tent; chimney, porch, woodpile and water barrel |
| 4. Adventure Lodge | 18 | Upper floor, balcony/lookout, map room and more developed garden |
| 5. Workshop Homestead | 30 | Larger home, equipment workshop, tool shed, greenhouse and pump |
| 6. Watermill Estate | 45 | Expanded residence, mill, turning wheel, stream/channel, bridge, tank and pipework |
| 7. Powered Manor | 65 | Manor, hydro generator, mechanical link, distribution cabinet, cable/pole connections and warm-lit buildings |
| 8. Explorer’s Mansion | 85 | Multi-wing mansion, grand entrance, trophy room, courtyard fountain, gardens, advanced workshop and full lit grid |

The planner shows the earned home, next threshold, remaining unique milestones and a separate preview of every stage. Previewing never unlocks a building, changes coins or awards time. A short construction/crest celebration can be acknowledged once when a new stage is earned. Historical saves start at their already-earned stage without replaying earlier celebrations.

The mill wheel and current animate only when motion is enabled. They stop under reduced motion; the estate remains legible with sound off. Optional planner links open the existing fictional water-pump and power-planning maths activities. Their text explicitly describes a simplified maths model, not real engineering instructions.

## Progression and compatibility

There are **147 currently reachable unique milestone IDs**: 24 original restoration milestones plus 123 expedition/gateway level combinations across all nine worlds. Duplicate completions count once. Unknown or invalid strings do not unlock estate stages, but historical arrays/unknown fields are retained. Three older valid Town restoration IDs remain accepted for compatibility without being advertised as current capacity.

The suggested thresholds are retained. All 24 original restorations plus the 41 level-one mission/gateway combinations reach the powered manor at 65; another 20 level-two combinations reach the mansion. Level three and perfect independent mastery are unnecessary. This is a long-term goal, not a requirement to finish in one 60-minute week; individual pace varies and no completion-time promise is made. Guided adventure completion remains separate from independent assessment.

A small additive `adventure.campEstate` record tracks the highest earned stage and acknowledged celebration. Already-earned homes do not downgrade. Existing projects, camp placements, keepsakes, items, equipped avatar, balances, unfinished visits, learning evidence and unknown history survive migration. No save namespace/envelope replacement or database migration is needed.

Existing optional projects retain their requirements: greenhouse 12, tall lookout 30, noticeboard 60. The stage-four lodge balcony is distinct from the taller optional lookout. The stage-five homestead includes its greenhouse even if the earlier project was not manually built; an old project flag is preserved, and the interface avoids offering a duplicate build. Main residence upgrades never cost learning coins. Owned cosmetics and separate shop purchases remain unchanged.

## Rendering, accessibility and inspection

New architecture uses original SVG/CSS and shared isometric primitives, with no external images, additional engine, animation loop or dependency. Every camp scene remains under the automated SVG-element budget. This is a bounded 2D diorama, not a free-roaming simulation; physical-device memory/performance is still a later acceptance check.

The new Town overview scrolls internally on narrow tablets and retains accessible text entrances. Interior and exterior scenes use their complete aspect ratio. Camp controls retain touch targets and keyboard alternatives; number-line answers continue to wrap visibly in portrait. No camp navigation, preview, celebration, decoration or scene switch extends the learning activity window.

Rendered review corrected a negative-slope SVG path defect, greenhouse/distribution-cabinet overlap, powered-building light consistency and machinery connection clarity. New screenshots cover all eight exteriors/interiors, all eight estates, five-stage comparison, and representative activities in both iPad orientations. Earlier comparison images are preserved in `tests/visual/pre-estate/`.

## Automated evidence and limits

Five new model suites cover thresholds/capacity, duplicates and real repeat completions, one-time celebrations, compatible history/equipment, all venue/stage SVGs and machinery. Three additional browser cases per project verify all Town entrances/view switches, all camp stages/equipment/persistence, preview/celebration safety and reduced motion. Existing regressions cover learning, parent/learner PINs, locking, roles, family isolation, recovery, CAS/offline queues and immutable reward retries.

See the current [QA report](V3-TEST-REPORT.md) for actual local/hosted totals and deployment provenance. Database tests use real disposable PostgreSQL with fictional Auth claims; browser cloud tests use intercepted fictional responses. The read-only identity audit validates the configured staging reference/URL, but the environment proxy still rejects CONNECT with 403 before Supabase is contacted. No live authenticated result is claimed or credentials requested. Existing owner-reported real staging checks remain separate evidence.

Physical iPad Safari, actual cross-device/offline recovery, direct hosted API security and deferred email recovery remain in the already-planned combined family session for later. No production settings, real records, main, live homepage or GitHub Pages are changed.

## Optional separate custom-asset work

The current bespoke venue and machinery SVGs are complete for this scope. A later commissioned asset pass could add character pose/gesture sheets, animated shopkeepers, more detailed room props and unique keepsake illustrations. Those need an agreed visual sheet, original layered SVG assets, tablet-size previews and an asset-size/accessibility review; they are not missing runtime dependencies or claimed completed artwork. Keep silhouettes, readable entrances and reduced-motion fallbacks when adding detail.
