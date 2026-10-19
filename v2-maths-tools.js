/* Maths Adventure V2: accessible touch-based visual manipulatives.
   Tools only support learning; they never mark questions or award rewards. */
(function(root){
'use strict';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b){const r=a%b;a=b;b=r}return a||1};
const whole=(value,defaultValue,min,max)=>Number.isInteger(value)?Math.min(max,Math.max(min,value)):defaultValue;
function state(session){if(!session.mathTools||typeof session.mathTools!=='object'||Array.isArray(session.mathTools))session.mathTools={};return session.mathTools}
function fraction(session){
 const s=state(session),d=whole(s.den,8,2,12),n=whole(s.shade,0,0,d);
 const parts=Array.from({length:d},(_,i)=>'<button type="button" class="math-part '+(i<n?'chosen':'')+'" data-act="math:frac:'+i+'" aria-pressed="'+(i<n)+'" aria-label="Shade '+(i+1)+' of '+d+' parts">'+(i<n?'●':'')+'</button>').join('');
 return '<section class="math-tool"><h3>🧩 Build a fraction</h3><p class="muted small">Choose the number of equal parts and tap a piece to shade up to it.</p><div class="math-tool-controls"><button data-act="math:den:-1" type="button" aria-label="One fewer equal part">−</button><strong>'+d+' equal parts</strong><button data-act="math:den:1" type="button" aria-label="One more equal part">+</button></div><div class="math-parts" style="--pieces:'+d+'">'+parts+'</div><p class="math-tool-result" aria-live="polite">'+n+'/'+d+' shaded'+(n?' = '+Math.round(n/d*1000)/10+'%':'')+'</p><button type="button" class="math-clear" data-act="math:frac:clear">Clear shading</button></section>';
}
function numberline(session){
 const s=state(session),v=whole(s.line,0,-10,10);
 const nums=Array.from({length:21},(_,i)=>{const x=i-10;return '<button type="button" class="math-point '+(x===0?'zero ':'')+(x===v?'chosen':'')+'" data-act="math:line:'+x+'" aria-pressed="'+(x===v)+'" aria-label="Select '+x+' on the number line">'+x+'</button>'}).join('');
 return '<section class="math-tool"><h3>↔️ Explore a number line</h3><p class="muted small">Tap a number. Positive numbers are right of zero; negative numbers are left.</p><div class="math-line-scroll"><div class="math-numberline">'+nums+'</div></div><p class="math-tool-result" aria-live="polite">Position: '+v+(v===0?' (zero)':v<0?' ('+(-v)+' steps left of zero)':' ('+v+' steps right of zero)')+'</p><div class="math-tool-controls"><button data-act="math:line:step-1" type="button">← One step left</button><button data-act="math:line:step1" type="button">One step right →</button></div></section>';
}
function coordinates(session){
 const s=state(session),x=whole(s.x,0,-3,3),y=whole(s.y,0,-3,3);
 const points=[];
 for(let row=3;row>=-3;row--){for(let col=-3;col<=3;col++){const sel=col===x&&row===y;points.push('<button type="button" class="math-coord '+(row===0||col===0?'axis ':'')+(sel?'chosen':'')+'" data-act="math:coord:'+col+':'+row+'" aria-label="Point ('+col+', '+row+')" aria-pressed="'+sel+'">'+(sel?'●':col===0&&row===0?'+':'·')+'</button>')}}
 return '<section class="math-tool"><h3>📍 Explore coordinates</h3><p class="muted small">Tap a point. The first number goes across (x), then up or down (y).</p><div class="math-coordinate-grid" role="group" aria-label="Coordinate grid x and y from minus 3 to 3">'+points.join('')+'</div><p class="math-tool-result" aria-live="polite">Selected point: ('+x+', '+y+')</p></section>';
}
function ratios(session){
 const s=state(session),a=whole(s.green,2,1,12),b=whole(s.blue,3,1,12),g=gcd(a,b);
 const green=Array.from({length:a},()=>'<span aria-hidden="true" class="math-token green">●</span>').join('');
 const blue=Array.from({length:b},()=>'<span aria-hidden="true" class="math-token blue">●</span>').join('');
 return '<section class="math-tool"><h3>🟢 Build a ratio</h3><p class="muted small">Change each group. Simplify by dividing both amounts by a common factor.</p><div class="math-ratio-row">'+green+blue+'</div><div class="math-tool-controls"><button data-act="math:ratio:g-1" type="button">− Green</button><strong>'+a+' : '+b+'</strong><button data-act="math:ratio:g1" type="button">+ Green</button></div><div class="math-tool-controls"><button data-act="math:ratio:b-1" type="button">− Blue</button><strong>Simplified '+(a/g)+':'+(b/g)+'</strong><button data-act="math:ratio:b1" type="button">+ Blue</button></div></section>';
}
function clock(session){
 const s=state(session),minute=whole(s.clock,9*60+30,0,1439),h=Math.floor(minute/60),m=minute%60;
 const hh=String(h).padStart(2,'0'),mm=String(m).padStart(2,'0');
 const hourAngle=((h%12)+m/60)*30,minAngle=m*6;
 return '<section class="math-tool"><h3>🕒 Explore time</h3><p class="muted small">Move the clock hands and see the matching 24-hour time.</p><div class="math-clock" role="img" aria-label="Analogue clock displaying '+hh+':'+mm+'"><span class="math-clock-mark mark12">12</span><span class="math-clock-mark mark3">3</span><span class="math-clock-mark mark6">6</span><span class="math-clock-mark mark9">9</span><span class="math-hand hour" style="transform:rotate('+hourAngle+'deg)"></span><span class="math-hand minute" style="transform:rotate('+minAngle+'deg)"></span><span class="math-hub"></span></div><p class="math-tool-result" aria-live="polite">'+hh+':'+mm+' · '+((h%12)||12)+':'+mm+(h<12?' am':' pm')+'</p><div class="math-tool-controls"><button type="button" data-act="math:clock:-60">− 1 hour</button><button type="button" data-act="math:clock:-15">− 15 min</button><button type="button" data-act="math:clock:15">+ 15 min</button><button type="button" data-act="math:clock:60">+ 1 hour</button></div></section>';
}
function percentage(session){
 const s=state(session),t=whole(s.percent,30,0,100),cells=Array.from({length:100},(_,i)=>'<button type="button" class="math-percent-cell '+(i<t?'chosen':'')+'" data-act="math:percent:'+((i+1))+'" aria-label="Shade '+(i+1)+' percent" aria-pressed="'+(i<t)+'"></button>').join('');
 return '<section class="math-tool"><h3>🟩 Build a percentage</h3><p class="muted small">Tap squares in the 100-square grid. Each one represents 1%.</p><div class="math-percent-grid">'+cells+'</div><p class="math-tool-result" aria-live="polite">'+t+' out of 100 squares shaded = '+t+'%</p><button class="math-clear" data-act="math:percent:0" type="button">Clear grid</button></section>';
}
function supports(id,world){
 const types=[];
 if(world==='fractions'){types.push('fraction');if(id==='decimals'||id==='percent_change')types.push('percentage')}
 if(world==='ratio')types.push('ratio');
 if(id==='negative')types.push('numberline');
 if(id==='algebra_coordinates'||id==='geometry_transforms')types.push('coordinates');
 if(id==='measure_time')types.push('clock');
 if(id==='stats_pie')types.push('percentage');
 return types;
}
function render(id,world,session){
 if(!session||session.type!=='mission'||!['question','hint','teaching','lesson'].includes(session.mode))return '';
 return supports(id,world).map(t=>({fraction,percentage,numberline,coordinates,ratio:ratios,clock})[t](session)).join('');
}
function update(session,action){
 if(!session||session.type!=='mission'||typeof action!=='string'||!action.startsWith('math:'))return false;
 const p=action.split(':'),s=state(session),cmd=p[1];
 if(cmd==='den'&&['-1','1'].includes(p[2])){const old=whole(s.den,8,2,12);s.den=Math.min(12,Math.max(2,old+Number(p[2])));s.shade=Math.min(whole(s.shade,0,0,old),s.den);return true}
 if(cmd==='frac'&&(p[2]==='clear'||/^(?:[0-9]|1[01])$/.test(p[2]))){const d=whole(s.den,8,2,12),i=Number(p[2]);if(p[2]!=='clear'&&i>=d)return false;s.shade=p[2]==='clear'?0:whole(s.shade,0,0,d)===i+1?0:i+1;return true}
 if(cmd==='line'){const v=whole(s.line,0,-10,10);if(p[2]==='step-1'||p[2]==='step1'){s.line=Math.max(-10,Math.min(10,v+(p[2]==='step-1'?-1:1)));return true}if(/^-(?:10|[1-9])$|^(?:10|[0-9])$/.test(p[2])){s.line=Number(p[2]);return true}}
 if(cmd==='coord'&&/^-[123]$|^[0-3]$/.test(p[2])&&/^-[123]$|^[0-3]$/.test(p[3])){s.x=Number(p[2]);s.y=Number(p[3]);return true}
 if(cmd==='ratio'&&/^[gb]-?1$/.test(p[2])){const key=p[2][0]==='g'?'green':'blue',n=Number(p[2].slice(1));s[key]=Math.max(1,Math.min(12,whole(s[key],key==='green'?2:3,1,12)+n));return true}
 if(cmd==='clock'&&['-60','-15','15','60'].includes(p[2])){s.clock=(whole(s.clock,9*60+30,0,1439)+Number(p[2])+1440)%1440;return true}
 if(cmd==='percent'&&/^(?:100|[1-9][0-9]?|0)$/.test(p[2])){s.percent=Number(p[2]);return true}
 return false;
}
root.JaxonMathTools=Object.freeze({supports,render,update});
})(window);
