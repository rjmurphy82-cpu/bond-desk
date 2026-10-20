// Credit Desk Live: host (projector) screen
import { call, offlineCaller, $, $$, store } from "./credit-client.js";
import { qrSVG } from "./qr.js";
import { C, esc, k, N, picksFor, ratingOf, nailedCount, standings, caseFileHTML, mathLine, returnLines, stagePills } from "./credit-view.js";

let api = call, offline = false, S = null, sess = null, pollT = null, netErr = "";
const ui = { lastKey: "", menu: false };
let tLen = 360, tLeft = 360, tRun = null;
const Y = () => C.YEARS[S.r];
const SKEY = "cd_host";
function showErr(m) { netErr = m; const el = $("#netErr"); if (el) el.textContent = m; }

/* ---------- menu ---------- */
async function boot() {
  sess = store.get(SKEY);
  if (sess) { try { S = await api("state", { code: sess.code, hostKey: sess.hostKey }); if (!S.host) throw 0; startPoll(); } catch { store.del(SKEY); sess = null; S = null; } }
  renderMenu();
}
function gameSummary() {
  if (!S) return "";
  const where = S.phase === "lobby" ? "Waiting in the lobby" : S.phase === "final" ? "Finished: final results" : `Year ${S.r + 1} of ${N} · ${S.phase === "rate" ? "rating" : S.phase === "price" ? "market open" : "reveal"}`;
  return `${where} · ${S.groups.length} ${S.groups.length === 1 ? "group" : "groups"}`;
}
function renderMenu(msg = "") {
  ui.menu = true; $("#menuBtn").style.display = "none";
  const live = !!(sess && S);
  $("#view").innerHTML = `<div class="hero">
    ${live ? `<div class="card dark" style="grid-column:1/-1"><div class="label">Game in progress</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div><div style="font-family:Oswald,Arial;font-size:44px;line-height:1">${offline ? "Offline game" : "Game " + esc(sess.code)}</div><div style="font-size:19px;margin-top:4px">${esc(gameSummary())}</div></div>
        <button class="btn big" id="mResume">Resume</button></div></div>` : ""}
    <div class="card ${live ? "" : "dark"}"><div class="label">Rate it, then buy it</div>
      <h2 style="font-size:${live ? 30 : 44}px;line-height:1.05;margin:4px 0 10px">Be the analyst and the fund manager.</h2>
      <div style="font-size:18px;line-height:1.5">Six years, one borrower each year. Groups score the borrower on their iPads and lock in a rating. Then you open the market: they use <b>their own rating</b> to find the fair yield and decide how much to buy. Then the reveal: the true rating, what happened to the bond, and standings.</div>
      <div style="font-size:16px;margin-top:8px">Groups use the <b>Credit Desk Analyst Worksheet</b> for the math.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ${live ? "dk" : "big"}" id="newGame">${live ? "End it &amp; start a new game" : "Start a new game"}</button></div>
      ${msg ? `<div class="err">${esc(msg)}</div>` : ""}</div>
    <div class="card"><div class="label">No Wi-Fi or iPads today?</div>
      <div style="font-size:17px;line-height:1.5">Run the game on this screen only. Add groups by hand, then tap each group to enter its rating and how much it buys.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="offGame">${live ? "End it &amp; play without iPads" : "Play without iPads"}</button></div></div></div>`;
  if ($("#mResume")) $("#mResume").onclick = () => { ui.menu = false; ui.lastKey = ""; render(); };
  $("#newGame").onclick = async () => {
    if (live && !confirm("End this game and start a new one? Everyone's results will be erased.")) return;
    $("#newGame").disabled = true; await endCurrent();
    try { const r = await api("create"); sess = { code: r.code, hostKey: r.hostKey }; store.set(SKEY, sess); ui.menu = false; await refresh(true); startPoll(); }
    catch (e) { renderMenu(e.code === "db_not_configured" ? "The game database isn't connected yet (see the README). You can still play without iPads." : e.message + " You can still play without iPads."); }
  };
  $("#offGame").onclick = async () => {
    if (live && !confirm("End this game and play without iPads? Everyone's results will be erased.")) return;
    await endCurrent(); offline = true; api = offlineCaller(); $("#offlineTag").style.display = "inline-block";
    const r = await api("create"); sess = { code: r.code, hostKey: r.hostKey }; ui.menu = false; await refresh(true);
  };
}
async function endCurrent() {
  if (sess) { try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: "end" }); } catch (e) {} }
  store.del(SKEY); clearInterval(pollT); clearInterval(tRun); tRun = null; S = null; sess = null; ui.lastKey = "";
  if (offline) { offline = false; api = call; $("#offlineTag").style.display = "none"; }
}
function startPoll() { clearInterval(pollT); if (offline) return; pollT = setInterval(() => refresh(false), 1500); }
async function refresh(force) {
  try {
    const r = await api("state", { code: sess.code, hostKey: sess.hostKey, since: force || !S ? undefined : S.v });
    if (netErr) showErr(""); if (r.same) return; S = r; render();
  } catch (e) {
    if (e.code === "no_game") { store.del(SKEY); clearInterval(pollT); S = null; return renderMenu("That game has expired. Start a new one."); }
    showErr("Connection hiccup. Retrying...");
  }
}
async function op(name, extra = {}) { try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: name, ...extra }); await refresh(true); } catch (e) { alert(e.message); } }

