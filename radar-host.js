// Recession Radar Live: host (projector) screen
import { call, offlineCaller, $, $$, store } from "./radar-client.js";
import { qrSVG } from "./qr.js";
import { R, esc, sgn, pts, curveSVG, shapePill, standings, CSS, mountSimulator, defendPoints, roundSeries, chartOpts, callText, bandLabel } from "./radar-view.js";

document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);
let api = call, offline = false, S = null, sess = null, pollT = null, netErr = "";
const ui = { lastKey: "", menu: false, tab: "vote" };
let tLen = 180, tLeft = 180, tRun = null;
const N = R.N, SKEY = "rr_host";
const RD = () => R.ROUNDS[S.r];
function showErr(m) { netErr = m; const el = $("#netErr"); if (el) el.textContent = m; }

/* ---------- menu ---------- */
async function boot() {
  sess = store.get(SKEY);
  if (sess) { try { S = await api("state", { code: sess.code, hostKey: sess.hostKey }); if (!S.host) throw 0; startPoll(); } catch { store.del(SKEY); sess = null; S = null; } }
  renderMenu();
}
function gameSummary() {
  if (!S) return "";
  const where = S.phase === "lobby" ? "Waiting in the lobby" : S.phase === "final" ? "Finished" : S.phase === "today" ? "Today's curve" : `Mystery Curve ${RD().tag} (${S.r + 1} of ${N}) · ${S.phase === "open" ? "groups deciding" : S.phase === "vote" ? "Spot the Analyst vote" : "reveal"}`;
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
    <div class="card ${live ? "" : "dark"}"><div class="label">Read the curve. Call the future.</div>
      <h2 style="font-size:${live ? 30 : 44}px;line-height:1.05;margin:4px 0 10px">Can the bond market see a recession coming?</h2>
      <div style="font-size:18px;line-height:1.5">Ten real Treasury yield curves from mystery dates, with two traps. For each one, groups name the shape, call it (<b>no recession, or a recession in 0 to 6, 7 to 12, or 13 to 24 months</b>), and bet 1 to 3 chips. Three rounds are <b>Spot the Analyst</b>: groups write a one-sentence case and try to pick the real analyst's out of the lineup. The game ends with <b>today's curve</b> and the simulator.</div>
      <div style="font-size:16px;margin-top:8px">Groups track every round on the <b>Recession Radar Game Log</b>.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ${live ? "dk" : "big"}" id="newGame">${live ? "End it &amp; start a new game" : "Start a new game"}</button></div>
      ${msg ? `<div class="err">${esc(msg)}</div>` : ""}</div>
    <div class="card"><div class="label">No Wi-Fi or iPads today?</div>
      <div style="font-size:17px;line-height:1.5">Run the game on this screen only. Add groups by hand, then tap each group to enter its shape, call and chips.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="offGame">${live ? "End it &amp; play without iPads" : "Play without iPads"}</button></div>
      <div class="label" style="margin-top:16px">Just the simulator</div>
      <div style="font-size:17px;line-height:1.5">Jump straight to today's curve and the what-if simulator.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="simOnly">Open the simulator</button></div></div></div>`;
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
    const r = await api("create"); sess = { code: r.code, hostKey: r.hostKey }; ui.menu = false;
    await api("host", { code: r.code, hostKey: r.hostKey, op: "setDefend", on: false }); await refresh(true);
  };
  $("#simOnly").onclick = () => renderSimOnly();
}
function renderSimOnly() {
  ui.menu = true; $("#menuBtn").style.display = "inline-block";
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">${esc(R.TODAY.source)}</div><h2>Today's curve: what if?</h2></div><button class="btn ghost" id="back">Menu</button></div>
    <div class="card" id="sim"></div>${todayAnalysis()}`;
  mountSimulator($("#sim")); $("#back").onclick = () => renderMenu();
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
  if (key !== ui.lastKey) { ui.lastKey = key; if (S.phase === "open" || S.phase === "today" || S.phase === "vote") resetClock(); if (S.phase === "final") ui.tab = "vote"; }
  if (S.phase === "lobby") renderLobby();
  else if (S.phase === "open") renderOpen();
  else if (S.phase === "vote") renderVote();
  else if (S.phase === "reveal") renderReveal();
  else if (S.phase === "today") renderToday();
  else renderFinal();
}
const joinUrl = () => location.origin + "/radar?c=" + sess.code;

/* ---------- lobby ---------- */
function renderLobby() {
  $("#view").innerHTML = `<div class="hero">
    ${offline ? `<div class="card dark"><div class="label">Offline mode</div><div style="font-size:20px;line-height:1.5">Add each group by hand on the right. Each round, tap a group's tile to enter its shape, call and chips.</div></div>`
    : `<div class="card dark"><div class="label">Join Recession Radar Live</div>
      <div class="joinbox"><div class="qr">${qrSVG(joinUrl())}</div>
        <div><div class="url">Scan the code, or go to<br><b>${esc(location.host)}/radar</b></div><div class="small" style="font-size:16px">Game code</div><div class="code">${sess.code}</div></div></div>
      <div class="small" style="margin-top:12px;font-size:15px">One iPad per group. Join with your group's first names, like "Maya, Jake &amp; Ava." Write down your 3-digit PIN in case an iPad restarts. Have your Game Log out.</div></div>`}
    <div class="card"><div class="label">Groups joined: ${S.groups.length}</div>
      <div class="tiles" style="grid-template-columns:repeat(2,1fr)">${S.groups.map(g => `<div class="tile"><div><div class="nm">${esc(g.name)}</div><div class="st">PIN ${g.pin}${g.manual ? " · added by hand" : ""}</div></div><button class="x" data-g="${g.gid}" title="Remove">✕</button></div>`).join("") || `<div class="small">Waiting for groups to join...</div>`}</div>
      <div style="display:flex;gap:8px;margin-top:12px"><input id="addName" maxlength="30" placeholder="Add a group by hand" style="flex:1;font-size:17px;padding:8px 10px;border:1px solid var(--rule);border-radius:8px"><button class="btn dk sm" id="addBtn">Add</button></div>
      ${offline ? `<div class="small" style="margin-top:12px">Spot the Analyst rounds are off without iPads (groups type their sentences on iPads).</div>` : `<label style="display:flex;gap:10px;align-items:center;margin-top:14px;font-size:17px;cursor:pointer"><input type="checkbox" id="defTog" ${S.defend ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--orange)"> <span><b>Spot the Analyst rounds</b> (Curves E, I and J). Adds about 3 minutes each.</span></label>`}
      <div class="actions"><button class="btn big" id="startBtn" ${S.groups.length ? "" : "disabled"}>Open Mystery Curve A</button></div>
      <div class="small" id="netErr">${esc(netErr)}</div></div></div>`;
  $$(".x").forEach(b => b.onclick = () => { if (confirm("Remove this group?")) op("remove", { gid: b.dataset.g }); });
  const add = () => { const n = $("#addName").value.trim(); if (n) op("add", { name: n }); };
  $("#addBtn").onclick = add; $("#addName").onkeydown = e => { if (e.key === "Enter") add(); };
  $("#startBtn").onclick = () => op("start");
  if ($("#defTog")) $("#defTog").onchange = e => op("setDefend", { on: e.target.checked });
}

/* ---------- shared bits ---------- */
const codeChip = () => offline ? "" : `<span class="codechip">Join <b>${sess.code}</b></span>`;
const clock = () => `<div class="clock"><button class="btn ghost sm" id="tMinus">−1</button><span class="timer" id="timer"></span><button class="btn ghost sm" id="tPlus">+1</button><button class="btn sm" id="tGo">Start</button><button class="btn ghost sm" id="tReset">Reset</button></div>`;
function wireClock() {
  $("#tMinus").onclick = () => { tLeft = Math.max(0, tLeft - 60); if (!tRun) tLen = Math.max(60, tLen - 60); tick(); };
  $("#tPlus").onclick = () => { tLeft += 60; if (!tRun) tLen = Math.min(900, tLen + 60); tick(); };
  $("#tGo").onclick = () => { clearInterval(tRun); tRun = setInterval(() => { if (tLeft > 0) { tLeft--; tick(); } else { clearInterval(tRun); tRun = null; } }, 1000); };
  $("#tReset").onclick = resetClock; tick();
}
function resetClock() { clearInterval(tRun); tRun = null; tLeft = tLen; tick(); }
function tick() { const el = $("#timer"); if (!el) return; el.textContent = Math.floor(tLeft / 60) + ":" + String(tLeft % 60).padStart(2, "0"); el.classList.toggle("low", tLeft <= 30); }
const yldStrip = y => `<div class="rr-ylds">${R.MATS.map((m, i) => `<div class="${i === 0 || i === 5 ? "end" : ""}"><b>${y[i].toFixed(2)}%</b><small>${m}</small></div>`).join("")}</div>`;
const ruleCard = (chips = true) => `<div class="card"><div class="label">The rule: spread = 10Y yield − 3M yield</div>
  <div class="rr-rule">${R.SHAPE_KEYS.map(k => `<div class="${k}"><b>${R.SHAPES[k].label}</b>${R.SHAPES[k].rule}</div>`).join("")}</div>
  ${chips ? `<div class="small" style="font-size:15px;margin-top:8px">Scoring: right shape <b>+1</b>. Recession or not (will one START within 2 years?): win your chips if right, lose them if wrong (bet 1 to 3). Exact timing band when a recession comes: <b>+1 bonus</b>.</div>` : ""}</div>`;
function tilesCard(label, doneLbl = "🔒 Locked") {
  const done = new Set(S.locked);
  return `<div class="card"><div class="label">${label}: ${done.size} of ${S.groups.length}</div>
    <div class="tiles">${S.groups.map(g => `<button class="tile ${done.has(g.gid) ? "done" : ""}" data-g="${g.gid}"><span class="nm">${esc(g.name)}</span><span class="st">${done.has(g.gid) ? doneLbl : offline ? "Tap to enter" : "Deciding..."}</span></button>`).join("")}</div>
    <div class="small" style="margin-top:8px">${offline ? "Tap a group to enter its answer." : "Tap a group to enter or fix its answer for it."} Answers stay hidden until the reveal.</div>
    <div class="small" id="netErr">${esc(netErr)}</div></div>`;
}
const recordTable = upto => `<table class="rr-rec"><tr><th>Curve</th><th>Date</th><th class="r">Spread</th><th>Shape</th><th>Recession in 2 yrs?</th><th>When</th></tr>${R.ROUNDS.map((rd, i) => {
  const sp = R.spreadOf(rd.ylds), sh = R.shapeOf(sp), shown = i <= upto;
  return `<tr><td><b>${rd.tag}</b></td><td>${shown ? esc(rd.date) : "?"}</td><td class="r num">${shown ? sgn(sp) : "?"}</td><td>${shown ? shapePill(sh) : "?"}</td><td>${shown ? (rd.recession ? `<b style="color:var(--red)">YES</b>${rd.asterisk ? "*" : ""}` : `<b style="color:var(--green)">NO</b>`) : "?"}</td><td>${shown ? (rd.recession ? rd.months + " mo" : "") + (rd.trap ? " · trap" : "") : ""}</td></tr>`;
}).join("")}</table>`;

/* ---------- a mystery round is open ---------- */
const defendNow = () => S.defend && R.isDefend(S.r);
const level = r => r >= N - 3 ? ["Senior analyst", "You also see the curve from 12 months earlier. Read the direction."] : r >= 3 ? ["Analyst", "Watch the clue: the curve can change fast."] : ["Rookie", "Shape + clue."];
function badges(rd) {
  const [lv, tip] = level(S.r);
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span class="lvl"><b>${lv}</b> ${esc(tip)}</span>${defendNow() ? `<span class="lvl" style="background:#FBE7EA;border-color:var(--orange)"><b>🕵️ Spot the Analyst</b> write a one-sentence case on the iPad</span>` : ""}</div>`;
}
function renderOpen() {
  const rd = RD(), all = S.groups.length && S.locked.length >= S.groups.length, dv = defendNow();
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">Round ${S.r + 1} of ${N} · The date is a mystery</div><h2>Mystery Curve ${rd.tag}</h2></div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${codeChip()}${clock()}</div></div>${badges(rd)}
    <div class="board"><div class="grid" style="align-content:start">
      <div class="card"><div class="label">U.S. Treasury yields · Mystery Curve ${rd.tag}</div>${curveSVG(roundSeries(rd), chartOpts(rd, { h: 330, aria: "Mystery yield curve " + rd.tag }))}${yldStrip(rd.ylds)}
        ${rd.before ? `<div class="small" style="margin-top:6px">Gray dashed line: the same curve 12 months earlier. Spread then: ${sgn(R.spreadOf(rd.before))}.</div>` : ""}</div>
      <div class="rr-clue"><b>Analyst clue</b>${esc(rd.clue)}</div></div>
    <div class="grid" style="align-content:start">${tilesCard("Groups locked in")}
      <div class="actions" style="align-items:center">${S.locked.length && !all ? `<button class="btn ghost sm" id="anyway">${dv ? "Start the vote anyway" : "Reveal anyway"}</button>` : ""}
        <button class="btn big" id="reveal" ${all ? "" : "disabled"}>${all ? (dv ? "Everyone's in: Spot the Analyst →" : "Everyone's in: reveal") : `Waiting on ${S.groups.length - S.locked.length}...`}</button></div>
      ${ruleCard()}</div></div>`;
  $$(".tile[data-g]").forEach(b => b.onclick = () => openEnter(b.dataset.g));
  const go = async () => { if (S.locked.length < S.groups.length && !confirm(`${S.locked.length} of ${S.groups.length} groups are locked. Groups without an answer score 0 this round. Go on anyway?`)) return; clearInterval(tRun); tRun = null; await op(dv ? "vote" : "reveal"); };
  $("#reveal").onclick = go; if ($("#anyway")) $("#anyway").onclick = go;
  wireClock();
}

/* ---------- Spot the Analyst: the vote ---------- */
function caseList(withAuthors) {
  const rd = RD(), m = (S.maps || {})[S.r] || {}, d = S.decisions[S.r] || {};
  return Object.keys(m).map((t, i) => {
    const who = m[t], text = who === "analyst" ? rd.analyst : (d[who] || {}).case || "";
    const votes = S.groups.filter(g => (d[g.gid] || {}).vote === t);
    const name = who === "analyst" ? "🕵️ The real analyst" : esc((S.groups.find(g => g.gid === who) || {}).name || "A group");
    return `<div class="rr-case ${withAuthors && who === "analyst" ? "analyst" : ""}" style="cursor:default"><b style="font-family:Oswald,Arial;color:var(--orange);margin-right:8px">${i + 1}</b>${esc(text)}
      ${withAuthors ? `<span class="who">${name} · ${votes.length} vote${votes.length === 1 ? "" : "s"}${votes.length ? ": " + votes.map(g => esc(g.name)).join(", ") : ""}</span>` : ""}</div>`;
  }).join("");
}
function renderVote() {
  const rd = RD(), voted = new Set(S.voted || []), writers = S.groups.filter(g => ((S.decisions[S.r] || {})[g.gid] || {}).case), all = writers.length && writers.every(g => voted.has(g.gid));
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">Mystery Curve ${rd.tag} · Spot the Analyst</div><h2>Which one is the real analyst?</h2></div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${codeChip()}${clock()}</div></div>
    <div class="board"><div class="card"><div class="label">One of these was written by a real analyst at the time. The rest are yours.</div>${caseList(false)}</div>
      <div class="grid" style="align-content:start"><div class="card"><div class="label">Votes in: ${voted.size} of ${writers.length}</div>
        <div class="tiles">${writers.map(g => `<div class="tile ${voted.has(g.gid) ? "done" : ""}"><span class="nm">${esc(g.name)}</span><span class="st">${voted.has(g.gid) ? "🔒 Voted" : "Voting..."}</span></div>`).join("")}</div>
        <div class="small" style="margin-top:8px">Vote on your iPad. You can't vote for your own sentence.</div><div class="small" id="netErr">${esc(netErr)}</div></div>
        <div class="card dark"><div class="label">Scoring</div><div style="font-size:17px;line-height:1.5">Pick the real analyst: <b>+1</b>. Every group that picks YOUR sentence as the analyst: <b>+1 for you</b>.</div></div>
        <div class="actions" style="align-items:center"><button class="btn ghost sm" id="backOpen">Back to the round</button><button class="btn big" id="reveal" ${voted.size ? "" : "disabled"}>${all ? "Everyone voted: reveal" : "Reveal"}</button></div></div></div>`;
  $("#backOpen").onclick = () => { if (confirm("Go back so groups can change their answers? The vote resets.")) op("backToOpen"); };
  $("#reveal").onclick = async () => { if (!all && !confirm("Not every group has voted. Reveal anyway?")) return; clearInterval(tRun); tRun = null; await op("reveal"); };
  wireClock();
}

