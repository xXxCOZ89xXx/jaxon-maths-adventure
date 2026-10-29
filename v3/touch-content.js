/* Versioned questions served by the normal bank. No fixtures, accounts or rewards. */
(function(root){
'use strict';
const kinds={place:['round','round'],negative:['line','line'],decimal_place:['line','line'],fractions:['fraction','fraction'],fraction_parts:['fraction','fraction'],fraction_operations:['fraction','fraction'],algebra_coordinates:['grid','grid'],algebra_graphs:['grid','grid'],geometry_construction:['ruler','ruler'],ratio_sharing:['share','share'],stats_averages:['mean','mean'],stats_tables:['groups','groups'],statistics_distributions:['groups','groups'],prob_events:['events','events'],probability_sets:['events','events'],measure_units:['ruler','jug'],measure_volume:['jug','jug'],town_totals:['basket','basket'],town_value:['basket','basket'],town_household:['basket','jug'],town_planning:['basket','jug']};
function row(id,band,seed,family=0){
 const type=kinds[id]?.[family];if(!type)return null;
 const n=1+((seed*13+band*3+family*3)%7),m=2+((seed*7+band+family*2)%5),step=band>=8?.5:1;
 let prompt,answer,spec,hint,worked;
 if(type==='round'){
  const scale=band>=8?1000:band>=7?100:10,raw=n*scale+m*scale/10+(scale>10?scale/100:0);answer=String(Math.round(raw/scale)*scale);spec={kind:'numberline',min:0,max:scale*10,step:scale,unit:'units',labelsEvery:scale>=100?2:1,scaleNote:'Each short division is '+scale+' units.'};prompt=`Round ${raw} to the nearest ${scale}. Drag the marker to the rounded value.`;hint=`Find the neighbouring multiples of ${scale}. Choose the closer one; a halfway value rounds up.`;worked=`${raw} rounds to ${answer} to the nearest ${scale}. Check the marker against the labelled scale.`;
 }else if(type==='line'){
  const decimal=id==='decimal_place',a=decimal?(n*10+m)/10:-n,b=decimal?m/10:(family?m:-m);
  answer=Number((a+b).toFixed(2));spec={kind:'numberline',min:decimal?0:-20,max:decimal?10:20,step:decimal?.1:1,unit:decimal?'units':'units'};
  prompt=`${a} + (${b}) = ? Move the marker to the sum.`;hint='Start at the first value. Move right to add a positive value; left to add a negative value.';worked=`${a} + (${b}) = ${answer}. The marker represents this value on the labelled line.`;
 }else if(type==='fraction'){
  const den=[4,5,8,10][(seed+band+family)%4],a=1+n%(den-1),b=id==='fraction_operations'?1+m%(den-1):0,count=a+b;
  answer=String(count/den);spec={kind:'fraction',denominator:den,slots:den*(count>den?2:1),pieces:den*(count>den?2:1)};
  prompt=b?`Build ${a}/${den} + ${b}/${den} using equal fraction pieces.`:`Build ${a}/${den} of a whole using equal fraction pieces.`;
  hint=`Each piece is 1/${den} of one whole. Count the equal pieces, keeping the denominator ${den}.`;worked=`${a}${b?' + '+b:''} = ${count} equal pieces. ${count}/${den} = ${answer} of a whole. Any distinct slots are accepted.`;
 }else if(type==='grid'){
  const x=n-4,slope=band>=8?2:1,intercept=m-3,y=id==='algebra_graphs'?slope*x+intercept:family?m-4:4-m;
  // Keep the authored relation visible within this plane, rather than clipping answers.
  const px=id==='algebra_graphs'?((seed+family)%3)-1:x,py=id==='algebra_graphs'?slope*px+intercept:y;
  answer=JSON.stringify([px,py]);spec={kind:'grid',min:-5,max:5};prompt=id==='algebra_graphs'?`For y = ${slope}x ${intercept<0?'− '+(-intercept):'+ '+intercept}, plot the point where x = ${px}.`:`Move the point to (${px}, ${py}). Read x first, then y.`;
  hint='Use the horizontal x axis first, then the vertical y axis. Each grid division is one unit.';worked=`The horizontal coordinate is ${px}; the vertical coordinate is ${py}. The point is (${px}, ${py}).`;
 }else if(type==='ruler'){
  const length=2+n*step,label=String.fromCharCode(65+Math.round(length*2));answer=String(length);spec={kind:'ruler',length,label,unit:'cm',max:12,step:band>=8?.5:1,objectX:80,objectY:115};
  // The diagram label is stable for identical geometry, never a fresh round suffix.
  prompt=`Measure ${id==='geometry_construction'?'construction segment':'wooden strip'} ${label} in centimetres. Align the ruler's zero with its left end, then move the reading marker to the right end.`;
  hint='Move the ruler, not the object. Put the zero at the left end. Read the scale at the other end; count divisions, not tick marks.';worked=`When zero is at the left end, the right end is at ${length} cm. The length is ${length} cm, even if the ruler started elsewhere.`;
 }else if(type==='jug'){
  const volume=(n+2)*50+(band>=8?25:0);answer=String(volume);spec={kind:'jug',min:0,max:1000,step:25,unit:'ml'};
  prompt=`Measure ${volume/1000} litres of water for a recipe. Drag the jug's pour handle to fill the receiving container, in millilitres.`;
  hint='One litre is 1000 ml. Convert the target first. Move the pour handle slowly; release to save. You can return liquid or empty the jug.';worked=`${volume/1000} × 1000 = ${volume} ml. Read the receiving container's scale and stop at ${volume} ml.`;
 }else if(type==='basket'){
  const price=20+n*5,prices=[price,price+15,price+40,price+75];answer=String(2*price+40);
  spec={kind:'basket',items:['Apples','Milk','Bread','Rice'].map((label,i)=>({label,price:prices[i]})),targets:['Shopping basket'],requiredCount:2};
  prompt=`You are a customer. Buy exactly two different groceries with a total of ${answer}p. Drag them into the basket. Check all four prices before choosing.`;
  hint='Add the prices of two different items. Compare the total with your budget. Return an item to the shelf to compare another pair.';worked=`Apples ${price}p + bread ${price+40}p = ${answer}p. That is two different groceries with the requested total.`;
 }else if(type==='share'){
  const ratio=2+family,scale=1+n%3,total=(ratio+1)*scale;answer=JSON.stringify([ratio*scale,scale]);
  spec={kind:'groups',items:Array.from({length:total},(_,i)=>({label:'Token '+(i+1)})),targets:['Alex','Sam'],counts:true};
  prompt=`Share ${total} tokens between Alex and Sam in the ratio ${ratio}:1. Drag every token into a group.`;hint=`There are ${ratio+1} ratio parts. Divide ${total} by ${ratio+1}, then give Alex ${ratio} parts and Sam one.`;worked=`Each part is ${scale}. Alex gets ${ratio*scale} and Sam gets ${scale}. The identities of equal tokens do not matter.`;
 }else{
  const start=n,limit=start+2,events=type==='events';
  const items=(events?Array.from({length:6},(_,i)=>start+i):[n%6,m%6,(n+m)%6,(2*n)%6,(m+2)%6,5].map(x=>start+x)).sort((a,b)=>a-b);
  // The same data multiset/property always has the same order. Shuffling alone
  // therefore cannot manufacture a fresh independent question.
  let rng=2166136261;for(const ch of items.join(',')+':'+(events?m:limit))rng=Math.imul(rng^ch.charCodeAt(0),16777619)>>>0;
  for(let i=items.length-1;i>0;i--){rng=(Math.imul(rng,1664525)+1013904223)>>>0;const j=rng%(i+1);[items[i],items[j]]=[items[j],items[i]];}

  const expected=items.map(x=>events?x%m===0?0:1:x<=limit?0:1);
  answer=JSON.stringify(expected);spec={kind:'groups',items:items.map(x=>({label:String(x),value:x})),targets:events?[`Multiples of ${m}`,'Other outcomes']:[`${start} to ${limit} inclusive`,`${limit+1} to ${start+5} inclusive`],counts:false};
  prompt=events?`The possible equally likely outcomes are ${items.join(', ')}. Sort every outcome into “multiple of ${m}” or “other”.`:`Build two frequency groups. Sort the observations ${items.join(', ')} into the displayed inclusive class intervals.`;
  hint=events?`A multiple of ${m} divides by ${m} with no remainder. Classify each outcome once.`:'Inclusive means both end values belong in that interval. Sort each observation once; the group count is its frequency.';worked=items.map((x,i)=>`${x}: ${spec.targets[expected[i]]}`).join('; ')+'.';
 }
 if(type==='mean'){
  const mean=n,delta=m;answer=String(mean);spec={kind:'numberline',min:0,max:20,step:1,unit:'units'};
  prompt=`The observations are ${mean-delta}, ${mean}, ${mean+delta}. Calculate the mean and move the marker to it.`;hint='Add all three observations, then divide by three. The marker shows the mean, not the total.';worked=`(${mean-delta} + ${mean} + ${mean+delta}) ÷ 3 = ${mean}.`;
 }
 const meta={contentVersion:9,id:`${id}:direct-v1:b${band}:s${seed}:f${family}`,family:`${id}:direct:${family}`,band,direct:{...spec,version:1},misconception:worked};
 return [prompt,String(answer),[],hint,worked,meta];
}
function install(B,ED){const before=ED.example;ED.example=(id,qs,band,round)=>{if(kinds[id])for(let seed=round+101;seed<round+201;seed++){const q=row(id,band,seed,1);if(!qs.some(x=>x[0]===q[0]||x[1]===q[1]))return q;}return before(id,qs,band,round);};
 return {...B,create(id,band,round,options={}){const qs=B.create(id,band,round,options);if(!kinds[id])return qs;const used=new Set(options.exclude||[]);for(const q of qs)used.add(q[0]);for(const [family,index]of [[0,0],[1,3]]){for(let attempt=0;attempt<100;attempt++){const q=row(id,band,round+attempt,family);if(!used.has(q[0])){qs[index]=q;used.add(q[0]);break;}}}return qs;}};
}
// Only newly created mission snapshots receive new tasks. Old saved tasks are untouched.
function task(t,band,seed,index){if(!kinds[t.skill]||t.skill==='place'||index%3!==0)return t;const q=row(t.skill,band,seed+index*11,Math.floor(index/3)%2);return {...(t.venue?{venue:t.skill.startsWith('town_')&&q[5].direct.kind==='basket'?'market':t.venue}:{}),...(t.title?{title:t.title}:{}),kind:'direct',skill:t.skill,band,contentVersion:9,questionId:q[5].id,prompt:q[0],answer:q[1],direct:q[5].direct,teach:q[3],hint:q[3],worked:q[4],example:row(t.skill,Math.max(5,band-1),seed+101,1)[4],examplePrompt:row(t.skill,Math.max(5,band-1),seed+101,1)[0]};}
root.V9TouchContent={kinds,row,task,install};
if(root.JaxonFreshReview&&root.V6Education)root.JaxonFreshReview=install(root.JaxonFreshReview,root.V6Education);
if(typeof module!=='undefined')module.exports={V9TouchContent:root.V9TouchContent};
})(typeof window==='undefined'?globalThis:window);
