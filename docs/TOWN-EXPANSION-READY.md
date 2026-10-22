# Practical Maths Town — final gameplay expansion

22 October 2026. Implemented on `codex/v3-adventure-build`. This is gameplay code and an unpublished staging build; no hosted SQL, account changes or publication.

## Playable variations

**27 new replayable plans**, plus the retained original eight-stage Bolognese/lentil journey and original three-task venue visits. These are generated, rendered and answerable in the game, not a proposed content list.

| Category | Count | Playable plans |
| --- | ---: | --- |
| Cooking | 5 | Tomato pasta; chickpea curry; vegetable pizza; carrot and lentil soup; banana pancakes |
| Shopping | 5 | Weekly groceries; games-night party supplies; packed lunches within £12; festival supply offers; replacing missing picnic ingredients |
| Travel | 5 | Swimming bus; library visit/return; health appointment; cinema timetable/return; bus/train connection |
| Employment | 7 | Supermarket cashier; café assistant; shop stock assistant; station ticket clerk; leisure attendant; workshop apprentice; community bank assistant |
| Everyday errands | 5 | Post a parcel; book climbing; settle a club bill; haircut appointment; collect a repaired bicycle |

Each category has meaningful content differences: ingredient/stock lists, costs and constraints, destinations/services, preparation sequences, appointment/activity durations, work duties, shift/break/rate/deduction calculations or parcel weight thresholds. Three difficulty levels scale quantities and calculations. Existing discovery/independent evidence supplies the suggested Town level; manual level choice remains available. New replay seeds change numerical values, timetable placements and supplied label positions; a saved run keeps its original task snapshot and selected level.

## Connected play

- **Meals:** home cupboard inspection → missing-ingredient list → outward bus → supermarket basket → payment/change → return bus → unpack/match ingredients → recipe-specific preparation order → measure water, stock, milk or passata → calculate cooking finish → serve/store/tidy. Ingredient stock is consumed only after the cooking task completes.
- **Shopping:** home preparation/stock/list and both bus legs for grocery, party, budget and missing-ingredient missions. The offer plan goes to the shopping centre, compares whole packs, buys the best offer, returns home and checks records.
- **Travel:** plan at home → choose an affordable outward service before its deadline → activity/appointment duration or onward connection/ticket → reserve/pay costs → return bus → home receipt/cash checks.
- **Work:** enter a business hotspot directly on the Town map → worker preparation and venue-specific service task → customer till/change → gross shift pay after unpaid break → simplified net-pay payslip → bank savings/travel/spending allocation → bus home. Customer till receipts do not spend or increase the worker's own pretend cash. Moving money into savings reduces spendable cash by the same amount.
- **Errands:** home instructions and cost planning → bus → appropriate business/counter task and payment → return home. Parcel service depends on weight; bills account for prior payment; repairs itemise the receipt; appointment/activity tasks calculate finishing times.

The clock, pretend cash, shopping list, inventory, choices, itemised receipts and savings carry **within each plan**. Switching plans preserves each day separately. The town uses the existing voxel-style venue scenes and maps. The Post Office is a service counter in the shopping centre; no separate ninth Town building was added.

Meaningful complete plans can earn the existing venue/tier story milestone and keepsake once. Existing records are never replaced; replays cannot farm the same milestone. Academic mastery, the cloud wallet, 40-item avatar shop, server parent rewards, nine worlds/55 skills and the 60-active-minute/1:1 reward model retain their existing rules.

## Controls, teaching and preservation

Tasks use selection, baskets, coin/note construction, tap-to-place ordering/matching, liquid/ruler models, budget envelopes and clock controls. Every new plan can be completed with visible buttons; typing remains optional. Clock buttons include one-minute changes, so non-five-minute answers are constructible. Teaching, examples, hints, “I don’t know”, safe retry and completion feedback are provided. Assistance is recorded separately from first independent responses.

