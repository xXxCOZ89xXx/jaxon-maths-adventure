# Main history installation: preservation review

20 November 2026. Prepared for review. **Only read-only live catalogue/aggregate queries have run. No live installation, activation, merge or game/demo deployment has been performed.** Installation and activation remain separate owner decisions.

## Scope and recovered checkpoint

The current application-data recovery checkpoint remains accepted. The owner supplied the Main aggregate activity result: latest progress and transaction writes `2026-11-15T20:24:51.624774Z`, latest wallet activity `2026-10-28T11:39:25.933273Z`, reset timestamp null. The owner also confirmed no later login/PIN changes and that all devices finished saving. These times precede the owner-reported 19 November protected backup. The matching result was observed in the existing Supabase SQL editor. This does not establish a transaction snapshot from an archive filename or certify full managed-service recovery. Do not repeat the completed restore or activity query merely to resume.

The previously recorded installed routine comparison is source evidence, not permission to skip current guards. The new package checks the actual installed functions again in its transaction. It accepts only exact reviewed source bodies with LF or Windows CRLF endings, and exact argument names/defaults, language, return type, volatility, security, owner/search-path and effective EXECUTE permissions. No real function bodies are returned or copied into the repository.

## What the guarded package adds

- Binds the target to Main `sfogrvedypgtxfvecmbx`, the postgres operator, six reviewed existing routines and an absent-history state. The source baseline comes from pristine repository SQL rehearsed with fictional data; its digest and each input SQL digest are fixed by the packager.
- Refuses table **or column** privileges for anonymous/authenticated browser roles, including inherited access and PostgreSQL 17's MAINTAIN privilege. Separately verifies the observed existing server-role contract: all seven legacy table privileges on the original eight core tables, none on the two reset/request tables. Existing service privileges are preserved, not newly granted. Checks RLS, existing reset compatibility and the new helpers' private grants.
- Refuses a changed activity checkpoint. A newer play/write needs preservation review, not altered expected dates to force a pass.
- Uses one bounded transaction, a maintenance advisory lock and SHARE locks that prevent concurrent writes to each protected table while it is compared. A busy writer results in a three-second lock timeout and rollback. This is a short maintenance operation; save and close devices before the approved run.
- Verifies that the actual operator can read and acquire SHARE locks on every protected table, and that row security will not filter the fingerprint input. Missing managed-Auth permissions stop the package; it does not grant itself access or turn off RLS. PostgreSQL's [LOCK permissions](https://www.postgresql.org/docs/17/sql-lock.html) require more than SELECT for SHARE locks.
- Fingerprints every pre-existing ordinary/partitioned table in `public` and `v52_staging_private`, plus `auth.users` and `auth.identities`. Unknown columns, duplicate rows, pending-request bytes, PIN/unlock records, wallets, receipts and reset generations participate. Also compares each original table's owner, table/column ACLs and RLS flags before/after. Fingerprints remain in transaction-local temporary tables and are dropped at commit. Only aggregate flags are returned.
- Executes the exact existing `001_retained_history.sql`, unchanged apart from embedding it inside the guarded outer transaction. A changed input hash is refused. The final comparison rolls back all transactional DDL and data if any original row differs, a routine/grant mismatches, or the expected disabled/empty state is absent.
- Leaves capability 1, history disabled, writes disabled and no recorded client release. Activation is not included. Existing request and identity implementations remain under their private compatibility names.

The source SQL and package do not update Auth identities, PINs, family relationships or existing gameplay rows; they do not rename the environment, change hosted configuration, read Vault secrets or move Storage objects. Row checks do not certify every aspect of managed Auth/service recovery or replace a release permission review.

Live read-only review on 20 November identified the original fixture's missing Supabase service-role defaults. Main PostgreSQL 17.11 has no browser-role table/column access, but its existing server role has all seven checked privileges on eight original tables and EXECUTE on identity/role/PIN/unlock routines. Request/reset delegates remain restricted as expected. The fixture now models those observed defaults before applying pristine SQL. The revised guard binds that exact profile and preserves original table ACLs; it does not revoke working service access or weaken browser isolation. This is an observed catalogue contract, not an assertion about where service credentials are stored.

## Files and review sequence

Generate into a **new** directory:

```sh
node scripts/prepare-main-history-preservation.cjs --out /a/new/review-directory
```

The output contains `READ-ONLY-MAIN-SAFEGUARDS.sql`, `INSTALL-MAIN-HISTORY.sql` and a SHA-256 manifest. The checked-in source baseline is `supabase/history/main-review/SOURCE-BASELINE.json`. The packager makes no database or network connection and refuses an existing output directory.

