const assert=require('node:assert/strict');
function solution(a,answer){const ops=[];
 if(a.kind==='ruler'){ops.push({op:'ruler',x:a.objectX,y:a.objectY});for(let n=a.step;n<=Number(answer)+1e-7;n+=a.step)ops.push({op:'reading',value:Number(n.toFixed(6))});}
 else if(a.kind==='numberline'){const value=Number(answer),jump=(a.max-a.min)/10,start=a.min+Math.floor((value-a.min)/jump)*jump;ops.push({op:'value',value:start});for(let n=start+a.step;n<=value+1e-7;n+=a.step)ops.push({op:'value',value:Number(n.toFixed(6))});}
 else if(a.kind==='jug')for(let n=a.step;n<=Number(answer)+1e-7;n+=a.step)ops.push({op:'value',value:n});
 else if(a.kind==='grid')ops.push({op:'point',point:JSON.parse(answer)});
 else {let targets=[];
  if(a.kind==='fraction')targets=Array.from({length:Math.round(Number(answer)*a.denominator)},(_,i)=>[i,i]);
  if(a.kind==='groups'){const key=JSON.parse(answer);if(a.counts){let item=0;for(const [target,n]of key.entries())for(let i=0;i<n;i++)targets.push([item++,target]);}else targets=key.map((target,i)=>[i,target]);}
  if(a.kind==='basket'){for(let i=0;i<a.items.length;i++)for(let j=i+1;j<a.items.length;j++)if(a.items[i].price+a.items[j].price===Number(answer))targets=[[i,0],[j,0]];assert.equal(targets.length,2);}
  for(const [item,target]of targets)ops.push({op:'pick',item},{op:'drop',target});
 }
 return ops;
}
function solve(a,answer,A,values={}){for(const op of solution(a,answer))assert(A.edit(a,values,op),JSON.stringify(op));assert(A.matches(a,answer,values),a.kind+' '+answer);return values;}
async function alternative(p,a,answer){for(const op of solution(a,answer)){
 const index=await p.locator('.d9-board [data-d9-action]').evaluateAll((els,op)=>els.findIndex(el=>{const a=JSON.parse(el.dataset.d9Action);return Object.keys(op).every(k=>typeof op[k]==='number'?Math.abs(a[k]-op[k])<1e-6:JSON.stringify(a[k])===JSON.stringify(op[k]));}),op);
 assert(index>=0,'Missing accessible control: '+JSON.stringify(op));await p.locator('.d9-board [data-d9-action]').nth(index).click();await saved(p);
}}
async function saved(p){await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-saving'));}
async function svgPoint(p,x,y){return p.locator('.d9-board svg').evaluate((svg,{x,y})=>{const q=svg.createSVGPoint();q.x=x;q.y=y;const p=q.matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y};},{x,y});}
async function drag(p,selector,to,{cancel=false,midway}={}){
 const loc=p.locator(selector);const box=await loc.boundingBox();assert(box);const start={x:box.x+box.width/2,y:box.y+box.height/2},client=await p.context().newCDPSession(p);
 const send=(type,x,y)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1,radiusX:8,radiusY:8,force:1}]});
 try{await send('touchStart',start.x,start.y);for(let n=1;n<=8;n++){await send('touchMove',start.x+(to.x-start.x)*n/8,start.y+(to.y-start.y)*n/8);if(n===4&&midway)await midway();}await send(cancel?'touchCancel':'touchEnd');await saved(p);}finally{await client.detach();}
}
module.exports={solution,solve,alternative,saved,svgPoint,drag};
