/* Additional V2 maths manipulatives, independent from assessment scoring. */
(function(root){
'use strict';
function limit(v,d,min,max){return Number.isInteger(v)?Math.max(min,Math.min(max,v)):d}
function model(session){if(!session.mathExtra||typeof session.mathExtra!=='object'||Array.isArray(session.mathExtra))session.mathExtra={};return session.mathExtra}
function place(session){
 const s=model(session),digits=Array.isArray(s.digits)&&s.digits.length===4?s.digits.map((x,i)=>limit(x,[3,4,6,5][i],0,9)):[3,4,6,5];
 const values=[1000,100,10,1],labels=['Thousands','Hundreds','Tens','Ones'];
 const cells=digits.map((d,i)=>'<button type="button" class="math-extra-place" data-act="mathx:digit:'+i+'" aria-label="Increase '+labels[i]+' digit, now '+d+'"><small>'+labels[i]+'</small><strong>'+d+'</strong><span>value '+d*values[i]+'</span></button>').join('');
 const total=digits.reduce((s,d,i)=>s+d*values[i],0);
 return '<section class="math-tool"><h3>🔢 Explore place value</h3><p class="muted small">Tap a digit to change it. See what that digit is worth in each column.</p><div class="math-extra-places">'+cells+'</div><p class="math-tool-result" aria-live="polite">Number: '+total.toLocaleString('en-GB')+'</p><button type="button" class="math-clear" data-act="mathx:digits:reset">Reset digits</button></section>';
}
function arrays(session){
 const s=model(session),rows=limit(s.rows,3,1,12),cols=limit(s.cols,4,1,12);
 const dots=Array.from({length:rows*cols},()=>'<span class="math-extra-dot" aria-hidden="true">●</span>').join('');
 return '<section class="math-tool"><h3>🟩 Build a multiplication array</h3><p class="muted small">Change the rows and columns. Count how many altogether.</p><div class="math-extra-dots" style="--columns:'+cols+'" aria-label="'+rows+' rows of '+cols+' dots">'+dots+'</div><div class="math-tool-controls"><button type="button" data-act="mathx:rows:-1">− Row</button><strong>'+rows+' rows</strong><button type="button" data-act="mathx:rows:1">+ Row</button></div><div class="math-tool-controls"><button type="button" data-act="mathx:cols:-1">− Column</button><strong>'+cols+' columns</strong><button type="button" data-act="mathx:cols:1">+ Column</button></div><p class="math-tool-result" aria-live="polite">'+rows+' × '+cols+' = '+(rows*cols)+'</p></section>';
}
function angles(session){
 const s=model(session),a=limit(s.angle,45,0,360),rad=a*Math.PI/180,xx=(100+78*Math.cos(rad)).toFixed(2),yy=(100-78*Math.sin(rad)).toFixed(2);
 const kind=a===0?'Zero angle':a<90?'Acute':a===90?'Right angle':a<180?'Obtuse':a===180?'Straight angle':a<360?'Reflex':'Full turn';
 return '<section class="math-tool"><h3>📐 Explore angles</h3><p class="muted small">Change the angle in 15° steps. Watch how the opening changes.</p><svg viewBox="0 0 200 200" width="100%" height="210" role="img" aria-label="Angle '+a+' degrees, '+kind+'" class="math-extra-angle"><circle cx="100" cy="100" r="84" fill="#ecfaef" stroke="#398453" stroke-width="3"/><line x1="100" y1="100" x2="178" y2="100" stroke="#28674a" stroke-width="6" stroke-linecap="round"/><line x1="100" y1="100" x2="'+xx+'" y2="'+yy+'" stroke="#eb9e39" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#22583b"/></svg><p class="math-tool-result" aria-live="polite">'+a+'° — '+kind+'</p><div class="math-tool-controls"><button type="button" data-act="mathx:angle:-15">− 15°</button><button type="button" data-act="mathx:angle:15">+ 15°</button><button type="button" data-act="mathx:angle:90">+ 90°</button><button type="button" data-act="mathx:angle:reset">Reset</button></div></section>';
}
function money(session){
 const s=model(session),p=limit(s.pence,0,0,20000),coins=[1,2,5,10,20,50,100,200];
 const items=coins.map(v=>'<button type="button" class="math-extra-coin" data-act="mathx:coin:'+v+'" aria-label="Add '+(v>=100?'£'+(v/100):v+' pence')+'">'+(v>=100?'£'+v/100:v+'p')+'</button>').join('');
 return '<section class="math-tool"><h3>🪙 Count British coins</h3><p class="muted small">Tap coins to build a total. This is practice money, not your avatar coins.</p><div class="math-extra-coins">'+items+'</div><p class="math-tool-result" aria-live="polite">Total: £'+(p/100).toFixed(2)+'</p><div class="math-tool-controls"><button type="button" data-act="mathx:coin:clear">Clear money</button><button type="button" data-act="mathx:coin:undo">Undo last coin</button></div></section>';
}
function supports(id,world){
 const out=[];
 if(['place','operations'].includes(id))out.push('place');
 if(['multiply','factors','powers','geometry_area','measure_volume'].includes(id))out.push('array');
 if(['geometry_angles','geometry_triangles','stats_pie'].includes(id))out.push('angle');
 if(['ratio_rates','percent_change'].includes(id))out.push('money');
 return out;
}
function render(id,world,session){if(!session||session.type!=='mission'||!['lesson','question','hint','teaching'].includes(session.mode))return '';
 const components={place, array:arrays,angle:angles,money};return supports(id,world).map(x=>components[x](session)).join('');
}
function update(session,action){
 if(!session||session.type!=='mission'||typeof action!=='string'||!action.startsWith('mathx:'))return false;
 const bits=action.split(':'),s=model(session),name=bits[1],v=bits[2];
 if(name==='digit'&&/^[0-3]$/.test(v)){const i=Number(v);s.digits=Array.isArray(s.digits)&&s.digits.length===4?s.digits.map((a,j)=>limit(a,[3,4,6,5][j],0,9)):[3,4,6,5];s.digits[i]=(s.digits[i]+1)%10;return true}
 if(name==='digits'&&v==='reset'){s.digits=[3,4,6,5];return true}
 if((name==='rows'||name==='cols')&&['-1','1'].includes(v)){s[name]=Math.min(12,Math.max(1,limit(s[name],name==='rows'?3:4,1,12)+Number(v)));return true}
 if(name==='angle'&&['-15','15','90','reset'].includes(v)){s.angle=v==='reset'?45:Math.min(360,Math.max(0,limit(s.angle,45,0,360)+Number(v)));return true}
 if(name==='coin'){
 if(v==='clear'){s.pence=0;s.coinHistory=[];return true}
 if(v==='undo'){const hist=Array.isArray(s.coinHistory)?s.coinHistory:[];if(hist.length){const last=hist.pop();s.pence=Math.max(0,limit(s.pence,0,0,20000)-last);s.coinHistory=hist}return true}
 if(/^(?:1|2|5|10|20|50|100|200)$/.test(v)){const amt=Number(v),p=limit(s.pence,0,0,20000);if(amt+p>20000)return false;s.pence=p+amt;s.coinHistory=[...(Array.isArray(s.coinHistory)?s.coinHistory:[]),amt].slice(-200);return true}
 }
 return false;
}
root.JaxonMathToolsExtra=Object.freeze({supports,render,update});
})(window);