/* ---------- router ---------- */
function render() {
  if (ui.menu) return;
  $("#menuBtn").style.display = sess ? "inline-block" : "none";
  const key = S.phase + ":" + S.r;
  if (key !== ui.lastKey) { ui.lastKey = key; if (S.phase === "rate") { tLen = 360; resetClock(); } if (S.phase === "price") { tLen = 240; resetClock(); } }
  if (S.phase === "lobby") renderLobby();
  else if (S.phase === "rate") renderRate();
  else if (S.phase === "price") renderPrice();
  else if (S.phase === "reveal") renderReveal();
  else renderFinal();
}
const joinUrl = () => location.origin + "/credit?c=" + sess.code;

/* ---------- lobby ---------- */
function renderLobby() {
  $("#view").innerHTML = `<div class="hero">
    ${offline ? `<div class="card dark"><div class="label">Offline mode</div><div style="font-size:20px;line-height:1.5">Add each group by hand on the right. Each year, tap a group's tile to enter its rating, then how much it buys.</div></div>`
    : `<div class="card dark"><div class="label">Join Credit Desk Live</div>
      <div class="joinbox"><div class="qr">${qrSVG(joinUrl())}</div>
        <div><div class="url">Scan the code, or go to<br><b>${esc(location.host)}/credit</b></div><div class="small" style="font-size:16px">Game code</div><div class="code">${sess.code}</div></div></div>
      <div class="small" style="margin-top:12px;font-size:15px">One iPad per group. Join with your group's first names, like "Maya, Jake &amp; Ava." Write down your 3-digit PIN in case an iPad restarts. Have your Analyst Worksheet out.</div></div>`}
    <div class="card"><div class="label">Groups joined: ${S.groups.length}</div>
      <div class="tiles" style="grid-template-columns:repeat(2,1fr)">${S.groups.map(g => `<div class="tile"><div><div class="nm">${esc(g.name)}</div><div class="st">PIN ${g.pin}${g.manual ? " · added by hand" : ""}</div></div><button class="x" data-g="${g.gid}" title="Remove">✕</button></div>`).join("") || `<div class="small">Waiting for groups to join...</div>`}</div>
      <div style="display:flex;gap:8px;margin-top:12px"><input id="addName" maxlength="30" placeholder="Add a group by hand" style="flex:1;font-size:17px;padding:8px 10px;border:1px solid var(--rule);border-radius:8px"><button class="btn dk sm" id="addBtn">Add</button></div>
      <div class="actions"><button class="btn big" id="startBtn" ${S.groups.length ? "" : "disabled"}>Open Year 1</button></div>
      <div class="small" id="netErr">${esc(netErr)}</div></div></div>`;
  $$(".x").forEach(b => b.onclick = () => { if (confirm("Remove this group?")) op("remove", { gid: b.dataset.g }); });
  const add = () => { const n = $("#addName").value.trim(); if (n) op("add", { name: n }); };
  $("#addBtn").onclick = add; $("#addName").onkeydown = e => { if (e.key === "Enter") add(); };
  $("#startBtn").onclick = () => op("start");
}

/* ---------- shared bits ---------- */
function topbar(extra = "") {
  return `<div class="topbar"><div class="yr"><div class="sub">Year ${Y().year} of ${N}</div><h2>${esc(Y().title)}</h2></div>
    <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${stagePills(S)}${extra}
      <div class="tbill"><div class="v">${S.phase === "reveal" && S.step !== "rating" ? Y().t0.toFixed(1) + "→" + Y().t1.toFixed(1) : Y().t0.toFixed(1)}%</div><div class="k">Treasury rate</div></div></div></div>`;
}
const codeChip = () => offline ? "" : `<span class="codechip">Join <b>${sess.code}</b></span>`;
const clock = () => `<div class="clock"><button class="btn ghost sm" id="tMinus">−1</button><span class="timer" id="timer"></span><button class="btn ghost sm" id="tPlus">+1</button><button class="btn sm" id="tGo">Start</button><button class="btn ghost sm" id="tReset">Reset</button></div>`;
function wireClock() {
  $("#tMinus").onclick = () => { tLeft = Math.max(0, tLeft - 60); if (!tRun) tLen = Math.max(60, tLen - 60); tick(); };
  $("#tPlus").onclick = () => { tLeft += 60; if (!tRun) tLen = Math.min(1200, tLen + 60); tick(); };
  $("#tGo").onclick = () => { clearInterval(tRun); tRun = setInterval(() => { if (tLeft > 0) { tLeft--; tick(); } else { clearInterval(tRun); tRun = null; } }, 1000); };
  $("#tReset").onclick = resetClock; tick();
}
function resetClock() { clearInterval(tRun); tRun = null; tLeft = tLen; tick(); }
function tick() { const el = $("#timer"); if (!el) return; el.textContent = Math.floor(tLeft / 60) + ":" + String(tLeft % 60).padStart(2, "0"); el.classList.toggle("low", tLeft <= 30); }
function tilesCard(doneSet, doneLbl, waitLbl, label) {
  const wl = typeof waitLbl === "function" ? waitLbl : () => waitLbl;
  return `<div class="card"><div class="label">${label}: ${doneSet.size} of ${S.groups.length}</div>
    <div class="tiles">${S.groups.map(g => `<button class="tile ${doneSet.has(g.gid) ? "done" : ""}" data-g="${g.gid}"><span class="nm">${esc(g.name)}</span><span class="st">${doneSet.has(g.gid) ? doneLbl : offline ? "Tap to enter" : wl(g)}</span></button>`).join("")}</div>
    <div class="small" style="margin-top:8px">${offline ? "Tap a group to enter its answer." : "Tap a group to enter or fix its answer for it."} Answers stay hidden until the reveal.</div>
    <div class="small" id="netErr">${esc(netErr)}</div>`;
}

/* ---------- 1. rate it ---------- */
function renderRate() {
  const done = new Set(S.rated), all = S.groups.length && done.size === S.groups.length;
  $("#view").innerHTML = topbar(codeChip() + clock()) + `<div class="sheetbar">▶ <b>Part A on the worksheet.</b> Do the 3 divisions, score all six factors on the iPad, add the points, and lock in your rating.</div>
    <div class="board" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)"><div>${caseFileHTML(Y(), true)}</div>
    <div class="grid" style="align-content:start">${tilesCard(done, "🔒 Rated", "Rating...", "Groups rated")}
      <div class="actions" style="align-items:center">${done.size && !all ? `<button class="btn ghost sm" id="anyway">Open the market anyway</button>` : ""}
        <button class="btn big" id="toPrice" ${all ? "" : "disabled"}>${all ? "Everyone's rated: open the market" : `Waiting on ${S.groups.length - done.size} group${S.groups.length - done.size === 1 ? "" : "s"}...`}</button></div></div>
      <div class="card"><div class="label">Scorecard reminder</div><div class="small" style="font-size:15px;line-height:1.5">Debt load = debt ÷ earnings · Interest coverage = earnings ÷ interest · Cash cushion = cash ÷ debt due. 24 points max: AAA 22+, AA 19+, A 16+, BBB 13+, BB 10+, B 6+, CCC 0–5.</div></div></div></div>`;
  $$(".tile[data-g]").forEach(b => b.onclick = () => openEnter(b.dataset.g));
  const go = async () => { const n = done.size; if (n < S.groups.length && !confirm(`${n} of ${S.groups.length} groups have rated. Groups without a rating can't buy this year (their money stays in cash). Open the market anyway?`)) return; clearInterval(tRun); tRun = null; await op("price"); };
  $("#toPrice").onclick = go; if ($("#anyway")) $("#anyway").onclick = go;
  wireClock();
}

