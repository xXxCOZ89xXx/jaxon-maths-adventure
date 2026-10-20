// A static, credential-free review album: screenshots use only fictional states.
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "tests/visual");
const manifest = JSON.parse(
  fs.readFileSync(path.join(out, "manifest.json"), "utf8"),
);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
for (const file of fs
  .readdirSync(path.join(out, "after"))
  .filter((f) => f.endsWith("-parent.jpg")))
  manifest.push({
    file: "after/" + file,
    title: "Parent dashboard · fictional family · 13.15 coins",
    group: "Parent journal",
    layout: file.replace("-parent.jpg", ""),
  });
for (const file of fs
  .readdirSync(path.join(out, "before"))
  .filter((f) => f.endsWith(".jpg")))
  manifest.push({
    file: "before/" + file,
    title: "Previous design · " + file.replace(".jpg", ""),
    group: "Before this redesign",
    layout: "desktop",
  });
for (const file of fs.readdirSync(path.join(out,"foundation")).filter(f=>f.endsWith(".jpg")))
  manifest.push({file:"foundation/"+file,title:"Previous foundation · "+file.replace(".jpg",""),group:"Previous foundation",layout:file.startsWith("ipad")?"ipad-portrait":"desktop"});
for (const file of fs.readdirSync(path.join(out,"pre-estate")).filter(f=>f.endsWith(".jpg")))
  manifest.push({file:"pre-estate/"+file,title:"Previous version · "+file.replace(".jpg",""),group:"Before Town and estate expansion",layout:"desktop"});
const styles = `.camp-comparison .grid{grid-template-columns:repeat(5,minmax(0,1fr))}.camp-comparison figure img{height:auto;object-fit:contain}@media(max-width:1000px){.camp-comparison .grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.camp-comparison .grid{grid-template-columns:1fr}}body{margin:0;background:#edf0e6;color:#243e33;font:16px/1.5 system-ui}header{padding:36px max(5vw,20px);background:#153d31;color:#f1ebcd}h1{font-size:38px;margin:10px 0}h2{font-size:27px}header a{color:#d5e8b1}main{max-width:1400px;margin:auto;padding:24px}nav{display:flex;gap:12px;flex-wrap:wrap}nav a{padding:8px 12px;border:1px solid #c5d3ad;border-radius:6px;text-decoration:none}section{margin:30px 0 55px;scroll-margin-top:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:18px}figure{margin:0;border:1px solid #c0cdb5;border-radius:10px;overflow:hidden;background:#fffdf2}figure img{display:block;width:100%;height:260px;object-fit:cover;object-position:top}figcaption{padding:13px 16px}figcaption strong{display:block}a{color:#245f40}.note{border:1px solid #c4d4b7;background:#e4ebd6;padding:16px;border-radius:9px}.layout{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#57704b}@media(max-width:600px){h1{font-size:29px}.grid{grid-template-columns:1fr}}@media print{header{color:#243e33;background:white}figure{break-inside:avoid}img{height:220px!important}}`;
function page(items, title, variant="") {
  const groups = [...new Set(items.map((i) => i.group))];
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${styles}</style><body class="${variant}"><header><div>JAXON’S MATHS ADVENTURE · V3</div><h1>${esc(title)}</h1><p>Original isometric artwork. Desktop and iPad layouts. Every screen uses fictional data.</p><nav><a href="index.html">Complete gallery</a><a href="worlds.html">World restoration pairs</a><a href="town.html">Eight Town locations</a><a href="compare.html">Previous comparison</a><a href="estate.html">Eight home stages</a><a href="estate-compare.html">Camp comparison</a><a href="architecture.html">Town exteriors & interiors</a><a href="../">Back to private game</a></nav></header><main><p class="note">Select any image to open it at full size; use your browser’s Back button to return. No development software needed. The parent dashboard shown here is a mocked fictional family, not a screenshot of your staging accounts. Physical iPad Safari and deferred recovery delivery remain pending.</p><nav>${groups.map((g, i) => `<a href="#group-${i}">${esc(g)}</a>`).join("")}</nav>${groups
    .map(
      (g, i) =>
        `<section id="group-${i}"><h2>${esc(g)}</h2><div class="grid">${items
          .filter((x) => x.group === g)
          .map(
            (x) =>
              `<figure><a href="${esc(x.file)}"><img src="${esc(x.file)}" alt="${esc(x.title + " — " + x.layout)}" loading="lazy" width="600" height="400"></a><figcaption><span class="layout">${esc(x.layout)}</span><strong>${esc(x.title)}</strong><a href="${esc(x.file)}">Open full-size screenshot</a></figcaption></figure>`,
          )
          .join("")}</div></section>`,
    )
    .join(
      "",
    )}<p class="note">Review only. V2, production data, the live homepage and GitHub Pages are unchanged. Main goal: one later consolidated family acceptance session.</p></main></html>`;
}
fs.writeFileSync(
  path.join(out, "index.html"),
  page(manifest, "The visual field journal"),
);
fs.writeFileSync(
  path.join(out, "worlds.html"),
  page(
    manifest.filter((x) => x.group === "World restoration"),
    "Nine worlds · before and restored",
  ),
);
fs.writeFileSync(
  path.join(out, "town.html"),
  page(
    manifest.filter((x) => x.group === "Practical Maths Town"),
    "Eight places to practise real life",
  ),
);
fs.writeFileSync(
  path.join(out, "gallery-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  "Built screenshot gallery:",
  manifest.length,
  "screens, including previous design and fictional parent dashboard.",
);

const pairs = fs.readdirSync(path.join(out,"foundation")).filter(f=>f.endsWith(".jpg")).flatMap(file=>[
  {file:"foundation/"+file,title:"Previous foundation",group:file.replace(".jpg",""),layout:"Before"},
  {file:"after/"+file,title:"Immersive stage and interactive camp",group:file.replace(".jpg",""),layout:"After"}
]);
fs.writeFileSync(path.join(out,"compare.html"),page(pairs,"From field journal to world stage"));

fs.writeFileSync(path.join(out,"estate.html"),page(manifest.filter(x=>x.group==="Camp progression"),"From wilderness tent to mansion estate"));
const venueIds=["market","cafe","bank","shops","station","home","leisure","work"];
const architecture=manifest.filter(x=>x.file.endsWith("desktop-town-overview.jpg"));
for(const id of venueIds)for(const kind of ["exterior-","town-"]) {
 const q=manifest.find(x=>x.file==="after/desktop-"+kind+id+".jpg");if(q)architecture.push({...q,group:id+" · outside and inside"});
}
fs.writeFileSync(path.join(out,"architecture.html"),page(architecture,"Eight recognisable places · outside and inside"));
const comparison=manifest.filter(x=>[1,4,6,7,8].some(i=>x.file===`after/desktop-camp-stage-${i}.jpg`)).map(x=>({...x,group:"Your home grows · tent, lodge, mill, manor, mansion"}));
fs.writeFileSync(path.join(out,"estate-compare.html"),page(comparison,"Five steps across the building journey","camp-comparison"));
