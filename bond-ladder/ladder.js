/* Bond Ladder: a table-tournament review for Unit 4 (Bonds), built on the Marketing Ladder engine.
   Every student plays on their own device but sits at a table of 3. Each round:
     1. Quick Fire  - a few fast questions from that round's game (speed counts)
     2. Main task   - Rate the Issuer (Rating Room), Make the Trade (Bond Desk), or Read the Curve (Yield Curve)
     3. Results     - the answer and why, then each table's 1st / 2nd / 3rd
     4. Move        - Ladder: winners move up a table, last place moves down, 2nd stays; or regroup by place
   Points add up across rounds. The teacher screen does all the scoring and writes it to the shared state;
   student devices only send their answers. Storage is /api/live (the Bonds Live store). */
import * as L from "./data.js";
import { curveSVG } from "../radar-view.js";
import { qrSVG } from "../qr.js";

const $ = s => document.querySelector(s);
const app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = n => (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
const signed = n => (n > 0 ? "+" : n < 0 ? "−" : "") + "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
const mm = n => "$" + Math.round(n).toLocaleString("en-US") + "M";
const pct = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
const sgn2 = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
const k = n => n ? "$" + n / 1000 + "K" : "Pass";
const num = n => Math.round(n).toLocaleString("en-US");
const ROLE = window.BRL_ROLE || "student";
const MOCK = /[?&]mock=1/.test(location.search);
const GAME = "bond-ladder";
const COLORS = ["var(--c0)", "var(--c1)", "var(--c2)", "var(--c3)"], SHAPES = ["▲", "◆", "●", "■"];
const BONUS = [150, 75, 0, 0];               // finishing 1st or 2nd at your table
const PLACE = ["1st", "2nd", "3rd", "4th"];
const TASK_SECS = { rate: 180, desk: 150, curve: 90 };
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
function beep(f, d) { try { const c = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()); const o = c.createOscillator(), g = c.createGain(); o.frequency.value = f; g.gain.value = .06; o.connect(g); g.connect(c.destination); const t = c.currentTime; g.gain.exponentialRampToValueAtTime(.0001, t + d); o.start(t); o.stop(t + d); } catch (e) {} }

