const fs = require("fs"),
  crypto = require("crypto"),
  assert = require("assert/strict"),
  path = require("path");
const root = path.resolve(__dirname, ".."),
  read = (f) => fs.readFileSync(path.join(root, f)),
  hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
const manifest = JSON.parse(read("v3/assets/supplied-20261128/manifest.json")),
  assets = manifest.assets;
assert.equal(assets.length, 69);
assert.equal(new Set(assets.map((a) => a.name)).size, 69);
const E = require("../v3/engine").V3Engine;
const wardrobe = [
  ...E.wardrobeColours.flatMap((w) => w.colours.map((c) => c.id)),
  ...["fox", "dog", "cat", "frog", "robot", "axolotl", "bee"],
];
assert.equal(wardrobe.length, 55);
for (const name of wardrobe)
  assert(
    assets.some((a) => a.name === name),
    name,
  );
for (const a of assets) {
  const bytes = read(a.file);
  assert.equal(hash(bytes), a.sha256);
  assert.equal(bytes.length, a.bytes);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert(a.width > 0 && a.height > 0 && a.width <= 1024 && a.height <= 1024);
  assert.match(a.sourceSha256, /^[a-f0-9]{64}$/);
}
const proof = JSON.parse(read("tests/artwork-preserved-files.json"));
for (const f of proof.files)
  assert.equal(
    hash(
      f.normaliseLineEndings
        ? read(f.file).toString().replaceAll("\r\n", "\n")
        : read(f.file),
    ),
    f.sha256,
    "Protected source changed: " + f.file,
  );
const avatar = read("v3/avatar-art.js").toString();
for (const a of assets)
  assert(avatar.includes(a.file), a.file + " renderer mapping");
const demo = JSON.parse(read("work/public-demo/build-inventory.json"));
for (const a of assets) {
  assert(demo.files.some((f) => f.path === a.file));
  assert.equal(hash(read("demo-dist/" + a.file)), a.sha256);
}
const offline = read("preview-dist/PLAY-V3.html").toString();
for (const a of assets)
  assert(offline.includes('"' + a.name + '":"data:image/webp;base64,'));
for (const project of E.townProjects)
  for (const n of [0, 1, project.parts.length - 1, project.parts.length]) {
    const s = { bought: project.parts.slice(0, n) };
    const before = JSON.stringify(s);
    assert.equal(E.townProject(s, project.id).done, n === project.parts.length);
    assert.equal(JSON.stringify(s), before);
  }
console.log(
  `PASS 69 artwork hashes, 55 wardrobe mappings, exact game/demo/offline delivery, Town boundaries, and ${proof.files.length} unchanged original assets/core files.`,
);
