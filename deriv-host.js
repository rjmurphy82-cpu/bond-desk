// Unit 5 Derivatives Live: host (projector) screen for all eight games
import { call, offlineCaller, $, $$, store } from "./deriv-client.js";
import { qrSVG } from "./qr.js";
import { GAMES, ORDER, Q_SECS, fmt, esc, SHAPES, game, round, dec, answerable, deskResult, standings, bench, show, deltaText, roundLabel, secsLeft, briefHTML, resultTable, storyCardHTML, needed } from "./deriv-view.js";

let api = call, offline = false, S = null, sess = null, pollT = null, netErr = "", skew = 0;
const ui = { lastKey: "", menu: false, pick: null };
let tLen = 180, tLeft = 180, tRun = null, qTick = null;
const SKEY = "dv_host";
const TOPICS = [["futures", "Futures"], ["options", "Options"], ["swaps", "Swaps"], ["cds", "Credit Default Swaps"]];
function showErr(m) { netErr = m; const el = $("#netErr"); if (el) el.textContent = m; }

/* ---------- menu ---------- */
async function boot() {
  const want = new URLSearchParams(location.search).get("g");
  ui.pick = GAMES[want] ? want : "futures-story";
  sess = store.get(SKEY);
  if (sess) { try { S = await api("state", { code: sess.code, hostKey: sess.hostKey }); if (!S.host) throw 0; skew = S.now - Date.now(); startPoll(); } catch { store.del(SKEY); sess = null; S = null; } }
  renderMenu();
}
const kindLine = G => G.kind === "story" ? "Story game · one player per iPad · about 20 minutes" : `Trading desk · one iPad per group · ${G.rounds.length} rounds · about 40 minutes`;
function renderMenu(msg = "") {
  ui.menu = true; $("#menuBtn").style.display = "none"; clearInterval(qTick);
  const live = !!(sess && S), P = GAMES[ui.pick];
  $("#gtitle").textContent = "Derivatives Live";
  $("#view").innerHTML = `${live ? `<div class="card dark" style="margin-bottom:16px"><div class="label">Game in progress · ${esc(game(S).title)}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div><div style="font-family:Oswald,Arial;font-size:44px;line-height:1">${offline ? "Offline game" : "Game " + esc(sess.code)}</div><div style="font-size:19px;margin-top:4px">${esc(summary())}</div></div>
        <button class="btn big" id="mResume">Resume</button></div></div>` : ""}
    <div class="label">Pick a game</div>
    <div class="picker">${TOPICS.map(([t, nm]) => `<div class="topic"><h3>${nm}</h3>${["story", "desk"].map(k => { const G = GAMES[t + "-" + k]; return `<button class="gpick ${ui.pick === G.id ? "on" : ""}" data-g="${G.id}"><span class="kind">${k === "story" ? "1 · Story game" : "2 · Trading desk"}</span><b>${esc(G.title)}</b><span>${k === "story" ? `${G.rounds.filter(r => r.t === "q").length} questions. Learn it from a story students know.` : esc(G.pitch)}</span></button>`; }).join("")}</div>`).join("")}</div>
    <div class="hero" style="margin-top:16px">
      <div class="card dark"><div class="label">${esc(P.topicName)} · ${P.kind === "story" ? "Story game" : "Trading desk"}</div>
        <h2 style="font-size:40px;line-height:1.05;margin:4px 0 8px">${esc(P.title)}</h2>
        <div style="font-size:18px;line-height:1.5">${P.kind === "story" ? "Students join on their own iPads. You tell the story on the board one chapter at a time; they answer each question on their iPad. Faster right answers earn more points (500 to 1,000). Run it before the trading desk." : esc(P.pitch) + " " + esc(P.rule)}</div>
        <div class="small" style="margin-top:8px;font-size:15px">${kindLine(P)}</div>
        <div class="actions" style="justify-content:flex-start"><button class="btn big" id="newGame">${live ? "End it &amp; start this game" : "Start this game"}</button></div>
        ${msg ? `<div class="err">${esc(msg)}</div>` : ""}</div>
      <div class="card"><div class="label">No Wi-Fi or iPads today?</div>
        <div style="font-size:17px;line-height:1.5">Run the game on this screen only. Add players or groups by hand, then tap each one to enter its answer.</div>
        <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="offGame">${live ? "End it &amp; play without iPads" : "Play without iPads"}</button></div></div></div>`;
  $$(".gpick").forEach(b => b.onclick = () => { ui.pick = b.dataset.g; history.replaceState(null, "", "?g=" + ui.pick); renderMenu(); });
  if ($("#mResume")) $("#mResume").onclick = () => { ui.menu = false; ui.lastKey = ""; render(); };
  $("#newGame").onclick = async () => {
    if (live && !confirm("End this game and start a new one? Everyone's results will be erased.")) return;
    $("#newGame").disabled = true; await endCurrent();
    try { const r = await api("create", { game: ui.pick }); sess = { code: r.code, hostKey: r.hostKey }; store.set(SKEY, sess); ui.menu = false; await refresh(true); startPoll(); }
    catch (e) { renderMenu(e.code === "db_not_configured" ? "The game database isn't connected yet (see the README). You can still play without iPads." : e.message + " You can still play without iPads."); }
  };
  $("#offGame").onclick = async () => {
    if (live && !confirm("End this game and play without iPads? Everyone's results will be erased.")) return;
    await endCurrent(); offline = true; api = offlineCaller(); $("#offlineTag").style.display = "inline-block";
    const r = await api("create", { game: ui.pick }); sess = { code: r.code, hostKey: r.hostKey }; ui.menu = false; await refresh(true);
  };
}
function summary() {
  const G = game(S);
  const where = S.phase === "lobby" ? "Waiting in the lobby" : S.phase === "final" ? "Finished: final results" : roundLabel(G, S.r);
  return `${where} · ${S.groups.length} joined`;
}
async function endCurrent() {
  if (sess) { try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: "end" }); } catch (e) {} }
  store.del(SKEY); clearInterval(pollT); clearInterval(tRun); clearInterval(qTick); tRun = null; S = null; sess = null; ui.lastKey = "";
  if (offline) { offline = false; api = call; $("#offlineTag").style.display = "none"; }
}
function startPoll() { clearInterval(pollT); if (offline) return; pollT = setInterval(() => refresh(false), 1500); }
async function refresh(force) {
  try {
    const r = await api("state", { code: sess.code, hostKey: sess.hostKey, since: force || !S ? undefined : S.v });
    if (netErr) showErr(""); if (r.same) return; S = r; skew = S.now - Date.now(); render();
  } catch (e) {
    if (e.code === "no_game") { store.del(SKEY); clearInterval(pollT); S = null; return renderMenu("That game has expired. Start a new one."); }
    showErr("Connection hiccup. Retrying...");
  }
}
let opBusy = false;
async function op(name, extra = {}) { if (opBusy) return; opBusy = true; try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: name, ...extra }); await refresh(true); } catch (e) { alert(e.message); } finally { opBusy = false; } }

