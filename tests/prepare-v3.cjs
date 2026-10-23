// Fictional build fixture ONLY. No remote connections or valid credentials.
const { execFileSync } = require("node:child_process");
execFileSync(process.execPath, ["scripts/build-v3-staging.cjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    V3_STAGING_BUILD_FIXTURE: "1",
    V3_STAGING_PROJECT_REF: "abcdefghijklmnopqrst",
    V3_STAGING_AUTHORIZED_REF: "abcdefghijklmnopqrst",
    V3_STAGING_URL: "https://abcdefghijklmnopqrst.supabase.co",
    V3_STAGING_ANON_KEY: "sb_publishable_fictional_test_only",
  },
});
execFileSync(process.execPath, ["scripts/build-v3-preview.cjs"], {
  stdio: "inherit",
});
