// Fictional, in-memory PostgreSQL only. No socket, real identity or backup input.
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");
const { pgcrypto } = require("@electric-sql/pglite/contrib/pgcrypto");
const root = path.resolve(__dirname, "../..");
const sources = [
  "supabase/v3-staging/001_secure_core.sql",
  "supabase/v3-staging/002_catalog.sql",
  "supabase/v3-staging/004_compact_save_receipts.sql",
  "supabase/base-camp/001_parent_game_reset.sql",
];
const signatures = [
  "public.v3_request(text,text,jsonb)",
  "public.v3_request_before_game_reset(text,text,jsonb)",
  "public.v3_identity()",
  "public.v3_role()",
  "public.v3_set_pin(text)",
  "public.v3_unlock(text)",
];
const lit = (v) => "'" + String(v).replaceAll("'", "''") + "'";
const bootstrapSql = `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE auth.identities(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id));
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (auth.jwt()->>'sub')::uuid$$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated;
GRANT EXECUTE ON FUNCTION auth.jwt(),auth.uid() TO anon,authenticated;
SET app.v3.staging_authorized='yes'; SET app.v3.staging_ref='sfogrvedypgtxfvecmbx';
SET app.base_camp_reset_reviewed='yes';`;
async function fixture() {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(bootstrapSql);
    for (const file of sources)
      await db.exec(fs.readFileSync(path.join(root, file), "utf8"));
    return db;
  } catch (e) {
    await db.close();
    throw e;
  }
}
module.exports = { fixture, sources, signatures, lit, bootstrapSql };
