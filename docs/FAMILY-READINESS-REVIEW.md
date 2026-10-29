# Family readiness and release review

This release preserves the recovered starting-profile update (`cdd0116`) and completes the owner's release-authorised follow-up. It does not add registrations, subscriptions, analytics, external services, learner accounts or database migrations.

## Changes within the current design

Base Camp gives an explicit first assessment action and explains that paused activities remain saved. The application has eight subject worlds plus Practical Maths Town: nine assessment areas in total. Town remains a separate destination, with named restoration prerequisites and a recommended next activity. Existing Cooking plans already provide a coherent home/list/bus/supermarket/payment/return/recipe journey, with snapshots and receipts; the release regression plays that journey through completion and checks interruption/resume and completed Continue routing.

The parent dashboard now shows the actual baseline response count, attempted/unknown count, provisional confidence description and date for every area. Starting estimates and independently demonstrated mastery have separate labelled sections. Missing evidence is not shown as zero ability. Four questions across two objectives are a short starting suggestion, not a school year/grade, diagnostic instrument or proof of mastery. Existing independent checks remain the source of independent mastery evidence.

Sign-in explains which existing account parents and learners use. Settings explain locking/sign-out on shared devices, the separate parent PIN, local/offline progress, reconnection before changing devices, and the current one-linked-learner limitation. Parent profile and reward controls remain behind the existing role/PIN path; no learner-mode parent dashboard or new authentication bypass is added.

A selectable girl explorer uses a new original transparent sprite in the approved explorer's pose and shared attachment canvas. Existing saves still render the original boy unless the new choice is deliberately selected. The additive `settings.avatarCharacter` stores only `boy`/`girl`; unknown values fall back to the original. Purchases, equipment, wallets and learning progress are not rewritten. The 29 active items and 11 retired item definitions remain unchanged; retired hair/face/shoe options are not reinstated. The circular profile image positions the face at the centre independently of full-body scene/wardrobe anchors.

## Focused risks and recommendations before wider family onboarding

- **One learner per linked family:** `v3_role()` currently requires exactly one matching family relationship for the authorised identity. A second child must not be added as a shortcut. Design a separately reviewed family/membership/learner-selection model, then test every read, write, offline cache, queue, reward and PIN against an explicit authorised child scope. Preserve existing Auth identities and family links.
- **Provisioning and recovery:** there is no self-service family registration or child switching in this update. Keep the owner-private access model. Before offering managed accounts to other families, define a verified parent onboarding/offboarding process, account/password recovery support and invitation ownership without sharing parent PINs.
- **Privacy and records:** the current device cache and immutable pending saves are important for recovery. Document retention, device loss, shared-device use, export/deletion and parental consent before wider rollout. Any deletion/export service or schema change needs its own design and authorisation; Get unstuck must never serve as a whole-save deletion mechanism.
- **Evidence quality:** the short baseline samples only two objectives per area. Reading demands, guessing, earlier exposure and sparse coverage limit inference. Parent review and subsequent independent checks are essential. Keep estimates provisional and avoid commercial school-grade claims.
- **Accessibility and hardware:** touch and keyboard alternatives, readable labels, no timer, safe unknown responses, scoped reset and four viewport sizes are covered by automated checks. Physical iPad Safari, actual family device recovery and child playtesting remain acceptance gaps. Do not describe emulation as hardware testing.

No production learner records or services are used in these reviews. Production release uses the existing protected PR and Git-connected Cloudflare process only; no hosting/access/backend settings are changed.
