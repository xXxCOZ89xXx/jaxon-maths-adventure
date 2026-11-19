/* Explicit synthetic-project contract. No SDK, storage, network or live fallback. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ESASyntheticEnvironment = api;
})(typeof window === "object" ? window : globalThis, function () {
  "use strict";
  const forbiddenRefs = Object.freeze([
    "sfogrvedypgtxfvecmbx",
    "mbdelspbjusarbwlltol",
  ]);
  const prefixes = Object.freeze({
    "jaxon_v3_staging_auth:": "esa_synthetic_auth:",
    "jaxon_v3_staging:": "esa_synthetic_game:",
    "v3-unlock:": "esa-synthetic-unlock:",
    "v3-last-remote:": "esa-synthetic-remote:",
    "v3-history:": "esa-synthetic-history:",
    "v3-intent:": "esa-synthetic-intent:",
    "v3-verified:": "esa-synthetic-verified:",
    "v3-verified-receipts:": "esa-synthetic-receipts:",
    "v3-verified-history:": "esa-synthetic-history-verified:",
  });
  function publicKey(key, ref) {
    if (typeof key !== "string" || key.length > 4096)
      throw Error("Synthetic project public browser key required");
    if (
      /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key) &&
      key !== "sb_publishable_fictional_test_only"
    )
      return key;
    try {
      if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key))
        throw Error();
      const claims = JSON.parse(
        atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (claims.role !== "anon" || claims.ref !== ref) throw Error();
      return key;
    } catch {
      throw Error(
        "Expected this synthetic project's public anon/publishable key",
      );
    }
  }
  function config(input) {
    if (
      !input ||
      input.environment !== "synthetic-test" ||
      input.projectName !== "jaxon-maths-v3-staging" ||
      !/^[a-z]{20}$/.test(input.projectRef) ||
      forbiddenRefs.includes(input.projectRef) ||
      input.authorizedRef !== input.projectRef ||
      input.url !== `https://${input.projectRef}.supabase.co`
    )
      throw Error(
        "Explicit separate synthetic project required; live targets are forbidden",
      );
    return Object.freeze({
      environment: "synthetic-test",
      projectName: "jaxon-maths-v3-staging",
      projectRef: input.projectRef,
      authorizedRef: input.authorizedRef,
      url: input.url,
      anonKey: publicKey(input.anonKey, input.projectRef),
    });
  }
  function verifyIdentity(input, identity) {
    const c = config(input);
    if (
      !identity ||
      identity.name !== c.projectName ||
      identity.projectRef !== c.projectRef ||
      identity.environmentKind !== "synthetic-test" ||
      identity.syntheticOnly !== true ||
      identity.syntheticContractVersion !== 1 ||
      identity.saveReceiptVersion !== 1
    )
      throw Error(
        "Synthetic server identity/capability mismatch; sign-in disabled",
      );
  }
  return { config, verifyIdentity, forbiddenRefs, prefixes };
});
