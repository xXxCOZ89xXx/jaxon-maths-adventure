# Guided progression and activity recovery

Development branch: `codex/guided-progression-recovery`, based on released `7f51c046ee732e8000b675ed0b43d4dd1412585a`. This is review work only: no release PR, merge, deployment, production configuration or learner-service changes.

## Reproduced loop and routing fix

A fictional cook-pasta plan was completed through its real actions, saved, reopened at Home, then continued on the untouched release. In all four Chromium layouts, Continue opened the supermarket (`market`) instead of the completed plan. Screenshots and reproduction records are in `review/guided-progression/before/`.

Town completion cleared `resumeView`, while leaving the completed run saved. Continue ignored that completed run and fell through to a Town default that called `M.start(..., "market", ...)`. Completed guided missions could reach the same fallback. Recipe selection also automatically created a new day after completion, unlike ordinary Town plans.

Continue now resumes an explicit saved activity, finalises an already-solved final task once, shows a completed plan or recap, or offers the world routes. It never creates a default market visit or restoration. Town completion retains a completed-plan resume pointer. A new recipe day requires the explicit replay action. Older completed runs without the new pointer still show their completion screen. Requesting a different recipe no longer reopens an unrelated older recipe.

The owner's exact label “Restore Community 3” is not present in this release's source. The fallback is reproduced with fictional completed Town plans and covered for completed Town missions; no real learner save was accessed to identify the owner's particular run.

## Recovery scope

Every activity has Home, World map, How to play and, when unfinished, Get unstuck. Home and World map pause without resetting. The confirmation names the activity and reset scope. It rechecks the exact current activity snapshot inside the existing save transaction; a stale confirmation changes nothing.

| Activity | Restart | Exit | Preserved |
| --- | --- | --- | --- |
| Unfinished Town plan or recipe | Archive the old attempt and start the same plan with a fresh seed | Archive that attempt, remove its active unfinished pointer, open the map | All earlier completed steps, decisions, pretend transactions and receipts remain in the archived snapshot; other Town runs and counters remain |
| Unfinished mission or restoration | Archive and restart that route/stage | Archive and remove only that route's active/suspended unfinished snapshot | Other suspended routes, completed records, previous restoration stages and their evidence remain |
| Earlier saved fixed restoration | Archive its snapshot; use the new assessed stage if eligible | Archive and remove only that world's unfinished quest | Other saved quests and all earned landmarks remain |
| Lesson, supported practice or assessment | Clear only the current unanswered question's draft/tools | Pause the exact question in the saved lessons map | Question snapshots, earlier answers, first-attempt/help flags, assessment evidence and progress remain; answered questions cannot be restarted |

All recovery paths preserve learning coins, purchases, equipment, completed work, starting-point records, practice/check evidence and unrelated world progress. They never clear the learner save or alter immutable pending requests. Earlier attempts can be found in How to play; full snapshots remain stored. Archived attempts are not independent assessment or new rewards.

The new close-up navigation exposed a sticky answer bar covering the measuring-jug track in iPad landscape. Pointer hit testing identified the answer bar at the track's centre. Answer actions now remain in normal flow; the unchanged native touch-gesture regression verifies the jug in both iPad layouts. Main navigation wraps on narrow touch screens.

## Learning and restoration

How to play is always available, including inside native activity dialogs. It explains starting point → lesson/supported practice → independent check → restoration. Optional missions, Town plans and Base Camp stay available separately. Hints and “I don't know” are safe.

Each stage requires a completed starting-point discovery with a completed four-question round for every mapped skill, plus its preceding story stage. Existing completed work is retained. Guided missions, hints, mastery labels alone and restoration records do not satisfy an assessment gate. Existing mission-derived visual upgrades are preserved once during additive migration; new optional visits do not bypass restoration gates.

Stage level reuses `V5Adaptive.skill`: discovery placement, separate independent-check evidence, spaced-check results and prerequisite gaps. For several skills, the lowest recommended band/tier is used. The selected evidence, level and twelve task snapshots are saved when starting; resuming never regenerates or rescales them.

Each stage has three linked cases, each with Plan, Apply, Explain and Check steps: nine numerical applications and three explanation choices with misconception distractors. Seeds vary quantities, while assessed bands alter quantities or constraints. Worked help is available, with no timer or artificial delay. The intended 15–20 minutes is a design estimate requiring child playtesting. This applies current mapped core objectives; it does not claim complete Years 6–9 curriculum coverage or independently proven mastery.

