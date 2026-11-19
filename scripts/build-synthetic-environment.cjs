// Local artifact only. Never connects, provisions, authenticates, applies SQL or deploys.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const Contract = require("../v3/synthetic-environment.js");
const root = path.resolve(__dirname, ".."),
  fixtureRef = "abcdefghijklmnopqrst";
function once(source, before, after) {
  assert.equal(
    source.split(before).length,
    2,
    "Synthetic entry source changed; review transformation",
  );
  return source.replace(before, after);
}
function entry() {
  let source = fs.readFileSync(path.join(root, "v3/staging-app.js"), "utf8");
  source = 'import Synthetic from "./synthetic-environment.js";\n' + source;
  source = once(
    source,
    "c = window.V3CloudSync.config(window.V3StagingConfig);",
    "c = Synthetic.config(window.ESASyntheticConfig);",
  );
  source = once(
    source,
    'const check = await client.rpc("v3_identity");',
    'const check = await client.rpc("v3_identity");\n    if (check.error) throw Error("Reconnect to verify the synthetic server; drafts are preserved.");\n    Synthetic.verifyIdentity(c, check.data);',
  );
  for (const [before, after] of Object.entries(Contract.prefixes)) {
    assert(
      source.includes(before),
      "Storage namespace changed; review synthetic isolation",
    );
    source = source.replaceAll(before, after);
  }
  source = source
    .replaceAll("Staging account sign-in", "Synthetic test sign-in")
    .replaceAll("Staging is unavailable", "Synthetic tests are unavailable");
  return source;
}
function environment(env = process.env) {
  return {
    environment: "synthetic-test",
    projectName: "jaxon-maths-v3-staging",
    projectRef: env.ESA_SYNTHETIC_PROJECT_REF,
    authorizedRef: env.ESA_SYNTHETIC_AUTHORIZED_REF,
    url: env.ESA_SYNTHETIC_URL,
    anonKey: env.ESA_SYNTHETIC_PUBLIC_KEY,
  };
}
function build(input, { fixture = false } = {}) {
  const c = Contract.config(input);
  assert.equal(
    c.projectRef === fixtureRef,
    fixture,
    "Fictional fixture and deployable test outputs must be separate",
  );
  const out = path.join(
    root,
    fixture ? "synthetic-fixture-dist" : "synthetic-test-dist",
  );
  assert(
    !fs.existsSync(out) || fs.readdirSync(out).length === 0,
    "Output must be empty; existing artifacts are preserved",
  );
  // Validate every source transformation before writing anything.
  const source = entry();
  let html = fs.readFileSync(path.join(root, "v3-adventure.html"), "utf8");
  html = once(html, "connect-src 'none'", `connect-src 'self' ${c.url}`);
  html = once(
    html,
    '<script src="v3/app.js"></script>',
    '<script src="synthetic-config.js"></script><script src="v3/cloud-sync.js"></script><script src="synthetic-app.js"></script>',
  );
  html = once(
    html,
    "<body>",
    '<body>\n<aside class="panel" aria-label="Test environment"><strong>SYNTHETIC TEST ENVIRONMENT</strong> · Fictional accounts only. Use the family game for real play.</aside>',
  );
  html = html
    .replaceAll(
      "V5 Interactive Test Camp",
      "Everyday Skills Adventures · Synthetic tests",
    )
    .replaceAll("V3 TEST CAMP", "SYNTHETIC TESTS")
    .replace('href="v3-adventure.html"', 'href="index.html"')
    .replace(
      "Offline demo · fictional explorer · saved only on this device",
      "Separate synthetic server · fictional accounts only",
    )
    .replace(
      /<button data-nav="parent">Demo parent summary<\/button\s*>/,
      '<button data-nav="parent">Test parent summary</button><button id="cloud-lock">Lock account</button><button id="cloud-signout">Sign out</button>',
    );
  fs.mkdirSync(out, { recursive: true });
  for (const file of [
    "v3",
    "icon.svg",
    "v2-review-bank.js",
    "v2-guided-teaching.js",
    "v2-maths-tools.js",
    "v2-extra-tools.js",
  ])
    fs.cpSync(path.join(root, file), path.join(out, file), {
      recursive: true,
      filter: (src) =>
        ![
          "production-cloud.js",
          "backend-config.js",
          "staging-preserve.js",
        ].includes(path.basename(src)) &&
        !(
          path.dirname(src) === path.join(root, "v3/assets/ingredients") &&
          src.endsWith(".png")
        ) &&
        ![
          "painted-forest-preview",
          "fraction-desert-preview",
          "painted-forest-preview.js",
          "painted-forest-preview.css",
          "painted-desert-preview.js",
          "painted-desert-preview.css",
          "guide-portraits-preview.js",
          "guide-portraits-preview.css",
        ].includes(path.basename(src)),
    });
  fs.writeFileSync(path.join(out, "index.html"), html);
  fs.writeFileSync(
    path.join(out, "synthetic-config.js"),
    "window.ESASyntheticConfig = " + JSON.stringify(c) + ";\n",
  );
  fs.writeFileSync(
    path.join(out, "_headers"),
    "/*\n  Cache-Control: no-store\n  X-Robots-Tag: noindex, nofollow\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n",
  );
  fs.writeFileSync(
    path.join(out, "environment-manifest.json"),
    JSON.stringify(
      {
        kind: "synthetic-test",
        projectRef: c.projectRef,
        fixture,
        deployable: !fixture,
        requiresSeparateProjectAndHost: true,
        schemaApplied: false,
      },
      null,
      2,
    ) + "\n",
  );
  require("esbuild").buildSync({
    stdin: {
      contents: source,
      resolveDir: path.join(root, "v3"),
      loader: "js",
    },
    outfile: path.join(out, "synthetic-app.js"),
    bundle: true,
    format: "iife",
    minify: true,
  });
  return { out, config: c };
}
module.exports = { build, entry, environment };
if (require.main === module) {
  build(environment());
  console.log(
    "Prepared unpublished synthetic-test-dist. No service was contacted or changed.",
  );
}
