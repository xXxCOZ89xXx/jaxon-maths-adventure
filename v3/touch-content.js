/* Versioned questions served by the normal bank. No fixtures, accounts or rewards. */
(function(root){
'use strict';
const kinds={place:['round','round'],negative:['line','line'],decimal_place:['line','line'],fractions:['fraction','fraction'],fraction_parts:['fraction','fraction'],fraction_operations:['fraction','fraction'],algebra_coordinates:['grid','grid'],algebra_graphs:['grid','grid'],geometry_construction:['ruler','ruler'],ratio_sharing:['share','share'],stats_averages:['mean','mean'],stats_tables:['groups','groups'],statistics_distributions:['groups','groups'],prob_events:['events','events'],probability_sets:['events','events'],measure_units:['ruler','jug'],measure_volume:['jug','jug'],town_totals:['basket','basket'],town_value:['basket','basket'],town_household:['basket','jug'],town_planning:['basket','jug'],decimals:['percent','percent'],algebra_patterns:['sequence','sequence'],algebra_missing:['missing','missing'],measure_mass:['mass','mass'],measure_speed:['speed','speed'],measure_time:['duration','clock'],geometry_circle:['circle','circle'],geometry_area:['area','area'],algebra_equations:['balance','balance'],ratio_proportion:['bar','bar'],ratio_rates:['bar','bar'],ratio_percentages:['bar','bar'],algebra_expressions:['bar','bar']};
// B2: these use number-line or code-drawn models in lessons only; their missions keep their own models.
const time12=t=>{t=(t%1440+1440)%1440;const h=Math.floor(t/60);return `${(h+11)%12+1}:${String(t%60).padStart(2,'0')} ${h<12?'am':'pm'}`;};
const LESSON_ONLY=new Set(['decimals','algebra_patterns','algebra_missing','measure_mass','measure_speed','measure_time','geometry_circle','geometry_area','algebra_equations','ratio_proportion','ratio_rates','ratio_percentages','algebra_expressions']);
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
  prompt=`You are a customer. Buy exactly two different groceries with a total of £${(Number(answer)/100).toFixed(2)}. Drag them into the basket. Check all four prices before choosing.`;
  hint='Add the prices of two different items. Compare the total with your budget. Return an item to the shelf to compare another pair.';worked=`Apples £${(price/100).toFixed(2)} + bread £${((price+40)/100).toFixed(2)} = £${(Number(answer)/100).toFixed(2)}. That is two different groceries with the requested total.`;
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
 // B2: number-line models for skills that previously offered only typed or choice answers.
 const line=(min,max,lineStep,unit,scaleNote)=>({kind:'numberline',min,max,step:lineStep,unit,scaleNote});
 if(type==='percent'){
  const pc=(n+m+(family?3:0))*5;
  if(family){answer=String(pc);spec=line(0,100,5,'%','Each short division is 10%. The step buttons move 5%.');prompt=`Write ${pc/100} as a percentage. Move the marker to it.`;hint='A percentage is a number out of 100. Multiply the decimal by 100.';worked=`${pc/100} × 100 = ${pc}, so ${pc/100} = ${pc}%.`;}
  else{answer=String(pc/100);spec=line(0,1,.05,'','Each short division is 0.1. The step buttons move 0.05.');prompt=`Write ${pc}% as a decimal. Move the marker to it.`;hint='Per cent means out of 100. Divide the percentage by 100.';worked=`${pc}% = ${pc} ÷ 100 = ${pc/100}.`;}
 }else if(type==='sequence'){
  const a=n,d=m+(band>=8?2:0),term=family?6:5,value=a+(term-1)*d;answer=String(value);spec=line(0,50,1,'','Each short division is 5. The step buttons move 1.');
  prompt=`The sequence ${a}, ${a+d}, ${a+2*d}, … goes up by the same amount each time. Move the marker to term ${term}.`;hint='Find the difference between neighbouring terms. Keep adding it until you reach the term you need.';worked=`The difference is ${d}. Term ${term} = ${a} + ${term-1} × ${d} = ${value}.`;
 }else if(type==='missing'){
  const x=n+m+(band>=8?5:0),b=m+1,total=x+b;answer=String(x);spec=line(0,20,1,'','Each short division is 2. The step buttons move 1.');
  prompt=family?`${total} − □ = ${b}. Move the marker to the missing number.`:`□ + ${b} = ${total}. Move the marker to the missing number.`;hint=family?'What must be taken away from the first number to leave the second? Use the inverse.':'Undo adding by subtracting the same amount from the total.';worked=`${total} − ${b} = ${x}, so the missing number is ${x}.`;
 }else if(type==='mass'){
  const fine=band>=8?25:0,massStep=fine?25:50;
  if(family){const a=n*100+200,b=m*50+fine;answer=String(a+b);prompt=`A box of apples has a mass of ${a} g. The packing adds ${b} g. Move the scale marker to the total mass in grams.`;hint='Both masses are in grams. Add them.';worked=`${a} g + ${b} g = ${a+b} g.`;}
  else{const grams=n*100+m*50;answer=String(grams);prompt=`A bag of flour has a mass of ${grams/1000} kg. Move the scale marker to its mass in grams.`;hint='One kilogram is 1000 grams. Multiply the kilograms by 1000.';worked=`${grams/1000} × 1000 = ${grams}, so the mass is ${grams} g.`;}
  spec=line(0,2000,massStep,'g','Each short division is 200 g. The step buttons move '+massStep+' g.');
 }else if(type==='speed'){
  const v=4+m*2,hours=1+n%3+(band>=8?.5:0),d=v*hours;
  if(family){answer=String(v);spec=line(0,20,1,'km/h','Each short division is 2 km/h. The step buttons move 1 km/h.');prompt=`A walker covers ${d} km in ${hours} hours at a steady speed. Move the marker to the speed in km/h.`;hint='Speed = distance ÷ time.';worked=`${d} km ÷ ${hours} hours = ${v} km/h.`;}
  else{answer=String(d);spec=line(0,60,1,'km','Each short division is 6 km. The step buttons move 1 km.');prompt=`A cyclist rides at ${v} km/h for ${hours} hours. Move the marker to the distance travelled in km.`;hint='Distance = speed × time.';worked=`${v} km/h × ${hours} hours = ${d} km.`;}
 }else if(type==='duration'){
  const clock=t=>{const h=Math.floor(t/60),mm=t%60;return `${(h+11)%12+1}:${String(mm).padStart(2,'0')} ${h<12?'am':'pm'}`;};
  const start=family?11*60+30+n*5:14*60+n*5,len=30+m*15+(band>=8?n*5:0),end=start+len,toHour=(60-start%60)%60;answer=String(len);spec=line(0,200,5,'minutes','Each short division is 20 minutes. The step buttons move 5 minutes.');
  prompt=`A ${family?'swimming lesson':'film'} starts at ${clock(start)} and ends at ${clock(end)}. Move the marker to how long it lasts, in minutes.`;hint='Count on to the next full hour first. Then count on to the end time and add the two parts.';worked=toHour?`${clock(start)} to ${clock(start+toHour)} is ${toHour} minutes. Then ${len-toHour} more minutes to ${clock(end)}. ${toHour} + ${len-toHour} = ${len} minutes.`:`From ${clock(start)} to ${clock(end)} is ${len} minutes.`;
 }else if(type==='circle'){
  const r=n+(band>=8&&family?.5:0);spec=line(0,20,band>=8?.5:1,'cm','Each short division is 2 cm.');
  if(family){answer=String(r);prompt=`A round table top has a diameter of ${2*r} cm. Move the marker to its radius in centimetres.`;hint='The radius goes from the centre to the edge. It is half the diameter.';worked=`Radius = ${2*r} ÷ 2 = ${r} cm.`;}
  else{answer=String(2*r);prompt=`A circle has a radius of ${r} cm. Move the marker to its diameter in centimetres.`;hint='The diameter goes right across the circle through the centre. It is two radii long.';worked=`Diameter = 2 × ${r} = ${2*r} cm.`;}
 }else if(type==='area'){
  // Area tiles: a rectangle, or an L shape with one corner cut away.
  const W=family?n+3:n+2+(band>=8&&n<7?1:0),H=family?m+2:m,cw=1+n%3,ch=1+m%3,cells=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!(family&&x>=W-cw&&y<ch))cells.push([x,y]);
  const area=cells.length;answer=String(area);spec={kind:'tiles',cols:W,rows:H,cells,unit:'m²',label:family?'L-shaped garden on a 1 m grid':'Rectangular rug on a 1 m grid'};
  if(family){prompt=`An L-shaped garden fits in ${W===8?'an':'a'} ${W} m by ${H} m rectangle, with a ${cw} m by ${ch} m corner cut away. Cover it with 1 m square tiles. What is its area in m²?`;hint='Split the L shape into two rectangles, or find the whole rectangle and take away the missing corner.';worked=`${W} × ${H} = ${W*H}. The missing corner is ${cw} × ${ch} = ${cw*ch}. ${W*H} − ${cw*ch} = ${area} m².`;}
  else{prompt=`A rectangular rug is ${W} m long and ${H} m wide. Cover it with 1 m square tiles. What is its area in m²?`;hint='Count the tiles in one row, then multiply by the number of rows.';worked=`${H} rows of ${W} tiles: ${H} × ${W} = ${area} m².`;}
 }else if(type==='balance'){
  const a=family?2+(band>=8?1:0):1+(band>=8?1:0),x=n+1,b=m,c=a*x+b,ax=a===1?'':String(a);answer=String(x);spec={kind:'balance',x:a,left:b,right:c};
  prompt=`Solve ${ax}x + ${b} = ${c}. Use the balance: take the same from both sides, then share what is left between the x tiles.`;hint='Whatever you do to one side, do to the other. Take the loose units away from the x side first.';worked=`${ax}x + ${b} = ${c}. Take ${b} from both sides: ${ax}x = ${c-b}.`+(a===1?'':` Share ${c-b} between ${a}: x = ${x}.`);
 }else if(type==='bar'){
  // Bar model: one whole split into k equal parts; j parts are needed.
  const k=2+n%4+(band>=8?1:0),j=1+m%(k-1);let u,unit='',prefix='',label;
  if(id==='ratio_percentages'){
   const p=[10,20,25,50,75,30,40][(n+m+family)%7],parts=p%25===0?4:10,each=(m+2)*(band>=8?5:1),whole=parts*each,count=p/100*parts;answer=String(count*each);
   spec={kind:'bar',whole,unit:'',prefix:family?'£':'',label:family?'Original price':'The whole',maxParts:12};
   prompt=family?`A coat costs £${whole}. It has ${p}% off. How much money is taken off, in pounds? Split the bar into equal parts and shade ${p}%.`:`Find ${p}% of ${whole}. Split the bar into equal parts and shade ${p}%.`;hint=parts===4?'25% is one quarter. Split the bar into 4 equal parts.':'10% is one tenth. Split the bar into 10 equal parts.';worked=`${whole} ÷ ${parts} = ${each}, so each part is ${100/parts}%. ${p}% is ${count} part${count===1?'':'s'}: ${count} × ${each} = ${count*each}.`;
  }else{
   if(id==='ratio_proportion'){u=family?(m+1)*25:2+m;unit=family?'g':'';prefix=family?'':'£';label=family?`Flour for ${k} people`:`${k} tickets`;
    prompt=family?`A recipe for ${k} people uses ${k*u} g of flour. How much flour is needed for ${j} ${j===1?'person':'people'}, in grams?`:`${k} cinema tickets cost £${k*u}. Each ticket costs the same. How much ${j===1?'does 1 ticket':'do '+j+' tickets'} cost, in pounds?`;hint=`Split the whole into ${family?'one part per person':'one part per ticket'}. Then shade the number you need.`;worked=family?`${k*u} g ÷ ${k} = ${u} g per person. ${j} × ${u} = ${j*u} g.`:`£${k*u} ÷ ${k} = £${u} per ticket. ${j} × £${u} = £${j*u}.`;}
   else if(id==='ratio_rates'){u=family?(m+1)*5:n+2;unit=family?'pages':'litres';label=family?`Pages in ${k} minutes`:`Water in ${k} minutes`;
    prompt=family?`A printer prints ${k*u} pages in ${k} minutes at a steady rate. How many pages does it print in ${j} ${j===1?'minute':'minutes'}?`:`A tap fills ${k*u} litres in ${k} minutes at a steady rate. How many litres does it fill in ${j} ${j===1?'minute':'minutes'}?`;hint='Split the whole into one part per minute. Then shade the minutes you need.';worked=`${k*u} ÷ ${k} = ${u} ${unit} per minute. ${j} × ${u} = ${j*u} ${unit}.`;}
   else{u=m+1;label=family?`${k} boxes of n pencils`:`${k}n`;const jn=j===1?'n':j+'n';
    prompt=family?`Sam has ${k} boxes with n pencils in each. That is ${k*u} pencils in all, so ${k}n = ${k*u}. Use the bar to find ${jn}.`:`${k}n = ${k*u}. Use the bar to find the value of ${jn}.`;hint=`The whole bar is ${k}n, so split it into ${k} equal parts. Each part is n.`;worked=`${k}n = ${k*u}, so n = ${k*u} ÷ ${k} = ${u}.`+(j===1?'':` ${j}n = ${j} × ${u} = ${j*u}.`);}
   answer=String(j*u);spec={kind:'bar',whole:k*u,unit,prefix,label,maxParts:12};
  }
 }else if(type==='clock'){
  const start=9*60+30+n*5,len=15+m*10+(band>=8?n*5:0),end=start+len,toHour=(60-start%60)%60;answer=String(len);spec={kind:'clock',start,min:0,max:240,step:5};
  prompt=`A bus leaves at ${time12(start)} and arrives at ${time12(end)}. Move the clock on from the start time to the arrival time. How many minutes is the journey?`;hint='Move the minute hand on to the next o’clock first, then on to the arrival time. Add the two parts.';worked=toHour?`${time12(start)} to ${time12(start+toHour)} is ${toHour} minutes. Then ${len-toHour} more minutes to ${time12(end)}. ${toHour} + ${len-toHour} = ${len} minutes.`:`From ${time12(start)} to ${time12(end)} is ${len} minutes.`;
 }
 const meta={contentVersion:9,id:`${id}:direct-v1:b${band}:s${seed}:f${family}`,family:`${id}:direct:${family}`,band,direct:{...spec,version:1},misconception:worked};
 return [prompt,String(answer),[],hint,worked,meta];
}
function install(B,ED){const before=ED.example;ED.example=(id,qs,band,round)=>{if(kinds[id])for(let seed=round+101;seed<round+201;seed++){const q=row(id,band,seed,1);if(!qs.some(x=>x[0]===q[0]||x[1]===q[1]))return q;}return before(id,qs,band,round);};
 return {...B,create(id,band,round,options={}){const qs=B.create(id,band,round,options);if(!kinds[id])return qs;const used=new Set(options.exclude||[]);for(const q of qs)used.add(q[0]);for(const [family,index]of [[0,0],[1,3]]){for(let attempt=0;attempt<100;attempt++){const q=row(id,band,round+attempt,family);if(!used.has(q[0])){qs[index]=q;used.add(q[0]);break;}}}return qs;}};
}
// Only newly created mission snapshots receive new tasks. Old saved tasks are untouched.
function task(t,band,seed,index){if(!kinds[t.skill]||LESSON_ONLY.has(t.skill)||t.skill==='place'||index%3!==0)return t;const q=row(t.skill,band,seed+index*11,Math.floor(index/3)%2);return {...(t.venue?{venue:t.skill.startsWith('town_')&&q[5].direct.kind==='basket'?'market':t.venue}:{}),...(t.title?{title:t.title}:{}),kind:'direct',skill:t.skill,band,contentVersion:9,questionId:q[5].id,prompt:q[0],answer:q[1],direct:q[5].direct,teach:q[3],hint:q[3],worked:q[4],example:row(t.skill,Math.max(5,band-1),seed+101,1)[4],examplePrompt:row(t.skill,Math.max(5,band-1),seed+101,1)[0]};}
root.V9TouchContent={kinds,row,task,install};
if(root.JaxonFreshReview&&root.V6Education)root.JaxonFreshReview=install(root.JaxonFreshReview,root.V6Education);
if(typeof module!=='undefined')module.exports={V9TouchContent:root.V9TouchContent};
})(typeof window==='undefined'?globalThis:window);
