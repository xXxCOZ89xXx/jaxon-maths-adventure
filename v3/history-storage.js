/* Capability-gated retained history. No network or storage access on module load. */
(function(root){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),encoder=new TextEncoder(),MAX_NODE=200000;
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
async function hash(body){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(body)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
const validHash=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
function at(object,path){return path.reduce((v,k)=>v?.[k],object);}
function assign(object,path,value){let p=object;for(const k of path.slice(0,-1)){if(!p[k]||typeof p[k]!=='object'||['__proto__','constructor','prototype'].includes(k))throw Error('Invalid history path');p=p[k];}const last=path.at(-1);if(['__proto__','constructor','prototype'].includes(last))throw Error('Invalid history path');p[last]=value;}
async function pack(progress,{maxCurrentBytes=2000000}={}){
 if(progress?._historyV2)throw Error('Expected complete progress before preparing a save');
 const current=copy(progress),nodes=new Map(),refs=[];
 async function node(value){const body=canonical(value);if(encoder.encode(body).length>MAX_NODE)throw Error('History node exceeds the supported size; original progress retained');const id=await hash(body);nodes.set(id,body);return id;}
 async function value(v){const text=canonical(v);if(encoder.encode(text).length<64000)return node({kind:'value',value:v});const ids=[];for(let i=0;i<text.length;i+=8000)ids.push(await node({kind:'text',text:text.slice(i,i+8000)}));return node({kind:'json',root:await sequence(ids)});}
 async function sequence(ids){if(ids.length<=32)return node({kind:'sequence',children:ids});const groups=[];for(let i=0;i<ids.length;i+=32)groups.push(await sequence(ids.slice(i,i+32)));return sequence(groups);}
 async function array(values){return sequence(await Promise.all(values.map(value)));}
 async function dictionary(entries,depth=0){
  if(entries.length<=16)return node({kind:'map',entries:await Promise.all(entries.map(async([key,v])=>({key,root:await value(v)})))});
  const groups={};for(const entry of entries){const prefix=(await hash(entry[0]))[depth];(groups[prefix]||=[]).push(entry);}
  const slots={};for(const prefix of Object.keys(groups).sort())slots[prefix]=await dictionary(groups[prefix],depth+1);return node({kind:'dictionary',slots});
 }
 async function archive(path,mode='array'){
  const original=at(current,path);if(mode==='array'&&(!Array.isArray(original)||!original.length))return;
  if(mode==='completed'){
   if(!original||typeof original!=='object'||Array.isArray(original))return;
   const entries=Object.entries(original).filter(([,run])=>run?.done===true);if(!entries.length)return;
   const root=await dictionary(entries.sort(([a],[b])=>a<b?-1:a>b?1:0));for(const [id]of entries)delete original[id];refs.push({path,root,mode:'merge'});return;
  }
  refs.push({path,root:await array(original),mode:'array'});assign(current,path,[]);
 }
 const roots=[],archivePaths=[];
 function locate(v,path=[]){if(!v||typeof v!=='object')return;if(v.skills||v.adventure||Array.isArray(v.seen)||v.startingProfile)roots.push(path);for(const name of ['latest','progress'])if(v[name])locate(v[name],[...path,name]);if(v.pending?.progress)locate(v.pending.progress,[...path,'pending','progress']);if(v.conflict?.progress)locate(v.conflict.progress,[...path,'conflict','progress']);if(Array.isArray(v.archives)&&v.archives.length)archivePaths.push([...path,'archives']);}
 locate(current);
 for(const path of archivePaths)await archive(path);
 for(const base of roots){const v=at(current,base);
  for(const name of ['seen','seenQuestionIds'])await archive([...base,name]);
  for(const id of Object.keys(v.skills||{}).sort())for(const name of ['practiceEvidence','independentEvidence','practiceSeen','reviewSeen','practiceSeenIds','reviewSeenIds'])await archive([...base,'skills',id,name]);
  for(const id of Object.keys(v.startingProfile?.history||{}).sort())await archive([...base,'startingProfile','history',id]);
  await archive([...base,'adventure','townLifeV2','runs'],'completed');
 }
 if(typeof current.raw==='string'&&Object.keys(current).length===1){refs.push({path:['raw'],root:await value(current.raw),mode:'value'});current.raw='';}
 const sourceHash=await hash(canonical(progress));current._historyV2={version:2,sourceHash,refs};
 if(encoder.encode(canonical(current)).length>maxCurrentBytes)throw Error('Current progress needs review before archiving; active tasks and original data retained');
 return {progress:current,nodes:[...nodes].map(([id,body])=>({id,body}))};
}
async function restore(projection,readNode){
 const progress=copy(projection),meta=progress._historyV2;if(!meta)return progress;
 if(meta.version!==2||!validHash(meta.sourceHash)||!Array.isArray(meta.refs))throw Error('Unsupported history projection');
 const cached=new Map();
 async function read(id,depth=0){
  if(!validHash(id)||depth>32)throw Error('Invalid history reference');
  if(cached.has(id))return cached.get(id);
  const body=await readNode(id);if(typeof body!=='string'||await hash(body)!==id)throw Error('History is missing or failed verification; progress has not been replaced');
  const n=JSON.parse(body);let result;
  if(n.kind==='value')result=n.value;
  else if(n.kind==='text')result=n.text;
  else if(n.kind==='sequence'){if(!Array.isArray(n.children)||n.children.length>32)throw Error('Invalid history sequence');const children=await Promise.all(n.children.map(async id=>{const v=await read(id,depth+1),raw=JSON.parse(await readNode(id));return raw.kind==='sequence'?v:[v];}));result=children.flat(1);}
  else if(n.kind==='json'){const fragments=await read(n.root,depth+1);result=JSON.parse(fragments.join(''));}
  else if(n.kind==='map'){result={};for(const e of n.entries){if(['__proto__','constructor','prototype'].includes(e.key)||Object.hasOwn(result,e.key))throw Error('Invalid archived map key');result[e.key]=await read(e.root,depth+1);}}
  else if(n.kind==='dictionary'){result={};for(const id of Object.values(n.slots)){const part=await read(id,depth+1);for(const [k,v]of Object.entries(part)){if(Object.hasOwn(result,k))throw Error('Duplicate archived key');result[k]=v;}}}
  else throw Error('Unknown history node');
  cached.set(id,result);return result;
 }
 for(const ref of meta.refs){if(!Array.isArray(ref.path)||ref.path.some(k=>typeof k!=='string'))throw Error('Invalid history path');const data=await read(ref.root);assign(progress,ref.path,ref.mode==='merge'?{...data,...at(progress,ref.path)}:data);}
 delete progress._historyV2;if(await hash(canonical(progress))!==meta.sourceHash)throw Error('Restored history does not match the original progress');return progress;
}
function transport(rpc,{epoch=()=>0,cache=new Map()}={}){
 let batch=[],scheduled=false;
 function readNode(id){if(cache.has(id))return Promise.resolve(cache.get(id));return new Promise((resolve,reject)=>{batch.push({id,resolve,reject});if(!scheduled){scheduled=true;queueMicrotask(async()=>{const waiting=batch;batch=[];scheduled=false;try{for(let i=0;i<waiting.length;i+=16){const group=waiting.slice(i,i+16),r=await rpc('history_get',{ids:group.map(x=>x.id),gameEpoch:epoch()});for(const n of r.nodes||[]){if(await hash(n.body)!==n.id)throw Error('History hash mismatch');cache.set(n.id,n.body);}for(const w of group){if(!cache.has(w.id))throw Error('A history page is missing');w.resolve(cache.get(w.id));}}}catch(e){for(const w of waiting)w.reject(e);}});}});}
 return async(op,args={})=>{
  if(op==='read'){const r=await rpc('read_v2',{});return {...r,progress:await restore(r.progress,readNode)};}
  if(op!=='save'||args.storageVersion!==2)return rpc(op,args);
  const packed=await pack(args.progress);
  for(let i=0;i<packed.nodes.length;i+=64){const group=packed.nodes.slice(i,i+64),present=await rpc('history_has',{ids:group.map(n=>n.id),gameEpoch:epoch()}),existing=new Set(present.ids||[]);
   for(const node of group){cache.set(node.id,node.body);if(!existing.has(node.id))await rpc('history_put',{node,gameEpoch:epoch()});}
  }
  const result=await rpc('save_v2',{...args,progress:packed.progress});return result.conflict?{...result,progress:await restore(result.progress,readNode)}:result;
 };
}
// An async backend must atomically store nodes + document root. Cache changes only
// after durable commit. The original legacy string is retained as an immutable node.
async function localStore({backend,legacy,keys,preserveLegacyPending=false}){
 const cache=new Map(),marker='HISTORY-V2: update required to read retained history';
 for(const key of keys){if(await backend.get(key))continue;const raw=legacy.getItem(key);if(raw!==null){if(raw.startsWith('HISTORY-V2:'))throw Error('Retained history is unavailable on this device. Preserve this cache and restore a verified backup.');const p=JSON.parse(raw);if(!preserveLegacyPending&&p.version===1&&p.pending&&p.pending.storageVersion!==2)throw Error('Finish the original pending save before enabling history storage');}}
 for(const key of keys){
  const saved=await backend.get(key);if(saved){cache.set(key,JSON.stringify(await restore(saved,id=>backend.node(id))));continue;}
  const raw=legacy.getItem(key);if(raw!==null){const parsed=JSON.parse(raw);if(!preserveLegacyPending&&parsed.version===1&&parsed.pending&&parsed.pending.storageVersion!==2)throw Error('Finish the original pending save before enabling history storage');
   await backend.put(key+':original-legacy',await pack({raw}));await backend.put(key,await pack(parsed,{maxCurrentBytes:8000000}));cache.set(key,raw);legacy.setItem(key,marker);
  }
 }
 return {getItem:key=>cache.get(key)??legacy.getItem(key),async setItem(key,raw){const packed=await pack(JSON.parse(raw),{maxCurrentBytes:8000000});await backend.put(key,packed);cache.set(key,raw);legacy.setItem(key,marker);},async removeItem(){throw Error('History-backed data must not be silently removed');}};
}
function indexedDBBackend(name){
 let opened;const open=()=>opened||=(new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{r.result.createObjectStore('nodes');r.result.createObjectStore('documents');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}));
 async function get(store,key){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 return {get:key=>get('documents',key),node:id=>get('nodes',id),async put(key,packed){const db=await open();await new Promise((resolve,reject)=>{const tx=db.transaction(['nodes','documents'],'readwrite');for(const n of packed.nodes)tx.objectStore('nodes').put(n.body,n.id);tx.objectStore('documents').put(packed.progress,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('History storage transaction aborted'));});}};
}
const api={pack,restore,hash,canonical,transport,localStore,indexedDBBackend};root.V3HistoryStorage=api;if(typeof module!=='undefined')module.exports={V3HistoryStorage:api};
})(typeof window==='undefined'?globalThis:window);
