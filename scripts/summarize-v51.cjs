// Summarises executed browser evidence, never infers passes from intended coverage.
const fs=require('node:fs'),path=require('node:path');
const input=process.argv[2]||'tests/artifacts/v5-1-browser-results.json';
if(!fs.existsSync(input)) {console.error('No browser report available');process.exitCode=1;return;}
const report=JSON.parse(fs.readFileSync(input,'utf8')),cases=[],coverage=[];
function visit(suite,parents=[]) {
  const titles=[...parents,suite.title].filter(Boolean);
  for(const spec of suite.specs||[]) for(const test of spec.tests||[]) {
    const result=test.results.at(-1);
    cases.push({name:[...titles,spec.title].join(' / '),project:test.projectName,status:result?.status,expected:test.expectedStatus,attempts:test.results.length});
    if(result?.status==='passed') for(const a of result.attachments||[]) if(a.name==='curriculum-coverage') {
      const raw=a.body?Buffer.from(a.body,'base64').toString():fs.readFileSync(a.path,'utf8');
      coverage.push(...JSON.parse(raw).map(c=>({...c,project:test.projectName})));
    }
  }
  for(const child of suite.suites||[]) visit(child,titles);
}
for(const suite of report.suites||[]) visit(suite);
const summary={generatedAt:new Date().toISOString(),report:input,stats:report.stats,counts:cases.reduce((a,c)=>(a[c.status]=(a[c.status]||0)+1,a),{}),worlds:[...new Set(coverage.map(c=>c.world))].sort(),skills:[...new Set(coverage.map(c=>c.skill))].sort(),profiles:[...new Set(coverage.map(c=>c.profile))].sort(),skillVisits:coverage.length,completedIndependentRounds:coverage.filter(c=>c.completedIndependentRound).length,cases,coverage};
fs.writeFileSync('tests/artifacts/v5-1-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({counts:summary.counts,worlds:summary.worlds.length,skills:summary.skills.length,profiles:summary.profiles,skillVisits:summary.skillVisits,completedIndependentRounds:summary.completedIndependentRounds}));
