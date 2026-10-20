// Credit Desk Live: game server logic. Same setup as The Bond Desk (Upstash Redis on Vercel,
// in-memory store for offline mode and local testing), with its own keys so the two games never mix.
// Each year: phase "rate" (groups score the borrower) -> "price" (groups find fair yield and buy)
// -> "reveal" (steps: rating -> bond -> stand) -> next year.
import { YEARS, AMOUNTS, LADDER, ratingFor } from "./credit-desk-data.js";
import { GameError, memoryKV } from "./core.js";
export { GameError, memoryKV };
const N = YEARS.length, TTL = 43200, FKEYS = ["history", "stability", "debt", "coverage", "cash", "backing"];
const K = (code, k) => `cd:${code}:${k}`;
const rid = n => Array.from({ length: n }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
const pin3 = () => String(100 + Math.floor(Math.random() * 900));
const clean = s => String(s || "").replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 24); // every screen escapes names, so "&" is safe
const fail = (c, m) => { throw new GameError(c, m); };
const json = s => { try { return JSON.parse(s); } catch { return null; } };
const hobj = arr => { const o = {}; if (Array.isArray(arr)) for (let i = 0; i < arr.length; i += 2) o[arr[i]] = json(arr[i + 1]); else if (arr && typeof arr === "object") for (const k in arr) o[k] = json(arr[k]); return o; };
const allKeys = code => ["state", "v", "g", ...Array.from({ length: N }, (_, r) => "d" + r)].map(k => K(code, k));
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

