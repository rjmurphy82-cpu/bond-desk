// Unit 5 Derivatives Live: student (iPad) screen for all eight games
import { call, $, $$, store } from "./deriv-client.js";
import { GAMES, Q_SECS, fmt, esc, SHAPES, ord, game, round, dec, deskResult, standings, show, deltaText, roundLabel, secsLeft, briefHTML, resultTable, storyCardHTML, needed, settle, roleOf, exSheetHTML, exReportHTML, exTicketHTML, exTap, exUsed, exOrderText, exResultHTML } from "./deriv-view.js";

const SK = "dv_play";
let me = store.get(SK);          // {code, gid, key, name, pin}
let S = null, pollT = null, busy = false, lastKey = "", conn = "", skew = 0, qTick = null;
let draft = {};

/* ---------- join ---------- */
function renderJoin(msg = "", showPin = false) {
  const code = new URLSearchParams(location.search).get("c") || (me && me.code) || "";
  $("#who").textContent = ""; $("#gtitle").textContent = "Derivatives Live"; clearInterval(qTick);
  $("#view").innerHTML = `<div class="center card">
    <div class="label">Unit 5: Derivatives</div><h2 style="font-size:30px;color:var(--brown)">Join the game</h2>
    <label class="field"><span>Game code</span><input id="jCode" class="code" inputmode="numeric" pattern="[0-9]*" maxlength="5" autocomplete="off" value="${esc(code)}"></label>
    <label class="field"><span>Your name (or your group's first names)</span><input id="jName" maxlength="24" autocomplete="off" autocapitalize="words" placeholder="e.g. Maya R. or Maya, Jake &amp; Ava"></label>
    <label class="field" id="pinField" style="display:${showPin ? "block" : "none"}"><span>Your PIN (only if rejoining)</span><input id="jPin" class="code" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off"></label>
    ${showPin ? "" : `<button class="link" id="showPin">Rejoining after your iPad restarted? Tap here.</button>`}
    <div class="actions" style="justify-content:stretch"><button class="btn big" id="jGo" style="width:100%">Join</button></div>
    ${msg ? `<div class="err">${esc(msg)}</div>` : ""}</div>`;
  if ($("#showPin")) $("#showPin").onclick = () => { const c = $("#jCode").value, n = $("#jName").value; renderJoin("", true); $("#jCode").value = c; $("#jName").value = n; };
  $("#jGo").onclick = doJoin;
  $$("input").forEach(i => i.onkeydown = e => { if (e.key === "Enter") doJoin(); });
}
async function doJoin() {
  const code = $("#jCode").value.trim(), name = $("#jName").value.trim(), pin = $("#jPin") ? $("#jPin").value.trim() : "";
  if (!/^\d{5}$/.test(code)) return joinErr("The game code is 5 digits. Look at the board.");
  if (!name) return joinErr("Type your name.");
  $("#jGo").disabled = true;
  try {
    const r = await call("join", { code, name, pin: pin || undefined });
    me = { code, gid: r.gid, key: r.key, name: r.name, pin: r.pin }; store.set(SK, me);
    history.replaceState(null, "", "/deriv?c=" + code); S = null; lastKey = ""; await refresh(true); startPoll();
  } catch (e) { joinErr(e.code === "name_taken" ? "That name is already in this game. If it's you rejoining, tap the rejoin link and enter your PIN." : e.message, e.code === "name_taken"); }
}
function joinErr(m, pin) { const c = $("#jCode").value, n = $("#jName").value, p = $("#jPin") ? $("#jPin").value : ""; renderJoin(m, pin || !!$("#jPin")); $("#jCode").value = c; $("#jName").value = n; if ($("#jPin")) $("#jPin").value = p; }

