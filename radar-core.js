// Recession Radar Live: game server logic. Same setup as the other live games (Upstash Redis on Vercel,
// in-memory store for "play without iPads" and local testing), with its own keys.
// Rounds 0-7: phase "open" (groups read the curve and lock in) -> "reveal" (steps: shape -> outcome -> stand) -> next.
// Round 8 is today's curve: phase "today" (groups make a call, nothing is scored) -> "final".
import { N, SHAPE_KEYS, CHIPS } from "./radar-data.js";
import { GameError, memoryKV } from "./core.js";
export { GameError, memoryKV };
const NR = N + 1, TTL = 43200;
const K = (code, k) => `rr:${code}:${k}`;
const rid = n => Array.from({ length: n }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
const pin3 = () => String(100 + Math.floor(Math.random() * 900));
const clean = s => String(s || "").replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
const fail = (c, m) => { throw new GameError(c, m); };
const json = s => { try { return JSON.parse(s); } catch { return null; } };
const hobj = arr => { const o = {}; if (Array.isArray(arr)) for (let i = 0; i < arr.length; i += 2) o[arr[i]] = json(arr[i + 1]); else if (arr && typeof arr === "object") for (const k in arr) o[k] = json(arr[k]); return o; };
const allKeys = code => ["state", "v", "g", ...Array.from({ length: NR }, (_, r) => "d" + r)].map(k => K(code, k));
async function touch(kv, code, extra = []) { await kv([...extra, ["INCR", K(code, "v")], ...allKeys(code).map(k => ["EXPIRE", k, TTL])]); }
async function loadState(kv, code) {
  if (!/^\d{5}$/.test(String(code))) fail("no_game", "That game code doesn't exist.");
  const [st] = await kv([["GET", K(code, "state")]]); const s = json(st);
  if (!s) fail("no_game", "That game code doesn't exist or has ended."); return s;
}
const isHost = (s, hostKey) => !!hostKey && hostKey === s.hostKey;
const acceptsAnswers = s => s.phase === "open" || s.phase === "today";

export async function createGame(kv) {
  let code;
  for (let i = 0; i < 20; i++) { code = String(10000 + Math.floor(Math.random() * 90000)); const [ex] = await kv([["EXISTS", K(code, "state")]]); if (!+ex) break; }
  const hostKey = rid(24);
  await kv([["SET", K(code, "state"), JSON.stringify({ phase: "lobby", r: 0, hostKey, created: Date.now() }), "EX", TTL], ["SET", K(code, "v"), "1", "EX", TTL]]);
  return { code, hostKey };
}

// The host sees everything; a group sees only its own answer for the open round until the reveal.
export async function getState(kv, { code, gid, key, hostKey, since }) {
  const [v] = await kv([["GET", K(code, "v")]]);
  if (v === null || v === undefined) fail("no_game", "That game code doesn't exist or has ended.");
  if (since && String(since) === String(v)) return { v: +v, same: true };
  const res = await kv([["GET", K(code, "state")], ["HGETALL", K(code, "g")], ...Array.from({ length: NR }, (_, r) => ["HGETALL", K(code, "d" + r)])]);
  const s = json(res[0]); if (!s) fail("no_game", "That game has ended.");
  const groups = hobj(res[1]), host = isHost(s, hostKey);
  const me = gid && groups[gid] && groups[gid].key === key ? gid : null;
  const out = { v: +v, phase: s.phase, r: s.r, step: s.step || null, host,
    groups: Object.entries(groups).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)).map(([id, g]) => ({ gid: id, name: g.name, ...(host ? { pin: g.pin, manual: !!g.manual } : {}) })),
    me: me ? { gid: me, name: groups[me].name, pin: groups[me].pin } : null, decisions: [], locked: [] };
  for (let r = 0; r < NR; r++) {
    const d = hobj(res[2 + r]);
    const shown = r < s.r || s.phase === "final" || (r === s.r && s.phase === "reveal");
    out.decisions[r] = shown || host ? d : (me && d[me] ? { [me]: d[me] } : {});
    if (r === s.r) out.locked = Object.keys(d);
  }
  return out;
}

