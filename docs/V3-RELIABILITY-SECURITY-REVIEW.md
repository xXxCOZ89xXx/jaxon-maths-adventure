# Current architecture clarification — 29 October 2026

The current live merge is `e3550ec202d30c407b1d5653f06c081eba014938`. The production builder bundles `v3/staging-app.js`; only the separate `production-cloud.js` module is preparation-only. Deployment success is verified through GitHub, not hosted API/grant/Auth acceptance. New one-parent/one-child setup is an inactive local/staging foundation; no production migration or setup enablement is authorised in this update. See [current architecture, integration blockers and tests](SINGLE-CHILD-READINESS.md) and [child privacy/security review](CHILD-PRIVACY-SECURITY-READINESS.md). Current credentials identify the separate staging project, but its host is excluded by this session's enforced network policy. No real learner/service calls were made.

The dated material below is historical evidence. Earlier PR/release holds, staging URLs, provider setup and reported results must not be treated as freshly verified configuration or a present release decision.

---

# V3 reliability and security review — 20 October 2026

Review of the current client, sync adapter, staging SQL and fixture tests. No real passwords/PINs, real learner records, staging account mutations or production requests were used. Owner-reported hosted successes and unverified live boundaries are separated in `V3-OUTSTANDING-ISSUES.md`.

## Findings fixed in this iteration

- Parent available coins exposed fractional binary/server precision. `V3Presentation.coins` formats every learner/parent coin display to at most two decimal places; wallet arithmetic and authority remain exact. Removed the client's earlier truncation of the loaded wallet. Independent screen-time labels now distinguish reported learning, credited available time and redemption. Dates fail safely when old evidence has an invalid timestamp.
- Generic keyboard/pointer activity and screen entry previously renewed the learning clock. Only changed maths controls/answers/support can renew a maximum 20-second eligibility window. No-op controls cannot renew it. A fresh page begins ineligible. Hidden/focus/solved/lesson states and queued-lock acquisition are checked before credit. Time/coin rates and server clock caps are preserved.
- Parent rewards previously opened with bonus-award and amount defaults. New requests require deliberate action and amount. A transport-interrupted persisted parent intent is restored read-only and retries the same request ID/contents; malformed intent bytes are preserved and actions fail closed. Reload cannot create an extra award.
- Password recovery errors hid 429 throttling. A non-sensitive rate-limit explanation now says to wait and that staging email delivery awaits external configuration. That button disables after 429; there are no automatic retries, SMTP writes or live recovery requests in QA.
- Original artwork had generic glyph/emoji equipment. Original SVG gear, companions, coloured guide portraits and stable labelled task/venue controls replace it. Browser console checks caught and corrected an invalid generated pine path; restored camp decoration accessible titles remain intact.

## Boundaries inspected and exercised

The SQL resolves parent/learner roles from one unambiguous `maths_families` relationship, never editable metadata. All eight tables enable RLS and have no direct anon/authenticated grants. Authenticated PIN enrollment requires recent password AMR; four-/six-digit roles, bcrypt, persistent attempt counters, cooldown, hashed random unlock capability, Auth-user binding, generation and expiry are checked server-side. Lock/reset revoke unlocks. These claims are exercised with actual PostgreSQL/pgcrypto and fictional signed-claim context; real Auth AMR/PostgREST still requires hosted acceptance.

Every progress/wallet RPC checks the unlock. Parents can award/redeem/review offline time, learners can save/buy/submit capped activity, and neither can select another child. A per-learner wallet row lock serializes ledger mutations and CAS saves; request IDs bind operation and complete payload. Catalogue authority stays server-side. Parent dashboard values and cosmetic ownership never authorize writes. Save-response loss, concurrent saves, stale revisions, duplicate purchases/awards, delayed clock updates, importer overwrite refusal and family/role denials have dedicated tests.

The sync adapter persists immutable pending requests, keeps later edits queued, and presents complete-version conflicts rather than merging independent assessment answers. Both copies are archived locally before choosing. Browser storage failures retain existing bytes and fail visibly. Single-tab Web Locks protect local queues; separate devices use server CAS. Cold-offline access and clearing device storage are explicitly not recovery guarantees.

Staging configuration requires explicit ref/URL/key agreement and verifies `v3_identity` before sign-in, with no production fallback. Offline Test Camp keeps `connect-src 'none'`. Browser tests block all nonlocal or unexpected traffic. The staging builder rejects known live-page refs and secret keys. Mock preparation uses a different output directory and cannot replace deployable files. The private Site remains owner-only; the screenshot gallery contains synthetic states only.

## Unresolved limits and release conditions

No critical unauthenticated privilege escalation was found in this code review or isolated tests. This does not certify real hosted API access or rule out undiscovered vulnerabilities. Server clock-capped activity is still client-reported, not proof of genuine learning; private device cache is not encrypted; account recovery delivery is externally deferred; multiple-child parents are unsupported. The remaining live/device checks, honest evidence limits and future production gates are listed once in `V3-OUTSTANDING-ISSUES.md`. Do not represent intercepted APIs or simulated signed claims as successful live Supabase tests.
