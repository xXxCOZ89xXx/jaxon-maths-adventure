# Working local setup clarification — 29 October 2026

The one-parent/one-child identity bridge and real local Supabase setup are now implemented on the feature branch. See [working setup, exact staging steps and secret names](SINGLE-CHILD-SETUP.md). Real Auth/email/JWT/PostgREST checks are local, not hosted. The earlier foundation-only identity blocker below is historical; production and hosted staging remain unchanged/unverified. No release PR, merge, deployment or production migration is authorised.

---

# One-parent, one-child readiness — 29 October 2026

## Current architecture and evidence

Development starts at verified `release/ipad` **e3550ec202d30c407b1d5653f06c081eba014938**, on `codex/single-child-readiness`. The release is unchanged. Its GitHub Cloudflare Pages check reports success for that exact commit. This proves deployment, not hosted API security or the contents of database grants. No real learner/account/service requests were made.

The actual production builder is `scripts/build-v52-production.cjs`. It generates `production-dist/index.html` and bundles **v3/staging-app.js** into `production-app.js`, using the official Supabase client, pinned production configuration, identity/activation guard and cloud-sync transport. Source `v3-adventure.html` remains an offline entry and is replaced by a redirect inside the production output. `v3/production-cloud.js` and `build-v51-production-preparation.cjs` really are separate preparation-only modules, not the active live transport. Statements that the whole connected game is preparation-only are stale; earlier release holds and PR #2 status are historical. Repository source and exact deployment receipt were inspected; hosted HTML/config, SQL grants, Auth settings and API behaviour were not independently fetched or inferred from the build.

Current `v3_role()` resolves exactly one parent/child relationship, rejects mixed roles and takes no caller-selected child. In the current SQL, **child_user_id references auth.users(id)** in families, progress, wallets and transactions. Both roles authenticate an Auth account before their respective game PIN. Parent PIN is six digits; learner PIN is four. Parent/learner rewards/save permissions and immutable queues remain unchanged.

The supplied staging variables are present, mutually consistent and match the distinct historical staging project. Its host is NOT allowed by the enforced network policy; only the production Supabase host is listed. Production is not an acceptable test target. No hosted request or migration was attempted. No service credential is configured. The presence of a browser-public key is neither backend deployment authority nor fictional-account access.

## What is implemented, and what is deliberately unavailable

The proposed foundation is local/staging-only, **not a working hosted onboarding release**:

- `v3/family-setup.js`: injected official Auth registration interface using only the parent's email/password. Requires email verification before parent setup, even if a misconfigured sign-up returns a session. Ignores no verification shortcut; no child Auth signup, fake email or anonymous permanent account. Account changes invalidate pending setup responses.
- `supabase/single-child-draft/001_pairing_foundation.sql`: guarded, additive, inactive tables (requires `app.v12.foundation_reviewed=yes`, a matching staging `app.v12.target_ref`, and refuses the known production ref) and narrowly granted RPCs. Creates one nickname profile per verified non-anonymous parent, under a new child UUID. It does not insert Auth users, rewrite existing family rows or migrate progress. Existing learners cannot provision parent profiles. Existing parents cannot create a duplicate child; their approved identity bridge is pending.
- `server/pairing-gateway.cjs`: deployment-neutral HTTPS gateway contract. Parent RPCs must forward the parent's verified bearer JWT through a parent-scoped client; the database independently checks confirmed Auth email and recent password AMR. A separately supplied private service RPC client handles pairing/device credentials. Trusted source address is HMACed server-side for persistent database rate buckets; client-supplied buckets/child IDs are rejected. No request-body/credential logging, wildcard CORS or query-string credentials. Device and unlock secrets use host-only Secure/HttpOnly/SameSite=Strict cookies, never response-body/browser-storage credentials. Integration must configure a real HTTPS host and trusted reverse-proxy address handling; this library is not an already hosted endpoint.
- `dev/family-setup-review.html`: explicitly labelled in-memory fictional interface simulation. Demonstrates verification, nickname, learner PIN, one-use pairing, parent reset/revocation and saved-work help. It does **not** prove server-side security; the PostgreSQL tests do. Reload resets this simulation only. A separate link opens the real offline game on this branch. The preview does not impersonate authenticated parent access or attach fixture setup to a real learner save.
- Current connected game: discard late responses after lock/expiry/account change; plain non-sensitive form failures; keyboard-submit fallback; immediate locally-saved guidance. No change to save IDs, wallets, mastery, artwork or curriculum. New setup code is not imported and is excluded from production output.

### Mandatory integration gap / no weaker shortcut

The new child profile intentionally has no Auth email/account. Therefore its device scope cannot yet use the existing Auth-child-only `v3_request` path. `v12_device_scope` always reports **gameReady:false**, and the gateway provides no game read/save/reward endpoint. **Do not copy a child UUID into a browser request, forge an Auth JWT, insert invented auth.users rows, share a parent's session, or call service-role game writes as a shortcut.**

