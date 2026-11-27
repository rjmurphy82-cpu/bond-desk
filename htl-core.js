// Hold the Line: game server logic. Same setup as the other live games (Upstash Redis on Vercel,
// in-memory store for local testing), with its own keys (ht:<code>:...).
// Phases: lobby (join + pledge) -> news q -> trade q -> news q+1 ... -> trade 11 -> final (q = 12).
// Each student is one player; the player's whole record (pledge, trade log, decision cards) is one hash field.
import { NQ, ORDER, ARCH, TAGS, PAYCHECK, Q as SCRIPT } from "./htl-data.js";
import { checkTrade, replay, value, posVal } from "./htl-score.js";
import { GameError, memoryKV } from "./core.js";
export { GameError, memoryKV };
const TTL = 43200;
const K = (code, k) => `ht:${code}:${k}`;
const rid = n => Array.from({ length: n }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
const pin3 = () => String(100 + Math.floor(Math.random() * 900));
const clean = (s, n = 24) => String(s || "").replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const fail = (c, m) => { throw new GameError(c, m); };
const json = s => { try { return JSON.parse(s); } catch { return null; } };
const hobj = arr => { const o = {}; if (Array.isArray(arr)) for (let i = 0; i < arr.length; i += 2) o[arr[i]] = json(arr[i + 1]); else if (arr && typeof arr === "object") for (const k in arr) o[k] = json(arr[k]); return o; };
const allKeys = code => ["state", "v", "p"].map(k => K(code, k));
async function touch(kv, code, extra = []) { await kv([...extra, ["INCR", K(code, "v")], ...allKeys(code).map(k => ["EXPIRE", k, TTL])]); }
async function loadState(kv, code) {
  if (!/^\d{5}$/.test(String(code))) fail("no_game", "That game code doesn't exist.");
  const [st] = await kv([["GET", K(code, "state")]]); const s = json(st);
  if (!s) fail("no_game", "That game code doesn't exist or has ended."); return s;
}
const isHost = (s, hostKey) => !!hostKey && hostKey === s.hostKey;
const pub = (id, p, full) => ({ gid: id, name: p.name, arch: p.arch || null, ...(full ? { pin: p.pin, dials: p.dials || {}, never: p.never || "", evenIf: p.evenIf || "", sign: p.sign || "", log: p.log || [], cards: p.cards || {}, seen: p.seen || [], done: p.done || [], reflect: p.reflect || null } : {}) });

export async function createGame(kv) {
  let code;
  for (let i = 0; i < 20; i++) { code = String(10000 + Math.floor(Math.random() * 90000)); const [ex] = await kv([["EXISTS", K(code, "state")]]); if (!+ex) break; }
  const hostKey = rid(24);
  await kv([["SET", K(code, "state"), JSON.stringify({ phase: "lobby", q: 0, hostKey, created: Date.now() }), "EX", TTL], ["SET", K(code, "v"), "1", "EX", TTL]]);
  return { code, hostKey };
}

// The host sees every player in full. A student sees only their own record plus class counts.
export async function getState(kv, { code, gid, key, hostKey, since }) {
  const [v] = await kv([["GET", K(code, "v")]]);
  if (v === null || v === undefined) fail("no_game", "That game code doesn't exist or has ended.");
  if (since && String(since) === String(v)) return { v: +v, same: true };
  const [st, praw] = await kv([["GET", K(code, "state")], ["HGETALL", K(code, "p")]]);
  const s = json(st); if (!s) fail("no_game", "That game has ended.");
  const players = hobj(praw), host = isHost(s, hostKey);
  const me = gid && players[gid] && players[gid].key === key ? gid : null;
  const list = Object.entries(players).sort((a, b) => (a[1].t || 0) - (b[1].t || 0));
  return {
    v: +v, phase: s.phase, q: s.q, host, secs: s.secs || null, opened: s.opened || null,
    count: list.length, pledged: list.filter(([, p]) => p.arch).length,
    doneCount: list.filter(([, p]) => (p.done || []).includes(s.q)).length,
    players: host ? list.map(([id, p]) => pub(id, p, true)) : [],
    me: me ? pub(me, players[me], true) : null
  };
}

export async function join(kv, { code, name, pin }) {
  const s = await loadState(kv, code); name = clean(name);
  if (!name) fail("bad_name", "Type your name first.");
  const [praw] = await kv([["HGETALL", K(code, "p")]]); const players = hobj(praw);
  const hit = Object.entries(players).find(([, p]) => p.name.toLowerCase() === name.toLowerCase());
  if (hit) {
    if (pin && String(pin) === String(hit[1].pin)) { const nk = rid(16); hit[1].key = nk; await touch(kv, code, [["HSET", K(code, "p"), hit[0], JSON.stringify(hit[1])]]); return { gid: hit[0], key: nk, name: hit[1].name, pin: hit[1].pin, rejoined: true }; }
    fail("name_taken", "That name is taken. If it's you, enter your PIN to rejoin.");
  }
  if (Object.keys(players).length >= 60) fail("full", "This game is full (60 players).");
  if (s.phase === "final") fail("ended", "This game has ended.");
  const gid = rid(8), k = rid(16), p = pin3();
  await touch(kv, code, [["HSET", K(code, "p"), gid, JSON.stringify({ name, pin: p, key: k, t: Date.now(), log: [], cards: {}, seen: [], done: [] })]]);
  return { gid, key: k, name, pin: p };
}
async function authPlayer(kv, code, gid, key) {
  const [raw] = await kv([["HGET", K(code, "p"), gid]]); const p = json(raw);
  if (!p || p.key !== key) fail("not_in_game", "You're not in this game. Join again."); return p;
}
const savePlayer = (kv, code, gid, p) => touch(kv, code, [["HSET", K(code, "p"), gid, JSON.stringify(p)]]);
const canPledge = (s, p) => s.phase === "lobby" || (s.q === 0 && s.phase !== "final" && !(p.log || []).length);

export async function pledge(kv, { code, gid, key, arch, dials, never, evenIf, sign }) {
  const s = await loadState(kv, code); const p = await authPlayer(kv, code, gid, key);
  if (!canPledge(s, p)) fail("locked", "Pledges are locked once you've traded.");
  const a = ARCH[arch]; if (!a) fail("bad_pick", "Pick an investor to follow.");
  const d = {};
  for (const [k, , mn, mx, step, def] of a.dials) {
    let x = dials && dials[k] != null ? +dials[k] : def; if (!isFinite(x)) x = def;
    x = Math.min(mx, Math.max(mn, Math.round(x / step) * step)); d[k] = Math.round(x * 10) / 10;
  }
  const nv = clean(never, 80), ev = clean(evenIf, 80), sg = clean(sign, 30);
  if (nv.length < 3 || ev.length < 3) fail("bad_pledge", "Finish your \"I will never ... even if ...\" sentence.");
  if (sg.length < 2) fail("bad_pledge", "Sign your pledge with your name.");
  Object.assign(p, { arch, dials: d, never: nv, evenIf: ev, sign: sg, pledgedAt: Date.now() });
  await savePlayer(kv, code, gid, p); return { ok: true, me: pub(gid, p, true) };
}

function openWindow(s, q) { if (s.phase !== "trade" || +q !== s.q) fail("closed", s.phase === "news" ? "Trading opens after the news. Eyes on the board!" : "This quarter is closed."); }

export async function trade(kv, { code, gid, key, q, a, side, amt, why, note }) {
  const s = await loadState(kv, code); const p = await authPlayer(kv, code, gid, key);
  openWindow(s, q);
  if (!p.arch) fail("no_pledge", "Sign your pledge before you trade.");
  if (!ARCH[p.arch].tags.includes(why)) fail("bad_why", "Pick the reason for this trade.");
  const t = { q: s.q, a: String(a), side: side === "sell" ? "sell" : "buy", amt: Math.round(+amt * 1e4) / 1e4, why, note: clean(note, 140), t: Date.now() };
  if (t.side === "sell") { const st = replay(p, s.q); if (st.h[t.a] && t.amt > st.h[t.a]) t.amt = st.h[t.a]; if (st.h[t.a] && st.h[t.a] - t.amt < 1e-4) t.amt = st.h[t.a]; }
  if (t.side === "buy") { const st = replay(p, s.q); if (t.amt > st.cash && t.amt - st.cash < 0.01) t.amt = Math.floor(st.cash * 100) / 100; }
  const err = checkTrade(p, t); if (err) fail("bad_trade", err);
  if (t.why === "other" && !t.note) fail("bad_why", "You picked Other: explain in the note.");
  p.log = [...(p.log || []), t];
  await savePlayer(kv, code, gid, p); return { ok: true, me: pub(gid, p, true) };
}
export async function undo(kv, { code, gid, key, q }) {
  const s = await loadState(kv, code); const p = await authPlayer(kv, code, gid, key);
  openWindow(s, q);
  const log = p.log || []; const last = log[log.length - 1];
  if (!last || last.q !== s.q) fail("bad_op", "Nothing to undo this quarter.");
  p.log = log.slice(0, -1);
  await savePlayer(kv, code, gid, p); return { ok: true, me: pub(gid, p, true) };
}
export async function card(kv, { code, gid, key, q, kind, choice, why, note }) {
  const s = await loadState(kv, code); const p = await authPlayer(kv, code, gid, key);
  openWindow(s, q);
  if (!p.arch) fail("no_pledge", "Sign your pledge first.");
  const sc = SCRIPT[s.q];
  if (kind === "forced" && !sc.forced) fail("bad_op", "No decision card this quarter.");
  if (kind === "paycheck" && !PAYCHECK[s.q]) fail("bad_op", "No paycheck this quarter.");
  if (kind !== "forced" && kind !== "paycheck") fail("bad_op", "Unknown card.");
  const ok = kind === "forced" ? ["buy", "sell", "hold"] : ["invest", "cash"];
  if (!ok.includes(choice)) fail("bad_pick", "Make your choice first.");
  if (!ARCH[p.arch].tags.includes(why)) fail("bad_why", "Pick your reason.");
  if (why === "other" && !clean(note, 140)) fail("bad_why", "You picked Other: explain in the note.");
  let asset = kind === "forced" ? sc.forced.asset : null;
  if (asset === "LARGEST") { const st = replay(p, s.q); asset = Object.keys(st.h).sort((x, y) => posVal(st, y, s.q) - posVal(st, x, s.q))[0] || "cash"; }
  p.cards = { ...(p.cards || {}), [s.q + ":" + kind]: { q: s.q, kind, choice, why, note: clean(note, 140), asset, t: Date.now() } };
  await savePlayer(kv, code, gid, p); return { ok: true, me: pub(gid, p, true) };
}
// Research opened: saved quietly (no version bump, so the class doesn't refetch)
export async function seen(kv, { code, gid, key, q }) {
  const s = await loadState(kv, code); const p = await authPlayer(kv, code, gid, key);
  q = +q; if (!(q >= 0 && q <= s.q && q < NQ)) return { ok: true };
  if (!(p.seen || []).includes(q)) { p.seen = [...(p.seen || []), q]; await kv([["HSET", K(code, "p"), gid, JSON.stringify(p)]]); }
  return { ok: true };
}
export async function done(kv, { code, gid, key, q, on }) {
  const s = await loadState(kv, code); const p = await authPlayer(kv, code, gid, key);
  openWindow(s, q);
  const set = new Set(p.done || []); on ? set.add(s.q) : set.delete(s.q); p.done = [...set];
  await savePlayer(kv, code, gid, p); return { ok: true, me: pub(gid, p, true) };
}
export async function reflect(kv, { code, gid, key, tempted, did, held }) {
  const s = await loadState(kv, code); const p = await authPlayer(kv, code, gid, key);
  if (s.phase !== "final") fail("bad_op", "Reflections open at the Final Bell.");
  const r = { tempted: clean(tempted, 600), did: clean(did, 600), held: clean(held, 600), t: Date.now() };
  if (r.tempted.length < 10 || r.did.length < 10 || r.held.length < 3) fail("bad_reflect", "Answer all three questions.");
  p.reflect = r; await savePlayer(kv, code, gid, p); return { ok: true, me: pub(gid, p, true) };
}

export async function hostOp(kv, { code, hostKey, op, gid, secs }) {
  const s = await loadState(kv, code); if (!isHost(s, hostKey)) fail("not_host", "Only the host screen can do that.");
  const save = (extra = []) => touch(kv, code, [["SET", K(code, "state"), JSON.stringify(s), "EX", TTL], ...extra]);
  if (op === "start") { if (s.phase !== "lobby") fail("bad_op", "Already started."); s.phase = "news"; s.q = 0; await save(); }
  else if (op === "trade") { if (s.phase !== "news") fail("bad_op", "Show the news first."); s.phase = "trade"; s.secs = Math.max(30, Math.min(900, +secs || 180)); s.opened = Date.now(); await save(); }
  else if (op === "back") { if (s.phase !== "trade") fail("bad_op", "Not trading."); s.phase = "news"; await save(); }
  else if (op === "next") { if (s.phase !== "trade") fail("bad_op", "Open trading first."); s.q++; s.phase = s.q >= NQ ? "final" : "news"; if (s.q > NQ) s.q = NQ; delete s.opened; await save(); }
  else if (op === "extend") { if (s.phase !== "trade") fail("bad_op", "Not trading."); s.secs = (s.secs || 0) + Math.max(15, Math.min(300, +secs || 30)); await save(); }
  else if (op === "remove") { await save([["HDEL", K(code, "p"), gid]]); }
  else if (op === "end") { await kv(allKeys(code).map(k => ["DEL", k])); return { ok: true, ended: true }; }
  else fail("bad_op", "Unknown action.");
  return { ok: true };
}

export async function dispatch(kv, action, p) {
  if (action === "ping") { await kv([["GET", "ht:ping"]]); return { ok: true }; }
  if (action === "create") return createGame(kv);
  if (action === "state") return getState(kv, p);
  if (action === "join") return join(kv, p);
  if (action === "pledge") return pledge(kv, p);
  if (action === "trade") return trade(kv, p);
  if (action === "undo") return undo(kv, p);
  if (action === "card") return card(kv, p);
  if (action === "seen") return seen(kv, p);
  if (action === "done") return done(kv, p);
  if (action === "reflect") return reflect(kv, p);
  if (action === "host") return hostOp(kv, p);
  fail("bad_action", "Unknown request.");
}
