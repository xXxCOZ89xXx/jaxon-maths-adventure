# Years 6–9 curriculum development

This development branch starts at released `27ac8421e3dea2cf63788c435f3509484d45d5ea`, which contains approved avatar `3823ecb`. The original local `work` branch was clean and was left intact. No release branch, deployment, account, learner record, wallet, Supabase schema or production service was changed.

## Source and audit

The source is the [Department for Education mathematics programme of study for England](https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study), accessed 23 October 2026. Year 6 is mapped to KS2 Year 6. **The statutory KS3 programme applies across the key stage: the Year 7/8/9 sequence below is this project's proposal, not official separate annual lists.** Readiness and independent topic evidence take precedence over age/year labels.

`CURRICULUM-RELEASE-AUDIT.json` records the released runtime inventory, original per-skill gaps, authored questions and keys, representative generated questions at bands 6 and 9, and all 123 original mission/level task sets. It is reconstructed from the exact release without checking it out or accessing any saved learner state. The release has 55 core skills plus eight prerequisite skills loaded at runtime: **63**, rather than 55, playable skill records. Its nine worlds and 123 mission/level combinations are retained. The released Stage 1 descriptions are explicitly partial, even where a broad skill already has questions.

The major missing areas were formal written-method depth, significant figures/error intervals/standard form, signed mixed fractions, factorisation and full binomial expansions, rearrangement and graph work, inverse proportion, congruence/constructions/nets, Pythagoras/trigonometry/proof, grouped/bivariate statistics, and combined/experimental/set probability. These now have authored teaching, questions, checking and mission links.

`v3/curriculum-objectives.json` is the editable mapping. Its **121 objective groups** paraphrase and sometimes combine related statutory clauses, including working mathematically; they are not a claim that DfE publishes 121 individual Year 6–9 objectives. `curriculum-map.js` is its generated offline runtime form. `CURRICULUM-COVERAGE.json` records the resulting worlds, skills, prerequisites, objective links, mission snapshots, answer keys and activity types. It also includes band/seed question examples for all new families, including ASA, enlargement and other representation variants. `playable` means linked authored teaching/practice exists; it does not certify that one learner has mastered the whole programme or that every possible problem variant is supplied.

The older `CURRICULUM-MAP.json` and `CURRICULUM-REVIEW.md` remain historical Stage 1 evidence. This document and the new registry supersede their current-coverage descriptions.

## Proposed progression

| Strand | Year 6 / KS2 | Proposed Year 7 | Proposed Year 8 | Proposed Year 9 |
| --- | --- | --- | --- | --- |
| Number | Integers to ten million; formal multiplication/division; interpreting remainders; decimal operations | Signed numbers, inverse operations, prime factors, exact fractions | Powers/roots, standard form, significant figures and estimation | Error intervals, exact/approximate values, signed mixed-number transfer and calculation strategy |
| Fractions and proportion | Common denominators, mixed numbers, fraction products/division, decimal/percentage equivalence | Signed rational arithmetic, ratio notation and part/whole comparisons | Scale diagrams, direct/inverse proportion, percentage multipliers | Original values, values above 100%, inverse graphs and compound units |
| Algebra | Missing values, formulae, linear sequences, pairs of unknowns | Notation, substitution, one-variable equations and systematic enumeration | Factorisation, fractional coefficients, rearrangement, nth terms and straight-line graphs | Binomial products, quadratic samples, graph intersections and contextual reciprocal/exponential/piecewise estimates |
| Geometry and measures | Draw/measure, circle vocabulary, coordinates, reflections/translations, nets, area and volume | Angle facts, parallel lines, polygon reasoning, scales and units | Compass constructions, congruence, enlargement, prisms and composite measures | Pythagoras, trigonometry, inverse ratios, formula derivations and simple proofs |
| Statistics and probability | Mean, pie/line graphs; useful earlier chance prerequisites | Scales, representation choice, averages, chance/fairness | Grouped data, outliers, Venn diagrams and combined sample spaces | Constructed scatter plots, cautious inference, relative frequency and theoretical/experimental comparison |
| Working mathematically | Explain operations, estimate/check and solve multistep contextual tasks | Compare representations and test claims | State conditions, organise arguments and distinguish models | Construct proofs/counterexamples, interpret approximations and evaluate conclusions |

Prerequisite bonds, tables, sharing, equal fraction parts, decimal place value, scaled instruments, shape properties and chart keys remain available below Year 6. There are no new age gates or forced subject order. Discovery still estimates each topic independently and can move up or down; a strength in algebra does not overwrite a gap in fractions. New independent checks retain prerequisite readiness, fresh prompts and varied families, and delayed independent evidence for mastery. Guided missions and supported practice never award academic mastery.

## Playable worlds

