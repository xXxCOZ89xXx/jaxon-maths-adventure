# Gameplay quality continuation

Owner's physical iPad feedback supersedes the feature freeze for development only. Do not update `release/ipad` or deploy. The owner confirms the current hosted game saves successfully.

Pre-code inventory:
- All 27 Town plans use five category generators. `shoppingTrip` adds cupboards even to shopping with no stock. `homeCheck` supplies its own ordering answer. Travel uses full scenario titles as destinations. Non-money durations are incorrectly represented as clocks.
- Cooking prompts supply the correct preparation order; all meals reuse the same shopping/measurement/finish skeleton. Original V1 Bolognese ends with inventory confirmation and a single recipe calculation.
- Ordering supplies are shuffled in the mission enricher but can still start in correct order. Town ordering uses predictable rotations; several task instructions reveal their own ordering answer. Matching often gives a complete lookup instead of a calculation.
- Sequence tasks show decorative boxes with numeric steppers. Balance, arrays, charts and liquid measurement rely on plus/minus controls despite physical-action wording. Scalar rendering adds another numeric editor after the model.
- The normal mission/journey submit already validates. No literal “Try Plan Check” exists in current source. Standardise to one `Check answer` control, preserve lesson/exploration, and remove redundant editors on visual tasks.
- Existing fractional shading, coordinate plotting, rotation, probability outcomes, money tokens and placement actions provide reusable touch controls. Extend these rather than introduce a new framework.

Preservation: old `journeyV1` and snapshot `townLifeV2` runs remain supported without rewriting their steps, answers or ledgers. New-generation metadata and branches are additive JSON. No cloud adapter, storage namespace, account or reward calculation changes.

## Implemented review

- All 27 plans retain stable IDs: 5 cooking, 5 shopping, 5 travel, 7 employment and 5 errands. Destination names are separate from full adventure titles. Irrelevant cupboard and generic receipt-order stages are removed from new runs; receipts now support a useful cash reconciliation. Context text reflects category and role. Customer purchases debit the pretend purse; employee till sales do not.
- Cooking: the five meals retain distinct ingredients, quantities, preparation, liquids and methods. Curry includes cooking rice; soup includes stock preparation. Pizza uses passata and oven settings; pancakes use milk and a pan. New Bolognese/lentil starts use the full flow. Recipe cards remain accessible during stock inspection, shopping and cooking. Higher tiers scale portions. Supplied fictional temperatures are reference-reading tasks, not food-safety guesses. Returning home leads into preparation rather than repeating inventory confirmation.
- Shopping: shelves include unneeded extras and use the saved list. Groceries carry the chosen pack into the purchase; party supplies use pack quantities; missing-ingredient shopping alone checks relevant stock; offers compare complete purchases. The £12 plan compares three ingredient lists (wraps, pasta, potatoes), changes its actual saved route after the lunch choice, substitutes out-of-stock wraps/pasta/potatoes with suitable rolls/rice/sweet potatoes, and recalculates cost and remaining budget. Tier affects quantities and seed affects fares/prices.
- Travel: library, pool, health centre, cinema and station wording uses actual destinations and a return journey. Library has no ticket fee; onward rail travel includes a connection allowance. Durations use minutes, rather than a mislabeled clock. Errands and seven jobs retain category-specific tasks, wages/payslips and recorded savings.
- No extra pre-validation step: one `Check answer` per mission/journey. Lesson start, helpful exploration, hint and continuation remain separate actions with distinct purposes. Wrong first attempts stay wrong in evidence; hints mark work assisted. Guided Town content never grants academic mastery or directly changes the coin wallet.

| World | Functional interaction work |
| --- | --- |
| Number Forest | Tap a rectangle corner to build a crate array; shuffled ordering retained |
| Fraction Desert | Fraction bars and shuffled placement; liquid measurement uses the jug scale |
| Algebra Peaks | Actual loose/connected train carts and selectable bundles on a balance |
| Geometry Kingdom | Existing touch rotation/coordinate placement retained; placed-state feedback shared |
| Ratio Island | Build a blue crate tray against green supplies; shuffled quantity matching |
| Statistics City | Construct chart columns by tapping heights; adjustable mean bar |
| Probability Portal | Existing selectable outcomes, equal slots and spinner sectors retained |
| Measurement Mines | Interactive ruler/jug scales and tap-built arrays/layers |
| Practical Maths Town | Cupboard/fridge stock, notepad, shelves/basket, coins, recipe cards and 24-hour clock |

## Preservation and test boundaries

New runs have additive `contentRevision: 3`, optional recipe cards and branch snapshots, inside `townLifeV2`. Selecting a lunch replaces only that **new run's unstarted tail** with its own stored branch. It never alters completed stages or another saved run. Original V1 is not migrated or cleared; the test fixture captured from frozen commit `2d9cb05` proves V2 snapshot resume/completion. Invalid or unknown existing ledgers still stop without replacement. Range edits check run identity and stage again inside the existing save lock, so a stale edit cannot overwrite a replacement adventure.

The focused browser suite uses synthetic offline and intercepted-family fixtures. The full 32-case run and targeted refinements are recorded in the local test outputs; compact results are in `tests/artifacts/gameplay-quality-summary.json`. New visuals were inspected at portrait and landscape sizes. No real learner, hosted backend or Cloudflare configuration was used by these tests.

## Remaining simplifications

Town remains a guided simulation, not an unrestricted cooking or shopping sandbox. The lunch alternatives and acceptable substitutes are authored; cash/time/inventory are pretend. Cooking uses recipe references and ordering/measurement tasks rather than simulated heat or food preparation. Some venues still share existing Town background art. Interactions are tap-first with native range gestures and keyboard support; this is not a universal drag-and-drop system.

Supported skill practice retains optional numeric entry/place-value tools for calculations and answers that need exact numerical notation; separate discovery/independent checks retain their choice format and no teaching aids. Older saved runs deliberately keep their previous content until completion. Legacy browser suites tied to removed numeric-editor/clock selectors need to use the new quality suite rather than being described as passes. A physical Safari review of the new interaction feel remains an owner acceptance step after separate protected-preview approval.

No release branch update, deployment, live data change or Supabase migration occurred.
