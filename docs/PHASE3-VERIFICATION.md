# Phase 3 verification record

All data is synthetic. No hosted database SQL, real sign-in, learner backup import, hosting configuration or account changes were used. Released baseline: `e462b1a7f38c54565b869a56b04e23b9cd02eeec`. PR #37 contains the development implementation; this record is not a deployment attestation.

Automated evidence on 19 November 2026:

- Registry validation covers all 96 skills and nine worlds, prerequisite cycles/unknown nodes, stable IDs, exclusions and legacy snapshot preservation.
- Shared marking covers numeric precision, mixed and negative fractions, compatible compound units, currency, exact clock/ratio/text answers and malformed input refusal. Mastery checks cover five-of-six independent answers, spacing, one-stage demotion, hints/retries and legacy assessment rules.
- Teaching checks cover 2,943 numeric questions with one correct choice and explained alternatives. Curriculum checks complete 2,988 generated tasks and retain all 222 paused mission snapshots within the existing payload limit, including extra history.
- The extended bank test generates 121,440 fresh prompts in 20,240 skill-band rounds. Starting-point safety checks cover 1,320 generated questions; the adaptive legacy suite covers 330 initial runs and 27 retakes.
- History client and network-disabled PostgreSQL rehearsals cover >2 MB exact restore, reusable immutable pages, late-error transaction rollback, committed-root pagination, immutable retries while writes are paused, legacy request refusal/acknowledgement, family/role isolation, quota/missing-page errors and reset generation fencing.
- The 56-case combined save/recovery browser suite covers portrait and landscape Chromium touch emulation. Focused new cases exercise large history, lost acknowledgement, delayed V1 conflict recovery and new marking through real controls.
- Private production/staging builders and the isolated demo builder/checker pass. Demo source parity/rebuild and credential/backend/network exclusions pass. Historical Home review packaging verifies archived image hashes against the previous release.
- Maintained-source ESLint, Prettier and registry-derived status checks pass.

GitHub CI is reported independently on the PR and must pass before release. Local emulation does not verify physical Safari. The [single device acceptance](PHASE3-ACCEPTANCE.md) is deferred until the complete release and any separately approved database cutover. The [database package](../supabase/history/README.md) remains disabled and requires the owner's verified encrypted backup before hosted execution.
