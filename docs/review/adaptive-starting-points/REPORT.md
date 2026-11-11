# Adaptive “Find my starting point”

11 November 2026 · branch `codex/adaptive-starting-points` · exact release base `9a63750ab5687ea28e65150c5f8185b29e04974a`. The release head and clean worktree were checked before creating the branch. Development only: no PR, merge or deployment.

[Desktop and touch gallery](gallery/GALLERY.md) · [Validation summary](VALIDATION.json).

## Learner flow

Each new section contains exactly **15 questions** in one untimed assessment. Before starting, the learner explicitly selects a UK curriculum year for that section. Options come from existing question-bank years and skill year tags, with the existing foundation pathways included. No new curriculum years or maths definitions were added.

Number, fractions, geometry, statistics and measurement offer Years 3–9. Algebra, ratio, probability and Practical Maths Town offer Years 5–9. The selector states each area's range; an unavailable lower year is not silently replaced. KS3 year ordering follows the game's existing proposed progression, rather than a claim of official annual KS3 assessment standards.

Questions start at the selected year. Three consecutive correct answers move the **next** question up one available year. Three consecutive incorrect, “I don’t know” or “I can’t do this” responses, in any combination, move it down one year. A response in the opposite direction resets the other streak. Applying a year change resets that streak, including at the upper/lower boundaries. Counters, starting/current years, pending question, draft and answered/awaiting-Next state are saved.

The assessment samples different skills within the area and existing year ranges, rather than repeatedly presenting the same two objectives. It reuses existing authored banks and generators. Drawing/manipulation and calculator-dependent curriculum rows are excluded from this numeric assessment where their required tools are not present. Prompts do not repeat within a run. Existing generated money values are presented as valid pounds/pence, and equivalent fraction responses are accepted against the generators' rounded decimal keys.

After answer 15, the learner receives a cautious area estimate, the sampled outcome counts and suggested teaching topics. A year needs at least three sampled responses with at least two thirds correct before it supports the estimate. The result never reports an untested higher year. Sparse or all-unknown evidence explicitly says there is not enough evidence to estimate and suggests a gentle teaching entry. Results state that this is a starting estimate, not a full assessment, school grade or proof of mastery. Untested topics may require a different level.

## Preservation

Existing completed four-question profiles remain valid, so existing learners are not locked out or forced to start over. Existing partial four-question runs keep their exact stored questions, answers and drafts and finish at four. The learner can then choose a new 15-question estimate.

Completed sections offer an optional reassessment with a new explicit year choice. The previous complete record is archived intact in the same starting-profile book. Learning access, the nine-area completion indicator and the previous recommendation remain available while the new run is unfinished. The existing pause/resume picker restores the exact active assessment. Earlier estimates and answers remain visible from the section's history; no prior record is deleted.

The book retains version 1 for compatibility; new runs have `assessmentVersion: 2`. Existing per-objective discovery and independent checks still take precedence over a provisional area suggestion. New assessments never write discovery rounds, mastery evidence, completed checks, practice records, coins, rewards, purchases, milestones or unrelated saved activities. Existing question-exposure tracking (`seen`) is retained so an assessment prompt is not treated as unseen independent evidence later.

Curriculum modules/objectives, Town activity definitions, accounts, backend/database code, Cloudflare Access and live/demo configuration are unchanged. Demo source changes are limited to its browser test exercising the explicit year selector and 15-response flow. Its real assessment remains optional and browser-only; no completed profile or mastery is fabricated.

## Validation and limits

- Final reassessment completion-display checks: **8 passed**, no failed, skipped or flaky cases.

- focusedAdaptive: **56 passed**, no failed, skipped or flaky cases.
- allProfileCompatibility: **60 passed**, no failed, skipped or flaky cases.
- finalNineAreaFlow: **4 passed**, no failed, skipped or flaky cases.
- finalYearControls: **8 passed**, no failed, skipped or flaky cases.
- saveRecovery: **32 passed**, no failed, skipped or flaky cases.
- demoActivities: **24 passed**, no failed, skipped or flaky cases.
- productionRecovery: **6 passed**, no failed, skipped or flaky cases.
- Standalone demo isolation: desktop and both iPad orientations passed, no external requests or console errors.

The [machine-readable summary](VALIDATION.json) records the final results. Focused engine coverage includes **330 complete initial runs** over every section, supported year and response pattern, plus **27 reassessments**. It checks mixed downward streaks, opposite resets, boundaries, year tags, unique prompts, equivalent fractions, the exact 15-response cap, invalid/duplicate input, final-answer resume, archived history, legacy snapshots and unchanged normal progress.

Browser coverage uses fictional saves and intercepted production login/save responses, plus the isolated public-demo build. It exercises desktop, iPad portrait, iPad landscape and small touch: year choice and keyboard focus, both skip controls, upward/downward moves, pause/switch/reload, final-answer recovery, estimates, legacy compatibility and reassessment without re-locking learning. The broader compatibility suite also checks real nine-area completion, parent evidence presentation and unrelated paused activities.

Core regressions, curriculum/audit, touch interactions, gameplay quality, save/recovery, production packaging and demo source/parity checks were run. No real account, learner record or hosted service was accessed. Physical iPad Safari is **untested**. Docker is unavailable in this Windows workspace, so the database-backed GitHub `save-and-recovery` gate is not claimed as run locally; it must run unchanged when a release PR is requested. No checks were hidden or weakened.

During development, the browser checks exposed a year-selector handler error and retake-panel state issue, which were fixed. The full-profile harness was updated to wait for the saved page before checking conditional selectors. All reported final results refer to the corrected flow.
