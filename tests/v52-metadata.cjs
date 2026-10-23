// One quick catalog-query/privacy check in disposable PostgreSQL, never Supabase.
const fs = require('node:fs'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const env = { ...process.env };
for (const name of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH']) delete env[name];
const container = 'jaxon-v52-metadata-' + process.pid;
function docker(args, input) {
  return execFileSync('docker', ['--host=unix:///var/run/docker.sock', ...args],
    { env, input, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] });
}
function sql(input) { return docker(['exec','-i',container,'psql','-h','127.0.0.1','-X','-qAt','-v','ON_ERROR_STOP=1','-U','postgres'], input); }
(async () => {
  try {
    docker(['run','--pull=never','--rm','-d','--name',container,'--network','none',
      '-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine']);
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try { sql('select 1;'); ready = true; break; }
      catch { await new Promise(r => setTimeout(r, 100)); }
    }
    assert.ok(ready, 'Disposable PostgreSQL did not start');
    sql(`create role anon; create role authenticated; create role service_role bypassrls;
      create role authenticator; grant authenticated to authenticator;
      create extension pgcrypto;
      create table public.learning_progress(id bigint generated always as identity primary key,
        game_state jsonb default '{"PRIVATE_MARKER":"not returned"}', note text);
      insert into public.learning_progress(note) values('PRIVATE_MARKER person credential PIN hash');
      alter table public.learning_progress enable row level security;
      grant select,truncate on public.learning_progress to authenticated;
      grant update(note) on public.learning_progress to authenticated;
      create policy own on public.learning_progress for select to authenticated using (id > 0);
      create unique index request_test on public.learning_progress(note) where note <> 'PRIVATE_MARKER';
      create function public.parent_award_maths() returns text language sql security definer
        set search_path='' set app.private_token='PRIVATE_MARKER' as $$select 'PRIVATE_MARKER'::text$$;
      revoke all on function public.parent_award_maths() from public;
      grant execute on function public.parent_award_maths() to authenticated;
      create function public.maths_trigger() returns trigger language plpgsql as $$begin return NEW; end$$;
      create trigger maths_audit before insert on public.learning_progress
        for each row execute function public.maths_trigger('PRIVATE_MARKER');
      comment on table public.learning_progress is 'PRIVATE_MARKER';
      alter default privileges in schema public grant execute on functions to authenticated;
      alter role authenticator set pgrst.db_schemas='public';`);
    const query = fs.readFileSync('docs/V51-PRODUCTION-METADATA.sql', 'utf8');
    const output = sql('begin read only;\n' + query + '\nrollback;');
    assert.ok(!output.includes('PRIVATE_MARKER'), 'Private values escaped into metadata');
    const rows = output.trim().split('\n').map(line => {
      const i = line.indexOf('|'), j = line.indexOf('|', i+1);
      return { section: line.slice(0,i), name: line.slice(i+1,j), data: JSON.parse(line.slice(j+1)) };
    });
    const find = (section, predicate) => rows.some(r => r.section === section && predicate(r));
    assert.ok(find('10_effective_execute', r => r.name === 'public.parent_award_maths()' && r.data.role === 'authenticated' && r.data.allowed));
    assert.ok(find('10_effective_execute', r => r.name === 'public.parent_award_maths()' && r.data.role === 'anon' && !r.data.allowed));
    assert.ok(find('06_effective_table_privilege', r => r.data.role === 'authenticated' && r.data.privilege === 'TRUNCATE' && r.data.allowed));
    assert.ok(find('11_index', r => r.data.unique && r.data.has_predicate));
    assert.ok(find('12_trigger', r => r.data.argument_count === 1));
    assert.ok(find('04_column_structure', r => r.name.endsWith('.id') && r.data.identity === 'a'));
    assert.ok(find('07_column_acl', r => r.data.privilege === 'UPDATE'));
    assert.ok(find('13_sequence', r => r.data.owner === 'postgres'));
    assert.ok(find('16_extension', r => r.name === 'pgcrypto'));
    assert.ok(find('20_role_membership', r => r.name === 'authenticator' && r.data.granted_role === 'authenticated'));
    assert.ok(find('21_default_acl', r => r.data.grantee === 'authenticated'));
    assert.ok(find('22_api_schema_setting', r => r.name === 'authenticator'));
    console.log('PASS metadata SELECT in read-only transaction: owners, EXECUTE/PUBLIC and effective grants, indexes/triggers, identity/sequence, extensions, roles/default ACLs/API schemas; secret markers excluded.');
  } finally { try { docker(['rm','-f',container]); } catch {} }
})().catch(e => { console.error(e.message); if (e.stderr) console.error(String(e.stderr)); process.exitCode = 1; });