/* ---------- 2. price it ---------- */
function renderPrice() {
  const y = Y(), b = y.bond, done = new Set(S.priced), rated = new Set(S.rated), all = S.groups.length && done.size >= rated.size && rated.size > 0;
  const junk = C.isJunk(b.posted);
  $("#view").innerHTML = topbar(codeChip() + clock()) + `<div class="sheetbar">▶ <b>Part B on the worksheet.</b> Fair yield = Treasury rate + the spread for <b>YOUR</b> rating. Compare it to what the bond pays, then decide how much to buy.</div>
    <div class="board" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)"><div class="grid" style="align-content:start">
      <div class="ratebanner"><span class="arrow">📰</span><div><b>Rate news:</b> ${esc(y.rateNews)}</div></div>
      <div class="card"><div class="label">The market · ${esc(y.issuer.name)}</div>
        <div class="marketgrid"><div class="stat ${junk ? "j" : ""}"><div class="v">${b.posted}</div><div class="k">Agency's posted rating</div></div><div class="stat"><div class="v">${b.yld.toFixed(1)}%</div><div class="k">Bond pays</div></div>
          <div class="stat"><div class="v">${b.years} yr</div><div class="k">Matures</div></div><div class="stat"><div class="v">${b.sens}%</div><div class="k">Price move per 1% rate change</div></div></div>
        <div style="font-size:19px;margin-top:12px">The posted rating may be out of date. <b>Trust your own scorecard.</b></div></div>
      <div class="card"><div class="label">Fair yield = ${y.t0.toFixed(1)}% + spread</div><div class="spreads">${C.LADDER.map(r => `<div class="${C.isJunk(r) ? "j" : ""}">${r}<small>+${C.SPREADS[r].toFixed(1)}%</small></div>`).join("")}</div>
        <div class="small" style="margin-top:8px;font-size:15px">Pay 0.3% or more above fair = good deal. Less than fair = overpriced. Pass, $100K, $200K or $300K. Cash earns ${y.t0.toFixed(1)}%. Fund rule: no more than $200K in a bond <b>posted</b> as junk (BB or lower), or a $25,000 fine${junk ? " <b>(this one is posted as junk)</b>" : ""}.</div></div></div>
    <div class="grid" style="align-content:start">${tilesCard(done, "🔒 Locked", g => rated.has(g.gid) ? "Deciding..." : "No rating", "Groups locked in")}
      <div class="actions" style="align-items:center"><button class="btn ghost sm" id="back">Back to rating</button>${done.size && !all ? `<button class="btn ghost sm" id="anyway">Reveal anyway</button>` : ""}
        <button class="btn big" id="reveal" ${all ? "" : "disabled"}>${all ? "Everyone's in: reveal" : `Waiting on ${Math.max(0, rated.size - done.size)} group${rated.size - done.size === 1 ? "" : "s"}...`}</button></div></div></div></div>`;
  $$(".tile[data-g]").forEach(x => x.onclick = () => openEnter(x.dataset.g));
  $("#reveal").onclick = doReveal; if ($("#anyway")) $("#anyway").onclick = doReveal;
  $("#back").onclick = () => { if (confirm("Go back to the rating step? Groups can change their ratings, and buys made so far stay saved.")) op("backToRate"); };
  wireClock();
}
async function doReveal() {
  const n = S.priced.length;
  if (n < S.groups.length && !confirm(`${n} of ${S.groups.length} groups are locked. Groups without an answer keep all their money in cash this year. Reveal anyway?`)) return;
  clearInterval(tRun); tRun = null; await op("reveal");
  const seq = ["3", "2", "1", Y().truth.rating]; $("#drumK").textContent = `The true rating for ${Y().issuer.name}`; $("#drum").classList.add("on");
  seq.forEach((s, i) => setTimeout(() => { const b = $("#drumBig"); b.textContent = s; b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; }, i * 700));
  setTimeout(() => $("#drum").classList.remove("on"), seq.length * 700 + 1400);
}
$("#drum").onclick = () => $("#drum").classList.remove("on");