/* ============================================================ NETWORK (same store as Bonds Live) */
function mockNet() {
  const KEY = "bondLadderMock", bc = ("BroadcastChannel" in window) ? new BroadcastChannel(KEY) : null, subs = [];
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const write = t => { localStorage.setItem(KEY, JSON.stringify(t)); fire(); if (bc) bc.postMessage(1); };
  const at = (t, p) => p.split("/").filter(Boolean).reduce((o, k) => (o == null ? undefined : o[k]), t);
  const put = (t, p, v) => { const ks = p.split("/").filter(Boolean); let o = t; ks.slice(0, -1).forEach(k => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; }); if (v === null) delete o[ks[ks.length - 1]]; else o[ks[ks.length - 1]] = v; };
  const fire = () => { const t = read(); subs.forEach(s => { const v = JSON.stringify(at(t, s.p) ?? null); if (v !== s.last) { s.last = v; s.cb(JSON.parse(v)); } }); };
  if (bc) bc.onmessage = fire; window.addEventListener("storage", e => { if (e.key === KEY) fire(); });
  return {
    get: async p => at(read(), p) ?? null,
    set: async (p, v) => { const t = read(); put(t, p, v); write(t); },
    update: async (p, o) => { const t = read(); Object.entries(o).forEach(([k, v]) => put(t, p + "/" + k, v)); write(t); },
    remove: async p => { const t = read(); put(t, p, null); write(t); },
    on: (p, cb) => { const s = { p, cb, last: undefined }; subs.push(s); setTimeout(fire, 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; }
  };
}
async function vercelNet() {
  const call = async (op, path, v) => { const r = await fetch("/api/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, path, v }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; };
  try { const p = await call("ping"); if (!p.ok) return null; } catch (e) { return null; }
  return {
    get: async p => (await call("get", p)).v ?? null,
    set: (p, v) => call("set", p, v),
    update: (p, o) => call("update", p, o),
    remove: p => call("remove", p),
    on: (p, cb) => { let last, stop = false, t;
      const tick = async () => { if (stop) return;
        if (!document.hidden) { try { const v = (await call("get", p)).v ?? null, s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } } catch (e) {} }
        if (!stop) t = setTimeout(tick, 1200); };
      tick(); return () => { stop = true; clearTimeout(t); }; }
  };
}
let NET = null;
async function net() { if (NET) return NET; NET = MOCK ? mockNet() : await vercelNet(); return NET; }

/* ============================================================ SEATING */
// Tables of 3. Leftovers make one or two tables of 4 at the bottom (never a table of 1).
function sizes(n) {
  if (n <= 0) return [];
  if (n < 3) return [n];
  const t = Math.floor(n / 3), r = n % 3, a = new Array(t).fill(3);
  if (r === 1) a[t - 1] = 4;
  else if (r === 2) { if (t >= 2) { a[t - 1] = 4; a[t - 2] = 4; } else a.push(2); }
  return a;
}
function chunk(order) { const out = []; let i = 0; for (const s of sizes(order.length)) { out.push(order.slice(i, i + s)); i += s; } return out; }
// placed = each table's players sorted 1st, 2nd, 3rd... Returns the next seating order (top table first).
function nextOrder(placed, rule) {
  if (rule === "ladder") { // winner moves up one table, last place moves down one, the middle stays
    const nb = placed.map(() => []);
    placed.forEach((t, i) => t.forEach((p, j) => {
      let to = i;
      if (t.length > 1) { if (j === 0 && i > 0) to = i - 1; else if (j === t.length - 1 && i < placed.length - 1) to = i + 1; }
      nb[to].push(p);
    }));
    return nb.flat();
  }
  const order = [], mx = Math.max(0, ...placed.map(t => t.length)); // all 1sts (top table first), then all 2nds, then 3rds
  for (let j = 0; j < mx; j++) placed.forEach(t => { if (t[j]) order.push(t[j]); });
  return order;
}
function tableLabel(st, i) {
  if (i === 0) return "Top Table";
  if (st.r === 0 || st.rule === "ladder") return "";
  const tally = [0, 0, 0];
  st.tables[i].forEach(p => { const f = st.from && st.from[p]; if (f != null) tally[Math.min(2, f)]++; });
  return Math.max(...tally) ? ["Winners", "2nd places", "3rd places"][tally.indexOf(Math.max(...tally))] : "";
}
const tableOf = (st, pid) => (st.tables || []).findIndex(t => t.includes(pid));

/* ============================================================ SHARED VIEW PIECES */
const roundOf = (meta, r) => L.ROUNDS[meta.plan[r].id];
const roundQ = (meta, r, qi) => L.question(meta.plan[r].qs[qi], meta.seed);
const taskSecs = (meta, r) => Math.round(TASK_SECS[roundOf(meta, r).tp] * meta.tmult);
const head = (meta, r) => { const R = roundOf(meta, r); return `Round ${r + 1} · ${L.TOPICS[R.tp].short}`; };
const secsLeft = (t0, secs) => Math.max(0, secs - (performance.now() - t0) / 1000);
let TICK = null;
function stopTick() { clearInterval(TICK); TICK = null; }
function startTimer(el, secs, t0, onEnd) {
  stopTick();
  const bar = el.querySelector(".timer i"), sec = el.querySelector(".secs"), tm = el.querySelector(".timer"); let last = null;
  TICK = setInterval(() => {
    const left = secsLeft(t0, secs), c = Math.ceil(left);
    if (bar) bar.style.transform = `scaleX(${left / secs})`;
    if (c !== last) { last = c; if (sec) sec.textContent = clockText(c); if (c <= 3 && c > 0 && ROLE !== "teacher") beep(880, .05); }
    if (tm) tm.classList.toggle("low", left <= Math.min(10, secs * .2));
    if (left <= 0) { stopTick(); onEnd && onEnd(); }
  }, 100);
}
const clockText = s => (s >= 60 ? Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") : String(s));
const timerHTML = secs => `<div class="row tline"><div class="timer" style="flex:1"><i></i></div><span class="secs">${clockText(secs)}</span></div>`;
function qHTML(q, title, o = {}) {
  return `<div class="qwrap">
    <div class="qhead"><span class="rd">${esc(title)}</span><span class="num">${esc(o.num || "")}</span>${o.score != null ? `<span class="score">${num(o.score)} pts</span>` : ""}</div>
    ${o.timed ? timerHTML(o.secs) : ""}
    <div class="card"><div class="ask">Quick Fire · ${esc(L.SKILLS[q.sk].short)}</div><p class="prompt">${esc(q.p)}</p></div>
    <div class="opts">${q.opts.map((v, i) => `<button class="opt" data-i="${i}" style="--oc:${COLORS[i]}"><span class="sh">${SHAPES[i]}</span><span>${esc(v)}</span></button>`).join("")}</div>
    <div class="fbbox"></div></div>`;
}

/* ---------- Rating Room: the issuer file */
const term = c => (c.munis ? "Surplus" : "Earnings");
function caseHTML(c, o = {}) {
  const facts = c.notes ? `<ul class="clues">${c.notes.map(n => `<li>${esc(n)}</li>`).join("")}</ul>`
    : `<ul class="clues"><li><b>Payment history:</b> ${esc(c.historyText)}</li><li><b>Backing:</b> ${esc(c.backingText)}</li></ul>`;
  return `<div class="brief case"><div class="bhead"><div><div class="kind">Rate the Issuer</div><h2>${esc(c.name)}</h2><div class="what">${esc(c.type)} · ${esc(c.what)}</div></div>${o.right || ""}</div>
    <div class="casegrid"><div class="dtwrap"><table class="dt fin"><thead><tr><th>$ millions</th>${L.YEARS.map(y => `<th>${y}</th>`).join("")}</tr></thead><tbody>
      <tr><td><b>Revenue</b></td>${c.rev.map(v => `<td>${num(v)}</td>`).join("")}</tr>
      <tr><td><b>${term(c)}</b></td>${c.earn.map(v => `<td>${v < 0 ? "−" + num(-v) : num(v)}</td>`).join("")}</tr></tbody></table>
      <div class="kv"><div><span>Total debt</span><b>${mm(c.debt)}</b></div><div><span>Interest this year</span><b>${mm(c.interest)}</b></div><div><span>Cash on hand</span><b>${mm(c.cash)}</b></div><div><span>Debt due next 12 months</span><b>${mm(c.due)}</b></div></div></div>
      <div>${c.notes ? `<div class="sl">Analyst notes (some matter, some are noise)</div>` : ""}${facts}</div></div></div>`;
}
/* ---------- Bond Desk: the year's board */
function deskHTML(y, o = {}) {
  return `<div class="brief desk"><div class="bhead"><div><div class="kind">Make the Trade · $1,000,000 fund</div><h2>Year ${y.year}: ${esc(y.title)}</h2>
      <div class="what">Treasury rate today: <b>${y.t0.toFixed(1)}%</b> · Money you don't put in a bond stays in Treasuries and earns ${y.t0.toFixed(1)}%</div></div>${o.right || ""}</div>
    <div class="news"><b>News</b><ul>${y.news.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>
    ${o.table === false ? "" : `<div class="dtwrap"><table class="dt"><thead><tr><th>Bond</th><th>Rating</th><th>Years</th><th>Rate sensitivity</th><th>Yield</th></tr></thead><tbody>
      ${y.bonds.map(b => `<tr><td><b>${b.id}. ${esc(b.issuer)}</b><small>${esc(b.what)}</small></td><td><b>${b.rating}</b>${L.LADDER.indexOf(b.rating) >= 4 ? "<small>junk</small>" : ""}</td><td>${b.years}</td><td>${b.sens}</td><td><b>${b.yld.toFixed(1)}%</b></td></tr>`).join("")}</tbody></table></div>`}
    ${spreadsHTML()}</div>`;
}
const spreadsHTML = () => `<div class="spreads"><span>Spread over Treasuries:</span>${L.LADDER.map(r => `<span><b>${r}</b> +${L.SPREADS[r].toFixed(1)}%</span>`).join("")}</div>`;
/* ---------- Yield curve: the mystery chart */
function chartHTML(rd, o = {}) {
  const ser = [];
  if (rd.before) ser.push({ y: rd.before, color: "#9A9A9A", dash: "4 6", width: 3, r: 4, label: "12 months earlier" });
  ser.push({ y: rd.ylds, labels: true, color: "#C1102F", label: rd.before ? "This curve" : undefined });
  return `<div class="chartbox">${curveSVG(ser, { ink: "#111", legend: !!rd.before, w: o.w || 640, h: o.h || 330 })}</div>`;
}
function curveHTML(rd, o = {}) {
  return `<div class="brief curve"><div class="bhead"><div><div class="kind">Read the Curve · Mystery curve ${rd.tag}</div><h2>${o.date ? esc(rd.date) : "What happens next?"}</h2></div>${o.right || ""}</div>
    <div class="clue"><b>The clue</b>${esc(rd.clue)}</div>
    <div class="curvegrid">${chartHTML(rd, o)}<div class="ylist">${L.MATS.map((m, i) => `<div><span>${m}</span><b>${rd.ylds[i].toFixed(2)}%</b></div>`).join("")}${rd.before ? `<p class="note">Dashed gray line: the same curve 12 months earlier.</p>` : ""}</div></div></div>`;
}
function bars(rows) { // rows: [{label, v, max, cls, txt}]
  return `<div class="bars">${rows.map(r => `<div class="brow"><span class="bn">${r.label}</span><div class="bstack"><div class="bline ${r.cls || "b2"}"><i style="width:${r.max ? Math.max(0, r.v / r.max * 100) : 0}%"></i><span>${esc(r.txt)}</span></div></div></div>`).join("")}</div>`;
}

/* ============================================================ FIT THE PROJECTOR */
function zoomApp() { const a = app; a.style.zoom = ""; const R = document.documentElement; let lo = .55, hi = 2.2;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; a.style.zoom = m.toFixed(3); (R.scrollHeight <= innerHeight + 1 && R.scrollWidth <= innerWidth + 1) ? lo = m : hi = m; }
  a.style.zoom = lo.toFixed(3); }
function fit() { if (ROLE !== "teacher") return; document.body.classList.add("wide"); requestAnimationFrame(zoomApp); }
window.addEventListener("resize", () => { if (ROLE === "teacher") { clearTimeout(fit.t); fit.t = setTimeout(zoomApp, 150); } });

/* ============================================================ HOME */
const hdr = () => `<h1 class="title">Bond <span>Ladder.</span></h1>
  <p class="lede">${ROLE === "teacher"
    ? "Teacher screen for the projector. Students join on their own devices and sit at tables of 3. Each round: Quick Fire questions, then one main task from The Rating Room, The Bond Desk or the yield curve, then results. Win your table and you move up a table; last place moves down."
    : "Join with your first name. Each round you answer a few Quick Fire questions, then rate an issuer, make a bond trade, or read a yield curve, and see how you did against the two people at your table. Win your table and you move up. Every point counts toward your total."}</p>`;
function needSetup() {
  app.innerHTML = `${hdr()}<div class="panel"><h2>${ROLE === "teacher" ? "Class games need the database" : "The game isn't open yet"}</h2>
    <p>${ROLE === "teacher" ? "This uses the same Upstash database as Bonds Live and The Bond Desk. If those work, reload. If not, connect Upstash for Redis to this Vercel project and redeploy." : "Wait for your teacher to start it, then reload this page."}</p>
    <button class="btn main" id="b">Reload</button></div>`;
  $("#b").onclick = () => location.reload();
}
function home() { stopTick(); document.body.classList.remove("wide", "finale-on", "stu-live"); app.style.zoom = ""; $("#who").hidden = true; ROLE === "teacher" ? hostSetup() : joinForm(); }

/* ============================================================ HOST */
let H = null;
async function hostSetup() {
  const N = await net().catch(() => null); if (!N) return needSetup();
  const cfg = { on: L.DEFAULT_ON.slice(), per: 3, qsecs: 20, tmult: 1, rule: "ladder" };
  const col = tp => `<div class="rcol"><div class="rch">${esc(L.TOPICS[tp].name)}<small>${esc(L.TOPICS[tp].task)} · ${clockText(TASK_SECS[tp])}</small></div>
    <div class="seg multi" data-tp="${tp}">${L.GROUPS[tp].map(id => { const R = L.ROUNDS[id]; return `<button data-v="${id}" aria-pressed="${cfg.on.includes(id)}" ${R.date ? `title="${esc(R.date)}"` : ""}><b>${esc(R.title)}</b><small>${esc(R.sub)}</small></button>`; }).join("")}</div></div>`;
  app.innerHTML = `${hdr()}<div class="panel wide-panel"><h2>Host a game</h2>
    <p>Pick the rounds. Play order rotates Rating Room → Bond Desk → Yield Curve, top of each list first. Tap to turn one on or off.</p>
    <div class="rcols">${col("rate")}${col("desk")}${col("curve")}</div>
    <p class="note" id="rc"></p>
    <p>Quick Fire questions each round:</p><div class="seg" data-k="per"><button data-v="2">2</button><button data-v="3" aria-pressed="true">3</button><button data-v="4">4</button></div>
    <p>Time per Quick Fire question:</p><div class="seg" data-k="qsecs"><button data-v="15">15 sec</button><button data-v="20" aria-pressed="true">20 sec</button><button data-v="30">30 sec</button></div>
    <p>Time for the main task:</p><div class="seg" data-k="tmult"><button data-v="0.75">Less</button><button data-v="1" aria-pressed="true">Standard</button><button data-v="1.34">More</button></div>
    <p class="note" id="tn"></p>
    <p>How students move after each round:</p><div class="seg" data-k="rule"><button data-v="ladder" aria-pressed="true">Ladder</button><button data-v="place">Regroup by place</button></div>
    <p class="note" id="rn"></p>
    <div class="err" id="er"></div><button class="btn main" id="go">Create game</button></div>`;
  const order = () => L.playOrder(cfg.on);
  const roundNote = () => { const n = cfg.on.length; $("#rc").innerHTML = n ? `<b>${n} round${n === 1 ? "" : "s"}</b>, about ${n * 7} to ${n * 9} minutes with 30 students. Order: ${order().map((id, i) => `${i + 1}. ${esc(L.TOPICS[L.ROUNDS[id].tp].short)}`).join(" · ")}` : "Pick at least one round."; $("#go").disabled = !n; };
  app.querySelectorAll(".seg.multi").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
    cfg.on = [...app.querySelectorAll('.seg.multi button[aria-pressed="true"]')].map(x => x.dataset.v); roundNote(); });
  roundNote();
  const notes = () => { $("#rn").textContent = cfg.rule === "place"
      ? "Regroup by place: all 1st-place finishers sit together at the top tables, then all 2nds, then all 3rds. Table 1 is always the Top Table."
      : "Ladder: the winner moves up one table, last place moves down one table, and 2nd place stays put. Table 1 is the Top Table.";
    $("#tn").textContent = `Rating Room ${clockText(Math.round(TASK_SECS.rate * cfg.tmult))}, Bond Desk ${clockText(Math.round(TASK_SECS.desk * cfg.tmult))}, Yield Curve ${clockText(Math.round(TASK_SECS.curve * cfg.tmult))}.`; };
  notes();
  app.querySelectorAll(".seg[data-k]").forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return;
    [...sg.children].forEach(x => x.setAttribute("aria-pressed", x === b)); const key = sg.dataset.k; cfg[key] = key === "rule" ? b.dataset.v : +b.dataset.v; notes(); });
  $("#go").onclick = async () => {
    $("#go").disabled = true;
    try {
      let code; for (let t = 0; t < 20; t++) { code = String(Math.floor(1000 + Math.random() * 9000)); if (!(await N.get("games/" + code))) break; }
      const seed = Math.floor(Math.random() * 1e9), rounds = order(), plan = L.plan(rounds, cfg.per, seed);
      const meta = { created: Date.now(), game: GAME, seed, plan, rounds: rounds.length, per: cfg.per, qsecs: cfg.qsecs, tmult: cfg.tmult, rule: cfg.rule };
      const state = { phase: "lobby", rule: cfg.rule, tot: {} };
      await N.set("games/" + code, { ...meta, state });
      H = { N, code, meta, state, players: {} };
      H.off = N.on("games/" + code + "/players", v => { H.players = v || {}; hostRender(true); });
      hostRender();
    } catch (e) { $("#er").textContent = "Couldn't reach the class game database."; $("#go").disabled = false; }
  };
}
const active = () => Object.entries(H.players).filter(([, p]) => !p.out).map(([id]) => id);
const nameOf = pid => (H.players[pid] && H.players[pid].name) || (H.state.names && H.state.names[pid]) || "?";
const seated = () => (H.state.tables || []).flat();
function namesMap() { const o = {}; Object.entries(H.players).forEach(([id, p]) => o[id] = p.name); return o; }
function hostSet(state) { H.state = state; H.rq = null; H.N.set("games/" + H.code + "/state", state).catch(() => {}); hostRender(); }

