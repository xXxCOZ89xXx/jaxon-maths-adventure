/* Activity-local routing/recovery. No storage, accounts, wallet or network access. */
(function(root){'use strict';
const get=(name,file)=>typeof module!=='undefined'?require('./'+file)[name]:root[name],copy=x=>JSON.parse(JSON.stringify(x));
function modules(){return{M:get('V3Adventure','adventure'),J:get('V5Journey','journey'),L:get('V52TownLife','town-life'),R:get('V10Restoration','restoration'),E:get('V3Engine','engine')};}
function learningView(q){return q.needsTeaching?'lesson':q.mode==='discovery'?'discovery':q.mode==='check'?'check':q.started?'practice':'lesson';}
function learningWorld(s){const C=typeof module!=='undefined'?require('./curriculum').V3Curriculum:root.V3Curriculum;return C.skills.find(k=>k.id===s.learning?.id)?.world||s.world;}
function resume(s){const{M,J}=modules(),j=J.model(s),q=M.current(s),v=s.resumeView;
 if(s.pausedActivity&&saved(s).some(x=>x.kind===s.pausedActivity.kind&&x.key===s.pausedActivity.key)){openSaved(s,s.pausedActivity.kind,s.pausedActivity.key);return;}
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
 if(kind==='baseline')return 'Starting points: '+modules().E.worlds.find(w=>w.id===s.world)?.name;
 if(kind==='learning')return `${q.mode==='discovery'?'Starting-point assessment':q.mode==='check'?'Independent check':'Lesson / practice'}: ${C.skills.find(k=>k.id===q.id)?.name||q.id}`;
 if(kind==='town'||kind==='legacy-town')return q.name||q.recipeName||(q.recipe?modules().J.recipes[q.recipe]?.name:null)||'Town journey';
 if(kind==='quest')return `Saved restoration in ${q.world}`;
 const world=modules().E.worlds.find(w=>w.id===q.world)?.name||'your world';return q.restoration?(q.world==='town'?'Restore Community '+(q.restoration.stage+1):`${world} restoration stage ${q.restoration.stage+1}`):(modules().M.routes(q.world).find(r=>r.id===q.route)?.name||world+' visit');
}
function target(s){const{M,J}=modules();let kind,q;
 if(s.view==='starting-area'){q=s.startingProfile?.areas?.[s.startingProfile?.active];if(q?.question)kind='baseline';}
 else if(s.view==='journey'){q=J.state(s);if(q&&!q.done)kind=q.version===2?'town':'legacy-town';}
 else if(s.view==='adventure'){q=M.current(s);if(q)kind='mission';}
 else if(s.view==='quest'){q=s.quest;if(q)kind='quest';}
 else if(['lesson','practice','check','discovery'].includes(s.view)){q=s.learning;if(q)kind='learning';}
 if(!kind||!q||kind==='mission'&&q.solved&&q.i===q.tasks.length-1)return null;
 return{kind,label:label(s,kind,q),snapshot:copy(q),world:s.world,reset:kind==='baseline'?'Only this question’s unfinished typed answer. Captured baseline answers and all other progress stay saved. Exit pauses the current question.':kind==='learning'?'Restart clears only this question’s unfinished answer and tools. Exit pauses this question exactly. Earlier answers, hints and assessment evidence stay saved.':'This unfinished activity’s draft and pretend inventory. Its completed steps and receipts stay in Earlier attempts; completed activities, learning coins, purchases and assessment evidence stay saved.'};
}
function stashLearning(s){if(!s.learning)return true;if(s.pausedLearning!==undefined&&(!s.pausedLearning||typeof s.pausedLearning!=='object'||Array.isArray(s.pausedLearning)))return false;s.pausedLearning||={};s.pausedLearning[s.learning.id+'|'+s.learning.mode]=copy(s.learning);return true;}
function restoreLearning(s,id,mode){if(mode==='discovery'&&s.discovery?.[id]?.complete)return false;const live=s.learning;if(live?.id===id&&live.mode===mode){if(s.pausedLearning)delete s.pausedLearning[id+'|'+mode];s.world=learningWorld(s);s.view=s.resumeView=learningView(live);return true;}const q=s.pausedLearning?.[id+'|'+mode];if(!q)return false;if(!stashLearning(s))return false;s.learning=copy(q);delete s.pausedLearning[id+'|'+mode];s.world=learningWorld(s);s.view=s.resumeView=learningView(q);return true;}
function recover(s,expected,mode){const{M,J,L,R,E}=modules(),t=target(s);if(!t||!expected||t.kind!==expected.kind||JSON.stringify(t.snapshot)!==JSON.stringify(expected.snapshot))return 'This activity changed. Open Get unstuck again; nothing was reset.';
 if(!['restart','exit'].includes(mode))return 'Choose restart or exit.';
 if(s.activityArchives!==undefined&&!Array.isArray(s.activityArchives))return 'Earlier attempts need review. Nothing was reset.';
 if(t.kind==='learning'&&mode==='exit'&&s.pausedLearning!==undefined&&(!s.pausedLearning||typeof s.pausedLearning!=='object'||Array.isArray(s.pausedLearning)))return 'Saved lessons are preserved; nothing was reset.';
 const q=t.snapshot;s.activityArchives||=[];s.activityArchives.push({kind:t.kind,name:t.label,reason:mode,snapshot:copy(q)});
 if(t.kind==='baseline'){if(mode==='restart'&&!s.startingProfile.areas[s.startingProfile.active].answered)s.startingProfile.areas[s.startingProfile.active].draft='';if(mode==='exit'){s.view='home';}return null;}
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
function saved(s){const{M,L}=modules(),out=[],add=(kind,key,world,q)=>{if(q)out.push({kind,key,world,label:label(s,kind==='town'?'town':kind==='mission'?'mission':kind,q)});};
 for(const [world,a]of Object.entries(s.startingProfile?.areas||{}))if(a?.question)out.push({kind:'baseline',key:world,world,label:'Starting points: '+modules().E.worlds.find(w=>w.id===world)?.name});
 const ls={...(s.pausedLearning||{})};if(s.learning)ls[s.learning.id+'|'+s.learning.mode]=s.learning;for(const[key,q]of Object.entries(ls)){if(!q||typeof q!=='object')continue;if(q?.mode==='discovery'&&s.discovery?.[q.id]?.complete||q?.mode==='practice'&&s.practice?.[q.id]?.completed&&s.practice[q.id].round>=q.round||q?.mode==='check'&&s.checks?.[q.id]?.round>=q.round)continue;add('learning',key,(typeof module!=='undefined'?require('./curriculum').V3Curriculum:root.V3Curriculum).skills.find(k=>k.id===q.id)?.world,q);}
 const ms={...(s.adventure?.suspended||{})};if(s.adventure?.active)ms[s.adventure.active.key]=s.adventure.active;for(const[key,q]of Object.entries(ms))if(q?.world)add('mission',key,q.world,q);
 for(const[key,q]of Object.entries(s.adventure?.townLifeV2?.runs||{}))if(q&&!q.done)add('town',key,'town',q);
 const qs={...(s.quests||{})};if(s.quest)qs[s.quest.world]=s.quest;for(const[key,q]of Object.entries(qs))if(q?.world)add('quest',key,q.world,q);
 if(s.adventure?.journeyV1&&!s.adventure.journeyV1.done)add('legacy-town','legacy','town',s.adventure.journeyV1);
 return out;
}
function pause(s){if(['lesson','practice','check','discovery'].includes(s.view)&&!stashLearning(s))return 'Your saved lessons need review. Nothing was reset.';const t=target(s);if(t)s.pausedActivity={kind:t.kind==='mission'?'mission':t.kind==='legacy-town'?'legacy-town':t.kind,key:t.kind==='learning'?t.snapshot.id+'|'+t.snapshot.mode:t.kind==='mission'?t.snapshot.key:t.kind==='quest'?t.snapshot.world:t.snapshot.id,world:s.world};if(s.view==='starting-area')s.pausedActivity={kind:'baseline',key:s.startingProfile.active,world:s.world};s.view='home';return null;}
function openSaved(s,kind,key){const entry=saved(s).find(x=>x.kind===kind&&x.key===key);if(!entry)return 'This saved activity is no longer available. Nothing was reset.';const P=typeof module!=='undefined'?require('./starting-profile').V11StartingProfile:root.V11StartingProfile;if(!P.complete(s)&&kind!=='baseline'){s.view='starting';return 'Find all nine starting points first. Your activity is safely saved.';}
 if(kind==='baseline'){const C=typeof module!=='undefined'?require('./curriculum').V3Curriculum:root.V3Curriculum;return P.start(s,key,C);}
 if(kind==='learning'){const q=s.learning?.id+'|'+s.learning?.mode===key?s.learning:s.pausedLearning[key];restoreLearning(s,q.id,q.mode);return null;}
 if(kind==='mission'){const a=modules().M.state(s);if(a.active)a.suspended[a.active.key]=a.active;a.active=a.suspended[key]||a.active;s.world=entry.world;s.view=s.resumeView='adventure';}
 if(kind==='town'){modules().L.book(s).active=key;s.adventure.townActive=2;s.world='town';s.view=s.resumeView='journey';}
 if(kind==='legacy-town'){s.adventure.townActive=1;s.world='town';s.view=s.resumeView='journey';}
 if(kind==='quest'){s.quest=s.quests?.[key]||s.quest;s.world=entry.world;s.view=s.resumeView='quest';}
 return null;
}
root.V10Navigation={summary,resume,target,recover,stashLearning,restoreLearning,saved,pause,openSaved};if(typeof module!=='undefined')module.exports={V10Navigation:root.V10Navigation};
})(typeof window==='undefined'?globalThis:window);
