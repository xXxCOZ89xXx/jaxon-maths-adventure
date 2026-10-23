const assert = require("node:assert/strict");
const { create, config } = require("../v3/cloud-sync.js");
const store = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) || null, setItem: (k, v) => m.set(k, v) };
};
const cfg = {
  environment: "staging",
  projectName: "jaxon-maths-v3-staging",
  projectRef: "abcdefghijklmnopqrst",
  authorizedRef: "abcdefghijklmnopqrst",
  url: "https://abcdefghijklmnopqrst.supabase.co",
  anonKey: "sb_publishable_fictional_test_only",
};
let suites = 0;
async function test(name, fn) {
  await fn();
  console.log("PASS", name);
  suites++;
}
(async () => {
  await test("configuration fails closed without an explicitly pinned staging identity", () => {
    assert.equal(config(cfg).projectRef, cfg.projectRef);
    for (const c of [
      null,
      {},
      { ...cfg, environment: "production" },
      { ...cfg, authorizedRef: "other" },
      { ...cfg, url: "https://other.supabase.co" },
      { ...cfg, anonKey: "sb_secret_do_not_publish" },
    ])
      assert.throws(() => config(c));
  });
  await test("lost response retries exact immutable save and retains later edits", async () => {
    const storage = store();
    let server = { revision: 0, progress: {} },
      lost = true,
      ids = new Map(),
      calls = [];
    const rpc = async (op, args) => {
      calls.push(JSON.parse(JSON.stringify(args)));
      if (ids.has(args.requestId)) return ids.get(args.requestId);
      server = { revision: server.revision + 1, progress: args.progress };
      const r = { revision: server.revision };
      ids.set(args.requestId, r);
      if (lost) {
        lost = false;
        throw Error("response lost");
      }
      return r;
    };
    let seq = 0;
    let sync = create({ storage, key: "fake", rpc, id: () => String(++seq) });
    sync.enqueue({ quest: { i: 1, assisted: true }, coins: 123 });
    await assert.rejects(sync.flush());
    sync.enqueue({ quest: { i: 2, assisted: true }, coins: 123 });
    sync = create({ storage, key: "fake", rpc, id: () => String(++seq) });
    await sync.flush();
    assert.equal(server.revision, 2);
    assert.deepEqual(calls[0], calls[1]);
    assert.equal(server.progress.quest.i, 2);
    assert.equal(sync.snapshot().pending, null);
  });
  await test("cross-device CAS conflict preserves complete local and remote learning evidence", async () => {
    const storage = store();
    let server = { revision: 0, progress: {} };
    let id = 0;
    const rpc = async (_, a) => {
      if (a.revision !== server.revision) return { ...server, conflict: true };
      server = { revision: server.revision + 1, progress: a.progress };
      return { revision: server.revision };
    };
    const a = create({ storage, key: "a", rpc, id: () => String(++id) }),
      b = create({ storage, key: "b", rpc, id: () => String(++id) });
    a.enqueue({ checks: { x: { stage: 1 } }, quest: { i: 1 } });
    b.enqueue({ checks: { x: { stage: 0, reteach: true } }, quest: { i: 2 } });
    await a.flush();
    await b.flush();
    assert.ok(b.snapshot().conflict);
    assert.equal(server.progress.quest.i, 1);
    const local = b.resolve("local");
    assert.equal(local.quest.i, 2);
    await b.flush();
    assert.equal(server.progress.checks.x.reteach, true);
    assert.equal(b.snapshot().archives.length, 1);
    assert.equal(b.snapshot().archives[0].remote.progress.quest.i, 1);
    a.enqueue({ quest: { i: 0 } });
    await a.flush();
    assert.ok(a.snapshot().conflict);
    assert.equal(a.resolve("remote").quest.i, 2);
  });
  await test("parallel flush calls share one request and corrupt caches remain untouched", async () => {
    const storage = store();
    let n = 0;
    const s = create({
      storage,
      key: "x",
      rpc: async () => {
        n++;
        await new Promise((r) => setTimeout(r, 10));
        return { revision: 1 };
      },
    });
    s.enqueue({ quest: { i: 2, selected: [1, 3] } });
    await Promise.all([s.flush(), s.flush(), s.flush()]);
    assert.equal(n, 1);
    storage.setItem("bad", "{invalid");
    assert.throws(() => create({ storage, key: "bad", rpc: () => {} }));
    assert.equal(storage.getItem("bad"), "{invalid");
  });
  console.log(
    `${suites} cloud sync suites passed (synthetic transport, no backend connection).`,
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
