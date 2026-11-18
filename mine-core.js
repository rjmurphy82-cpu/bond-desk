// Hash Wars Live: game server logic. Same setup as the other live games (Upstash Redis on Vercel,
// in-memory store for local testing), with its own keys (hw:).
// Phases: lobby -> build (r = 0, desks buy their rig) -> reveal (step "rigs") -> open (r = 1..5) ->
// reveal (steps: answer -> [writeups in the halving round] -> results and standings) -> next ... -> final.
// The exit ticket opens on the final screen: each student answers on their own iPad.
import { N, ROUNDS, PLANS, MODEL_KEYS, EXIT, HALVING_ROUND, apply, replay } from "./mine-data.js";
import { GameError, memoryKV } from "./core.js";
export { GameError, memoryKV };
const NR = N + 1, TTL = 43200;
const K = (code, k) => `hw:${code}:${k}`;
const rid = n => Array.from({ length: n }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
const pin3 = () => String(100 + Math.floor(Math.random() * 900));
const clean = (s, n = 24) => String(s || "").replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const fail = (c, m) => { throw new GameError(c, m); };
const json = s => { try { return JSON.parse(s); } catch { return null; } };
const hobj = arr => { const o = {}; if (Array.isArray(arr)) for (let i = 0; i < arr.length; i += 2) o[arr[i]] = json(arr[i + 1]); else if (arr && typeof arr === "object") for (const k in arr) o[k] = json(arr[k]); return o; };
const allKeys = code => ["state", "v", "g", "x", ...Array.from({ length: NR }, (_, r) => "d" + r)].map(k => K(code, k));
async function touch(kv, code, extra = []) { await kv([...extra, ["INCR", K(code, "v")], ...allKeys(code).map(k => ["EXPIRE", k, TTL])]); }
async function loadState(kv, code) {
  if (!/^\d{5}$/.test(String(code))) fail("no_game", "That game code doesn't exist.");
  const [st] = await kv([["GET", K(code, "state")]]); const s = json(st);
  if (!s) fail("no_game", "That game code doesn't exist or has ended."); return s;
}
const isHost = (s, hostKey) => !!hostKey && hostKey === s.hostKey;
const accepts = s => s.phase === "build" || s.phase === "open";

export async function createGame(kv) {
  let code;
  for (let i = 0; i < 20; i++) { code = String(10000 + Math.floor(Math.random() * 90000)); const [ex] = await kv([["EXISTS", K(code, "state")]]); if (!+ex) break; }
  const hostKey = rid(24);
  await kv([["SET", K(code, "state"), JSON.stringify({ phase: "lobby", r: 0, hostKey, awards: {}, exit: false, created: Date.now() }), "EX", TTL], ["SET", K(code, "v"), "1", "EX", TTL]]);
  return { code, hostKey };
}

// The host sees everything. A desk sees every earlier round, plus only its own answer for the open round until the reveal.
export async function getState(kv, { code, gid, key, hostKey, since }) {
  const [v] = await kv([["GET", K(code, "v")]]);
  if (v === null || v === undefined) fail("no_game", "That game code doesn't exist or has ended.");
  if (since && String(since) === String(v)) return { v: +v, same: true };
  const res = await kv([["GET", K(code, "state")], ["HGETALL", K(code, "g")], ["HGETALL", K(code, "x")], ...Array.from({ length: NR }, (_, r) => ["HGETALL", K(code, "d" + r)])]);
  const s = json(res[0]); if (!s) fail("no_game", "That game has ended.");
  const groups = hobj(res[1]), host = isHost(s, hostKey);
  const me = gid && groups[gid] && groups[gid].key === key ? gid : null;
  const out = { v: +v, phase: s.phase, r: s.r, step: s.step || null, host, exit: !!s.exit,
    awards: (s.phase === "reveal" && s.r === HALVING_ROUND) || s.r > HALVING_ROUND || s.phase === "final" || host ? s.awards || {} : {},
    groups: Object.entries(groups).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)).map(([id, g]) => ({ gid: id, name: g.name, seats: g.seats || 3, ...(host ? { pin: g.pin } : {}) })),
    me: me ? { gid: me, name: groups[me].name, pin: groups[me].pin, seats: groups[me].seats || 3 } : null, decisions: [], locked: [] };
  for (let r = 0; r < NR; r++) {
    const d = hobj(res[3 + r]);
    const shown = r < s.r || s.phase === "final" || (r === s.r && s.phase === "reveal");
    out.decisions[r] = shown || host ? d : (me && d[me] ? { [me]: d[me] } : {});
    if (r === s.r) out.locked = Object.keys(d);
  }
  if (host) out.exits = Object.values(hobj(res[2]));
  return out;
}

