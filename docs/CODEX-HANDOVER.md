# Codex handover — V5.1 in progress

Branch `codex/v3-adventure-build`; [Draft PR #2](https://github.com/xXxCOZ89xXx/jaxon-maths-adventure/pull/2). Baseline V5 commit `2ca7639` (application `98ff388`). Latest user instructions authorise all eight V5.1 priorities and supersede the earlier Phase 1-only request.

## Current milestone

- Priorities 1–3 implemented locally: shared strict integer entry, persistent invalid drafts, Enter submission, model refresh without focus loss, direct entry in scalar missions/practice/original quests, equal-share bill/fraction/money model. Existing saved café tasks also show the model.
- Six focused desktop Chromium cases passed (16.5s): keystrokes/reload/Enter, invalid drafts, tapped correction, wrong-first evidence, pounds/pence practice, journey scalar, original quest. Broader verification pending. Baseline `npm test` passed; new numeric model suite passes.
- Priority 4 audit underway; reusable identity/profile fixtures and expanded curriculum/browser coverage (5–7) next. Priority 8 follows verification.
- Modified: `v3/{app,adventure-ui,adventure,hands-on,journey}.js`, `v3/style.css`, `tests/v5-{hands-on.cjs,interactions.spec.cjs}`. No commits/push yet.

## Architecture and constraints

Extend existing pure engines and browser renderers; preserve saved task structures, guided first-attempt evidence and independent mastery separation. Draft text lives beside validated numeric values; invalid drafts cannot submit stale values. Currency scalar inputs explicitly use integer pence; practice conversion still uses existing scales. No rewards from input focus, empty/invalid edits or no-op adjustments. Nine worlds/55 skills, eight venues, journey, wardrobe/estate, 60 minutes/week, 10 coins/active minute and 1:1 screen time remain.

Tests must use fictional local/intercepted data, deny unexpected external requests, and keep genuine sign-in/PIN security tests separate from preauthenticated fixtures. No production authentication changes, real records, migrations, merges, publication or deployment. Hosted authentication remains unverified; previous proxy 403 must not be bypassed. Physical iPad Safari/scrolling/performance and real cross-device/offline recovery remain outstanding.

## Resume

Finish shared-input audit, add test-only profiles/fixtures and expand e2e; then run `npm test`, `npm run test:staging-build`, `npm run test:security` and `V3_WEBKIT=1 npm run test:e2e`. Use one Playwright runner at a time. This environment requires network permission for localhost browser/server processes and GitHub; npm cache is `/workspace/work/npm-cache`.

References: [AGENTS](../AGENTS.md), [V5 results](V5-TEST-REPORT.md), [V5 architecture](V5-INTERACTIVE-LEARNING.md), [test isolation](V3-TEST-ISOLATION.md). Update this file with actual final results and exact next task before ending.
