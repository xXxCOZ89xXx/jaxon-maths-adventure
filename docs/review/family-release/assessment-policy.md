# Nine-area starting profile and pause/resume

Assessment/pause design recovered at `cdd0116` on `codex/guided-progression-recovery`, continuing from `bc4a601`. The owner’s 29 October release instruction authorises normal protected-PR publication after checks. See `FAMILY-READINESS-REVIEW.md` for the release follow-up, character options and family-account limits. No learner-record/service access, accounts, backend migrations or production-setting changes are authorised.

## First play and admission

Base Camp remains Home. “Find my starting points” offers all nine areas in the existing world order. Jaxon can choose them in any order, visit the maps and Town, leave an unfinished question, and return from Base Camp’s saved-activity list. Town remains separate from the eight-subject grid.

Every area completes after exactly **four captured responses**, including safe “I don’t know” responses. Each sample alternates between two representative objectives. The first two questions use the existing discovery starting band (5 for objectives with foundation content down to band 3; otherwise 7). Both correct moves the last pair up one band; neither correct moves it down one; one correct keeps it unchanged. Each question respects its objective’s minimum band and the maximum band 9. Questions and choices come from the existing discovery bank. The sampled question, choices, entered draft and captured responses remain saved; reload does not regenerate them.

Lessons, supported practice, independent checks, per-skill discovery, missions, Town plans and restorations wait until all nine samples are complete. Maps, Base Camp, How to play and settings remain accessible. Admission is checked inside the existing locked action transaction, and loading an old activity displays the starting profile without deleting the activity. Learning-entry buttons explain the gate. The gate does not invent completed skill assessments or bypass any restoration or independent-check prerequisite.

| Area | Sampled objectives |
| --- | --- |
| Number Forest | Negative numbers; addition and subtraction |
| Fraction Desert | Fractions of amounts; decimals and percentages |
| Algebra Peaks | Missing numbers; patterns and sequences |
| Geometry Kingdom | Angles and turns; perimeter and area |
| Ratio Island | Understanding ratios; sharing in a ratio |
| Statistics City | Tables and charts; averages |
| Probability Portal | Chance and probability; counting outcomes |
| Measurement Mines | Units and conversions; reading time and timetables |
| Practical Maths Town | Money/change; timetables |

## Meaning and limits of estimates

The existing four-response adaptive recommendation policy derives the provisional range from the mixed sample’s final band and correct count. This calculation uses a temporary state; it **does not write a completed skill discovery round, practice evidence, independent score, mastery or restoration milestone**. The baseline’s own responses and estimated band are stored separately in the additive `startingProfile` field.

Ranges 3–9 identify game curriculum difficulty bands. They are not a diagnosis, school year placement, formal school grade or proof of mastery. A mixed four-question sample cannot assess every objective or distinguish all high and low abilities. Four unknown responses complete the offered sample but produce “Not enough evidence to estimate.” Any complete area estimate remains provisional. Fewer than three attempted responses is “Very limited evidence”; otherwise it is “Limited sample.” These descriptions are not statistical confidence intervals.

Where finer skill evidence is absent, the provisional area range supplies an initial teaching/discovery suggestion. Skill-specific discovery and the existing independent/adaptive policy take precedence. Restoration still requires completed starting-point discovery for every mapped skill, chooses its existing adaptive level, retains that level when resumed, and keeps story practice separate from independent mastery.

Captured answers receive neutral acknowledgement while collecting the entire baseline. There are no hints, worked examples, correctness marks or retries during collection. Explanations become available after all nine areas are captured, avoiding teaching overlapping topics between samples. Displayed prompts enter the existing seen-question set so later independent generators exclude them. Baseline navigation and answers do not run the activity reward clock.

The sample is 36 questions overall, untimed and freely pausable. Actual duration and suitability need child playtesting. Guessing, reading demands, the bank’s choice distractors, repeated exposure to older discovery questions, and the small number of sampled objectives limit inference in every area. Do not read an area estimate as coverage of untested fractions, statistics, geometry, algebra or other curriculum objectives. The profile does not erase or reinterpret earlier evidence from existing saves.

## Parent view and access

The connected parent dashboard renders nine area cards from the progress returned by its existing parent-authorised read. No new endpoint or access bypass is added. The learner application does not render this profile, including on a learner request for the parent route. The offline learner demo does not pretend to authenticate a parent. Review screenshots exercise the actual production build with intercepted fictional parent and learner sessions.

Each card shows baseline completion/status, provisional range or missing estimate, confidence description, sampled objectives and a London-local date. Evidence older than 30 days is labelled for review; absence of a date is not presented as fresh. A separate independent-evidence line updates on the dashboard’s existing refresh: number of completed skill checks, latest date, recommendation for the latest assessed skill and count of skills with fresh/spaced mastery evidence. The latest skill recommendation is not claimed to establish the whole area’s level. Baseline results remain immutable when independent evidence changes.

## Pause, explore and reset

Every in-progress assessment and activity has “Pause and explore,” including inside world and Town close-up dialogs. Existing Home and map navigation also preserve and bookmark the activity. Base Camp lists saved baseline areas, lessons/checks/discovery by skill and mode, world missions/restorations by existing key, Town plans by existing run ID, and older saved quests/journeys. Continue resumes the latest paused activity when it remains available. Selecting a saved mission first suspends any other active mission rather than overwriting it.

Pausing keeps the existing snapshot: area/world, activity ID and seed, question/step index, phase, feedback and answer status, typed/invalid drafts, constructed/touch tools, calculator values, Town inventory, clock and receipts. It does not submit an answer, advance a step, complete an activity or award mastery, coins, XP or restoration progress. The active-learning window is cleared on navigation. Existing save IDs, namespaces, immutable pending transactions, wallet rules and backend controls are unchanged.

Get unstuck remains a separate confirmation. For the new baseline it clears only the current unfinished typed draft; captured responses and other areas remain. Exit pauses that question. Existing lessons/checks retain earlier answers and evidence; Town/mission restarts retain earlier steps and receipts in Earlier attempts. Completed activities and unrelated work remain. A stale confirmation cannot reset a different attempt, and the whole learner save is never cleared.

## Review verification

Tests use fictional local profiles, intercepted connected services or network-disabled local PostgreSQL only. Post-profile regression suites now explicitly seed a completed fictional baseline produced through the real assessment module. First-play tests use an untouched fresh state and complete the real UI flow. Production settings, original background files, player/avatar/profile artwork and approved guide portraits remain unchanged.

See `review/starting-profile/verification.json`, its retained test logs, and the downloadable gallery for executed results. Physical iPad Safari remains untested; viewport/touch emulation does not establish hardware acceptance.
