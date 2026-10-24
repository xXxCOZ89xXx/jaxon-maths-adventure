# Direct touch interactions — development review

24 October 2026. Based on released PR #5, `3334875b60c58e1d4d74aa4683ab2cac764f949d`, on `codex/touch-interactions`. Development only: no release PR, merge, deployment, production-service call or real learner/account/coin/database access. Avatar/profile-picture centring is deferred.

## What the learner actually saw

The release audit executes the exact released modules from Git, with fictional independent discovery evidence for each topic. It selects the first six-question post-assessment lesson and check for all 96 skills at attained bands 6, 7, 8 and 9: **4,608 questions**, not a claim to count an unbounded generated bank. The four bands correspond to the requested Years 6–9 audit slices; they are ability suggestions per topic, not fixed age gates or official annual KS3 objective lists. Prerequisites are completed in check fixtures so the check is reachable.

Normal legacy lessons call `V3Engine.generate → JaxonFreshReview.create`, snapshot six questions and render all `q[2]` select options. `V5HandsOn.practiceRender` offers additional tap models in practice, but the options remain visible; independent checks omit these optional legacy models. Supplementary maths tools do not submit the lesson answer. Curriculum V8 metadata selects `V8Activities` and suppresses options; most of its authored models are tap-based, or range sliders. Richer mission/Town renderers are a separate route and do not automatically replace normal post-assessment questions. This explains the mostly select-option experience. No released lesson question in this audited selection offered direct object dragging.

Counts below identify **capability**, not physical gestures performed. Select and optional tap columns overlap. Range inputs are counted separately and never counted as direct dragging. The JSON also supplies mutually exclusive primary-format counts. An accessible alternative means no question strictly requires a drag gesture; direct questions now make pointer-driven object movement the primary visible answer model.

## Released practice counts

| World | Band | Questions | Select options visible | Tap model available | Range sliders | Direct movement |
|---|---:|---:|---:|---:|---:|---:|
| Number Forest | 6 | 90 | 63 | 89 | 0 | 0 |
| Number Forest | 7 | 90 | 63 | 88 | 0 | 0 |
| Number Forest | 8 | 90 | 63 | 88 | 1 | 0 |
| Number Forest | 9 | 90 | 63 | 88 | 1 | 0 |
| Fraction Desert | 6 | 60 | 54 | 37 | 0 | 0 |
| Fraction Desert | 7 | 60 | 54 | 35 | 0 | 0 |
| Fraction Desert | 8 | 60 | 54 | 33 | 0 | 0 |
| Fraction Desert | 9 | 60 | 54 | 33 | 0 | 0 |
| Algebra Peaks | 6 | 72 | 34 | 42 | 0 | 0 |
| Algebra Peaks | 7 | 72 | 34 | 42 | 0 | 0 |
| Algebra Peaks | 8 | 72 | 34 | 42 | 0 | 0 |
| Algebra Peaks | 9 | 72 | 34 | 42 | 0 | 0 |
| Geometry Kingdom | 6 | 84 | 41 | 60 | 1 | 0 |
| Geometry Kingdom | 7 | 84 | 41 | 60 | 1 | 0 |
| Geometry Kingdom | 8 | 84 | 39 | 60 | 1 | 0 |
| Geometry Kingdom | 9 | 84 | 39 | 60 | 1 | 0 |
| Ratio Island | 6 | 48 | 27 | 24 | 0 | 0 |
| Ratio Island | 7 | 48 | 27 | 24 | 0 | 0 |
| Ratio Island | 8 | 48 | 27 | 24 | 0 | 0 |
| Ratio Island | 9 | 48 | 27 | 24 | 0 | 0 |
| Statistics City | 6 | 48 | 32 | 23 | 0 | 0 |
| Statistics City | 7 | 48 | 32 | 23 | 0 | 0 |
| Statistics City | 8 | 48 | 31 | 24 | 0 | 0 |
| Statistics City | 9 | 48 | 31 | 24 | 0 | 0 |
| Probability Portal | 6 | 30 | 19 | 25 | 0 | 0 |
| Probability Portal | 7 | 30 | 19 | 25 | 0 | 0 |
| Probability Portal | 8 | 30 | 19 | 25 | 0 | 0 |
| Probability Portal | 9 | 30 | 19 | 24 | 0 | 0 |
| Measurement Mines | 6 | 42 | 32 | 12 | 0 | 0 |
| Measurement Mines | 7 | 42 | 32 | 12 | 0 | 0 |
| Measurement Mines | 8 | 42 | 32 | 12 | 0 | 0 |
| Measurement Mines | 9 | 42 | 32 | 12 | 0 | 0 |
| Practical Maths Town | 6 | 102 | 97 | 89 | 0 | 0 |
| Practical Maths Town | 7 | 102 | 97 | 89 | 0 | 0 |
| Practical Maths Town | 8 | 102 | 97 | 89 | 0 | 0 |
| Practical Maths Town | 9 | 102 | 97 | 89 | 0 | 0 |