| Existing world | Skills now | Mission/level combinations | Examples |
| --- | ---: | ---: | --- |
| Number Forest | 15 | 27 | Written-method sequencing, place-value construction, placing irrational approximations on a number line, error intervals |
| Fraction Desert | 10 | 15 | Equivalent fraction shading, unlike denominators, signed/mixed operations and whole reconstruction |
| Algebra Peaks | 12 | 33 | Step ordering, complete expansions, rearrangement, plotted quadratic/linear samples and graph-based estimates |
| Geometry Kingdom | 14 | 36 | Whole-figure transformations, compass arc intersections, ruler/protractor models, ASA triangles, conventional markings, valid cube nets and proof steps |
| Ratio Island | 8 | 24 | Part/whole matching, scaled recipes/maps, percentages above one whole, inverse samples and financial comparisons |
| Statistics City | 8 | 21 | Construct pie/line/bar charts, grouped frequency tables, paired scatter points, spread and inference |
| Probability Portal | 5 | 18 | Construct Venn regions, enumerate combinations and record/resume simulated trials |
| Measurement Mines | 7 | 18 | Composite/trapezium areas, prism/cylinder volume, density, squared/cubed conversions and miles/kilometres |
| Practical Maths Town | 17 | 30 | Cupboard/list/bus/shop/pay/return/recipe decisions, quantities, measures, change, budgets and comparing suitable choices |
| **Total** | **96** | **222** | **33 added skills; all nine existing worlds retained** |

Newly started inner missions contain six mini-tasks, with an estimated 5–10-minute budget. World-end challenges contain twelve, targeting about 20 minutes. These are design budgets, **not timers or measured learner completion times**. Exit after any task or model edit; answers, observations and the current teaching/play phase serialize with the normal save. New records include the task count/content version. Existing three-task active/suspended missions retain their original task text, keys, values and answer contracts and finish as three-task visits.

Each mini-task starts with teaching and a different worked example. A wrong answer keeps the model, gives a hint and returns to teaching; “I don't know” goes straight there. First-attempt evidence remains separate from assisted completion. Supported practice has an engine guard against answering its new questions before the teaching screen. Hint/skip/check behaviour in old saved questions is retained.

Activities use tap/keyboard selection, matching, step ordering, place columns, fraction cells, real number lines, protractors, multi-point graphs, charts, triangle construction, side markings and nets. No activity requires dragging. Number lines/protractors offer native sliders and step buttons; Cartesian plots offer direction buttons and named point selection. Coordinate axes carry tick values; intersections do not print target coordinate pairs. Whole plots save incomplete point sets safely. Cube nets validate connected face orientations and accept other valid layouts, rather than one pictured pattern. Scientific tools are degree-mode calculation aids on appropriate trig tasks and never auto-submit an answer.

Town's connected cooking plans and worker plans are retained. Starting at home keeps the customer journey through cupboards, list, bus, shopping/payment, return and cooking; “home cook” is the existing local cooking role. Direct business entry retains the worker context. New `town_planning` is an additional maths course, not a replacement for those saved journeys. All Town prices, balances, inventories and examples in tests are fictional and remain separate from learning coins.

## Compatibility and boundaries

Stable original world/skill/shop IDs, prices and avatar assets remain unchanged. New questions have content version 8 and stable skill/band/seed/family identities. The version is separate from the existing progress schema version 3. Current snapshots are read as stored, never regenerated on load. Existing pending saves, purchases, receipts, rewards, mastered fields, unknown root fields and legacy Town books are not migrated or cleared. No SQL is required.

The current compact receipt/batching/idempotency mechanisms and parent role boundaries are exercised by the unchanged save/recovery gate. Snapshot growth still uses the existing progress-size limit; this change does not delete history to fit it. A synthetic budget check pauses all 222 mission levels (221 suspended plus one active) and retains an additional 300 KB fictional-history reserve inside that existing limit. Long-term educational history is still finite-storage work, not a promise of unlimited offline history.

Fixed reasoning questions are not made artificially “fresh” by adding suffixes to wording. New rounds exclude seen prompts and preserve mathematical family provenance. Encountered guided questions and their numerical teaching examples join the exclusion set before a later independent check. Quantities and representations vary; supplies/answer positions are shuffled deterministically. If a genuine pool is exhausted, practice reports that no fresh set is available rather than granting fresh mastery for the same question.

## Validation and review

Run:

```sh
npm ci --ignore-scripts
npm test
npm run test:curriculum
npm run test:curriculum-browser
npm run test:gameplay-quality
npm run test:ipad-release
```

The last command tests a local network-disabled PostgreSQL container and fictional intercepted browser sessions; it is **not** a deployment or a connection to the live database. `--audit-release` is an optional local Git-object audit. After editing the mapping, run `node scripts/audit-curriculum.cjs --write-map`, then the curriculum checks. The development-only GitHub workflow runs curriculum checks and uploads fictional review captures; it has read-only repository permissions and no deploy step.

`review/YEARS6-9.html` is a self-contained gallery of actual running-game screenshots, coverage and tested viewports. It works without network requests. `CURRICULUM-VALIDATION.json` records the final commands/results. `node scripts/summarize-curriculum-validation.cjs` checks completed reports before writing that summary; `node scripts/build-curriculum-review.cjs` embeds the captures. With the local preview server running, `node scripts/check-curriculum-review.cjs` verifies the gallery filters/search and absence of external requests. To play locally, use `npm run preview` and open `/v3-adventure.html`; this is the offline fictional Test Camp. No public/production preview was created.

Remaining acceptance work: the physical iPad Safari visual/touch check; learner-paced confirmation of the 5–10/20-minute budgets; and an educator/parent review of the proposed progression and instructional depth. Graphs join sampled points and label approximation explicitly; they are not general symbolic graphing software. Constructions are guided digital ruler/compass/protractor models, not a free CAD package or a physical folding animation. The authored bank and automated mapping are evidence of playable coverage, not external curriculum accreditation or a claim that every future lesson variant has been authored.