/* ---------- polling ---------- */
function startPoll() { clearInterval(pollT); pollT = setInterval(() => { if (!document.hidden) refresh(); }, 2000); }
document.addEventListener("visibilitychange", () => { if (!document.hidden && me) refresh(); });
async function refresh(force) {
  if (!me) return;
  if (busy) { if (!force) return; while (busy) await new Promise(r => setTimeout(r, 80)); }
  busy = true;
  try {
    const r = await call("state", { code: me.code, gid: me.gid, key: me.key, since: S ? S.v : undefined });
    conn = ""; if (!r.same) { if (!r.me) throw Object.assign(new Error(), { code: "not_in_game" }); S = r; skew = S.now - Date.now(); render(); } else setConn();
  } catch (e) {
    if (e.code === "no_game" || e.code === "not_in_game") { const code = me.code; me = null; store.del(SK); clearInterval(pollT); history.replaceState(null, "", "/deriv?c=" + code); renderJoin(e.code === "no_game" ? "That game has ended." : "You were removed or rejoined on another iPad. Join again."); }
    else { conn = "Reconnecting..."; setConn(); }
  } finally { busy = false; }
}
function setConn() { const el = $("#conn"); if (el) el.textContent = conn; }
const keepY = fn => { const y = scrollY; fn(); scrollTo(0, y); };
const status = () => `<div class="status" id="conn">${esc(conn)}</div>`;
const mine = () => dec(S, S.r, me.gid);
function myStanding(upto) { const rows = standings(S, upto); return { rows, mine: rows.find(x => x.g.gid === me.gid) }; }

/* ---------- render ---------- */
function render() {
  const G = game(S);
  $("#who").textContent = me.name; $("#gtitle").textContent = G.title;
  const key = S.phase + ":" + S.r + ":" + (S.step || "");
  if (key !== lastKey) { if (!lastKey.startsWith(S.phase + ":" + S.r)) { draft = {}; window.scrollTo(0, 0); } lastKey = key; }
  clearInterval(qTick);
  if (S.phase === "lobby") renderLobby(G);
  else if (S.phase === "final") renderFinal(G);
  else if (G.kind === "story") renderStory(G);
  else if (G.kind === "exchange") renderExchange(G);
  else renderDesk(G);
}
function renderLobby(G) {
  $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">You're in · ${esc(G.title)}</div><div class="bigname">${esc(me.name)}</div>
    <div class="pinbox"><div class="small" style="color:#CFCFCF">Your PIN. Write it down in case your iPad restarts.</div><div class="v">${me.pin}</div></div>
    <p style="font-size:19px;margin-top:18px;line-height:1.45">${G.kind === "story" ? "Watch the story on the board. Answer each question on this iPad. Faster right answers earn more points." : esc(G.pitch)}</p>
    ${G.kind === "exchange" ? roleCard(G) : ""}${G.kind !== "story" ? `<div class="rulebox" style="text-align:left">${esc(G.rule)}</div>` : ""}
    <p class="small">Waiting for your teacher to start...</p>${status()}</div>`;
}

/* ---------- story ---------- */
function renderStory(G) {
  const R = round(S);
  if (R.t === "card") { $("#view").innerHTML = `<div class="mini"><span>${esc(G.topicName)}</span><span>Eyes on the board</span></div>${storyCardHTML(R)}${status()}`; return; }
  if (R.t === "board") {
    const { mine: m, rows } = myStanding(S.r);
    $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">Leaderboard</div><div class="bigname" style="color:var(--orange)">${m ? ord(m.place) : "–"}</div>
      <div style="font-size:22px">of ${rows.length} · <b>${fmt.num(m ? m.value : 0)}</b> points</div><p class="small">Eyes on the board.</p>${status()}</div>`; return;
  }
  const d = mine(), q = `<div class="mini"><span>${roundLabel(G, S.r)}</span><span id="secs"></span></div><p class="qtext" style="font-size:clamp(22px,4vw,34px)">${esc(R.q)}</p>`;
  if (S.phase === "open") {
    if (d) {
      $("#view").innerHTML = q + `<div class="lockedcard" style="margin-top:14px;text-align:center"><div class="label" style="color:var(--light)">Locked in 🔒</div><h2>${SHAPES[d.a]} ${esc(R.a[d.a])}</h2>
        <div style="margin-top:6px;color:#E6E6E6">${S.answered.length} of ${S.groups.length} answered. Watch the board.</div></div>${status()}`;
    } else {
      $("#view").innerHTML = q + `<div class="ans" style="margin-top:14px">${R.a.map((a, i) => `<button class="an" style="background:var(--c${i})" data-a="${i}"><span class="sh">${SHAPES[i]}</span><span>${esc(a)}</span></button>`).join("")}</div>${status()}`;
      $$(".an[data-a]").forEach(b => b.onclick = async () => {
        $$(".an").forEach(x => { x.disabled = true; if (x !== b) x.classList.add("dim"); });
        try { await call("decide", { code: me.code, gid: me.gid, key: me.key, r: S.r, a: +b.dataset.a }); S = null; await refresh(true); }
        catch (e) { alert(e.message); S = null; await refresh(true); }
      });
    }
    const t = () => { const el = $("#secs"); if (!el) return clearInterval(qTick); const l = secsLeft(S, skew); el.textContent = l > 0 ? l + " sec" : "Time's up"; };
    t(); qTick = setInterval(t, 250); return;
  }
  const right = d && d.a === R.c, { mine: m, rows } = myStanding(S.r);
  $("#view").innerHTML = q + `<div class="verdictbig ${right ? "g" : "b"}" style="margin-top:14px"><h2>${right ? "Correct!" : d ? "Not quite" : "No answer"}</h2>
      <div class="pts">${right ? "+" + fmt.num(d.pts) + " points" : "+0"}</div><div style="margin-top:6px">${m ? `${ord(m.place)} of ${rows.length} · ${fmt.num(m.value)} total` : ""}</div></div>
    <div class="why" style="margin-top:12px"><b>${SHAPES[R.c]} ${esc(R.a[R.c])}.</b>${esc(R.why)}</div>${status()}`;
}

