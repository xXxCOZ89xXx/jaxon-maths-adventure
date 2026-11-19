/* New question presentation only. Existing saved rows are never passed through this. */
(function(root){'use strict';
const marker=()=>typeof module!=='undefined'?require('./answer-marking').V3AnswerMarking:root.V3AnswerMarking;
const num=s=>marker().parse(s)?.value,fmt=n=>String(Number(n.toPrecision(10))),copy=x=>JSON.parse(JSON.stringify(x));
function numbers(p){return [...String(p).replace(/−/g,'-').matchAll(/[-+]?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?/g)].map(m=>({text:m[0],value:num(m[0])})).filter(n=>Number.isFinite(n.value));}
function comparison(prompt,answer,numericOnly=false){
 if(!/which is (?:greater|smaller|larger)|choose the (?:larger|smaller)|which is in the middle/i.test(prompt))return null;
 const ns=numbers(prompt),unique=ns.filter((n,i)=>ns.findIndex(m=>m.value===n.value)===i);if(unique.length<2||!unique.some(n=>marker().matches(answer,n.text)))return null;
 const orderedValues=[...unique].sort((a,b)=>a.value-b.value),correct=/smaller/i.test(prompt)?orderedValues[0]:/middle/i.test(prompt)?orderedValues[Math.floor(orderedValues.length/2)]:orderedValues.at(-1);if(!marker().matches(String(correct.value),answer))return null;const choices=[correct.text],labels={[correct.text]:correct.text},reasons={};
 for(const n of unique){if(n===correct)continue;choices.push(n.text);labels[n.text]=n.text;reasons[n.text]='Compare the values using equal-sized parts or the same number-line scale.';}
 const candidate=numericOnly?[unique[0].value+unique[1].value,Math.abs(unique[0].value-unique[1].value),1/unique[0].value,unique[1].value*10,...unique.flatMap(n=>[n.value*10,n.value/10])]:['equal','not enough information'];
 for(const n of candidate){if(typeof n==='number'&&!Number.isFinite(n))continue;const value=typeof n==='number'?fmt(n):n;if(!choices.includes(value)&&!choices.some(v=>marker().matches(v,value))){choices.push(value);labels[value]=value==='equal'?'The values are equal':value;reasons[value]='The values are supplied, so compare them directly rather than adding or changing their scale.';}if(choices.length===4)break;}
 const [a,b]=unique,ordered=[...unique].sort((x,y)=>x.value-y.value).map(x=>x.text).join(' < ');
 const fractions=[a.text.match(/^(\d+)\s*\/\s*(\d+)$/),b.text.match(/^(\d+)\s*\/\s*(\d+)$/)];
 const steps=fractions.every(Boolean)?`Compare cross-products: ${fractions[0][1]} × ${fractions[1][2]} = ${Number(fractions[0][1])*Number(fractions[1][2])}; ${fractions[1][1]} × ${fractions[0][2]} = ${Number(fractions[1][1])*Number(fractions[0][2])}. ${ordered}. Select ${correct.text}.`:`Place the supplied values in order: ${ordered}. The requested value is ${correct.text}.`;
 return {answer:correct.text,choices:choices.slice(0,4),labels,reasons,steps};
}
function arithmetic(expression){
 const source=expression.replace(/−/g,'-').replace(/×/g,'*').replace(/÷/g,'/'),tokens=source.match(/\d+(?:\.\d+)?|[()+*/-]/g)||[];
 if(tokens.join('')!==source.replace(/\s/g,''))return null;let i=0;const steps=[],mistakes=[];
 function factor(){if(tokens[i]==='-'){i++;return -factor();}if(tokens[i]==='+'){i++;return factor();}if(tokens[i]==='('){i++;const n=add();if(tokens[i++]!==')')throw Error();return n;}const t=tokens[i++];if(!/^\d/.test(t||''))throw Error();return Number(t);}
 function operation(a,op,b){const v=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b;if(!Number.isFinite(v))throw Error();steps.push(`${fmt(a)} ${op==='*'?'×':op==='/'?'÷':op==='-'?'−':op} ${fmt(b)} = ${fmt(v)}`);mistakes.push({value:op==='*'?a+b:op==='/'?a*b:op==='+'?a-b:a+b,reason:'Using the wrong operation changes the result.'});return v;}
 function product(){let a=factor();while(['*','/'].includes(tokens[i])){const op=tokens[i++];a=operation(a,op,factor());}return a;}
 function add(){let a=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++];a=operation(a,op,product());}return a;}
 try{const value=add();if(/^[0-9.]+(?:[+*/-][0-9.]+)+$/.test(source.replace(/\s/g,''))){let flat=Number(tokens[0]);for(let n=1;n<tokens.length;n+=2){const b=Number(tokens[n+1]),op=tokens[n];flat=op==='+'?flat+b:op==='-'?flat-b:op==='*'?flat*b:flat/b;}mistakes.unshift({value:flat,reason:'Working strictly left to right ignored operation priority.'});}return i===tokens.length&&steps.length?{value,steps,mistakes}:null;}catch{return null;}
}
function calculated(prompt,answer,worked,contract){
 const p=prompt.replace(/−/g,'-'),n=numbers(p).map(n=>n.value),agrees=v=>Number.isFinite(v)&&marker().matches(String(v),answer,contract);
 const frac=p.match(/(\d+)\s*\/\s*(\d+)\s*([+−\-×÷])\s*(\d+)\s*\/\s*(\d+)/);
 if(frac){const a=Number(frac[1]),b=Number(frac[2]),op=frac[3],c=Number(frac[4]),d=Number(frac[5]);let top,bottom;
  if(op==='+'||op==='-'||op==='−'){top=a*d+(op==='+'?1:-1)*c*b;bottom=b*d;}else if(op==='×'){top=a*c;bottom=b*d;}else{top=a*d;bottom=b*c;}
  if(agrees(top/bottom))return {steps:[`${a}/${b} ${op} ${c}/${d} = ${top}/${bottom}`,`Simplify to ${answer}.`],mistakes:[{value:(a+c)/(b+d),reason:'Adding denominators changes the size of the parts.'},{value:a/b+c/d,reason:'Check whether the question asks for addition, subtraction, multiplication or division.'}]};
 }
 const authored=worked.replace(/−/g,'-').match(/^([\d\s().+×÷*/-]+)=/);if(authored){const result=arithmetic(authored[1].trim());if(result&&agrees(result.value))return result;}
 const prefix=p.replace(/^(?:Calculate|Work out|Evaluate)\s+/i,'').match(/^([\d\s().+×÷*/-]+)(?:=|\?|$)/);if(prefix){const result=arithmetic(prefix[1].trim());if(result&&agrees(result.value))return result;}
 const percent=p.match(/(?:Find|What is)\s*([\d.]+)%\s*of\s*([\d.]+)/i);if(percent){const rate=Number(percent[1]),base=Number(percent[2]);if(agrees(base*rate/100))return{steps:[`${rate}% = ${rate}/100`,`${fmt(base)} × ${rate}/100 = ${answer}`],mistakes:[{value:base*rate,reason:'A percentage must be divided by 100.'},{value:base*(1-rate/100),reason:'The percentage amount differs from the amount left.'}]};}
 const rounding=p.match(/Round\s+([\d.]+).*?(\d+)\s*(decimal places?|significant figures?)/i);if(rounding){const input=Number(rounding[1]),digits=Number(rounding[2]),value=/significant/i.test(rounding[3])?Number(input.toPrecision(digits)):Number(input.toFixed(digits));if(agrees(value))return{steps:[`Start with ${rounding[1]}. Keep ${digits} ${rounding[3]}.`,`Use the next digit to decide whether to round up: ${answer}.`],mistakes:[]};}
 if(/convert/i.test(p)&&n.length){const factor=/pence/i.test(p)&&/£/.test(p)?100:/pounds/i.test(p)&&/\dp\b/.test(p)?.01:null;if(factor&&agrees(n[0]*factor))return{steps:[`${fmt(n[0])} ${factor===100?'× 100':'÷ 100'} = ${answer}`],mistakes:[{value:n[0]/factor,reason:'The pounds/pence conversion was reversed.'},{value:n[0],reason:'The unit changed, so the numerical value must change too.'}]};}
 if(n.length>=2){
  const hint=worked.toLowerCase(),a=n[0],b=n[1];let expression;
  if(/triangle/.test(p.toLowerCase())&&/area/i.test(p)&&agrees(a*b/2)){expression=`${fmt(a)} × ${fmt(b)} ÷ 2`;}
  else if(/multiply|product|times/.test(hint)&&agrees(a*b)){expression=`${fmt(a)} × ${fmt(b)}`;}
  else if(/subtract|difference|remaining/.test(hint)&&agrees(a-b)){expression=`${fmt(a)} − ${fmt(b)}`;}
  else if(/subtract|difference|remaining/.test(hint)&&agrees(b-a)){expression=`${fmt(b)} − ${fmt(a)}`;}
  else if(/divide|division|quotient|per |sharing/.test(hint)&&agrees(a/b)){expression=`${fmt(a)} ÷ ${fmt(b)}`;}
  else if(/divide|division|quotient|per |sharing/.test(hint)&&agrees(b/a)){expression=`${fmt(b)} ÷ ${fmt(a)}`;}
  else if(/add|sum|total|combine/.test(hint)&&n.length<=8&&agrees(n.reduce((a,b)=>a+b,0))){expression=n.map(fmt).join(' + ');}
  if(expression)return{steps:[worked,`${expression} = ${answer}`],mistakes:[{value:a+b,reason:'Adding quantities is different from applying the required operation.'},{value:a*b,reason:'Multiplication is not interchangeable with division or subtraction.'},{value:a-b,reason:'Check the order and the operation.'}]};
 }
 return null;
}
function structured(q){
 const a=q[5]?.activity;if(!a||a.offgrid)return null;let answer;try{answer=JSON.parse(q[1]);}catch{return null;}
 if(a.kind==='plotset'&&Array.isArray(answer)&&answer.every(p=>Array.isArray(p)&&p.length===2)){
  const p=q[0].replace(/−/g,'-'),quadratic=p.match(/y\s*=\s*x²\s*\+\s*(-?\d+)/),linear=p.match(/y\s*=\s*(-?\d+)x\s*\+\s*(-?\d+)/);
  if(quadratic&&answer.every(([x,y])=>x*x+Number(quadratic[1])===y))return answer.map(([x,y])=>`${x}² + (${quadratic[1]}) = ${y}`).join('; ')+'. Plot these samples in order.';
  if(linear&&answer.every(([x,y])=>Number(linear[1])*x+Number(linear[2])===y))return answer.map(([x,y])=>`${linear[1]} × (${x}) + (${linear[2]}) = ${y}`).join('; ')+'. Join the samples.';
  return (q[4]||'Plot the supplied coordinates.')+' '+answer.map(([x,y],i)=>`${a.labels[i]}: x ${x}, y ${y}`).join('; ')+'.';
 }
 if(a.kind==='coordinate'&&Array.isArray(answer)&&answer.length===2)return (q[4]||'Read x horizontally and y vertically.')+` The required point is x ${answer[0]}, y ${answer[1]}.`;
 if(a.kind==='order'&&Array.isArray(answer))return answer.map((n,i)=>`${i+1}. ${a.items[n]}`).join(' ');
 if(a.kind==='match'&&Array.isArray(answer))return a.items.map((item,i)=>`${item} → ${a.labels[answer[i]]}`).join('; ')+'.';
 if(a.kind==='choice')return (q[4]||'Compare the supplied statements.')+' Select: '+a.labels[Number(q[1])]+'.';
 if(['chart','experiment','triangle'].includes(a.kind)&&Array.isArray(answer))return (q[4]||'Use the supplied values.')+' '+a.labels.map((label,i)=>`${label}: ${answer[i]}`).join('; ')+'.';
 return null;
}
function enrich(row){
 if(row[5]?.teachingVersion===1)return row;
 const q=copy(row),a=q[5]?.activity,A=marker();q[5]||={};
 const specific=structured(q);if(specific){q[4]=specific;q[5].teachingVersion=1;return q;}
 if(q[5].direct||a&&!['number','readgraph','place','angle','numberline'].includes(a.kind))return q;
 const context=q[5].answerContract||A.contract(q[0],q[5].unit),value=num(q[1]);if(!Number.isFinite(value))return q;
 const compare=comparison(q[0],q[1]),result=calculated(q[0],q[1],q[4]||'',context);q[5].teachingVersion=1;
 q[4]=compare?.steps||result?.steps.join('. ')||`${q[4]||q[3]||'Apply the rule to the supplied quantities.'} For this question, the result is ${q[1]}${context.unit?' '+context.unit:''}.`;
 if(compare){q[1]=compare.answer;q[5].answerContract={...context,strict:true};q[2]=compare.choices;q[5].choiceLabels=compare.labels;q[5].choiceReasons=compare.reasons;return q;}
 if(a)return q;
 const quantities=numbers(q[0]);
 const candidates=[...(result?.mistakes||[]),...quantities.map(n=>({value:n.value,reason:'This is a supplied quantity; complete the required calculation.'})),...(quantities.length>=2?[{value:quantities[0].value/quantities[1].value,reason:'Dividing the quantities uses a different operation.'}]:[]),...(/probability|chance|impossible/i.test(q[0])?[{value:1,reason:'Certainty is different from an impossible event.'},{value:.5,reason:'An event is not automatically equally likely.'},{value:100,reason:'Probability as a fraction differs from a percentage.'}]:[]),{value:value*10,reason:'A place-value shift multiplied the result by ten.'},{value:value/10,reason:'A place-value shift divided the result by ten.'},{value:value*100,reason:'A factor of 100 was applied instead of the required scale.'},{value:value/100,reason:'A factor of 100 was applied in the wrong direction.'},{value:-value,reason:'Check the sign and the direction of the operation.'}],wrong=[],reasons={};
 for(const m of candidates){if(!Number.isFinite(m.value)||Math.abs(m.value)>1e14)continue;const v=fmt(m.value);if(A.matches(q[1],v,context)||wrong.some(n=>A.matches(n,v,context)))continue;wrong.push(v);reasons[v]=m.reason;if(wrong.length===3)break;}
 if(wrong.length===3){const slot=Math.max(0,Math.min(3,q[2]?.indexOf(q[1])??0));wrong.splice(slot,0,q[1]);q[2]=wrong;q[5].choiceReasons=reasons;}
 return q;
}
const api={enrich,comparison,arithmetic};root.V3QuestionTeaching=api;if(typeof module!=='undefined')module.exports={V3QuestionTeaching:api};
})(typeof window==='undefined'?globalThis:window);
