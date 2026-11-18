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
function once(source, before, after) {
  if (source.split(before).length !== 2)
    throw Error("Expected exactly one staging build source match: " + before.slice(0, 55));
  return source.replace(before, after);
}
function familyCopy(source) {
  const replacements = [
    ["Staging account sign-in", "Family account sign-in"],
    ["Use a fictional account from jaxon-maths-v3-staging. Your game account and PIN are separate.", "Sign in with your family account. Your account password and game PIN are separate."],
    ["Enter your staging email first.", "Enter your family email first."],
    ["Set your staging PIN", "Set your game PIN"],
    ["staging reconnects", "the family service reconnects"],
    ["This staging build requires Web Locks for safe saves. Use a current Safari or Chrome.", "This family game requires Web Locks for safe saves. Use a current Safari or Chrome."],
    ["This staging account is already open in another tab. Close that tab first.", "This family account is already open in another tab. Close that tab first."],
    ["Updated from your other staging device.", "Updated from your other device."],
    ["waiting for staging sync", "waiting for family sync"],
    ["Saved to staging", "Saved to your family account"],
    ["Staging parent dashboard", "Family progress"],
    ["Fictional family only", "Family progress"],
    ["Choose a new staging account password", "Choose a new family account password"],
    ["Staging is unavailable", "The family service is unavailable"],
    ["Test Camp remains a separate offline game. No production fallback is available.", "Your family progress is safe. Check your connection and try again."],
  ];
  for (const [before, after] of replacements) source = once(source, before, after);
  return source;
}
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
    filter: source => !(path.dirname(source)===path.join(repo,'v3/assets/ingredients') && source.endsWith('.png')) && !['painted-forest-preview','fraction-desert-preview','painted-forest-preview.js','painted-forest-preview.css','painted-desert-preview.js','painted-desert-preview.css','guide-portraits-preview.js','guide-portraits-preview.css'].includes(path.basename(source)) });
let html = fs.readFileSync(path.join(repo, "v3-adventure.html"), "utf8");
for (const [before, after] of [
  ["connect-src 'none'", `connect-src 'self' ${c.url}`],
  ["V5 Interactive Test Camp", "Jaxon's Maths Adventure"],
  ["V3 TEST CAMP", "FAMILY MATHS ADVENTURE"],
  ["Offline demo · fictional explorer · saved only on this device", "Family account required · secure cloud saves"],
  ['href="v3-adventure.html"', 'href="index.html"'],
  ['<button data-nav="parent">Demo parent summary</button\n      >', '<button data-nav="parent">Family progress</button><button id="cloud-lock">Lock account</button><button id="cloud-signout">Sign out</button>'],
  ["No cloud connection in Test Camp.", "Family account · 60-minute weekly goal · screen time 1:1"],
  ['<script src="v3/app.js"></script>', '<script src="staging-config.js"></script><script src="v3/cloud-sync.js"></script><script src="staging-app.js"></script>'],
]) html = once(html, before, after);
fs.writeFileSync(path.join(out, "index.html"), html);
fs.writeFileSync(
  path.join(out, "staging-config.js"),
  "window.V3StagingConfig = " + JSON.stringify(c) + ";\n",
);
const stagingEntry = path.join(out, "family-app-source.js");
fs.writeFileSync(stagingEntry, familyCopy(fs.readFileSync(path.join(repo, "v3/staging-app.js"), "utf8")));
try {
  require("esbuild").buildSync({
    entryPoints: [stagingEntry],
    outfile: path.join(out, "staging-app.js"),
    bundle: true,
    format: "iife",
    minify: true,
  });
} finally {
  fs.rmSync(stagingEntry, { force: true });
}
console.log(
  `Built ${outName}. Separate private HTTPS hosting required; no deployment performed.`,
);
