# V2.1 PIN experience and secure roles

**Agreed UX:** Jaxon prefers a PIN. Parent also wants a separate PIN.

## Intended interface
- On his trusted iPad, Jaxon sees a large numeric keypad and enters a **four-digit learner PIN** to unlock his learner profile.
- Parent view has a separate **six-digit parent PIN** and a clear success/error confirmation.
- Never display or store raw PINs in GitHub, Supabase public tables or browser localStorage.
- Provide an accessible keypad, deletion, lock feedback, visible focus and deliberate non-punitive error messages.
- After device/session inactivity, lock again.

## Critical security distinction
A six-digit PIN is a **convenience unlock only**, never the sole authority for reward transactions. Anyone who can inspect browser JavaScript or make HTTP requests must still be unable to award coins or redeem screen time as a learner.
- Parent and child must have **different authenticated Supabase users** with RLS-enforced roles, or an equivalently secure server-issued session.
- Parent-only bonus and redemption changes must use authenticated parent-only server RPC and be denied to the child's token.
- A parent PIN on a shared learner session **does not provide secure authorization** and must not expose parent reward APIs.
- First-time provisioning/recovery uses an adult-owned email and a strong password or secure passkey. No real parent credentials embedded in the client.
- Never store a permanent parent authentication session inside the child's accessible learner page if a guessed PIN could elevate it.
- Rate limit PIN attempts and provide adult-managed recovery if using a server-verified PIN unlock scheme.

## Work remaining before deployment
1. Provision separate Auth identities securely and map the family link.
2. Decide whether PIN is local per-device unlock after initial login or server-verified across devices. For this first phase, a **local unlock on trusted iPad after child account sign-in** is safer to implement; parent's laptop stays on separately authenticated parent session.
3. Implement PIN UI and secure verifier, keeping credentials out of client source.
4. Migrate progress with backup and verify.
5. Conduct negative authorization tests with learner token and cloud sync tests with parent token.
6. Do not merge the v2-1-fixes draft PR until all tests pass.

## Existing data
Do not reset or overwrite public.learning_progress. Supabase original family login must remain usable until migration is proven.
