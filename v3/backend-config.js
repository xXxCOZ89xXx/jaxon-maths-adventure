/* Shared validation primitives; no SDK, network calls, secrets or fixture switch. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.V51BackendConfig = api;
})(typeof window === "object" ? window : globalThis, function () {
  "use strict";
  const production = Object.freeze({
    environment: "production",
    projectName: "jaxon-maths-production",
    projectRef: "mbdelspbjusarbwlltol",
    contractVersion: 1,
  });
  function publicKey(key, ref) {
    if (typeof key !== "string" || key.length > 4096)
      throw Error("A public browser key is required");
    if (/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key) &&
        key !== "sb_publishable_fictional_test_only") return key;
    try {
      if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) throw Error();
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.role !== "anon" || payload.ref !== ref) throw Error();
      return key;
    } catch {
      throw Error("Only the project's public anon/publishable key may be used");
    }
  }
  function validate(c, expected) {
    if (!c || c.environment !== expected.environment ||
        c.projectName !== expected.projectName || c.projectRef !== expected.projectRef ||
        !/^[a-z]{20}$/.test(c.projectRef) || c.authorizedRef !== c.projectRef ||
        c.contractVersion !== expected.contractVersion ||
        c.url !== `https://${c.projectRef}.supabase.co`)
      throw Error("Explicit matching backend configuration required");
    // Whitelist output fields: never serialize arbitrary environment/config properties.
    return Object.freeze({ ...expected, authorizedRef: c.authorizedRef,
      url: c.url, anonKey: publicKey(c.anonKey, c.projectRef) });
  }
  function productionConfig(c) { return validate(c, production); }
  function verifyIdentity(c, identity) {
    if (!identity || identity.name !== c.projectName || identity.projectRef !== c.projectRef ||
        identity.contractVersion !== c.contractVersion || identity.ready !== true)
      throw Error("Production backend is not verified and ready");
  }
  function namespace(c, suffix) {
    return `jaxon_v51_${c.environment}:${c.projectRef}:${suffix}`;
  }
  function activationEpoch(identity) {
    const mode=identity?.activationMode, id=identity?.activationId;
    if (mode != null && !['fresh-start','preserve-reviewed'].includes(mode))
      throw Error('Unknown backend activation mode');
    if (id != null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      throw Error('Invalid backend activation identity');
    if (mode==='fresh-start' && !id) throw Error('Fresh-start activation identity required');
    return id || 'initial';
  }
  return { production, publicKey, validate, productionConfig, verifyIdentity, namespace, activationEpoch };
});