// What each screen may see: the host sees everything; a group sees only its own answers until the reveal.
export async function getState(kv, { code, gid, key, hostKey, since }) {
  const [v] = await kv([["GET", K(code, "v")]]);
  if (v === null || v === undefined) fail("no_game", "That game code doesn't exist or has ended.");
  if (since && String(since) === String(v)) return { v: +v, same: true };
  const res = await kv([["GET", K(code, "state")], ["HGETALL", K(code, "g")], ...Array.from({ length: N }, (_, r) => ["HGETALL", K(code, "d" + r)])]);
  const s = json(res[0]); if (!s) fail("no_game", "That game has ended.");
  const groups = hobj(res[1]), host = isHost(s, hostKey);
  const me = gid && groups[gid] && groups[gid].key === key ? gid : null;
  const out = { v: +v, phase: s.phase, r: s.r, step: s.step || null, host,
    groups: Object.entries(groups).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)).map(([id, g]) => ({ gid: id, name: g.name, ...(host ? { pin: g.pin, manual: !!g.manual } : {}) })),
    me: me ? { gid: me, name: groups[me].name, pin: groups[me].pin } : null, decisions: [], rated: [], priced: [] };
  for (let r = 0; r < N; r++) {
    const d = hobj(res[2 + r]);
    const past = r < s.r || (r === s.r && (s.phase === "final" || (s.phase === "reveal" && s.step === "stand")));
    if (past || host) out.decisions[r] = d;
    else out.decisions[r] = me && d[me] ? { [me]: d[me] } : {};
    if (r === s.r) { out.rated = Object.keys(d).filter(x => d[x] && d[x].rating); out.priced = Object.keys(d).filter(x => d[x] && d[x].amt !== undefined && d[x].amt !== null); }
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
async function getDec(kv, code, r, gid) { const [d] = await kv([["HGET", K(code, "d" + r), gid]]); return json(d) || {}; }
function checkScores(scores) {
  const out = {}; for (const k of FKEYS) { const v = +(scores || {})[k]; if (!(v >= 0 && v <= 4 && Number.isInteger(v))) fail("bad_scores", "Score all six factors first."); out[k] = v; }
  const total = Object.values(out).reduce((a, b) => a + b, 0); return { s: out, total, rating: ratingFor(total) };
}
const checkAmt = a => { a = +a || 0; if (!AMOUNTS.includes(a)) fail("bad_pick", "Invalid amount."); return a; };

export async function decide(kv, { code, gid, key, r, stage, scores, fair, amt }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  if (+r !== s.r) fail("closed", "That year is closed. Watch the board!");
  const cur = await getDec(kv, code, s.r, gid);
  if (stage === "rate") {
    if (s.phase !== "rate") fail("closed", "Rating is closed for this year. Watch the board!");
    const next = { ...checkScores(scores), rt: Date.now() };
    await touch(kv, code, [["HSET", K(code, "d" + s.r), gid, JSON.stringify(next)]]); return { ok: true, rating: next.rating, total: next.total };
  }
  if (stage === "price") {
    if (s.phase !== "price") fail("closed", "The market is closed. Watch the board!");
    if (!cur.rating) fail("no_rating", "Your group didn't lock in a rating this year, so your money stays in cash.");
    const next = { ...cur, fair: String(fair ?? "").slice(0, 8), amt: checkAmt(amt), pt: Date.now() };
    await touch(kv, code, [["HSET", K(code, "d" + s.r), gid, JSON.stringify(next)]]); return { ok: true };
  }
  fail("bad_stage", "Unknown step.");
}
export async function undecide(kv, { code, gid, key, r, stage }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  if (+r !== s.r) fail("closed", "That year is closed.");
  if (stage === "rate") { if (s.phase !== "rate") fail("closed", "Rating is closed."); await touch(kv, code, [["HDEL", K(code, "d" + s.r), gid]]); return { ok: true }; }
  if (stage === "price") { if (s.phase !== "price") fail("closed", "The market is closed."); const cur = await getDec(kv, code, s.r, gid); delete cur.amt; delete cur.fair; await touch(kv, code, [["HSET", K(code, "d" + s.r), gid, JSON.stringify(cur)]]); return { ok: true }; }
  fail("bad_stage", "Unknown step.");
}

const STEPS = ["rating", "bond", "stand"];
export async function hostOp(kv, { code, hostKey, op, gid, rating, amt, name, step }) {
  const s = await loadState(kv, code); if (!isHost(s, hostKey)) fail("not_host", "Only the host screen can do that.");
  const save = (extra = []) => touch(kv, code, [["SET", K(code, "state"), JSON.stringify(s), "EX", TTL], ...extra]);
  if (op === "start") { if (s.phase !== "lobby") fail("bad_op", "Already started."); s.phase = "rate"; s.r = 0; await save(); }
  else if (op === "price") { if (s.phase !== "rate") fail("bad_op", "Not in the rating step."); s.phase = "price"; await save(); }
  else if (op === "backToRate") { if (s.phase !== "price") fail("bad_op", "Not in the market step."); s.phase = "rate"; await save(); }
  else if (op === "reveal") { if (s.phase !== "price") fail("bad_op", "The market isn't open."); s.phase = "reveal"; s.step = "rating"; await save(); }
  else if (op === "step") { if (s.phase !== "reveal") fail("bad_op", "Reveal first."); if (!STEPS.includes(step)) fail("bad_op", "Unknown step."); if (s.step !== step) { s.step = step; await save(); } }
  else if (op === "reopen") { if (s.phase !== "reveal") fail("bad_op", "Nothing to reopen."); s.phase = "price"; delete s.step; await save(); }
  else if (op === "next") { if (s.phase !== "reveal") fail("bad_op", "Reveal first."); delete s.step; if (s.r >= N - 1) s.phase = "final"; else { s.r++; s.phase = "rate"; } await save(); }
  else if (op === "enter") { // the teacher enters or fixes a group's answer (offline mode or a dead iPad)
    if (s.phase !== "rate" && s.phase !== "price") fail("bad_op", "This year is closed.");
    if (!LADDER.includes(rating)) fail("bad_rating", "Pick a rating.");
    const cur = await getDec(kv, code, s.r, gid);
    const next = { ...cur, rating, rt: cur.rt || Date.now(), byHost: true };
    if (rating !== cur.rating) { delete next.s; next.total = null; }
    if (s.phase === "price" && amt !== undefined && amt !== null) { next.amt = checkAmt(amt); next.pt = Date.now(); }
    await save([["HSET", K(code, "d" + s.r), gid, JSON.stringify(next)]]);
  }
  else if (op === "clear") { await save([["HDEL", K(code, "d" + s.r), gid]]); }
  else if (op === "add") { const n = clean(name); if (!n) fail("bad_name", "Name needed."); const id = rid(8); await save([["HSET", K(code, "g"), id, JSON.stringify({ name: n, pin: pin3(), key: rid(16), t: Date.now(), manual: true })]]); return { ok: true, gid: id }; }
  else if (op === "remove") { await save([["HDEL", K(code, "g"), gid], ...Array.from({ length: N }, (_, r) => ["HDEL", K(code, "d" + r), gid])]); }
  else if (op === "end") { await kv(allKeys(code).map(k => ["DEL", k])); return { ok: true, ended: true }; }
  else fail("bad_op", "Unknown action.");
  return { ok: true };
}

export async function dispatch(kv, action, p) {
  if (action === "ping") { await kv([["GET", "cd:ping"]]); return { ok: true }; }
  if (action === "create") return createGame(kv);
  if (action === "state") return getState(kv, p);
  if (action === "join") return join(kv, p);
  if (action === "decide") return decide(kv, p);
  if (action === "undecide") return undecide(kv, p);
  if (action === "host") return hostOp(kv, p);
  fail("bad_action", "Unknown request.");
}
