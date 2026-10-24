const assert=require('node:assert/strict');
function solve(s,c){const M=c.V3Adventure;const q=M.current(s),t=q.tasks[q.i];M.begin(s);
 if(t.direct){q.values=require('./direct.cjs').solve(t.direct,t.answer,c.V9Touch,q.values);}
 else if(t.kind==='curriculum'){
  const a=t.activity;if(a?.kind==='place'){let left=Number(t.answer);for(const [i,weight]of a.weights.entries()){const digit=Math.min(9,Math.floor(left/weight+1e-7));assert(M.edit(s,'c8action','cell-'+i+'-'+digit));left=Number((left-digit*weight).toFixed(6));}}
  else if(!a||['readgraph','angle','numberline'].includes(a.kind))assert(M.edit(s,'c8action','input-'+t.answer));
  else if(a.kind==='plotset')for(const [i,point] of JSON.parse(t.answer).entries()){assert(M.edit(s,'c8action','active-'+i));assert(M.edit(s,'c8action','point-'+point.join(',')));}
  else if(['chart','venn','experiment','triangle','markings'].includes(a.kind)){if(a.kind==='experiment')for(let n=0;n<a.outcomes.length;n++)assert(M.edit(s,'c8action','trial'));for(const [i,n]of JSON.parse(t.answer).entries())assert(M.edit(s,'c8action','cell-'+i+'-'+n));}
  else if(a.kind==='cells')for(const n of JSON.parse(t.answer))assert(M.edit(s,'c8action','square-'+n));
  else if(['match','order'].includes(a.kind))for(const i of JSON.parse(t.answer))assert(M.edit(s,'c8action','place-'+i));
  else if(a.kind==='coordinate')assert(M.edit(s,'c8action','point-'+JSON.parse(t.answer).join(',')));
  else assert(M.edit(s,'c8action','choice-'+t.answer));
 }else if(['basket','offers','budget','blocks','array','chart','volume'].includes(t.kind))assert(M.edit(s,'parts',t.answer));
 else if(['fraction','chance'].includes(t.kind))assert(M.edit(s,'selected',Array.from({length:t.answer},(_,i)=>i)));
 else if(['order','match'].includes(t.kind))assert(M.edit(s,'order',t.answer));
 else if(t.kind==='grid')assert(M.edit(s,'selected',t.answer));
 else if(t.kind==='coordinate')assert(M.edit(s,'point',t.answer));
 else if(t.kind==='journey')assert(M.edit(s,'choice',t.answer));
 else if(t.kind==='coins'){let left=t.answer;const coins=[];for(const p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(left>=p){coins.push(p);left-=p;}assert(M.edit(s,'coins',coins));}
 else {assert(M.edit(s,'amount',t.answer));if(t.kind==='bank')for(let n=1;n<=t.transactions.length;n++)assert(M.edit(s,'posted',n));}
 assert(M.submit(s),t.skill+': '+t.prompt);assert.equal(M.submit(s),false);return true;
}
module.exports={solve};
