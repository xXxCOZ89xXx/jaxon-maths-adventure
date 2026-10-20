# V5 QA — current evidence

Implementation and screenshots are being frozen for final hosted QA. The existing private Site remains owner-only; its final V5 deployment is recorded here only after validation and deployment complete.

- Eight V5 model suites pass, including 1,107 generated steps over all routes, all tiers and three seeds; wrong/correct attempts, hints, exact migration/resumption, context separation, journey ledger and retained unsupported saves.
- All existing V2/V3/V4 logic, presentation and synthetic migration/rollback regressions pass.
- Fourteen real isolated PostgreSQL security suites pass using fictional Auth claims in a network-disabled container.
- Eighteen final V5 Chromium cases pass across desktop and both iPad orientations. A broad local run passed 110 cases but suffered one trace cleanup failure caused by concurrently running two Playwright commands against the same output directory. A clean isolated full rerun and hosted Chromium/WebKit run are pending; no all-green full result is claimed yet.
- Capture scripts produce 74 refreshed existing game views and 51 new V5 views, plus four preserved V4 references; complete gallery contains 147 images. No external requests, invalid readouts, page overflow or console/render errors were detected.
- Staging build validates the pinned reference/URL and keeps the public key redacted. Read-only live identity remains blocked by proxy CONNECT 403 before Supabase; no live authenticated result is claimed.

Current scope/coverage and remaining limitations: [V5 expansion](V5-INTERACTIVE-LEARNING.md). Existing physical iPad/cross-device/API/email-recovery gates remain in [the consolidated list](V3-OUTSTANDING-ISSUES.md). No new manual acceptance session is requested.