/* ---------- router ---------- */
function render() {
  if (ui.menu) return;
  const G = game(S);
  $("#gtitle").textContent = G.title;
  $("#menuBtn").style.display = sess ? "inline-block" : "none";
  const key = S.phase + ":" + S.r;
  if (key !== ui.lastKey) { ui.lastKey = key; clearInterval(qTick); if (S.phase === "open" && G.kind === "desk") { tLen = 180; resetClock(); } }
  if (S.phase === "lobby") renderLobby(G);
  else if (S.phase === "final") renderFinal(G);
  else if (G.kind === "story") renderStory(G);
  else renderDesk(G);
}
const joinUrl = () => location.origin + "/deriv?c=" + sess.code;
const codeChip = () => offline ? "" : `<span class="codechip">Join <b>${sess.code}</b></span>`;
const navBack = () => S.r > 0 ? `<button class="btn ghost sm" id="prevBtn">← Back</button>` : "";
function wireBack() { if ($("#prevBtn")) $("#prevBtn").onclick = () => op("prev"); }

/* ---------- lobby ---------- */
function renderLobby(G) {
  const who = G.kind === "story" ? "players" : "groups";
  $("#view").innerHTML = `<div class="hero">
    ${offline ? `<div class="card dark"><div class="label">Offline mode</div><div style="font-size:20px;line-height:1.5">Add each ${G.kind === "story" ? "team" : "group"} by hand on the right. Each round, tap a tile to enter its answer.</div></div>`
    : `<div class="card dark"><div class="label">Join ${esc(G.title)}</div>
      <div class="joinbox"><div class="qr">${qrSVG(joinUrl())}</div>
        <div><div class="url">Scan the code, or go to<br><b>${esc(location.host)}/deriv</b></div><div class="small" style="font-size:16px">Game code</div><div class="code">${sess.code}</div></div></div>
      <div class="small" style="margin-top:12px;font-size:15px">${G.kind === "story" ? "One iPad each. Join with your first name and last initial." : "One iPad per group. Join with your group's first names, like \"Maya, Jake &amp; Ava.\""} Write down your 3-digit PIN in case an iPad restarts.</div></div>`}
    <div class="card"><div class="label">Joined: ${S.groups.length} ${who}</div>
      <div class="tiles">${S.groups.map(g => `<div class="tile"><div style="min-width:0"><div class="nm">${esc(g.name)}</div><div class="st">PIN ${g.pin}${g.manual ? " · by hand" : ""}</div></div><button class="x" data-g="${g.gid}" title="Remove">✕</button></div>`).join("") || `<div class="small">Waiting for ${who} to join...</div>`}</div>
      <div style="display:flex;gap:8px;margin-top:12px"><input id="addName" maxlength="24" placeholder="Add by hand" style="flex:1;font-size:17px;padding:8px 10px;border:1px solid var(--rule);border-radius:8px"><button class="btn dk sm" id="addBtn">Add</button></div>
      ${G.kind === "desk" ? `<div class="rulebox" style="margin-top:12px"><b>How it works.</b> ${esc(G.rule)}</div>` : ""}
      <div class="actions"><button class="btn big" id="startBtn" ${S.groups.length ? "" : "disabled"}>${G.kind === "story" ? "Start the story" : "Open Round 1"}</button></div>
      <div class="small" id="netErr">${esc(netErr)}</div></div></div>`;
  $$(".x").forEach(b => b.onclick = () => { if (confirm("Remove " + (G.kind === "story" ? "this player" : "this group") + "?")) op("remove", { gid: b.dataset.g }); });
  const add = () => { const n = $("#addName").value.trim(); if (n) op("add", { name: n }); };
  $("#addBtn").onclick = add; $("#addName").onkeydown = e => { if (e.key === "Enter") add(); };
  $("#startBtn").onclick = () => op("start");
}

