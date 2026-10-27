// Build only. Never creates accounts, connects to Supabase, or applies SQL.
const fs = require("node:fs"),
  path = require("node:path");
const { config } = require("../v3/cloud-sync.js");
const env = process.env;
const c = config({
  environment: "staging",
  projectName: "jaxon-maths-v3-staging",
  projectRef: env.V3_STAGING_PROJECT_REF,
  authorizedRef: env.V3_STAGING_AUTHORIZED_REF,
  url: env.V3_STAGING_URL,
  anonKey: env.V3_STAGING_ANON_KEY,
});
const repo = path.resolve(__dirname, "..");
for (const file of ["index.html", "v2-game-test.html"]) {
  const refs = fs
    .readFileSync(path.join(repo, file), "utf8")
    .matchAll(/https:\/\/([a-z]{20})\.supabase\.co/g);
  for (const [_, ref] of refs)
    if (ref === c.projectRef)
      throw Error("Live project configuration is forbidden");
}
// Browser QA must never replace a configured deployable build with mock credentials.
const outName = env.V3_STAGING_BUILD_FIXTURE === "1"
  ? "staging-fixture-dist" : "staging-dist";
if (env.V3_STAGING_BUILD_FIXTURE === "1" &&
    (c.projectRef !== "abcdefghijklmnopqrst" ||
     c.anonKey !== "sb_publishable_fictional_test_only"))
  throw Error("Fixture output requires fictional configuration");
const out = path.join(repo, outName);
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of [
  "v3",
  "icon.svg",
  "v2-review-bank.js",
  "v2-guided-teaching.js",
  "v2-maths-tools.js",
  "v2-extra-tools.js",
])
  fs.cpSync(path.join(repo, file), path.join(out, file), { recursive: true,
    filter: source => !['painted-forest-preview','fraction-desert-preview','painted-forest-preview.js','painted-forest-preview.css','painted-desert-preview.js','painted-desert-preview.css','guide-portraits-preview.js','guide-portraits-preview.css'].includes(path.basename(source)) });
let html = fs.readFileSync(path.join(repo, "v3-adventure.html"), "utf8");
html = html
  .replace("connect-src 'none'", `connect-src 'self' ${c.url}`)
  .replaceAll("V3 Test Camp", "V3 Staging")
  .replaceAll("V5 Interactive Test Camp", "V5 Interactive Staging")
  .replace("V3 TEST CAMP", "V3 STAGING")
  .replace(
    "Offline demo · fictional explorer · saved only on this device",
    "Separate staging accounts · fictional learners only",
  )
  .replace('href="v3-adventure.html"', 'href="index.html"')
  .replace(
    /<button data-nav="parent">Demo parent summary<\/button\s*>/,
    '<button id="cloud-lock">Lock account</button><button id="cloud-signout">Sign out</button>',
  )
  .replace(
    "No cloud connection in Test Camp.",
    "Staging only. Production is never used.",
  )
  .replace(
    '<script src="v3/app.js"></script>',
    '<script src="staging-config.js"></script><script src="v3/cloud-sync.js"></script><script src="staging-app.js"></script>',
  );
fs.writeFileSync(path.join(out, "index.html"), html);
fs.writeFileSync(
  path.join(out, "staging-config.js"),
  "window.V3StagingConfig = " + JSON.stringify(c) + ";\n",
);
require("esbuild").buildSync({
  entryPoints: [path.join(repo, "v3/staging-app.js")],
  outfile: path.join(out, "staging-app.js"),
  bundle: true,
  format: "iife",
  minify: true,
});
// The owner-private review album contains only synthetic captures, never account data.
const gallery = path.join(repo, "tests/visual");
if (fs.existsSync(path.join(gallery,"index.html"))) {
  fs.cpSync(gallery, path.join(out,"review"), {recursive:true});
  const index = path.join(out,"index.html");
  fs.writeFileSync(index,fs.readFileSync(index,"utf8").replace("<span>Staging only. Production is never used.</span>", '<span>Staging only. Production is never used.</span><a href="review/index.html">Visual review gallery</a>'));
}
console.log(
  `Built ${outName}. Separate private HTTPS hosting required; no deployment performed.`,
);
