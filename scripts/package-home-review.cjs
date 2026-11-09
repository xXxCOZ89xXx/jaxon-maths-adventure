// Review documents and fictional screenshots only; no game build or service access.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'work/home-review-materials');
const review='docs/review/home-exterior',names={exterior:'Home exterior',post:'Post and parcels',recycling:'Bins and recycling',meters:'Utility meters'};
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const assets={},refs={};
for(const phase of ['before','after'])for(const kind of Object.keys(names)){
 const file=`${phase}/${kind}.png`,bytes=fs.readFileSync(path.join(root,review,file));
 const id=crypto.createHash('sha256').update(bytes).digest('hex');
 assets[id]=bytes.toString('base64');refs[file]=id;
}
const report=fs.readFileSync(path.join(root,'docs/HOME-EXTERIOR-UPDATE.md'),'utf8');
const figures=Object.entries(names).map(([kind,name])=>`<section><h2>${name}</h2><div class="pair">${['before','after'].map(phase=>`<figure><figcaption>${phase==='before'?'Before':'After'}${phase==='before'&&kind!=='exterior'?' · selecting this activity returned to Post':''}</figcaption><img data-image="${phase}/${kind}.png" alt="${phase}: ${name}"></figure>`).join('')}</div></section>`).join('');
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Home exterior review</title><style>body{font:17px/1.5 system-ui;max-width:1400px;margin:auto;padding:24px;background:#f6f5ed;color:#203d33}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0;background:white;padding:12px}figcaption{font-weight:bold}img{width:100%;height:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}a:focus-visible{outline:3px solid #164f86}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>Home exterior: before and after</h1><p>Eight representative screenshots from fictional private-game fixtures at 820 × 1180. The full Home matrix covers both builds at desktop, iPad portrait, iPad landscape and 360 px touch sizes. These images are embedded: this gallery works offline after download.</p><p><a href="#report">Read the report</a> · REPORT.md and TEST-RESULTS.json are also included in the download.</p>${figures}<h2 id="report">Change and test report</h2><pre>${escape(report)}</pre><script type="application/json" id="images">${JSON.stringify({assets,refs})}</script><script>const images=JSON.parse(document.getElementById('images').textContent);for(const img of document.querySelectorAll('[data-image]'))img.src='data:image/png;base64,'+images.assets[images.refs[img.dataset.image]];</script></html>`;
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'REPORT.md'),report);
fs.copyFileSync(path.join(root,review,'TEST-RESULTS.json'),path.join(out,'TEST-RESULTS.json'));
fs.writeFileSync(path.join(out,'README.txt'),'Open index.html for the self-contained before/after gallery and report. Fictional fixtures only. No application, credentials, account data or unrelated private review notes are packaged.\n');
console.log('Packaged Home review: 8 embedded screenshots, report and test summary.');
