# Local identity bridge update — 29 October 2026

Email-free child identities and paired-device access now work in the isolated local Supabase review, using a private canonical registry and the shared game transaction core. See [current implementation and staging gates](SINGLE-CHILD-SETUP.md). Earlier statements below that the bridge is still unimplemented describe the prior foundation checkpoint. No hosted migration/deployment or real records were used. Retention/export/deletion and wider-family privacy decisions below remain outstanding.

# Child privacy and security readiness

29 October 2026. Engineering review for **one parent and one child**, not a legal-compliance statement or a DPIA. No advertising, analytics, social features, public profiles or location tracking were introduced. No real records were inspected.

## Data inventory and purpose

| Data | Purpose and storage | Parent recovery/removal path and limit |
| --- | --- | --- |
| Parent email, password verifier, Auth identifiers | Authentication provider verifies email and recovery; browser never receives a service key | Parent uses provider password recovery. Verified export/deletion workflow and delivery support are not yet implemented; owner must approve an authenticated process |
| Child nickname and random profile ID (draft) | Minimal display identity, one unique parent relationship; private database schema | Parent can reconnect a device to the same ID. No child email, birth date, school, photo or full name is requested. Legacy profiles keep their IDs |
| Progress, typed/model drafts, diagnostic/independent evidence and dates | Existing server save plus per-origin device cache; exact resume and parent evidence | Preserve completed work and immutable requests during recovery. A four-question sample remains provisional; no formal grade. There is no new self-service learning-history deletion |
| Coins, owned items, receipts, reward and retry history | Existing authoritative ledger and idempotency/recovery | Never reset to fix sign-in or activity problems. Retention versus verified parent deletion requires explicit reviewed handling of receipts/backups |
| PIN bcrypt verifier and counters | Server-only brute-force-limited learner/parent unlock; new draft separates child PIN from parent Auth | Verified parent resets learner PIN, revoking child grants and pending codes. No PIN retrieval or disclosure |
| Pairing hash, child binding, expiry/use time | Ten-minute one-use temporary credential; no raw code at rest | Replacement/cancel/reset/revocation deletes pending codes. Used/expired residue is private; housekeeping policy below is required |
| Device and grant hashes, timestamps, revocation | Return on connected device, unlock expiry and lost-device recovery; HttpOnly/Secure cookies carry credentials | Parent revokes one device; reconnect same profile with a new code. Remote revocation cannot erase offline local copies or recover unsent lost-device changes |
| Rate buckets and counters | Server HMAC of trusted source address for setup abuse prevention; no raw IP stored by this application | Short-lived buckets. Hosting/proxy may separately log IPs; inspect provider retention, HMAC-secret rotation and access before opening to families |

No production records, private backups or credentials belong in review packages. Screenshots and examples are fictional. Temporary codes shown in interface-review screenshots are local synthetic values; never request a screenshot of a real pairing code.

## Retention and deletion decisions still required

- Decide and document progress/assessment/receipt retention and backup retention, who can request export/deletion and how parent authority is verified. Account removal must revoke credentials first, settle or preserve immutable pending work, then delete or anonymise the approved related records and address provider Auth/backups. Do not cascade-delete Auth users as an unreviewed shortcut: current foreign keys make this unsafe.
- Draft tables do not yet have a scheduled retention job. The owner must approve deletion of expired codes/grants/rate buckets and a retention period for expired/revoked device metadata. Proposed operational rule: remove expired setup credentials and expired buckets within 24 hours; keep revoked device metadata only as long as needed for parent review. No job was deployed and no TTL cleanup is claimed.
- Device-local progress is not encrypted by a PIN. Browser/device owners may inspect it. Explain private-device use, local browser deletion after successful sync, and the risk of clearing unsent work. Do not promise remote wipe.
- Recovery is an identity-controlled operation, not a save reset. Lost parent email access needs an owner-reviewed recovery/support policy; no weaker child-email or anonymous-account shortcut is supplied.

## Security controls and evidence boundaries

Local PostgreSQL verifies grants/RLS and actual code/PIN/hash/race/revocation logic with fictional claims. Existing production-backend rehearsal separately tests role isolation, cross-family/token denial, payload restrictions, grant revocation, wallet authority and idempotent saves. Browser interception checks intended UI routes, not real Auth/JWT delivery or hosted SQL state.

The inactive foundation's private tables have RLS with no anon/authenticated/service direct grants; only narrowly scoped security-definer functions, fixed empty search_path and explicit function grants access them. Parent operations require database-confirmed email, non-anonymous identity and recent password AMR. Device functions are service-only; a trusted gateway must supply a secret-HMACed remote-address bucket, validate origin/body size, and keep service credentials server-side. New-device scopes cannot use existing game RPCs until the reviewed identity bridge is implemented. No exposed foundation views exist; existing and historical schema grants must still be catalog-audited on the actual staging deployment.

Current game HTML has a restrictive script/connect CSP with a pinned backend and no eval; style inline allowance supports existing generated scenes. Meta CSP cannot supply frame-ancestors. Actual HTTPS response headers, framing protection, Referrer-Policy, HSTS, nosniff, Permissions-Policy and cache headers on authenticated responses need hosted verification. The draft gateway sets no-store/nosniff/no-referrer responses and strict cookies. No hosting settings were changed. Password managers/autocomplete and native form validation remain available for existing sign-in.

Dependency audit and a bounded source/browser-artifact secret scan are recorded with the review evidence. Such scans do not establish absence of secrets in provider settings, Git history, past logs or external systems. No credentials are printed. Auth abuse limits, email delivery and recovery, session refresh and disabled-account behaviour remain hosted gates.

## Owner questions before other families

- Who operates and supports the service, for which ages and jurisdictions? What parental notice, consent/age-assurance and DPIA review are appropriate? Identify reviewers and escalation contacts.
- What are the approved child-identity migration, backup/rollback, data export/removal, retention and account-recovery procedures? Who may execute each step?
- Which hosting/Auth providers and regions process data; what subprocessors, access logs, agreements, incident response and breach-notification process apply?
- What signup/email/recovery abuse policy and support capacity are available? How are rate-limit accessibility issues and shared network addresses handled?
- How will parents review/contest provisional estimates and progress? What accessibility and child playtesting is required on real devices before wider invitations?

Resolve these with accountable owners before offering managed family registration. A successful local build, test suite or deployment receipt is not hosted security certification.