/* ---------- story game ---------- */
function storyTop(G, extra = "") {
  return `<div class="topbar"><div class="yr"><div class="sub">${esc(G.topicName)} · ${esc(G.title)}</div><h2>${roundLabel(G, S.r)}</h2></div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${codeChip()}${extra}</div></div>`;
}
function leaderboard(rows, n = 10) {
  return `<div class="lb">${rows.slice(0, n).map(x => `<div class="lbrow ${x.place === 1 ? "first" : ""}"><span class="p">${x.place}</span><span class="n">${esc(x.g.name)}</span><span class="v">${fmt.num(x.value)}</span></div>`).join("") || `<div class="small">No players yet.</div>`}</div>`;
}
function renderStory(G) {
  const R = round(S);
  if (R.t === "card") {
    $("#view").innerHTML = storyTop(G) + storyCardHTML(R) + `<div class="actions" style="justify-content:space-between">${navBack() || "<span></span>"}<button class="btn big" id="nextBtn">Next →</button></div><div class="small" id="netErr">${esc(netErr)}</div>`;
    $("#nextBtn").onclick = () => op("next"); wireBack(); return;
  }
  if (R.t === "board") {
    const rows = standings(S, S.r);
    $("#view").innerHTML = storyTop(G) + `<h2 style="text-align:center;font-size:48px;color:var(--brown);margin:6px 0 14px">Leaderboard</h2>${leaderboard(rows)}
      <div class="actions" style="justify-content:space-between">${navBack() || "<span></span>"}<button class="btn big" id="nextBtn">Next →</button></div><div class="small" id="netErr">${esc(netErr)}</div>`;
    $("#nextBtn").onclick = () => op("next"); wireBack(); return;
  }
  const d = S.decisions[S.r] || {}, n = S.answered.length, all = S.groups.length > 0 && n >= S.groups.length;
  if (S.phase === "open") {
    const left = secsLeft(S, skew);
    $("#view").innerHTML = storyTop(G, `<div class="ring" id="ring" style="--p:${left / Q_SECS}"><b id="ringV">${left}</b></div>`) +
      `<p class="qtext">${esc(R.q)}</p><div class="ans" style="margin-top:16px">${R.a.map((a, i) => `<div class="an" style="background:var(--c${i})"><span class="sh">${SHAPES[i]}</span><span>${esc(a)}</span></div>`).join("")}</div>
      <div class="actions" style="justify-content:space-between;align-items:center"><span style="font-family:Oswald,Arial;font-size:26px;color:var(--brown)">${n} of ${S.groups.length} answered</span>
        <div style="display:flex;gap:8px">${offline ? `<button class="btn ghost" id="enterBtn">Enter answers</button>` : ""}<button class="btn big" id="revBtn">Reveal now</button></div></div><div class="small" id="netErr">${esc(netErr)}</div>`;
    $("#revBtn").onclick = () => op("reveal");
    if ($("#enterBtn")) $("#enterBtn").onclick = () => openStoryEnter(G);
    clearInterval(qTick);
    if (all && !offline) { op("reveal"); return; }
    qTick = setInterval(() => {
      const l = secsLeft(S, skew), el = $("#ringV"); if (!el) return clearInterval(qTick);
      el.textContent = l; $("#ring").style.setProperty("--p", l / Q_SECS);
      if (l <= 0) { clearInterval(qTick); if (!offline) op("reveal"); }
    }, 250);
    return;
  }
  // reveal
  const counts = R.a.map((_, i) => Object.values(d).filter(x => x.a === i).length);
  const rows = standings(S, S.r), gotIt = Object.values(d).filter(x => x.a === R.c).length;
  $("#view").innerHTML = storyTop(G) + `<p class="qtext">${esc(R.q)}</p>
    <div class="ans" style="margin-top:16px">${R.a.map((a, i) => `<div class="an ${i === R.c ? "win" : "dim"}" style="background:var(--c${i})"><span class="sh">${SHAPES[i]}</span><span>${esc(a)}</span><span class="ct">${counts[i]}${i === R.c ? " ✓" : ""}</span></div>`).join("")}</div>
    <div class="why" style="margin-top:14px"><b>${gotIt} of ${S.groups.length} got it.</b>${esc(R.why)}</div>
    <div class="grid" style="grid-template-columns:minmax(0,1fr) auto;align-items:end;margin-top:12px"><div class="small">Top 3 so far: ${rows.slice(0, 3).map(x => `<b>${esc(x.g.name)}</b> ${fmt.num(x.value)}`).join(" · ") || "nobody yet"}</div>
      <div class="actions" style="margin:0">${navBack()}<button class="btn big" id="nextBtn">Next →</button></div></div><div class="small" id="netErr">${esc(netErr)}</div>`;
  $("#nextBtn").onclick = () => op("next"); wireBack();
}
function openStoryEnter(G) {
  const R = round(S), d = S.decisions[S.r] || {};
  $("#enterBox").innerHTML = `<div class="label">Enter answers</div><h2 style="font-size:24px;color:var(--brown);text-transform:none">${esc(R.q)}</h2>
    <div class="small" style="margin:6px 0 10px">Tap each player's answer. Answers entered by hand earn 750 points if right.</div>
    ${S.groups.map(g => `<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap"><div style="flex:1;min-width:120px;font-family:Oswald,Arial;font-size:20px;text-transform:uppercase">${esc(g.name)}</div>${R.a.map((a, i) => `<button class="btn sm ${d[g.gid] && d[g.gid].a === i ? "" : "ghost"}" style="${d[g.gid] && d[g.gid].a === i ? `background:var(--c${i})` : ""}" data-g="${g.gid}" data-a="${i}">${SHAPES[i]}</button>`).join("")}</div>`).join("")}
    <div class="actions"><button class="btn" id="eDone">Done</button></div>`;
  $$("#enterBox [data-a]").forEach(b => b.onclick = async () => { await op("enter", { gid: b.dataset.g, a: +b.dataset.a }); openStoryEnter(G); });
  $("#eDone").onclick = closeEnter; $("#enterModal").classList.add("on");
}

/* ---------- trading desk ---------- */
const clock = () => `<div class="clock"><button class="btn ghost sm" id="tMinus">−1</button><span class="timer" id="timer"></span><button class="btn ghost sm" id="tPlus">+1</button><button class="btn sm" id="tGo">Start</button></div>`;
function wireClock() {
  $("#tMinus").onclick = () => { tLeft = Math.max(0, tLeft - 60); if (!tRun) tLen = Math.max(60, tLen - 60); tick(); };
  $("#tPlus").onclick = () => { tLeft += 60; if (!tRun) tLen = Math.min(1200, tLen + 60); tick(); };
  $("#tGo").onclick = () => { clearInterval(tRun); tRun = setInterval(() => { if (tLeft > 0) { tLeft--; tick(); } else { clearInterval(tRun); tRun = null; } }, 1000); };
  tick();
}
function resetClock() { clearInterval(tRun); tRun = null; tLeft = tLen; tick(); }
function tick() { const el = $("#timer"); if (!el) return; el.textContent = Math.floor(tLeft / 60) + ":" + String(tLeft % 60).padStart(2, "0"); el.classList.toggle("low", tLeft <= 30); }
function deskTop(G, R, extra = "") {
  return `<div class="topbar"><div class="yr"><div class="sub">${esc(G.title)} · Round ${S.r + 1} of ${G.rounds.length}</div><h2>${esc(R.title)}</h2></div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${extra}</div></div>`;
}
function renderDesk(G) {
  const R = round(S);
  if (S.phase === "open") {
    const done = new Set(S.answered), all = S.groups.length && done.size >= S.groups.length;
    $("#view").innerHTML = deskTop(G, R, codeChip() + clock()) + `<div class="board"><div class="grid" style="align-content:start">${briefHTML(G, R, true)}
        <div class="card"><div class="label">The choices</div><div class="optlist">${G.fields(R).map(f => `<div><b>${esc(f.label)}:</b> ${f.opts.map(o => esc(o[1])).join(" · ")}</div>`).join("")}</div>
          <div class="small" style="margin-top:8px">${esc(G.rule)}</div></div></div>
      <div class="grid" style="align-content:start"><div class="card"><div class="label">Groups locked in: ${done.size} of ${S.groups.length}</div>
        <div class="tiles">${S.groups.map(g => `<button class="tile ${done.has(g.gid) ? "done" : ""}" data-g="${g.gid}"><span class="nm">${esc(g.name)}</span><span class="st">${done.has(g.gid) ? "🔒 Locked" : offline ? "Tap to enter" : "Deciding..."}</span></button>`).join("")}</div>
        <div class="small" style="margin-top:8px">${offline ? "Tap a group to enter its choices." : "Tap a group to enter or fix its choices."} Choices stay hidden until the reveal. No answer = ${esc(deskResult(G, S.r, null).pick)}.</div></div>
        <div class="actions" style="align-items:center">${navBack()}${done.size && !all ? `<button class="btn ghost sm" id="anyway">Reveal anyway</button>` : ""}
          <button class="btn big" id="revBtn" ${all ? "" : "disabled"}>${all ? "Everyone's in: reveal" : `Waiting on ${S.groups.length - done.size}...`}</button></div>
        <div class="small" id="netErr">${esc(netErr)}</div></div></div>`;
    $$(".tile[data-g]").forEach(b => b.onclick = () => openDeskEnter(G, b.dataset.g));
    $("#revBtn").onclick = () => doReveal(G); if ($("#anyway")) $("#anyway").onclick = () => doReveal(G);
    wireClock(); wireBack(); return;
  }
  const step = S.step || "market", d = S.decisions[S.r] || {}, last = S.r >= G.rounds.length - 1, rv = G.reveal(R);
  const tabs = `<div class="tabs2" style="display:flex;gap:6px">${[["market", "What happened"], ["stand", "Standings"]].map(([v, l]) => `<button class="btn ${step === v ? "dk" : "ghost"} sm" data-t="${v}">${l}</button>`).join("")}</div>`;
  let body;
  if (step === "market") {
    const res = S.groups.map(g => ({ g, x: deskResult(G, S.r, d[g.gid]) }));
    body = `<div class="reveal"><div><div class="label">${esc(rv.label)}</div><div class="big">${esc(rv.big)}</div></div><div class="sub" style="flex:1;min-width:240px">${esc(rv.sub)}<p style="margin:8px 0 0;font-size:19px;line-height:1.45">${esc(R.story)}</p></div></div>
      <div class="board" style="margin-top:14px"><div class="card"><table class="standings"><tr><th>Group</th><th>Choice</th><th>Result</th><th class="r">This round</th></tr>
        ${res.map(({ g, x }) => `<tr><td class="nm">${esc(g.name)}</td><td>${esc(x.pick)}${x.missing ? ' <span class="pill ig">no answer</span>' : ""}${x.wrong ? ' <span class="pill r">wrong side</span>' : ""}</td><td>${esc(x.head)}</td><td class="r val ${x.delta < 0 ? "neg" : x.delta > 0 && G.metric.higher ? "pos" : ""}">${deltaText(G, x.delta)}</td></tr>`).join("")}</table></div>
        <div class="grid" style="align-content:start"><div class="lesson"><b>The lesson</b>${esc(R.lesson)}</div>${bestChoices(G, R)}</div></div>
      <div class="actions" style="align-items:center"><span class="small">iPads show each group's own math now.</span><button class="btn dk big" id="toStand">Standings →</button></div>`;
  } else {
    const rows = standings(S, S.r), b = bench(G, S.r);
    body = `<div class="card"><table class="standings"><tr><th>Place</th><th>Group</th><th>This round</th><th class="r">${esc(G.metric.label)}</th></tr>
      ${rows.map(x => `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td><td>${esc(x.lastPick ? x.lastPick.pick : "")}</td><td class="r val">${show(G, x.value)}</td></tr>`).join("")}
      <tr class="bench"><td></td><td>${esc(G.benchLabel)}</td><td></td><td class="r val">${show(G, b)}</td></tr></table></div>
      <div class="actions"><button class="btn ghost" id="reopen">Reopen this round</button><button class="btn big" id="nextBtn">${last ? "Final results →" : `Open Round ${S.r + 2} →`}</button></div>`;
  }
  $("#view").innerHTML = deskTop(G, R, tabs) + body + `<div class="small" id="netErr">${esc(netErr)}</div>`;
  $$("[data-t]").forEach(x => x.onclick = () => op("step", { step: x.dataset.t }));
  if ($("#toStand")) $("#toStand").onclick = () => op("step", { step: "stand" });
  if ($("#reopen")) $("#reopen").onclick = () => { if (confirm("Reopen this round so groups can change their choices?")) op("reopen"); };
  if ($("#nextBtn")) $("#nextBtn").onclick = () => op("next");
}
// Every possible choice and how it turned out, best first
function bestChoices(G, R) {
  const fields = G.fields(R), combos = [];
  const walk = (i, d) => { if (i >= fields.length) return combos.push({ ...d }); const f = fields[i]; if (f.skip && Object.entries(f.skip).every(([k, v]) => d[k] === v)) return walk(i + 1, d); f.opts.forEach(o => walk(i + 1, { ...d, [f.k]: o[0] })); };
  walk(0, {});
  const out = combos.map(d => G.result(R, d)).sort((a, b) => b.delta - a.delta);
  const seen = new Set(), uniq = out.filter(x => !seen.has(x.pick) && seen.add(x.pick));
  return `<div class="card"><div class="label">Every choice, best to worst</div><table class="brk">${uniq.map(x => `<tr><td>${esc(x.pick)}</td><td class="r">${deltaText(G, x.delta)}</td></tr>`).join("")}</table></div>`;
}
async function doReveal(G) {
  const n = S.answered.length;
  if (n < S.groups.length && !confirm(`${n} of ${S.groups.length} groups are locked. Groups without an answer get "${deskResult(G, S.r, null).pick}" this round. Reveal anyway?`)) return;
  clearInterval(tRun); tRun = null;
  const rv = G.reveal(round(S));
  await op("reveal");
  $("#drumK").textContent = rv.label; $("#drum").classList.add("on");
  ["3", "2", "1", rv.big].forEach((s, i) => setTimeout(() => { const b = $("#drumBig"); b.textContent = s; b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; }, i * 700));
  setTimeout(() => $("#drum").classList.remove("on"), 4 * 700 + 1600);
}
$("#drum").onclick = () => $("#drum").classList.remove("on");

