# Revised scene-interaction checkpoint

Owner feedback on `63f787f` rejected avatar scale and separate worksheet presentation, while accepting the scenery direction. This revision retains all earlier artwork and educational/Town work. **Still awaiting owner visual approval; no release promotion or deployment.**

## What changed

- New teen-proportioned, neutral standing sprite: revised body/leg/head proportions, not a uniform enlargement of the earlier character. Per-scene floor anchors, projected height, warm/neutral lighting and contact shadows replace the shared width constraint. Camp feet sit in the clear walkway before the foreground railing; kitchen feet sit in the clear foreground passage; supermarket and bus feet sit in the open aisle/pavement. These are hand-calibrated 2.5D placements, not a moving 3D character/collision system.
- Camp has object-sized touch regions on the blue portal, wardrobe, trophy cabinet, mission board, progress desk and rest area. Existing navigation and journal destinations remain.
- Kitchen cupboard/fridge regions open focused storage close-ups. Empty original cabinet/appliance states contain only sprites matching saved task stock. Tap an ingredient to record one; remove a recorded item to correct it. Recipe on the worktop opens its live recipe card. Other existing preparation/measuring/clock controls open at the worktop.
- Supermarket products are tappable at shelf positions. Collection updates visible basket contents, counts and the validated running total. The list and basket open close-ups; returning an item uses the existing quantity action. Existing distractor products are retained. Employee tasks retain their existing work screens; this customer-scene sample does not re-skin work or pay tasks as shopping/travel.
- The actual bus departure board and ticket machine open readable close-ups using the existing saved timetable options, deadlines and fare data.
- Town entrances cover the building areas, with subtle markers and names on focus/touch. Home opens customer plans; direct business entry still starts the correct employee run.

Native modal close-ups support keyboard focus containment, Escape, a reachable Close button, retained focus after saved edits, and 48px minimum targets. Opening/closing them is transient presentation state: it neither writes progress nor renews learning time. Existing maths actions retain their validators, hints, teaching, I-don't-know and meaningful activity handling. An additional scene/run/stage comparison inside the existing save lock prevents a stale close-up from editing a newer saved stage. No saved fields or namespaces were added.

## Calibration references

| Scene | Scale and clear floor reference |
| --- | --- |
| Camp | Foreground sofa/table height and rear mannequin depth; anchor before the foreground railing, left of the table |
| Kitchen | Pantry/fridge door height, island cabinet height and the nearer foreground floor plane; no feet on island, stool or chair |
| Supermarket | Adults at the rear shelves, checkout height and nearer aisle floor; no player on checkout/products |
| Bus | Bus doorway, benches and passengers at greater depth; player on the near pavement, away from benches, bus and machine |

Exact normalized anchors are in `V6SceneUI.calibration`; the sprite keeps its natural aspect ratio and shoe baseline. Further visual acceptance remains the owner's judgement.

## Review / playable sample

Actual running-game screenshots, in both iPad orientations, are under `docs/art-direction/revised-screenshots/`. The separately supplied self-contained HTML gallery embeds those captures; none are concept references. The fictional standalone playable build is generated at `preview-dist/PLAY-V3.html` with every new asset embedded. Start at My explorer, then Worlds → Practical Maths Town → Start a Bolognese journey. Tap the cupboard, fridge and recipe; continue via the bus board to the supermarket shelves and basket. The same cash, stock, list, receipts and snapshot persist.

**Result: 12 focused cases passed, plus both final layout capture cases.** Focused verification uses `npx playwright test -c playwright.scene-revision.config.cjs`: Camp object/building navigation; cupboard/recipe/fridge, direct shelf/basket and timetable edits; full touch completion of the meal; exact reopen; embedded standalone assets, keyboard/reduced-motion and mocked immutable pending saves; stale-stage refusal. Fixtures deny/intercept external requests. It is not a physical Safari certification or a full nine-world acceptance suite. Earlier screenshot tests describe the previous layout and are not evidence for this revision.

Remaining limits: static backdrops and hand-placed sprites; some pre-existing product icons and the saved wardrobe avatar still use their earlier renderer; no new layered wearables, walking animation, four Camp exterior assets or connected island atlas. Those await approval and later rollout. All nine worlds, 63 mapped skills, 27 Town plans, historical snapshots, parent controls, coins and rewards remain in the existing engines. Cloudflare, Supabase, accounts and `release/ipad` remain untouched.