function hostRender(fromPlayers) {
  const st = H.state;
  if (fromPlayers && !["lobby", "seat", "q", "task"].includes(st.phase)) return; // nothing on screen depends on players then
  if (st.phase === "lobby") return hostLobby();
  if (st.phase === "seat") return hostSeat(fromPlayers);
  if (st.phase === "q") return hostQuestion();
  if (st.phase === "qrev") return hostReveal();
  if (st.phase === "task") return hostTask();
  if (st.phase === "best") return hostBest();
  if (st.phase === "tables") return hostTables();
  if (st.phase === "end") return hostEnd();
}
function hostLobby() {
  const ps = active(), url = location.origin + "/bond-ladder/?code=" + H.code;
  if (!H.qr) { try { H.qr = qrSVG(url); } catch (e) { H.qr = ""; } }
  app.innerHTML = `<div class="lobby"><div class="lobtop"><div class="lobleft"><div class="join">Scan the code, or open <b>Bond Ladder</b> on the Finance &amp; Investing site and enter</div>
    <div class="code">${H.code}</div><div class="url">${esc(url.replace(/^https?:\/\//, ""))}</div></div>
    ${H.qr ? `<div class="qr">${H.qr}<span>Scan to join</span></div>` : ""}</div>
    <div class="count">${ps.length} player${ps.length === 1 ? "" : "s"} joined · ${sizes(ps.length).length} table${sizes(ps.length).length === 1 ? "" : "s"}</div>
    <div class="names">${ps.map(id => `<span>${esc(nameOf(id))}</span>`).join("") || '<span style="opacity:.5">Waiting for players…</span>'}</div>
    <p class="note">${H.meta.rounds} rounds · ${H.meta.per} Quick Fire questions + 1 main task each · ${H.meta.rule === "place" ? "regroup by place" : "ladder moves"}</p>
    <div class="row" style="justify-content:center"><button class="btn main" id="start" ${ps.length >= 2 ? "" : "disabled"}>Seat the tables</button>
    <button class="btn" id="signs">Print table signs</button><button class="btn" id="end">Cancel</button></div></div>`;
  $("#start").onclick = () => { const order = L.shuffle(active()); hostSet({ phase: "seat", r: 0, rule: H.meta.rule, tables: chunk(order), from: {}, tot: {}, names: namesMap() }); };
  $("#signs").onclick = printSigns; $("#end").onclick = hostErase;
  fit();
}
function printSigns() {
  const n = Math.max(12, sizes(active().length).length), w = window.open("", "_blank"); if (!w) return;
  w.document.write(`<!doctype html><title>Table signs</title><style>@page{size:letter landscape;margin:.5in}body{margin:0;font-family:Arial,sans-serif}
    .s{height:7.3in;display:flex;flex-direction:column;align-items:center;justify-content:center;page-break-after:always;border:6px solid #111;border-radius:24px;box-sizing:border-box}
    .s small{font-size:40px;letter-spacing:.2em;color:#111;font-weight:700}.s b{font-size:330px;line-height:1;color:#111}.s em{font-style:normal;font-size:36px;color:#C1102F;font-weight:700}</style>
    ${Array.from({ length: n }, (_, i) => `<div class="s"><small>TABLE</small><b>${i + 1}</b>${i === 0 ? "<em>TOP TABLE</em>" : ""}</div>`).join("")}<script>print()<\/script>`);
  w.document.close();
}
function hostSeat(fromPlayers) {
  const st = H.state;
  const inSeat = new Set(seated()), fresh = active().filter(p => !inSeat.has(p));
  const gone = seated().filter(p => H.players[p] && H.players[p].out);
  if (fresh.length || gone.length) { // anyone new (or back) gets a seat at the bottom; absent students leave
    let tables = st.tables.map(t => t.filter(p => !gone.includes(p))).filter(t => t.length);
    fresh.forEach(p => { const last = tables[tables.length - 1]; if (last && last.length < 4) last.push(p); else tables.push([p]); });
    const solo = tables.findIndex(t => t.length === 1); // never leave someone sitting alone
    if (solo > 0 && tables.length > 1) { const p = tables[solo][0]; tables.splice(solo, 1); tables[tables.length - 1].push(p); }
    return hostSet({ ...st, tables, names: namesMap() });
  }
  if (fromPlayers && H.rq === "seat") return;
  H.rq = "seat";
  const R = roundOf(H.meta, st.r);
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds} · ${esc(L.TOPICS[R.tp].name)}</div><h2>Find your table</h2></div>
    <p>${st.r === 0 ? "Tables are random this round. Sit with the two people on your screen." : H.meta.rule === "place" ? "1st places sit together, 2nds together, 3rds together. Your device shows your table number." : "Winners moved up a table, last places moved down, 2nd places stayed."}</p></div>
    <div class="tgrid">${st.tables.map((t, i) => `<div class="tcard ${i === 0 ? "toptable" : ""}"><div class="th"><b>Table ${i + 1}</b>${tableLabel(st, i) ? `<span>${esc(tableLabel(st, i))}</span>` : ""}</div>
      ${t.map(p => `<div class="tn"><span>${esc(nameOf(p))}</span><em>${num((st.tot || {})[p] || 0)}</em><button class="x" data-p="${p}" title="Remove from the game">✕</button></div>`).join("")}</div>`).join("")}</div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="go">Everyone's seated: start Round ${st.r + 1}</button></div>
    <p class="note" style="text-align:center">✕ removes an absent student. If they come back, they rejoin with the same name and keep their points.</p>`;
  app.querySelectorAll(".x").forEach(b => b.onclick = async () => { const p = b.dataset.p; H.players[p] = { ...H.players[p], out: true }; await H.N.update(`games/${H.code}/players/${p}`, { out: true }).catch(() => {}); H.rq = null; hostSeat(); });
  $("#go").onclick = () => hostSet({ ...H.state, phase: H.meta.per ? "q" : "task", qi: 0, run: {} });
  fit();
}
const answeredQ = (r, qi) => seated().filter(p => H.players[p] && H.players[p].a && H.players[p].a[r + "." + qi]).length;
function hostQuestion() {
  const st = H.state, q = roundQ(H.meta, st.r, st.qi), secs = H.meta.qsecs, total = seated().length, a = answeredQ(st.r, st.qi);
  if (H.rq !== "q" + st.r + "." + st.qi) {
    H.rq = "q" + st.r + "." + st.qi; H.t0 = performance.now();
    app.innerHTML = qHTML(q, head(H.meta, st.r), { num: `Question ${st.qi + 1} of ${H.meta.per}`, timed: true, secs })
      + `<div class="row" style="justify-content:space-between;margin-top:10px"><span class="count" id="cnt"></span><button class="btn" id="skip">Show answer now</button></div>`;
    app.querySelectorAll(".opt").forEach(b => b.disabled = true);
    $("#skip").onclick = () => hostReveal(true);
    startTimer(app, secs, H.t0, () => setTimeout(() => hostReveal(true), 1000));
    fit();
  }
  const c = $("#cnt"); if (c) c.textContent = `${a} of ${total} answered`;
  if (total && a >= total) hostReveal(true);
}
function scoreQuick(r, upto) { // round Quick Fire points so far for every seated player
  const out = {};
  seated().forEach(p => { let s = 0, ms = 0; const A = (H.players[p] && H.players[p].a) || {};
    for (let qi = 0; qi <= upto; qi++) { const x = A[r + "." + qi], q = roundQ(H.meta, r, qi);
      if (x && x.c >= 0) { s += L.quickPts(x.c === q.ans, x.ms, H.meta.qsecs); ms += x.ms; } else ms += H.meta.qsecs * 1000; }
    out[p] = { s, ms }; });
  return out;
}
async function hostReveal(go) {
  const st = H.state;
  if (go) { const key = st.r + "." + st.qi; if (st.phase !== "q" || H.revealing === key) return; H.revealing = key; stopTick(); try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
    const run = scoreQuick(st.r, st.qi); return hostSet({ ...st, phase: "qrev", run: Object.fromEntries(Object.entries(run).map(([p, v]) => [p, v.s])) }); }
  const q = roundQ(H.meta, st.r, st.qi), counts = [0, 0, 0, 0];
  seated().forEach(p => { const x = H.players[p] && H.players[p].a && H.players[p].a[st.r + "." + st.qi]; if (x && x.c >= 0) counts[x.c]++; });
  const mx = Math.max(1, ...counts), last = st.qi >= H.meta.per - 1, R = roundOf(H.meta, st.r);
  app.innerHTML = qHTML(q, head(H.meta, st.r), { num: `Question ${st.qi + 1} of ${H.meta.per}` });
  app.querySelectorAll(".opt").forEach((b, i) => { b.disabled = true; b.classList.add(i === q.ans ? "right" : "dim"); });
  app.querySelector(".fbbox").innerHTML = `<div class="fb"><b>${esc(q.opts[q.ans])}</b>${esc(q.x)}</div>
    <div class="dist">${counts.map((n, i) => `<div class="${i === q.ans ? "ok" : "wrong"}" style="--oc:${COLORS[i]};--h:${Math.max(14, n / mx * 100)}%"><b>${i === q.ans ? "✓" : SHAPES[i]} ${n}</b></div>`).join("")}</div>
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn main" id="nx">${last ? `${esc(L.TOPICS[R.tp].task)} →` : "Next question →"}</button></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "task" }) : hostSet({ ...st, phase: "q", qi: st.qi + 1 });
  fit();
}
const lockedCount = r => seated().filter(p => H.players[p] && H.players[p].t && H.players[p].t[r] != null).length;
function hostTask() {
  const st = H.state, R = roundOf(H.meta, st.r), secs = taskSecs(H.meta, st.r), total = seated().length;
  if (H.rq !== "task" + st.r) {
    H.rq = "task" + st.r; H.t0 = performance.now();
    const right = `<div class="clock"><div class="secs big">${clockText(secs)}</div><div class="count" id="cnt"></div></div>`;
    const body = R.tp === "rate" ? caseHTML(L.CASES[R.ref], { right }) + `<p class="note">On your device: score each of the six factors. Your device turns your scores into a rating. 50 points for each factor you score right, plus 300 for the exact rating (150 if one step off).</p>`
      : R.tp === "desk" ? deskHTML(L.DESK[R.ref], { right }) + `<p class="note">On your device: Pass, $100K or $200K in each bond. Points for how close your year's gain comes to the best possible trade.</p>`
      : curveHTML(L.curveByTag[R.ref], { right }) + `<p class="note">On your device: name the shape (spread = 10Y − 3M), call when a recession starts (or none in 2 years), and bet 1 to 3 chips on your call.</p>`;
    app.innerHTML = `<div class="kick" style="margin-bottom:6px">Round ${st.r + 1} · ${esc(L.TOPICS[R.tp].name)} · ${esc(L.TOPICS[R.tp].task)}</div>${body}
      <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn" id="close">Lock it now</button></div>`;
    $("#close").onclick = () => hostCloseTask();
    startTimer(app, secs, H.t0, () => { H.grace = setTimeout(() => hostCloseTask(), 4000); }); // 4 extra seconds so devices can send their auto-submit
    fit();
  }
  const b = lockedCount(st.r), c = $("#cnt"); if (c) c.textContent = `${b} of ${total} locked in`;
  if (total && b >= total && !H.closing) { H.closing = setTimeout(() => { H.closing = null; if (H.state.phase === "task") hostCloseTask(); }, 2500); }
}
function mainScore(R, ans) {
  if (R.tp === "rate") { const s = L.ratePoints(R.ref, Array.isArray(ans) ? L.FACTORS.map((_, i) => (ans[i] == null ? null : +ans[i])) : null); return { pts: s.pts, s }; }
  if (R.tp === "desk") { const picks = Array.isArray(ans) ? ans.map(v => +v || 0) : [0, 0, 0]; const s = L.deskPoints(R.ref, picks); return { pts: s.pts, s: { ...s, picks } }; }
  const s = L.curvePoints(R.ref, ans || null); return { pts: s.pts, s };
}
async function hostCloseTask() {
  if (H.state.phase !== "task" || H.closingNow) return; H.closingNow = true; stopTick();
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, R = roundOf(H.meta, st.r), quick = scoreQuick(st.r, H.meta.per - 1), res = {}, tot = { ...(st.tot || {}) };
  const placed = st.tables.map((t, ti) => {
    const rows = t.map(p => { const ans = H.players[p] && H.players[p].t ? H.players[p].t[st.r] : null, m = mainScore(R, ans);
      return { p, qp: quick[p] ? quick[p].s : 0, ms: quick[p] ? quick[p].ms : 0, mp: m.pts, s: m.s, ans: ans == null ? null : ans, sub: ans != null }; });
    rows.sort((a, b) => (b.qp + b.mp) - (a.qp + a.mp) || b.mp - a.mp || a.ms - b.ms);
    rows.forEach((x, j) => { const bonus = BONUS[j] || 0, rp = x.qp + x.mp + bonus; tot[x.p] = (tot[x.p] || 0) + rp;
      res[x.p] = { t: ti, pl: j, n: rows.length, qp: x.qp, mp: x.mp, bonus, rp, ans: x.ans, sub: x.sub,
        g: R.tp === "desk" ? x.s.gain : undefined, mine: R.tp === "rate" ? x.s.mine : undefined }; });
    return rows.map(x => x.p);
  });
  const last = st.r >= H.meta.rounds - 1;
  let next = null; const from = {};
  if (!last) { next = chunk(nextOrder(placed, H.meta.rule)); Object.entries(res).forEach(([p, x]) => from[p] = x.pl);
    next.forEach((t, i) => t.forEach(p => res[p].nx = i)); }
  H.closingNow = false;
  hostSet({ ...st, phase: "best", res, tot, placed, next, nextFrom: from, names: namesMap() });
}

