// The Bond Desk: host (projector) screen
import * as G from "./game-data.js";
import { call, offlineCaller, esc, $, $$, store } from "./client.js";
import { qrSVG } from "./qr.js";

let api = call, offline = false, S = null, sess = null, pollT = null, netErr = "";
const ui = { tab: "what", why: {}, lastKey: "" };
let tLen = 300, tLeft = 300, tRun = null;

/* ---------- helpers ---------- */
const R = () => G.ROUNDS[S.r];
const k = v => v ? "$" + v / 1000 + "K" : "–";
const picksTxt = p => p ? ["A", "B", "C"].map(id => id + " " + k(p[id])).join(" · ") : "no answer (all cash)";
const groupDecs = (gid, upto) => Array.from({ length: upto + 1 }, (_, r) => (S.decisions[r] || {})[gid]);
function standings(upto) {
  const rows = S.groups.map(g => { const f = G.runFund(groupDecs(g.gid, upto), upto); return { g, f, y: f.years[upto] }; });
  rows.sort((a, b) => b.f.value - a.f.value);
  rows.forEach(r => r.place = rows.filter(o => o.f.value > r.f.value).length + 1);
  return rows;
}
const kk = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.round(Math.abs(v) / 1000) + "K";
const sgnPct = v => v === 0 ? "0.0%" : G.pct(v);
function showErr(m) { netErr = m; const el = $("#netErr"); if (el) el.textContent = m; }