/* ---------- trading desk ---------- */
function deskHead(G, R) {
  const m = myStanding(Math.max(-1, S.r - 1)).mine, val = S.r === 0 ? G.metric.start : m ? m.value : G.metric.start;
  return `<div class="mini"><span>Round ${S.r + 1} of ${G.rounds.length} · <b>${esc(R.title)}</b></span><span>${esc(G.metric.label)}: <b>${show(G, val)}</b></span></div>`;
}
function renderDesk(G) {
  const R = round(S), d = mine();
  if (S.phase === "open") {
    if (d) {
      const x = G.result(R, d);
      $("#view").innerHTML = deskHead(G, R) + `<div class="lockedcard"><div class="label" style="color:var(--light)">Locked in 🔒</div><h2>${esc(x.pick)}</h2>
        <div style="margin-top:6px;color:#E6E6E6">${S.answered.length} of ${S.groups.length} groups locked. When everyone's in, your teacher reveals what happened.</div>
        <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="change" style="color:#fff;border-color:#fff">Change our choice</button></div></div>
        <div style="margin-top:14px">${briefHTML(G, R)}</div>${status()}`;
      $("#change").onclick = async () => { try { draft = { ...d }; await call("undecide", { code: me.code, gid: me.gid, key: me.key, r: S.r }); S = null; await refresh(true); } catch (e) { alert(e.message); } };
      return;
    }
    const need = needed(G, R, draft), ok = need.every(f => f.opts.some(o => o[0] === draft[f.k]));
    $("#view").innerHTML = deskHead(G, R) + `<div class="cols">${briefHTML(G, R)}
      <div class="card"><div class="label">Your desk's decision</div>
        ${G.fields(R).map(f => { const off = !need.some(n => n.k === f.k); return `<div class="fieldset"><div class="fl">${esc(f.label)}</div><div class="chs">${f.opts.map(o => `<button class="ch ${draft[f.k] === o[0] && !off ? "on" : ""}" data-k="${f.k}" data-v="${o[0]}" ${off ? "disabled" : ""}><b>${esc(o[1])}</b><span>${esc(o[2] || "")}</span></button>`).join("")}</div></div>`; }).join("")}
        <div class="rulebox">${esc(G.rule)}</div>
        <div class="actions"><button class="btn big" id="lock" ${ok ? "" : "disabled"} style="width:100%">Lock it in</button></div>${status()}</div></div>`;
    $$(".ch").forEach(b => b.onclick = () => { draft[b.dataset.k] = b.dataset.v; keepY(() => renderDesk(G)); });
    $("#lock").onclick = async () => {
      const pick = {}; need.forEach(f => pick[f.k] = draft[f.k]);
      try { $("#lock").disabled = true; await call("decide", { code: me.code, gid: me.gid, key: me.key, r: S.r, pick }); S = null; await refresh(true); }
      catch (e) { alert(e.message); if ($("#lock")) $("#lock").disabled = false; }
    };
    return;
  }
  const x = deskResult(G, S.r, d), rv = G.reveal(R), { mine: m, rows } = myStanding(S.r);
  $("#view").innerHTML = deskHead(G, R) + `<div class="reveal"><div><div class="label">${esc(rv.label)}</div><div class="big" style="font-size:64px">${esc(rv.big)}</div></div><div class="sub" style="flex:1;min-width:200px">${esc(rv.sub)}</div></div>
    <div class="card" style="margin-top:12px"><div class="label">Your desk · ${esc(x.pick)}${x.missing ? " (no answer)" : ""}</div>
      <div class="headline ${x.good ? "g" : x.bad ? "b" : ""}">${esc(x.head)}</div>${resultTable(x)}<div class="small" style="margin-top:6px;font-size:16px">This round: <b>${deltaText(G, x.delta)}</b></div>
      ${S.step === "stand" && m ? `<div class="headline" style="margin-top:10px">${ord(m.place)} of ${rows.length} · ${esc(G.metric.label)} ${show(G, m.value)}</div>` : `<div class="small" style="margin-top:8px">Standings come up on the board next.</div>`}</div>
    <div class="lesson" style="margin-top:12px"><b>The lesson</b>${esc(R.lesson)}</div>${status()}`;
}

