# Current outstanding issues — 29 October 2026

The live release at the start of this update is `e3550ec202d30c407b1d5653f06c081eba014938`; its GitHub Cloudflare deployment result is successful. Work on `codex/single-child-readiness` is **development only: no PR, merge, deployment or remote migration**. The current model remains one parent and one child; multi-child/sibling support is excluded.

| Priority | Outstanding gate | Evidence / exact boundary |
| --- | --- | --- |
| Blocking new setup | Canonical child identity and existing-game bridge | Current saves/wallets/families reference Auth child IDs. New email-free profiles cannot safely use these RPCs. Inactive pairing foundation returns gameReady:false; no anonymous Auth, fake email or parent-session sharing. Preserve legacy IDs/records in separately reviewed bridge migration |
| Blocking hosted security acceptance | Separate staging reachability and private server setup | Public variables match historical distinct staging, but its host is not in enforced egress allowlist and no service credential is configured. No requests to production are a substitute |
| Blocking signup release | Actual Auth/email and abuse configuration | Verify parent confirmation, SMTP/redirects/recovery, signup/login/email rate limits, session expiry/refresh/disabled users, trusted gateway proxy and cookie/CORS behaviour with fictional accounts |
| Blocking new backend publication | Migration and grant review | Draft is additive/inactive, local PostgreSQL only. Required hosted tests include every exposed table/view/RPC, cross-family denial, wrong-parent/device scope, concurrent reset/revoke/save and legacy compatibility |
| Family readiness | Privacy and account operations | Approve retention, export/deletion, backup, recovery, incident/support process and notices/DPIA review. Current owner-managed account flow is not self-service commercial onboarding |
| Hardware acceptance | Physical iPad Safari and VoiceOver | Chromium touch/viewport and axe checks are not physical tests. Checklist in SINGLE-CHILD-READINESS.md |
| Existing recovery limit | Offline local data and true multi-device behaviour | No cold-offline service worker or remote wipe. Preserve unsent queues. Hosted CAS/reconnect/recovery needs two fictional staging devices |
| Existing evidence limit | Client-observed activity and short diagnostic | Server clock/role/idempotency caps are tested, not proof a child learned. Four responses per area are provisional, not grade/mastery; only independent evidence has independent meaning |
| Headers and operations | Actual hosted headers, secrets and monitoring | Build CSP audited; meta cannot enforce frame-ancestors. Hosting header/log/secret/retention settings remain unverified and unchanged |

The owner previously reported staging sign-in/PIN/lock/save/reward/shop and visible family separation. That remains owner-reported historical evidence, not fresh agent-run direct PostgREST enforcement. Tests in this update use fictional claims/records and intercepted browser responses only. Earlier versions of this document (in Git history) describe superseded PR #2 and preparation-only release holds; those are not the present deployment architecture.

See [current implementation and exact setup requirements](SINGLE-CHILD-READINESS.md), [child privacy/security checklist](CHILD-PRIVACY-SECURITY-READINESS.md) and the current review gallery for executed checks. Owner review and a new release approval are required before publishing this update.
