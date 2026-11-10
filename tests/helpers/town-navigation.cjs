const F=require('./guided-progression.cjs');
function completed(){
 const s=F.completedTown();
 for(const route of ['market','shops']){
  F.M.start(s,'town',route,1);
  while(F.M.current(s)){
   const q=F.M.current(s),t=q.tasks[q.i];F.M.begin(s);
   if(['basket','offers','budget','blocks','array','chart','volume'].includes(t.kind))F.M.edit(s,'parts',t.answer);
   else if(['order','match'].includes(t.kind))F.M.edit(s,'order',t.answer);
   else if(t.kind==='journey')F.M.edit(s,'choice',t.answer);
   else if(t.kind==='coins'){let n=t.answer,a=[];for(const p of [5000,2000,1000,500,200,100,50,20,10,5,2,1])while(n>=p){a.push(p);n-=p;}F.M.edit(s,'coins',a);}
   else F.M.edit(s,'amount',t.answer);
   if(!F.M.submit(s))throw Error('Invalid completed fixture: '+t.kind);F.M.next(s);
  }
 }
 s.view='world';s.world='town';s.resumeView=null;return s;
}
module.exports={completed};
