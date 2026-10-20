# Interactive missions and world collectibles — proposal (20 October 2026)

## User requests
- Jaxon suggested hidden Easter eggs across worlds, scavenger-hunt style, collectible in a future release.
- Parent suggested hands-on shop learning in a town: drag apples into a basket, drag correct price tags onto clothing.

## Status
- Existing V2 development game predominantly uses multiple-choice questions and text entry. Full drag-and-drop tasks are not yet integrated into the authenticated adventure.
- Independent `town-interactions-preview.html` is a **non-authenticated interaction experiment**, not a released mission. It must not save learning state, award coins, or alter rewards.
- Keep the live `index.html` unchanged until learning integration and security tests pass.

## Market Town activities — first release candidate
1. Grocery stall: physically move/tap apples into basket to fulfil an order. Ask learner to calculate total using unit price in pence. Demonstrate multiplication or repeated addition; scaffold with grouped visuals.
2. Clothes stall: move matching price labels onto hats, T-shirts and jackets. Prices determined by simple subtraction, percentages and half-price discounts.
3. Support both mouse drag and iPad touch via Pointer Events. Provide equally complete tap-to-select/tap-to-place AND keyboard/button alternatives, visible focus, speech-reader labels, non-color-only success/error feedback.
4. Progressive task variation should be tied to evidence from skill assessments, not chronological age or one error. Low-demand tasks might count concrete objects, higher demand tasks use decimal money, change, discounts and multi-item purchases.
5. Track first-try correct, correction after hint, and required support separately. Save to the learner's secure progress record only after reviewed integration. Prevent repeated coin earning just by moving items.
6. Avoid generic draggable-HTML5-only implementation because iPads and touch browsers need reliable support.

## Future collectible Easter-egg scavenger hunt
- Conceal a small number of themed pixel-art eggs in each unlocked world; make exploring enjoyable without interfering with lessons. Proposed initial target: three unique eggs per world, with a final collection badge.
- An optional clue board and world-level counter ("2 of 3 found"), no countdown or pressure. Eggs may be found in any order, with an optional calm/low-distraction mode.
- Eggs are exploration collectibles, **not** ways to bypass maths learning or generate unlimited coins/screen-time rewards.
- Save unique egg IDs per learner in cloud progress; duplicates never count twice. Consider server validation before awarding anything of value.
- All collectibles need a keyboard/touch accessible discover mechanism, high contrast outline and descriptive labels. Avoid tiny hidden click targets or reliance on colour alone.
- Artwork should resemble the Minecraft-inspired blocky environment, with special eggs reflecting each world's theme.
- This is a **future backlog item**, not a completed game feature. Parent and Jaxon can choose appearance, rarity, clues and rewards after reviewing the first town activities.

## Release checks
- Run pointer/mouse and actual iPad touch tests, keyboard and screen-reader checks, correct and incorrect answers, retry/resume and cloud sync.
- No modification of earned/redeemed screen-time or parent-only approvals.
- Review authenticated route guard and RLS separately before release.
