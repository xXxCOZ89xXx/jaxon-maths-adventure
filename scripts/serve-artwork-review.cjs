const http = require("http"),
  fs = require("fs"),
  path = require("path");
const root = path.resolve(__dirname, "..");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".webp": "image/webp",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
http
  .createServer((req, res) => {
    let file = path.resolve(
      root,
      "." + decodeURIComponent(req.url.split("?")[0]),
    );
    if (!file.startsWith(path.resolve(root) + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      res.setHeader(
        "Content-Type",
        types[path.extname(file)] || "application/octet-stream",
      );
      res.setHeader("Cache-Control", "no-store");
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Local artwork review http://127.0.0.1:4173/v3-adventure.html"),
  );