/* ---------- the answer screens */
function rateAnswerHTML(c, res, o = {}) {
  const subs = Object.values(res || {}).filter(x => x.sub), dist = L.LADDER.map(r => subs.filter(x => x.mine === r).length), mx = Math.max(1, ...dist);
  const facRight = L.FACTORS.map((f, i) => subs.length ? subs.filter(x => Array.isArray(x.ans) && +x.ans[i] === c.scores[f.key]).length / subs.length : 0);
  const why = c.why && c.why.f;
  return `<div class="bestgrid"><div><table class="dt score"><thead><tr><th>Factor</th><th>The right answer</th><th>Pts</th>${o.mine ? "<th>You</th>" : "<th>Class right</th>"}</tr></thead><tbody>
      ${L.FACTORS.map((f, i) => { const lv = c.scores[f.key], mine = o.mine ? o.mine[i] : null;
        return `<tr><td><b>${esc(f.name)}</b>${why && why[f.key] ? `<small>${esc(why[f.key][0])}</small>` : ""}</td><td>${esc(f.short[lv])}</td><td class="n">${lv}</td>${o.mine ? `<td class="${mine === lv ? "okc" : "noc"}">${mine == null ? "–" : mine === lv ? "✓" : mine}</td>` : `<td class="n">${Math.round(facRight[i] * 100)}%</td>`}</tr>`; }).join("")}
      <tr class="tot"><td>Total</td><td>${c.total} → <b>${c.rating}</b></td><td class="n">${c.total}</td><td></td></tr></tbody></table></div>
    <div class="lessons">${c.why ? `<div class="lesson"><b>${esc(c.why.headline)}</b>${esc(c.why.body)}</div>` : ""}
      ${o.mine ? "" : `<div class="lesson"><b>Class ratings</b><div class="rdist">${L.LADDER.map((r, i) => `<div class="${r === c.rating ? "ok" : ""}"><i style="height:${Math.max(4, dist[i] / mx * 100)}%"></i><b>${dist[i]}</b><span>${r}</span></div>`).join("")}</div></div>`}
      ${c.why && c.why.noise ? `<div class="lesson math"><b>Noise</b>${esc(c.why.noise)}</div>` : ""}</div></div>`;
}
function deskAnswerHTML(y, ri, res, o = {}) {
  const B = L.deskRange(ri).best, subs = Object.values(res || {}).filter(x => x.sub);
  const avg = y.bonds.map((_, i) => subs.length ? subs.reduce((a, x) => a + (Array.isArray(x.ans) ? +x.ans[i] || 0 : 0), 0) / subs.length : 0);
  if (o.mine) return `<div class="rnote">${esc(y.outcome.rateNote)}</div><div class="mycards">${y.bonds.map((b, i) => { const ret = L.bondReturn(y, b), oc = y.outcome[b.id];
      return `<div class="mycard"><div class="mh"><b>${b.id}. ${esc(b.issuer)}</b><span class="n ${ret.total >= y.t0 ? "okc" : "noc"}">${pct(ret.total)}</span></div>
        ${oc.event ? `<span class="ev ${oc.event.default ? "dflt" : (oc.event.pct > 0 ? "up" : "dn")}">${esc(oc.event.label)}</span>` : ""}<p>${esc(oc.story)}</p><small>${esc(y.why[b.id][0])}</small>
        <div class="mk"><span>You: <b>${k(o.mine[i])}</b></span><span>Best: <b>${k(B.picks[i])}</b></span></div></div>`; }).join("")}
      <div class="mycard"><div class="mh"><b>Treasuries (cash)</b><span class="n">${pct(y.t0)}</span></div><div class="mk"><span>You: <b>${money(L.FUND - o.mine.reduce((a, b) => a + b, 0))}</b></span><span>Best: <b>${money(L.FUND - B.picks.reduce((a, b) => a + b, 0))}</b></span></div></div></div>`;
  return `<div class="rnote">${esc(y.outcome.rateNote)}</div>
    <div class="dtwrap"><table class="dt"><thead><tr><th>Bond</th><th>What happened</th><th>Total return</th><th>Best trade</th>${o.mine ? "<th>You</th>" : "<th>Class average</th>"}</tr></thead><tbody>
    ${y.bonds.map((b, i) => { const ret = L.bondReturn(y, b), oc = y.outcome[b.id], why = y.why[b.id];
      return `<tr><td><b>${b.id}. ${esc(b.issuer)}</b><small>${b.rating} · ${b.years} yrs · ${b.yld.toFixed(1)}%</small></td>
        <td>${oc.event ? `<span class="ev ${oc.event.default ? "dflt" : (oc.event.pct > 0 ? "up" : "dn")}">${esc(oc.event.label)}</span>` : ""}${esc(oc.story)}<small>${esc(why[0])}</small></td>
        <td class="n ${ret.total >= y.t0 ? "okc" : "noc"}">${pct(ret.total)}</td><td class="n"><b>${k(B.picks[i])}</b></td>
        <td class="n">${o.mine ? k(o.mine[i]) : "$" + Math.round(avg[i] / 1000) + "K"}</td></tr>`; }).join("")}
    <tr class="tot"><td>Treasuries (cash)</td><td>Money left out of bonds earned ${y.t0.toFixed(1)}%</td><td class="n">${pct(y.t0)}</td><td class="n">${money(L.FUND - B.picks.reduce((a, b) => a + b, 0))}</td><td></td></tr></tbody></table></div>`;
}
function curveAnswerHTML(rd, res, o = {}) {
  const sp = L.spreadOf(rd.ylds), shape = L.shapeOf(sp), band = L.bandOf(rd), subs = Object.values(res || {}).filter(x => x.sub && x.ans);
  const dist = L.BANDS.map(b => subs.filter(x => x.ans.call === b.key).length), mx = Math.max(1, ...dist);
  const shapeRight = subs.length ? subs.filter(x => x.ans.shape === shape).length / subs.length : 0;
  return `<div class="bestgrid"><div>${chartHTML(rd, { w: 600, h: 300 })}
      <div class="lesson math"><b>The spread</b>10Y ${rd.ylds[5].toFixed(2)} − 3M ${rd.ylds[0].toFixed(2)} = ${sgn2(sp)}: <strong>${L.SHAPE_INFO[shape].label}</strong> (${esc(L.SHAPE_INFO[shape].rule.toLowerCase())})${o.mine ? "" : ` · ${Math.round(shapeRight * 100)}% of the class named it right`}</div></div>
    <div class="lessons"><div class="lesson"><b>${esc(rd.headline)}</b>${esc(rd.story)}</div><div class="lesson"><b>The lesson</b>${esc(rd.lesson)}</div>
      ${o.mine ? "" : `<div class="lesson"><b>Class calls</b>${bars(L.BANDS.map((b, i) => ({ label: esc(b.label) + (b.key === band ? " ✓" : ""), v: dist[i], max: mx, cls: b.key === band ? "b1" : "b2", txt: String(dist[i]) })))}</div>`}</div></div>`;
}
function hostBest() {
  const st = H.state, R = roundOf(H.meta, st.r), res = st.res || {};
  const top = Object.entries(res).sort((a, b) => b[1].mp - a[1].mp || (b[1].g || 0) - (a[1].g || 0)).slice(0, 3);
  let title, stat, body;
  if (R.tp === "rate") { const c = L.CASES[R.ref]; title = c.name; stat = `<div class="bigstat"><b class="rbig">${c.rating}</b><span>the right rating</span></div>`; body = rateAnswerHTML(c, res); }
  else if (R.tp === "desk") { const y = L.DESK[R.ref]; title = `Year ${y.year}: ${y.title}`; stat = `<div class="bigstat"><b>${signed(L.deskRange(R.ref).best.gain)}</b><span>best possible year</span></div>`; body = deskAnswerHTML(y, R.ref, res); }
  else { const rd = L.curveByTag[R.ref]; title = `Curve ${rd.tag} was ${rd.date}`; stat = `<div class="bigstat"><b class="${rd.recession ? "bad" : ""}">${rd.recession ? "Recession" : "No recession"}</b><span>${rd.recession ? esc(rd.months + " months later") : "within 2 years"}</span></div>`; body = curveAnswerHTML(rd, res); }
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} · ${esc(L.TOPICS[R.tp].name)}</div><h2>${esc(title)}</h2></div>${stat}</div>${body}
    ${top.length ? `<div class="tops"><b>Top ${esc(L.TOPICS[R.tp].task)} scores</b>${top.map(([p, x], i) => `<span>${i + 1}. ${esc(nameOf(p))} <em>${num(x.mp)}${x.g != null ? " · " + signed(x.g) : ""}</em></span>`).join("")}</div>` : ""}
    <div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn main" id="nx">Table results →</button></div>`;
  $("#nx").onclick = () => hostSet({ ...st, phase: "tables" });
  fit();
}
function hostTables() {
  const st = H.state, last = st.r >= H.meta.rounds - 1;
  app.innerHTML = `<div class="hostbar"><div><div class="kick">Round ${st.r + 1} of ${H.meta.rounds}</div><h2>Table results</h2></div>
    <p>${last ? "Last round done. Points are final." : H.meta.rule === "place" ? "1st places move up together. 2nds together. 3rds together." : "Winners move up one table. Last places move down one. 2nd places stay."}</p></div>
    <div class="tgrid">${st.placed.map((t, i) => `<div class="tcard ${i === 0 ? "toptable" : ""}"><div class="th"><b>Table ${i + 1}</b>${i === 0 ? "<span>Top Table</span>" : ""}</div>
      ${t.map(p => { const x = st.res[p], mv = x.nx == null ? "" : x.nx < i ? `<i class="mv up">▲ T${x.nx + 1}</i>` : x.nx > i ? `<i class="mv dn">▼ T${x.nx + 1}</i>` : `<i class="mv st">T${x.nx + 1}</i>`;
        return `<div class="tn pl${x.pl}"><span class="pm">${PLACE[x.pl]}</span><span>${esc(nameOf(p))}</span><em>+${num(x.rp)}</em>${mv}</div>`; }).join("")}</div>`).join("")}</div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="nx">${last ? "Final results →" : `Seat Round ${st.r + 2} →`}</button></div>`;
  $("#nx").onclick = () => last ? hostSet({ ...st, phase: "end" })
    : hostSet({ phase: "seat", r: st.r + 1, rule: H.meta.rule, tables: st.next, from: st.nextFrom, tot: st.tot, names: namesMap(), hist: [...(st.hist || []), { r: st.r, res: slim(st.res) }] });
  fit();
}
const slim = res => Object.fromEntries(Object.entries(res || {}).map(([p, x]) => [p, { mp: x.mp, sub: x.sub }])); // kept for the class results
function standings(st) { return Object.entries(st.tot || {}).map(([p, s]) => ({ p, s })).sort((a, b) => b.s - a.s); }
function hostEnd() {
  if (H.rq === "end") return; H.rq = "end";
  const st = H.state, list = standings(st), top = list.slice(0, 5), rk = []; let r = 0, prev = null;
  list.forEach((x, i) => { if (x.s !== prev) { r = i + 1; prev = x.s; } rk.push(r); });
  const champ = st.placed && st.placed[0] && st.placed[0][0];
  const slot = (x, i, cls) => x ? `<div class="pod ${cls}" data-i="${i}"><div class="who"><div class="medal">${rk[i]}</div><div class="nm">${esc(nameOf(x.p))}</div><div class="pts">${num(x.s)}</div></div><div class="block"><span>${ord(rk[i])}</span></div></div>` : `<div class="pod ${cls} empty"></div>`;
  document.body.classList.add("finale-on");
  app.style.zoom = "";
  app.innerHTML = `<div class="finale"><div class="rays"></div>
    <div class="fhead"><div class="kick">Bond Ladder · Final</div><h2>Top 5</h2>${champ ? `<div class="champ">Top Table champion, last round: <b>${esc(nameOf(champ))}</b></div>` : ""}</div>
    <div class="podium">${slot(top[1], 1, "p2")}${slot(top[0], 0, "p1")}${slot(top[2], 2, "p3")}</div>
    <div class="rest">${top.slice(3).map((x, k2) => `<div class="row45" data-i="${k2 + 3}"><span class="r">${rk[k2 + 3]}</span><span class="n">${esc(nameOf(x.p))}</span><span class="s">${num(x.s)}</span></div>`).join("")}</div>
    <div class="fbar"><button class="btn" id="cr">Class results</button><button class="btn" id="erase">Erase game</button><button class="btn" id="done">Done</button></div></div>`;
  [4, 3, 2, 1, 0].filter(i => top[i]).forEach((i, n) => setTimeout(() => { const el = app.querySelector(`.finale [data-i="${i}"]`); if (el) el.classList.add("in"); beep(i === 0 ? 1047 : 600, .2); }, 600 + n * 1000));
  $("#cr").onclick = classResults; $("#erase").onclick = hostErase; $("#done").onclick = () => { cleanupHost(); home(); };
}
async function classResults() {
  document.body.classList.remove("finale-on");
  try { H.players = (await H.N.get(`games/${H.code}/players`)) || H.players; } catch (e) {}
  const st = H.state, by = {}, misses = {};
  Object.keys(L.SKILLS).forEach(sk => by[sk] = { n: 0, r: 0 });
  Object.values(H.players).forEach(p => Object.entries(p.a || {}).forEach(([key, x]) => { const [r, qi] = key.split(".").map(Number); if (r >= H.meta.rounds || !H.meta.plan[r].qs[qi]) return;
    const q = roundQ(H.meta, r, qi); by[q.sk].n++; if (x.c === q.ans) by[q.sk].r++; else misses[q.id] = (misses[q.id] || 0) + 1; }));
  const hard = Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => L.bankById[id]);
  const games = { rate: [], desk: [], curve: [] };
  [...(st.hist || []), { r: st.r, res: slim(st.res) }].forEach(h => { const R = roundOf(H.meta, h.r); Object.values(h.res).filter(x => x.sub).forEach(x => games[R.tp].push(x.mp)); });
  const list = standings(st), barRow = (label, p) => `<div class="sk"><span><b>${esc(label)}</b></span><div class="bar"><i class="${p >= .85 ? "" : p >= .6 ? "mid" : "lo"}" style="width:${Math.max(4, p * 100)}%"></i></div><span class="v">${Math.round(p * 100)}%</span></div>`;
  app.innerHTML = `<div class="rep"><h2>Class results</h2><div class="endgrid">
    <div class="skills"><div class="skh">Main tasks (average score)</div>${Object.entries(games).filter(([, v]) => v.length).map(([tp, v]) => barRow(L.TOPICS[tp].task, v.reduce((a, b) => a + b, 0) / v.length / L.MAIN_MAX)).join("")}
      <div class="skh" style="margin-top:10px">Quick Fire by skill</div>${Object.entries(by).filter(([, v]) => v.n).map(([sk, v]) => barRow(L.SKILLS[sk].short, v.r / v.n)).join("")}
      <div class="skh" style="margin-top:10px">Missed most</div>${hard.map(q => `<div class="tipline"><b>${esc(q.p)}</b> ${esc(q.o[0])}. ${esc(q.x)}</div>`).join("") || "<p class='note'>Nothing missed. Nice.</p>"}</div>
    <div class="skills"><div class="skh">Final standings</div><ol class="stand">${list.map(x => `<li><span>${esc(nameOf(x.p))}</span><em>${num(x.s)}</em></li>`).join("")}</ol></div></div>
    <div class="row" style="justify-content:center;margin-top:14px"><button class="btn main" id="pod">Back to Top 5</button><button class="btn" id="erase">Erase game</button></div></div>`;
  $("#pod").onclick = () => { H.rq = null; hostEnd(); }; $("#erase").onclick = hostErase;
  fit();
}
function cleanupHost() { stopTick(); if (H && H.off) H.off(); }
async function hostErase() { if (!H) return home(); cleanupHost(); try { await H.N.remove("games/" + H.code); } catch (e) {} H = null; home(); }

