// Local test server: node dev.js  (uses an in-memory database)
process.env.BD_MEMORY = "1";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const { default: handler } = await import("./api/game.js");
const { default: reportHandler } = await import("./api/report.js");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/api/game" || u.pathname === "/api/report") {
    let body = ""; for await (const c of req) body += c;
    const r = { method: req.method, query: Object.fromEntries(u.searchParams), body: body ? JSON.parse(body) : {} };
    const w = { statusCode: 200, setHeader: (k, v) => res.setHeader(k, v), status(c) { this.statusCode = c; return this; }, json(o) { res.writeHead(this.statusCode, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); } };
    return (u.pathname === "/api/report" ? reportHandler : handler)(Object.assign(r, { headers: req.headers }), w);
  }
  let f = u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname;
  if (!path.extname(f)) f += ".html";   // like Vercel cleanUrls: /join -> join.html
  const fp = path.join(".", f);
  if (!fs.existsSync(fp)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": types[path.extname(fp)] || "text/plain" }); fs.createReadStream(fp).pipe(res);
}).listen(process.env.PORT || 3210, () => console.log("Bond Desk dev server on http://localhost:" + (process.env.PORT || 3210)));
