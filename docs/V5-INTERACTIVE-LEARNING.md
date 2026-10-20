# V5 interactive learning expansion

Continues V4 on `codex/v3-adventure-build`, draft PR #2. The nine worlds, 55 skills, original discovery bank, three freely selectable difficulty levels, eight Town architectures, eight estate stages, wardrobe IDs, learning history and secure staging adapter remain in place. Storage still uses the compatible version-3 envelope; new state is additive and versioned within it.

[Private game](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/) · [V5 screenshot gallery](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/interactive.html) · [Exact V4/V5 Cartesian board comparison](https://jaxon-maths-v3-private-staging.orion-shared-7254.chatgpt.site/review/coordinates.html).

## Actual playable coverage

The audit evaluates all 123 route/tier combinations: **333 of 369 expedition steps (90%) offer genuine hands-on models**. Digital clocks, ordinary multiple choice, numeric sequence steppers and budget steppers are excluded. Even counting all 24 original restoration steps as conventional, this is a conservative **333/393 (85%)** of guided adventure steps. These are availability counts, not a claim that every learner uses a model instead of its alternative controls. Original restoration puzzles remain playable and unchanged.

| World | Hands-on expedition steps | Actual model types |
| --- | ---: | --- |
| number | 36/36 (100%) | number-line, place-value, ordering, arrays |
| fractions | 36/36 (100%) | fraction-shading, ordering, matching, pour |
| algebra | 30/36 (83%) | algebra-tiles, ordering, cartesian |
| geometry | 36/36 (100%) | rotation, area-tiles, cartesian, protractor |
| ratio | 36/36 (100%) | ratio-groups, matching, pour |
| statistics | 27/36 (75%) | bar-chart, cartesian, ordering |
| probability | 36/36 (100%) | probability-pool, sample-space, spinner |
| measure | 36/36 (100%) | ruler, pour, algebra-tiles, volume-blocks |
| town | 60/81 (74%) | basket, money, matching, pour |

These models use one shared renderer and plain JSON task descriptors, with existing mathematical validators extended for ordering, matching, arrays, charts and volumes. A correct answer requires the actual quantities or arrangement. Wrong submissions remain editable and lead to worked support. Hints, easier examples, save/exit and exact-task resumption remain. Guided interaction never establishes academic mastery or duplicates estate milestones.

The Cartesian plane now has real x/y axes, numbered ticks, origin, grid lines and selectable intersections. Buttons do not print coordinate pairs. Selection feedback describes only the learner's chosen point. Arrow keys move focus between intersections; Enter selects. Screen readers receive point labels because axes alone are visual. Positive and negative points are available at appropriate tiers. Older supplemental coordinate tools are suppressed in V5 practice to avoid retaining the labelled-square presentation.

Fractions support tap shading/unshading and horizontal Pointer Event painting, while vertical movement remains available for scrolling. Fraction bars can be ordered and matched with decimals/percentages. Arrays construct rows/columns; volume models add explicit layers. Probability includes favourable pools, fair-spinner sectors and multi-device sample spaces. All models have tap/keyboard controls rather than relying on native HTML drag-and-drop. Broad drag-and-drop placement of every object is not implemented; ordering/matching use tap-to-select and tap-to-place.

## Learning and adaptation

Short discovery rounds are retained; there is no new compulsory assessment of all 55 skills. Individual skill suggestions use four-question discovery evidence, repeated independent checks, spaced evidence and known prerequisite gaps. A single guided success or the most recent mission cannot raise a recommended level. Two separate independent results are required for check-driven advancement. Supported practice can offer easier teaching; all three adventure levels remain selectable. Route recommendations use the skills actually involved, including skills shared across worlds.

Guided mission records now retain the first submitted value, support status, correctness and mechanic separately from completion. Practice records distinguish first attempts, assisted retries and constructed/conventional responses. Repeated unchanged constructed submissions do not renew activity or append endless evidence. Independent check responses remain separate; no response model is rendered in independent checks or discovery. Existing freshness, reteaching and spaced-mastery rules remain in force.

Supported practice uses numeric/place-value, number-line, fraction, angle and money response builders when the generated question is suitable. The audit samples nine fresh questions per skill at three bands. **51 of 55 skills have a constructed response in that sample**; this does not mean every question variant has a bespoke manipulative. The sampled `fractions`, `decimals`, `geometry_area` and `geometry_circle` practice questions retain conventional answers, while corresponding adventure areas still have physical models. All 55 skills and their separate independent checks remain accessible.

## Town roles and the complete recipe journey

`V3Town.context(venue, entry)` defines reusable, versioned role/objective metadata for all eight existing venues. Direct visits use worker scenarios. A journey uses customer, passenger or home-cook roles and the same physical venue art. The same supermarket therefore supports stocking/preparing orders directly and shopping from a household list in the journey. Story roles are separate from parent/learner Auth roles and never change permissions. Other venue contexts are reusable foundations; additional connected storylines are not claimed complete.

From the Town board, choose **Start a Bolognese journey** or the lentil recipe variant:

1. Inspect the cupboard: one 100 g pasta pack, one tomato tin and no protein packs.
2. Calculate the missing shopping list for a recipe needing two of each: buy `[1, 1, 2]`, not the full recipe quantities.
3. Choose the cheapest bus arriving by the stated deadline, including the walk; the 100p fare reduces fictional cash.
4. Enter the existing supermarket as a customer, use the saved list and construct the basket within budget.
5. Pay £5 for the 430p basket using fictional UK denominations.
6. Construct and receive the 70p change; the actual bought quantities join the cupboard inventory.
7. Return home and check the actual ingredients.
8. Measure 0.2 litres as 200 ml and prepare the recipe, consuming those ingredients once.

The version-1 journey stores recipe, current role/context, inventory, list, basket, cash/budget, stage, completed stages, receipts, first-attempt evidence and exact current selections. Reload works at every stage. Cash finishes at 470p after fare and shopping. Repeated completion cannot take another payment or consume ingredients again. Unsupported/corrupt journey versions are preserved and fail closed rather than being silently replaced. The journey is fictional: it does not spend learning coins, award mastery/estate milestones or change a real balance.

## Integrity, accessibility and limits

The weekly goal stays 60 active minutes, ten learning coins per legitimately active minute and 1:1 screen time. Changed maths controls use the existing bounded activity window. Navigation, model previews, unchanged submissions and cosmetic actions do not create learning credit. Existing PINs, parent permissions, immutable wallet retries, cloud CAS/offline queues and reward boundaries remain unchanged; no SQL migration is introduced.

All new model controls target at least 44 CSS pixels, have labels and keyboard operation, and respect existing reduced motion/sound-off preferences. Rulers scroll internally when needed and explicitly explain that movement. Models use bounded SVG/CSS/DOM with no engine or new runtime dependency. Physical iPad Safari, native scrolling/gesture comfort, memory/performance and actual cross-device operation remain later acceptance checks. Emulation is not physical-device certification.

[QA and deployment results](V5-TEST-REPORT.md) record actual tests and private hosting provenance. Live staging remains pinned to `sfogrvedypgtxfvecmbx`; the proxy blocks the read-only identity request with CONNECT 403 before Supabase is reached. No authenticated hosted success is claimed. Browser cloud responses are intercepted fictional APIs, and database tests use isolated PostgreSQL with fictional Auth claims. No account credentials were requested or records reset.

## Remaining scope

- Four sampled practice skills and some other variants still use conventional answers; extending their genuine question-specific models is future work.
- Most object placement uses tap/select/place, not unrestricted dragging. Pointer painting exists for fractions; physical touch acceptance remains outstanding.
- The two Bolognese recipe variants share quantities. More recipes, additional journey destinations and richer shopkeeper dialogue remain future work.
- Hidden discoveries are specified only in [the future discoveries brief](V5-DISCOVERIES-SPEC.md); no discovery feature or reward is presented as implemented.
- No production schema/settings, real learner records, main, live homepage or GitHub Pages are changed. PR #2 remains draft and unmerged. No additional manual session is requested now.

## All 55 skills: sampled practice audit

Every row retains lessons, fresh practice, discovery and independent checks. Constructed counts describe these nine sampled questions only.

| Skill | World | Constructed / sampled | Response models |
| --- | --- | ---: | --- |
| place | number | 9/9 | place-value |
| operations | number | 9/9 | place-value |
| negative | number | 9/9 | number-line |
| multiply | number | 9/9 | place-value |
| priority | number | 9/9 | place-value |
| fractions | fractions | 0/9 | Conventional answers in this sample |
| fraction_compare | fractions | 7/9 | fraction-shading |
| fraction_operations | fractions | 8/9 | fraction-shading |
| decimals | fractions | 0/9 | Conventional answers in this sample |
| percent_change | fractions | 9/9 | money |
| algebra_patterns | algebra | 9/9 | place-value |
| algebra_missing | algebra | 9/9 | place-value |
| algebra_expressions | algebra | 9/9 | place-value |
| geometry_angles | geometry | 9/9 | protractor |
| geometry_triangles | geometry | 9/9 | protractor |
| geometry_area | geometry | 0/9 | Conventional answers in this sample |
| ratio_basics | ratio | 9/9 | place-value |
| ratio_sharing | ratio | 9/9 | place-value |
| ratio_proportion | ratio | 9/9 | place-value |
| stats_averages | statistics | 9/9 | place-value |
| stats_tables | statistics | 9/9 | place-value |
| stats_probability_data | statistics | 9/9 | place-value |
| prob_chance | probability | 9/9 | fraction-shading |
| prob_events | probability | 8/9 | fraction-shading |
| prob_compare | probability | 3/9 | fraction-shading |
| measure_units | measure | 6/9 | place-value |
| measure_volume | measure | 9/9 | place-value |
| measure_speed | measure | 9/9 | place-value |
| factors | number | 9/9 | place-value |
| powers | number | 9/9 | place-value |
| fraction_mixed | fractions | 9/9 | place-value |
| fraction_mult | fractions | 3/9 | fraction-shading |
| algebra_brackets | algebra | 6/9 | place-value |
| algebra_coordinates | algebra | 9/9 | number-line |
| geometry_transforms | geometry | 6/9 | number-line |
| geometry_circle | geometry | 0/9 | Conventional answers in this sample |
| ratio_rates | ratio | 9/9 | money |
| stats_pie | statistics | 9/9 | protractor, place-value |
| measure_time | measure | 3/9 | place-value |
| town_money | town | 9/9 | money |
| town_totals | town | 9/9 | money |
| town_menu | town | 9/9 | money |
| town_split | town | 9/9 | money |
| town_balance | town | 9/9 | money |
| town_interest | town | 9/9 | money |
| town_discounts | town | 9/9 | money |
| town_value | town | 9/9 | money |
| town_timetable | town | 9/9 | place-value |
| town_travel | town | 9/9 | money |
| town_bills | town | 9/9 | money |
| town_household | town | 9/9 | money |
| town_tickets | town | 9/9 | money |
| town_time | town | 9/9 | place-value |
| town_wages | town | 9/9 | money |
| town_payslip | town | 9/9 | money |
