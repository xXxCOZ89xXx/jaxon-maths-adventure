# Owner review corrections

Branch: `codex/guided-progression-recovery`, continuing from `d4a713e`. Released `7f51c046ee732e8000b675ed0b43d4dd1412585a` remains unchanged. This work is for review only: no PR, merge, deployment, account access, learner-service requests or production configuration changes.

## Causes and fixes

| Report | Reproduced cause | Correction |
| --- | --- | --- |
| “Plan, compare and explain” shows an undefined location | The curriculum route ID `curr-town_planning` was passed to a physical-venue renderer. Its venue lookup returned undefined. Curriculum tasks omitted venue/title, and direct-interaction conversion rebuilt task objects without retaining that metadata. | New curriculum tasks supply meaningful venue/title metadata, direct-task conversion retains it and uses the supermarket for its grocery activity, and every new Town mission task gets validated location details. Route cards and play screens resolve a real venue instead of treating a curriculum ID as a building. Older saved tasks use a read-only location adapter; their snapshots are not rewritten. |
| Unexplained customer context box | Generic role badges and location/context summaries appeared separately from the task explanation. | Removed the context badge and role chip from that presentation. Ellis explains the role in ordinary language beside the current task. Locations remain named; the existing approved guide portrait and fallback are retained. |
| Town restoration is hard to find | The restoration board followed the large map. Its generic next-step action and unnamed earlier-stage message did not explain the actual route. | Town has its own Base Camp and main-navigation destination. “Restore the Town community” comes first, with a named recommended assessment, lesson, check or restoration. Each locked stage lists its named skill assessments and previous community stage, with direct actions. |
| An answer appears to return to the supermarket | In fictional reproductions, the saved activity key and seed stayed the same, and the question index advanced correctly. The UI keyed its open/closed workbench state by question index, so every Next action closed it and exposed the location scene. The venue-rendering issue could also show a misleading scene. No real learner save was inspected, and an actual saved-route reset was not reproduced. | Workbench visibility now follows the activity identity and seed, preserving the open question flow across steps. Saved Town-plan IDs, task indices, drafts and receipts remain in the current activity. New activities still start with their own guide. Tests explicitly cover the supermarket route as well as connected Town plans. |
| Choices require selecting and then checking | Choice handlers edited the selection but did not submit. Typed curriculum answers also lacked Enter submission. | Choices submit on one tap inside the existing scoped save transaction. Typed answers use Enter or one Submit answer action. Constructed and touch answers use one Submit answer action. Feedback remains visible before a separate Next action; focus moves to that action accessibly. |
| Wrong answers leave the question | Mission answers switched to the lesson view, and direct learning answers marked a separate teaching screen as required. | Wrong answers stay on their current question with teaching feedback and a safe retry. First-attempt evidence remains immutable, retries are assisted, and a wrong first independent answer cannot become independent credit. Skipping remains safe. Discovery retains its first response per question rather than accumulating duplicate placement records on retries. |
| Home and Town are confusing | Home was a separate hero dashboard, and Town was a ninth item in the subject grid/atlas navigation. | Base Camp now serves Home, with Continue, Subject worlds, Town and Restore Community, and How to play. The subject grid and interactive subject-island navigation contain eight worlds. Town remains internally `world: town`; all route, skill and save IDs are unchanged. The first-time guide invitation and skip action remain available. |

## Restoration and evidence

Assessment gates and stage mappings are unchanged. Every mapped skill needs a completed starting-point record with a completed round; later stages also need the previous restoration stage. Existing adaptive recommendations choose the stage's level, and resuming retains the original level and task snapshots. Optional Town plans and subject missions remain available.

The recommendation explains the next action; it does not add a mastery gate or treat a guided mission as assessment. A learner can start an eligible restoration after its starting-point requirements, while the recommended route still offers teaching and an independent check first. Existing independent-check prerequisites remain in place and are named when needed.

Restoration evidence stays separate from lessons, supported practice and independent checks. Completion is story progress, not proof of mastery. No coins, purchases, completed stages, assessment history, other worlds or unrelated activities are cleared. Get unstuck continues to reset only its confirmed unfinished activity and preserves the old attempt's completed steps and receipts.

## Review artifacts and verification

`review/owner-review/index.html` contains the before and corrected captures. `review/owner-review/verification.json` records the executed checks; detailed logs are included in the downloadable gallery.

The baseline captures were taken from `d4a713e` before source edits. They reproduce the undefined curriculum card location and the workbench closing while its saved route remains unchanged. Corrected captures cover Base Camp, the named Town route, a valid curriculum location, one-action answers, the task guide, restoration reasoning/completion and scoped recovery on desktop, iPad portrait, iPad landscape and small touch.

All tests use fictional local saves, intercepted services or network-disabled local PostgreSQL. The offline review keeps `connect-src 'none'` and includes the original artwork and approved portraits. No painted-background experiments or art comparison controls are included.

Build/run: `npm run build:guided-preview`, then `npm run preview`. Local playable URL: `http://localhost:4173/preview-dist/PLAY-V3.html`. Downloadable code/art ZIPs are attached to the private review Page for access outside the workspace.

Physical iPad Safari remains untested. Restoration duration remains a design estimate requiring child playtesting. The exact state on the owner's device has not been inspected.
