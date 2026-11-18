/* Content identities are additive. Never re-identify a saved question on load. */
(function(root){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),part=x=>encodeURIComponent(String(x));
function key(skill,source,version,parameters){
 if(!skill||!source||!Number.isInteger(version)||version<1)throw Error('Invalid content identity');
 return ['q3',skill,source,'v'+version,...parameters].map(part).join('/');
}
function rows(skill,questions,{source='review',band=0,round=0}={}){
 return questions.map((q,i)=>{
  const row=copy(q),meta=row[5]||{},version=meta.contentVersion||1;
  // Existing generator IDs encode the actual family/seed selected by the bank.
  // The fallback identifies a deterministic legacy generator invocation, not its copy.
  row[5]={...meta,questionKey:meta.questionKey||key(skill,source,version,meta.id?[meta.id]:[band,round,i]),definitionId:meta.definitionId||skill+':'+source+':'+(meta.family||i),definitionVersion:meta.definitionVersion||version};
  return row;
 });
}
function task(t,{world='',route='',tier=0,seed=0,stage=0}={}){
 if(t.questionKey)return t;
 return {...t,questionKey:key(t.skill||world,'mission',t.contentVersion||1,t.questionId?[t.questionId]:[world,route,tier,seed,stage]),definitionId:t.skill||world+':'+route,definitionVersion:t.contentVersion||1};
}
function create(bank,skill,band,round,options={}){
 const qs=rows(skill,bank.create(skill,band,round,options),{band,round});
 if(qs.some(q=>options.excludeIds?.has(q[5].questionKey)))throw Error('Duplicate questions in review: content identity already encountered');
 return qs;
}
function catalog(C,education){
 const ids=new Set(C.skills.map(k=>k.id));
 if(ids.size!==C.skills.length)throw Error('Duplicate skill in content registry');
 const foundations={negative:['number_bonds'],division_groups:['times_tables'],decimal_place:['place'],prob_chance:['fraction_parts']};
 const entries=C.skills.map(k=>({id:k.id,world:k.world,name:k.name,prerequisites:[...(education.prerequisites[k.id]||foundations[k.id]||[])],objectives:[...(k.curriculum?.objectives||[])],definitionVersion:k.curriculum?.contentVersion||1}));
 const byId=new Map(entries.map(k=>[k.id,k]));
 function visit(id,path=[]){if(path.includes(id))throw Error('Prerequisite cycle: '+[...path,id].join(' -> '));for(const p of byId.get(id).prerequisites){if(!ids.has(p))throw Error('Unknown prerequisite '+p);visit(p,[...path,id]);}}
 for(const id of ids)visit(id);
 return entries;
}
function install(context){
 if(!context.V3Curriculum||!context.V6Education||!context.JaxonFreshReview)return;
 api.skills=catalog(context.V3Curriculum,context.V6Education);
 for(const k of api.skills)context.V6Education.prerequisites[k.id]||=[...k.prerequisites];
 const bank=context.JaxonFreshReview;
 context.JaxonFreshReview={...bank,create:(id,band,round,options)=>create(bank,id,band,round,options)};
}
const api={version:1,key,rows,task,create,catalog,install};root.V3Content=api;
if(typeof module!=='undefined')module.exports={V3Content:api};
install(root);
})(typeof window==='undefined'?globalThis:window);