## Released independent-check counts

| World | Band | Questions | Select options visible | Tap model available | Range sliders | Direct movement |
|---|---:|---:|---:|---:|---:|---:|
| Number Forest | 6 | 90 | 63 | 30 | 0 | 0 |
| Number Forest | 7 | 90 | 63 | 30 | 0 | 0 |
| Number Forest | 8 | 90 | 63 | 30 | 1 | 0 |
| Number Forest | 9 | 90 | 63 | 30 | 1 | 0 |
| Fraction Desert | 6 | 60 | 54 | 6 | 0 | 0 |
| Fraction Desert | 7 | 60 | 54 | 6 | 0 | 0 |
| Fraction Desert | 8 | 60 | 54 | 6 | 0 | 0 |
| Fraction Desert | 9 | 60 | 54 | 6 | 0 | 0 |
| Algebra Peaks | 6 | 72 | 34 | 42 | 0 | 0 |
| Algebra Peaks | 7 | 72 | 34 | 42 | 0 | 0 |
| Algebra Peaks | 8 | 72 | 34 | 42 | 0 | 0 |
| Algebra Peaks | 9 | 72 | 34 | 42 | 0 | 0 |
| Geometry Kingdom | 6 | 84 | 41 | 48 | 1 | 0 |
| Geometry Kingdom | 7 | 84 | 41 | 48 | 1 | 0 |
| Geometry Kingdom | 8 | 84 | 39 | 48 | 1 | 0 |
| Geometry Kingdom | 9 | 84 | 39 | 48 | 1 | 0 |
| Ratio Island | 6 | 48 | 27 | 24 | 0 | 0 |
| Ratio Island | 7 | 48 | 27 | 24 | 0 | 0 |
| Ratio Island | 8 | 48 | 27 | 24 | 0 | 0 |
| Ratio Island | 9 | 48 | 27 | 24 | 0 | 0 |
| Statistics City | 6 | 48 | 32 | 18 | 0 | 0 |
| Statistics City | 7 | 48 | 32 | 18 | 0 | 0 |
| Statistics City | 8 | 48 | 31 | 18 | 0 | 0 |
| Statistics City | 9 | 48 | 31 | 18 | 0 | 0 |
| Probability Portal | 6 | 30 | 19 | 12 | 0 | 0 |
| Probability Portal | 7 | 30 | 19 | 12 | 0 | 0 |
| Probability Portal | 8 | 30 | 19 | 12 | 0 | 0 |
| Probability Portal | 9 | 30 | 19 | 12 | 0 | 0 |
| Measurement Mines | 6 | 42 | 32 | 12 | 0 | 0 |
| Measurement Mines | 7 | 42 | 32 | 12 | 0 | 0 |
| Measurement Mines | 8 | 42 | 32 | 12 | 0 | 0 |
| Measurement Mines | 9 | 42 | 32 | 12 | 0 | 0 |
| Practical Maths Town | 6 | 102 | 97 | 6 | 0 | 0 |
| Practical Maths Town | 7 | 102 | 97 | 6 | 0 | 0 |
| Practical Maths Town | 8 | 102 | 97 | 6 | 0 | 0 |
| Practical Maths Town | 9 | 102 | 97 | 6 | 0 | 0 |

## New practice counts