/* ---------- host menu (start screen + in-game menu) ---------- */
ui.menu = false;
async function boot() {
  sess = store.get("bd_host");
  if (sess) {
    try { S = await api("state", { code: sess.code, hostKey: sess.hostKey }); if (!S.host) throw 0; startPoll(); }
    catch { store.del("bd_host"); sess = null; S = null; }
  }
  renderMenu();
}
function gameSummary() {
  if (!S) return "";
  const where = S.phase === "lobby" ? "Waiting in the lobby" : S.phase === "final" ? "Finished: final results" : `Year ${S.r + 1} of ${G.NROUNDS}${S.phase === "reveal" ? " (revealed)" : ""}`;
  return `${where} · ${S.groups.length} ${S.groups.length === 1 ? "player" : "players"}`;
}
function renderMenu(msg = "") {
  ui.menu = true; $("#menuBtn").style.display = "none";
  const live = !!(sess && S);
  $("#view").innerHTML = `<div class="hero">
    ${live ? `<div class="card dark" style="grid-column:1/-1"><div class="label">Game in progress</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div><div style="font-family:Oswald,Arial;font-size:44px;line-height:1">${offline ? "Offline game" : "Game " + esc(sess.code)}</div><div style="font-size:19px;margin-top:4px">${esc(gameSummary())}</div></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn big" id="mResume">Resume</button></div></div></div>` : ""}
    <div class="card ${live ? "" : "dark"}"><div class="label">Run a bond fund for ten years</div>
      <h2 style="font-size:${live ? 30 : 44}px;line-height:1.05;margin:4px 0 10px">Buy, pass, or bet big.</h2>
      <div style="font-size:18px;line-height:1.5">Each player starts with <b>$1,000,000</b>. Every year, three bonds hit the market. Players read the news, check the price, and decide on their iPads.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ${live ? "dk" : "big"}" id="newGame">${live ? "End it &amp; start a new game" : "Start a new game"}</button></div>
      ${msg ? `<div class="err">${esc(msg)}</div>` : ""}
    </div>
    <div class="card"><div class="label">No Wi-Fi or iPads today?</div>
      <div style="font-size:17px;line-height:1.5">Run the game on this screen only. You add players by hand and tap in each one's choices.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="offGame">${live ? "End it &amp; play without iPads" : "Play without iPads"}</button></div>
    </div></div>`;
  if ($("#mResume")) $("#mResume").onclick = () => { ui.menu = false; ui.lastKey = ""; render(); };
  $("#newGame").onclick = async () => {
    if (live && !confirm("End this game and start a new one?\n\nEveryone's results will be erased, and student iPads will go back to the join screen.")) return;
    $("#newGame").disabled = true; await endCurrent();
    try { const r = await api("create"); sess = { code: r.code, hostKey: r.hostKey }; store.set("bd_host", sess); ui.menu = false; await refresh(true); startPoll(); }
    catch (e) { renderMenu(e.code === "db_not_configured" ? "The game database isn't connected yet (see the README setup steps). You can still play without iPads." : e.message + " You can still play without iPads."); }
  };
  $("#offGame").onclick = async () => {
    if (live && !confirm("End this game and play without iPads?\n\nEveryone's results will be erased.")) return;
    await endCurrent();
    offline = true; api = offlineCaller(); $("#offlineTag").style.display = "inline-block";
    const r = await api("create"); sess = { code: r.code, hostKey: r.hostKey }; ui.menu = false; await refresh(true);
  };
}
// End whatever game is running (online or offline) and clear local state
async function endCurrent() {
  if (sess) { try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: "end" }); } catch (e) { /* already gone */ } }
  store.del("bd_host"); clearInterval(pollT); clearInterval(tRun); tRun = null; S = null; sess = null; ui.lastKey = "";
  if (offline) { offline = false; api = call; $("#offlineTag").style.display = "none"; }
}
function startPoll() { clearInterval(pollT); if (offline) return; pollT = setInterval(() => refresh(false), 1500); }
async function refresh(force) {
  try {
    const r = await api("state", { code: sess.code, hostKey: sess.hostKey, since: force || !S ? undefined : S.v });
    if (netErr) showErr("");
    if (r.same) return;
    S = r; render();
  } catch (e) {
    if (e.code === "no_game") { store.del("bd_host"); clearInterval(pollT); S = null; return renderMenu("That game has expired. Start a new one."); }
    showErr("Connection hiccup. Retrying...");
  }
}
async function op(name, extra = {}) {
  try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: name, ...extra }); await refresh(true); }
  catch (e) { alert(e.message); }
}

/* ---------- render router ---------- */
function render() {
  if (ui.menu) return;
  $("#menuBtn").style.display = sess ? "inline-block" : "none";
  const key = S.phase + ":" + S.r;
  if (key !== ui.lastKey) { ui.lastKey = key; ui.tab = "what"; if (S.phase === "open") resetClock(); }
  if (S.phase === "lobby") renderLobby();
  else if (S.phase === "open") renderOpen();
  else if (S.phase === "reveal") renderReveal();
  else renderFinal();
}
const joinUrl = () => location.origin + "/join?c=" + sess.code;

/* ---------- lobby ---------- */
function renderLobby() {
  $("#view").innerHTML = `<div class="hero">
    ${offline ? `<div class="card dark"><div class="label">Offline mode</div><div style="font-size:20px;line-height:1.5">Add each desk by hand on the right. During each year, tap a desk's tile to enter its choices.</div></div>`
    : `<div class="card dark"><div class="label">Join the desk</div>
      <div class="joinbox"><div class="qr">${qrSVG(joinUrl())}</div>
        <div><div class="url">Scan the code, or go to<br><b>${esc(location.host)}/join</b></div><div class="small" style="font-size:16px">Game code</div><div class="code">${sess.code}</div></div></div>
      <div class="small" style="margin-top:12px;font-size:15px">Join with your first name(s), like "Maya, Jake & Ava." Each group gets a 3-digit PIN. If an iPad restarts, rejoin with the same name and PIN.</div></div>`}
    <div class="card"><div class="label">Players joined: ${S.groups.length}</div>
      <div class="tiles" style="grid-template-columns:repeat(2,1fr)">${S.groups.map(g => `<div class="tile"><div><div class="nm">${esc(g.name)}</div><div class="st">PIN ${g.pin}${g.manual ? " · added by hand" : ""}</div></div><button class="x" data-g="${g.gid}" title="Remove">✕</button></div>`).join("") || `<div class="small">Waiting for desks to join...</div>`}</div>
      <div style="display:flex;gap:8px;margin-top:12px"><input id="addName" maxlength="30" placeholder="Add a player by hand" style="flex:1;font-size:17px;padding:8px 10px;border:1px solid var(--rule);border-radius:8px"><button class="btn dk sm" id="addBtn">Add</button></div>
      <div class="actions"><button class="btn big" id="startBtn" ${S.groups.length ? "" : "disabled"}>Open Year 1</button></div>
      <div class="small" id="netErr">${esc(netErr)}</div></div></div>`;
  $$(".x").forEach(b => b.onclick = () => { if (confirm("Remove this desk?")) op("remove", { gid: b.dataset.g }); });
  const add = () => { const n = $("#addName").value.trim(); if (n) op("add", { name: n }); };
  $("#addBtn").onclick = add; $("#addName").onkeydown = e => { if (e.key === "Enter") add(); };
  $("#startBtn").onclick = () => op("start");
}

/* ---------- bond card ---------- */
function bondCard(b, extra = "", cls = "", full = false) {
  const junk = G.isJunk(b.rating), lv = G.levelFor(R().year);
  return `<div class="bond ${cls}"><span class="tag">${b.id}</span><h3>${esc(b.issuer)}</h3><div class="what">${esc(b.what)}</div>
    <div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat ${junk ? "j" : ""}"><div class="v">${b.rating}</div><div class="k">${junk ? "Rating · junk" : "Rating"}</div></div>
    <div class="stat"><div class="v">${b.yld.toFixed(1)}%</div><div class="k">Yield</div></div><div class="stat"><div class="v">${b.years} yr</div><div class="k">Matures</div></div></div>
    ${lv.showFair && !full ? `<div class="fairline">Fair yield: <b>${G.fairYield(R().t0, b.rating).toFixed(1)}%</b> (${R().t0.toFixed(1)}% Treasury + ${G.SPREADS[b.rating].toFixed(1)}% for ${b.rating})</div>` : ""}
    ${lv.showSens || full ? `<div class="sens">If rates rise 1%, its price falls about <b>${b.sens}%</b>.</div>` : ""}${extra}</div>`;
}
function topbar(extra = "") {
  const lv = G.levelFor(R().year);
  return `<div class="topbar"><div class="yr"><div class="sub">Year ${R().year} of ${G.NROUNDS} <span class="lvl" title="${esc(lv.note)}">Level <b>${esc(lv.name)}</b></span></div><h2>${esc(R().title)}</h2></div>
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${extra}
    <div class="tbill"><div class="v">${R().t0.toFixed(1)}%</div><div class="k">Treasury rate</div></div></div></div>`;
}

/* ---------- open year ---------- */
function renderOpen() {
  const locked = new Set(Object.keys(S.decisions[S.r] || {}));
  $("#view").innerHTML = topbar(`${offline ? "" : `<span class="codechip">Join code <b>${sess.code}</b></span>`}
    <div class="clock"><button class="btn ghost sm" id="tMinus">−1</button><span class="timer" id="timer"></span><button class="btn ghost sm" id="tPlus">+1</button><button class="btn sm" id="tGo">Start</button><button class="btn ghost sm" id="tReset">Reset</button></div>`) +
    `<div class="board">
      <div class="grid" style="align-content:start">
        <div class="card"><div class="label">Market news</div><ul class="news">${R().news.map((n, i) => `<li><b>${i + 1}</b><span>${esc(n)}</span></li>`).join("")}</ul></div>
        <div class="card"><div class="label">Fair yield = Treasury rate + spread</div><div class="spreads">${G.LADDER.map(r => `<div class="${G.isJunk(r) ? "j" : ""}">${r}<small>+${G.SPREADS[r].toFixed(1)}%</small></div>`).join("")}</div>
          <div class="small" style="margin-top:8px">Buy $100K or $200K of any bond, or pass. Money you don't invest earns the Treasury rate. At year end, every bond is sold on the secondary market at that day's price. Fund rule: no more than $200K in junk (BB and below) per year, or a $25,000 fine.</div></div>
      </div>
      <div class="grid" style="align-content:start">
        <div class="bonds">${R().bonds.map(b => bondCard(b)).join("")}</div>
        <div class="card"><div class="label">Desks locked in: ${locked.size} of ${S.groups.length}</div>
          <div class="tiles">${S.groups.map(g => `<button class="tile ${locked.has(g.gid) ? "done" : ""}" data-g="${g.gid}"><span class="nm">${esc(g.name)}</span><span class="st">${locked.has(g.gid) ? "🔒 Locked" : offline ? "Tap to enter" : "Deciding..."}</span></button>`).join("")}</div>
          <div class="small" style="margin-top:8px">${offline ? "Tap a desk to enter its choices." : "Tap a desk to enter or fix its choices for it."} Answers stay hidden until the reveal.</div>
          <div class="small" id="netErr">${esc(netErr)}</div>
          <div class="actions" style="align-items:center">${locked.size && locked.size < S.groups.length ? `<button class="btn ghost sm" id="revealAnyway">Reveal anyway</button>` : ""}
            <button class="btn big" id="revealBtn" ${S.groups.length && locked.size === S.groups.length ? "" : "disabled"}>${locked.size === S.groups.length && S.groups.length ? "Everyone's in: reveal" : `Waiting on ${S.groups.length - locked.size} desk${S.groups.length - locked.size === 1 ? "" : "s"}...`}</button></div></div>
      </div></div>`;
  $$(".tile[data-g]").forEach(b => b.onclick = () => openEnter(b.dataset.g));
  $("#revealBtn").onclick = doReveal;
  if ($("#revealAnyway")) $("#revealAnyway").onclick = doReveal;
  $("#tMinus").onclick = () => { tLeft = Math.max(0, tLeft - 60); if (!tRun) tLen = Math.max(60, tLen - 60); tick(); };
  $("#tPlus").onclick = () => { tLeft += 60; if (!tRun) tLen = Math.min(900, tLen + 60); tick(); };
  $("#tGo").onclick = () => { clearInterval(tRun); tRun = setInterval(() => { if (tLeft > 0) { tLeft--; tick(); } else { clearInterval(tRun); tRun = null; } }, 1000); };
  $("#tReset").onclick = resetClock;
  tick();
}
function resetClock() { clearInterval(tRun); tRun = null; tLeft = tLen; tick(); }
function tick() { const el = $("#timer"); if (!el) return; el.textContent = Math.floor(tLeft / 60) + ":" + String(tLeft % 60).padStart(2, "0"); el.classList.toggle("low", tLeft <= 30); }
async function doReveal() {
  const n = Object.keys(S.decisions[S.r] || {}).length;
  if (n < S.groups.length && !confirm(`${n} of ${S.groups.length} desks are locked. Desks without an answer keep all their money in cash this year. Reveal anyway?`)) return;
  clearInterval(tRun); tRun = null;
  await op("reveal");
  const seq = ["3", "2", "1", "📈"]; $("#drumK").textContent = `Year ${R().year} results`; $("#drum").classList.add("on");
  seq.forEach((s, i) => setTimeout(() => { const b = $("#drumBig"); b.textContent = s; b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; }, i * 700));
  setTimeout(() => $("#drum").classList.remove("on"), seq.length * 700 + 600);
}
$("#drum").onclick = () => $("#drum").classList.remove("on");

/* ---------- teacher entry ---------- */
let ent = null;
function openEnter(gid) {
  const g = S.groups.find(x => x.gid === gid); if (!g) return;
  const cur = (S.decisions[S.r] || {})[gid];
  ent = { gid, picks: { A: cur?.A || 0, B: cur?.B || 0, C: cur?.C || 0 }, had: !!cur };
  drawEnter(g); $("#enterModal").classList.add("on");
}
function drawEnter(g) {
  $("#enterBox").innerHTML = `<div class="label">Enter choices for</div><h2 style="font-size:30px;color:var(--brown)">${esc(g.name)}</h2>
    ${R().bonds.map(b => `<div style="margin-top:14px"><div style="font-family:Oswald,Arial;text-transform:uppercase;color:var(--brown);font-size:18px">${b.id}. ${esc(b.issuer)} <span class="small">${b.rating} · ${b.yld.toFixed(1)}%</span></div>
      <div class="seg" data-b="${b.id}">${G.AMOUNTS.map(a => `<button data-a="${a}" class="${ent.picks[b.id] === a ? "on" : ""} ${a ? "" : "pass"}">${a ? "Buy " + k(a) : "Pass"}</button>`).join("")}</div></div>`).join("")}
    <div class="actions" style="justify-content:space-between"><div style="display:flex;gap:8px"><button class="btn ghost" id="eCancel">Cancel</button>${ent.had ? `<button class="btn ghost" id="eClear">Clear answer</button>` : ""}</div><button class="btn big" id="eSave">Lock in</button></div>`;
  $$("#enterBox .seg button").forEach(b => b.onclick = () => { ent.picks[b.parentElement.dataset.b] = +b.dataset.a; drawEnter(g); });
  $("#eCancel").onclick = closeEnter;
  if ($("#eClear")) $("#eClear").onclick = async () => { await op("clear", { gid: ent.gid }); closeEnter(); };
  $("#eSave").onclick = async () => { await op("enter", { gid: ent.gid, picks: ent.picks }); closeEnter(); };
}
function closeEnter() { $("#enterModal").classList.remove("on"); ent = null; }

/* ---------- reveal ---------- */
function renderReveal() {
  const r = R(), d = r.t1 - r.t0, last = S.r >= G.NROUNDS - 1;
  const decs = S.decisions[S.r] || {};
  const tabs = `<div class="tabs2"><button data-t="what" class="${ui.tab === "what" ? "on" : ""}">What happened</button><button data-t="stand" class="${ui.tab === "stand" ? "on" : ""}">Standings</button></div>`;
  let body = "";
  if (ui.tab === "what") {
    body = `<div class="ratebanner"><span class="arrow">${d > 0 ? "▲" : d < 0 ? "▼" : "▶"}</span><div><b>Treasury rate ${r.t0.toFixed(1)}% → ${r.t1.toFixed(1)}%.</b> ${esc(r.outcome.rateNote)}</div></div>
      <div class="bonds">${r.bonds.map(b => {
        const o = r.outcome[b.id], x = G.bondReturn(r, b), beat = x.total > r.t0;
        const buyers = S.groups.filter(g => decs[g.gid] && decs[g.gid][b.id]);
        const cls2 = v => v < 0 ? "neg" : v > 0 ? "pos" : "";
        const brk = x.isDefault
          ? `<tr><td>Interest collected</td><td class="r">none paid</td></tr><tr><td>Secondary-market price: $100 → $40.00</td><td class="r neg">−60.0%</td></tr><tr><td class="sub">Default: buyers pay only 40¢ per $1</td><td></td></tr>`
          : `<tr><td>Interest collected (coupon)</td><td class="r">${sgnPct(x.coupon)}</td></tr>
             <tr><td>Secondary-market price: $100 → $${x.endPrice.toFixed(2)}</td><td class="r ${cls2(x.price)}">${sgnPct(x.price)}</td></tr>
             <tr><td class="sub">Rates ${d > 0 ? "rose" : d < 0 ? "fell" : "unchanged"}${d ? " " + Math.abs(d).toFixed(1) + "% × " + b.sens : ""}</td><td class="r sub ${cls2(x.rate)}">${sgnPct(x.rate)}</td></tr>
             <tr><td class="sub">${o.event ? esc(o.event.label) : "No rating change"}</td><td class="r sub ${cls2(x.credit)}">${sgnPct(x.credit)}</td></tr>`;
        const pc = G.priceCheck(r, b);
        const why = `<div class="why"><p><b>Price check</b>${esc(pc.text)} → <span class="pill ${pc.verdict === "Overpriced" ? "r" : pc.verdict === "Good deal" ? "g" : "ig"}">${pc.verdict}</span></p><p><b>Why</b>${esc(G.reasonFor(r, b))}</p></div>`;
        return bondCard(b, `<div class="out"><div class="story">${o.event?.default ? "💥 " : ""}${esc(o.story)}</div>
          <table class="brk">${brk}<tr class="tot"><td>Return for the year</td><td class="r ${x.total < 0 ? "neg" : ""}">${sgnPct(x.total)}</td></tr></table>
          <div class="verdict"><span class="pill ${beat ? "g" : "r"}">${beat ? "Beat cash" : "Lost to cash"} (${r.t0.toFixed(1)}%)</span><span class="small">${buyers.length} of ${S.groups.length} desks bought</span></div>${why}</div>`, beat ? "win" : "lose", true);
      }).join("")}</div>
      <div class="actions" style="justify-content:space-between;align-items:center"><span></span><span class="small">iPads are waiting on the board. Their results appear when you open Standings.</span><button class="btn dk big" id="toStand">Standings →</button></div>`;
  } else {
    const rows = standings(S.r), bench = G.runFund([], S.r);
    const best = Math.max(...rows.map(x => x.y.gain)), winners = rows.filter(x => x.y.gain === best);
    body = `${winners.length ? `<div class="winbar"><span class="t">🏆</span><div><div class="label" style="color:#FFE1E5">Desk of the Year</div><div class="who">${winners.map(w => esc(w.g.name)).join(" &amp; ")}</div><div style="font-size:18px">Made ${G.signed(best)} this year.</div></div></div>` : ""}
      <div class="card"><table class="standings"><tr><th>Place</th><th>Desk</th><th>This year's picks</th><th class="r">Interest</th><th class="r">Price change</th><th class="r">This year</th><th class="r">Fund value</th></tr>
      ${rows.map(x => `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td><td class="picks">${picksTxt(decs[x.g.gid])}${x.y.fine ? ` <span class="pill r">Junk limit fine −$25K</span>` : ""}</td><td class="r" style="font-size:17px">${G.signed(x.y.interest + x.y.cashGain)}</td><td class="r ${x.y.priceGain < 0 ? "neg" : ""}" style="font-size:17px">${x.y.priceGain ? G.signed(x.y.priceGain) : "$0"}</td><td class="r ${x.y.gain < 0 ? "neg" : "pos"}">${G.signed(x.y.gain)}</td><td class="r val">${G.money(x.f.value)}</td></tr>`).join("")}
      <tr class="bench"><td></td><td>Play-It-Safe Fund</td><td class="picks">all cash, every year</td><td class="r" style="font-size:17px">${G.signed(bench.years[S.r].cashGain)}</td><td class="r" style="font-size:17px">$0</td><td class="r">${G.signed(bench.years[S.r].gain)}</td><td class="r val">${G.money(bench.value)}</td></tr></table>
      <div class="small" style="margin-top:8px"><b>Interest</b> = coupons collected plus Treasury interest on cash. <b>Price change</b> = what the bonds gained or lost when sold on the secondary market. The Play-It-Safe Fund never buys a bond.</div></div>
      <div class="actions"><button class="btn ghost" id="reopen">Reopen this year</button><button class="btn big" id="nextBtn">${last ? "Final results →" : `Open Year ${R().year + 1} →`}</button></div>`;
  }
  $("#view").innerHTML = topbar(tabs) + body + `<div class="small" id="netErr">${esc(netErr)}</div>`;
  $$(".tabs2 button").forEach(b => b.onclick = () => { ui.tab = b.dataset.t; if (ui.tab === "stand") toStandings(); else render(); });
  if ($("#toStand")) $("#toStand").onclick = () => { ui.tab = "stand"; toStandings(); };
  if ($("#reopen")) $("#reopen").onclick = () => { if (confirm("Reopen this year so desks can change their choices?")) op("reopen"); };
  if ($("#nextBtn")) $("#nextBtn").onclick = () => op("next");
}

function toStandings() { render(); if (S.step !== "stand") op("stand"); }

/* ---------- final ---------- */
const LESSONS = [
  "Year 1: Compare the yield to the fair yield. Summit was overpriced, then got downgraded.",
  "Year 2: Watch the economy. Hotels looked cheap until the recession hit; a safe long bond soared as rates fell.",
  "Year 3: Rising rates crush long bonds, even from good companies.",
  "Year 4: A high yield is not a good deal if it's below fair. Blaze defaulted; the stadium paid off.",
  "Year 5: Believe the warning signs. Northgate defaulted; Midwest recovered.",
  "Year 6: Governments get downgraded too. Lakewood's pension hole mattered more than its new park.",
  "Year 7: Sometimes cash is the best trade. When big rate hikes are coming, every bond can lose.",
  "Year 8: In a recession, safe and long wins. A company running out of cash is a pass at any price.",
  "Year 9: Buy the comeback when the news removes the risk. A one-product company is a coin flip.",
  "Year 10: Companies repeat their habits. Match the bond's length to where rates are headed."];
function renderFinal() {
  const last = G.NROUNDS - 1, rows = standings(last), bench = G.runFund([], last), top = rows.slice(0, 3);
  const pod = i => top[i] ? `<div class="pod ${i === 0 ? "first" : ""}"><div class="p">${["1st", "2nd", "3rd"][i]}</div><div class="n">${esc(top[i].g.name)}</div><div class="v">${G.money(top[i].f.value)}</div></div>` : "<div></div>";
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">${G.NROUNDS} years on the desk</div><h2>Final results</h2></div></div>
    <div class="podium">${pod(1)}${pod(0)}${pod(2)}</div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start">
      <div class="card"><table class="standings"><tr><th>Place</th><th>Desk</th>${G.ROUNDS.map(r => `<th class="r" style="padding:7px 4px">Y${r.year}</th>`).join("")}<th class="r">Final value</th></tr>
        ${rows.map(x => `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td>${x.f.years.map(y => `<td class="r ${y.gain < 0 ? "neg" : ""}" style="font-size:14px;padding:6px 4px">${kk(y.gain)}</td>`).join("")}<td class="r val">${G.money(x.f.value)}</td></tr>`).join("")}
        <tr class="bench"><td></td><td>Play-It-Safe Fund</td>${bench.years.map(y => `<td class="r" style="font-size:14px;padding:6px 4px">${kk(y.gain)}</td>`).join("")}<td class="r val">${G.money(bench.value)}</td></tr></table>
        <div class="small" style="margin-top:8px">${rows.filter(x => x.f.value > bench.value).length} of ${rows.length} desks beat the Play-It-Safe Fund.</div>
        <div class="label" style="margin-top:16px">Where the money came from</div>
        <table class="standings"><tr><th>Desk</th><th class="r">Interest collected</th><th class="r">Secondary-market gains / losses</th><th class="r">Fines</th><th class="r">Total gain</th></tr>
        ${rows.map(x => { const t = k2 => x.f.years.reduce((a, y) => a + y[k2], 0); const int = t("interest") + t("cashGain"), pr = t("priceGain"), fn = t("fine");
          return `<tr><td class="nm" style="font-size:18px">${esc(x.g.name)}</td><td class="r">${G.signed(int)}</td><td class="r ${pr < 0 ? "neg" : ""}">${pr ? G.signed(pr) : "$0"}</td><td class="r ${fn ? "neg" : ""}" style="white-space:nowrap">${fn ? "−" + G.money(fn) : "–"}</td><td class="r val">${G.signed(x.f.value - G.START_FUND)}</td></tr>`; }).join("")}</table>
        <div class="small" style="margin-top:6px">Interest is the steady part of a bond. Prices on the secondary market are where fortunes are made and lost.</div></div>
      <div class="card dark"><div class="label">Lessons from the desk</div><ul class="lessons" style="font-size:15px">${LESSONS.map(l => `<li>${esc(l)}</li>`).join("")}</ul></div></div>
    <div class="actions"><button class="btn ghost" id="again">Menu</button></div>`;
  $("#again").onclick = () => renderMenu();
}

$("#menuBtn").onclick = () => renderMenu();

window.__bd = { get S() { return S; }, get sess() { return sess; } };
boot();
