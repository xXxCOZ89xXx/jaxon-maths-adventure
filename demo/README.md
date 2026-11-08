# Public fictional Test Camp — release-linked build

Project: `jaxons-maths-adventure-demo`
Public hostname: `https://jaxons-maths-adventure-demo.pages.dev/`
Repository: `xXxCOZ89xXx/jaxon-maths-adventure`
Production branch: protected `release/ipad`
Cloudflare build command: `node demo/release-build.cjs`
Output directory: `demo-dist` (repository root build directory).
Preview deployments: **none**. No environment variables, credentials, Functions, bindings or analytics are needed.

The separate demo Pages project is configured for these settings. Its existing published deployment remains the older `37b91fa` build. The updated money/Home demo is prepared on `codex/offline-demo-release-sync` and must first be reviewed onto `release/ipad`. No feature branch is published. No merge, manual upload or production build is triggered by the development task.

## Shared code and isolation

The builder starts from the same `v3-adventure.html` offline entry and shared Town, Home, money, education, controls, artwork and game engine modules. It does not use the staging or production entry. It excludes Supabase, auth/cloud SDKs, backend configuration, credentials, private pages, database files and real learner data. It reads no backend environment variables. The release wrapper reads only Cloudflare's non-secret `CF_PAGES_BRANCH` and refuses anything except `release/ipad`.

Demo-only build transformations change the storage namespace to `jaxon_public_demo_v1`, remove the fictional parent/developer screen, make assessment optional without fabricating results, and turn official payroll citation anchors into plain source names. There is no second curriculum, payslip calculation or Town/Home implementation. All other loaded modules copy byte-for-byte from the shared source. The ordinary source Test Camp and private game keep their existing storage and admission policy.

The output's CSP has `connect-src 'none'`, no workers, frames, forms, fonts or media requests. Only local static assets load. Every output path and hash is checked. After the first static download, gameplay has no backend. This is not a claim that assets are precached for loading a hosted site without an internet connection.

A distinct public origin separates browser storage from the private game. Progress stays in the visitor's localStorage, without email, password, PIN, Access login, session storage, cookies or learner accounts. No private game or Access configuration is changed. Parent approvals, real rewards, cloud sync and real family accounts cannot be included because the demo intentionally has no trusted backend; fictional gameplay and its local learning-coin state remain separate.

## Current Home activities

Go to **Town journeys → Outside your home**:

- **Bins and recycling:** sort the supplied materials, add bag masses, then use today's Europe/London date and an explicitly fictional Monday/fortnightly calendar to choose the bins and put-out date for the next collection. The generated date is snapshotted when the visit starts, so a saved visit does not change its answer at midnight. New visits use the current date.
- **Postbox and mail:** order the fictional address, include packaging in the weight, select the cheapest supplied service that covers that weight, and calculate change. New four-step post visits have an additive Home content marker; old saved three-step visits resume unchanged.
- **Read utility meters:** the existing meter illustration, current/previous electricity, gas and water displays, usage differences, fictional gas conversion and water bill calculations are shared unchanged.

The confirmed money work is included from the same shared modules: pounds/pence labels and parsing, 50p allocation token, verified educational 2026/27 payslip, live bank/purse/envelope balances, current-question guidance, and one-action correct/unknown progression with incorrect-answer retry. No extra money curriculum or copied wage logic is added.

## Builds, tests and automatic updates

Local QA (does not publish):

```sh
npm ci
npm run build:demo
npm run test:demo
```

`demo/dependencies.json` is an audited **path allowlist**, not a frozen source-content lock. Each build reads current shared source and regenerates SHA256 inventory and `build-info.json`; source content updates no longer need a manual hash refresh. A new dependency path still requires deliberate review. `demo/test-sync.cjs` changes shared Home code in a disposable copy and proves the rebuilt demo contains that edit, with a changed inventory hash and successful isolation checks. It also verifies that deployment builds reject feature branches and main.

`.github/workflows/public-demo.yml` checks release pushes and release PRs, including isolation, rebuild synchronization, clean-browser storage/network tests and Home/money flows. Cloudflare watches all repository paths and automatically builds new `release/ipad` commits with the demo-only build command; feature previews are disabled. GitHub CI is verification, not a deploy script. No action uploads a feature artifact.

End-to-end proof of a later **hosted** automatic rebuild must wait for an approved commit on `release/ipad`. Compare the demo deployment's Git commit and `build-info.json` with that approved release, then verify the public URL in a fresh browser. This task does not invent such a release commit or claim the new feature artifact is already live.

## One-time setup, if recreating the project

No new project is needed: the separate demo Pages project already exists and has been updated. If reconnecting it later, use Workers & Pages → `jaxons-maths-adventure-demo` → Settings → Builds & deployments, connect the repository above, set production branch `release/ipad`, command `node demo/release-build.cjs`, output `demo-dist`, root `/`, automatic production builds on, all-path watch, and previews off. Leave env vars/bindings empty and do not edit `jaxon-maths-private-git` or any Access application. The build scripts must have reached `release/ipad` through an approved PR first.

Historical `browser-verification.json` and `hosted-verification.json` describe the 7 November artifact only. Current comparison, configuration and QA results are in `release-sync-verification.json`. Physical iPad Safari is not tested; browser QA uses Chromium desktop and simulated iPad layouts.