| World | Band | Questions | Select options visible | Tap model available | Range sliders | Direct movement |
|---|---:|---:|---:|---:|---:|---:|
| Number Forest | 6 | 90 | 59 | 85 | 0 | 4 |
| Number Forest | 7 | 90 | 59 | 85 | 0 | 4 |
| Number Forest | 8 | 90 | 59 | 84 | 1 | 4 |
| Number Forest | 9 | 90 | 59 | 85 | 1 | 4 |
| Fraction Desert | 6 | 60 | 46 | 33 | 0 | 8 |
| Fraction Desert | 7 | 60 | 46 | 31 | 0 | 8 |
| Fraction Desert | 8 | 60 | 46 | 27 | 0 | 8 |
| Fraction Desert | 9 | 60 | 46 | 28 | 0 | 8 |
| Algebra Peaks | 6 | 72 | 32 | 40 | 0 | 4 |
| Algebra Peaks | 7 | 72 | 32 | 40 | 0 | 4 |
| Algebra Peaks | 8 | 72 | 32 | 40 | 0 | 4 |
| Algebra Peaks | 9 | 72 | 32 | 40 | 0 | 4 |
| Geometry Kingdom | 6 | 84 | 41 | 58 | 1 | 2 |
| Geometry Kingdom | 7 | 84 | 41 | 58 | 1 | 2 |
| Geometry Kingdom | 8 | 84 | 39 | 58 | 1 | 2 |
| Geometry Kingdom | 9 | 84 | 39 | 58 | 1 | 2 |
| Ratio Island | 6 | 48 | 25 | 24 | 0 | 2 |
| Ratio Island | 7 | 48 | 25 | 24 | 0 | 2 |
| Ratio Island | 8 | 48 | 25 | 24 | 0 | 2 |
| Ratio Island | 9 | 48 | 25 | 24 | 0 | 2 |
| Statistics City | 6 | 48 | 28 | 21 | 0 | 6 |
| Statistics City | 7 | 48 | 28 | 21 | 0 | 6 |
| Statistics City | 8 | 48 | 27 | 22 | 0 | 6 |
| Statistics City | 9 | 48 | 27 | 22 | 0 | 6 |
| Probability Portal | 6 | 30 | 17 | 21 | 0 | 4 |
| Probability Portal | 7 | 30 | 17 | 22 | 0 | 4 |
| Probability Portal | 8 | 30 | 17 | 22 | 0 | 4 |
| Probability Portal | 9 | 30 | 17 | 21 | 0 | 4 |
| Measurement Mines | 6 | 42 | 28 | 12 | 0 | 4 |
| Measurement Mines | 7 | 42 | 28 | 12 | 0 | 4 |
| Measurement Mines | 8 | 42 | 28 | 12 | 0 | 4 |
| Measurement Mines | 9 | 42 | 28 | 12 | 0 | 4 |
| Practical Maths Town | 6 | 102 | 91 | 81 | 0 | 8 |
| Practical Maths Town | 7 | 102 | 91 | 81 | 0 | 8 |
| Practical Maths Town | 8 | 102 | 91 | 81 | 0 | 8 |
| Practical Maths Town | 9 | 102 | 91 | 81 | 0 | 8 |

## New independent-check counts

