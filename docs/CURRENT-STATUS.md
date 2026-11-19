# Current project status

Generated from the code registry by `npm run status`. Historical review reports remain dated evidence; this page is the current implementation summary.

- Current scope: Everyday Skills Adventures branding preparation.
- Registry: **96 skills across 9 worlds**, with 146 prerequisite links.
- Released baseline: `e33d3ef064ef6b6df036771ebab466b9465ff30e`.
- Release: Phase 3 application is live. The Everyday Skills Adventures branding change is prepared for PR review and is not deployed. The owner-selected future live address is everydayskillsadventures.co.uk/game; sales-site routing and Auth configuration have not changed.

## Implementation

- Additive stable question identities, shared registry and prerequisite graph
- Capability-gated retained-history storage, paged transport and local recovery
- Versioned shared marking for decimals, mixed numbers, currency and compatible units
- New mastery policy: five independent first answers out of six; one-stage demotion
- Question-specific worked explanations and misconception choices
- Lint/format tooling, archived review screenshots and current instructions
- Multi-learner architecture documented; account selection is not enabled
- Everyday Skills Adventures name, exact owner-supplied logo, compact activity symbol and browser icons

## Verification and cutover

Local npm test, the 56-case combined iPad Chromium save/recovery gate, 2,988 curriculum task completions, retained-history PostgreSQL rehearsals, private/demo build checks, lint and formatting pass. Extended bank coverage verifies 121,440 fresh prompts. GitHub CI is reported on PR #37; physical iPad Safari acceptance is deferred. See PHASE3-VERIFICATION.md for scope and limits.

Owner confirmed on 19 November that the new encrypted backup is not yet ready. No hosted SQL, account or project changes have been made. Compatible client release can precede installation; database installation and cutover wait for a verified encrypted backup and concrete review.

One combined manual iPad Safari session after the planned updates and any approved cutover are complete.

See [the implementation sequence](PHASE3-IMPLEMENTATION.md), [the database review package](../supabase/history/README.md), [multi-learner design](MULTI-LEARNER-DESIGN.md) and [screenshot archive](review/ARCHIVE.md).
