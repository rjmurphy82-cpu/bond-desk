// Unit 5 Derivatives Live: game server logic for all eight games (four story games, four trading desks).
// Same setup as the other live games (Upstash Redis on Vercel, in-memory store for offline mode and
// local testing), with its own keys ("dv:") so the games never mix.
// Each round: phase "open" (players answer) -> "reveal" (desk steps: market -> stand) -> next round.
// Story "card" and "board" rounds have no answers: the host goes straight to the next round.
import { GAMES, nRounds, storyPoints, validPick, exValidate, CODENAMES, pitApply, pitOpen, pitFrac, emptyBook } from "./deriv-data.js";
import { GameError, memoryKV } from "./core.js";
export { GameError, memoryKV };
const TTL = 43200;
const K = (code, k) => `dv:${code}:${k}`;
const rid = n => Array.from({ length: n }, () => "abcdefghjkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 31)]).join("");
const pin3 = () => String(100 + Math.floor(Math.random() * 900));
const clean = s => String(s || "").replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
const fail = (c, m) => { throw new GameError(c, m); };
const json = s => { try { return JSON.parse(s); } catch { return null; } };
const hobj = arr => { const o = {}; if (Array.isArray(arr)) for (let i = 0; i < arr.length; i += 2) o[arr[i]] = json(arr[i + 1]); else if (arr && typeof arr === "object") for (const k in arr) o[k] = json(arr[k]); return o; };
const allKeys = (code, n) => ["state", "v", "g", ...Array.from({ length: n }, (_, r) => "d" + r), ...Array.from({ length: n }, (_, r) => "b" + r)].map(k => K(code, k));
async function touch(kv, code, n, extra = []) { await kv([...extra, ["INCR", K(code, "v")], ...allKeys(code, n).map(k => ["EXPIRE", k, TTL])]); }
async function loadState(kv, code) {
  if (!/^\d{5}$/.test(String(code))) fail("no_game", "That game code doesn't exist.");
  const [st] = await kv([["GET", K(code, "state")]]); const s = json(st);
  if (!s || !GAMES[s.game]) fail("no_game", "That game code doesn't exist or has ended."); return s;
}
const isHost = (s, hostKey) => !!hostKey && hostKey === s.hostKey;
const answerable = (G, r) => G.kind !== "story" || (G.rounds[r] && G.rounds[r].t === "q");
const NR = s => s.nr || nRounds(s.game);   // rounds in this game (the exchange lets the host pick)
const cleanPick = (G, R, pick) => G.kind === "exchange" ? exValidate(R, pick) : validPick(G, R, pick);
const nextCode = groups => { const used = new Set(Object.values(groups).map(g => g.code)); const free = CODENAMES.filter(c => !used.has(c)); return free.length ? free[Math.floor(Math.random() * free.length)] : "Desk " + (used.size + 1); };
// One pit action at a time per game, so two desks can't take the same order
async function withLock(kv, code, fn) {
  const lk = K(code, "lock");
  for (let i = 0; i < 40; i++) {
    const [ok] = await kv([["SET", lk, "1", "NX", "EX", "5"]]);
    if (ok === "OK" || ok === true) { try { return await fn(); } finally { await kv([["DEL", lk]]); } }
    await new Promise(r => setTimeout(r, 60 + Math.random() * 60));
  }
  fail("busy", "The market is busy. Try again.");
}
const nextRole = groups => { const v = Object.values(groups); return v.filter(g => g.role === "buy").length <= v.filter(g => g.role === "sell").length ? "buy" : "sell"; };

export async function createGame(kv, { game, nr, mode }) {
  if (!GAMES[game]) fail("bad_game", "Pick a game first.");
  const G = GAMES[game]; nr = G.kind === "exchange" ? Math.max(1, Math.min(G.rounds.length, Math.round(+nr || G.defaultRounds))) : undefined;
  let code;
  for (let i = 0; i < 20; i++) { code = String(10000 + Math.floor(Math.random() * 90000)); const [ex] = await kv([["EXISTS", K(code, "state")]]); if (!+ex) break; }
  const hostKey = rid(24);
  await kv([["SET", K(code, "state"), JSON.stringify({ phase: "lobby", r: 0, game, nr, mode: G.kind === "exchange" ? (mode === "sealed" ? "sealed" : "pit") : undefined, hostKey, created: Date.now() }), "EX", TTL], ["SET", K(code, "v"), "1", "EX", TTL]]);
  return { code, hostKey, game, nr };
}

// What each screen may see: the host sees everything; a player sees only its own answer until the reveal,
// and never its story points before the reveal (that would give away right or wrong).
export async function getState(kv, { code, gid, key, hostKey, since }) {
  const [v] = await kv([["GET", K(code, "v")]]);
  if (v === null || v === undefined) fail("no_game", "That game code doesn't exist or has ended.");
  if (since && String(since) === String(v)) return { v: +v, same: true };
  const [st] = await kv([["GET", K(code, "state")]]); const s = json(st);
  if (!s || !GAMES[s.game]) fail("no_game", "That game has ended.");
  const N = NR(s);
  const pit = s.mode === "pit";
  const res = await kv([["HGETALL", K(code, "g")], ...Array.from({ length: N }, (_, r) => ["HGETALL", K(code, "d" + r)]), ...(pit ? Array.from({ length: N }, (_, r) => ["GET", K(code, "b" + r)]) : [])]);
  const groups = hobj(res[0]), host = isHost(s, hostKey);
  const me = gid && groups[gid] && groups[gid].key === key ? gid : null;
  const showCodes = host || s.phase === "final";
  const out = { v: +v, phase: s.phase, r: s.r, step: s.step || null, game: s.game, nr: s.nr || null, mode: s.mode || null, tradeAt: s.tradeAt || null, win: s.win || null, host, openedAt: s.openedAt || null, now: Date.now(),
    groups: Object.entries(groups).sort((a, b) => (a[1].t || 0) - (b[1].t || 0)).map(([id, g]) => ({ gid: id, name: g.name, role: g.role || null, ...(showCodes || id === me ? { code: g.code || null } : {}), ...(host ? { pin: g.pin, manual: !!g.manual } : {}) })),
    me: me ? { gid: me, name: groups[me].name, pin: groups[me].pin, code: groups[me].code || null } : null, decisions: [], answered: [], trades: [], book: null };
  for (let r = 0; r < N; r++) {
    const d = hobj(res[1 + r]);
    const past = r < s.r || (r === s.r && (s.phase === "reveal" || s.phase === "final"));
    if (past || host) out.decisions[r] = d;
    else if (me && d[me]) { const mine = { ...d[me] }; delete mine.pts; out.decisions[r] = { [me]: mine }; }
    else out.decisions[r] = {};
    if (r === s.r) out.answered = Object.keys(d);
    if (pit) {
      const b = json(res[1 + N + r]) || emptyBook();
      if (past || host) out.trades[r] = b.trades;
      else { // the round being traded: everyone sees the tape, but not who is behind each codename
        out.trades[r] = b.trades.map(t => ({ id: t.id, k: t.k, qty: t.qty, price: t.price, t: t.t, mm: !!t.mm, bc: t.bc, sc: t.sc, b: t.b === me ? me : "x", s: t.s === me ? me : "x" }));
      }
      if (r === s.r) out.book = { orders: b.orders.map(o => host ? o : { id: o.id, k: o.k, side: o.side, qty: o.qty, price: o.price, code: o.code, t: o.t, mine: o.gid === me }) };
    }
  }
  return out;
}

export async function join(kv, { code, name, pin }) {
  const s = await loadState(kv, code); name = clean(name); const N = NR(s), isEx = GAMES[s.game].kind === "exchange";
  if (!name) fail("bad_name", "Type your name first.");
  const [graw] = await kv([["HGETALL", K(code, "g")]]); const groups = hobj(graw);
  const hit = Object.entries(groups).find(([, g]) => g.name.toLowerCase() === name.toLowerCase());
  if (hit) {
    if (pin && String(pin) === String(hit[1].pin)) { const key = rid(16); hit[1].key = key; await touch(kv, code, N, [["HSET", K(code, "g"), hit[0], JSON.stringify(hit[1])]]); return { gid: hit[0], key, name: hit[1].name, pin: hit[1].pin, game: s.game, rejoined: true }; }
    fail("name_taken", "That name is taken. If it's you, enter your PIN to rejoin.");
  }
  if (Object.keys(groups).length >= 60) fail("full", "This game is full (60 players).");
  if (s.phase === "final") fail("ended", "This game has ended.");
  const gid = rid(8), key = rid(16), p = pin3();
  await touch(kv, code, N, [["HSET", K(code, "g"), gid, JSON.stringify({ name, pin: p, key, t: Date.now(), ...(isEx ? { role: nextRole(groups), code: nextCode(groups) } : {}) })]]);
  return { gid, key, name, pin: p, game: s.game };
}
async function authGroup(kv, code, gid, key) {
  const [g] = await kv([["HGET", K(code, "g"), gid]]); const grp = json(g);
  if (!grp || grp.key !== key) fail("not_in_game", "You're not in this game. Join again."); return grp;
}

export async function decide(kv, { code, gid, key, r, a, pick }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  const G = GAMES[s.game], N = NR(s);
  if (+r !== s.r || s.phase !== "open") fail("closed", "That round is closed. Watch the board!");
  if (!answerable(G, s.r)) fail("closed", "Nothing to answer right now. Watch the board!");
  const R = G.rounds[s.r];
  let rec;
  if (G.kind === "story") {
    const [old] = await kv([["HGET", K(code, "d" + s.r), gid]]);
    if (json(old)) fail("locked", "You already answered this one.");
    const ai = +a; if (!(ai >= 0 && ai < R.a.length && Number.isInteger(ai))) fail("bad_pick", "Pick an answer.");
    const ms = Math.max(0, Date.now() - (s.openedAt || Date.now()));
    rec = { a: ai, ms, pts: storyPoints(R, ai, ms), t: Date.now() };
  } else {
    const p = cleanPick(G, R, pick); if (!p) fail("bad_pick", G.kind === "exchange" ? "Check your orders: every order needs contracts and a price, and the total can't go over your limit." : "Make every choice first.");
    rec = { ...p, t: Date.now() };
  }
  await touch(kv, code, N, [["HSET", K(code, "d" + s.r), gid, JSON.stringify(rec)]]);
  return { ok: true };
}
export async function undecide(kv, { code, gid, key, r }) {
  const s = await loadState(kv, code); await authGroup(kv, code, gid, key);
  const G = GAMES[s.game];
  if (G.kind === "story") fail("locked", "Answers are final in this game.");
  if (+r !== s.r || s.phase !== "open") fail("closed", "That round is closed.");
  await touch(kv, code, NR(s), [["HDEL", K(code, "d" + s.r), gid]]); return { ok: true };
}

export async function hostOp(kv, { code, hostKey, op, gid, a, pick, name, step, role, secs }) {
  const s = await loadState(kv, code); if (!isHost(s, hostKey)) fail("not_host", "Only the host screen can do that.");
  const G = GAMES[s.game], N = NR(s);
  const save = (extra = []) => touch(kv, code, N, [["SET", K(code, "state"), JSON.stringify(s), "EX", TTL], ...extra]);
  const openRound = r => { s.r = r; s.phase = "open"; s.openedAt = Date.now(); delete s.step; delete s.tradeAt; delete s.win; };
  if (op === "start") { if (s.phase !== "lobby") fail("bad_op", "Already started."); openRound(0); await save(); }
  else if (op === "reveal") { if (s.phase !== "open" || !answerable(G, s.r)) fail("bad_op", "Nothing to reveal."); s.phase = "reveal"; s.step = G.kind === "desk" ? "market" : G.kind === "exchange" ? "fills" : "answer"; await save(); }
  else if (op === "step") { if (s.phase !== "reveal") fail("bad_op", "Reveal first."); if (!["fills", "market", "stand"].includes(step)) fail("bad_op", "Unknown step."); if (s.step !== step) { s.step = step; await save(); } }
  else if (op === "trade") { // open the trading window in the live pit
    if (s.mode !== "pit" || s.phase !== "open") fail("bad_op", "Trading opens during a quarter.");
    s.win = Math.max(60, Math.min(900, Math.round(+secs || 300))); s.tradeAt = Date.now(); await save(); }
  else if (op === "extend") { if (s.mode !== "pit" || s.phase !== "open" || !s.tradeAt) fail("bad_op", "Trading isn't open.");
    const now = Date.now(), end = s.tradeAt + s.win * 1000; if (end < now) { s.win = Math.round((now - s.tradeAt) / 1000) + (+secs || 60); } else s.win += (+secs || 60); await save(); }
  else if (op === "reopen") { if (s.phase !== "reveal" || G.kind === "story") fail("bad_op", "Nothing to reopen."); s.phase = "open"; delete s.step; if (s.mode === "pit") { delete s.tradeAt; delete s.win; } await save(); }
  else if (op === "next") {
    if (s.phase === "open" && answerable(G, s.r)) fail("bad_op", "Reveal first.");
    if (s.phase !== "open" && s.phase !== "reveal") fail("bad_op", "Not in a round.");
    if (s.r >= N - 1) { s.phase = "final"; delete s.step; } else openRound(s.r + 1);
    await save();
  }
  else if (op === "prev") { // go back one round (to its reveal if it had answers)
    if (s.phase === "lobby" || s.r === 0) fail("bad_op", "Already at the start.");
    if (s.phase === "final") { s.r = N - 1; } else s.r = s.r - 1;
    if (answerable(G, s.r)) { s.phase = "reveal"; s.step = G.kind === "story" ? "answer" : "stand"; } else { s.phase = "open"; delete s.step; }
    await save();
  }
  else if (op === "enter") { // the teacher enters or fixes an answer (offline mode or a dead iPad)
    if (s.phase !== "open" || !answerable(G, s.r)) fail("bad_op", "This round is closed.");
    const R = G.rounds[s.r]; let rec;
    if (G.kind === "story") { const ai = +a; if (!(ai >= 0 && ai < R.a.length)) fail("bad_pick", "Pick an answer."); rec = { a: ai, ms: null, pts: ai === R.c ? 750 : 0, byHost: true, t: Date.now() }; }
    else { const p = cleanPick(G, R, pick); if (!p) fail("bad_pick", "Check the orders and the contract limit."); rec = { ...p, byHost: true, t: Date.now() }; }
    await save([["HSET", K(code, "d" + s.r), gid, JSON.stringify(rec)]]);
  }
  else if (op === "clear") { await save([["HDEL", K(code, "d" + s.r), gid]]); }
  else if (op === "add") { const n = clean(name); if (!n) fail("bad_name", "Name needed."); const id = rid(8); let extra = {};
    if (G.kind === "exchange") { const [graw] = await kv([["HGETALL", K(code, "g")]]); extra = { role: nextRole(hobj(graw)), code: nextCode(hobj(graw)) }; }
    await save([["HSET", K(code, "g"), id, JSON.stringify({ name: n, pin: pin3(), key: rid(16), t: Date.now(), manual: true, ...extra })]]); return { ok: true, gid: id }; }
  else if (op === "role") { // switch a desk between buyer and seller (exchange only, before a round is revealed)
    if (G.kind !== "exchange" || s.phase === "reveal" || s.phase === "final") fail("bad_op", "Switch roles in the lobby or while a quarter is open.");
    if (role !== "buy" && role !== "sell") fail("bad_op", "Pick buyer or seller.");
    const [gr] = await kv([["HGET", K(code, "g"), gid]]); const g = json(gr); if (!g) fail("bad_op", "No such desk.");
    g.role = role; await save([["HSET", K(code, "g"), gid, JSON.stringify(g)]]); }
  else if (op === "remove") { await save([["HDEL", K(code, "g"), gid], ...Array.from({ length: N }, (_, r) => ["HDEL", K(code, "d" + r), gid])]); }
  else if (op === "end") { await kv(allKeys(code, N).map(k => ["DEL", k])); return { ok: true, ended: true }; }
  else fail("bad_op", "Unknown action.");
  return { ok: true };
}

// Live pit: post a bid or offer, take someone's order, cancel yours, or trade with the market maker
export async function pitAction(kv, { code, gid, key, r, a }) {
  const s = await loadState(kv, code); const grp = await authGroup(kv, code, gid, key);
  if (s.mode !== "pit" || +r !== s.r) fail("closed", "That quarter is closed. Watch the board!");
  const now = Date.now();
  if (!pitOpen(s, now)) fail("closed", s.tradeAt ? "Trading is closed. Watch the board!" : "Trading hasn't opened yet.");
  const R = GAMES[s.game].rounds[s.r];
  return withLock(kv, code, async () => {
    const [raw] = await kv([["GET", K(code, "b" + s.r)]]);
    const out = pitApply(R, json(raw) || emptyBook(), { gid, code: grp.code || "Desk" }, a || {}, now, pitFrac(s, now));
    if (out.error) fail("pit", out.error);
    await touch(kv, code, NR(s), [["SET", K(code, "b" + s.r), JSON.stringify(out.book), "EX", TTL]]);
    return { ok: true, filled: out.filled || 0, rested: out.rested || 0, price: out.price || null };
  });
}

export async function dispatch(kv, action, p) {
  if (action === "ping") { await kv([["GET", "dv:ping"]]); return { ok: true }; }
  if (action === "create") return createGame(kv, p);
  if (action === "state") return getState(kv, p);
  if (action === "join") return join(kv, p);
  if (action === "decide") return decide(kv, p);
  if (action === "undecide") return undecide(kv, p);
  if (action === "host") return hostOp(kv, p);
  if (action === "pit") return pitAction(kv, p);
  fail("bad_action", "Unknown request.");
}
