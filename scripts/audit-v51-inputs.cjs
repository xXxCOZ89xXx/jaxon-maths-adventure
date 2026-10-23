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
      if(html.includes('data-numeric-answer="mission"'))record.directScalars++;
      else {
        // Bounded slider/tap models are now preferred when they assess the skill clearly.
        const slider=html.match(/type="range" min="([^"]+)" max="([^"]+)" step="([^"]+)"[^>]*aria-label="([^"]+)"/);
        if(!slider){assert((html.includes(`data-action="m-value:${t.answer}"`)||Number.isInteger(t.answer)&&t.answer>=0&&html.includes('data-action="m-adjust:1"')&&html.includes('data-action="m-adjust:-1"'))&&html.includes('aria-label='),`${w.id}/${r}/${tier}/${step} needs a labelled control that reaches the correct value`);continue;}
        const [,min,max,increment]=slider.map((x,i)=>i>0&&i<4?Number(x):x);
        assert(t.answer>=min&&t.answer<=max&&Math.abs((t.answer-min)/increment-Math.round((t.answer-min)/increment))<1e-8,'Answer must be reachable with the accessible model');
      }
    }
    if(t.kind==='clock') {assert(html.includes('type="time"') || html.includes('aria-label="Set hour 23"')&&html.includes('aria-label="Set minute 55"')&&html.includes('One minute later'),'Clock needs direct input or full labelled clock controls');record.clocks++;}
  }
  record.models=[...record.models].sort();worlds.push(record);
}
const result={scope:'Renderer/model contract audit, all routes, three tiers, three seeds; browser operation is separate evidence',worlds,tasks:worlds.reduce((n,w)=>n+w.tasks,0),decisions:['Scalar tasks offer direct entry or a labelled bounded slider with reachable answers; integer pence remains labelled.','Small bounded grouping, shading, arrays and selection controls retained as mathematical actions.','Budget envelopes keep £1 steps and add £5/£10 shortcuts; coin trays already offer UK notes.','Legacy independent checks/discovery retain conventional choices and never render constructed-answer teaching models.']};
fs.writeFileSync('tests/artifacts/v5-1-input-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(`PASS V5.1 input audit: ${result.tasks} task variants across nine worlds, all routes and three tiers.`);
