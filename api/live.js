// Vercel serverless function: /api/live  (Bonds Live, the Kahoot-style class quiz)
// Uses the same Upstash Redis database as the other class games. Nothing else to configure.
// Paths look like games/1234, games/1234/state, games/1234/players/p1ab2c3.
import { memoryKV } from "../core.js";
const envEnding = end => Object.keys(process.env).filter(k => k.endsWith(end) && !k.includes("READ_ONLY")).map(k => process.env[k]).find(Boolean);
const URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || envEnding("_REST_API_URL") || envEnding("_REDIS_REST_URL");
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || envEnding("_REST_API_TOKEN") || envEnding("_REDIS_REST_TOKEN");
const mem = process.env.BD_MEMORY ? memoryKV() : null; // local testing only
const TTL = 60 * 60 * 4; // games erase themselves after 4 hours

async function upstash(cmds) {
  const r = await fetch(URL.replace(/\/$/, "") + "/pipeline", { method: "POST", headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error("Database error (" + r.status + ")");
  return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; });
}
const J = s => { if (s == null) return null; if (typeof s !== "string") return s; try { return JSON.parse(s); } catch { return null; } };
const keys = c => ({ meta: `bb:${c}:meta`, state: `bb:${c}:state`, players: `bb:${c}:players` });
function hashToObj(arr) { const o = {}; for (let i = 0; i < (arr || []).length; i += 2) o[arr[i]] = J(arr[i + 1]); return o; }
function setDeep(o, path, v) { const ks = path.split("/"); let t = o; ks.slice(0, -1).forEach(k => { if (typeof t[k] !== "object" || t[k] === null) t[k] = {}; t = t[k]; }); t[ks[ks.length - 1]] = v; }

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const kv = mem || (URL && TOKEN ? upstash : null);
  if (b.op === "ping") return res.json({ ok: !!kv });
  if (!kv) return res.status(503).json({ error: "No database connected" });
  const one = async cmd => (await kv([cmd]))[0];
  const parts = String(b.path || "").split("/").filter(Boolean);
  const code = parts[1], rest = parts.slice(2);
  if (parts[0] !== "games" || !/^\d{4}$/.test(code || "")) return res.status(400).json({ error: "Bad path" });
  const K = keys(code);
  try {
    if (b.op === "get") {
      if (!rest.length) {
        const [meta, state, pl] = await kv([["GET", K.meta], ["GET", K.state], ["HGETALL", K.players]]);
        if (!J(meta)) return res.json({ v: null });
        return res.json({ v: { ...J(meta), state: J(state), players: hashToObj(pl) } });
      }
      if (rest[0] === "state") return res.json({ v: J(await one(["GET", K.state])) });
      if (rest[0] === "players" && rest.length === 1) { const a = await one(["HGETALL", K.players]); return res.json({ v: a && a.length ? hashToObj(a) : null }); }
      if (rest[0] === "players" && rest[1]) return res.json({ v: J(await one(["HGET", K.players, rest[1]])) });
    }
    if (b.op === "set") {
      if (!rest.length) {
        const { state, players, ...meta } = b.v || {};
        if (+(await one(["EXISTS", K.meta]))) return res.status(409).json({ error: "Code in use" });
        await kv([["SET", K.meta, JSON.stringify(meta), "EX", TTL], ["SET", K.state, JSON.stringify(state || null), "EX", TTL]]);
        return res.json({ ok: true });
      }
      if (rest[0] === "state") { await one(["SET", K.state, JSON.stringify(b.v), "EX", TTL]); return res.json({ ok: true }); }
      if (rest[0] === "players" && rest[1]) {
        if (!+(await one(["EXISTS", K.meta]))) return res.status(404).json({ error: "No game" });
        await kv([["HSET", K.players, rest[1], JSON.stringify(b.v)], ["EXPIRE", K.players, TTL]]);
        return res.json({ ok: true });
      }
    }
    if (b.op === "update" && rest[0] === "players" && rest[1]) {
      const cur = J(await one(["HGET", K.players, rest[1]])) || {};
      Object.entries(b.v || {}).forEach(([k, v]) => setDeep(cur, k, v));
      await kv([["HSET", K.players, rest[1], JSON.stringify(cur)], ["EXPIRE", K.players, TTL]]);
      return res.json({ ok: true });
    }
    if (b.op === "remove" && !rest.length) { await kv([["DEL", K.meta], ["DEL", K.state], ["DEL", K.players]]); return res.json({ ok: true }); }
    return res.status(400).json({ error: "Unsupported" });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
