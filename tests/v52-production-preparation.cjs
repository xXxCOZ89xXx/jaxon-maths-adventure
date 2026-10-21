// Fast, SDK-injected contract tests; no Supabase SDK import or network connection.
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os');
const path = require('node:path'), vm = require('node:vm');
const B = require('../v3/backend-config.js'), P = require('../v3/production-cloud.js');
const { configuration, build } = require('../scripts/build-v51-production-preparation.cjs');
const base = { ...B.production, authorizedRef: B.production.projectRef,
  url: `https://${B.production.projectRef}.supabase.co`,
  anonKey: 'sb_publishable_' + 'a'.repeat(24) };
const ids = { learner: '11111111-1111-4111-8111-111111111111',
  parent: '22222222-2222-4222-8222-222222222222', child: '11111111-1111-4111-8111-111111111111' };
const memory = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k,v) => m.set(k,v) }; };
const clone = x => JSON.parse(JSON.stringify(x));
function fake({ storage = memory(), role = 'learner', ready = true, pinSet = true } = {}) {
  let ms = Date.parse('2026-10-21T00:00:00Z'), seq = 0, revision = 0, progress = {}, lost = false;
  let late = null, startLate = null;
  const log = [], responses = new Map();
  const user = () => ids[role];
  const family = () => ({ role, user: user(), child: ids.child, pinSet });
  const sdk = { auth: {
    signInWithPassword: async () => ({ error: null }),
    getUser: async () => ({ data: { user: { id: user() } } }),
    signOut: async () => ({ error: null }),
  }, rpc: async (name, args) => {
    log.push({ name, args: clone(args ?? {}) });
    if (name === 'v3_identity') return { data: { name: base.projectName,
      projectRef: base.projectRef, contractVersion: 1, ready } };
    if (name === 'v3_role') return { data: family() };
    if (name === 'v3_set_pin') { pinSet=true; return {data:{ok:true}}; }
    if (name === 'v3_unlock') return { data: { ...family(), token: 'a'.repeat(64),
      expires: new Date(ms + 60000).toISOString() } };
    if (args.p_operation === 'read') {
      if (late) { startLate(); await late; }
      return { data: { role, revision, progress: clone(progress), wallet: { coins: 0 } } };
    }
    if (args.p_operation === 'lock') return { data: { ok: true } };
    assert.equal(args.p_operation, 'save');
    const a = args.p_args;
    if (responses.has(a.requestId)) return { data: responses.get(a.requestId) };
    if (a.revision !== revision) return { data: { conflict: true, revision, progress: clone(progress) } };
    progress = clone(a.progress); revision++;
    const data = { revision }; responses.set(a.requestId, data);
    if (lost) { lost = false; throw Error('fictional lost response'); }
    return { data };
  } };
  let calls = 0, options;
  const adapter = P.create({ config: base, storage, now: () => ms, id: () => `request-${++seq}`,
    createClient: (url, key, o) => { calls++; options = o; return sdk; } });
  return { adapter, sdk, log, storage, calls: () => calls, options: () => options,
    expire: () => { ms += 61000; }, lose: () => { lost = true; },
    change: value => { progress = value; revision++; },
    delayRead: () => {
      let release; late = new Promise(r => { release = r; });
      const started = new Promise(r => { startLate = r; }); return { release, started };
    },
    connect: async () => { await adapter.initialize(); await adapter.signIn('fictional', 'not-a-credential');
      await adapter.unlock(role === 'parent' ? '123456' : '1234'); },
  };
}
let suites = 0;
async function test(label, f) { await f(); suites++; console.log('PASS', label); }
(async () => {
  await test('pinned public configuration rejects staging, secret keys, unknown fields and mismatched JWTs', () => {
    assert.equal(B.productionConfig({ ...base, secret: 'do-not-serialize' }).secret, undefined);
    const jwt = payload => ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'sig'].join('.');
    assert.ok(B.productionConfig({ ...base, anonKey: jwt({ role: 'anon', ref: base.projectRef }) }));
    for (const config of [null, {}, { ...base, environment: 'staging' }, { ...base, projectRef: 'sfogrvedypgtxfvecmbx' },
      { ...base, authorizedRef: 'abcdefghijklmnopqrst' }, { ...base, url: base.url + '/other' },
      { ...base, anonKey: 'sb_secret_' + 'a'.repeat(30) },
      { ...base, anonKey: jwt({ role: 'service_role', ref: base.projectRef }) },
      { ...base, anonKey: jwt({ role: 'anon', ref: 'abcdefghijklmnopqrst' }) },
      { ...base, anonKey: 'sb_publishable_fictional_test_only' }]) assert.throws(() => B.productionConfig(config));
    assert.throws(() => configuration({}));
    assert.throws(() => require('../v3/cloud-sync.js').config(base), /staging/);
  });
  await test('construction is inert; backend identity/readiness must precede normal Auth', async () => {
    const f = fake({ ready: false }); assert.equal(f.calls(), 0); assert.equal(f.log.length, 0);
    await assert.rejects(f.adapter.signIn('x', 'y'), /Verify/);
    await assert.rejects(f.adapter.initialize(), /not verified/);
    await assert.rejects(f.adapter.resumeAccount(), /Verify/);
    assert.deepEqual(f.log.map(x => x.name), ['v3_identity']);
    assert.ok(f.options().auth.storageKey.startsWith('jaxon_v51_production:'));
    for (const value of [null, { name: base.projectName, projectRef: base.projectRef, ready: true },
      { name: base.projectName, projectRef: 'sfogrvedypgtxfvecmbx', contractVersion: 1, ready: true }])
      assert.throws(() => B.verifyIdentity(base, value));
  });
  await test('PIN enrollment is never automatic; role identity comes only from server and Auth user', async () => {
    const f = fake({ pinSet: false }); await f.adapter.initialize(); await f.adapter.resumeAccount();
    await assert.rejects(f.adapter.unlock('1234'), /pending review/);
    assert.equal(f.adapter.setPin, undefined); assert.equal(f.adapter.award, undefined);
    assert.ok(!f.log.some(x => x.name === 'v3_set_pin'));
    f.sdk.auth.getUser = async () => ({ data: { user: { id: ids.parent } } });
    await assert.rejects(f.adapter.resumeAccount(), /unambiguous/);
    await assert.rejects(f.adapter.unlock('1234'), /sign-in/);
  });
  await test('explicit enrollment rechecks identity, and wallet transport requires role and persisted request UUID', async () => {
    const f=fake({pinSet:false});await f.adapter.initialize();await f.adapter.signIn('fictional','fictional');
    assert.equal((await f.adapter.enrollPin('1234')).pinSet,true);await f.adapter.unlock('1234');
    await assert.rejects(f.adapter.transact('award',{requestId:ids.parent,amount:1}),/not permitted/);
    await assert.rejects(f.adapter.transact('buy',{item:'cap'}),/explicit request UUID/);
    const original=f.sdk.rpc;
    f.sdk.rpc=async(name,args)=>args?.p_operation==='buy'?{data:{wallet:{coins:1}}}:original(name,args);
    assert.equal((await f.adapter.transact('buy',{requestId:ids.parent,item:'cap'})).wallet.coins,1);
  });
  await test('learner unlock/read/save uses revisioned RPC and retains drafts on response loss', async () => {
    const f = fake(); await f.connect();
    await assert.rejects(f.adapter.save({}), /Read remote/);
    await f.adapter.read(); f.lose();
    await assert.rejects(f.adapter.save({ quest: { amountDraft: '' } }), /lost response/);
    await f.adapter.save({ quest: { amountDraft: '4.00' } });
    const writes = f.log.filter(x => x.args.p_operation === 'save');
    assert.deepEqual(writes[0].args, writes[1].args);
    assert.equal((await f.adapter.read()).progress.quest.amountDraft, '4.00');
    assert.ok(!f.log.some(x => x.name.includes('parent_award')));
    assert.ok([...f.storage.getItem(B.namespace(base, `${ids.learner}:${ids.child}:sync`))].length > 0);
  });
  await test('parent save denied; expired unlocks and delayed locked responses fail closed', async () => {
    const parent = fake({ role: 'parent' }); await parent.connect(); await parent.adapter.read();
    await assert.rejects(parent.adapter.save({}), /Learner/);
    assert.ok(!parent.log.some(x => x.args.p_operation === 'save'));
    parent.expire(); await assert.rejects(parent.adapter.read(), /Unlock/);
    const f = fake(); await f.connect(); const wait = f.delayRead();
    const pending = assert.rejects(f.adapter.read(), /Unlock/); await wait.started;
    await f.adapter.lock(); wait.release(); await pending;
    await assert.rejects(f.adapter.save({}), /Unlock/);
  });
  await test('malformed/cross-account unlocks, role mismatches and wrong PIN lengths are rejected', async () => {
    const f = fake(); await f.adapter.initialize(); await f.adapter.resumeAccount();
    await assert.rejects(f.adapter.unlock('123456'), /length/);
    await assert.rejects(f.adapter.unlock(1234), /length/);
    const original = f.sdk.rpc;
    f.sdk.rpc = async (name, args) => name === 'v3_unlock'
      ? { data: { user: ids.parent, child: ids.child, role: 'learner', token: 'a'.repeat(64),
        expires: '2099-01-01T00:00:00Z' } } : original(name, args);
    await assert.rejects(f.adapter.unlock('1234'), /account-bound/);
    await assert.rejects(f.adapter.read(), /Unlock/);
    f.sdk.rpc = original; await f.adapter.unlock('1234');
    f.sdk.rpc = async (name, args) => args?.p_operation === 'read'
      ? { data: { role: 'parent', revision: 0, progress: {} } } : original(name, args);
    await assert.rejects(f.adapter.read(), /progress response/);
    await f.adapter.signOut(); await assert.rejects(f.adapter.read(), /Unlock/);
  });
  await test('CAS conflicts preserve complete alternatives and do not overwrite another device', async () => {
    const f = fake(); await f.connect(); await f.adapter.read(); f.change({ remote: true });
    const result = await f.adapter.save({ draft: true }); assert.ok(result.conflict);
    assert.deepEqual(f.adapter.resolveConflict('remote'), { remote: true });
    assert.deepEqual((await f.adapter.read()).progress, { remote: true });
  });
  await test('modules-only browser bundle exports adapter, has no entry page or credentials, refuses overwrite', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v52-preparation-'));
    try {
      build(dir);
      const context = { atob }; vm.runInNewContext(fs.readFileSync(path.join(dir, 'backend.js'), 'utf8'), context);
      assert.equal(typeof context.V51ProductionCloud.create, 'function');
      assert.deepEqual(fs.readdirSync(dir).sort(), ['backend-contract.json', 'backend.js']);
      const contract = JSON.parse(fs.readFileSync(path.join(dir, 'backend-contract.json')));
      assert.equal(contract.deployable, false); assert.equal(contract.anonKey, undefined);
      assert.throws(() => build(dir), /empty/);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
  console.log(`${suites} focused production preparation suites passed; synthetic SDK only.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
