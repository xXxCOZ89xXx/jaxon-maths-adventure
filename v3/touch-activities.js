/* Shared pointer/tap/keyboard models. Pointer previews stay transient until release.
 * Only the caller's normal save transaction can commit an answer. No rewards/network. */
(function(root){
'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=x=>JSON.parse(JSON.stringify(x)),clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const snap=(n,min,max,step=1)=>Number(clamp(min+Math.round((n-min)/step)*step,min,max).toFixed(6));
function edit(a,values,action){
 if(!action||typeof action!=='object')return false;
 const v=values.d9||(values.d9={}),number=Number.isFinite;
 if(action.op==='reset'){values.d9={};return true;}
 if(action.op==='pick'){if(!Number.isInteger(action.item)||action.item<0||action.item>=(a.items?.length||a.pieces||0))return false;v.picked=action.item;return true;}
 if(action.op==='drop'){
  const count=a.items?.length||a.pieces||0,target=action.target,item=action.item??v.picked;
  if(!['fraction','groups','basket'].includes(a.kind)||!Number.isInteger(item)||item<0||item>=count||!Number.isInteger(target)||target< -1||target>=(a.kind==='fraction'?a.slots:a.targets.length))return false;
  v.placements||={};if(a.kind==='fraction'&&target>=0&&Object.entries(v.placements).some(([i,n])=>Number(i)!==item&&n===target))return false;
  if(target===-1)delete v.placements[item];else v.placements[item]=target;delete v.picked;return true;
 }
 if(action.op==='value'&&['numberline','jug'].includes(a.kind)&&number(action.value)){v.value=snap(action.value,a.min,a.max,a.step);return true;}
 if(action.op==='point'&&a.kind==='grid'&&Array.isArray(action.point)&&action.point.length===2&&action.point.every(number)){v.point=action.point.map(n=>snap(n,a.min,a.max));return true;}
 if(action.op==='ruler'&&a.kind==='ruler'&&number(action.x)&&number(action.y)){v.ruler=[snap(action.x,0,170,1),snap(action.y,65,235,1)];return true;}
 if(action.op==='reading'&&a.kind==='ruler'&&number(action.value)){v.reading=snap(action.value,0,a.max,a.step);return true;}
 // B2 code-drawn models: area tiles, balance with algebra tiles, bar model and clock face.
 const toggle=(list,i)=>{const on=new Set(list||[]);if(on.has(i))on.delete(i);else on.add(i);return [...on].sort((x,y)=>x-y);};
 if(a.kind==='tiles'){
  if(action.op==='cell'&&Number.isInteger(action.cell)&&action.cell>=0&&action.cell<a.cells.length){v.cells=toggle(v.cells,action.cell);return true;}
  if(action.op==='row'&&Number.isInteger(action.row)&&a.cells.some(c=>c[1]===action.row)){const on=new Set(v.cells||[]);a.cells.forEach((c,i)=>{if(c[1]===action.row)on.add(i);});v.cells=[...on].sort((x,y)=>x-y);return true;}
 }
 if(a.kind==='balance'){
  if(action.op==='remove'&&Number.isInteger(action.value)&&action.value>=0&&action.value<=a.left){v.removed=action.value;if(action.value!==a.left)delete v.shared;return true;}
  if(action.op==='share'&&typeof action.value==='boolean'&&(!action.value||(v.removed||0)===a.left)){if(action.value)v.shared=true;else delete v.shared;return true;}
 }
 if(a.kind==='bar'){
  const parts=v.parts||1;
  if(action.op==='split'&&Number.isInteger(action.value)&&action.value>=1&&action.value<=(a.maxParts||12)){v.parts=action.value;v.shaded=(v.shaded||[]).filter(i=>i<action.value);return true;}
  if(action.op==='shade'&&Number.isInteger(action.part)&&action.part>=0&&action.part<parts){v.shaded=toggle(v.shaded,action.part);return true;}
  if(action.op==='shadeTo'&&Number.isInteger(action.value)&&action.value>=0&&action.value<=parts){v.shaded=Array.from({length:action.value},(_,i)=>i);return true;}
 }
 if(a.kind==='clock'){
  if(action.op==='value'&&Number.isInteger(action.value)&&action.value>=0&&action.value<=a.max&&action.value%a.step===0){v.value=action.value;return true;}
  if(action.op==='minute'&&Number.isInteger(action.value)&&action.value>=0&&action.value<60&&action.value%a.step===0){const e=v.value||0,delta=(action.value-(a.start+e)%60+60)%60;if(e+delta>a.max)return false;v.value=e+delta;return true;}
 }
 return false;
}
const time12=t=>{t=(t%1440+1440)%1440;const h=Math.floor(t/60);return `${(h+11)%12+1}:${String(t%60).padStart(2,'0')} ${h<12?'am':'pm'}`;};
const amount=(a,n)=>a.prefix?a.prefix+n:n+(a.unit?' '+a.unit:'');
function value(a,values={}){const v=values.d9||{},p=v.placements||{};
 if(a.kind==='grid')return JSON.stringify(v.point||[0,0]);
 if(a.kind==='ruler')return String(v.reading??0);
 if(a.kind==='fraction')return String(Object.keys(p).length/a.denominator);
 if(a.kind==='groups')return JSON.stringify(a.counts?a.targets.map((_,n)=>Object.values(p).filter(x=>x===n).length):a.items.map((_,i)=>p[i]??-1));
 if(a.kind==='basket')return String(Object.keys(p).reduce((sum,i)=>sum+a.items[i].price,0));
 if(a.kind==='tiles')return String((v.cells||[]).length);
 if(a.kind==='balance')return v.shared&&(v.removed||0)===a.left?String((a.right-a.left)/a.x):'not finished';
 if(a.kind==='bar')return String(Number(((v.shaded||[]).length*a.whole/(v.parts||1)).toFixed(6)));
 return String(v.value??a.min??0);
}
function matches(a,answer,values={}){
 const v=values.d9||{},actual=value(a,values);
 if(a.kind==='grid'&&!Array.isArray(v.point))return false;
 if(['numberline','jug'].includes(a.kind)&&v.value===undefined)return false;
 if(a.kind==='ruler'){const [x,y]=v.ruler||[25,225];if(Math.abs(x-a.objectX)>6||Math.abs(y-a.objectY)>6)return false;}
 if(a.kind==='basket'&&Object.keys(v.placements||{}).length!==a.requiredCount)return false;
 if(a.kind==='groups'&&Object.keys(v.placements||{}).length!==a.items.length)return false;
 // A B2 model is only marked once something has been built with it.
 if(a.kind==='tiles'&&!(v.cells||[]).length)return false;
 if(a.kind==='balance'&&!(v.shared&&(v.removed||0)===a.left))return false;
 if(a.kind==='bar'&&!(v.shaded||[]).length)return false;
 if(a.kind==='clock'&&v.value===undefined)return false;
 if(['grid','groups'].includes(a.kind))return actual===String(answer);
 const parse=x=>{const p=String(x).split('/');return p.length===2?Number(p[0])/Number(p[1]):Number(x);};
 return Number.isFinite(parse(answer))&&Math.abs(Number(actual)-parse(answer))<1e-7;
}
function body(a,values={},prefix='d9-p',preview=false){
 const v=values.d9||{},p=v.placements||{};
 const button=(label,action,attrs='')=>`<button type="button" data-d9-action="${esc(JSON.stringify(action))}" data-d9-focus="${esc(action.op==='pick'?'item-'+action.item:label)}" ${attrs}>${esc(label)}</button>`;
 const handle=(kind,x,y,label)=>`<g ${kind==='line'?'':'data-d9-handle="'+kind+'"'} class="d9-handle"><circle cx="${x}" cy="${y}" r="42" fill="transparent"/><circle cx="${x}" cy="${y}" r="17" fill="${kind==='line'?'transparent':'#174f39'}" stroke="${kind==='line'?'#173d30':'white'}" stroke-width="3"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="white" font-size="16">${kind==='line'?'':'↔'}</text><title>${esc(label)}</title></g>`;
 const svg=(label,content,box='0 0 600 320')=>`<svg class="d9-canvas" viewBox="${box}" role="group" aria-label="${esc(label)}">${content}</svg>`;
 const tick=(x,y,text)=>`<path d="M${x} ${y-6}v12" stroke="#34563e"/><text x="${x}" y="${y+30}" text-anchor="middle">${esc(text)}</text>`;
 const selected=v.picked===undefined?'No item selected':`Selected item ${v.picked+1}`;
 let html='';
 if(['basket','groups','fraction'].includes(a.kind)){
  const items=a.items||Array.from({length:a.pieces},(_,i)=>({label:`Piece ${i+1}: 1/${a.denominator}`}));
  const item=(i)=>button(items[i].label+(items[i].price!==undefined?` · £${(items[i].price/100).toFixed(2)}`:''),{op:'pick',item:i},`data-d9-handle="item" data-d9-item="${i}" class="d9-piece" ${items[i].value===undefined?'':'aria-label="'+esc(items[i].label)+', observation '+(i+1)+'"'} aria-pressed="${v.picked===i}"`);
  html=`<p>Drag an object into a target. To move it without dragging, select the object, then select a target. Return an object to the tray to undo it.</p><div class="d9-tray" data-d9-target="-1" aria-label="Object tray">${items.map((_,i)=>p[i]===undefined?item(i):'').join('')||'<span>All objects placed</span>'}</div>`;
  if(a.kind==='fraction'){
   const slot=n=>{const i=Object.keys(p).find(i=>p[i]===n),label='Part '+(n%a.denominator+1)+' of whole '+(Math.floor(n/a.denominator)+1);return `<div class="d9-slot ${i===undefined?'':'d9-filled'}" data-d9-target="${n}">${button(label,{op:'drop',target:n},'aria-label="'+label+'. Place selected piece in slot '+(n+1)+'"')}${i===undefined?'':item(Number(i))}</div>`;};
   html+=`<p>One whole has ${a.denominator} equal parts.</p>${Array.from({length:a.slots/a.denominator},(_,whole)=>`<fieldset class="d9-whole"><legend>Whole ${whole+1} · ${a.denominator} equal parts</legend><div class="d9-fractions" style="--d9-cols:${a.denominator}">${Array.from({length:a.denominator},(_,i)=>slot(whole*a.denominator+i)).join('')}</div></fieldset>`).join('')}<output>${Object.keys(p).length}/${a.denominator} of a whole</output>`;
  }
  else html+=`<div class="d9-targets">${a.targets.map((label,n)=>`<section data-d9-target="${n}" class="d9-target">${button(label,{op:'drop',target:n},'class="d9-target-button" aria-label="Place selected object in '+esc(label)+'"')}<div>${items.map((_,i)=>p[i]===n?item(i):'').join('')}</div><output>${((c)=>c+(c===1?' item':' items'))(Object.values(p).filter(x=>x===n).length)}</output></section>`).join('')}</div>${a.kind==='basket'?`<output>Basket total: ${value(a,values)}p · ${Object.keys(p).length} items</output>`:''}`;
  html+=`<p role="status">${selected}</p>${button('Return selected object to tray',{op:'drop',target:-1})}`;
 }else if(a.kind==='numberline'){
  const n=v.value??a.min,pos=n=>60+(n-a.min)/(a.max-a.min)*480;
  html=`<p>Drag the marker along the labelled number line. The buttons provide the same answer without dragging. ${esc(a.scaleNote||'')}</p>`+`<div class="d9-line-window" role="region" tabindex="0" aria-label="Number line; scroll horizontally if needed"><div class="d9-line-surface">`+svg(`Number line, ${a.min} to ${a.max}`,`<image href="v3/assets/maths-tools/number-line-surround.png" x="0" y="42" width="600" height="200" aria-hidden="true" pointer-events="none"/><path d="M60 140H540" stroke="#203b2e" stroke-width="4"/>${Array.from({length:11},(_,i)=>{const x=a.min+(a.max-a.min)*i/10;return tick(pos(x),140,i%(a.labelsEvery||1)?'':Number(x.toFixed(2)));}).join('')}<image href="v3/assets/maths-tools/number-line-marker.png" x="${pos(n)-38}" y="${140-25}" width="76" height="51" aria-hidden="true" pointer-events="none"/>${handle('line',pos(n),140,'Move the number-line marker')}`)+`<div class="d9-line-drag" data-d9-handle="line" role="img" aria-label="Draggable number-line marker. Use the movement buttons for keyboard control." style="left:${pos(n)/6}%"></div></div></div><div class="d9-controls">${[-1,1].map(d=>button(d<0?'One step left':'One step right',{op:'value',value:n+d*a.step})).join('')}${Array.from({length:11},(_,i)=>{const x=snap(a.min+(a.max-a.min)*i/10,a.min,a.max,a.step);return button(String(x),{op:'value',value:x});}).join('')}</div><output>Marker: ${n} ${esc(a.unit)}</output>`;
 }else if(a.kind==='grid'){
  const point=v.point||[0,0],pos=n=>60+(n-a.min)/(a.max-a.min)*480,ticks=Array.from({length:a.max-a.min+1},(_,i)=>a.min+i);
  // Square grid: its own viewBox keeps mathematical and pointer coordinates equal.
  html=`<p>Drag the point to a numbered intersection. Alternatively select an intersection or use the four movement buttons.</p><svg class="d9-canvas d9-grid" viewBox="0 0 600 600" role="group" aria-label="Numbered Cartesian x and y grid">${ticks.map(n=>`<path d="M${pos(n)} 60V540 M60 ${pos(n)}H540" stroke="#b0bda5"/><text x="${pos(n)}" y="570" text-anchor="middle">${n}</text><text x="30" y="${pos(-n)+5}" text-anchor="middle">${n}</text>`).join('')}<path d="M300 45V550 M45 300H550" stroke="#203b2e" stroke-width="4"/><text x="570" y="290">x</text><text x="315" y="30">y</text>${ticks.flatMap(x=>ticks.map(y=>`<circle cx="${pos(x)}" cy="${pos(-y)}" r="18" fill="transparent" data-d9-action="${esc(JSON.stringify({op:'point',point:[x,y]}))}" role="button" tabindex="-1" aria-label="Intersection x ${x}, y ${y}"/>`)).join('')}${handle('point',pos(point[0]),pos(-point[1]),'Move the plotted point')}</svg><div class="d9-controls">${[['Left',0,-1],['Right',0,1],['Down',1,-1],['Up',1,1]].map(([label,i,d])=>{const p=[...point];p[i]+=d;return button(label,{op:'point',point:p});}).join('')}</div><output>Point: x ${point[0]}, y ${point[1]}</output>`;
 }else if(a.kind==='ruler'){
  const [x,y]=v.ruler||[25,225],reading=v.reading||0,scale=36;
  html=`<p>Drag the ruler using its round handle. Align zero with the left end of the strip. Then drag the reading marker along the ruler to the other end.</p>`+svg('Moveable ruler and wooden strip',`<text x="${a.objectX}" y="70">${esc(a.label)}</text><rect x="${a.objectX}" y="85" width="${a.length*scale}" height="30" rx="5" fill="#ad773d"/><path d="M${a.objectX} 80V130 M${a.objectX+a.length*scale} 80V130" stroke="#203b2e" stroke-dasharray="3 3"/><g><rect x="${x-8}" y="${y}" width="450" height="52" fill="#e9d191" stroke="#314f3b"/>${Array.from({length:a.max*2+1},(_,i)=>{const n=i/2;return `<path d="M${x+n*scale} ${y}v${i%2?9:16}" stroke="#203b2e"/>${i%2?'':`<text x="${x+n*scale}" y="${y+38}" text-anchor="middle">${n}</text>`}`;}).join('')}${handle('ruler',x+205,y+25,'Move the ruler')}<text x="${x+205}" y="${y+75}" text-anchor="middle">Move ruler</text>${handle('reading',x+reading*scale,y-12,'Move the reading marker')}<text x="${x+reading*scale}" y="${y-55}" text-anchor="middle">Read here</text></g>`)+`<div class="d9-controls">${[['Ruler left',-5,0],['Ruler right',5,0],['Ruler up',0,-5],['Ruler down',0,5]].map(([label,dx,dy])=>button(label,{op:'ruler',x:x+dx,y:y+dy})).join('')}${button('Align ruler zero with strip',{op:'ruler',x:a.objectX,y:a.objectY})}${[-1,1].map(d=>button(d<0?'Read one step less':'Read one step more',{op:'reading',value:reading+d*a.step})).join('')}</div><output>Reading: ${reading} cm · ${Math.abs(x-a.objectX)<=6&&Math.abs(y-a.objectY)<=6?"Ruler zero aligned with strip":"Align zero with the left end of the strip"}</output>`;
 }else if(a.kind==='jug'){
  const n=v.value||0,handleX=75+n/a.max*190;
  html=`<p>Drag the round pour handle to the right to pour more, or left to return liquid. The receiving container shows the measured amount. Release to save; there is no timer.</p>`+svg('Pouring jug and measured receiving container',`<g transform="rotate(${n?Math.min(45,n/a.max*45):0} 130 170)"><path d="M55 80H195L180 205H70Z" fill="#bdd8e2" stroke="#274d56" stroke-width="4"/><path d="M55 100H25V165H65" fill="none" stroke="#274d56" stroke-width="10"/><text x="85" y="160">Jug</text></g><path d="M190 100Q300 80 410 130" fill="none" stroke="#448eaa" stroke-width="8" opacity="${preview?1:0}"/><rect x="360" y="55" width="170" height="210" fill="#f6fbff" stroke="#274d56" stroke-width="4"/><rect x="363" y="${263-n/a.max*200}" width="164" height="${n/a.max*200}" fill="#448eaa" opacity=".65"/>${Array.from({length:11},(_,i)=>`<path d="M360 ${263-i*20}h16" stroke="#274d56"/><text x="385" y="${268-i*20}">${i*100} ml</text>`).join('')}<path d="M75 255H265" stroke="#274d56" stroke-width="4"/>${handle('pour',handleX,255,'Move the jug pour control')}`)+`<div class="d9-controls">${[-1,1].map(d=>button(d<0?'Return 25 ml':'Pour 25 ml',{op:'value',value:n+d*a.step})).join('')}${button('Empty receiving container',{op:'value',value:0})}</div><output>Receiving container: ${n} ml</output>`;
 }else if(a.kind==='tiles'){
  const size=Math.min(48,Math.floor(520/a.cols)),W=a.cols*size+40,H=a.rows*size+40,on=new Set(v.cells||[]),rows=[...new Set(a.cells.map(c=>c[1]))].sort((x,y)=>x-y);
  html=`<p>Tap a square to cover it with a tile. Tap it again to lift the tile. The row buttons cover a whole row at once. ${esc(a.scaleNote||'')}</p><svg class="d9-canvas d9-tiles" viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(a.label)}">${a.cells.map((c,i)=>`<rect x="${20+c[0]*size}" y="${20+c[1]*size}" width="${size}" height="${size}" fill="${on.has(i)?'#6fa36b':'#fffaf0'}" stroke="#314f3b" stroke-width="2" data-d9-action="${esc(JSON.stringify({op:'cell',cell:i}))}" role="button" tabindex="-1" aria-pressed="${on.has(i)}" aria-label="Square in column ${c[0]+1}, row ${c[1]+1}"/>`).join('')}</svg><div class="d9-controls">${rows.map(r=>button('Cover row '+(r+1),{op:'row',row:r})).join('')}</div><output>Covered: ${on.size} squares = ${on.size} ${esc(a.unit)}</output>`;
 }else if(a.kind==='balance'){
  const removed=v.removed||0,left=a.left-removed,right=a.right-removed,shared=!!v.shared,each=right/a.x;
  const unit=(x,y)=>`<rect x="${x}" y="${y}" width="22" height="22" rx="3" fill="#e8c36a" stroke="#7a5a1c" stroke-width="2"/>`;
  const units=(n,x0,per)=>Array.from({length:n},(_,i)=>unit(x0+(i%per)*26,206-Math.floor(i/per)*26)).join('');
  const start=30+a.x*56,xTiles=Array.from({length:a.x},(_,i)=>`<rect x="${30+i*56}" y="164" width="48" height="64" rx="5" fill="#8fb8d8" stroke="#274d56" stroke-width="2"/><text x="${54+i*56}" y="204" text-anchor="middle" font-style="italic">x</text>`).join('');
  const perLeft=Math.max(2,Math.floor((285-start)/26)),perShared=Math.max(1,Math.floor((250/a.x-12)/26)),stack=Math.max(Math.ceil(a.right/9),Math.ceil(a.left/perLeft))-1,top=Math.max(0,Math.min(150,206-stack*26,206-Math.ceil((a.right-a.left)/a.x/perShared)*26-18)-14);
  const box=250/a.x,rightSide=shared?Array.from({length:a.x},(_,g)=>{const x0=320+g*box,per=Math.max(1,Math.floor((box-12)/26));return `<rect x="${x0+2}" y="${206-Math.ceil(each/per)*26+14}" width="${box-6}" height="${Math.ceil(each/per)*26+12}" fill="none" stroke="#274d56" stroke-dasharray="6 4"/><text x="${x0+box/2}" y="${206-Math.ceil(each/per)*26+4}" text-anchor="middle">x = ${each}</text>${units(each,x0+6,per)}`;}).join(''):units(right,325,9);
  html=`<p>The two sides balance. Take the same number of units from both sides until the x tiles are on their own. Then share what is left on the right between the x tiles.</p>`+svg(`Balance: left side ${a.x} x tiles and ${left} units, right side ${right} units`,`${xTiles}${units(left,start+4,Math.max(2,Math.floor((285-start)/26)))}${rightSide}<path d="M20 240H580" stroke="#5b3b1f" stroke-width="8"/><path d="M300 244L276 290H324Z" fill="#5b3b1f"/><text x="152" y="300" text-anchor="middle">Left side</text><text x="448" y="300" text-anchor="middle">Right side</text>`,`0 ${top} 600 ${320-top}`)+`<div class="d9-controls">${button('Take one unit from both sides',{op:'remove',value:removed+1},removed<a.left?'':'disabled')}${button('Put one unit back on both sides',{op:'remove',value:removed-1},removed?'':'disabled')}${button(`Share the right side between the x tiles`,{op:'share',value:true},left===0&&!shared?'':'disabled')}${button('Undo sharing',{op:'share',value:false},shared?'':'disabled')}</div><output>${shared?`Each x tile balances ${each} units, so x = ${each}`:`Left side: ${a.x===1?'':a.x}x + ${left} · Right side: ${right}`}</output>`;
 }else if(a.kind==='bar'){
  const parts=v.parts||1,on=new Set(v.shaded||[]),w=480/parts,each=Number((a.whole/parts).toFixed(4)),total=Number((on.size*a.whole/parts).toFixed(6));
  html=`<p>Split the bar into equal parts with the buttons. Then tap parts to shade them, or use the shade buttons. ${esc(a.scaleNote||'')}</p>`+svg(`Bar model, the whole is ${amount(a,a.whole)}`,`<text x="300" y="40" text-anchor="middle">${esc(a.label)}: ${esc(amount(a,a.whole))}</text><path d="M60 64V54H540V64" fill="none" stroke="#203b2e" stroke-width="3"/>${Array.from({length:parts},(_,i)=>`<rect x="${60+i*w}" y="80" width="${w}" height="80" fill="${on.has(i)?'#6fa36b':'#fffaf0'}" stroke="#203b2e" stroke-width="3" data-d9-action="${esc(JSON.stringify({op:'shade',part:i}))}" role="button" tabindex="-1" aria-pressed="${on.has(i)}" aria-label="Part ${i+1} of ${parts}"/>${parts>1&&w>=40?`<text x="${60+i*w+w/2}" y="128" text-anchor="middle" pointer-events="none">${esc(amount(a,each))}</text>`:''}`).join('')}<text x="300" y="200" text-anchor="middle">${parts} equal part${parts===1?'':'s'}${parts>1?', each '+esc(amount(a,each)):''}</text>`,'0 0 600 220')+`<div class="d9-controls">${button('Fewer equal parts',{op:'split',value:parts-1},parts>1?'':'disabled')}${button('More equal parts',{op:'split',value:parts+1},parts<(a.maxParts||12)?'':'disabled')}${button('Shade one more part',{op:'shadeTo',value:on.size+1},on.size<parts?'':'disabled')}${button('Shade one fewer part',{op:'shadeTo',value:on.size-1},on.size?'':'disabled')}</div><output>Shaded: ${on.size} of ${parts} parts = ${esc(amount(a,total))}</output>`;
 }else if(a.kind==='clock'){
  const e=v.value||0,now=a.start+e,pt=(deg,len)=>[160+len*Math.sin(deg*Math.PI/180),160-len*Math.cos(deg*Math.PI/180)].map(n=>n.toFixed(1));
  const hands=(t,style)=>{const [mx,my]=pt(t%60*6,108),[hx,hy]=pt(t/60%12*30,70);return `<path d="M160 160L${hx} ${hy}" stroke-width="9" ${style}/><path d="M160 160L${mx} ${my}" stroke-width="5" ${style}/>`;};
  html=`<p>The dashed hands show the start time. Move the clock on to the end time with the buttons, or tap a five-minute mark to move the minute hand forward to it. The clock counts the minutes that pass.</p>`+svg(`Clock face, start ${time12(a.start)}, now ${time12(now)}`,`<circle cx="160" cy="160" r="140" fill="#fffaf0" stroke="#203b2e" stroke-width="5"/>${Array.from({length:60},(_,i)=>{const [x1,y1]=pt(i*6,140),[x2,y2]=pt(i*6,i%5?132:122);return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#203b2e" stroke-width="${i%5?1:3}"/>`;}).join('')}${Array.from({length:12},(_,i)=>{const [x,y]=pt((i+1)*30,100);return `<text x="${x}" y="${Number(y)+7}" text-anchor="middle" font-size="22">${i+1}</text>`;}).join('')}${Array.from({length:12},(_,i)=>{const [x,y]=pt(i*30,128);return `<circle cx="${x}" cy="${y}" r="17" fill="transparent" data-d9-action="${esc(JSON.stringify({op:'minute',value:i*5}))}" role="button" tabindex="-1" aria-label="Move the minute hand forward to ${i*5} minutes past"/>`;}).join('')}${hands(a.start,'stroke="#8a9a8c" stroke-dasharray="6 5" stroke-linecap="round"')}${hands(now,'stroke="#174f39" stroke-linecap="round"')}<circle cx="160" cy="160" r="7" fill="#174f39"/><text x="340" y="110">Start: ${time12(a.start)}</text><text x="340" y="150">Now: ${time12(now)}</text><text x="340" y="190">Time passed: ${e} minutes</text>`)+`<div class="d9-controls">${[['5 minutes back',-5],['5 minutes on',5],['15 minutes on',15],['One hour back',-60],['One hour on',60]].map(([label,d])=>button(label,{op:'value',value:e+d},e+d<0||e+d>a.max?'disabled':'')).join('')}</div><output>Time passed: ${e} minutes · Now ${time12(now)}</output>`;
 }
 return html+`<p class="d9-live" aria-live="polite">${preview?'Moving — release to save this position.':'Position saved when you release or use a button.'}</p><div>${button('Reset activity',{op:'reset'})}</div>`;
}
function render(a,values={},prefix='d9-p'){
 return `<section class="d9-board" data-d9-prefix="${prefix}" data-d9-spec="${esc(JSON.stringify(a))}" data-d9-values="${esc(JSON.stringify(values))}" data-direct-kind="${a.kind}" aria-label="Direct movement activity">${body(a,values,prefix)}</section>`;
}
function bind(doc,commit){
 if(doc.__v9Bound)return;doc.__v9Bound=true;let drag=null,suppressUntil=0;
 const send=(board,action)=>{const spec=JSON.parse(board.dataset.d9Spec),draft=JSON.parse(board.dataset.d9Values);if(!edit(spec,draft,action)){board.querySelector('.d9-live').textContent='Select an object first and choose a valid target. Fraction slots hold one piece each.';return;}commit(board,board.dataset.d9Prefix+':'+encodeURIComponent(JSON.stringify(action)));};
 // Keep the original SVG and touched node connected throughout a drag. Replacing
 // them mid-gesture lets a scrolling ancestor take over and sends pointercancel.
 const paint=(d,values,preview=false)=>{
  if(!d.board.isConnected)return;
  const html=body(d.spec,values,d.board.dataset.d9Prefix,preview);
  if(!preview){d.board.innerHTML=html;return;}
  const template=doc.createElement('template');template.innerHTML=html;
  const current=d.board.querySelector('svg'),next=template.content.querySelector('svg');
  if(current&&next){
   const oldNodes=[current,...current.querySelectorAll('*')],newNodes=[next,...next.querySelectorAll('*')];
   if(oldNodes.length===newNodes.length&&oldNodes.every((el,i)=>el.tagName===newNodes[i].tagName)){
    oldNodes.forEach((el,i)=>{const fresh=newNodes[i];for(const attr of [...el.attributes])if(!fresh.hasAttribute(attr.name))el.removeAttribute(attr.name);for(const attr of fresh.attributes)if(el.getAttribute(attr.name)!==attr.value)el.setAttribute(attr.name,attr.value);if(!el.children.length&&el.textContent!==fresh.textContent)el.textContent=fresh.textContent;});
   }
  }
  const hit=d.board.querySelector('.d9-line-drag'),nextHit=template.content.querySelector('.d9-line-drag');if(hit&&nextHit)hit.style.left=nextHit.style.left;
  const outputs=d.board.querySelectorAll('output');template.content.querySelectorAll('output').forEach((el,i)=>{if(outputs[i])outputs[i].textContent=el.textContent;});
  d.board.querySelector('.d9-live').textContent=template.content.querySelector('.d9-live').textContent;
 };
 function cancel(){if(!drag)return;const d=drag;drag=null;paint(d,d.initial);if(d.board.isConnected){const live=d.board.querySelector('.d9-live');if(live)live.textContent='Movement cancelled. Your saved position is unchanged.';}}
 function point(board,e){const svg=board.querySelector('svg');if(!svg)return null;const matrix=svg.getScreenCTM();if(!matrix)return null;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(matrix.inverse());}
 function action(d,e){const pos=point(d.board,e),a=d.spec,v=d.initial.d9||{};
  if(d.handle==='item'){const target=doc.elementFromPoint(e.clientX,e.clientY)?.closest('[data-d9-target]');return target&&d.board.contains(target)?{op:'drop',item:d.item,target:Number(target.dataset.d9Target)}:null;}
  if(!pos)return null;
  if(d.handle==='line')return {op:'value',value:a.min+(pos.x-60)/480*(a.max-a.min)};
  if(d.handle==='point')return {op:'point',point:[a.min+(pos.x-60)/480*(a.max-a.min),a.max-(pos.y-60)/480*(a.max-a.min)]};
  if(d.handle==='pour')return {op:'value',value:(v.value||0)+(pos.x-d.start.x)/190*a.max};
  if(d.handle==='ruler'){const [x,y]=v.ruler||[25,225];return {op:'ruler',x:x+pos.x-d.start.x,y:y+pos.y-d.start.y};}
  if(d.handle==='reading')return {op:'reading',value:(pos.x-(v.ruler||[25,225])[0])/36};
  return null;
 }
 doc.addEventListener('pointerdown',e=>{
  if(drag||e.isPrimary===false||e.button!==0)return;const handle=e.target.closest?.('[data-d9-handle]'),board=handle?.closest('.d9-board');if(!board||board.closest('[inert]'))return;
  drag={board,spec:JSON.parse(board.dataset.d9Spec),initial:JSON.parse(board.dataset.d9Values),handle:handle.dataset.d9Handle,capture:e.target,item:Number(handle.dataset.d9Item),id:e.pointerId,client:[e.clientX,e.clientY],start:point(board,e),moved:false};
 });
 doc.addEventListener('pointermove',e=>{
  const d=drag;if(!d||d.id!==e.pointerId)return;if(!d.board.isConnected){cancel();return;}
  if(!d.moved&&Math.hypot(e.clientX-d.client[0],e.clientY-d.client[1])<5)return;
  if(!d.moved){d.moved=true;try{d.capture.setPointerCapture(e.pointerId);}catch{cancel();return;}}
  e.preventDefault();const op=action(d,e);
  if(d.handle==='item'){
   // Keep the source's space and all target bounds stable until release.
   if(!d.ghost){const source=d.board.querySelector(`[data-d9-item="${d.item}"]`);if(source){const width=source.getBoundingClientRect().width;d.ghost=source.cloneNode(true);d.ghost.classList.add('d9-moving');d.ghost.style.cssText=`position:fixed;width:${width}px;transform:translate(-50%,-50%);pointer-events:none`;source.style.visibility='hidden';d.board.append(d.ghost);}}
   if(d.ghost){d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';}
   d.board.querySelectorAll('[data-d9-target]').forEach(el=>el.classList.toggle('d9-over',op?.target===Number(el.dataset.d9Target)));
   d.board.querySelector('.d9-live').textContent=op?'Release inside this target to save.':'Move over a target; release outside to cancel.';
  }else if(op){const next=copy(d.initial);edit(d.spec,next,op);paint(d,next,true);}
 },{passive:false});
 doc.addEventListener('pointerup',e=>{const d=drag;if(!d||d.id!==e.pointerId)return;const op=action(d,e);drag=null;if(!d.moved)return;suppressUntil=Date.now()+1;paint(d,d.initial);if(d.board.isConnected){if(op)send(d.board,op);else d.board.querySelector('.d9-live').textContent='Drop inside a target. Your saved position is unchanged.';}});
 doc.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId)cancel();});
 doc.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId&&e.target===drag.capture)cancel();});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)cancel();});
 doc.defaultView?.addEventListener('blur',cancel);
 doc.addEventListener('click',e=>{const el=e.target.closest?.('[data-d9-action]'),board=el?.closest('.d9-board');if(!board)return;e.preventDefault();if(e.detail!==0&&Date.now()<suppressUntil)return;send(board,JSON.parse(el.dataset.d9Action));});
 return {cancel};
}
root.V9Touch={edit,value,matches,render,bind};if(typeof module!=='undefined')module.exports={V9Touch:root.V9Touch};
})(typeof window==='undefined'?globalThis:window);
