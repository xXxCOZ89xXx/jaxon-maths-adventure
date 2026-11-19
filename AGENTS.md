# Current development rules — Jaxon's Maths Adventure

The owner approved the Claude-review plan on 18 November 2026: stable question identities and the content registry, retained-history storage, then the remaining Phase 3 work. This supersedes older feature freezes. Earlier instructions are preserved in [the historical record](docs/archive/AGENTS-2026-11-18.md); use this file and [the current status](docs/CURRENT-STATUS.md) for current work.

## Scope and release

- Develop on an isolated branch based on `release/ipad`. Submit normal PRs to that branch; never push a release directly, bypass checks, use skip flags, or change branch protections. Keep `main`, `index.html` and the original `v2-game-test.html` untouched.
- Development includes concrete migration scripts and fictional rehearsals. Hosted database installation/cutover needs its own reviewed package and a verified encrypted backup; the original Claude brief assigns that backup to the owner. Do not run hosted SQL, create accounts/projects, use learner services or change hosting/access settings as development QA.
- Publish only when release is authorised, through the existing Git-connected Cloudflare projects. Verify deployment checks for the exact merge commit through GitHub. No Cloudflare API, Wrangler, manual uploads or configuration changes.
- Phase 2b's artwork/touch overhaul and further curriculum expansion are outside this plan. Multi-learner work is design only; do not enable selection or alter Auth/family/PIN relationships.

## Preservation and learning

- Preserve existing IDs, full historical question/task snapshots, unknown fields, pending request contents and IDs, reset generations, financial receipts, ownership, prices and wallet arithmetic. Never truncate history or clear a queue to make a new architecture fit.
- The new mastery contract is versioned: five of six independent first answers, spaced evidence and one-stage demotion. Already-saved assessments keep their original marking and mastery contracts. Hints, skips and retries remain supported; assisted answers do not become independent evidence.
- The weekly target remains 60 active minutes, with learning/screen-time rewards at 1:1. No rewards from opening screens, repeated low-effort interactions, immediate retakes or history uploads.
- Keep the original approved assets, scene proportions, layered wardrobe/portrait system and art hashes. Use code-rendered mathematical text and values, with touch alternatives and keyboard controls. Review screenshots are archived separately; in-game assets and art-direction references remain in place.
- Use the registry/code for current skill/world counts. Never infer a new question identity from wording alone, re-identify a paused question on load, or treat an unloaded history page as absent evidence.

## Verification and handoff

- Run automated checks as changes are made, using synthetic state, mocked/intercepted endpoints and network-disabled local PostgreSQL. Block all real Supabase destinations in browser fixtures. Never authenticate as a real learner/parent or import a personal progress backup for tests.
- Run `npm test`, focused new suites and the combined `npm run test:ipad-release` gate. Keep the required GitHub check named `save-and-recovery`. Browser suites sharing port 4173 run sequentially.
- Run lint/format checks on the maintained source set. Keep formatting-only changes in a dedicated commit; do not change snapshot/asset bytes for formatting.
- The owner wants **one manual iPad Safari acceptance at the end**, after the planned updates. Do not repeatedly ask for device testing. Report emulation separately from physical Safari, which remains untested until that acceptance.
- Preserve commits, test evidence, a current status page and a reviewable PR if interrupted. Complete concrete, reviewable work before asking for a genuinely blocking owner action.