/* ---------- teacher entry ---------- */
let ent = null;
function openEnter(gid) {
  const g = S.groups.find(x => x.gid === gid); if (!g) return;
  const cur = (S.decisions[S.r] || {})[gid] || {};
  ent = { gid, rating: cur.rating || null, amt: cur.amt ?? null, had: !!cur.rating };
  drawEnter(g); $("#enterModal").classList.add("on");
}
function drawEnter(g) {
  const price = S.phase === "price";
  $("#enterBox").innerHTML = `<div class="label">Enter for</div><h2 style="font-size:30px;color:var(--brown)">${esc(g.name)}</h2>
    <div style="margin-top:12px;font-family:Oswald,Arial;text-transform:uppercase;color:var(--brown);font-size:18px">Their rating</div>
    <div class="seg" style="grid-template-columns:repeat(7,1fr)" data-k="rating">${C.LADDER.map(r => `<button data-v="${r}" class="${ent.rating === r ? "on" : ""}">${r}</button>`).join("")}</div>
    ${price ? `<div style="margin-top:14px;font-family:Oswald,Arial;text-transform:uppercase;color:var(--brown);font-size:18px">How much they buy</div>
      <div class="seg" style="grid-template-columns:repeat(4,1fr)" data-k="amt">${C.AMOUNTS.map(a => `<button data-v="${a}" class="${ent.amt === a ? "on" : ""} ${a ? "" : "pass"}">${a ? "Buy " + k(a) : "Pass"}</button>`).join("")}</div>` : ""}
    <div class="actions" style="justify-content:space-between"><div style="display:flex;gap:8px"><button class="btn ghost" id="eCancel">Cancel</button>${ent.had ? `<button class="btn ghost" id="eClear">Clear answer</button>` : ""}</div><button class="btn big" id="eSave" ${ent.rating && (!price || ent.amt !== null) ? "" : "disabled"}>Lock in</button></div>`;
  $$("#enterBox .seg button").forEach(b => b.onclick = () => { const kk = b.parentElement.dataset.k; ent[kk] = kk === "amt" ? +b.dataset.v : b.dataset.v; drawEnter(g); });
  $("#eCancel").onclick = closeEnter;
  if ($("#eClear")) $("#eClear").onclick = async () => { await op("clear", { gid: ent.gid }); closeEnter(); };
  $("#eSave").onclick = async () => { await op("enter", { gid: ent.gid, rating: ent.rating, amt: price ? ent.amt : undefined }); closeEnter(); };
}
function closeEnter() { $("#enterModal").classList.remove("on"); ent = null; }

