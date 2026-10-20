// Vercel serverless function: /api/credit (Credit Desk Live)
// The game rules live in /credit-core.js. Same database as The Bond Desk, separate keys.
import { dispatch, GameError, memoryKV } from "../credit-core.js";
// Finds the Upstash settings under any prefix Vercel used (KV_, STORAGE_, UPSTASH_REDIS_, ...)
const envEnding = end => Object.keys(process.env).filter(k => k.endsWith(end) && !k.includes("READ_ONLY")).map(k => process.env[k]).find(Boolean);
const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || envEnding("_REST_API_URL") || envEnding("_REDIS_REST_URL");
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || envEnding("_REST_API_TOKEN") || envEnding("_REDIS_REST_TOKEN");
const mem = process.env.BD_MEMORY ? memoryKV() : null; // local testing only
async function upstash(cmds) {
  const r = await fetch(URL.replace(/\/$/, "") + "/pipeline", { method: "POST", headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new GameError("db_error", "Database error (" + r.status + ").");
  const out = await r.json();
  return out.map(x => { if (x.error) throw new GameError("db_error", x.error); return x.result; });
}
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const kv = mem || (URL && TOKEN ? upstash : null);
  if (!kv) return res.status(503).json({ error: "db_not_configured", message: "The game database isn't connected yet. See the setup steps in README." });
  const p = req.method === "POST" ? (typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}) : req.query || {};
  try { res.status(200).json(await dispatch(kv, p.action, p)); }
  catch (e) { if (e instanceof GameError) res.status(400).json({ error: e.code, message: e.message }); else { console.error(e); res.status(500).json({ error: "server", message: "Something went wrong. Try again." }); } }
}
