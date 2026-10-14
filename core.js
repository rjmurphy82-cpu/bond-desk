// The Bond Desk: game server logic. Runs in the Vercel function (Upstash Redis) and in the
// host page's offline mode (in-memory store). `kv(cmds)` runs Redis commands, returns results.
import { NROUNDS, AMOUNTS } from "./game-data.js";
const TTL = 43200; // games expire after 12 hours
const K = (code, k) => `bd:${code}:${k}`;
const rid = n => Array.from({ length: n }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
const pin3 = () => String(100 + Math.floor(Math.random() * 900));
const clean = s => String(s || "").replace(/[<>&"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
export class GameError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (c, m) => { throw new GameError(c, m); };
const json = s => { try { return JSON.parse(s); } catch { return null; } };
const hobj = arr => { const o = {}; if (Array.isArray(arr)) for (let i = 0; i < arr.length; i += 2) o[arr[i]] = json(arr[i + 1]); else if (arr && typeof arr === "object") for (const k in arr) o[k] = json(arr[k]); return o; };
const allKeys = code => ["state", "v", "g", ...Array.from({ length: NROUNDS }, (_, r) => "d" + r)].map(k => K(code, k));
async function touch(kv, code, extra = []) { await kv([...extra, ["INCR", K(code, "v")], ...allKeys(code).map(k => ["EXPIRE", k, TTL])]); }
async function loadState(kv, code) {
  if (!/^\d{5}$/.test(String(code))) fail("no_game", "That game code doesn't exist.");
  const [st] = await kv([["GET", K(code, "state")]]); const s = json(st);
  if (!s) fail("no_game", "That game code doesn't exist or has ended."); return s;
}
const isHost = (s, hostKey) => !!hostKey && hostKey === s.hostKey;

export async function createGame(kv) {
  let code;
  for (let i = 0; i < 20; i++) { code = String(10000 + Math.floor(Math.random() * 90000)); const [ex] = await kv([["EXISTS", K(code, "state")]]); if (!+ex) break; }
  const hostKey = rid(24);
  await kv([["SET", K(code, "state"), JSON.stringify({ phase: "lobby", r: 0, hostKey, created: Date.now() }), "EX", TTL], ["SET", K(code, "v"), "1", "EX", TTL]]);
  return { code, hostKey };
}

export async function getState(kv, { code, gid, key, hostKey, since }) {
  const [v] = await kv([["GET", K(code, "v")]]);
  if (v === null || v === undefined) fail("no_game", "That game code doesn't exist or has ended.");
  if (since && String(since) === String(v)) return { v: +v, same: true };
  const res = await kv([["GET", K(code, "state")], ["HGETALL", K(code, "g")], ...Array.from({ length: NROUNDS }, (_, r) => ["HGETALL", K(code, "d" + r)])]);
  const s = json(res[0]); if (!s) fail("no_game", "That game has ended.");
  const groups = hobj(res[1]), host = isHost(s, hostKey);
  const me = gid && groups[gid] && groups[gid].key === key ? gid : null;
  const out = { v: +v, phase: s.phase, r: s.r, step: s.step || null, host,
    groups: Object.entries(groups).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)).map(([id, g]) => ({ gid: id, name: g.name, ...(host ? { pin: g.pin, manual: !!g.manual } : {}) })),
    me: me ? { gid: me, name: groups[me].name, pin: groups[me].pin } : null, decisions: [], locked: [] };
  for (let r = 0; r < NROUNDS; r++) {
    const d = hobj(res[2 + r]); const revealed = r < s.r || (r === s.r && (s.phase === "reveal" || s.phase === "final"));
    if (revealed || host) out.decisions[r] = d;
    else out.decisions[r] = me && d[me] ? { [me]: d[me] } : {};
    if (r === s.r) out.locked = Object.keys(d);
  }
  return out;
}

export async function join(kv, { code, name, pin }) {
  const s = await loadState(kv, code); name = clean(name);
  if (!name) fail("bad_name", "Type a group name first.");
  const [graw] = await kv([["HGETALL", K(code, "g")]]); const groups = hobj(graw);
  const hit = Object.entries(groups).find(([, g]) => g.name.toLowerCase() === name.toLowerCase());
  if (hit) {
    if (pin && String(pin) === String(hit[1].pin)) { const key = rid(16); hit[1].key = key; await touch(kv, code, [["HSET", K(code, "g"), hit[0], JSON.stringify(hit[1])]]); return { gid: hit[0], key, name: hit[1].name, pin: hit[1].pin, rejoined: true }; }
    fail("name_taken", "That name is taken. If it's your group, enter your group PIN to rejoin.");
  }
  if (Object.keys(groups).length >= 40) fail("full", "This game is full (40 players).");
  if (s.phase === "final") fail("ended", "This game has ended.");
  const gid = rid(8), key = rid(16), p = pin3();
  await touch(kv, code, [["HSET", K(code, "g"), gid, JSON.stringify({ name, pin: p, key, t: Date.now() })]]);
  return { gid, key, name, pin: p };
}

function checkPicks(picks) {
  const out = {}; for (const id of ["A", "B", "C"]) { const v = +((picks || {})[id] || 0); if (!AMOUNTS.includes(v)) fail("bad_pick", "Invalid amount."); out[id] = v; } return out;
}
async function authGroup(kv, code, gid, key) {
  const [g] = await kv([["HGET", K(code, "g"), gid]]); const grp = json(g);
  if (!grp || grp.key !== key) fail("not_in_game", "Your group isn't in this game. Join again."); return grp;
}
export async function decide(kv, { code, gid, key, r, picks }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  if (s.phase !== "open" || +r !== s.r) fail("closed", "This year is closed. Watch the board!");
  const p = checkPicks(picks);
  await touch(kv, code, [["HSET", K(code, "d" + s.r), gid, JSON.stringify({ ...p, t: Date.now() })]]); return { ok: true };
}
export async function undecide(kv, { code, gid, key, r }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  if (s.phase !== "open" || +r !== s.r) fail("closed", "This year is closed.");
  await touch(kv, code, [["HDEL", K(code, "d" + s.r), gid]]); return { ok: true };
}

export async function hostOp(kv, { code, hostKey, op, gid, picks, name }) {
  const s = await loadState(kv, code); if (!isHost(s, hostKey)) fail("not_host", "Only the host screen can do that.");
  const save = (extra = []) => touch(kv, code, [["SET", K(code, "state"), JSON.stringify(s), "EX", TTL], ...extra]);
  if (op === "start") { if (s.phase !== "lobby") fail("bad_op", "Already started."); s.phase = "open"; s.r = 0; await save(); }
  else if (op === "reveal") { if (s.phase !== "open") fail("bad_op", "Not open."); s.phase = "reveal"; s.step = "what"; await save(); }
  else if (op === "stand") { if (s.phase !== "reveal") fail("bad_op", "Not revealed."); if (s.step !== "stand") { s.step = "stand"; await save(); } }
  else if (op === "reopen") { if (s.phase !== "reveal") fail("bad_op", "Nothing to reopen."); s.phase = "open"; delete s.step; await save(); }
  else if (op === "next") { if (s.phase !== "reveal") fail("bad_op", "Reveal first."); delete s.step; if (s.r >= NROUNDS - 1) s.phase = "final"; else { s.r++; s.phase = "open"; } await save(); }
  else if (op === "enter") { if (s.phase !== "open") fail("bad_op", "This year is closed."); const p = checkPicks(picks); await save([["HSET", K(code, "d" + s.r), gid, JSON.stringify({ ...p, t: Date.now(), byHost: true })]]); }
  else if (op === "clear") { await save([["HDEL", K(code, "d" + s.r), gid]]); }
  else if (op === "add") { const n = clean(name); if (!n) fail("bad_name", "Name needed."); const id = rid(8); await save([["HSET", K(code, "g"), id, JSON.stringify({ name: n, pin: pin3(), key: rid(16), t: Date.now(), manual: true })]]); return { ok: true, gid: id }; }
  else if (op === "remove") { await save([["HDEL", K(code, "g"), gid], ...Array.from({ length: NROUNDS }, (_, r) => ["HDEL", K(code, "d" + r), gid])]); }
  else if (op === "end") { await kv(allKeys(code).map(k => ["DEL", k])); return { ok: true, ended: true }; }
  else fail("bad_op", "Unknown action.");
  return { ok: true };
}

export async function dispatch(kv, action, p) {
  if (action === "ping") { await kv([["GET", "bd:ping"]]); return { ok: true }; }
  if (action === "create") return createGame(kv);
  if (action === "state") return getState(kv, p);
  if (action === "join") return join(kv, p);
  if (action === "decide") return decide(kv, p);
  if (action === "undecide") return undecide(kv, p);
  if (action === "host") return hostOp(kv, p);
  fail("bad_action", "Unknown request.");
}

// In-memory Redis (offline mode in the browser, and local testing). Only the commands used above.
export function memoryKV() {
  const m = new Map(), exp = new Map();
  const live = k => { if (exp.has(k) && exp.get(k) < Date.now()) { m.delete(k); exp.delete(k); } return m.get(k); };
  const run = c => { const [cmd, k, ...a] = c; const v = live(k);
    switch (cmd) {
      case "GET": return v === undefined ? null : v;
      case "SET": m.set(k, a[0]); if (a[1] === "EX") exp.set(k, Date.now() + a[2] * 1000); return "OK";
      case "EXISTS": return v === undefined ? 0 : 1;
      case "INCR": { const n = (+(v || 0)) + 1; m.set(k, String(n)); return n; }
      case "EXPIRE": if (v !== undefined) exp.set(k, Date.now() + a[0] * 1000); return v === undefined ? 0 : 1;
      case "HSET": { const h = v || {}; h[a[0]] = a[1]; m.set(k, h); return 1; }
      case "HGET": return v && a[0] in v ? v[a[0]] : null;
      case "HDEL": if (v) delete v[a[0]]; return 1;
      case "DEL": m.delete(k); exp.delete(k); return 1;
      case "HGETALL": return v ? Object.entries(v).flat() : [];
      default: throw new Error("memoryKV: " + cmd);
    } };
  return async cmds => cmds.map(run);
}
