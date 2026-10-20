const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {E,C,T}=require('../tests/helpers/profiles.cjs');
const M=require('../v3/adventure').V3Adventure,H=require('../v3/hands-on').V5HandsOn;
const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const A=new Proxy({esc},{get:(obj,key)=>obj[key]||(()=> '')});
const context={window:{V3Adventure:M,V3Town:T,V3Engine:E,V3Art:A,V5HandsOn:H,V3Curriculum:C}};
vm.runInNewContext(fs.readFileSync('v3/adventure-ui.js','utf8'),context);
const worlds=[];
for(const w of E.worlds) {
  const record={world:w.id,tasks:0,directScalars:0,clocks:0,models:new Set()};
  for(const r of [...M.routes(w.id).map(r=>r.id),'gateway']) for(const tier of [1,2,3]) for(const seed of [1,2,3]) for(let step=0;step<3;step++) {
    const t=M.task(w.id,r,tier,seed,step),q={world:w.id,route:r,values:{}};
    const html=context.window.V3AdventureUI.controls(q,t);
    assert.ok(html.length>0,`${w.id}/${r}/${tier}/${step}`);
    record.tasks++;record.models.add(H.mechanic(t,w.id,r)||t.kind);
    if(['amount','bank','bill','discount','payslip','timesheet','balance','ratio','sequence','bars','measure','angle'].includes(t.kind)) {
      assert.match(html,/data-numeric-answer="mission"/,`${w.id}/${r}/${tier}/${step} scalar missing direct entry`);record.directScalars++;
    }
    if(t.kind==='clock') {assert.match(html,/type="time"/);record.clocks++;}
  }
  record.models=[...record.models].sort();worlds.push(record);
}
const result={scope:'Renderer/model contract audit, all routes, three tiers, three seeds; browser operation is separate evidence',worlds,tasks:worlds.reduce((n,w)=>n+w.tasks,0),decisions:['Direct entry for all scalar mission values and numeric constructed practice; integer pence explicitly labelled.','Small bounded grouping, shading, arrays and selection controls retained as mathematical actions.','Budget envelopes keep £1 steps and add £5/£10 shortcuts; coin trays already offer UK notes.','Independent checks/discovery retain conventional choices and never render constructed-answer teaching models.']};
fs.writeFileSync('tests/artifacts/v5-1-input-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(`PASS V5.1 input audit: ${result.tasks} task variants across nine worlds, all routes and three tiers.`);
