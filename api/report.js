// Vercel serverless function: /api/report
// Students submit their practice report here; the teacher dashboard (/teacher/reports) reads them back.
// Uses the same Upstash database as The Bond Desk. The dashboard needs a TEACHER_CODE environment variable in Vercel.
const envEnding = end => Object.keys(process.env).filter(k => k.endsWith(end) && !k.includes("READ_ONLY")).map(k => process.env[k]).find(Boolean);
const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || envEnding("_REST_API_URL") || envEnding("_REDIS_REST_URL");
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || envEnding("_REST_API_TOKEN") || envEnding("_REDIS_REST_TOKEN");
const LIST = "fin:reports", MAX = 3000, KEEP_DAYS = 180;

// Local testing only (node dev.js): a tiny in-memory stand-in for Upstash
const memDB = globalThis.__finReportsMem || (globalThis.__finReportsMem = { lists: {}, nums: {} });
async function memKV(cmds) {
  return cmds.map(([c, k, ...a]) => {
    const L = memDB.lists[k] || (memDB.lists[k] = []);
    if (c === "LPUSH") { L.unshift(...a); return L.length; }
    if (c === "LTRIM") { memDB.lists[k] = L.slice(+a[0], +a[1] + 1); return "OK"; }
    if (c === "LRANGE") return L.slice(+a[0], +a[1] + 1);
    if (c === "DEL") { delete memDB.lists[k]; return 1; }
    if (c === "INCR") return (memDB.nums[k] = (memDB.nums[k] || 0) + 1);
    return "OK"; // EXPIRE
  });
}
async function upstash(cmds) {
  const r = await fetch(URL.replace(/\/$/, "") + "/pipeline", { method: "POST", headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error("Database error (" + r.status + ").");
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const kv = process.env.BD_MEMORY ? memKV : (URL && TOKEN ? upstash : null);
  if (!kv) return res.status(503).json({ error: "db_not_configured", message: "The database isn't connected yet." });
  if (req.method !== "POST") return res.status(405).json({ error: "method", message: "Use POST." });
  let p = req.body || {};
  if (typeof p === "string") { try { p = JSON.parse(p || "{}"); } catch { p = {}; } }
  try {
    if (p.action === "submit") {
      const r = p.report || {};
      const name = clean(r.name, 40), period = clean(r.period, 12);
      if (!name) return res.status(400).json({ error: "no_name", message: "Type your name first." });
      if (!period) return res.status(400).json({ error: "no_period", message: "Pick your class period." });
      const body = JSON.stringify(r);
      if (body.length > 30000) return res.status(400).json({ error: "too_big", message: "That report is too long to send." });
      const ip = clean((req.headers["x-forwarded-for"] || "").split(",")[0] || "x", 60);
      const [n] = await kv([["INCR", "fin:rl:" + ip], ["EXPIRE", "fin:rl:" + ip, 60]]);
      if (n > 15) return res.status(429).json({ error: "slow_down", message: "Too many reports from this device. Wait a minute and try again." });
      const entry = { ...r, name, period, at: Date.now() };
      await kv([["LPUSH", LIST, JSON.stringify(entry)], ["LTRIM", LIST, 0, MAX - 1], ["EXPIRE", LIST, KEEP_DAYS * 86400]]);
      return res.status(200).json({ ok: true, at: entry.at });
    }
    if (p.action === "list" || p.action === "clear") {
      const code = process.env.TEACHER_CODE || (process.env.BD_MEMORY ? "test" : "");
      if (!code) return res.status(503).json({ error: "no_code", message: "Set a TEACHER_CODE in Vercel first (see the README)." });
      if (clean(p.code, 80) !== code) return res.status(403).json({ error: "bad_code", message: "That teacher code isn't right." });
      if (p.action === "clear") { await kv([["DEL", LIST]]); return res.status(200).json({ ok: true }); }
      const [rows] = await kv([["LRANGE", LIST, 0, MAX - 1]]);
      return res.status(200).json({ reports: (rows || []).map(x => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean) });
    }
    return res.status(400).json({ error: "action", message: "Unknown action." });
  } catch (e) { console.error(e); return res.status(500).json({ error: "server", message: "Something went wrong. Try again." }); }
}