export async function join(kv, { code, name, pin, seats }) {
  const s = await loadState(kv, code); name = clean(name);
  if (!name) fail("bad_name", "Type your desk name first.");
  const [graw] = await kv([["HGETALL", K(code, "g")]]); const groups = hobj(graw);
  const hit = Object.entries(groups).find(([, g]) => g.name.toLowerCase() === name.toLowerCase());
  if (hit) {
    if (pin && String(pin) === String(hit[1].pin)) { const key = rid(16); hit[1].key = key; await touch(kv, code, [["HSET", K(code, "g"), hit[0], JSON.stringify(hit[1])]]); return { gid: hit[0], key, name: hit[1].name, pin: hit[1].pin, rejoined: true }; }
    fail("name_taken", "That name is taken. If it's your desk, enter your PIN to rejoin.");
  }
  if (Object.keys(groups).length >= 40) fail("full", "This game is full (40 desks).");
  if (s.phase === "final") fail("ended", "This game has ended.");
  const gid = rid(8), key = rid(16), p = pin3(), st = Math.max(1, Math.min(5, Math.floor(+seats || 3)));
  await touch(kv, code, [["HSET", K(code, "g"), gid, JSON.stringify({ name, pin: p, key, seats: st, t: Date.now() })]]);
  return { gid, key, name, pin: p };
}
async function authGroup(kv, code, gid, key) {
  const [g] = await kv([["HGET", K(code, "g"), gid]]); const grp = json(g);
  if (!grp || grp.key !== key) fail("not_in_game", "Your desk isn't in this game. Join again."); return grp;
}

