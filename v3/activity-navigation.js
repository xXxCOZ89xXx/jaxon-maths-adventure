/* Activity-local routing/recovery. No storage, accounts, wallet or network access. */
(function(root){'use strict';
const get=(name,file)=>typeof module!=='undefined'?require('./'+file)[name]:root[name],copy=x=>JSON.parse(JSON.stringify(x));
function modules(){return{M:get('V3Adventure','adventure'),J:get('V5Journey','journey'),L:get('V52TownLife','town-life'),R:get('V10Restoration','restoration'),E:get('V3Engine','engine')};}
function learningView(q){return q.needsTeaching?'lesson':q.mode==='discovery'?'discovery':q.mode==='check'?'check':q.started?'practice':'lesson';}
function learningWorld(s){const C=typeof module!=='undefined'?require('./curriculum').V3Curriculum:root.V3Curriculum;return C.skills.find(k=>k.id===s.learning?.id)?.world||s.world;}
function resume(s){const{M,J}=modules(),j=J.model(s),q=M.current(s),v=s.resumeView;
 if(v==='journey'&&j){s.world='town';s.view='journey';return;}
 if(v==='adventure'&&q){s.world=q.world;if(q.solved&&q.i===q.tasks.length-1){M.next(s);return;}s.view='adventure';return;}
 if(v==='quest'&&s.quest){s.world=s.quest.world;if(s.quest.solved){modules().E.nextQuest(s);return;}s.view='quest';return;}
 if(['lesson','practice','check','discovery'].includes(v)&&s.learning){s.world=learningWorld(s);s.view=s.resumeView=s.learning.needsTeaching?'lesson':v;return;}
 // Completed activities stay completed: no default supermarket or fresh quest.
 if(s.lastResult?.type==='town-plan'&&s.world==='town'){s.view=j?.done?'journey':'world';return;}
 if(s.world==='town'&&j?.done&&!['restoration','expedition','quest'].includes(s.lastResult?.type)){s.view='journey';return;}
 if(s.lastResult?.world===s.world){s.view='recap';return;}
 if(s.world==='town'&&j?.done){s.view='journey';return;}
 s.view='world';s.resumeView=null;
}
function label(s,kind,q){const C=typeof module!=='undefined'?require('./curriculum').V3Curriculum:root.V3Curriculum;
 if(kind==='learning')return `${q.mode==='discovery'?'Starting-point assessment':q.mode==='check'?'Independent check':'Lesson / practice'}: ${C.skills.find(k=>k.id===q.id)?.name||q.id}`;
 if(kind==='town'||kind==='legacy-town')return q.name||q.recipeName||(q.recipe?modules().J.recipes[q.recipe]?.name:null)||'Town journey';
 if(kind==='quest')return `Saved restoration in ${q.world}`;
 const world=modules().E.worlds.find(w=>w.id===q.world)?.name||'your world';return q.restoration?(q.world==='town'?'Restore Community '+(q.restoration.stage+1):`${world} restoration stage ${q.restoration.stage+1}`):(modules().M.routes(q.world).find(r=>r.id===q.route)?.name||world+' visit');
}
function target(s){const{M,J}=modules();let kind,q;
 if(s.view==='journey'){q=J.state(s);if(q&&!q.done)kind=q.version===2?'town':'legacy-town';}
 else if(s.view==='adventure'){q=M.current(s);if(q)kind='mission';}
 else if(s.view==='quest'){q=s.quest;if(q)kind='quest';}
 else if(['lesson','practice','check','discovery'].includes(s.view)){q=s.learning;if(q)kind='learning';}
 if(!kind||!q||kind==='mission'&&q.solved&&q.i===q.tasks.length-1)return null;
 return{kind,label:label(s,kind,q),snapshot:copy(q),world:s.world,reset:kind==='learning'?'Restart clears only this question’s unfinished answer and tools. Exit pauses this question exactly. Earlier answers, hints and assessment evidence stay saved.':'This unfinished activity’s draft and pretend inventory. Its completed steps and receipts stay in Earlier attempts; completed activities, learning coins, purchases and assessment evidence stay saved.'};
}
function stashLearning(s){if(!s.learning)return true;if(s.pausedLearning!==undefined&&(!s.pausedLearning||typeof s.pausedLearning!=='object'||Array.isArray(s.pausedLearning)))return false;s.pausedLearning||={};s.pausedLearning[s.learning.id+'|'+s.learning.mode]=copy(s.learning);return true;}
function restoreLearning(s,id,mode){if(mode==='discovery'&&s.discovery?.[id]?.complete)return false;const live=s.learning;if(live?.id===id&&live.mode===mode){s.world=learningWorld(s);s.view=s.resumeView=learningView(live);return true;}const q=s.pausedLearning?.[id+'|'+mode];if(!q)return false;if(!stashLearning(s))return false;s.learning=copy(q);delete s.pausedLearning[id+'|'+mode];s.world=learningWorld(s);s.view=s.resumeView=learningView(q);return true;}
function recover(s,expected,mode){const{M,J,L,R,E}=modules(),t=target(s);if(!t||!expected||t.kind!==expected.kind||JSON.stringify(t.snapshot)!==JSON.stringify(expected.snapshot))return 'This activity changed. Open Get unstuck again; nothing was reset.';
 if(!['restart','exit'].includes(mode))return 'Choose restart or exit.';
 if(s.activityArchives!==undefined&&!Array.isArray(s.activityArchives))return 'Earlier attempts need review. Nothing was reset.';
 if(t.kind==='learning'&&mode==='exit'&&s.pausedLearning!==undefined&&(!s.pausedLearning||typeof s.pausedLearning!=='object'||Array.isArray(s.pausedLearning)))return 'Saved lessons are preserved; nothing was reset.';
 const q=t.snapshot;s.activityArchives||=[];s.activityArchives.push({kind:t.kind,name:t.label,reason:mode,snapshot:copy(q)});
 if(t.kind==='learning'){
  // Do not turn a second attempt into a first independent answer.
  if(mode==='restart'&&!s.learning.answered){delete s.learning.manipulation;delete s.learning.amountDraft;delete s.learning.clockDraft;s.learning.feedback='';}
  if(mode==='exit'){stashLearning(s);s.learning=null;s.resumeView=null;s.view='map';}return null;
 }
 if(t.kind==='town'){const b=L.book(s);delete b.runs[q.id];if(b.active===q.id)b.active=null;}
 else if(t.kind==='legacy-town'){delete s.adventure.journeyV1;if(s.adventure.townActive!==2)s.adventure.townActive=null;}
 else if(t.kind==='mission'){const a=M.state(s);delete a.suspended[q.key];a.active=null;}
 else {delete s.quests[q.world];s.quest=null;}
 s.resumeView=null;s.view='map';
 if(mode==='restart'){
  if(t.kind==='town'){if(q.originalRecipe)L.startRecipe(s,q.originalRecipe,q.tier);else L.start(s,q.scenario,q.tier,true);}
  else if(t.kind==='legacy-town')J.start(s,q.recipe,q.tier||1);
  else if(t.kind==='mission'){if(q.restoration)return R.start(s,q.world,q.restoration.stage);M.start(s,q.world,q.route,q.tier,q.context);}
  else return R.start(s,q.world,q.i);
 }
 return null;
}
function summary(s){const{M,J}=modules(),j=J.model(s),q=M.current(s);if(s.resumeView==='journey'&&j)return (j.done?'See completed plan: ':'Resume ')+(j.name||j.recipeName);if(s.resumeView==='adventure'&&q)return q.restoration?'Resume restoration stage '+(q.restoration.stage+1)+' · task '+(q.i+1):'Resume your saved visit';if(s.resumeView==='quest'&&s.quest)return 'Resume your earlier saved restoration';if(s.learning&&['lesson','practice','check','discovery'].includes(s.resumeView))return 'Resume '+label(s,'learning',s.learning);if(s.world==='town'&&j?.done&&!['restoration','expedition','quest'].includes(s.lastResult?.type))return 'See completed plan: '+(j.name||j.recipeName);if(s.lastResult?.world===s.world)return 'See your saved recap, then choose your next route';if(s.world==='town'&&j?.done)return 'See completed plan: '+(j.name||j.recipeName);return 'Choose your next learning step or an optional adventure';}
root.V10Navigation={summary,resume,target,recover,stashLearning,restoreLearning};if(typeof module!=='undefined')module.exports={V10Navigation:root.V10Navigation};
})(typeof window==='undefined'?globalThis:window);