The new ledger is additive `adventure.townLifeV2`, selected by `adventure.townActive`. `journeyV1` is retained, including its unfinished inputs. Original active/suspended venue visits remain playable from the original visit cards. Starting another plan resumes an unfinished run instead of replacing it; replay is explicit after completion and retains the prior run. Unknown or malformed Town ledger versions stop new-plan loading without clearing the stored data. Saved tasks are snapshots, so later code edits do not regenerate an unfinished day.

All edits/stage transitions use the existing local persistence and staging JSON save queue. The cloud adapter, auth/PIN flows, queue/request-ID namespaces and pending-save implementation are unchanged. An in-flight immutable save remains in place when newer offline Town edits are queued behind it. No migrations or credentials are needed.

## Focused checks actually completed

- `node tests/town-life.cjs`: **27 plans, 2,007 completed stages**, covering all three levels and three replay seeds; validates cash/receipt/savings accounting, stock/budgets, hints, failed responses, exact JSON reload, old/unknown format preservation, explicit replay and one-time completion.
- Existing `tests/v5-hands-on.cjs`: **14 groups / 1,107 generated steps passed**, including older journey compatibility and the nine-world mechanics.
- New Town browser run: **36 passed**, **22 intentional landscape skips**, no failures. All 27 plans completed using visible touch-equivalent controls in iPad portrait; five representative category plans completed in landscape; both orientations cover legacy draft switching/clock validation and every-stage cloud-fixture cooking saves. Representative completion screens pass the focused accessibility checks.
- Two additional targeted cases passed: evidence-based level 3 with manual easier-level choice; pending immutable save retained through a newer offline draft, reconnect and reload. The initial offline test incorrectly expected an in-flight request while the adapter was deliberately offline; the corrected fixture first creates a lost-response in-flight save, then verifies the later offline edit waits behind it.
- Existing nine-world/original-workplace acceptance: **4 passed** across portrait and landscape.
- Cash-to-savings transfer was checked explicitly and corrected to avoid displaying reserved money as spendable. All **seven worker browser plans were rerun** after that correction.
- Offer and postal-service choices use a dedicated selection display, without irrelevant timetable/deadline details; three targeted browser cases passed after this display change.
- The configured `scripts/build-v3-staging.cjs` output passed `scripts/verify-v3-staging.cjs`; expanded Town assets match source bytes in the unpublished `staging-dist/` build.

All browser backend traffic was intercepted with fictional data; unexpected external requests were blocked. No staging/production SQL or remote account use. Browser checks use Chromium iPad dimensions/touch capability; physical Safari acceptance remains an owner check. No broad security audit, backup work or production installation was performed.

Useful commands: `npm run test:town`; `npm run test:town-browser -- --project=ipad-portrait-chromium --project=ipad-landscape-chromium`. The latter deliberately runs all portrait plans and five landscape representatives rather than duplicating every plan in both orientations.

## Simplifications and readiness

Preparation/cooking actions are ordered interactive steps, measuring and clock tasks; there is no real-time cooking simulation. Savings and tills are fictional models. Wage rates/deductions, postal prices and fares are teaching values, not current regulated quotations. Travel follows the selected plan rather than free navigation; return travel is another explicit timetable choice. Inventories belong to the selected day, not a shared open-world economy. New replays vary a bounded set of deterministic values rather than claiming unlimited unique stories. Original simpler journeys are retained so older saves remain usable.

**Ready for owner-approved private publication**, using the newest `staging-dist/` gameplay with the existing backend. Keep the existing private Site/origin and accounts, let current tabs finish syncing, and retain unresolved drafts/conflicts before switching assets. The prepared V5.2 SQL upgrade and marker-dependent build remain parked.

**Minimum next owner action:** approve updating only the existing owner-private staging Site's game assets. Then perform one Safari-on-iPad play → save → reopen check using an existing fictional staging learner account/PIN. No merge, database upgrade, account reset or production identity transfer is required.