/* ---------- 3. reveal ---------- */
function renderReveal() {
  const y = Y(), t = y.truth, b = y.bond, decs = S.decisions[S.r] || {}, step = S.step || "rating", last = S.r >= N - 1;
  const tabs = `<div class="tabs2">${[["rating", "True rating"], ["bond", "What happened"], ["stand", "Standings"]].map(([v, l]) => `<button data-t="${v}" class="${step === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
  let body = "";
  if (step === "rating") {
    const by = r => S.groups.filter(g => (decs[g.gid] || {}).rating === r);
    const nailed = by(t.rating).length, none = S.groups.filter(g => !(decs[g.gid] || {}).rating);
    body = `<div class="sheetbar">▶ <b>Part C on the worksheet.</b> Write the true rating, then watch what happens to the bond.</div>
      <div class="board" style="grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)"><div class="card"><div class="truth"><div class="L">${t.rating}</div>
        <div><div class="label">True rating · ${esc(y.issuer.name)}</div><div style="font-size:22px">${t.total} points out of 24. The agency had posted <b>${b.posted}</b>.</div>
          <div style="font-size:19px;margin-top:6px">${b.posted === t.rating ? "The agency was right this time." : C.LADDER.indexOf(t.rating) > C.LADDER.indexOf(b.posted) ? "The posted rating was too <b>high</b>. A downgrade is coming." : "The posted rating was too <b>low</b>. An upgrade is coming."}</div></div></div>
        <table class="facttbl" style="margin-top:12px"><tr><th>Factor</th><th class="r">Pts</th><th>Why</th></tr>${C.FACTORS.map(f => `<tr><td><b>${f.name}</b></td><td class="r"><b>${t.scores[f.key]}</b></td><td>${esc(mathLine(y, f.key))}</td></tr>`).join("")}</table></div>
      <div class="card"><div class="label">What the class said · ${nailed} of ${S.groups.length} nailed it</div>
        <div class="ladderboard">${C.LADDER.map(r => `<div class="${r === t.rating ? "hit" : ""} ${r === b.posted ? "post" : ""}"><div class="h">${r}<small>${by(r).length}</small></div>${r === t.rating ? `<div class="tagp">✓ True</div>` : ""}${r === b.posted ? `<div class="tagp">Posted</div>` : ""}${by(r).map(g => `<div class="nm">${esc(g.name)}</div>`).join("")}</div>`).join("")}</div>
        ${none.length ? `<div class="small" style="margin-top:8px">No rating: ${none.map(g => esc(g.name)).join(", ")}</div>` : ""}
        <div class="actions"><button class="btn dk big" id="toBond">What happened to the bond →</button></div></div></div>`;
  } else if (step === "bond") {
    const { ret, html } = returnLines(y), fT = C.fairYield(y.t0, t.rating), fP = C.fairYield(y.t0, b.posted), d = y.t1 - y.t0;
    const buyers = S.groups.filter(g => (decs[g.gid] || {}).amt).map(g => `${esc(g.name)} (${k(decs[g.gid].amt)})`);
    body = `<div class="ratebanner"><span class="arrow">${d > 0 ? "▲" : d < 0 ? "▼" : "▶"}</span><div><b>Treasury rate ${y.t0.toFixed(1)}% → ${y.t1.toFixed(1)}%.</b> ${d > 0 ? "Rates rose, so bond prices fell." : d < 0 ? "Rates fell, so bond prices rose." : "Rates held steady."} ${esc(y.rateNews)}</div></div>
      <div class="board" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)"><div class="card"><div class="label">${esc(y.issuer.name)} · what the bond earned</div>
        ${ret.isDefault ? `<div class="big2" style="color:var(--red);margin:6px 0">💥 DEFAULT</div>` : ""}
        <table class="brk" style="font-size:19px">${html}<tr class="tot"><td>Return for the year</td><td class="r ${ret.total < 0 ? "neg" : "pos"}">${C.pct(ret.total)}</td></tr></table>
        <div class="small" style="margin-top:8px;font-size:15px">Cash earned ${y.t0.toFixed(1)}%. ${ret.total > y.t0 ? "The bond beat cash." : "Cash beat the bond."}</div>
        <div class="small" style="margin-top:8px;font-size:15px">Bought by: ${buyers.length ? buyers.join(", ") : "nobody"}.</div></div>
      <div class="card dark"><div class="label">The price check</div>
        <div style="font-size:19px;line-height:1.5">By the posted ${b.posted}: ${y.t0.toFixed(1)}% + ${C.SPREADS[b.posted].toFixed(1)}% = ${fP.toFixed(1)}% → looked like <b>${C.verdict(b.yld, fP)}</b>.<br>
          By the true ${t.rating}: ${y.t0.toFixed(1)}% + ${C.SPREADS[t.rating].toFixed(1)}% = ${fT.toFixed(1)}% → really <b>${C.verdict(b.yld, fT)}</b>.</div>
        <p style="font-size:17px;line-height:1.45;margin:12px 0 0">${esc(y.lesson)}</p></div></div>
      <div class="actions" style="align-items:center"><span class="small">iPads show results when you open Standings.</span><button class="btn dk big" id="toStand">Standings →</button></div>`;
  } else {
    const rows = standings(S, S.r), bench = C.runFund([], S.r);
    const best = Math.max(...rows.map(x => x.y.gain)), winners = rows.filter(x => x.y.gain === best);
    const analysts = S.groups.filter(g => ratingOf(S, S.r, g.gid) === t.rating);
    body = `<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        ${winners.length ? `<div class="winbar" style="margin:0"><span class="t">🏆</span><div><div class="label" style="color:#FFE1E5">Desk of the Year</div><div class="who">${winners.map(w => esc(w.g.name)).join(" &amp; ")}</div><div style="font-size:18px">Made ${C.signed(best)} this year.</div></div></div>` : "<div></div>"}
        <div class="winbar" style="margin:0;background:var(--brown)"><span class="t">🔎</span><div><div class="label" style="color:#CFCFCF">Analysts who nailed ${t.rating}</div><div class="who" style="font-size:${analysts.length > 3 ? 22 : 30}px">${analysts.length ? analysts.map(g => esc(g.name)).join(", ") : "Nobody this year"}</div></div></div></div>
      <div class="card"><table class="standings"><tr><th>Place</th><th>Group</th><th>Their rating</th><th>Bought</th><th class="r">This year</th><th class="r">Fund value</th><th class="r">Ratings nailed</th></tr>
        ${rows.map(x => { const dd = decs[x.g.gid] || {}; return `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td><td>${dd.rating ? `${dd.rating} ${dd.rating === t.rating ? "✓" : ""}` : "–"}</td><td class="picks">${dd.amt ? k(dd.amt) : "Pass"}${x.y.fine ? ` <span class="pill r">Fine −$25K</span>` : ""}</td><td class="r ${x.y.gain < 0 ? "neg" : "pos"}">${C.signed(x.y.gain)}</td><td class="r val">${C.money(x.f.value)}</td><td class="r val">${x.nailed} / ${S.r + 1}</td></tr>`; }).join("")}
        <tr class="bench"><td></td><td>Play-It-Safe Fund</td><td></td><td class="picks">all cash</td><td class="r">${C.signed(bench.years[S.r].gain)}</td><td class="r val">${C.money(bench.value)}</td><td></td></tr></table></div>
      <div class="actions"><button class="btn ghost" id="reopen">Reopen the market</button><button class="btn big" id="nextBtn">${last ? "Final results →" : `Open Year ${y.year + 1} →`}</button></div>`;
  }
  $("#view").innerHTML = topbar(tabs) + body + `<div class="small" id="netErr">${esc(netErr)}</div>`;
  $$(".tabs2 button").forEach(x => x.onclick = () => op("step", { step: x.dataset.t }));
  if ($("#toBond")) $("#toBond").onclick = () => op("step", { step: "bond" });
  if ($("#toStand")) $("#toStand").onclick = () => op("step", { step: "stand" });
  if ($("#reopen")) $("#reopen").onclick = () => { if (confirm("Reopen the market so groups can change how much they buy?")) op("reopen"); };
  if ($("#nextBtn")) $("#nextBtn").onclick = () => op("next");
}

