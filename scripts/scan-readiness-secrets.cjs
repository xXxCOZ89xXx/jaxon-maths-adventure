// Bounded worktree + built-browser scan. Reports paths only, never matching bytes.
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path');
const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'}).split('\n').filter(Boolean);
function add(dir){if(!fs.existsSync(dir))return;for(const n of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,n.name);if(n.isDirectory())add(p);else files.push(p);}}
add('production-test-dist');let scanned=0,findings=[];
for(const file of [...new Set(files)]){
 if(!/\.(?:js|cjs|json|html|sql|md|yml|css|txt)$/.test(file)||file===__filename||file==='scripts/scan-readiness-secrets.cjs')continue;
 const s=fs.readFileSync(file,'utf8');scanned++;
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(s)||/sb_secret_[A-Za-z0-9_-]{24,}/.test(s))findings.push(file+': private credential pattern');
 for(const m of s.matchAll(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g)){try{const p=JSON.parse(Buffer.from(m[0].split('.')[1],'base64url'));if(p.role==='service_role')findings.push(file+': service JWT');}catch{}}
}
console.log(JSON.stringify({scanned,findings,scope:'Current text worktree and production browser artifact only; no history/provider-secret attestation'},null,2));if(findings.length)process.exitCode=1;
