// Produces a single downloadable HTML game with hash-authorised scripts and no cloud networking.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "preview-dist");
fs.mkdirSync(out, { recursive: true });
let html = fs.readFileSync(path.join(root, "v3-adventure.html"), "utf8"),
  hashes = [];
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  if (src.includes("cloud") || src.includes("staging"))
    throw Error("Cloud code forbidden in offline artifact");
  const js = fs
    .readFileSync(path.join(root, src), "utf8")
    .replace(/<\/script/gi, "<\\/script");
  hashes.push(
    "'sha256-" + crypto.createHash("sha256").update(js).digest("base64") + "'",
  );
  return "<script>" + js + "</script>";
});
html = html
  .replace("script-src 'self'", "script-src " + hashes.join(" "))
  .replace(
    '<link rel="stylesheet" href="v3/style.css" />',
    "<style>" +
      fs.readFileSync(path.join(root, "v3/style.css"), "utf8") +
      "</style>",
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