/* ---------- final ---------- */
const kk = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.round(Math.abs(v) / 1000) + "K";
function renderFinal() {
  const lastR = N - 1, rows = standings(S, lastR), bench = C.runFund([], lastR), top = rows.slice(0, 3), best = C.bestFund();
  const maxN = Math.max(0, ...rows.map(x => x.nailed)), topAnalysts = rows.filter(x => x.nailed === maxN && maxN > 0);
  const pod = i => top[i] ? `<div class="pod ${i === 0 ? "first" : ""}"><div class="p">${["1st", "2nd", "3rd"][i]}</div><div class="n">${esc(top[i].g.name)}</div><div class="v">${C.money(top[i].f.value)}</div></div>` : "<div></div>";
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">${N} years on the Credit Desk</div><h2>Final results</h2></div></div>
    <div class="podium">${pod(1)}${pod(0)}${pod(2)}</div>
    ${topAnalysts.length ? `<div class="winbar" style="background:var(--brown)"><span class="t">🔎</span><div><div class="label" style="color:#CFCFCF">Top analysts: ${maxN} of ${N} ratings exactly right</div><div class="who">${topAnalysts.map(x => esc(x.g.name)).join(", ")}</div></div></div>` : ""}
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start">
      <div class="card"><table class="standings"><tr><th>Place</th><th>Group</th>${C.YEARS.map(y => `<th class="r" style="padding:7px 4px">Y${y.year}</th>`).join("")}<th class="r">Ratings</th><th class="r">Final value</th></tr>
        ${rows.map(x => `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td>${x.f.years.map(yy => `<td class="r ${yy.gain < 0 ? "neg" : ""}" style="font-size:15px;padding:6px 4px">${kk(yy.gain)}</td>`).join("")}<td class="r">${x.nailed}/${N}</td><td class="r val">${C.money(x.f.value)}</td></tr>`).join("")}
        <tr class="bench"><td></td><td>Play-It-Safe Fund</td>${bench.years.map(yy => `<td class="r" style="font-size:15px;padding:6px 4px">${kk(yy.gain)}</td>`).join("")}<td></td><td class="r val">${C.money(bench.value)}</td></tr></table>
        <div class="small" style="margin-top:8px">${rows.filter(x => x.f.value > bench.value).length} of ${rows.length} groups beat the Play-It-Safe Fund. The best possible choices finish at ${C.money(best.value)}.</div></div>
      <div class="card dark"><div class="label">What the desk teaches</div><ul class="lessons" style="font-size:15px">
        <li>A posted rating can be out of date. Your own scorecard tells you which way it's about to move.</li>
        <li>Scorecard lower than posted: the bond pays too little and a downgrade is coming (Crestline). Higher: a hidden bargain (Northfield, Sunrise).</li>
        <li>A high yield isn't a good deal if it's below the fair yield for the TRUE rating (Volt).</li>
        <li>Even a perfect rating can't beat a rate hike on a 20-year bond (Granite Peak).</li>
        <li>A bond posted as junk gets $200K at most, even when you know it's about to be upgraded.</li></ul></div></div>
    <div class="actions"><button class="btn ghost" id="again">Menu</button></div>`;
  $("#again").onclick = () => renderMenu();
}

$("#menuBtn").onclick = () => renderMenu();
window.__cdh = { get S() { return S; }, get sess() { return sess; } };
boot();
