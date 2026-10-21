# Staging importer EXECUTE correction — approved scope, corrected guard

**Complete — owner verified successful execution on 22 October 2026.** Final EXECUTE: service_role=false, anon=false, authenticated=false, postgres=true. Do not rerun the correction or its diagnostics. No SQL was executed by Codex. The previous guard investigation below is historical; current work is preparation of the separately approvable [preservation staging package](V52-STAGING-PRESERVE-RELEASE.md).

## Hash discrepancy resolved — 22 October 2026

The owner-run importer-only check isolates the failure to body hashing: routine exists, postgres owns it, SECURITY INVOKER is correct, but live MD5 is `c3bbfcab24ccb1bfef6892a8af89c9d6` rather than the LF baseline `a1d3a5958ad9c360d0fd9b2f6eab6159`.

Local byte-for-byte reconstruction explains that exact value. The migration body and the six-routine diagnostic's embedded importer baseline are identical repository LF text. Replacing only its 16 LF separators with CRLF yields **exactly the reported live MD5**:

| Reviewed byte variant | Bytes | MD5 | SHA-256 |
| --- | --- | --- | --- |
| LF | 1398 | `a1d3a5958ad9c360d0fd9b2f6eab6159` | `872f848436e16972771fa07d0690077da7e187af89351e47d4f34baee36d7bf8` |
| CRLF | 1414 | `c3bbfcab24ccb1bfef6892a8af89c9d6` | `406cd4b0797de348355e5fddf2e90fe6da7ce43be34f24b948440ca0a016d928` |

The earlier `EXACT` branch uses `a.prosrc=a.body`. It is a comparison with the literal **as submitted in that particular SQL query**, not with an immutable repository-file fingerprint. If that submitted literal and the installed function both contain CRLF, EXACT is consistent with the differing LF-only hardcoded hash. The precise editor/transport that introduced CRLF is not established or needed. The earlier result is useful as query-local equality, but must not be interpreted as portable LF-byte certification.

Minimum safe live verification needs no definition export or extra diagnostic: [the corrected revoke file](V52-STAGING-IMPORTER-REVOKE.sql) now computes SHA-256 of the live UTF-8 body before REVOKE and accepts only the two independently reconstructed byte variants above. These are reference-derived fingerprints, not an arbitrary adoption of an observed live hash. A third variant, changed code/literal, trimmed body or mixed LF/CRLF text remains rejected. No whitespace/comment/token normalization is used. Every literal in this reviewed body is single-line, so the verified LF/CRLF substitution changes only separators outside literals.

Only the body-fingerprint predicate changed. The staging marker, exact signature, postgres owner, SECURITY INVOKER, ordinary-client denial, transaction/timeouts, single-function RESTRICT revoke and before/after effective-access checks are unchanged. The body guard is upgraded from MD5 to SHA-256. The owner's original one-function permission approval remains recorded; no new scope is requested and no SQL has been executed by Codex.

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

Once applied by the owner under the recorded approval and verified, this closes the single known routine-access finding. It does not install V5.2 or certify hosted Auth/API configuration.

The shortest remaining route is: prepare/rehearse the in-place preservation patch and staging build using the accepted exact routine baseline → protect current staging state and review the concrete package → explicit staging-install approval and unchanged-state checks → separately approved private staging artifact update and a concise hosted smoke with the same four accounts/known PINs. This work can be prepared independently of the permission correction; approval of the revoke does not approve installation or hosting.

Keep the existing [upgrade preservation safeguards](V52-STAGING-UPGRADE-PLAN.md). No new account, PIN reset, progress reset, fresh-start activation or repeat broad inventory/security/browser suite is needed. The future package must retain owner-only importer access and verify service_role stays denied after any routine replacement.

**No further owner action is required for this permission correction.** Next review/approval is the separate [staging preservation package](V52-STAGING-PRESERVE-RELEASE.md); no additional importer diagnostic, revoke or duplicate approval is requested.