/* ---------- the Futures Exchange ---------- */
const px = v => fmt.usd(v, true);
const myRole = () => roleOf(S, me.gid);
function roleCard(G) { const r = myRole(), co = G.roles[r]; return `<div class="rolecard ${r}"><div class="label">You are a ${r === "sell" ? "SELLER" : "BUYER"}</div><h2>${esc(co.name)}</h2><p>${esc(co.what)}</p></div>`; }
function exHead(G, R) {
  const m = myStanding(Math.max(-1, S.r - 1)).mine;
  return `<div class="mini"><span>Quarter ${S.r + 1} of ${G.rounds.length} · <b>${esc(R.title)}</b> · ${myRole() === "sell" ? "Seller" : "Buyer"}</span><span>Points: <b>${fmt.num(S.r === 0 || !m ? 0 : m.value)}</b></span></div>`;
}
function renderExchange(G) {
  const R = round(S), d = mine(), role = myRole();
  if (S.phase === "open") {
    if (d) {
      $("#view").innerHTML = exHead(G, R) + `<div class="lockedcard"><div class="label" style="color:var(--light)">Orders sent 🔒</div><h2 style="font-size:22px;line-height:1.35">${esc(exOrderText(G, d))}</h2>
        <div style="margin-top:6px;color:#E6E6E6">${S.answered.length} of ${S.groups.length} desks locked. When the market closes, you'll see what you traded.</div>
        <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="change" style="color:#fff;border-color:#fff">Change our orders</button></div></div>
        <div class="cols" style="margin-top:14px">${exSheetHTML(G, R, role)}${exReportHTML(R)}</div>${status()}`;
      $("#change").onclick = async () => { try { draft = { orders: { ...(d.orders || {}) } }; await call("undecide", { code: me.code, gid: me.gid, key: me.key, r: S.r }); S = null; await refresh(true); } catch (e) { alert(e.message); } };
      return;
    }
    if (!draft.orders) draft = { orders: {} };
    const used = exUsed(draft), over = used > R.margin;
    $("#view").innerHTML = exHead(G, R) + `<div class="cols"><div class="grid" style="align-content:start">${exSheetHTML(G, R, role)}${exReportHTML(R)}</div>
      <div class="card"><div class="label">Your orders · ${role === "sell" ? "you SELL these goods" : "you BUY these goods"}</div>${exTicketHTML(G, R, draft)}
        <div class="small" style="margin-top:8px">Orders are matched with other desks at one price per commodity. If nobody takes your price, the market maker may fill it at its price. You won't know who's on the other side.</div>
        <div class="actions"><button class="btn big" id="lock" ${over ? "disabled" : ""} style="width:100%">${used ? "Send our orders" : "Lock in: no trades this quarter"}</button></div>${status()}</div></div>`;
    $$("[data-act]").forEach(b => b.onclick = () => { draft = exTap(G, R, draft, b.dataset.act, b.dataset.k, b.dataset.v); keepY(() => renderExchange(G)); });
    $("#lock").onclick = async () => {
      if (!used && !confirm("Lock in with no trades? Every price move will hit your budget.")) return;
      try { $("#lock").disabled = true; await call("decide", { code: me.code, gid: me.gid, key: me.key, r: S.r, pick: draft }); S = null; await refresh(true); }
      catch (e) { alert(e.message); if ($("#lock")) $("#lock").disabled = false; }
    };
    return;
  }
  const X = settle(S, S.r), x = X.byGid[me.gid];
  if (!x) { $("#view").innerHTML = exHead(G, R) + `<div class="center card">Eyes on the board.</div>${status()}`; return; }
  if (S.step === "fills") {
    $("#view").innerHTML = exHead(G, R) + `<div class="card"><div class="label">The market closed · your trades</div>
      <div class="tblwrap"><table class="exsheet"><tr><th>Commodity</th><th>Your order</th><th>What you got</th></tr>
      ${x.lines.map(l => `<tr><td><b>${l.c.name}</b></td><td>${l.ord ? `${l.ord.side === "buy" ? "Buy" : "Sell"} ${l.ord.qty} @ ${px(l.ord.lim)}` : "No trade"}</td><td>${l.fills.length ? l.fills.map(f => `${f.side === "buy" ? "Bought" : "Sold"} ${f.qty} @ ${px(f.price)} ${f.side === "buy" ? "from" : "to"} ${f.w === "mm" ? "the market maker" : "another desk"}`).join("<br>") : l.ord ? '<span class="neg">Not filled</span>' : "–"}${l.ord && l.filled && l.filled < l.ord.qty ? `<div class="small">${l.ord.qty - l.filled} not filled</div>` : ""}</td></tr>`).join("")}</table></div>
      <div class="small" style="margin-top:8px">Delivery prices come up on the board next.</div></div>${status()}`;
    return;
  }
  const { mine: m, rows } = myStanding(S.r), pr = Math.round(4000 * x.risk / x.budget), pf = Math.round(4000 * x.fill / x.budget);
  $("#view").innerHTML = exHead(G, R) + `<div class="card"><div class="label">Delivery · your quarter</div>${exResultHTML(G, R, x, true)}
      <table class="brk" style="margin-top:10px"><tr><td>Start</td><td class="r">1,000</td></tr>
        <tr><td>Price surprises you left unhedged: ${fmt.usd(Math.round(x.risk))}</td><td class="r ${pr ? "neg" : ""}">−${fmt.num(pr)}</td></tr>
        <tr><td>Trading versus the posted price: ${fmt.sgn(Math.round(x.fill))}</td><td class="r ${pf < 0 ? "neg" : pf > 0 ? "pos" : ""}">${pf >= 0 ? "+" : "−"}${fmt.num(Math.abs(pf))}</td></tr>
        <tr><td><b>Points this quarter</b></td><td class="r"><b>${fmt.num(x.points)}</b></td></tr></table>
      ${S.step === "stand" && m ? `<div class="headline" style="margin-top:10px">${ord(m.place)} of ${rows.length} · ${fmt.num(m.value)} points</div>` : ""}</div>
    <div class="lesson" style="margin-top:12px"><b>The lesson</b>${esc(R.lesson)}</div>${status()}`;
}

/* ---------- final ---------- */
function renderFinal(G) {
  const { mine: m, rows } = myStanding(G.rounds.length - 1);
  $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">Final results · ${esc(G.title)}</div>
    <div class="bigname" style="color:var(--orange);font-size:72px">${m ? ord(m.place) : "–"}</div><div style="font-size:22px">of ${rows.length}</div>
    ${G.kind === "exchange" ? roleCard(G) : ""}<div class="headline" style="margin-top:12px">${G.kind === "story" ? `${fmt.num(m ? m.value : 0)} points · ${m ? m.right : 0} right` : `${esc(G.metric.label)}: ${show(G, m ? m.value : G.metric.start)}`}</div>
    <p style="font-size:17px;margin-top:14px">Nice work. Practice more on your own: <a href="/practice-hedging-desk" style="color:var(--rust)">The Hedging Desk</a></p>${status()}</div>`;
}

const urlCode = new URLSearchParams(location.search).get("c");
if (me && urlCode && urlCode !== me.code) { me = null; store.del(SK); }
if (me) { refresh(true).then(startPoll); } else renderJoin();
