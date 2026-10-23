# Jaxon's Maths Adventure: Final Graphics Corrections and Release

## 1. Approval status

The owner has reviewed all 50 screenshots from commit `af50b2e`.

The overall environmental artwork and graphical direction are APPROVED.

This includes:
- The connected nine-world map.
- Base Camp and its four exterior appearances.
- The nine individual world environments.
- Practical Maths Town and its locations.
- Character design and avatar customisation.
- The general style of interactive objects.

Do not redesign these approved environments or restart the artwork process.

Complete the following targeted corrections, test them and release the finished graphics update through the existing deployment workflow.

## 2. Correct avatar size, positioning and perspective

**This is an important requirement.**

Although the avatar's appearance has improved, he is still too small in some Town scenes and sometimes appears pasted into the foreground.

Examples include:
- Bank.
- Workshop.
- Post office.
- Other scenes where he appears unusually small or overlaps furniture.

Correct BOTH problems.

### Avatar size

The avatar must be:
- Clearly visible and prominent during gameplay.
- Appropriately sized for a teenage player character.
- Consistent with the scale of adults and other people in the scene.
- Large enough for his clothing, expressions and accessories to be recognisable on an iPad.
- Consistent with the improved presentation already achieved in Base Camp, the kitchen, supermarket and bus station.

**Do not solve the overlapping-furniture problem by making him smaller.**

Where necessary, use a closer gameplay camera or reposition the character and adjust the perspective.

The aim is a prominent, teenage-sized character who looks like he genuinely belongs in the environment.

### Avatar positioning

Correct:
- Feet appearing on top of desks or counters.
- The character standing in front of objects when he should be behind them.
- Floating or unnatural placement.
- Incorrect foreground/background layering.
- Inconsistent scale between similar indoor locations.

Where relevant, use scene-specific positioning, depth layers and appropriate environmental anchoring.

### Acceptance criteria

Review the avatar across all major scenes at iPad-sized resolutions.

The character must be sufficiently large, properly grounded and naturally positioned.

Provide actual before-and-after screenshots of the bank, workshop and post office.

Also check the remaining Town locations for the same problem.

## 3. Match maths interactions to the skill being taught

Review the current interactive learning tools for mathematical relevance.

Examples identified in the screenshot review:

- Fraction addition currently displays a generic thousands/hundreds/tens/ones builder.
- Pie-chart proportion questions use place-value blocks as the main answer-building tool.
- Electricity meter questions use generic place-value blocks rather than focusing on the meter readings.

Correct these mismatches.

Use:
- Fraction bars, circles or equivalent representations for fraction calculations.
- Charts and proportional representations for statistics questions.
- Realistic interactive meters and appropriate calculations for utility readings.
- Balances, equations and patterns for algebra.
- Relevant manipulatives for geometry, measurement, money and ratio.

Do not attach a generic interactive tool to every question just to make it appear interactive.

Retain numerical entry when it genuinely suits the mathematical objective.

**Do not undertake the full curriculum expansion during this graphics release.**

Only correct interaction mismatches and educational issues identified during this stage.

## 4. Ensure answers are not visible before attempting a question

Verify untouched initial states for:

- Algebra train sequences.
- Fraction ordering.
- Ratio supply groups.
- Geometry rotations.
- Graph construction.
- Other interactive activities.

Some screenshots may show completed fictional test states, so do not assume the initial state is incorrect without checking.

If answers are already assembled or revealed on entry, correct this.

Teaching demonstrations may show worked solutions, but subsequent independent activities must use different examples.

## 5. Make restoration graphics appropriate to each world

The current world screens reuse substantially the same wooden repair structures.

Replace these with visually appropriate objects that match each world:

- Number Forest: bridges, treehouses and forest structures.
- Fraction Desert: canals, water channels and oasis equipment.
- Algebra Peaks: freight railway, generators and mountain lifts.
- Geometry Kingdom: castle walls, towers and construction equipment.
- Ratio Island: harbour equipment, docks and supply routes.
- Statistics City: data equipment, power systems and information displays.
- Probability Portal: portal stabilisers and magical mechanisms.
- Measurement Mines: rails, measuring machinery and mine lifts.
- Practical Maths Town: streets, buildings and community facilities.

