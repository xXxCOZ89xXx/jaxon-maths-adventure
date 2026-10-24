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
 return false;
}
function value(a,values={}){const v=values.d9||{},p=v.placements||{};
 if(a.kind==='grid')return JSON.stringify(v.point||[0,0]);
 if(a.kind==='ruler')return String(v.reading??0);
 if(a.kind==='fraction')return String(Object.keys(p).length/a.denominator);
 if(a.kind==='groups')return JSON.stringify(a.counts?a.targets.map((_,n)=>Object.values(p).filter(x=>x===n).length):a.items.map((_,i)=>p[i]??-1));
 if(a.kind==='basket')return String(Object.keys(p).reduce((sum,i)=>sum+a.items[i].price,0));
 return String(v.value??a.min??0);
}
function matches(a,answer,values={}){
 const v=values.d9||{},actual=value(a,values);
 if(a.kind==='grid'&&!Array.isArray(v.point))return false;
 if(['numberline','jug'].includes(a.kind)&&v.value===undefined)return false;
 if(a.kind==='ruler'){const [x,y]=v.ruler||[25,225];if(Math.abs(x-a.objectX)>6||Math.abs(y-a.objectY)>6)return false;}
 if(a.kind==='basket'&&Object.keys(v.placements||{}).length!==a.requiredCount)return false;
 if(a.kind==='groups'&&Object.keys(v.placements||{}).length!==a.items.length)return false;
 if(['grid','groups'].includes(a.kind))return actual===String(answer);
 const parse=x=>{const p=String(x).split('/');return p.length===2?Number(p[0])/Number(p[1]):Number(x);};
 return Number.isFinite(parse(answer))&&Math.abs(Number(actual)-parse(answer))<1e-7;
}
function body(a,values={},prefix='d9-p',preview=false){
 const v=values.d9||{},p=v.placements||{};
 const button=(label,action,attrs='')=>`<button type="button" data-d9-action="${esc(JSON.stringify(action))}" data-d9-focus="${esc(action.op==='pick'?'item-'+action.item:label)}" ${attrs}>${esc(label)}</button>`;
 const handle=(kind,x,y,label)=>`<g data-d9-handle="${kind}" class="d9-handle"><circle cx="${x}" cy="${y}" r="42" fill="transparent"/><circle cx="${x}" cy="${y}" r="17" fill="#174f39" stroke="white" stroke-width="3"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="white" font-size="16">↔</text><title>${esc(label)}</title></g>`;
 const svg=(label,content)=>`<svg class="d9-canvas" viewBox="0 0 600 320" role="group" aria-label="${esc(label)}">${content}</svg>`;
 const tick=(x,y,text)=>`<path d="M${x} ${y-6}v12" stroke="#34563e"/><text x="${x}" y="${y+30}" text-anchor="middle">${esc(text)}</text>`;
 const selected=v.picked===undefined?'No item selected':`Selected item ${v.picked+1}`;
 let html='';
 if(['basket','groups','fraction'].includes(a.kind)){
  const items=a.items||Array.from({length:a.pieces},(_,i)=>({label:`Piece ${i+1}: 1/${a.denominator}`}));
  const item=(i)=>button(items[i].label+(items[i].price!==undefined?` · ${items[i].price}p`:''),{op:'pick',item:i},`data-d9-handle="item" data-d9-item="${i}" class="d9-piece" ${items[i].value===undefined?'':'aria-label="'+esc(items[i].label)+', observation '+(i+1)+'"'} aria-pressed="${v.picked===i}"`);
  html=`<p>Drag an object into a target. To move it without dragging, select the object, then select a target. Return an object to the tray to undo it.</p><div class="d9-tray" data-d9-target="-1" aria-label="Object tray">${items.map((_,i)=>p[i]===undefined?item(i):'').join('')||'<span>All objects placed</span>'}</div>`;
  if(a.kind==='fraction'){
   const slot=n=>{const i=Object.keys(p).find(i=>p[i]===n),label='Part '+(n%a.denominator+1)+' of whole '+(Math.floor(n/a.denominator)+1);return `<div class="d9-slot ${i===undefined?'':'d9-filled'}" data-d9-target="${n}">${button(label,{op:'drop',target:n},'aria-label="'+label+'. Place selected piece in slot '+(n+1)+'"')}${i===undefined?'':item(Number(i))}</div>`;};
   html+=`<p>One whole has ${a.denominator} equal parts.</p>${Array.from({length:a.slots/a.denominator},(_,whole)=>`<fieldset class="d9-whole"><legend>Whole ${whole+1} · ${a.denominator} equal parts</legend><div class="d9-fractions" style="--d9-cols:${Math.min(a.denominator,5)}">${Array.from({length:a.denominator},(_,i)=>slot(whole*a.denominator+i)).join('')}</div></fieldset>`).join('')}<output>${Object.keys(p).length}/${a.denominator} of a whole</output>`;
  }
  else html+=`<div class="d9-targets">${a.targets.map((label,n)=>`<section data-d9-target="${n}" class="d9-target">${button(label,{op:'drop',target:n},'class="d9-target-button" aria-label="Place selected object in '+esc(label)+'"')}<div>${items.map((_,i)=>p[i]===n?item(i):'').join('')}</div><output>${Object.values(p).filter(x=>x===n).length} items</output></section>`).join('')}</div>${a.kind==='basket'?`<output>Basket total: ${value(a,values)}p · ${Object.keys(p).length} items</output>`:''}`;
  html+=`<p role="status">${selected}</p>${button('Return selected object to tray',{op:'drop',target:-1})}`;
 }else if(a.kind==='numberline'){
  const n=v.value??a.min,pos=n=>60+(n-a.min)/(a.max-a.min)*480;
  html=`<p>Drag the marker along the labelled number line. The buttons provide the same answer without dragging. ${esc(a.scaleNote||'')}</p>`+svg(`Number line, ${a.min} to ${a.max}`,`<path d="M60 140H540" stroke="#203b2e" stroke-width="4"/>${Array.from({length:11},(_,i)=>{const x=a.min+(a.max-a.min)*i/10;return tick(pos(x),140,i%(a.labelsEvery||1)?'':Number(x.toFixed(2)));}).join('')}${handle('line',pos(n),140,'Move the number-line marker')}`)+`<div class="d9-controls">${[-1,1].map(d=>button(d<0?'One step left':'One step right',{op:'value',value:n+d*a.step})).join('')}${Array.from({length:11},(_,i)=>{const x=snap(a.min+(a.max-a.min)*i/10,a.min,a.max,a.step);return button(String(x),{op:'value',value:x});}).join('')}</div><output>Marker: ${n} ${esc(a.unit)}</output>`;
 }else if(a.kind==='grid'){
  const point=v.point||[0,0],pos=n=>60+(n-a.min)/(a.max-a.min)*480,ticks=Array.from({length:a.max-a.min+1},(_,i)=>a.min+i);
  // Square grid: its own viewBox keeps mathematical and pointer coordinates equal.
  html=`<p>Drag the point to a numbered intersection. Alternatively select an intersection or use the four movement buttons.</p><svg class="d9-canvas d9-grid" viewBox="0 0 600 600" role="group" aria-label="Numbered Cartesian x and y grid">${ticks.map(n=>`<path d="M${pos(n)} 60V540 M60 ${pos(n)}H540" stroke="#b0bda5"/><text x="${pos(n)}" y="570" text-anchor="middle">${n}</text><text x="30" y="${pos(-n)+5}" text-anchor="middle">${n}</text>`).join('')}<path d="M300 45V550 M45 300H550" stroke="#203b2e" stroke-width="4"/><text x="570" y="290">x</text><text x="315" y="30">y</text>${ticks.flatMap(x=>ticks.map(y=>`<circle cx="${pos(x)}" cy="${pos(-y)}" r="18" fill="transparent" data-d9-action="${esc(JSON.stringify({op:'point',point:[x,y]}))}" role="button" tabindex="-1" aria-label="Intersection x ${x}, y ${y}"/>`)).join('')}${handle('point',pos(point[0]),pos(-point[1]),'Move the plotted point')}</svg><div class="d9-controls">${[['Left',0,-1],['Right',0,1],['Down',1,-1],['Up',1,1]].map(([label,i,d])=>{const p=[...point];p[i]+=d;return button(label,{op:'point',point:p});}).join('')}</div><output>Point: x ${point[0]}, y ${point[1]}</output>`;
 }else if(a.kind==='ruler'){
  const [x,y]=v.ruler||[25,225],reading=v.reading||0,scale=36;
  html=`<p>Drag the ruler using its round handle. Align zero with the left end of the strip. Then drag the reading marker along the ruler to the other end.</p>`+svg('Moveable ruler and wooden strip',`<text x="${a.objectX}" y="70">${esc(a.label)}</text><rect x="${a.objectX}" y="85" width="${a.length*scale}" height="30" rx="5" fill="#ad773d"/><path d="M${a.objectX} 80V130 M${a.objectX+a.length*scale} 80V130" stroke="#203b2e" stroke-dasharray="3 3"/><g><rect x="${x-8}" y="${y}" width="450" height="52" fill="#e9d191" stroke="#314f3b"/>${Array.from({length:a.max*2+1},(_,i)=>{const n=i/2;return `<path d="M${x+n*scale} ${y}v${i%2?9:16}" stroke="#203b2e"/>${i%2?'':`<text x="${x+n*scale}" y="${y+38}" text-anchor="middle">${n}</text>`}`;}).join('')}${handle('ruler',x+205,y+25,'Move the ruler')}<text x="${x+205}" y="${y+75}" text-anchor="middle">Move ruler</text>${handle('reading',x+reading*scale,y-12,'Move the reading marker')}<text x="${x+reading*scale}" y="${y-55}" text-anchor="middle">Read here</text></g>`)+`<div class="d9-controls">${[['Ruler left',-5,0],['Ruler right',5,0],['Ruler up',0,-5],['Ruler down',0,5]].map(([label,dx,dy])=>button(label,{op:'ruler',x:x+dx,y:y+dy})).join('')}${button('Align ruler zero with strip',{op:'ruler',x:a.objectX,y:a.objectY})}${[-1,1].map(d=>button(d<0?'Read one step less':'Read one step more',{op:'reading',value:reading+d*a.step})).join('')}</div><output>Reading: ${reading} cm · ${Math.abs(x-a.objectX)<=6&&Math.abs(y-a.objectY)<=6?"Ruler zero aligned with strip":"Align zero with the left end of the strip"}</output>`;
 }else if(a.kind==='jug'){
  const n=v.value||0,handleX=75+n/a.max*190;
  html=`<p>Drag the round pour handle to the right to pour more, or left to return liquid. The receiving container shows the measured amount. Release to save; there is no timer.</p>`+svg('Pouring jug and measured receiving container',`<g transform="rotate(${n?Math.min(45,n/a.max*45):0} 130 170)"><path d="M55 80H195L180 205H70Z" fill="#bdd8e2" stroke="#274d56" stroke-width="4"/><path d="M55 100H25V165H65" fill="none" stroke="#274d56" stroke-width="10"/><text x="85" y="160">Jug</text></g>${preview?'<path d="M190 100Q300 80 410 130" fill="none" stroke="#448eaa" stroke-width="8"/>':''}<rect x="360" y="55" width="170" height="210" fill="#f6fbff" stroke="#274d56" stroke-width="4"/><rect x="363" y="${263-n/a.max*200}" width="164" height="${n/a.max*200}" fill="#448eaa" opacity=".65"/>${Array.from({length:11},(_,i)=>`<path d="M360 ${263-i*20}h16" stroke="#274d56"/><text x="385" y="${268-i*20}">${i*100} ml</text>`).join('')}<path d="M75 255H265" stroke="#274d56" stroke-width="4"/>${handle('pour',handleX,255,'Move the jug pour control')}`)+`<div class="d9-controls">${[-1,1].map(d=>button(d<0?'Return 25 ml':'Pour 25 ml',{op:'value',value:n+d*a.step})).join('')}${button('Empty receiving container',{op:'value',value:0})}</div><output>Receiving container: ${n} ml</output>`;
 }
 return html+`<p class="d9-live" aria-live="polite">${preview?'Moving — release to save this position.':'Position saved when you release or use a button.'}</p><div>${button('Reset activity',{op:'reset'})}</div>`;
}
function render(a,values={},prefix='d9-p'){
 return `<section class="d9-board" data-d9-prefix="${prefix}" data-d9-spec="${esc(JSON.stringify(a))}" data-d9-values="${esc(JSON.stringify(values))}" data-direct-kind="${a.kind}" aria-label="Direct movement activity">${body(a,values,prefix)}</section>`;
}
function bind(doc,commit){
 if(doc.__v9Bound)return;doc.__v9Bound=true;let drag=null,suppressUntil=0;
 const send=(board,action)=>{const spec=JSON.parse(board.dataset.d9Spec),draft=JSON.parse(board.dataset.d9Values);if(!edit(spec,draft,action)){board.querySelector('.d9-live').textContent='Select an object first and choose a valid target. Fraction slots hold one piece each.';return;}commit(board,board.dataset.d9Prefix+':'+encodeURIComponent(JSON.stringify(action)));};
 const paint=(d,values,preview=false)=>{if(d.board.isConnected)d.board.innerHTML=body(d.spec,values,d.board.dataset.d9Prefix,preview);};
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
  drag={board,spec:JSON.parse(board.dataset.d9Spec),initial:JSON.parse(board.dataset.d9Values),handle:handle.dataset.d9Handle,item:Number(handle.dataset.d9Item),id:e.pointerId,client:[e.clientX,e.clientY],start:point(board,e),moved:false};
 });
 doc.addEventListener('pointermove',e=>{
  const d=drag;if(!d||d.id!==e.pointerId)return;if(!d.board.isConnected){cancel();return;}
  if(!d.moved&&Math.hypot(e.clientX-d.client[0],e.clientY-d.client[1])<5)return;
  if(!d.moved){d.moved=true;try{d.board.setPointerCapture(e.pointerId);}catch{cancel();return;}}
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
 doc.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId&&e.target===drag.board)cancel();});
 doc.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)cancel();});
 doc.defaultView?.addEventListener('blur',cancel);
 doc.addEventListener('click',e=>{const el=e.target.closest?.('[data-d9-action]'),board=el?.closest('.d9-board');if(!board)return;e.preventDefault();if(e.detail!==0&&Date.now()<suppressUntil)return;send(board,JSON.parse(el.dataset.d9Action));});
 return {cancel};
}
root.V9Touch={edit,value,matches,render,bind};if(typeof module!=='undefined')module.exports={V9Touch:root.V9Touch};
})(typeof window==='undefined'?globalThis:window);