/* ---------- teacher entry for a desk group ---------- */
let ent = null;
function openDeskEnter(G, gid) {
  const g = S.groups.find(x => x.gid === gid); if (!g) return;
  const cur = dec(S, S.r, gid);
  ent = { gid, d: cur ? { ...cur } : {}, had: !!cur };
  drawDeskEnter(G, g); $("#enterModal").classList.add("on");
}
function drawDeskEnter(G, g) {
  const R = round(S), need = needed(G, R, ent.d), ok = need.every(f => f.opts.some(o => o[0] === ent.d[f.k]));
  $("#enterBox").innerHTML = `<div class="label">Enter for</div><h2 style="font-size:30px;color:var(--brown)">${esc(g.name)}</h2>
    ${G.fields(R).map(f => { const off = !need.some(n => n.k === f.k); return `<div class="fieldset" style="margin-top:12px"><div class="fl">${esc(f.label)}</div><div class="chs">${f.opts.map(o => `<button class="ch ${ent.d[f.k] === o[0] && !off ? "on" : ""}" data-k="${f.k}" data-v="${o[0]}" ${off ? "disabled" : ""}><b>${esc(o[1])}</b><span>${esc(o[2] || "")}</span></button>`).join("")}</div></div>`; }).join("")}
    <div class="actions" style="justify-content:space-between"><div style="display:flex;gap:8px"><button class="btn ghost" id="eCancel">Cancel</button>${ent.had ? `<button class="btn ghost" id="eClear">Clear answer</button>` : ""}</div><button class="btn big" id="eSave" ${ok ? "" : "disabled"}>Lock in</button></div>`;
  $$("#enterBox .ch").forEach(b => b.onclick = () => { ent.d[b.dataset.k] = b.dataset.v; drawDeskEnter(G, g); });
  $("#eCancel").onclick = closeEnter;
  if ($("#eClear")) $("#eClear").onclick = async () => { await op("clear", { gid: ent.gid }); closeEnter(); };
  $("#eSave").onclick = async () => { const pick = {}; need.forEach(f => pick[f.k] = ent.d[f.k]); await op("enter", { gid: ent.gid, pick }); closeEnter(); };
}
function closeEnter() { $("#enterModal").classList.remove("on"); ent = null; }

