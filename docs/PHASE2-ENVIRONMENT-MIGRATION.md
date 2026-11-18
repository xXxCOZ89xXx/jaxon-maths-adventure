# Live family and fictional test environments: cutover plan

18 November 2026. H5 part two. Prepared from released `e5ea809`. This is a reviewable migration specification, not an installed database change or a claim that a second hosted project exists. No application identity guard has been relaxed and no hosted service was contacted.

## Current contract and the rename dependency

The family Pages build uses the existing V3 backend whose identity reports `jaxon-maths-v3-staging`. `cloud-sync.js` verifies `environment: staging`, that name, an explicitly authorised project reference and its public browser key. `staging-app.js` compares the server identity to that pinned configuration and requires `saveReceiptVersion: 1`. The name is internal; Phase 1 has already removed staging/test wording from family screens.

The released parent-reset wrapper in `supabase/base-camp/001_parent_game_reset.sql` also tests the **database name** to select its existing first-read account initialization. Replacing `v3_environment.name` alone changes behaviour: the wrapper could then throw `Account opening review required` for a relationship without initialized rows. The original installer and older upgrade guards also pin the old name. Do not execute a bare UPDATE or install an old function replacement over the reset/receipt wrappers.

Keep the current project, account identities, passwords, PINs, family rows, progress, revisions, wallets, receipts, reset generations, browser origin and all cache/queue/auth keys. Renaming an environment does not migrate any of these to another project. Existing save and financial request IDs remain usable.

## Intended split

| Role | Configuration | Data and access |
| --- | --- | --- |
| Live family | Proposed `environment: family`, server name `jaxon-maths-family`; existing verified project ref and current Pages origin | Existing family only; same server-enforced roles and existing authentication/access protections |
| Fictional hosted tests | `environment: staging`, `jaxon-maths-v3-staging`; a different explicitly verified project ref and public key | Dedicated synthetic parent/learner and family relationship; never copied personal records, PIN hashes or Auth users |
| Local tests/demo | Existing intercepted fixture/offline entry points | External traffic denied; no deployed configuration or real session reuse |

The new fictional project reference, public browser key, setup owner and allowed URLs are not yet supplied or provisioned. Provisioning a hosted project, creating its fictional accounts and applying any SQL are separate owner actions after review. A public key is not a service-role key; no private credential belongs in source, chat or CI.

## Coordinated implementation for review

1. Add a server-side environment kind/capability without changing the existing name or `v3_identity` fields. Update the reset wrapper's environment-specific initialization to use that explicit server-owned kind, preserving its existing branch exactly. Assert exact installed function fingerprints, owner, empty search path, grants, receipt/reset capabilities and expected project before replacing any function. Unknown definitions stop the transaction; do not weaken preflights.
2. Extend identity with a **new** explicit family capability/name while retaining the old `name` for old clients during transition. This additive state permits an old offline queue to reconnect without an identity mismatch. The identity response remains aggregate configuration only.
3. Add a separate family build configuration path with a closed mapping of environment, expected identity and authorised project. Keep the existing test builder pinned to the distinct fictional project. Reject cross-matched environment/ref/name/key combinations, secret/service keys, missing pins and a test project that equals the live family project. Do not use a wildcard or accept either server name at runtime without an explicitly configured capability.
4. Ship the compatible client through normal PR gates and the current Git-connected Pages deployment. Keep every existing auth/cache/queue namespace byte-for-byte unchanged. Reverify identity online before using the new capability; a stale offline verification marker cannot authorise a new contract.
5. Only after the complete test matrix passes and live execution is separately approved, migrate the canonical environment name. Retain the legacy identity response path or a versioned identity endpoint for old clients; do not lock out old pending requests. Keep the wrapper's explicit kind so the name change has no effect on wallet/progress initialization. Do not change provider project display settings as a substitute for this contract migration.
6. Update read-only verification and applied-script log with exact source hashes and owner-confirmed timestamps. Review all future installer guards against both intended environments; old one-shot migration scripts remain historical and must not be rerun on the renamed family project.

## Script package required before hosted approval

Prepare a one-shot transactional migration and read-only verification as a separate implementation PR after the installed definitions and fictional project are verified. It must include: pinned expected project; exact baseline function hashes and grants; separate owner review setting; short lock timeout; additive environment capability; full current reset wrapper preserved with only the reviewed predicate change; compatibility identity endpoints; no user row updates/deletes/resets; aggregate verification of names/capabilities/security only. Do not generate a runnable script from an assumed live function body.

## Local and fictional acceptance matrix

- Old/new client against old, additive and renamed backend; old exact save/purchase/reward retries; first read for a fictional relationship with and without existing progress; parent and learner paths.
- Reset generation fencing and refusal of stale writes, receipt fingerprints, same-ID/different-payload rejection, lock ordering, failure rollback, unchanged account/PIN/wallet/progress rows and private helper grants.
- Wrong project, wrong name, key from the other project, missing family capability, forged offline verification, failed identity read, unavailable test configuration: fail closed before writes.
- Fictional project proves absence of real family links and denies unexpected external browser traffic. Production credentials are never present in its CI/fixtures.
- Save/reload, long-offline V1 queue, purchase receipt recovery, parent reward retry and password/PIN screens in portrait/landscape. Physical iPad Safari still needs owner acceptance.

## Rollback

Before canonical rename, revert the client and leave additive metadata present; old clients still see their old identity. After rename, keep the compatibility identity endpoint and corrected reset wrapper. Do not revert to the old name-dependent wrapper, drop capability metadata, switch projects or overwrite family data. Any true data restore needs a separately reviewed reconciliation plan.

The immediate deliverable is this coordinated plan. Hosted cutover remains pending the verified fictional project, migration implementation and review, encrypted backup, and explicit owner execution. It is independent of the save-history redesign: neither should be bundled with the other in a single database cutover.
