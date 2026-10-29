/* Short, non-teaching baseline. Estimates are provisional; never mastery evidence. */
(function(root){'use strict';
const get=(name,file)=>typeof module!=='undefined'?require('./'+file)[name]:root[name],copy=x=>JSON.parse(JSON.stringify(x));
const areas={number:['negative','operations'],fractions:['fractions','decimals'],algebra:['algebra_missing','algebra_patterns'],geometry:['geometry_angles','geometry_area'],ratio:['ratio_basics','ratio_sharing'],statistics:['stats_tables','stats_averages'],probability:['prob_chance','prob_events'],measure:['measure_units','measure_time'],town:['town_money','town_timetable']};
const views=['lesson','practice','check','discovery','adventure','journey','quest'];
function book(s){if(s.startingProfile===undefined)s.startingProfile={version:1,areas:{}};const b=s.startingProfile;return b?.version===1&&b.areas&&typeof b.areas==='object'&&!Array.isArray(b.areas)?b:null;}
function valid(a){return Array.isArray(a?.responses)&&a.responses.length===4&&a.responses.every(r=>r&&Number.isFinite(r.at)&&typeof r.correct==='boolean'&&typeof r.prompt==='string'&&typeof r.skill==='string')&&Number.isFinite(a.completedAt)&&a.estimate?.band>=3&&a.estimate?.band<=9;}
function complete(s){return s.startingProfile?.version===1&&Object.keys(areas).every(id=>valid(s.startingProfile?.areas?.[id]));}
function next(s){return Object.keys(areas).find(id=>!valid(s.startingProfile?.areas?.[id]));}
function question(s,id){return s.startingProfile?.areas?.[id]?.question||null;}
function makeQuestion(a,id,C){const ED=get('V6Education','education'),helper=get('V3Discovery','discovery'),i=a.responses.length,skill=areas[id][i%2],band=Math.max(ED.minBand(skill),Math.min(9,a.band));
 const bank=C.discovery[skill]?.[band],raw=bank?.[i];if(!raw)throw Error('Missing baseline discovery sample: '+skill+' / '+band);
 const h=helper(C.discovery,skill,{band,i});return{skill,band,prompt:h.prompt(raw[1]),answer:String(raw[2]),choices:h.choices().map(String),explanation:raw[4]||'The answer is '+raw[2]+'.'};}
function start(s,id,C,now=Date.now()){if(!areas[id])return 'Choose an assessment area.';const b=book(s);if(!b)return 'Your starting profile needs review. Nothing has been reset.';let a=b.areas[id];if(valid(a)){s.view='starting';return null;}
 if(a===undefined)a=b.areas[id]={band:get('V6Education','education').minBand(areas[id][0])===3?5:7,responses:[],startedAt:now,draft:''};
 if(!a||typeof a!=='object'||!Array.isArray(a.responses)||a.responses.length>4||!Number.isFinite(a.band)||a.question&&(!Array.isArray(a.question.choices)||typeof a.question.prompt!=='string'))return 'Your saved assessment is preserved and needs review.';
 if(!a.question)a.question=makeQuestion(a,id,C);s.seen=[...new Set([...(s.seen||[]),a.question.prompt])];b.active=id;s.world=id;s.view=s.resumeView='starting-area';return null;}
function answer(s,id,value,skip=false,now=Date.now()){const a=s.startingProfile?.areas?.[id],q=a?.question;if(!q||a.answered||valid(a))return false;
 const parse=get('V3Engine','engine').parseNumber;if(!skip&&!Number.isFinite(parse(value))){a.validation='Use a number, decimal or fraction, or choose I don’t know.';return false;}delete a.validation;const correct=!skip&&Number.isFinite(parse(value))&&Math.abs(parse(value)-parse(q.answer))<1e-8;
 a.responses.push({...copy(q),value:skip?null:String(value),skipped:skip,correct,at:now});a.answered=true;a.draft='';return true;}
function advance(s,id,C,now=Date.now()){const a=s.startingProfile?.areas?.[id];if(!a?.answered)return false;
 if(a.responses.length===4){const AD=get('V5Adaptive','adaptive'),anchor=areas[id][0],correct=a.responses.filter(r=>r.correct).length;
 // Reuse the existing four-response recommendation policy in a temporary state.
 // Do not write a skill discovery round or independent evidence for this mixed sample.
 const sample={discovery:{[anchor]:{rounds:[{band:a.band,correct,total:4}]}},skills:{},checks:{}};
 a.estimate=AD.skill(sample,anchor);a.completedAt=now;delete a.question;delete a.answered;s.view='starting';s.resumeView=null;return true;}
 if(a.responses.length===2){const n=a.responses.filter(r=>r.correct).length;a.band=Math.max(3,Math.min(9,a.band+(n===2?1:n===0?-1:0)));}
 a.question=makeQuestion(a,id,C);s.seen=[...new Set([...(s.seen||[]),a.question.prompt])];a.answered=false;return true;}
function rows(s,now=Date.now()){const E=get('V3Engine','engine'),C=get('V3Curriculum','curriculum'),AD=get('V5Adaptive','adaptive');return E.worlds.map(w=>{const a=s.startingProfile?.areas?.[w.id],done=valid(a),independent=C.skills.filter(k=>k.world===w.id).flatMap(k=>(s.skills?.[k.id]?.independentEvidence||[]).filter(e=>e.total>=3&&Number.isFinite(e.at)).map(e=>({...e,id:k.id}))),last=independent.slice().sort((x,y)=>y.at-x.at)[0],known=done?a.responses.filter(r=>!r.skipped).length:0;
 return{id:w.id,name:w.name,status:done?'Complete · provisional':a?.responses?.length?'In progress':'Not assessed yet',estimate:done&&known?'Starting range '+a.estimate.band:done?'Not enough evidence to estimate':'Not assessed yet',confidence:done?(known<3?'Very limited evidence':'Limited sample'):'Not enough evidence',at:done?a.completedAt:null,stale:done&&now-a.completedAt>30*86400000,objectives:areas[w.id].map(id=>C.skills.find(k=>k.id===id)?.name||id),independent:independent.length?{count:independent.length,at:last.at,band:AD.skill(s,last.id).band,mastered:C.skills.filter(k=>k.world===w.id&&s.checks?.[k.id]?.stage>=2).length}:null};});}
// Central UI admission policy, also applied when loading an existing activity view.
function allowed(s,action){if(complete(s))return true;const [name,arg]=action.split(':');if(['skip-tour','finish-tour'].includes(name))return true;if(name==='resume-saved')return arg==='baseline';if(name==='continue')return false;if(name==='nav')return !views.includes(arg);return !(/^(?:mission|scene-mission|restore|quest|learn|check|discover|next-path|home-activity|practice|begin|solve|skip|hint|next-quest|answer|learning-|next-learning|m-|j-|c8-|d9-|p5-|math)/.test(name));}
root.V11StartingProfile={areas,views,book,complete,next,valid,question,start,answer,advance,rows,allowed};if(typeof module!=='undefined')module.exports={V11StartingProfile:root.V11StartingProfile};
})(typeof window==='undefined'?globalThis:window);