/* ============================================================ STUDENT */
let ME = null;
const SKEY = "bondLadderSession";
const saveSess = o => { try { localStorage.setItem(SKEY, JSON.stringify(o)); } catch (e) {} };
const loadSess = () => { try { return JSON.parse(localStorage.getItem(SKEY) || "null"); } catch (e) { return null; } };
async function joinForm() {
  const N = await net().catch(() => null); if (!N) return needSetup();
  const sv = loadSess(), qcode = (location.search.match(/[?&]code=(\d{4})/) || [])[1];
  app.innerHTML = `${hdr()}<div class="panel"><h2>Join the game</h2><p>${qcode ? "Code filled in. Type your first name." : "Type the code on the board and your first name."} Closed the page? Join again with the same name and you keep your points.</p>
    <input class="field code" id="cd" inputmode="numeric" maxlength="4" placeholder="0000" autocomplete="off" value="${qcode || (sv ? esc(sv.code) : "")}">
    <input class="field" id="nm" maxlength="20" placeholder="First name" autocomplete="given-name" autocapitalize="words" value="${sv && (!qcode || sv.code === qcode) ? esc(sv.name) : ""}">
    <div class="err" id="er"></div><div class="row" id="dup" hidden></div><button class="btn main" id="go">Join</button></div>`;
  (qcode && !$("#nm").value) ? $("#nm").focus() : $("#cd").focus();
  const go = async () => {
    const code = $("#cd").value.trim(), name = cleanName($("#nm").value);
    if (!/^\d{4}$/.test(code)) { $("#er").textContent = "The code is 4 numbers."; return; }
    if (!name) { $("#er").textContent = "Type your first name."; return; }
    $("#go").disabled = true; $("#dup").hidden = true; $("#go").hidden = false;
    const r = await enterGame(N, code, name);
    if (r && r.dup) { // someone with this name is already in: same person coming back, or a second Ava?
      $("#er").textContent = `${r.name} is already in this game.`;
      $("#dup").hidden = false; $("#go").hidden = true;
      $("#dup").innerHTML = `<button class="btn main" id="me">That's me</button><button class="btn" id="other">I'm a different ${esc(r.name)}</button>`;
      $("#me").onclick = async () => { const e = await enterGame(N, code, r.name, r.pid); if (e) { $("#er").textContent = e; } };
      $("#other").onclick = () => { $("#dup").hidden = true; $("#go").hidden = false; $("#nm").value = r.name + " "; $("#nm").focus();
        $("#er").textContent = `Add your last initial so you two show up separately, like "${r.name} M."`; $("#go").disabled = false; };
      return;
    }
    if (r) { $("#er").textContent = r; $("#go").disabled = false; }
  };
  $("#go").onclick = go; $("#nm").onkeydown = e => { if (e.key === "Enter") go(); };
}
// "ava" -> "Ava", "ava m" -> "Ava M."
function cleanName(v) {
  const parts = String(v || "").trim().replace(/\s+/g, " ").split(" ").filter(Boolean).slice(0, 2);
  return parts.map((w, i) => { w = w.charAt(0).toUpperCase() + w.slice(1); return i === 1 && /^[A-Za-z]\.?$/.test(w) ? w.charAt(0) + "." : w; }).join(" ");
}
async function enterGame(N, code, name, forcePid) {
  try {
    const g = await N.get("games/" + code);
    if (!g || g.game !== GAME) return "No Bond Ladder game with that code. Check the board.";
    const norm = x => String(x || "").trim().toLowerCase().replace(/[.\s]+/g, " ").trim(), sv = loadSess();
    let pid = forcePid || (sv && sv.code === code && norm(sv.name) === norm(name) ? sv.pid : null); // this device was already this player
    if (!pid && g.players) { const hit = Object.entries(g.players).find(([, p]) => norm(p.name) === norm(name)); if (hit) return { dup: true, pid: hit[0], name: hit[1].name }; }
    const rec = pid && g.players && g.players[pid];
    if (rec) { name = rec.name || name; await N.update(`games/${code}/players/${pid}`, { out: false }); }
    else { pid = "p" + Math.random().toString(36).slice(2, 10); await N.set(`games/${code}/players/${pid}`, { name, joined: Date.now() }); }
    saveSess({ code, pid, name });
    if (ME && ME.off) ME.off();
    const { state, players, ...meta } = g;
    ME = { N, code, pid, name, meta, a: { ...((rec && rec.a) || {}) }, t: { ...((rec && rec.t) || {}) }, draft: {}, st: null, rq: null };
    $("#who").textContent = name; $("#who").hidden = false;
    ME.off = N.on(`games/${code}/state`, s => { if (!ME) return; if (!s) return gameGone(); ME.st = s; stuRender(); });
    return null;
  } catch (e) { return "Couldn't connect. Try again."; }
}
function gameGone() { stopTick(); document.body.classList.remove("stu-live"); if (ME && ME.off) ME.off(); ME = null; try { localStorage.removeItem(SKEY); } catch (e) {}
  app.innerHTML = `<div class="wait"><h2>The game has ended</h2><p>Your teacher closed this game.</p><button class="btn main" id="h">OK</button></div>`; $("#h").onclick = home; }