/* ---------- teacher entry ---------- */
let ent = null;
function openEnter(gid) {
  const g = S.groups.find(x => x.gid === gid); if (!g) return;
  const cur = (S.decisions[S.r] || {})[gid] || {};
  ent = { gid, shape: cur.shape || null, call: cur.call || null, chips: cur.chips || null, text: cur.case || "", had: !!cur.shape };
  drawEnter(g); $("#enterModal").classList.add("on");
}
function drawEnter(g) {
  const today = S.phase === "today", ok = ent.shape && ent.call && (today || ent.chips);
  const seg = (k, opts) => `<div class="seg" style="grid-template-columns:repeat(${opts.length},1fr)" data-k="${k}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(ent[k]) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
  const lbl = t => `<div style="margin-top:14px;font-family:Oswald,Arial;text-transform:uppercase;color:var(--brown);font-size:18px">${t}</div>`;
  $("#enterBox").innerHTML = `<div class="label">Enter for</div><h2 style="font-size:30px;color:var(--brown)">${esc(g.name)}</h2>
    ${lbl("Shape")}${seg("shape", R.SHAPE_KEYS.map(k => [k, R.SHAPES[k].label]))}
    ${today ? lbl("Recession before " + esc(R.TODAY.checkBack) + "?") + seg("call", [["yes", "Yes"], ["no", "No"]]) : lbl("Their call") + seg("call", R.BANDS.map(b => [b.key, b.short]))}
    ${today ? "" : lbl("Chips bet") + seg("chips", R.CHIPS.map(c => [c, c]))}
    ${defendNow() && !today ? lbl("Their one-sentence case (optional)") + `<textarea class="rr-ta" id="eText" maxlength="180">${esc(ent.text)}</textarea>` : ""}
    <div class="actions" style="justify-content:space-between"><div style="display:flex;gap:8px"><button class="btn ghost" id="eCancel">Cancel</button>${ent.had ? `<button class="btn ghost" id="eClear">Clear answer</button>` : ""}</div><button class="btn big" id="eSave" ${ok ? "" : "disabled"}>Lock in</button></div>`;
  const keepText = () => { if ($("#eText")) ent.text = $("#eText").value; };
  $$("#enterBox .seg button").forEach(b => b.onclick = () => { keepText(); const kk = b.parentElement.dataset.k; ent[kk] = kk === "chips" ? +b.dataset.v : b.dataset.v; drawEnter(g); });
  $("#eCancel").onclick = closeEnter;
  if ($("#eClear")) $("#eClear").onclick = async () => { await op("clear", { gid: ent.gid }); closeEnter(); };
  $("#eSave").onclick = async () => { keepText(); await op("enter", { gid: ent.gid, shape: ent.shape, call: ent.call, chips: ent.chips, text: ent.text }); closeEnter(); };
}
function closeEnter() { $("#enterModal").classList.remove("on"); ent = null; }

/* ---------- reveal ---------- */
function drum(lines) {
  $("#drum").classList.add("on");
  lines.forEach(([k, big, sm], i) => setTimeout(() => { $("#drumK").textContent = k; const b = $("#drumBig"); b.textContent = big; b.className = "big" + (sm ? " sm" : ""); b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; }, i * 900));
  setTimeout(() => $("#drum").classList.remove("on"), lines.length * 900 + 2200);
}
$("#drum").onclick = () => $("#drum").classList.remove("on");
function toOutcome() {
  const rd = RD(), k = "Mystery Curve " + rd.tag + " was...";
  drum([[k, "3"], [k, "2"], [k, "1"], [k, rd.date, true], ["Within two years...", rd.recession ? "RECESSION" : "NO RECESSION", true], ...(rd.recession ? [["It started...", rd.months + " months later", true]] : [])]);
  op("step", { step: "outcome" });
}
const hasAnalyst = () => !!((S.maps || {})[S.r]);
function renderReveal() {
  const rd = RD(), decs = S.decisions[S.r] || {}, step = S.step || "shape", sp = R.spreadOf(rd.ylds), sh = R.shapeOf(sp), last = S.r >= N - 1, an = hasAnalyst();
  const steps = [["shape", "1. The shape"], ...(an ? [["analyst", "2. The analyst"]] : []), ["outcome", (an ? "3" : "2") + ". What happened"], ["stand", (an ? "4" : "3") + ". Standings"]];
  const tabs = `<div class="tabs2">${steps.map(([v, l]) => `<button data-t="${v}" class="${step === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
  const nm = g => esc(g.name), nextStep = an ? "analyst" : "outcome";
  let body = "";
  if (step === "shape") {
    const by = k => S.groups.filter(g => (decs[g.gid] || {}).shape === k);
    const calls = c => S.groups.filter(g => (decs[g.gid] || {}).call === c);
    body = `<div class="board" style="grid-template-columns:minmax(0,1fr) minmax(0,1.15fr)">
      <div class="card"><div class="label">Do the math</div>
        <div class="math">${rd.ylds[5].toFixed(2)} − ${rd.ylds[0].toFixed(2)} = ${sgn(sp)}<br>→ ${shapePill(sh)}</div>
        <div style="font-size:18px;margin-top:8px">${R.SHAPES[sh].rule}. ${R.SHAPES[sh].short}.${rd.before ? ` A year earlier the spread was <b>${sgn(R.spreadOf(rd.before))}</b> (${R.SHAPES[R.shapeOf(R.spreadOf(rd.before))].label.toLowerCase()}).` : ""}</div>
        <div style="margin-top:10px">${curveSVG(roundSeries(rd), chartOpts(rd, { h: 250 }))}</div></div>
      <div class="grid" style="align-content:start"><div class="card"><div class="label">The class read it as · ${by(sh).length} of ${S.groups.length} got the shape (+1)</div>
        <div class="split">${R.SHAPE_KEYS.map(k => `<div class="${k === sh ? "hit" : ""}" style="min-height:90px"><div class="h">${R.SHAPES[k].label}<small>${by(k).length}</small></div>${by(k).map(g => `<div class="nm">${nm(g)}</div>`).join("")}</div>`).join("")}</div></div>
      <div class="card"><div class="label">The class calls</div>
        <div class="split" style="grid-template-columns:repeat(4,1fr)">${R.BANDS.map(b => `<div style="min-height:110px"><div class="h" style="font-size:19px">${b.short}<small>${calls(b.key).length}</small></div>${calls(b.key).map(g => `<div class="nm">${nm(g)} <i>${decs[g.gid].chips}●</i></div>`).join("")}</div>`).join("")}</div>
        <div class="actions"><button class="btn big" id="toNext">${an ? "Who was the analyst? →" : "Reveal the date →"}</button></div></div></div></div>`;
  } else if (step === "analyst") {
    const finders = S.groups.filter(g => defendPoints(S, S.r, g.gid).found);
    const foolers = S.groups.map(g => [g, defendPoints(S, S.r, g.gid).fooled]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
    body = `<div class="board" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)"><div class="card"><div class="label">The lineup, unmasked</div>${caseList(true)}
        <div class="small" style="margin-top:6px">The analyst line is a paraphrase of a common Wall Street forecast at the time, not a quote from one person.</div></div>
      <div class="grid" style="align-content:start"><div class="winbar" style="margin:0"><span class="t">🕵️</span><div><div class="label" style="color:#FFE1E5">Found the analyst (+1)</div><div class="who" style="font-size:${finders.length > 3 ? 22 : 30}px">${finders.length ? finders.map(nm).join(", ") : "Nobody!"}</div></div></div>
        <div class="winbar" style="margin:0;background:var(--brown)"><span class="t">🎭</span><div><div class="label" style="color:#CFCFCF">Best bluffers (+1 per group fooled)</div><div class="who" style="font-size:24px">${foolers.length ? foolers.map(([g, n]) => `${nm(g)} +${n}`).join(", ") : "Nobody fooled anyone"}</div></div></div>
        <div class="card"><div class="label">Ask the class</div><div style="font-size:18px;line-height:1.45">Read the analyst's call again. Whose reasoning do you trust more: the analyst's or the curve's? Find out next.</div></div>
        <div class="actions"><button class="btn big" id="toOut">Reveal the date →</button></div></div></div>`;
  } else if (step === "outcome") {
    const right = S.groups.filter(g => R.scoreRound(decs[g.gid], rd).callOK), timed = S.groups.filter(g => R.scoreRound(decs[g.gid], rd).timingOK);
    body = `<div class="board" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="grid" style="align-content:start">
        <div class="rr-verdict ${rd.recession ? "yes" : "no"}"><div class="big">${rd.recession ? "Recession" : "No recession"}${rd.asterisk ? "*" : ""}</div><div style="font-size:20px">Mystery Curve ${rd.tag} was <b>${esc(rd.date)}</b>.<br>${esc(rd.headline)}.</div></div>
        <div class="card"><p class="storybig" style="margin:0">${esc(rd.story)}</p>
          <div class="timeline"><span class="dot">Curve: ${esc(rd.date)}</span><span class="ln"></span><span class="dot ${rd.recession ? "red" : "grn"}">${rd.recession ? `Recession: ${esc(rd.next)} · ${rd.months} months later · ${bandLabel(R.bandOf(rd))}` : rd.months ? `Next recession: ${esc(rd.next)} · ${rd.months} months later` : esc(rd.next)}</span></div>
          <div class="lessonbox"><b>${rd.trap ? "Why it was a trap:" : "The lesson:"}</b> ${esc(rd.lesson)}</div>
          ${an ? `<div class="lessonbox" style="background:#F4F3F3;border-left-color:var(--brown)"><b>🕵️ The analyst</b> said ${rd.analystCall === "yes" ? "recession" : "no recession"} and was <b>${(rd.analystCall === "yes") === rd.recession ? "right" : "wrong"}</b>. ${(rd.analystCall === "yes") === rd.recession ? "" : "Professionals miss too."}</div>` : ""}</div></div>
      <div class="grid" style="align-content:start"><div class="card"><div class="label">Called it right · ${right.length} of ${S.groups.length}</div><div style="font-family:Oswald,Arial;font-size:24px;text-transform:uppercase;line-height:1.3">${right.length ? right.map(nm).join(", ") : "Nobody this time"}</div>
          ${rd.recession ? `<div class="label" style="margin-top:10px">Nailed the timing (+1) · ${timed.length}</div><div style="font-family:Oswald,Arial;font-size:20px;text-transform:uppercase">${timed.length ? timed.map(nm).join(", ") : "Nobody"}</div>` : ""}</div>
        <div class="card"><div class="label">The Radar record so far</div>${recordTable(S.r)}${S.r >= 7 ? `<div class="small">*Caused by the COVID-19 pandemic.</div>` : ""}</div>
        <div class="actions"><button class="btn dk big" id="toStand">Standings →</button></div></div></div>`;
  } else {
    const rows = standings(S, S.r), best = Math.max(...rows.map(x => x.per[S.r].total)), winners = rows.filter(x => x.per[S.r].total === best && best > 0);
    body = `${winners.length ? `<div class="winbar"><span class="t">📡</span><div><div class="label" style="color:#FFE1E5">Best read of Mystery Curve ${rd.tag} (${pts(best)})</div><div class="who">${winners.map(w => esc(w.g.name)).join(" &amp; ")}</div></div></div>` : ""}
      <div class="card"><table class="standings"><tr><th>Place</th><th>Group</th><th>Shape</th><th>Call</th>${an ? "<th>Analyst</th>" : ""}<th class="r">This round</th><th class="r">Total</th><th class="r">Calls right</th></tr>
        ${rows.map(x => { const d = decs[x.g.gid] || {}, sc = x.per[S.r], dp = sc.defend; return `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td><td>${d.shape ? shapePill(d.shape) + (sc.shapeOK ? " ✓" : "") : "–"}</td><td>${d.call ? `${esc(R.BANDS.find(b => b.key === d.call).short)} × ${d.chips} ${sc.callOK ? "✓" : "✗"}${sc.timingOK ? " ⏱" : ""}` : "–"}</td>${an ? `<td>${dp.pts ? "+" + dp.pts : "0"}${dp.found ? " 🕵️" : ""}${dp.fooled ? " 🎭" + dp.fooled : ""}</td>` : ""}<td class="r ${sc.total < 0 ? "neg" : "pos"}">${pts(sc.total)}</td><td class="r val">${x.total}</td><td class="r">${x.calls} / ${S.r + 1}</td></tr>`; }).join("")}</table>
        <div class="small" style="margin-top:6px">✓ right · ⏱ timing bonus · 🕵️ found the analyst · 🎭 groups fooled</div></div>
      <div class="actions"><button class="btn ghost" id="reopen">Reopen this round</button><button class="btn big" id="nextBtn">${last ? "Today's curve →" : `Open Mystery Curve ${R.ROUNDS[S.r + 1].tag} →`}</button></div>`;
  }
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">Round ${S.r + 1} of ${N} · Reveal</div><h2>Mystery Curve ${rd.tag}${step === "shape" || step === "analyst" ? "" : ": " + esc(rd.date)}</h2></div>${tabs}</div>` + body + `<div class="small" id="netErr">${esc(netErr)}</div>`;
  $$(".tabs2 button").forEach(x => x.onclick = () => x.dataset.t === "outcome" && (step === "shape" || step === "analyst") ? toOutcome() : op("step", { step: x.dataset.t }));
  if ($("#toNext")) $("#toNext").onclick = () => an ? op("step", { step: "analyst" }) : toOutcome();
  if ($("#toOut")) $("#toOut").onclick = toOutcome;
  if ($("#toStand")) $("#toStand").onclick = () => op("step", { step: "stand" });
  if ($("#reopen")) $("#reopen").onclick = () => { if (confirm("Reopen this round so groups can change their answers?" + (an ? " The analyst vote resets." : ""))) op("reopen"); };
  if ($("#nextBtn")) $("#nextBtn").onclick = () => op("next");
}

/* ---------- today's curve ---------- */
const T = R.TODAY;
function renderToday() {
  const all = S.groups.length && S.locked.length >= S.groups.length;
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">The live round · not scored · no one knows the answer yet</div><h2>Today's curve: ${esc(T.date)}</h2></div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${codeChip()}${clock()}</div></div>
    <div class="board"><div class="grid" style="align-content:start">
      <div class="card"><div class="label">${esc(T.source)}</div>${curveSVG([{ y: T.ylds, labels: true }], { ink: "#111", h: 330, aria: "Today's yield curve" })}${yldStrip(T.ylds)}</div>
      <div class="rr-clue"><b>Analyst clue</b>${esc(T.clue)}</div></div>
    <div class="grid" style="align-content:start">${tilesCard("Forecasts locked in")}
      <div class="actions" style="align-items:center"><button class="btn big" id="fin" ${S.locked.length ? "" : "disabled"}>${all ? "Everyone's in: show the class forecast" : `Show the class forecast (${S.locked.length} of ${S.groups.length})`}</button></div>
      ${ruleCard(false)}<div class="card"><div class="label">This one counts for bragging rights</div><div style="font-size:17px;line-height:1.45">Name the shape and make your call: <b>will a recession start before ${esc(T.checkBack)}?</b> Write it on your Game Log. We'll find out together.</div></div></div></div>`;
  $$(".tile[data-g]").forEach(b => b.onclick = () => openEnter(b.dataset.g));
  $("#fin").onclick = async () => { if (S.locked.length < S.groups.length && !confirm("Not every group has locked in. Show the forecast anyway?")) return; clearInterval(tRun); tRun = null; await op("finish"); };
  wireClock();
}
function recLine() { const r = R.record(); return `Our ${N} mystery curves: ${r.inverted[1]} of ${r.inverted[0]} inverted curves came before a recession; flat ${r.flat[1]} of ${r.flat[0]}, normal ${r.normal[1]} of ${r.normal[0]}.`; }
function todayAnalysis() {
  const sp = R.spreadOf(T.ylds);
  return `<div class="grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);margin-top:14px;align-items:start">
    <div class="card"><div class="label">Reading today's curve · ${esc(T.date)}</div><ul class="factlist" style="margin:0;padding-left:20px">${T.facts.map(f => `<li>${esc(f)}</li>`).join("")}</ul></div>
    <div class="card"><div class="label">Spread ${sgn(sp)} → ${R.SHAPES[R.shapeOf(sp)].label}: two ways to read it</div>
      <div class="sides" style="grid-template-columns:1fr">${T.sides.map(([h, t], i) => `<div class="${i ? "c" : "w"}"><b>${esc(h)}</b>${esc(t)}</div>`).join("")}</div>
      <div class="small" style="margin-top:8px">${recLine()} A small sample, so treat it as a clue, not a promise.</div></div></div>`;
}

/* ---------- final ---------- */
function renderFinal() {
  const tabs = `<div class="tabs2">${[["vote", "Class forecast"], ["sim", "What-if simulator"], ["stand", "Final standings"], ["record", "Radar record"]].map(([v, l]) => `<button data-t="${v}" class="${ui.tab === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
  const decs = S.decisions[N] || {}, sp = R.spreadOf(T.ylds), sh = R.shapeOf(sp);
  let body = "";
  if (ui.tab === "vote") {
    const by = k => S.groups.filter(g => (decs[g.gid] || {}).shape === k), calls = c => S.groups.filter(g => (decs[g.gid] || {}).call === c);
    const y = calls("yes").length, n = calls("no").length, tot = y + n || 1;
    body = `<div class="board" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
      <div class="card"><div class="label">Recession before ${esc(T.checkBack)}?</div>
        <div style="display:flex;height:70px;border-radius:10px;overflow:hidden;margin:6px 0 10px;font-family:Oswald,Arial;font-size:28px;color:#fff">
          <div style="width:${y / tot * 100}%;background:var(--red);display:flex;align-items:center;justify-content:center">${y ? "YES " + y : ""}</div>
          <div style="width:${n / tot * 100}%;background:var(--green);display:flex;align-items:center;justify-content:center">${n ? "NO " + n : ""}</div></div>
        <div class="split two">${["yes", "no"].map(c => `<div><div class="h">${c === "yes" ? "Yes" : "No"}<small>${calls(c).length}</small></div>${calls(c).map(g => `<div class="nm">${esc(g.name)}</div>`).join("")}</div>`).join("")}</div>
        <div class="small" style="margin-top:8px">Take a photo of this screen. We check back in ${esc(T.checkBack)}.</div></div>
      <div class="card"><div class="label">The shape: ${T.ylds[5].toFixed(2)} − ${T.ylds[0].toFixed(2)} = ${sgn(sp)} → ${R.SHAPES[sh].label}</div>
        <div class="split">${R.SHAPE_KEYS.map(k => `<div class="${k === sh ? "hit" : ""}"><div class="h">${R.SHAPES[k].label}<small>${by(k).length}</small></div>${by(k).map(g => `<div class="nm">${esc(g.name)}</div>`).join("")}</div>`).join("")}</div>
        ${curveSVG([{ y: T.ylds, labels: true }], { ink: "#111", h: 250 })}</div></div>${todayAnalysis()}`;
  } else if (ui.tab === "sim") {
    body = `<div class="card"><div class="label">What if? Move the levers or tap a scenario. Watch the shape, the spread and bond prices.</div><div id="sim"></div></div>
      <div class="card" style="margin-top:12px"><div class="label">Ask the class</div><ol class="factlist" style="margin:0"><li>Which scenario turns today's curve <b>inverted</b>? Why does recession fear pull LONG rates down?</li><li>The Fed hikes 3 more times. Which bond loses more value, the 2-year or the 10-year? Why?</li><li>"Fed cuts in a hurry" makes the curve steep and normal. Does that mean the economy is healthy? (Hint: look at Mystery Curves C and A.)</li></ol></div>`;
  } else if (ui.tab === "stand") {
    const rows = standings(S, N - 1), top = rows.slice(0, 3);
    const pod = i => top[i] ? `<div class="pod ${i === 0 ? "first" : ""}"><div class="p">${["1st", "2nd", "3rd"][i]}</div><div class="n">${esc(top[i].g.name)}</div><div class="v">${top[i].total} pts</div></div>` : "<div></div>";
    body = `<div class="podium">${pod(1)}${pod(0)}${pod(2)}</div>
      <div class="card"><table class="standings"><tr><th>Place</th><th>Group</th>${R.ROUNDS.map(rd => `<th class="r" style="padding:7px 4px">${rd.tag}</th>`).join("")}<th class="r">Calls</th><th class="r">🕵️ pts</th><th class="r">Total</th></tr>
        ${rows.map(x => `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td>${x.per.map(p => `<td class="r ${p.total < 0 ? "neg" : ""}" style="font-size:16px;padding:6px 4px">${pts(p.total)}</td>`).join("")}<td class="r">${x.calls}/${N}</td><td class="r">${x.analyst}</td><td class="r val">${x.total}</td></tr>`).join("")}</table>
        <div class="small" style="margin-top:6px">Perfect read of all ${N} curves: ${R.MAX_GAME} points, plus whatever you earn spotting and bluffing the analyst.</div></div>`;
  } else {
    body = `<div class="board" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><div class="card"><div class="label">All ${N} mystery curves</div>${recordTable(N - 1)}<div class="small">*Caused by the COVID-19 pandemic.</div></div>
      <div class="card dark"><div class="label">What the Radar teaches</div><ul class="factlist" style="font-size:16px">
        <li>A normal curve slopes up: lenders want more to tie up money longer.</li>
        <li>An inverted curve means investors expect rates to FALL, and rates usually fall because the economy is weakening.</li>
        <li>${recLine()}</li>
        <li>The traps: in 1999 a healthy curve flipped once the Fed kept hiking; in 2007 an "un-inverting" curve meant the Fed was rushing to cut. Read the direction, not just the shape.</li>
        <li>2019 shows a signal can be right for the wrong reason. 2023 shows it can be flat wrong.</li>
        <li>The curve is one clue. Good analysts check jobs, inflation, spending and the Fed too.</li></ul></div></div>`;
  }
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">Recession Radar · ${N} mystery curves + today</div><h2>${ui.tab === "stand" ? "Final standings" : ui.tab === "record" ? "The Radar record" : ui.tab === "sim" ? "Today's curve: what if?" : "Our class forecast"}</h2></div>${tabs}</div>${body}
    <div class="actions"><button class="btn ghost" id="backT">Reopen today's forecast</button><button class="btn ghost" id="again">Menu</button></div>`;
  if ($("#sim")) mountSimulator($("#sim"));
  $$(".tabs2 button").forEach(x => x.onclick = () => { ui.tab = x.dataset.t; renderFinal(); });
  $("#backT").onclick = () => op("backToday");
  $("#again").onclick = () => renderMenu();
}

$("#menuBtn").onclick = () => renderMenu();
window.__rrh = { get S() { return S; }, get sess() { return sess; } };
boot();