Before enabling hosted setup, review and implement a canonical child-identity bridge: migrate/reconcile foreign keys to an explicit child principal while preserving every existing Auth/family/save/wallet/receipt ID, and refactor the existing business transaction core to accept only server-authorised scope. Existing legacy Auth learners must continue through the unchanged path. Device revocation and scope validation must be inside the same transaction/lock boundary as every game action, including stale/delayed requests; parent-only actions must remain impossible for device scopes. The current foundation must not be applied to production as a complete migration. No partially functional registration or device login is added to the live entry point.

## Credential lifecycle and limits

| Credential/action | Foundation policy |
| --- | --- |
| Pairing code | Server pgcrypto random 128 bits (32 hex characters); SHA-256 only at rest; ten-minute expiry; one successful use; bound through profile to parent; replacement/reset/revocation cancels pending code |
| Code guesses | At most 10 attempts per 15 minutes per server-HMAC trusted address bucket, shared across requests; generic failure; distributed guessing also faces 128-bit entropy |
| Code generation | 5 per parent per 15 minutes; all parent setup calls capped at 30 per 15 minutes; parent must have a verified non-anonymous account and password AMR within five minutes (future tolerance 30 seconds) |
| Device credential | Random 256 bits; SHA-256 only at rest; expires after 30 days; independently revocable; replacement pairs to the same child, never creates a second profile |
| Learner PIN | Four digits, bcrypt cost 10; five failures per child then five-minute cooldown, independent of IP/device; reset increments generation and deletes all grants and unused codes |
| Game unlock foundation | Random 256-bit hashed grant, at most 12 hours and never beyond device expiry; validated against device revocation, profile generation and expiry; explicit lock removes it |
| Interrupted pairing | A consumed code is not reusable if its response was lost. Parent issues a new code and revokes any unidentified connection; no credential is logged or redisplayed |
| Revocation offline | Next authorised online request must fail. A remote operation cannot erase disconnected local data; keep local recovery records and unsent queues |
| Account/Auth rate limits | Existing PIN server limits were tested. Hosted sign-up/login/recovery/email limits, SMTP, CAPTCHA/abuse policy and token refresh/revocation settings remain unverified and must be configured/reviewed in staging; UI disabling is not a server rate limit |

PIN reset/revocation never clears learning, coins, purchases or unrelated devices' records. Reset revokes all existing unlocks for the same child because the PIN changed; revocation targets only the selected device and cancels unused pairing codes. Legacy Get unstuck stays a separate scoped activity reset. Lost browser credentials are recoverable through the verified parent issuing a replacement; the design does not rely on anonymous Auth recovery.

## Hosted staging enablement and acceptance gates

1. Approve the identity bridge design and complete its migration/recovery rehearsal; do not apply this foundation as a substitute.
2. Provide a separately verified staging project, allowed staging host, fictional confirmed/unconfirmed/anonymous identities in two unrelated families, and privately scoped server credentials. Current public staging variables alone are insufficient. Never use real accounts or production to fill the gap.
3. In staging only, review migration owner/grants, deploy the private gateway, configured HTTPS origin/trusted proxy, secure cookie behaviour, secret rotation, body limits and edge rate limiting. Do not put service/secret keys in browser config or archives. Validate actual project identity independently of a user-writable marker.
4. Configure parent email verification/redirects, reliable mail, password recovery, sign-up/login/recovery throttles, session lifetimes and sign-out. Use real Auth AMR/JWT validation; local claim mocks cannot establish this.
5. Direct PostgREST tests: every table/view grant and RLS; cross-family parent and learner reads/writes; wrong/mixed/unlinked roles; parent-only RPCs; revoked/expired/wrong-user tokens; race pairing/reset/revoke/save; zero duplicate credits, immutable retry compatibility. Include Auth session expiry/refresh and disabled users.
6. Two real staging devices: pair, return by PIN, lose/revoke/replace device to same profile, cold/warm offline and exact pause/resume; validate accessibility using the physical checklist below. Owner review and fresh release approval are required before any PR/merge/deployment.

## Physical iPad Safari checklist — NOT EXECUTED

- Portrait/landscape and split-screen: readable labels, safe-area spacing, no clipping at 200% text and browser zoom; VoiceOver names/order/errors, focus visible and restored on dialog close.
- Tap targets with a finger; on-screen keyboard, Enter, numeric PIN keyboard, copy/paste temporary code; reduced-motion setting and landscape after rotating mid-form.
- Verification/recovery mail same browser, expired link and wrong browser; no code/PIN in address bar, history, screenshot instructions, analytics or logs.
- Secure cookies across app close, background/foreground, expired session and cleared browser data; parent reset/revoke on a second device; private browsing/storage failure guidance.
- Pause an assessment, lesson, independent check, mission, restoration and Town plan; switch place, background/reload, resume exact draft/model; no completion/reward from pausing.
- Saved locally versus cloud-confirmed state, network interruption, offline conflict choice and no clearing unsynced work; ask parent for help safely.

Actual device testing remains outstanding. Automated Chromium touch/viewport emulation and axe scans are evidence about those tested states only, not complete assistive-technology acceptance.
