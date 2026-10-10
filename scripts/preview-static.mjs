// Zero-dependency static preview server for the built app.
// Serves .vercel/output/static (Vercel build) or android-www (Capacitor
// bundle) with an SPA fallback to index.html.
// Run: node scripts/preview-static.mjs [dir] [port]
// (`vite preview` is broken in this repo snapshot: it expects
// dist/server/server.js, which the nitro build never emits.)
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

const root = process.cwd();
const dir =
  process.argv[2] ||
  (existsSync(path.join(root, "android-www", "index.html"))
    ? path.join(root, "android-www")
    : path.join(root, ".vercel", "output", "static"));
const port = Number(process.argv[3] || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/sw.js") {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("service worker disabled in static preview");
      return;
    }
    let file = path.join(dir, decodeURIComponent(url.pathname));
    try {
      const st = await stat(file);
      if (st.isDirectory()) file = path.join(file, "index.html");
    } catch {
      file = path.join(dir, "index.html");
    }
    const body = await readFile(file);
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  }
}).listen(port, () => console.log(`[preview-static] serving ${dir} on http://localhost:${port}`));