// Checks a decision against the desk's real position (every earlier round replayed).
async function checkDecision(kv, code, s, gid, p) {
  const r = s.r;
  const res = await kv([["GET", K(code, "state")], ...Array.from({ length: r }, (_, i) => ["HGETALL", K(code, "d" + i)])]);
  const decisions = res.slice(1).map(hobj);
  const desk = replay([gid], decisions, s.awards || {}, r - 1)[gid];
  const base = r === 0 ? { cash: 10000, btc: 0, plan: null, rig: { xp: 0, pro: 0, old: 0 }, pts: 0, built: false } : desk.desk;
  const num = o => { const x = {}; MODEL_KEYS.forEach(k => x[k] = Math.max(0, Math.min(20, Math.floor(+(o || {})[k] || 0)))); return x; };
  if (r === 0) {
    const d = { plan: p.plan, buy: num(p.buy), t: Date.now() };
    const a = apply(base, d, 0, false, true); if (a.err) fail("bad_pick", a.err); return d;
  }
  if (!base.built) fail("bad_pick", "Your desk didn't build a rig, so it sits out. Watch the board!");
  const R = ROUNDS[r], q = Math.floor(+p.q);
  if (!(q >= 0 && q < R.q.opts.length) || p.q === null || p.q === undefined || p.q === "") fail("bad_pick", "Answer the Prove It question first.");
  const d = { q, run: p.run !== false, sell: !!p.sell, cashout: !!p.cashout && !base.out, t: Date.now() };
  if (R.calc) { const c = String(p.calc ?? "").replace(/[^0-9.\-]/g, "").slice(0, 12); if (!c) fail("bad_pick", "Type your answer to the math question."); d.calc = c; }
  if (R.writeup) { const w = String(p.text || "").replace(/[<>`]/g, "").replace(/\s+/g, " ").trim().slice(0, 240); if (w.length < 15) fail("bad_pick", "Write your 1 to 2 sentence halving answer."); d.text = w; }
  const a = apply(base, d, r, false, true); if (a.err) fail("bad_pick", a.err);
  return d;
}

export async function decide(kv, p) {
  const { code, gid, key, r } = p;
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  if (+r !== s.r || !accepts(s)) fail("closed", "This round is closed. Watch the board!");
  const d = await checkDecision(kv, code, s, gid, p);
  await touch(kv, code, [["HSET", K(code, "d" + s.r), gid, JSON.stringify(d)]]);
  return { ok: true };
}
export async function undecide(kv, { code, gid, key, r }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  if (+r !== s.r || !accepts(s)) fail("closed", "This round is closed.");
  await touch(kv, code, [["HDEL", K(code, "d" + s.r), gid]]); return { ok: true };
}

// Exit ticket: one per student, on their own iPad
export async function exitTicket(kv, { code, name, answers }) {
  const s = await loadState(kv, code);
  if (!s.exit) fail("closed", "The exit ticket isn't open yet. Wait for your teacher.");
  name = clean(name, 30); if (!name) fail("bad_name", "Type your first name and last initial.");
  if (!Array.isArray(answers) || answers.length !== EXIT.length || answers.some((a, i) => !(Number.isInteger(a) && a >= 0 && a < EXIT[i].opts.length))) fail("bad_pick", "Answer all " + EXIT.length + " questions.");
  const right = answers.filter((a, i) => a === EXIT[i].ans).length;
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, "") || rid(6);
  await touch(kv, code, [["HSET", K(code, "x"), id, JSON.stringify({ name, answers, right, t: Date.now() })]]);
  return { ok: true, right, of: EXIT.length, key: EXIT.map(e => e.ans) };
}

const stepsFor = r => r === 0 ? ["rigs"] : r === HALVING_ROUND ? ["answer", "writeups", "results"] : ["answer", "results"];
export async function hostOp(kv, { code, hostKey, op, gid, name, step, on }) {
  const s = await loadState(kv, code); if (!isHost(s, hostKey)) fail("not_host", "Only the host screen can do that.");
  const save = (extra = []) => touch(kv, code, [["SET", K(code, "state"), JSON.stringify(s), "EX", TTL], ...extra]);
  if (op === "start") { if (s.phase !== "lobby") fail("bad_op", "Already started."); s.phase = "build"; s.r = 0; await save(); }
  else if (op === "reveal") { if (!accepts(s)) fail("bad_op", "No round is open."); s.phase = "reveal"; s.step = stepsFor(s.r)[0]; await save(); }
  else if (op === "step") { if (s.phase !== "reveal") fail("bad_op", "Reveal first."); if (!stepsFor(s.r).includes(step)) fail("bad_op", "Unknown step."); if (s.step !== step) { s.step = step; await save(); } }
  else if (op === "reopen") { if (s.phase !== "reveal") fail("bad_op", "Nothing to reopen."); s.phase = s.r === 0 ? "build" : "open"; delete s.step; await save(); }
  else if (op === "next") { if (s.phase !== "reveal") fail("bad_op", "Reveal first."); delete s.step; if (s.r >= N) s.phase = "final"; else { s.r++; s.phase = "open"; } await save(); }
  else if (op === "back") { if (s.phase !== "final") fail("bad_op", "Not finished."); s.phase = "reveal"; s.step = "results"; await save(); }
  else if (op === "award") { if (s.r !== HALVING_ROUND || s.phase !== "reveal") fail("bad_op", "Awards are for the halving write-ups."); s.awards = { ...(s.awards || {}) }; if (s.awards[gid]) delete s.awards[gid]; else s.awards[gid] = true; await save(); }
  else if (op === "exit") { s.exit = !!on; await save(); }
  else if (op === "clear") { await save([["HDEL", K(code, "d" + s.r), gid]]); }
  else if (op === "remove") { await save([["HDEL", K(code, "g"), gid], ...Array.from({ length: NR }, (_, r) => ["HDEL", K(code, "d" + r), gid])]); }
  else if (op === "end") { await kv(allKeys(code).map(k => ["DEL", k])); return { ok: true, ended: true }; }
  else fail("bad_op", "Unknown action.");
  return { ok: true };
}

export async function dispatch(kv, action, p) {
  if (action === "ping") { await kv([["GET", "hw:ping"]]); return { ok: true }; }
  if (action === "create") return createGame(kv);
  if (action === "state") return getState(kv, p);
  if (action === "join") return join(kv, p);
  if (action === "decide") return decide(kv, p);
  if (action === "undecide") return undecide(kv, p);
  if (action === "exit") return exitTicket(kv, p);
  if (action === "host") return hostOp(kv, p);
  fail("bad_action", "Unknown request.");
}
