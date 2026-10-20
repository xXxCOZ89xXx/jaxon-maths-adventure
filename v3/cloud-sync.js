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
    let running = null;
    function write() {
      storage.setItem(key, JSON.stringify(doc));
      notify(copy(doc));
    }
    function enqueue(progress) {
      // Keep the in-flight immutable request for idempotent retry; later edits wait behind it.
      doc.latest = copy(progress);
      write();
    }
    async function flush() {
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
          doc.pending = null;
          write();
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
  return { config, create };
});
