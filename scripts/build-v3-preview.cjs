// Produces a single downloadable HTML game with hash-authorised scripts and no cloud networking.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "preview-dist");
fs.mkdirSync(out, { recursive: true });
let html = fs.readFileSync(path.join(root, "v3-adventure.html"), "utf8"),
  hashes = [];
// Inject the art experiment only into the offline development artifact.
// Staging/production builds continue to use the unchanged source entry point.
html = html
  .replace('</head>', '<link rel="stylesheet" href="v3/painted-forest-preview.css" />\n<link rel="stylesheet" href="v3/painted-desert-preview.css" />\n<link rel="stylesheet" href="v3/guide-portraits-preview.css" />\n</head>')
  .replace('<script src="v3/app.js"></script>', '<script src="v3/painted-forest-preview.js"></script>\n<script src="v3/painted-desert-preview.js"></script>\n<script src="v3/guide-portraits-preview.js"></script>\n<script src="v3/app.js"></script>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  if (src.includes("cloud") || src.includes("staging"))
    throw Error("Cloud code forbidden in offline artifact");
  let js = fs
    .readFileSync(path.join(root, src), "utf8")
    .replace(/<\/script/gi, "<\\/script");
  if(src === 'v3/asset-checkpoint.js') {
    const dir=path.join(root,'v3/assets/checkpoint');
    const names=Object.keys(JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')).assets);
    const assets=Object.fromEntries(names.map(name=>[name,'data:image/webp;base64,'+fs.readFileSync(path.join(dir,name+'.webp')).toString('base64')]));
    js='window.V6AssetFiles='+JSON.stringify(assets)+';\n'+js;
  }
  if(src === 'v3/world-art.js') {
    const dir=path.join(root,'v3/assets/rollout');
    const names=Object.keys(JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')).assets);
    const assets=Object.fromEntries(names.map(name=>[name,'data:image/webp;base64,'+fs.readFileSync(path.join(dir,name+'.webp')).toString('base64')]));
    js='window.V7AssetFiles='+JSON.stringify(assets)+';\n'+js;
  }
  if(src === 'v3/painted-forest-preview.js') {
    const dir=path.join(root,'v3/assets/painted-forest-preview');
    const assets={
      forest:'data:image/jpeg;base64,'+fs.readFileSync(path.join(dir,'number-forest-painted-backdrop.jpg')).toString('base64'),
      rowan:'data:image/webp;base64,'+fs.readFileSync(path.join(dir,'rowan-guide-portrait-transparent.webp')).toString('base64'),
    };
    js='window.PaintedForestPreviewFiles='+JSON.stringify(assets)+';\n'+js;
  }
  if(src === 'v3/painted-desert-preview.js') {
    const dir=path.join(root,'v3/assets/fraction-desert-preview');
    const assets={
      desert:'data:image/jpeg;base64,'+fs.readFileSync(path.join(dir,'fraction-desert-painted-backdrop.jpg')).toString('base64'),
      saff:'data:image/webp;base64,'+fs.readFileSync(path.join(dir,'fraction-desert-guide-transparent.webp')).toString('base64'),
    };
    js='window.FractionDesertPreviewFiles='+JSON.stringify(assets)+';\n'+js;
  }
  if(src === 'v3/guide-portraits-preview.js') {
    const dir=path.join(root,'v3/assets/world-guide-portraits-preview');
    const assets=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')).assets.map(asset=>[
      asset.file.replace('-guide.webp',''), 'data:image/webp;base64,'+fs.readFileSync(path.join(dir,asset.file)).toString('base64')
    ]));
    const names={number:'number-forest',fractions:'fraction-desert',algebra:'algebra-peaks',geometry:'geometry-kingdom',ratio:'ratio-island',statistics:'statistics-city',probability:'probability-portal',measure:'measurement-mines',town:'practical-maths-town'};
    js='window.WorldGuidePortraitFiles='+JSON.stringify(Object.fromEntries(Object.entries(names).map(([world,name])=>[world,assets[name]])))+';\n'+js;
  }
  hashes.push(
    "'sha256-" + crypto.createHash("sha256").update(js).digest("base64") + "'",
  );
  return "<script>" + js + "</script>";
});
html = html
  .replace("script-src 'self'", "script-src " + hashes.join(" "))
  .replace(
    /<link rel="stylesheet" href="(v3\/[^"\s]+\.css)" \/>/g,
    (_, src) => "<style>" + fs.readFileSync(path.join(root, src), "utf8") + "</style>",
  )
  .replace(
    'href="icon.svg"',
    'href="data:image/svg+xml;base64,' +
      fs.readFileSync(path.join(root, "icon.svg")).toString("base64") +
      '"',
  )
  .replace('href="v3-adventure.html"', 'href="#main"');
fs.writeFileSync(path.join(out, "PLAY-V3.html"), html);
fs.writeFileSync(
  path.join(out, "README.txt"),
  "Jaxon’s Maths Adventure V3 — Fictional Offline Test Camp\n\nOpen PLAY-V3.html in a current desktop browser. No server, account or installation needed.\nOn iPad, download the Actions artifact, extract it and use a browser that can open local HTML; if Files shows a document preview, use the local-server method in docs/V3-PREVIEW.md.\nProgress belongs only to this browser and file location. Keep the file in one place. No cloud calls are permitted. This artifact never replaces the live game.\n",
);
console.log("Built preview-dist/PLAY-V3.html (standalone offline game).");

