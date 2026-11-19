const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  vm = require("node:vm"),
  { execFileSync } = require("node:child_process");
const Contract = require("../v3/synthetic-environment.js"),
  Builder = require("../scripts/build-synthetic-environment.cjs"),
  { config, identity, publicKey } = require("./helpers/synthetic-project.cjs");
function snapshot(dir) {
  if (!fs.existsSync(dir)) return null;
  return fs
    .readdirSync(dir, { recursive: true })
    .sort()
    .filter((f) => fs.statSync(path.join(dir, f)).isFile())
    .map((f) => [
      f,
      crypto
        .createHash("sha256")
        .update(fs.readFileSync(path.join(dir, f)))
        .digest("hex"),
    ]);
}
const protectedOutputs = [
  "staging-dist",
  "production-dist",
  "synthetic-test-dist",
];
const before = protectedOutputs.map(snapshot);
assert.deepEqual(
  Contract.config({
    ...config,
    serviceRole: "never-serialize-private",
    databasePassword: "never-serialize-private",
  }),
  config,
);
assert(Object.isFrozen(Contract.config(config)));
for (const ref of Contract.forbiddenRefs)
  assert.throws(() =>
    Contract.config({
      ...config,
      projectRef: ref,
      authorizedRef: ref,
      url: `https://${ref}.supabase.co`,
      anonKey: publicKey(ref),
    }),
  );
for (const wrong of [
  { authorizedRef: "z".repeat(20) },
  { environment: "staging" },
  { projectName: "jaxon-maths-family" },
  { url: "http://127.0.0.1:54321" },
  { anonKey: "sb_secret_private" },
  { anonKey: publicKey("z".repeat(20)) },
])
  assert.throws(() => Contract.config({ ...config, ...wrong }));
const secretJwt = config.anonKey.split(".");
secretJwt[1] = Buffer.from(
  JSON.stringify({ role: "service_role", ref: config.projectRef }),
).toString("base64url");
assert.throws(() =>
  Contract.config({ ...config, anonKey: secretJwt.join(".") }),
);
Contract.verifyIdentity(config, identity);
for (const wrong of [
  null,
  {},
  { ...identity, syntheticOnly: false },
  { ...identity, environmentKind: "family" },
  { ...identity, syntheticContractVersion: 2 },
  { ...identity, saveReceiptVersion: 0 },
  { ...identity, projectRef: Contract.forbiddenRefs[0] },
])
  assert.throws(() => Contract.verifyIdentity(config, wrong));
assert.throws(() => Builder.build(config), /fixture/);
const syntheticRef = "z".repeat(20);
assert.throws(
  () =>
    Builder.build(
      {
        ...config,
        projectRef: syntheticRef,
        authorizedRef: syntheticRef,
        url: `https://${syntheticRef}.supabase.co`,
        anonKey: publicKey(syntheticRef),
      },
      { fixture: true },
    ),
  /fixture/,
);
// The existing deployable family path rejects an otherwise valid synthetic target before output writes.
assert.throws(
  () =>
    execFileSync(process.execPath, ["scripts/build-v3-staging.cjs"], {
      stdio: "pipe",
      env: {
        ...process.env,
        V3_STAGING_PROJECT_REF: syntheticRef,
        V3_STAGING_AUTHORIZED_REF: syntheticRef,
        V3_STAGING_URL: `https://${syntheticRef}.supabase.co`,
        V3_STAGING_ANON_KEY: publicKey(syntheticRef),
        V3_STAGING_BUILD_FIXTURE: "0",
      },
    }),
  (e) => String(e.stderr).includes("Family deployment is pinned"),
);
execFileSync(process.execPath, ["tests/prepare-synthetic.cjs"], {
  stdio: "pipe",
});
const out = "synthetic-fixture-dist",
  html = fs.readFileSync(path.join(out, "index.html"), "utf8"),
  js = fs.readFileSync(path.join(out, "synthetic-app.js"), "utf8");
assert.match(html, /SYNTHETIC TEST ENVIRONMENT/);
assert.match(html, /synthetic-app\.js/);
assert.match(
  html,
  new RegExp("connect-src 'self' " + config.url.replaceAll(".", "\\.")),
);
assert(!html.includes('src="v3/app.js"'));
new vm.Script(js);
assert(!js.includes("never-serialize-private"));
for (const [family, synthetic] of Object.entries(Contract.prefixes)) {
  assert(!Builder.entry().includes(family));
  assert(js.includes(synthetic));
}
assert(js.includes("syntheticOnly"));
for (const source of html.matchAll(/(?:src|href)="([^"]+)"/g))
  if (!source[1].startsWith("#"))
    assert(
      fs.statSync(path.join(out, source[1])).isFile(),
      "Missing synthetic asset",
    );
assert.equal(
  JSON.parse(fs.readFileSync(path.join(out, "environment-manifest.json")))
    .deployable,
  false,
);
assert.throws(
  () => Builder.build(config, { fixture: true }),
  /Output must be empty/,
);
assert.deepEqual(
  protectedOutputs.map(snapshot),
  before,
  "Synthetic preparation touched an existing deployable artifact",
);
console.log(
  "PASS synthetic configuration/build: wrong/live projects and private keys refused, server capability required, isolated storage, family target pinned, fixture/deployable outputs separate and preserved.",
);
