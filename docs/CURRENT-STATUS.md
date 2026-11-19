# Current project status

Generated from the code registry by `npm run status`. Historical review reports remain dated evidence; this page is the current implementation summary.

- Current scope: UK launch Phase 1 recovery preparation.
- Registry: **96 skills across 9 worlds**, with 146 prerequisite links.
- Released baseline: `21237873a04ce1306b8596d1097b234098300f01`.
- Release: Branding PR #38 is released on both existing game/demo hosts. The UK family launch roadmap is recorded in the shared Notion project home. /game, /account and /demo are selected future paths; their routing is not deployed by this package.

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

Local npm test, the 56-case combined iPad Chromium save/recovery gate, 2,988 curriculum task completions, retained-history PostgreSQL rehearsals, private/demo build checks, lint and formatting pass. Extended bank coverage verifies 121,440 fresh prompts. GitHub CI is reported on PR #37; physical iPad Safari acceptance is deferred. See PHASE3-VERIFICATION.md for scope and limits. Current recovery preparation has separate fictional PowerShell/PostgreSQL rehearsals; see CURRENT-GAME-RECOVERY.md for scope. Earlier test results remain dated evidence, not new device/service certification.

The owner reports a current main-game export and two tested encrypted copies. Current application-data restoration remains unverified. A new local verifier covers current V3 and existing public/private application tables without Docker/WSL; see CURRENT-GAME-RECOVERY.md. No hosted SQL, Auth, accounts, hosting or project changes were made. Concrete storage review and managed-service recovery limitations remain open.

One combined manual iPad Safari session after the planned updates and any approved cutover are complete.

See [the implementation sequence](PHASE3-IMPLEMENTATION.md), [the database review package](../supabase/history/README.md), [multi-learner design](MULTI-LEARNER-DESIGN.md) and [screenshot archive](review/ARCHIVE.md).
