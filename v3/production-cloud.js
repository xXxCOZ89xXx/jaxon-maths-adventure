/* Preparation module only. Not imported by any live, staging or offline entry point. */
(function (root, factory) {
  const api = typeof module === "object" && module.exports
    ? factory(require("./backend-config.js"), require("./cloud-sync.js"))
    : factory(root.V51BackendConfig, root.V3CloudSync);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.V51ProductionCloud = api;
})(typeof window === "object" ? window : globalThis, function (B, Sync) {
  "use strict";
  const uuid = (v) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  const object = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  function create({ config, createClient, storage, now = () => Date.now(), id }) {
    const c = B.productionConfig(config);
    let client, verified = false, identity = null, binding = null, sync = null;
    let generation = 0, loaded = false;
    function invalidate() {
      generation++; identity = null; binding = null; sync = null; loaded = false;
    }
    async function call(name, args) {
      const { data, error } = await client.rpc(name, args);
      if (error || data?.error) throw Error("Backend request refused or unavailable");
      return data;
    }
    async function initialize() {
      invalidate(); verified = false;
      if (!client) client = createClient(c.url, c.anonKey, { auth: {
        storageKey: B.namespace(c, "auth"), flowType: "pkce",
        persistSession: true, autoRefreshToken: true, detectSessionInUrl: false,
      } });
      const turn = generation;
      B.verifyIdentity(c, await call("v3_identity"));
      if (turn !== generation) throw Error("Account state changed");
      verified = true;
    }
    function ready() { if (!verified) throw Error("Verify the production backend first"); }
    async function recognize(turn) {
      const { data, error } = await client.auth.getUser();
      if (error || !uuid(data?.user?.id)) throw Error("Account sign-in required");
      const r = await call("v3_role");
      if (turn !== generation) throw Error("Account state changed");
      if (!object(r) || !["parent", "learner"].includes(r.role) ||
          r.user !== data.user.id || !uuid(r.child) || typeof r.pinSet !== "boolean" ||
          (r.role === "learner" ? r.user !== r.child : r.user === r.child))
        throw Error("A verified, unambiguous family role is required");
      identity = Object.freeze({ role: r.role, user: r.user, child: r.child, pinSet: r.pinSet });
      return { role: identity.role, pinSet: identity.pinSet };
    }
    async function signIn(email, password) {
      ready(); invalidate(); const turn = generation;
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw Error("Account sign-in failed");
      return recognize(turn);
    }
    async function resumeAccount() {
      ready(); invalidate(); return recognize(generation);
    }
    function live(b = binding) {
      ready();
      if (!b || b !== binding || now() >= b.expires) throw Error("Unlock your account to continue");
      return b;
    }
    async function request(b, op, args = {}) {
      live(b);
      const result = await call("v3_request", { p_token: b.token, p_operation: op, p_args: args });
      live(b); // Discard delayed responses after account change, lock or expiry.
      return result;
    }
    async function unlock(pin) {
      ready();
      if (!identity) throw Error("Account sign-in required");
      if (!identity.pinSet) throw Error("PIN transition/enrollment is pending review");
      if (typeof pin !== "string" || !new RegExp(identity.role === "parent" ? "^[0-9]{6}$" : "^[0-9]{4}$").test(pin))
        throw Error("PIN length does not match account role");
      const who = identity, turn = generation;
      // Immediately retire any old local unlock while a new unlock is checked.
      binding = null; sync = null; loaded = false;
      const r = await call("v3_unlock", { p_pin: pin });
      if (turn !== generation || who !== identity) throw Error("Account state changed");
      const expires = Date.parse(r?.expires);
      if (r?.user !== who.user || r?.child !== who.child || r?.role !== who.role ||
          !/^[0-9a-f]{64}$/i.test(r?.token || "") || !Number.isFinite(expires) || expires <= now())
        throw Error("Invalid account-bound unlock response");
      const b = Object.freeze({ token: r.token, expires });
      binding = b;
      if (who.role === "learner") sync = Sync.create({ storage,
        key: B.namespace(c, `${who.user}:${who.child}:sync`), id,
        rpc: (op, args) => request(b, op, args),
      });
    }
    async function read() {
      const b = live(), who = identity;
      const remote = await request(b, "read");
      if (!Number.isSafeInteger(remote?.revision) || remote.revision < 0 ||
          !object(remote.progress) || remote.role !== who.role)
        throw Error("Invalid progress response");
      if (sync) sync.seed(remote); // Existing immutable pending intent is retained.
      loaded = true;
      return remote; // Wallet data is server output only; this adapter cannot mutate it.
    }
    async function save(progress) {
      live();
      if (identity.role !== "learner" || !sync) throw Error("Learner account required");
      if (!loaded) throw Error("Read remote progress before saving");
      if (!object(progress)) throw Error("Progress must be an object");
      sync.enqueue(progress); return sync.flush();
    }
    function resolveConflict(choice) {
      live();
      if (!sync) throw Error("Learner account required");
      return sync.resolve(choice);
    }
    async function lock() {
      const old = binding;
      invalidate();
      if (old && now() < old.expires)
        await call("v3_request", { p_token: old.token, p_operation: "lock", p_args: {} });
    }
    async function signOut() {
      try { await lock(); }
      finally {
        if (client) {
          const { error } = await client.auth.signOut();
          if (error) throw Error("Account sign-out could not be confirmed");
        }
      }
    }
    async function enrollPin(pin) {
      ready();
      if (!identity) throw Error("Account sign-in required");
      const turn=generation;
      await call("v3_set_pin", {p_pin:pin}); // Server requires recent password AMR and approved transition.
      if(turn!==generation) throw Error("Account state changed");
      invalidate(); return recognize(generation);
    }
    async function transact(op,args) {
      const b=live();
      const parentOps=['award','redeem','confirm_offline'], learnerOps=['buy','active'];
      if (!(identity.role==='parent'?parentOps:learnerOps).includes(op)) throw Error("Operation not permitted for account role");
      if (!object(args)||!uuid(args.requestId)) throw Error("Persist an explicit request UUID before submitting/retrying");
      return request(b,op,args);
    }
    // Wallet authority remains server-only. No family creation or legacy fallbacks.
    return { initialize, signIn, resumeAccount, enrollPin, unlock, read, save, resolveConflict, transact, lock, signOut };
  }
  return { create };
});
