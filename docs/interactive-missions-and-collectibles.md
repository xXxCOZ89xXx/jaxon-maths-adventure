# Interactive-first missions and hidden discoveries — design brief (updated 20 October 2026)

## User requests
- Jaxon suggested video-game “Easter eggs”: hidden secrets, surprises and collectible discoveries across worlds (not literal eggs).
- Parent suggested hands-on shop learning in a town: drag apples into a basket, drag correct price tags onto clothing.

## Status
- Existing V2 development game predominantly uses multiple-choice questions and text entry. Full drag-and-drop tasks are not yet integrated into the authenticated adventure.
- Independent `town-interactions-preview.html` is a **non-authenticated interaction experiment**, not a released mission. It must not save learning state, award coins, or alter rewards.
- Independent `world-interactions-preview.html` now illustrates six more interactive question mechanics: shade a fraction, move on a number line, place a coordinate marker, build a bar chart, group ratio counters and fill a measuring container. This is a **non-authenticated interaction lab** on the repository default branch, not an integrated or browser-verified release.
- Keep the live `index.html` unchanged until learning integration and security tests pass.

## Market Town activities — first release candidate
1. Grocery stall: physically move/tap apples into basket to fulfil an order. Ask learner to calculate total using unit price in pence. Demonstrate multiplication or repeated addition; scaffold with grouped visuals.
2. Clothes stall: move matching price labels onto hats, T-shirts and jackets. Prices determined by simple subtraction, percentages and half-price discounts.
3. Support both mouse drag and iPad touch via Pointer Events. Provide equally complete tap-to-select/tap-to-place AND keyboard/button alternatives, visible focus, speech-reader labels, non-color-only success/error feedback.
4. Progressive task variation should be tied to evidence from skill assessments, not chronological age or one error. Low-demand tasks might count concrete objects, higher demand tasks use decimal money, change, discounts and multi-item purchases.
5. Track first-try correct, correction after hint, and required support separately. Save to the learner's secure progress record only after reviewed integration. Prevent repeated coin earning just by moving items.
6. Avoid generic draggable-HTML5-only implementation because iPads and touch browsers need reliable support.

## Future secret discoveries ("Easter eggs" in the video-game sense)
- **Clarification from Jaxon:** "Easter eggs" means deliberately hidden secrets, surprises and collectible objects around the worlds — **not actual eggs**. Never design a literal egg hunt unless he later requests one.
- Hide varied world-specific surprises: a secret cave behind a waterfall, a hidden NPC or message, a tiny treasure token on a bookshelf, a block that opens a passage, a collectible symbol or an amusing animation.
- Some secrets can be collected and shown in a discovery cabinet or map log; others can simply be fun one-time discoveries. Avoid confusing them with purchased avatar items.
- Offer optional hints, progress counters for unique secrets (e.g. “2/3 discoveries in this world”) and no countdown or pressure. Allow exploration in any order and a low-distraction mode.
- Discoveries do not have to be linked to maths questions and **must not** grant unlimited coins or screen-time. Use learner-scoped unique IDs and server validation before awarding anything valuable.
- Ensure hidden elements are still discoverable via touch, keyboard and assistive technology; provide an optional hint or discovery mode rather than relying solely on tiny visual targets.
- This is a **future backlog feature**, not an implemented game feature. Decide actual secrets and collection design with Jaxon later.

## Interactive-first experience requirement (parent feedback, 20 October 2026)
**Applies to every world and especially Market Town.** Do not treat dragging as an occasional bonus minigame. Most practice missions should invite Jaxon to manipulate concrete objects, positions, patterns or diagrams instead of merely choosing from answer buttons.

Current branch inspection: Number Forest (five skills) and Fraction Desert (one skill) are playable but mainly multiple-choice; the remaining six named worlds are previews only. The Market Town interaction lab has apples into a basket and sale-price labels, but is not integrated into the authenticated game. The discovery check is mainly numeric text entry. The existing main game has no general-purpose pointer/touch manipulation engine.

| Area | Proposed hands-on mission patterns |
| --- | --- |
| Number Forest | Drag number cards into correct order; build place-value numbers from digit blocks; move marker on negative number line; bundle tens and hundreds; lay out multiplication arrays; drag operations into an expression |
| Fraction Desert | Shade unit squares or circles; split bars into equal shares; overlay equivalent fraction strips; drag parts together; build percentages on 10×10 grids; match fractions to decimals |
| Algebra Peaks | Drag equation terms onto balanced scales; drag tiles to make expressions; move inverse operations across a seesaw; build sequences from shape patterns |
| Geometry Kingdom | Construct shapes on geoboards; sort polygons; drag or rotate angles; move plotted objects on a coordinate grid; measure angles with an interactive protractor |
| Ratio Island | Share blocks into ratio groups; mix colours in a given ratio; resize recipes; drag quantities into proportion tables |
| Statistics City | Build pictograms; drag bars up and down; move points onto graphs; sort data sets; explore median by reordering values |
| Probability Portal | Place outcomes on a chance scale; fill sample-space grids; sort event cards by likelihood; simulate spinners and compare predictions to results |
| Measurement Mines | Move an on-screen ruler; fill containers to a target amount; assemble area tiles; build 3D cuboids; convert units by moving across labelled scales |
| Market Town | Fill fruit baskets and calculate totals; tag clothes with sale prices; make payments by moving coins and notes; calculate change at checkout; stock shelves to fractions/ratios; pack goods by weight and unit price; arrange shop windows; compare value-for-money offers |

### Content and assessment standards
- Mix **multiple-choice, typed answers, touch/drag placement, painting/shading, sliders, sliders with markers, graphing, grouping, reordering, and building**. Do not force drag on a learner who prefers tapping.
- Use pointer events for finger/mouse and equivalent tap-to-select/tap-to-place plus fully operable keyboard controls. All targets should be generous and have labels, visible focus, semantic success/error messages and reduced-motion support.
- Use evidence from thorough prerequisite skills checks to select difficulty, not a single wrong answer. Track first attempt vs after hint, partial step errors and assisted completion.
- Separate practice feedback from authentic diagnostic assessments. The new interactive tasks should evaluate *reasoning* as well as final placement and never provide hidden answer cues in assessment mode.
- Build reusable activity components driven by **structured question data** so each component supports many worlds and variations. Save checked question outcomes to the learner's secure data; protect earned currency and parent approvals server-side.
- Validate on an actual iPad and with keyboard accessibility before release.

## Release checks
- Run pointer/mouse and actual iPad touch tests, keyboard and screen-reader checks, correct and incorrect answers, retry/resume and cloud sync.
- No modification of earned/redeemed screen-time or parent-only approvals.
- Review authenticated route guard and RLS separately before release.