| World | Band | Questions | Select options visible | Tap model available | Range sliders | Direct movement |
|---|---:|---:|---:|---:|---:|---:|
| Number Forest | 6 | 90 | 59 | 30 | 0 | 4 |
| Number Forest | 7 | 90 | 59 | 30 | 0 | 4 |
| Number Forest | 8 | 90 | 59 | 30 | 1 | 4 |
| Number Forest | 9 | 90 | 59 | 30 | 1 | 4 |
| Fraction Desert | 6 | 60 | 46 | 6 | 0 | 8 |
| Fraction Desert | 7 | 60 | 46 | 6 | 0 | 8 |
| Fraction Desert | 8 | 60 | 46 | 6 | 0 | 8 |
| Fraction Desert | 9 | 60 | 46 | 6 | 0 | 8 |
| Algebra Peaks | 6 | 72 | 32 | 40 | 0 | 4 |
| Algebra Peaks | 7 | 72 | 32 | 40 | 0 | 4 |
| Algebra Peaks | 8 | 72 | 32 | 40 | 0 | 4 |
| Algebra Peaks | 9 | 72 | 32 | 40 | 0 | 4 |
| Geometry Kingdom | 6 | 84 | 41 | 46 | 1 | 2 |
| Geometry Kingdom | 7 | 84 | 41 | 46 | 1 | 2 |
| Geometry Kingdom | 8 | 84 | 39 | 46 | 1 | 2 |
| Geometry Kingdom | 9 | 84 | 39 | 46 | 1 | 2 |
| Ratio Island | 6 | 48 | 25 | 24 | 0 | 2 |
| Ratio Island | 7 | 48 | 25 | 24 | 0 | 2 |
| Ratio Island | 8 | 48 | 25 | 24 | 0 | 2 |
| Ratio Island | 9 | 48 | 25 | 24 | 0 | 2 |
| Statistics City | 6 | 48 | 28 | 16 | 0 | 6 |
| Statistics City | 7 | 48 | 28 | 16 | 0 | 6 |
| Statistics City | 8 | 48 | 27 | 16 | 0 | 6 |
| Statistics City | 9 | 48 | 27 | 16 | 0 | 6 |
| Probability Portal | 6 | 30 | 17 | 10 | 0 | 4 |
| Probability Portal | 7 | 30 | 17 | 10 | 0 | 4 |
| Probability Portal | 8 | 30 | 17 | 10 | 0 | 4 |
| Probability Portal | 9 | 30 | 17 | 10 | 0 | 4 |
| Measurement Mines | 6 | 42 | 28 | 12 | 0 | 4 |
| Measurement Mines | 7 | 42 | 28 | 12 | 0 | 4 |
| Measurement Mines | 8 | 42 | 28 | 12 | 0 | 4 |
| Measurement Mines | 9 | 42 | 28 | 12 | 0 | 4 |
| Practical Maths Town | 6 | 102 | 91 | 4 | 0 | 8 |
| Practical Maths Town | 7 | 102 | 91 | 4 | 0 | 8 |
| Practical Maths Town | 8 | 102 | 91 | 4 | 0 | 8 |
| Practical Maths Town | 9 | 102 | 91 | 4 | 0 | 8 |

## Where direct questions now appear

**21 relevant skills**, all nine worlds and all four bands. In the audited selection, **336 / 4608 questions** use direct movement (168 practice + 168 checks). Eligible skills normally receive two direct questions among six; ordinary questions retain their existing formats. Freshness exclusions may leave an original question in place once a finite direct family has been seen; wording-only retakes are not presented as fresh mastery. There are **138 direct mini-tasks** across **105 mission/level combinations** in the first generated mission snapshots. The full report lists every world, band, stage, skill, question and mission link.

| World | Skill | Direct models | Mission routes |
|---|---|---|---|
| number | place | numberline | Normal lessons only |
| number | negative | numberline | 0, 2, gateway |
| fractions | fractions | fraction | 0, 1, gateway |
| fractions | fraction_operations | fraction | Normal lessons only |
| ratio | ratio_sharing | groups | Normal lessons only |
| statistics | stats_averages | numberline | 1, gateway |
| statistics | stats_tables | groups | 0, gateway |
| probability | prob_events | groups | Normal lessons only |
| measure | measure_units | ruler, jug | 0, gateway |
| measure | measure_volume | jug | 2, 1 |
| algebra | algebra_coordinates | grid | 2 |
| town | town_totals | basket | Normal lessons only |
| town | town_value | basket | Normal lessons only |
| town | town_household | basket, jug | Normal lessons only |
| fractions | fraction_parts | fraction | Normal lessons only |
| fractions | decimal_place | numberline | Normal lessons only |
| algebra | algebra_graphs | grid | curr-algebra_graphs |
| geometry | geometry_construction | ruler | 0, curr-geometry_construction, gateway |
| statistics | statistics_distributions | groups | 0, curr-statistics_distributions |
| probability | probability_sets | groups | 0, 2, curr-probability_sets, gateway |
| town | town_planning | basket, jug | market, cafe, bank, shops, station, home, leisure, work, curr-town_planning, gateway |