/* ---------- final ---------- */
function renderFinal(G) {
  const lastR = G.rounds.length - 1, rows = standings(S, lastR), top = rows.slice(0, 3);
  const pod = i => top[i] ? `<div class="pod ${i === 0 ? "first" : ""}"><div class="p">${["1st", "2nd", "3rd"][i]}</div><div class="n">${esc(top[i].g.name)}</div><div class="v">${show(G, top[i].value)}</div></div>` : "<div></div>";
  let table = "", side = "";
  if (G.kind === "desk") {
    const per = x => G.rounds.map((_, r) => deskResult(G, r, dec(S, r, x.g.gid)).delta);
    const cell = v => G.id === "futures-desk" ? fmt.num(v) : (G.metric.higher ? (v > 0 ? "+" : v < 0 ? "−" : "") + "$" + Math.abs(Math.round(v)).toLocaleString("en-US") : (v === 0 ? "$0" : "$" + Math.round(-v / 1000).toLocaleString("en-US") + "K"));
    table = `<div class="card"><table class="standings"><tr><th>Place</th><th>Group</th>${G.rounds.map((_, r) => `<th class="r" style="padding:7px 4px">R${r + 1}</th>`).join("")}<th class="r">${esc(G.metric.label)}</th></tr>
      ${rows.map(x => `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td>${per(x).map(v => `<td class="r ${v < 0 && G.metric.higher ? "neg" : ""}" style="font-size:15px;padding:6px 4px">${cell(v)}</td>`).join("")}<td class="r val">${show(G, x.value)}</td></tr>`).join("")}
      <tr class="bench"><td></td><td>${esc(G.benchLabel)}</td>${G.rounds.map((_, r) => `<td class="r" style="font-size:15px;padding:6px 4px">${cell(deskResult(G, r, null).delta)}</td>`).join("")}<td class="r val">${show(G, bench(G, lastR))}</td></tr></table></div>`;
    side = `<div class="card dark"><div class="label">What the desk teaches</div><ul style="font-size:16px;line-height:1.4;padding-left:20px;margin:0">${G.rounds.map(R => `<li style="margin-bottom:6px">${esc(R.lesson)}</li>`).join("")}</ul></div>`;
  } else {
    table = `<div class="card"><table class="standings"><tr><th>Place</th><th>Player</th><th class="r">Right</th><th class="r">Points</th></tr>${rows.map(x => `<tr class="${x.place === 1 ? "top" : ""}"><td class="pl">${x.place}</td><td class="nm">${esc(x.g.name)}</td><td class="r">${x.right} / ${G.rounds.filter(r => r.t === "q").length}</td><td class="r val">${fmt.num(x.value)}</td></tr>`).join("")}</table></div>`;
    const qs = G.rounds.map((R, r) => ({ R, r })).filter(o => o.R.t === "q").map(o => { const d = S.decisions[o.r] || {}, n = S.groups.length || 1; return { ...o, pct: Math.round(100 * Object.values(d).filter(x => x.a === o.R.c).length / n) }; }).sort((a, b) => a.pct - b.pct).slice(0, 3);
    side = `<div class="card dark"><div class="label">Reteach first: the 3 hardest questions</div>${qs.map(o => `<p style="margin:0 0 10px;font-size:16px;line-height:1.4"><b style="font-family:Oswald,Arial">${o.pct}% right.</b> ${esc(o.R.q)}<br><span style="color:#CFCFCF">${esc(o.R.a[o.R.c])}</span></p>`).join("")}
      <div class="small" style="margin-top:10px">Next: <b style="color:#fff">${esc(GAMES[G.topic + "-desk"].title)}</b>, the ${esc(G.topicName.toLowerCase())} trading desk.</div></div>`;
  }
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">${esc(G.topicName)} · ${G.kind === "story" ? "Story game" : "Trading desk"}</div><h2>Final results</h2></div><div>${navBack()}</div></div>
    <div class="podium">${pod(1)}${pod(0)}${pod(2)}</div>
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start">${table}${side}</div>
    <div class="actions"><button class="btn ghost" id="again">Menu</button></div>`;
  $("#again").onclick = () => renderMenu(); wireBack();
}

$("#menuBtn").onclick = () => renderMenu();
window.__dvh = { get S() { return S; }, get sess() { return sess; } };
boot();
