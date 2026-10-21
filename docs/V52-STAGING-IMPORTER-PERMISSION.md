# Staging importer EXECUTE correction — approval proposal only

**Recommendation unchanged; execution was approved by the owner.** The owner reports the approved staging run stopped at the importer-definition guard before REVOKE. No SQL has been executed by Codex and no permission change is claimed. This is not a request for repeat approval. This proposal does not approve any V5.2 upgrade, activation, data change or publication.

## Guard stop — 22 October 2026

The committed guard digest matches both the migration body and the earlier diagnostic's embedded exact baseline: `a1d3a5958ad9c360d0fd9b2f6eab6159`. Owner/invoker checks are equivalent between the two scripts. No outdated or mistyped repository hash was found, so no guard condition is weakened or changed. The precise current live mismatch is not established by the combined P0001 message. Run only [V52-STAGING-IMPORTER-GUARD-CHECK.sql](V52-STAGING-IMPORTER-GUARD-CHECK.sql) next; it returns one metadata row separating those predicates and code digests. If needed, clear the prior aborted transaction with `ROLLBACK;` first. Do not rerun the full six-function diagnostic or the revoke blindly.

## Finding and intent

Latest owner-run diagnostic: **five PASS, one FAIL**. All six bodies are EXACT matches, and all search paths/execution attributes match. The only failure is effective `service_role` EXECUTE on the importer; PUBLIC, anon and authenticated lack it. Accept these findings: no further definition export or six-routine diagnostic is needed. The old combined fingerprint discrepancy no longer creates a source-review gate.

`supabase/v3-staging/003_import_compatibility.sql` explicitly describes an administrator-only fictional fixture importer. The setup guide documents its use by the owner in SQL Editor before the first learner read. The current staging app contains no `v3_admin_import` call. The migration revokes from PUBLIC/anon/authenticated but omits service_role. That omission permits retained/default grants; the supplied results do not prove their exact grant origin. There is no documented service-key importer workflow to preserve, and neither ordinary sign-in nor the proposed preservation upgrade needs the importer.

## Security assessment

The routine is **SECURITY INVOKER**, not SECURITY DEFINER. It gains no owner's privileges: a caller still needs underlying table privileges. A service role may already have broad table access and BYPASSRLS; the latter does not itself supply SQL table privileges. Revoke therefore reduces callable surface and enforces owner-only operational intent, rather than fixing a demonstrated anonymous privilege escalation.

The function accepts a chosen linked child plus fixture progress, balances/time and ownership, without normal learner PIN/role authorization. It can insert initial progress/wallet rows only if **both** are absent, and refuses to overwrite either existing row. It does not touch Auth accounts, family links, PINs or existing request history. This is a real integrity concern if a privileged service credential is misused against a learner with absent rows, but the incremental risk is limited by the existing service trust boundary and no-overwrite guard. There is no evidence of compromise or an ordinary-browser exploit. Current progress/wallet row coverage was not re-inventoried and is not assumed here.

The practical priority is narrow least-privilege cleanup before approval of an upgraded staging package. Revocation does not neutralise a leaked service key or remove its independent table privileges; no credential rotation, broad permission change or default-privilege alteration is justified by this finding alone.

## Exact separately approvable scope

The only persistent statement is:

```sql
REVOKE EXECUTE ON FUNCTION public.v3_admin_import(uuid,jsonb) FROM service_role RESTRICT;
```

Review [V52-STAGING-IMPORTER-REVOKE.sql](V52-STAGING-IMPORTER-REVOKE.sql). The complete proposal adds a transaction, local timeouts, staging/definition/owner/client-access guards and before/after effective-permission checks. It neither calls the importer nor changes its definition. The owner remains able to execute it. No other function, grant, role membership, default privilege, account or data changes are included. RESTRICT prevents dependent grants being cascaded away.

| Check | Before, reported | Required after |
| --- | --- | --- |
| service_role EXECUTE | true | false |
| anon / authenticated EXECUTE | false / false | false / false |
| PUBLIC EXECUTE | false | false (precondition; revoke cannot add it) |
| postgres owner EXECUTE | true, owner attribute matches | true |

Expected outputs are two metadata result sets, one before and one after; SQL Editor may display only the last. Guards enforce the relevant pre/postconditions even if only the last grid is visible. A replay after a successful correction is harmless: before may already be false. If service_role inherits access or grant dependencies/another grantor prevent removal, the postcheck or RESTRICT aborts the transaction; **stop**, do not add broader revokes or CASCADE.

A SQL error rolls back the revoke; if the editor leaves an aborted/open transaction, run only `ROLLBACK;` before any other work. After a successful commit there is no data rollback to perform. Do not automatically regrant access as a troubleshooting step; any later regrant is a separately reviewed permission decision. Do not rerun the old migration or alter default privileges to force a desired result.

## What this clears and what remains

Once separately approved, applied by the owner and verified, this closes the single known routine-access finding. It does not install V5.2 or certify hosted Auth/API configuration.

The shortest remaining route is: prepare/rehearse the in-place preservation patch and staging build using the accepted exact routine baseline → protect current staging state and review the concrete package → explicit staging-install approval and unchanged-state checks → separately approved private staging artifact update and a concise hosted smoke with the same four accounts/known PINs. This work can be prepared independently of the permission correction; approval of the revoke does not approve installation or hosting.

Keep the existing [upgrade preservation safeguards](V52-STAGING-UPGRADE-PLAN.md). No new account, PIN reset, progress reset, fresh-start activation or repeat broad inventory/security/browser suite is needed. The future package must retain owner-only importer access and verify service_role stays denied after any routine replacement.

**Minimum next owner action: run the one-row read-only guard check in staging as postgres and share its result. Original one-function revoke approval remains recorded; do not ask for it again or rerun the revoke until the mismatch is resolved.**
