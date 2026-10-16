// The Bond Desk: student (iPad) screen
import * as G from "./game-data.js";
import { call, esc, $, $$, store } from "./client.js";

let me = store.get("bd_play");     // {code, gid, key, name, pin}
let S = null, pollT = null, busy = false, lastKey = "", conn = "";
let draft = {};                     // picks being edited this year
const k = v => v ? "$" + v / 1000 + "K" : "–";

/* ---------- join ---------- */
function renderJoin(msg = "", showPin = false) {
  const code = new URLSearchParams(location.search).get("c") || (me && me.code) || "";
  $("#barSlot").innerHTML = ""; $("#who").textContent = "";
  $("#view").innerHTML = `<div class="center card">
    <div class="label">Join the desk</div><h2 style="font-size:30px;color:var(--brown)">Your bond fund awaits.</h2>
    <label class="field"><span>Game code</span><input id="jCode" class="code" inputmode="numeric" pattern="[0-9]*" maxlength="5" autocomplete="off" value="${esc(code)}"></label>
    <label class="field"><span>Your first name</span><input id="jName" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="e.g. Maya"></label>
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
  if (!/^\d{5}$/.test(code)) return renderJoinErr("The game code is 5 digits. Look at the board.");
  if (!name) return renderJoinErr("Type your first name.");
  $("#jGo").disabled = true;
  try {
    const r = await call("join", { code, name, pin: pin || undefined });
    me = { code, gid: r.gid, key: r.key, name: r.name, pin: r.pin }; store.set("bd_play", me);
    history.replaceState(null, "", "/join?c=" + code); S = null; lastKey = ""; await refresh(true); startPoll();
  } catch (e) { renderJoinErr(e.code === "name_taken" ? "That name is already in this game. Add your last initial (like Maya R.), or if it's you rejoining, tap the rejoin link and enter your PIN." : e.message, e.code === "name_taken"); }
}
function renderJoinErr(m, pin) { const c = $("#jCode").value, n = $("#jName").value, p = $("#jPin") ? $("#jPin").value : ""; renderJoin(m, pin || !!$("#jPin")); $("#jCode").value = c; $("#jName").value = n; if ($("#jPin")) $("#jPin").value = p; }

/* ---------- polling ---------- */
function startPoll() { clearInterval(pollT); pollT = setInterval(() => { if (!document.hidden) refresh(); }, 2500); }
document.addEventListener("visibilitychange", () => { if (!document.hidden && me) refresh(); });
async function refresh(force) {
  if (!me) return;
  if (busy) { if (!force) return; while (busy) await new Promise(r => setTimeout(r, 80)); }
  busy = true;
  try {
    const r = await call("state", { code: me.code, gid: me.gid, key: me.key, since: S ? S.v : undefined });
    conn = ""; if (!r.same) { if (!r.me) throw Object.assign(new Error(), { code: "not_in_game" }); S = r; render(); } else setConn();
  } catch (e) {
    if (e.code === "no_game" || e.code === "not_in_game") { const code = me.code; me = null; store.del("bd_play"); clearInterval(pollT); history.replaceState(null, "", "/join?c=" + code); renderJoin(e.code === "no_game" ? "That game has ended." : "Your desk was removed or rejoined on another iPad. Join again."); }
    else { conn = "Reconnecting..."; setConn(); }
  } finally { busy = false; }
}
function setConn() { const el = $("#conn"); if (el) el.textContent = conn; }

/* ---------- helpers ---------- */
const myDecs = upto => Array.from({ length: upto + 1 }, (_, r) => (S.decisions[r] || {})[me.gid]);
const startValue = () => S.r === 0 ? G.START_FUND : G.runFund(myDecs(S.r - 1), S.r - 1).value;
function rankings(upto) {
  const vals = S.groups.map(g => ({ gid: g.gid, v: G.runFund(Array.from({ length: upto + 1 }, (_, r) => (S.decisions[r] || {})[g.gid]), upto).value }));
  const mine = vals.find(x => x.gid === me.gid)?.v ?? G.START_FUND;
  return { place: vals.filter(x => x.v > mine).length + 1, of: vals.length, value: mine };
}

/* ---------- render ---------- */
function render() {
  $("#who").textContent = me.name;
  const key = S.phase + ":" + S.r;
  if (key !== lastKey) { lastKey = key; const saved = store.get("bd_draft"); draft = saved && saved.key === me.code + key ? saved.p : { A: 0, B: 0, C: 0 }; window.scrollTo(0, 0); }
  if (S.phase === "lobby") renderLobby();
  else if (S.phase === "open") renderOpen();
  else if (S.phase === "reveal") renderReveal();
  else renderFinal();
}
function renderLobby() {
  $("#barSlot").innerHTML = "";
  $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">You're in</div><div class="big" style="font-size:44px">${esc(me.name)}</div>
    <div class="pinbox"><div class="small" style="color:#CFCFCF">Your PIN. Write it down in case your iPad restarts.</div><div class="v">${me.pin}</div></div>
    <p style="font-size:19px;margin-top:18px">You start with <b>${G.money(G.START_FUND)}</b>. Waiting for Year 1 to open...</p><div class="status" id="conn">${esc(conn)}</div></div>`;
}
function bondHTML(b, sel, lockedView) {
  const junk = G.isJunk(b.rating), R = G.ROUNDS[S.r], lv = G.levelFor(R.year);
  return `<div class="bond ${sel ? "picked" : ""}"><span class="tag">${b.id}</span><h3>${esc(b.issuer)}</h3><div class="what">${esc(b.what)}</div>
    <div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat ${junk ? "j" : ""}"><div class="v">${b.rating}</div><div class="k">${junk ? "Rating · junk" : "Rating"}</div></div>
    <div class="stat"><div class="v">${b.yld.toFixed(1)}%</div><div class="k">Yield</div></div><div class="stat"><div class="v">${b.years} yr</div><div class="k">Matures</div></div></div>
    ${lv.showFair ? `<div class="fairline">Fair yield: <b>${G.fairYield(R.t0, b.rating).toFixed(1)}%</b> (${R.t0.toFixed(1)}% + ${G.SPREADS[b.rating].toFixed(1)}% for ${b.rating})</div>` : ""}
    ${lv.showSens ? `<div class="sens">If rates rise 1%, its price falls about <b>${b.sens}%</b>.</div>` : ""}
    ${lockedView ? "" : `<div class="seg" data-b="${b.id}">${G.AMOUNTS.map(a => `<button data-a="${a}" class="${draft[b.id] === a ? "on" : ""} ${a ? "" : "pass"}">${a ? "Buy " + k(a) : "Pass"}</button>`).join("")}</div>`}</div>`;
}
function renderOpen() {
  const R = G.ROUNDS[S.r], mine = (S.decisions[S.r] || {})[me.gid], sv = startValue();
  const lv = G.levelFor(R.year);
  const head = `<div class="yrhead"><div><div class="sub">Year ${R.year} of ${G.NROUNDS} · Fund ${G.money(sv)}</div><h2>${esc(R.title)}</h2><div style="margin-top:6px"><span class="lvl">Level <b>${esc(lv.name)}</b></span> <span class="small">${esc(lv.note)}</span></div></div><div class="chip"><div class="v">${R.t0.toFixed(1)}%</div><div class="k">Treasury rate</div></div></div>`;
  const side = `<div class="grid" style="align-content:start">
      <div class="card"><div class="label">Market news</div><ul class="news">${R.news.map((n, i) => `<li><b>${i + 1}</b><span>${esc(n)}</span></li>`).join("")}</ul></div>
      <div class="card"><div class="label">Fair yield = ${R.t0.toFixed(1)}% + spread</div><div class="spreads">${G.LADDER.map(r => `<div class="${G.isJunk(r) ? "j" : ""}">${r}<small>+${G.SPREADS[r].toFixed(1)}%</small></div>`).join("")}</div>
        <div class="small" style="margin-top:8px">Money you don't invest earns ${R.t0.toFixed(1)}% in Treasuries. At year end you sell every bond on the secondary market at that day's price. Fund rule: no more than $200K in junk (BB and below) this year, or a $25,000 fine.</div></div></div>`;
  if (mine) {
    $("#barSlot").innerHTML = "";
    $("#view").innerHTML = head + `<div class="lockedcard"><div class="label">Locked in 🔒</div><h2>Waiting for the market to close</h2><div style="font-size:18px;margin-top:6px;color:#E6E6E6">${S.locked.length} of ${S.groups.length} desks locked. When everyone's in, your teacher reveals the year.</div>
      <table style="margin-top:10px">${R.bonds.map(b => `<tr><td>${b.id}. ${esc(b.issuer)}</td><td class="r">${mine[b.id] ? "Buy " + k(mine[b.id]) : "Pass"}</td></tr>`).join("")}</table>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="change" style="color:#fff;border-color:#fff">Change our choices</button></div></div>
      <div class="cols" style="margin-top:14px">${side}<div class="grid">${R.bonds.map(b => bondHTML(b, mine[b.id], true)).join("")}</div></div><div class="status" id="conn">${esc(conn)}</div>`;
    $("#change").onclick = async () => { try { const r0 = S.r; draft = { A: mine.A, B: mine.B, C: mine.C }; store.set("bd_draft", { key: me.code + "open:" + r0, p: draft }); await call("undecide", { code: me.code, gid: me.gid, key: me.key, r: r0 }); S = null; lastKey = "x"; await refresh(true); } catch (e) { alert(e.message); } };
    return;
  }
  $("#view").innerHTML = head + `<div class="cols">${side}<div class="grid" style="align-content:start">${R.bonds.map(b => bondHTML(b, draft[b.id], false)).join("")}<div class="status" id="conn">${esc(conn)}</div></div></div>`;
  $$(".seg button").forEach(b => b.onclick = () => { draft[b.parentElement.dataset.b] = +b.dataset.a; store.set("bd_draft", { key: me.code + lastKey, p: draft }); renderOpen(); });
  const inv = draft.A + draft.B + draft.C, junk = R.bonds.reduce((a, b) => a + (G.isJunk(b.rating) ? draft[b.id] : 0), 0);
  $("#barSlot").innerHTML = `<div class="bar"><div class="nums"><div class="n"><div class="v">${G.money(inv)}</div><div class="k">In bonds</div></div><div class="n"><div class="v">${G.money(sv - inv)}</div><div class="k">In cash</div></div>
    <div class="n ${junk > G.JUNK_LIMIT ? "over" : ""}"><div class="v">${G.money(junk)}</div><div class="k">Junk · limit $200K</div></div></div><button class="btn" id="lock">Lock in</button></div>`;
  $("#lock").onclick = async () => {
    const msg = R.bonds.map(b => `${b.id}: ${draft[b.id] ? "Buy " + k(draft[b.id]) : "Pass"}`).join("\n");
    if (!confirm("Lock in these choices?\n\n" + msg)) return;
    try { $("#lock").disabled = true; await call("decide", { code: me.code, gid: me.gid, key: me.key, r: S.r, picks: draft }); S = null; lastKey = "x"; await refresh(true); }
    catch (e) { alert(e.message); if ($("#lock")) $("#lock").disabled = false; }
  };
}
function renderReveal() {
  $("#barSlot").innerHTML = "";
  if (S.step !== "stand") {
    const R0 = G.ROUNDS[S.r], mine = (S.decisions[S.r] || {})[me.gid];
    $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">Year ${R0.year}: ${esc(R0.title)}</div><div class="big" style="font-size:52px">👀 Eyes on the board</div>
      <p style="font-size:19px">The market is closed. Watch the reveal up front. Your results show up here when your teacher opens the standings.</p>
      <div class="lockedcard" style="text-align:left;margin-top:10px"><div class="label">Your picks this year</div><table>${R0.bonds.map(b => `<tr><td>${b.id}. ${esc(b.issuer)}</td><td class="r">${mine && mine[b.id] ? "Buy " + k(mine[b.id]) : "Pass"}</td></tr>`).join("")}</table>
      ${mine ? "" : `<div class="small" style="color:#CFCFCF;margin-top:6px">No answer this year, so all your money stayed in cash.</div>`}</div><div class="status" id="conn">${esc(conn)}</div></div>`;
    return;
  }
  const R = G.ROUNDS[S.r], f = G.runFund(myDecs(S.r), S.r), y = f.years[S.r], rk = rankings(S.r), answered = !!(S.decisions[S.r] || {})[me.gid];
  $("#view").innerHTML = `<div class="yrhead"><div><div class="sub">Year ${R.year} results</div><h2>${esc(R.title)}</h2></div><div class="chip"><div class="v">${R.t0.toFixed(1)}% → ${R.t1.toFixed(1)}%</div><div class="k">Treasury rate</div></div></div>
    <div class="cols"><div class="grid" style="align-content:start">
      <div class="card"><div class="rank"><div class="p">${rk.place}<span style="font-size:24px">/${rk.of}</span></div><div><div class="label">Your desk this year</div><div class="big" style="font-size:40px" >${G.signed(y.gain)}</div><div style="font-size:18px">Fund value: <b>${G.money(f.value)}</b></div></div></div>
        ${answered ? "" : `<div class="small" style="margin-top:8px">No answer this year, so all your money stayed in cash.</div>`}</div>
      <div class="card"><table class="res"><tr><th>Bond</th><th class="r">Put in</th><th class="r">Interest</th><th class="r">Sold for</th><th class="r">Total</th></tr>
        ${y.lines.map(l => { const b = R.bonds.find(x => x.id === l.id); return l.amt ? `<tr><td>${b.id}. ${esc(b.issuer)}</td><td class="r">${k(l.amt)}</td><td class="r">${G.signed(l.interest)}</td><td class="r ${l.priceGain < 0 ? "neg" : ""}">$${l.ret.endPrice.toFixed(2)}<br><span class="small ${l.priceGain < 0 ? "neg" : ""}">${l.priceGain ? G.signed(l.priceGain) : "$0"}</span></td><td class="r ${l.gain < 0 ? "neg" : ""}">${G.signed(l.gain)}</td></tr>`
          : `<tr><td>${b.id}. ${esc(b.issuer)}</td><td class="r">Pass</td><td class="r">–</td><td class="r small">$${l.ret.endPrice.toFixed(2)}</td><td class="r">–</td></tr>`; }).join("")}
        <tr><td>Cash in Treasuries</td><td class="r">${G.money(y.cash)}</td><td class="r">${G.signed(y.cashGain)}</td><td class="r">–</td><td class="r">${G.signed(y.cashGain)}</td></tr>
        ${y.fine ? `<tr><td colspan="4">Junk limit fine (more than $200K in junk)</td><td class="r neg">−$25,000</td></tr>` : ""}
        <tr class="tot"><td colspan="4">Total for the year</td><td class="r ${y.gain < 0 ? "neg" : ""}">${G.signed(y.gain)}</td></tr></table>
        <div class="small" style="margin-top:6px"><b>Interest</b> is what the bond paid you. <b>Sold for</b> is its price per $100 on the secondary market at year end.</div></div></div>
      <div class="card"><div class="label">What happened</div><div class="story"><b>Rates:</b> ${esc(R.outcome.rateNote)}</div>
        ${R.bonds.map(b => { const pc = G.priceCheck(R, b); return `<div class="story"><b>${b.id}. ${esc(b.issuer)}:</b> ${esc(R.outcome[b.id].story)}<div class="small" style="margin-top:3px"><b style="color:var(--brown)">${pc.verdict}</b> (${esc(pc.text)}). ${esc(G.reasonFor(R, b))}</div></div>`; }).join("")}</div></div><div class="status" id="conn">${esc(conn)}</div>`;
}
function renderFinal() {
  $("#barSlot").innerHTML = "";
  const last = G.NROUNDS - 1, f = G.runFund(myDecs(last), last), rk = rankings(last), bench = G.runFund([], last).value;
  $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">${G.NROUNDS} years on the desk</div><div class="big" style="font-size:40px">${esc(me.name)}</div>
    <div class="rank" style="justify-content:center;margin:16px 0"><div class="p">${rk.place}<span style="font-size:24px">/${rk.of}</span></div><div style="text-align:left"><div class="small">Final fund value</div><div class="big" style="font-size:44px">${G.money(f.value)}</div></div></div>
    <p style="font-size:18px">${f.value > bench ? "You beat" : "You fell short of"} the Play-It-Safe Fund (all cash), which finished at <b>${G.money(bench)}</b>.</p>
    <table class="res" style="margin-top:10px">${f.years.map((yy, i) => `<tr><td>Year ${i + 1}</td><td class="r ${yy.gain < 0 ? "neg" : ""}">${G.signed(yy.gain)}</td></tr>`).join("")}</table>
    <div class="actions" style="justify-content:center"><button class="btn ghost" id="leave">Leave game</button></div></div>`;
  $("#leave").onclick = () => { store.del("bd_play"); me = null; clearInterval(pollT); renderJoin(); };
}

/* ---------- boot ---------- */
const urlCode = new URLSearchParams(location.search).get("c");
if (me && (!urlCode || urlCode === me.code)) { refresh(); startPoll(); $("#view").innerHTML = `<div class="center card">Reconnecting to your desk...</div>`; }
else { if (me && urlCode !== me.code) { me = null; store.del("bd_play"); } renderJoin(); }
