// Read-only gate for the owner-approved release candidate. Does not push or deploy.
// GITHUB_TOKEN needs repository/checks READ only; never printed or persisted.
const cp=require('node:child_process');
const sha=process.argv[2];
async function main(){
 if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Pass the exact reviewed 40-character candidate SHA');
 if(process.env.IPAD_RECEIPT_MIGRATION_VERIFIED!=='1')throw Error('Owner must first verify the receipt migration and app together in the existing project');
 const message=cp.execFileSync('git',['show','-s','--format=%B',sha],{encoding:'utf8'});
 if(/\[(?:skip (?:ci|actions)|ci skip|actions skip|no ci)\]|skip-checks:\s*true/i.test(message))throw Error('Skip flags are not allowed on a release candidate');
 if(!process.env.GITHUB_TOKEN)throw Error('GitHub checks read access is required; no promotion performed');
 const res=await fetch(`https://api.github.com/repos/xXxCOZ89xXx/jaxon-maths-adventure/commits/${sha}/check-runs`,{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${process.env.GITHUB_TOKEN}`}});
 if(!res.ok)throw Error('Could not verify exact candidate checks');const data=await res.json();
 const checks=data.check_runs.filter(x=>x.name==='save-and-recovery'&&x.app?.slug==='github-actions').sort((a,b)=>b.id-a.id);
 if(!checks.length||checks[0].head_sha!==sha||checks[0].status!=='completed'||checks[0].conclusion!=='success')throw Error('Exact candidate requires a successful save-and-recovery check');
 console.log(`PASS candidate ${sha}: tested save/recovery gate and owner migration verification. Promotion still requires owner approval.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
