/* Staging-only, transport-independent durable sync. No network calls on module load. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.V3CloudSync = api;
})(typeof window === "object" ? window : globalThis, function () {
  "use strict";
  const copy = (x) => JSON.parse(JSON.stringify(x));
  function config(c) {
    if (
      !c ||
      c.environment !== "staging" ||
      c.projectName !== "jaxon-maths-v3-staging" ||
      !/^[a-z]{20}$/.test(c.projectRef) ||
      c.projectRef !== c.authorizedRef
    )
      throw Error(
        "Verified staging configuration required. Cloud is disabled.",
      );
    if (
      c.url !== `https://${c.projectRef}.supabase.co` ||
      typeof c.anonKey !== "string" ||
      c.anonKey.length < 20
    )
      throw Error("Invalid staging endpoint or public key");
    if (
      !c.anonKey.startsWith("sb_publishable_") &&
      c.anonKey.split(".").length !== 3
    )
      throw Error("Secret keys must never be used in a browser");
    if (c.anonKey.split(".").length === 3) {
      try {
        const p = JSON.parse(
          atob(c.anonKey.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        if (p.role !== "anon" || p.ref !== c.projectRef) throw Error();
      } catch {
        throw Error("Expected this staging project’s public anon key");
      }
    }
    return Object.freeze({ ...c });
  }
  function create({
    storage,
    key,
    rpc,
    id = () => crypto.randomUUID(),
    notify = () => {},
  }) {
    let doc;
    const raw = storage.getItem(key);
    try {
      doc = raw
        ? JSON.parse(raw)
        : {
            version: 1,
            revision: 0,
            pending: null,
            conflict: null,
            archives: [],
          };
      if (doc.version !== 1 || !Array.isArray(doc.archives)) throw Error();
    } catch {
      throw Error(
        "Cloud cache cannot be read. Original bytes preserved; sync disabled.",
      );
    }
    let running = null, acknowledged = null;
    // Local revision is a device write counter, not new learning content.
    const signature = value => { const p=copy(value); delete p.revision; return JSON.stringify(p); };
    function write() {
      storage.setItem(key, JSON.stringify(doc));
      notify(copy(doc));
    }
    function enqueue(progress) {
      // Keep the in-flight immutable request for idempotent retry; later edits wait behind it.
      const next=signature(progress);
      if(doc.latest && signature(doc.latest)===next)return false;
      if(!doc.pending && next===acknowledged){if(doc.latest){doc.latest=null;write();}return false;}
      doc.latest = copy(progress);
      write();
      return true;
    }
    async function flush({ oneRequest = false } = {}) {
      if (running) return running;
      running = (async () => {
        if (doc.conflict) return copy(doc);
        while (doc.pending || doc.latest) {
          if (!doc.pending) {
            doc.pending = {
              requestId: id(),
              revision: doc.revision,
              progress: doc.latest,
            };
            doc.latest = null;
            write();
          }
          const sent = copy(doc.pending),
            result = await rpc("save", sent);
          if (result.conflict) {
            doc.conflict = result;
            write();
            return copy(doc);
          }
          if (
            !Number.isInteger(result.revision) ||
            result.revision < sent.revision + 1
          )
            throw Error("Invalid server revision");
          doc.revision = result.revision;
          acknowledged = signature(sent.progress);
          doc.pending = null;
          if(doc.latest && signature(doc.latest)===acknowledged)doc.latest=null;
          write();
          if(oneRequest)break;
        }
        return copy(doc);
      })().finally(() => {
        running = null;
      });
      return running;
    }
    function seed(remote) {
      if (doc.pending || doc.latest || doc.conflict) return false;
      doc.revision = remote.revision;
      acknowledged = remote.progress ? signature(remote.progress) : null;
      write();
      return true;
    }
    function resolve(choice) {
      if (!doc.conflict || !["remote", "local"].includes(choice))
        throw Error("Choose a conflict version explicitly");
      const local = doc.latest || doc.pending?.progress,
        remote = doc.conflict;
      // Preserve both alternatives; no field-wise merger can safely combine unfinished assessments.
      doc.archives.push({
        at: new Date().toISOString(),
        local: copy(local),
        remote: copy(remote),
      });
      doc.revision = remote.revision;
      doc.pending = null;
      doc.latest = choice === "local" ? copy(local) : null;
      doc.conflict = null;
      write();
      return copy(choice === "local" ? local : remote.progress);
    }
    return { enqueue, flush, seed, resolve, snapshot: () => copy(doc) };
  }
  // Durable financial intents. Never infer acknowledgement from ownership alone.
  function createIntents({storage,key,rpc,id=()=>crypto.randomUUID(),allowed=['buy','award','redeem','confirm_offline']}) {
    let running=Promise.resolve();
    function pending(){const raw=storage.getItem(key);if(!raw)return null;let intent;try{intent=JSON.parse(raw);}catch{throw Error('Saved transaction cannot be read; original bytes preserved.');}
      if(!allowed.includes(intent.op)||!intent.payload||typeof intent.payload.requestId!=='string'||(intent.receipt&&(!intent.receipt.wallet||typeof intent.receipt.wallet!=='object')))throw Error('Saved transaction cannot be read; original bytes preserved.');return intent;}
    const serialize=fn=>{const work=running.then(fn,fn);running=work.catch(()=>{});return work;};
    const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    async function finish(intent){
      if(!intent.receipt){
        let result;
        try{result=await rpc(intent.op,copy(intent.payload));}
        catch(err){
          // Only explicit business rejection proves this operation was not applied.
          // Unlock/auth/server/transport failures must preserve a possibly committed request.
          if(err.code==='P0001'&&/^(Unknown item|Already owned|Not enough coins|Amount must be a whole number from 1 to 60|Not enough earned screen time|Not enough uncredited reported learning time)$/.test(err.message||'')){
            if(same(pending(),intent))storage.removeItem(key);
          }
          throw err;
        }
        if(!result?.wallet||typeof result.wallet!=='object')throw Error('Transaction acknowledgement unavailable; retry retained.');
        intent={...intent,receipt:copy(result)};
        storage.setItem(key,JSON.stringify(intent));
      }
      const remote=await rpc('read');
      if(!remote?.wallet||typeof remote.wallet!=='object')throw Error('Wallet refresh unavailable; retry retained.');
      if(same(pending(),intent))storage.removeItem(key);
      return remote;
    }
    function recover(){return serialize(async()=>{const intent=pending();return intent?finish(intent):null;});}
    function run(op,payload){return serialize(async()=>{
      if(!allowed.includes(op))throw Error('Transaction is not permitted for this role');
      const old=pending();
      if(old){const {requestId,...prior}=old.payload;const match=old.op===op&&same(prior,payload);const remote=await finish(old);if(match)return remote;}
      const intent={op,payload:{...copy(payload),requestId:id()}};storage.setItem(key,JSON.stringify(intent));return finish(intent);
    });}
    return {pending,recover,run};
  }
  return { config, create, createIntents };
});