export async function join(kv, { code, name, pin }) {
  const s = await loadState(kv, code); name = clean(name);
  if (!name) fail("bad_name", "Type your group name first.");
  const [graw] = await kv([["HGETALL", K(code, "g")]]); const groups = hobj(graw);
  const hit = Object.entries(groups).find(([, g]) => g.name.toLowerCase() === name.toLowerCase());
  if (hit) {
    if (pin && String(pin) === String(hit[1].pin)) { const key = rid(16); hit[1].key = key; await touch(kv, code, [["HSET", K(code, "g"), hit[0], JSON.stringify(hit[1])]]); return { gid: hit[0], key, name: hit[1].name, pin: hit[1].pin, rejoined: true }; }
    fail("name_taken", "That name is taken. If it's your group, enter your PIN to rejoin.");
  }
  if (Object.keys(groups).length >= 40) fail("full", "This game is full (40 groups).");
  if (s.phase === "final") fail("ended", "This game has ended.");
  const gid = rid(8), key = rid(16), p = pin3();
  await touch(kv, code, [["HSET", K(code, "g"), gid, JSON.stringify({ name, pin: p, key, t: Date.now() })]]);
  return { gid, key, name, pin: p };
}
async function authGroup(kv, code, gid, key) {
  const [g] = await kv([["HGET", K(code, "g"), gid]]); const grp = json(g);
  if (!grp || grp.key !== key) fail("not_in_game", "Your group isn't in this game. Join again."); return grp;
}
function checkAnswer(s, { shape, call, chips }) {
  if (!SHAPE_KEYS.includes(shape)) fail("bad_pick", "Pick the curve's shape first.");
  if (call !== "yes" && call !== "no") fail("bad_pick", "Make your recession call first.");
  const out = { shape, call, t: Date.now() };
  if (s.phase === "open") { chips = +chips; if (!CHIPS.includes(chips)) fail("bad_pick", "Bet 1, 2 or 3 chips."); out.chips = chips; }
  return out;
}

export async function decide(kv, { code, gid, key, r, shape, call, chips }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  if (+r !== s.r || !acceptsAnswers(s)) fail("closed", "This round is closed. Watch the board!");
  await touch(kv, code, [["HSET", K(code, "d" + s.r), gid, JSON.stringify(checkAnswer(s, { shape, call, chips }))]]);
  return { ok: true };
}
export async function undecide(kv, { code, gid, key, r }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  if (+r !== s.r || !acceptsAnswers(s)) fail("closed", "This round is closed.");
  await touch(kv, code, [["HDEL", K(code, "d" + s.r), gid]]); return { ok: true };
}

const STEPS = ["shape", "outcome", "stand"];
export async function hostOp(kv, { code, hostKey, op, gid, shape, call, chips, name, step }) {
  const s = await loadState(kv, code); if (!isHost(s, hostKey)) fail("not_host", "Only the host screen can do that.");
  const save = (extra = []) => touch(kv, code, [["SET", K(code, "state"), JSON.stringify(s), "EX", TTL], ...extra]);
  if (op === "start") { if (s.phase !== "lobby") fail("bad_op", "Already started."); s.phase = "open"; s.r = 0; await save(); }
  else if (op === "reveal") { if (s.phase !== "open") fail("bad_op", "No round is open."); s.phase = "reveal"; s.step = "shape"; await save(); }
  else if (op === "step") { if (s.phase !== "reveal") fail("bad_op", "Reveal first."); if (!STEPS.includes(step)) fail("bad_op", "Unknown step."); if (s.step !== step) { s.step = step; await save(); } }
  else if (op === "reopen") { if (s.phase !== "reveal") fail("bad_op", "Nothing to reopen."); s.phase = "open"; delete s.step; await save(); }
  else if (op === "next") { if (s.phase !== "reveal") fail("bad_op", "Reveal first."); delete s.step; s.r++; s.phase = s.r >= N ? "today" : "open"; await save(); }
  else if (op === "finish") { if (s.phase !== "today") fail("bad_op", "Open today's curve first."); s.phase = "final"; await save(); }
  else if (op === "backToday") { if (s.phase !== "final") fail("bad_op", "Not finished."); s.phase = "today"; await save(); }
  else if (op === "enter") { // the teacher enters or fixes a group's answer (offline mode or a dead iPad)
    if (!acceptsAnswers(s)) fail("bad_op", "This round is closed.");
    await save([["HSET", K(code, "d" + s.r), gid, JSON.stringify({ ...checkAnswer(s, { shape, call, chips }), byHost: true })]]);
  }
  else if (op === "clear") { await save([["HDEL", K(code, "d" + s.r), gid]]); }
  else if (op === "add") { const n = clean(name); if (!n) fail("bad_name", "Name needed."); const id = rid(8); await save([["HSET", K(code, "g"), id, JSON.stringify({ name: n, pin: pin3(), key: rid(16), t: Date.now(), manual: true })]]); return { ok: true, gid: id }; }
  else if (op === "remove") { await save([["HDEL", K(code, "g"), gid], ...Array.from({ length: NR }, (_, r) => ["HDEL", K(code, "d" + r), gid])]); }
  else if (op === "end") { await kv(allKeys(code).map(k => ["DEL", k])); return { ok: true, ended: true }; }
  else fail("bad_op", "Unknown action.");
  return { ok: true };
}

export async function dispatch(kv, action, p) {
  if (action === "ping") { await kv([["GET", "rr:ping"]]); return { ok: true }; }
  if (action === "create") return createGame(kv);
  if (action === "state") return getState(kv, p);
  if (action === "join") return join(kv, p);
  if (action === "decide") return decide(kv, p);
  if (action === "undecide") return undecide(kv, p);
  if (action === "host") return hostOp(kv, p);
  fail("bad_action", "Unknown request.");
}