Retain the approved backgrounds and environments.

Where restoration progress is already implemented, make relevant repaired elements visibly change when missions are completed.

Do not add the proposed recurring villain or boss battles yet. These are reserved for future story development.

## 6. Improve relevant hints and instructions

Replace generic hints with explanations connected to the actual maths.

For example:
- Rotation hints should explain the angle and direction.
- Fraction hints should explain the parts and the whole.
- Algebra hints should guide recognition of relationships and patterns.
- Measurement hints should explain relevant units and conversions.
- Money hints should explain values and calculations.

Keep progressive hints and the existing "I don't know" teaching route.

Review wording and consistency where necessary.

Improve the original Bolognese recipe so quantities are realistic, clear and suitable for the learning activities.

Do not undertake a complete rewrite of all question banks at this stage.

## 7. Preserve existing data and features

Retain:
- All nine worlds.
- All 63 existing skills.
- All 27 Town plans.
- The original Bolognese journey.
- Existing adaptive assessments and teaching.
- Base Camp upgrades.
- The 40-item avatar shop.
- Coins and purchased cosmetics.
- Parent dashboard and permissions.
- Existing learner accounts and PINs.
- Saved progress and historical mastery evidence.
- The weekly 60-minute target.
- The 1:1 screen-time rewards.
- Offline saves and recovery.

Do not introduce unrelated Supabase changes, database migrations or hosting changes.

Maintain compatibility with existing progress.

## 8. Focused testing

Test:
- Avatar scale and positioning in all major locations.
- World-specific restoration graphics.
- Correct maths tools for representative questions.
- Unanswered initial question states.
- Interactive controls and teaching.
- Saved progress and reopening.
- Parent permissions and rewards.
- iPad portrait and landscape layouts.

Capture a small, focused set of actual running-game screenshots showing the corrections.

Do not produce another 50-image approval gallery.

## 9. Release instructions

The owner has approved the overall visual direction and these specific corrections.

Implement on:

`codex/v3-adventure-build`

Keep the existing live game unchanged during development.

Once the corrections are complete and all relevant tests pass:

1. Commit the finished changes.
2. Promote the tested version to `release/ipad`.
3. Allow Cloudflare Pages to build and publish automatically.
4. Confirm the deployment succeeded.
5. Verify Cloudflare Access remains enabled.
6. Preserve the existing Supabase connection and learner progress.
7. Confirm the live game remains available at:

https://jaxon-maths-private-git.pages.dev

Do not release if essential tests fail or existing progress could be lost.

No manual ZIP uploads, new hosting projects or unnecessary infrastructure changes.

## 10. Final report

After publication, provide:

- The final GitHub commit.
- Confirmation of the Cloudflare deployment.
- Summary of the avatar size and positioning corrections.
- Confirmation that restoration graphics are distinct between worlds.
- Summary of corrected learning interactions.
- Focused testing results.
- Any outstanding issues.

## 11. Next development phase: Years 6–9 curriculum

This is a planning note for the NEXT release, not part of the current graphics implementation.

After the graphics release, the next priority is a complete educational content review focused on the English maths curriculum for **Years 6, 7, 8 and 9**.

This should include:

- Curriculum mapping.
- Identification of missing skills and prerequisites.
- Expanded, varied question banks.
- Adaptive assessments.
- Appropriate teaching and explanations.
- Independent mastery and revision.
- Genuine maths interactions.
- Increasing difficulty within each topic.

Do not remove lower-level content already implemented, because it remains useful for filling learning gaps.

Do not expand Years 3–5 content during the next release unless necessary to teach a missing prerequisite.

Do not undertake a full commercial curriculum expansion yet.

The wider Years 3–9 or beyond curriculum can be considered during future commercial development.

## Final goal

Complete and publish the approved graphics upgrade while ensuring the teenage avatar is prominent and correctly positioned, activities use relevant interactive tools and every world has distinctive restoration visuals.

After successful publication, the project will move into its dedicated Years 6–9 educational quality and curriculum development phase.