Restoration evidence is stored with source `restoration` and `independentMastery: false`, separately from supported-practice evidence and independent checks. Completion awards its story landmark once and does not write skill mastery or change wallets. Old saved task snapshots are retained rather than rewritten.

## Assessment mapping

See the generated table below for all 27 stages. Stable curriculum skill IDs are included for review against the existing registry.

| World | Stage | Starting point required |
| --- | --- | --- |
| Number Forest | 1: Bridge repaired | Negative numbers (`negative`) |
| Number Forest | 2: Grove revived | Addition and subtraction (`operations`); Multiply and divide (`multiply`) |
| Number Forest | 3: Workshop reopened | Order of operations (`priority`); Squares, cubes and roots (`powers`) |
| Fraction Desert | 1: Canal opened | Fractions of amounts (`fractions`); Compare fractions (`fraction_compare`) |
| Fraction Desert | 2: Oasis filled | Add and subtract fractions (`fraction_operations`) |
| Fraction Desert | 3: Temple restored | Percentage change (`percent_change`); Decimals and percentages (`decimals`) |
| Algebra Peaks | 1: Generator online | Missing numbers (`algebra_missing`) |
| Algebra Peaks | 2: Lift repaired | Patterns and sequences (`algebra_patterns`) |
| Algebra Peaks | 3: Gateway powered | Expressions (`algebra_expressions`); Expand brackets (`algebra_brackets`) |
| Geometry Kingdom | 1: Wall rebuilt | Angles and turns (`geometry_angles`) |
| Geometry Kingdom | 2: Tower raised | Perimeter and area (`geometry_area`) |
| Geometry Kingdom | 3: Castle restored | Symmetry and transformations (`geometry_transforms`) |
| Ratio Island | 1: Route reopened | Understanding ratios (`ratio_basics`) |
| Ratio Island | 2: Dock repaired | Sharing in a ratio (`ratio_sharing`) |
| Ratio Island | 3: Harbour restored | Unit rates and best buys (`ratio_rates`); Recipes and proportion (`ratio_proportion`) |
| Statistics City | 1: Street illuminated | Tables and charts (`stats_tables`) |
| Statistics City | 2: Neighbourhood powered | Averages (`stats_averages`) |
| Statistics City | 3: Observatory opened | Interpreting data (`stats_probability_data`); Pie charts and proportions (`stats_pie`) |
| Probability Portal | 1: Anchor stabilised | Chance and probability (`prob_chance`) |
| Probability Portal | 2: Path restored | Counting outcomes (`prob_events`) |
| Probability Portal | 3: Portal opened | Comparing probability (`prob_compare`) |
| Measurement Mines | 1: Rails repaired | Units and conversions (`measure_units`) |
| Measurement Mines | 2: Lights restored | Volume and capacity (`measure_volume`) |
| Measurement Mines | 3: Lift running | Speed and distance (`measure_speed`); Reading time and timetables (`measure_time`) |
| Practical Maths Town | 1: High Street reopened | town_money (`town_money`); town_totals (`town_totals`) |
| Practical Maths Town | 2: Neighbourhood connected | town_timetable (`town_timetable`); town_travel (`town_travel`) |
| Practical Maths Town | 3: Town festival ready | town_value (`town_value`); town_split (`town_split`) |


## Review and verification

See `review/guided-progression/index.html` for before/after captures and `review/guided-progression/verification.json` for executed checks. All fixtures are fictional. Connected browser tests intercept external requests; database checks use local PostgreSQL with networking disabled. No production learner services were contacted.

Local source preview: `http://localhost:4173/v3-adventure.html`. Standalone offline preview: `http://localhost:4173/preview-dist/PLAY-V3.html`, built with `V3_PREVIEW_ART=current npm run build:preview` to keep released backgrounds and portraits without old painted-art controls. Start with `npm run preview`.

The downloadable portable package uses the same offline entry point with local files and a `connect-src 'none'` policy. Extract all supplied ZIPs into one folder and follow README. Downloaded screenshots need no local server. Existing artwork, player avatar and profile picture are unchanged.

Physical iPad Safari, the owner's actual saved activity and real-child completion duration remain untested. No PR or deployment is part of this review.
