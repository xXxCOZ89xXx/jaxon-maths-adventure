# Everyday Skills Adventures

[Current implementation, release and acceptance status](docs/CURRENT-STATUS.md) · [Development rules](AGENTS.md) · [Phase 3 sequence](docs/PHASE3-IMPLEMENTATION.md)

The code registry is the source of truth for skill/world counts. Regenerate the current status page with `npm run status`; dated review documents describe their historical builds.

## Local verification

Use Node 24 and `npm ci`. Run `npm test`, `npm run lint`, `npm run format:check` and the focused suites for the change. `npm run test:ipad-release` includes Chromium emulation and disposable network-disabled PostgreSQL checks; Docker and Playwright Chromium are required. Browser fixtures use fictional users and block real backend traffic. Suites sharing port 4173 run sequentially.

The normal GitHub `save-and-recovery` check remains the release gate. Publication uses normal PR merges to `release/ipad` and the existing Git-connected hosting.

## Database and acceptance

The [retained-history package](supabase/history/README.md) has separate disabled installation and reviewed cutover steps. It is not a command to run against a hosted project without the owner's verified encrypted backup and concrete review.

The [multi-learner document](docs/MULTI-LEARNER-DESIGN.md) is a design; it does not enable account/profile switching. [Historical screenshots](docs/review/ARCHIVE.md) are retained in a verified archive.

Manual iPad Safari acceptance is one combined session after the planned updates and approved cutover. Automated emulation is recorded separately.