const myTotal = st => (st.tot && st.tot[ME.pid]) || 0;
function tableStrip(st) { // my table's names and Quick Fire points this round so far
  const ti = tableOf(st, ME.pid); if (ti < 0) return "";
  const t = st.tables[ti].map(p => ({ p, s: (st.run && st.run[p]) || 0 })).sort((a, b) => b.s - a.s);
  return `<div class="strip"><div class="sl">Table ${ti + 1} this round</div>${t.map(x => `<div class="${x.p === ME.pid ? "me" : ""}"><span>${esc((st.names || {})[x.p] || "?")}</span><b>${num(x.s)}</b></div>`).join("")}</div>`;
}
function stuRender() {
  const M = ME, st = M.st, meta = M.meta; if (!st) return;
  if (st.phase !== "q") document.body.classList.remove("stu-live");
  const ti = tableOf(st, M.pid), inPlay = ti >= 0 || st.phase === "lobby" || st.phase === "end";
  const key = st.phase + "|" + st.r + "|" + st.qi + "|" + (st.phase === "qrev" ? JSON.stringify(st.run || {}) : "") + "|" + (st.phase === "seat" ? JSON.stringify(st.tables) : "");
  if (key === M.rq) return; M.rq = key;
  if (st.phase === "lobby") { app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}!</h2><p>Watch the board. Your teacher will seat the tables.</p></div>`; return; }
  if (st.phase === "end") return stuEnd();
  if (!inPlay) { stopTick(); app.innerHTML = `<div class="wait"><h2>You're in, ${esc(M.name)}</h2><p>This round already started. You'll get a table when the next round is seated.</p><div class="big">${num(myTotal(st))}</div><p>points</p></div>`; return; }
  if (st.phase === "seat") {
    stopTick(); const mates = st.tables[ti].filter(p => p !== M.pid).map(p => (st.names || {})[p] || "?"), lab = tableLabel(st, ti), R = roundOf(meta, st.r);
    app.innerHTML = `<div class="wait seat"><div class="kick">Round ${st.r + 1} of ${meta.rounds} · ${esc(L.TOPICS[R.tp].name)}</div><p>Go to</p><div class="tablebig">TABLE ${ti + 1}</div>${lab ? `<div class="lab">${esc(lab)}</div>` : ""}
      <p>Sit with <b>${mates.map(esc).join("</b> and <b>") || "the group on the board"}</b></p><div class="tot">${num(myTotal(st))} points so far</div></div>`;
    return;
  }
  if (st.phase === "q") return stuQuestion();
  if (st.phase === "qrev") return stuReveal();
  if (st.phase === "task") return stuTask();
  if (st.phase === "best") return stuBest();
  if (st.phase === "tables") return stuTables();
}
function stuQuestion() {
  const M = ME, st = M.st, q = roundQ(M.meta, st.r, st.qi), key = st.r + "." + st.qi, secs = M.meta.qsecs;
  if (M.a[key]) { app.innerHTML = `<div class="wait"><h2>Answer locked in</h2><p>Waiting for everyone else…</p></div>`; return; }
  document.body.classList.add("stu-live");
  app.innerHTML = qHTML(q, head(M.meta, st.r), { num: `${st.qi + 1} of ${M.meta.per}`, timed: true, secs, score: myTotal(st) });
  const t0 = performance.now(); let done = false;
  const pick = i => { if (done) return; done = true; stopTick(); const ms = Math.round(performance.now() - t0);
    document.body.classList.remove("stu-live");
    if (i < 0) { app.innerHTML = `<div class="wait"><h2>Time's up</h2><p>Waiting for the answer…</p></div>`; return; }
    M.a[key] = { c: i, ms }; M.N.update(`games/${M.code}/players/${M.pid}`, { ["a/" + key]: { c: i, ms } }).catch(() => {});
    app.innerHTML = `<div class="wait"><h2>Answer locked in</h2><p>Waiting for everyone else…</p></div>`; };
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => pick(+b.dataset.i));
  startTimer(app, secs, t0, () => pick(-1));
}
function stuReveal() {
  stopTick(); const M = ME, st = M.st, q = roundQ(M.meta, st.r, st.qi), x = M.a[st.r + "." + st.qi];
  const ok = x && x.c === q.ans, pts = x ? L.quickPts(ok, x.ms, M.meta.qsecs) : 0;
  app.innerHTML = `<div class="wait"><h2 style="color:${ok ? "var(--good)" : "var(--bad)"}">${ok ? "Correct!" : x ? "Not quite" : "No answer"}</h2><div class="big">+${pts}</div>
    <p><b>${esc(q.opts[q.ans])}.</b> ${esc(q.x)}</p>${tableStrip(st)}</div>`;
}
/* ---------- the main task */
function stuTask() {
  const M = ME, st = M.st, r = st.r, R = roundOf(M.meta, r), secs = taskSecs(M.meta, r);
  if (M.taskT0 == null || M.taskR !== r) { M.taskT0 = performance.now(); M.taskR = r; }
  if (!M.draft[r]) M.draft[r] = M.t[r] != null ? JSON.parse(JSON.stringify(M.t[r])) : R.tp === "rate" ? L.FACTORS.map(() => null) : R.tp === "desk" ? [0, 0, 0] : { shape: null, call: null, chips: 1 };
  const d = M.draft[r];
  const submit = auto => { M.t[r] = JSON.parse(JSON.stringify(d)); M.N.update(`games/${M.code}/players/${M.pid}`, { ["t/" + r]: M.t[r] }).catch(() => {});
    if (auto) { stopTick(); app.innerHTML = `<div class="wait"><h2>Time's up</h2><p>Your answer was sent as it was.</p></div>`; } else draw(); };
  const locked = () => M.t[r] != null && JSON.stringify(M.t[r]) === JSON.stringify(d);
  const lockLabel = () => locked() ? "Locked in ✓" : M.t[r] != null ? "Update my answer" : "Lock it in";
  const draw = () => {
    const y = window.scrollY;
    let body = "", bar = "", ready = true;
    if (R.tp === "rate") {
      const c = L.CASES[R.ref], filled = d.filter(v => v != null).length, tot = d.reduce((a, v) => a + (+v || 0), 0);
      body = caseHTML(c) + `<div class="facs">${L.FACTORS.map((f, i) => `<div class="fac ${d[i] != null ? "on" : ""}"><div class="fh"><b>${esc(f.name)}</b><small>${esc(f.q)}${f.formula ? ` <em>${esc(f.formula.replace("yearly earnings", c.munis ? "yearly surplus" : "yearly earnings"))}</em>` : ""}</small></div>
        <div class="lvs">${f.levels.map((lv, j) => `<button class="lv" data-f="${i}" data-v="${j}" aria-pressed="${d[i] === j}"><span class="lp">${j}</span><span>${esc(lv)}</span></button>`).join("")}</div></div>`).join("")}</div>`;
      bar = `<div class="meter"><b>${filled} of 6 factors scored</b><span>${filled === 6 ? `Your rating: <b class="myr">${L.ratingFor(tot)}</b>` : "Score all six to see your rating"}</span></div>`;
      ready = filled > 0;
    } else if (R.tp === "desk") {
      const yr = L.DESK[R.ref], inv = d.reduce((a, b) => a + b, 0);
      body = deskHTML(yr, { table: false }) + `<div class="ocards">${yr.bonds.map((b, i) => `<div class="ocard ${d[i] ? "on" : ""}"><div class="on1"><b>${b.id}. ${esc(b.issuer)}</b><small>${esc(b.what)}</small></div>
        <dl><div><dt>Rating</dt><dd>${b.rating}${L.LADDER.indexOf(b.rating) >= 4 ? " (junk)" : ""}</dd></div><div><dt>Years</dt><dd>${b.years}</dd></div><div><dt>Rate sensitivity</dt><dd>${b.sens}</dd></div><div><dt>Yield</dt><dd>${b.yld.toFixed(1)}%</dd></div></dl>
        <div class="amts">${L.AMOUNTS.map(a => `<button class="amt" data-i="${i}" data-v="${a}" aria-pressed="${d[i] === a}">${k(a)}</button>`).join("")}</div></div>`).join("")}</div>`;
      bar = `<div class="meter"><b>${money(inv)} in bonds</b><span>${money(L.FUND - inv)} stays in Treasuries at ${yr.t0.toFixed(1)}%</span></div>`;
    } else {
      const rd = L.curveByTag[R.ref];
      body = curveHTML(rd, { w: 560, h: 300 }) + `<div class="cpick">
        <div class="cstep"><div class="ch">1. Name the shape <small>spread = 10Y − 3M</small></div><div class="pickrow">${L.SHAPE_KEYS.map(s => `<button class="pk" data-k="shape" data-v="${s}" aria-pressed="${d.shape === s}"><b>${L.SHAPE_INFO[s].label}</b><small>${esc(L.SHAPE_INFO[s].rule)}</small></button>`).join("")}</div></div>
        <div class="cstep"><div class="ch">2. When does a recession start?</div><div class="pickrow">${L.BANDS.map(b => `<button class="pk" data-k="call" data-v="${b.key}" aria-pressed="${d.call === b.key}"><b>${esc(b.label)}</b></button>`).join("")}</div></div>
        <div class="cstep"><div class="ch">3. Bet chips on your call <small>right: +150 a chip · wrong: −100 for each chip past the first</small></div><div class="pickrow">${[1, 2, 3].map(n => `<button class="pk chip" data-k="chips" data-v="${n}" aria-pressed="${d.chips === n}"><b>${"●".repeat(n)}</b><small>${n} chip${n > 1 ? "s" : ""}</small></button>`).join("")}</div></div></div>`;
      bar = `<div class="meter"><b>${d.shape && d.call ? "Ready to lock" : "Pick a shape and a call"}</b><span>+100 right shape · +50 exact timing</span></div>`;
      ready = !!(d.shape || d.call);
    }
    app.innerHTML = `<div class="buyhead"><div class="kick">Round ${r + 1} · ${esc(L.TOPICS[R.tp].task)}</div>${timerHTML(secs)}</div>${body}
      <div class="buybar">${bar}<button class="btn main" id="lock" ${ready ? "" : "disabled"}>${lockLabel()}</button></div>`;
    window.scrollTo(0, y);
    app.querySelectorAll(".lv").forEach(b => b.onclick = () => { const i = +b.dataset.f, v = +b.dataset.v; d[i] = d[i] === v ? null : v; draw(); });
    app.querySelectorAll(".amt").forEach(b => b.onclick = () => { d[+b.dataset.i] = +b.dataset.v; draw(); });
    app.querySelectorAll(".pk").forEach(b => b.onclick = () => { const key = b.dataset.k; d[key] = key === "chips" ? +b.dataset.v : b.dataset.v; draw(); });
    $("#lock").onclick = () => submit();
    startTimer(app, secs, M.taskT0, () => { if (!locked()) submit(true); });
  };
  draw();
}
function stuBest() {
  stopTick(); const M = ME, st = M.st, R = roundOf(M.meta, st.r), x = (st.res || {})[M.pid];
  if (!x) { app.innerHTML = `<div class="wait"><h2>Time's up</h2><p>Watch the board.</p></div>`; return; }
  let h, body;
  if (R.tp === "rate") { const c = L.CASES[R.ref]; h = x.mine ? `You said ${x.mine}. It's ${c.rating}.` : `It's ${c.rating}.`; body = rateAnswerHTML(c, null, { mine: Array.isArray(x.ans) ? x.ans.map(v => (v == null ? null : +v)) : L.FACTORS.map(() => null) }); }
  else if (R.tp === "desk") { const y = L.DESK[R.ref]; h = `Your year: ${signed(x.g)}`; body = `<p class="note">Best possible: ${signed(L.deskRange(R.ref).best.gain)}</p>` + deskAnswerHTML(y, R.ref, null, { mine: Array.isArray(x.ans) ? x.ans.map(v => +v || 0) : [0, 0, 0] }); }
  else { const rd = L.curveByTag[R.ref], s = L.curvePoints(R.ref, x.ans); h = `${rd.date}: ${rd.recession ? "recession " + rd.months + " months later" : "no recession in 2 years"}`;
    body = `<div class="stats"><div class="stat"><b>${s.shapeOK ? "✓" : "✗"}</b><span>Shape: ${esc(L.SHAPE_INFO[s.shape].label)}</span></div><div class="stat"><b>${!s.answered ? "–" : s.callOK ? "✓" : "✗"}</b><span>Call (${s.chips} chip${s.chips > 1 ? "s" : ""})</span></div><div class="stat"><b>${s.timingOK ? "✓" : "✗"}</b><span>Exact timing</span></div></div>` + curveAnswerHTML(rd, null, { mine: true }); }
  app.innerHTML = `<div class="rep"><div class="kick">Round ${st.r + 1} · ${esc(L.TOPICS[R.tp].task)}</div><h2>${esc(h)}</h2>
    <div class="stats"><div class="stat"><b>+${num(x.mp)}</b><span>${esc(L.TOPICS[R.tp].task)}</span></div><div class="stat"><b>+${num(x.qp)}</b><span>Quick Fire</span></div></div>${body}</div>`;
}
function stuTables() {
  stopTick(); const M = ME, st = M.st, x = (st.res || {})[M.pid]; if (!x) return;
  const last = st.r >= M.meta.rounds - 1, mv = x.nx == null ? "" : x.nx < x.t ? "up" : x.nx > x.t ? "dn" : "st";
  app.innerHTML = `<div class="wait"><div class="kick">Round ${st.r + 1} · Table ${x.t + 1}</div><h2>You finished ${PLACE[x.pl]}</h2>
    <div class="place ${x.pl < 3 ? "podium-" + (x.pl + 1) : ""}"><span>Round</span><b>+${num(x.rp)}</b>${x.bonus ? `<span>includes +${x.bonus} table bonus</span>` : ""}</div>
    <p style="margin-top:14px"><b>${num(myTotal(st))}</b> points total</p>
    ${last ? "<p>That was the last round. Watch the board for the final results.</p>" : `<div class="nextt ${mv}"><span>Next round</span><b>TABLE ${x.nx + 1}</b><em>${mv === "up" ? "▲ moving up" : mv === "dn" ? "▼ moving down" : "same table"}</em></div>`}</div>`;
}
function stuEnd() {
  stopTick(); const M = ME, st = M.st, list = standings(st), i = list.findIndex(x => x.p === M.pid);
  app.innerHTML = `<div class="wait"><div class="kick">Bond Ladder · Final</div><h2>${i >= 0 ? `You finished ${ord(i + 1)} of ${list.length}` : "Game over"}</h2>
    <div class="big">${num(myTotal(st))}</div><p>total points</p>
    <div class="links">Keep practicing: <a href="/practice-rating-room">Rating Room</a> · <a href="/practice-bond-desk">Bond Desk Solo</a> · <a href="/practice-recession-radar">Recession Radar Solo</a></div></div>`;
  try { localStorage.removeItem(SKEY); } catch (e) {}
}

home();
