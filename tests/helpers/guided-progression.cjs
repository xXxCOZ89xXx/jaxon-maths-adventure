const E=require('../../v3/engine').V3Engine,M=require('../../v3/adventure').V3Adventure,R=require('../../v3/restoration').V10Restoration,L=require('../../v3/town-life').V52TownLife;
const assess=(s,ids,band=7)=>ids.forEach(id=>s.discovery[id]={complete:true,answers:[],rounds:[{band,correct:2,total:4}]});
function fresh(){const s=E.fresh();s.tourSeen=true;s.coins=731;s.bought=['cap'];s.equipped=['cap'];s.customFuture={preserve:true};return s;}
function townStep(s){const t=L.task(s),j=L.state(s);if(['order','match'].includes(t.kind))j.values.order=t.answer.slice();else if(['basket','budget'].includes(t.kind))j.values.parts=t.answer.slice();else if(['journey','choice'].includes(t.kind))j.values.choice=t.answer;else if(t.kind==='coins')j.values.coins=[t.answer];else j.values.amount=t.answer;if(!L.action(s,'j-submit')||!L.next(s))throw Error('Invalid fictional Town fixture');}
function completedTown(recipe=false){const s=fresh();if(recipe)L.startRecipe(s,'bolognese',2);else L.start(s,'cook-pasta',2);while(!L.state(s).done)townStep(s);s.view='home';s.resumeView=null;return s;}
function restoration(world,stage=0){const s=fresh();assess(s,R.mapping[world].flat());for(let i=0;i<stage;i++)s.milestones.push(world+':'+i);const err=R.start(s,world,stage);if(err)throw Error(err);return s;}
module.exports={E,M,R,L,fresh,assess,townStep,completedTown,restoration};