1. Run only the complete **READ ONLY** safeguards file in Main. It returns project identity and five aggregate flags; it makes no installation, grant or application-data change. A mismatch stops for review, without requesting learner rows or function bodies. This extends the earlier inventory with column privileges and exact source-body/metadata contracts.
2. Review this document, generated file hashes, current safeguards result, preservation/locking evidence and the operational limits below. Keep both protected backup copies and private PASS report. Do not upload or decrypt them for development QA.
3. Obtain explicit approval for the exact **disabled installation**. Only then, in the intended SQL-editor session, set `app.main_history_install_approved='yes'` and run the complete matching installation file. Do not set that flag during development or infer it from a read-only check. This flag is an operator acknowledgement, not a substitute for database authorisation.
4. Accept installation only when the **whole transaction including COMMIT** succeeds with no errors. The aggregate row is labelled `transactionChecksPassed`; it is not a standalone success receipt to reuse after a failure. On an error, leave the game closed, retain the stopped-stage message and inspect; do not rerun a partially edited file.
5. Inspect the actual disabled installation and grants. Separately review and approve activation against the exact verified deployed compatible client, V1 retries, two-device behaviour, role/PIN boundaries and write-error recovery. Never enable capability 2 as part of installation or use an arbitrary 40-character branch SHA as deployment proof.

## Operational recovery assessment

For this installation, the recovery route is transactional failure rollback before commit, with all protected row fingerprints compared under locks. A successful installation stays disabled and continues the existing V1 save path through its preserved private delegate. The tested exact old request returns its original acknowledgement. Do not delete receipts, change identities, clear devices, drop functions or restore an old dump to undo a disabled additive installation without a separate reviewed repair.

After any later approved V2 activation, an emergency **write pause** must keep history enabled/readable and preserve the compatible backend. Do not drop history, restore old function bodies or overwrite later play with the pre-cutover dump. Later live migrations require protection that includes any newly written history. This package does not provide a general-purpose rollback command.

Vault/Storage state, other managed Auth tables, provider configuration/roles and a complete Supabase service restore remain unverified. No claim is made that Vault is empty, Storage unused or free-plan provider restoration exists. The reviewed source does not access those stores, and this disabled public-schema package does not change their state or configuration. Their full operational recovery remains an explicit commercial-launch gate. A failure outside PostgreSQL transactional guarantees or a broader service outage is outside this narrow rehearsal. Any later change that touches those services needs its own protection/recovery review.

## Verification and limits

`npm run test:main-history-preservation` uses pinned PGlite 0.4.6 / PostgreSQL 17.5 entirely in memory, without a network listener. It covers source/baseline tampering, wrong project, missing approval, read-only write refusal, direct/inherited column leaks, changed routine bodies/metadata/grants, newer activity, corruption of application/Auth/unknown private rows, late rollback, CRLF compatibility, disabled install, old receipts, a greater-than-2-MB V2 roundtrip, sibling isolation and readable history during a write pause. Test activation uses only fictional state and does not grant live activation permission.

`node tests/main-history-native.cjs` additionally runs actual PostgreSQL 17 in Docker with `--network none`. It verifies the native source contracts and rollback, a conflicting writer in a separate session causing bounded lock-timeout rollback, disabled installation and the old save acknowledgement. It never accepts a remote host or credentials. Native CI evidence is required before proposing the live installation; PGlite alone is not multi-session lock certification.

The existing `npm test` and combined `save-and-recovery` release checks remain required. Browser emulation is separate from the single grouped physical iPad acceptance near launch. Passing this package does not finish Phase 1's independently deployed API/isolation/email recovery, operator MFA/IP decisions or later launch gates.

## Main installation completed

On 20 November 2026 the owner explicitly approved the disabled-only installation.
The exact safeguards passed through the connected Supabase account. Main applied
package SHA-256 `7cbb3c603e8ff08b7f9d1f34b182a8b11dc06c2d44b72bce17de84ece9509668`
as migration `20261120183217_install_retained_history_disabled_7f1b0ba`.
The transaction enforces original-data/ACL preservation. A separate read-only
postcheck verified exact installed contracts/grants, both history stores empty,
client release unset, history/writes disabled and storage version 1.
The earlier “prepared” statements above describe the pre-install review, not the
current installed state. No activation or game/demo source release occurred.
See [separate activation review](MAIN-HISTORY-ACTIVATION.md).