Place-value rounding uses normal lessons; the original block missions remain unchanged to retain that model. Mission levels retain the approved three tiers, using representative bands 6, 7 and 9. Normal lessons independently serve band 8. Existing IDs, unlock rules and topic prerequisites are unchanged. Sorting uses mathematical class intervals/outcome properties; equal ratio tokens accept any valid allocation; fraction answers accept any distinct equal parts; basket answers require exactly two different groceries with the requested total. Ruler checking requires both zero alignment and a correct end reading. The stable diagram label tracks actual geometric length, so a new label alone never creates a fresh measurement.

## Shared flow and save contract

1. `touch-content.js` wraps the real bank, adding version-9 question/spec snapshots only for selected skills and slots. `V3Engine.generate` retains topic adaptation, exclusions and prerequisites. Discovery itself is unchanged. New mission generation calls the same factory; saved old tasks are never decorated during resume.
2. `app.learning` gives `meta.direct` priority over the V8/legacy renderer and suppresses answer choices for that question. `adventure-ui.controls` uses the same shared renderer for a direct mission task. Other questions keep their existing routes.
3. `touch-activities.js` handles Pointer Events (touch/mouse/pen), capture, move, up, cancellation, lost capture, Escape and hidden/blurred pages. It uses SVG screen transforms for scale/grid/ruler coordinates; it does not use native HTML drag-and-drop or range inputs. Item ghosts preserve source space and target geometry. Touch-action is disabled only on draggable pieces/canvases, leaving the surrounding page scrollable.
4. Movement previews are transient. Release commits one validated intent through the existing `app.change` lock and scope guard. Tap and keyboard controls call the same reducer. Cancel/outside drop preserves the last committed model. Only the new serializable `manipulation.d9` / task `values.d9` fields are added. Partial drags are deliberately not saved; released positions resume exactly.
5. `V9Touch.matches` is shared by normal answers and mission validation. Empty/unselected models cannot silently pass. Wrong/unknown direct answers open teaching, retain the model and mark assisted evidence. Returning to the supported attempt cannot turn that failed first attempt into independent mastery. Hints remain available; edits and preview controls have no reward side effects.
6. Historical questions retain their own render/answer contracts. Old three-task and current six/twelve-task snapshots, mastery and unknown pending fields are preserved. All 222 simultaneous paused snapshots plus a 300 KB fictional history reserve fit the existing 2,000,000-byte limit without truncation.

## Play the development preview

From the repository run `npm run preview:touch`, then open **http://127.0.0.1:4173/dev/touch-preview.html**. The normal offline Test Camp has a clearly labelled review link. The preview has seven demos, including all six requested interactions plus mathematical sorting. It stores only its own fictional review key and has `connect-src 'none'`; no authentication, game-save import or unlock shortcut exists. The link is inserted only in the offline app and is not exposed by the cloud app.

For a portable review, download raw [TOUCH-PLAYABLE.html](review/TOUCH-PLAYABLE.html) and open it locally. Scripts, styling and coverage are embedded. It requires no server or network. The source preview and this standalone export use the same shared modules.

## Validation and limits

Run `npm test`, `npm run test:curriculum`, `npm run test:touch`, `npm run test:touch-browser`, `npm run test:curriculum-browser`, `npm run test:gameplay-quality` and `npm run test:ipad-release`. New tests reproduce reachable counts, independently check printed mathematics, exercise all 222 integrated missions/1,494 mini-tasks, preserve released snapshots and assess fresh/spaced mastery. Browser coverage uses trusted touch input, all nine normal lesson flows, UI assessment-to-lesson navigation, release/cancel/return/reset, stale edits, keyboard focus, storage and accessibility at 820×1180, 1180×820 and 390×844. Final measured results are recorded in TOUCH-VALIDATION.json.

**Physical iPad Safari is not tested.** Chromium touch emulation is not a Safari/device claim. Real learner-paced feel, target comfort and educator acceptance remain follow-up checks. Large retained histories still have the existing storage ceiling. This is a focused direct-manipulation expansion, not a replacement of every question or a new world.
