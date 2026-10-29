// Read-only, password-free audit. No production fallback and no mutations.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {config} = require('../v3/cloud-sync.js');
const Policy=require('../v3/staging-policy.js');
const expected=Policy.assertRef(process.env.V3_STAGING_PROJECT_REF);
async function main() {
  const c = config({environment:'staging', projectName:'jaxon-maths-v3-staging',
    projectRef:process.env.V3_STAGING_PROJECT_REF,
    authorizedRef:process.env.V3_STAGING_AUTHORIZED_REF,
    url:process.env.V3_STAGING_URL, anonKey:process.env.V3_STAGING_ANON_KEY});
  if(c.projectRef !== expected) throw Error('This audit permits only the owner-confirmed staging project');
  const result = {projectRef:c.projectRef, url:c.url, configuration:'matched',
    publishableKey:'present; redacted', authenticatedTests:'not attempted; no account credentials', requests:[]};
  // curl uses the inherited proxy and CA; headers arrive on stdin, never argv or logs.
  function request(label, endpoint) {
    try {
      const response = execFileSync('curl', ['--config','-', '--silent','--show-error',
        '--max-time','20','--proto','=https','--max-redirs','0','--write-out','\n%{http_code}',
        c.url + endpoint], {input:'header = '+JSON.stringify('apikey: '+c.anonKey)+'\n',
        encoding:'utf8', stdio:['pipe','pipe','pipe']});
      const i=response.lastIndexOf('\n'), status=Number(response.slice(i+1));
      if(label === 'identity') {
        let identity; try {identity=JSON.parse(response.slice(0,i));} catch {}
        const verified=status===200 && identity?.name===c.projectName && identity?.projectRef===expected;
        result.requests.push({label,status,outcome:verified?'verified':status===200?'identity mismatch':'HTTP rejection'});
        return verified;
      }
      result.requests.push({label,status,outcome:[401,403].includes(status)?'anonymous access denied':'unexpected response; investigate'});
    } catch (err) {
      // Do not expose response bodies, headers or errors that could contain configuration.
      const proxyDenied=/CONNECT tunnel failed, response 403/.test(String(err.stderr));
      result.requests.push({label,status:null,proxyStatus:proxyDenied?403:null,
        outcome:proxyDenied?'proxy denied staging host; target not contacted':'network/proxy failure; target not verified'});
    }
    return false;
  }
  if(request('identity','/rest/v1/rpc/v3_identity')) {
    // limit=0 returns no records even if a grant is accidentally permissive.
    for(const table of ['v3_environment','maths_families','v3_pins','v3_unlocks','v3_progress','v3_wallet','v3_catalog','v3_transactions'])
      request('anonymous table '+table,'/rest/v1/'+table+'?select=*&limit=0');
    request('anonymous role RPC','/rest/v1/rpc/v3_role');
  }
  const out=path.resolve(__dirname,'../tests/artifacts/v3-live-staging.json');
  fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  if(result.requests.some(x=>!['verified','anonymous access denied'].includes(x.outcome))) process.exitCode=1;
}
main().catch(()=>{ console.error('Staging audit stopped: missing or invalid pinned configuration (values redacted).'); process.exitCode=1; });
