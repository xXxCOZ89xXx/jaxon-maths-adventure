/* Owner-confirmed project inventory. Pure guards; NEVER discovers/probes a project. */
(function(root,factory){const p=factory();if(typeof module==='object'&&module.exports)module.exports=p;else root.V13StagingPolicy=p;})(globalThis,()=>{
 const mainRef='sfogrvedypgtxfvecmbx',deletedRef='mbdelspbjusarbwlltol',localRef='abcdefghijklmnopqrst';
 function assertRef(ref,{allowLocal=false}={}){if(typeof ref!=='string'||!/^[a-z]{20}$/.test(ref)||[mainRef,deletedRef].includes(ref)||(!allowLocal&&ref===localRef))throw Error('A new isolated staging reference is required. Main and the deleted project are forbidden.');return ref;}
 function assertEndpoint(url,{allowLocal=false}={}){const u=new URL(url);if(allowLocal&&u.protocol==='http:'&&u.hostname==='127.0.0.1'&&['54321','54322'].includes(u.port))return;const m=u.hostname.match(/^([a-z]{20})\.supabase\.co$/);if(u.protocol!=='https:'||!m)throw Error('Pinned staging endpoint required');assertRef(m[1]);}
 return Object.freeze({mainRef,deletedRef,localRef,assertRef,assertEndpoint});
});
