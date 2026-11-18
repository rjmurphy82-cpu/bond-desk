// Hash Wars Live: host (projector) screen
import { call, $, $$, store } from "./mine-client.js";
import { qrSVG } from "./qr.js";
import { D, esc, usd, sgnUsd, btc, cls, rigText, CSS, eventCard, planLine, resultsTable, standTable } from "./mine-view.js";

document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);
const api = call;
let S = null, sess = null, pollT = null, netErr = "";
const ui = { lastKey: "", menu: false, tab: "stand" };
let tLen = 180, tLeft = 180, tRun = null;
const SKEY = "hw_host";
function showErr(m) { netErr = m; const el = $("#netErr"); if (el) el.textContent = m; }

/* ---------- menu ---------- */
async function boot() {
  sess = store.get(SKEY);
  if (sess) { try { S = await api("state", { code: sess.code, hostKey: sess.hostKey }); if (!S.host) throw 0; startPoll(); } catch { store.del(SKEY); sess = null; S = null; } }
  renderMenu();
}
function gameSummary() {
  if (!S) return "";
  const where = S.phase === "lobby" ? "Waiting in the lobby" : S.phase === "final" ? "Finished" : S.phase === "build" ? "Desks building rigs" : S.r === 0 ? "Rig reveal" : `${D.ROUNDS[S.r].tag}: ${D.ROUNDS[S.r].title} · ${S.phase === "open" ? "desks deciding" : "reveal"}`;
  return `${where} · ${S.groups.length} ${S.groups.length === 1 ? "desk" : "desks"}`;
}
function renderMenu(msg = "") {
  ui.menu = true; $("#menuBtn").style.display = "none";
  const live = !!(sess && S);
  $("#view").innerHTML = `<div class="hero">
    ${live ? `<div class="card dark" style="grid-column:1/-1"><div class="label">Game in progress</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div><div style="font-family:Oswald,Arial;font-size:44px;line-height:1">Game ${esc(sess.code)}</div><div style="font-size:19px;margin-top:4px">${esc(gameSummary())}</div></div>
        <button class="btn big" id="mResume">Resume</button></div></div>` : ""}
    <div class="card ${live ? "" : "dark"}"><div class="label">Build a rig. Outlast the market.</div>
      <h2 style="font-size:${live ? 30 : 44}px;line-height:1.05;margin:4px 0 10px">Can your desk make money mining Bitcoin?</h2>
      <div style="font-size:18px;line-height:1.5">Each desk gets <b>$10,000</b> to buy mining machines and pick a power plan. Then five half-years, January 2027 to June 2029: a gold rush, a bull run, <b>the halving</b>, a heat wave and a crypto winter. Each round is three taps: a <b>Prove It</b> question (a different seat each time), run or shut off, and hold or sell their Bitcoin. Any round, a desk can <b>Cash out</b>: sell everything and sit out.</div>
      <div style="font-size:17px;margin-top:8px">Score = net worth + <b>${usd(D.POINT_VALUE)} per analyst point</b>, so understanding beats luck. Ends with an individual <b>exit ticket</b>. About 35 to 40 minutes.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ${live ? "dk" : "big"}" id="newGame">${live ? "End it &amp; start a new game" : "Start a new game"}</button></div>
      ${msg ? `<div class="err">${esc(msg)}</div>` : ""}</div>
    <div class="card"><div class="label">How a round runs (about 5 minutes)</div>
      <ol style="font-size:17px;line-height:1.5;margin:0;padding-left:20px"><li>Open the round. Read the event card out loud.</li><li>Desks answer Prove It, then make their moves and lock in (timer: 3:00).</li><li>Reveal: the answer and why, then results and standings.</li></ol>
      <div class="label" style="margin-top:16px">Practice on their own</div>
      <div style="font-size:17px;line-height:1.5">The Mining Rig simulator (<b>/practice-mining-rig</b>) lets students rerun the numbers any time.</div></div></div>`;
  if ($("#mResume")) $("#mResume").onclick = () => { ui.menu = false; ui.lastKey = ""; render(); };
  $("#newGame").onclick = async () => {
    if (live && !confirm("End this game and start a new one? Everyone's results will be erased.")) return;
    $("#newGame").disabled = true; await endCurrent();
    try { const r = await api("create"); sess = { code: r.code, hostKey: r.hostKey }; store.set(SKEY, sess); ui.menu = false; await refresh(true); startPoll(); }
    catch (e) { renderMenu(e.code === "db_not_configured" ? "The game database isn't connected yet (see the README)." : e.message); }
  };
}
async function endCurrent() {
  if (sess) { try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: "end" }); } catch (e) {} }
  store.del(SKEY); clearInterval(pollT); clearInterval(tRun); tRun = null; S = null; sess = null; ui.lastKey = "";
}
function startPoll() { clearInterval(pollT); pollT = setInterval(() => refresh(false), 1500); }
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
$("#menuBtn").onclick = () => renderMenu();

/* ---------- router ---------- */
function render() {
  if (ui.menu) return;
  $("#menuBtn").style.display = sess ? "inline-block" : "none";
  const key = S.phase + ":" + S.r;
  if (key !== ui.lastKey) { ui.lastKey = key; if (S.phase === "open" || S.phase === "build") resetClock(); }
  if (S.phase === "lobby") renderLobby();
  else if (S.phase === "build") renderBuild();
  else if (S.phase === "open") renderOpen();
  else if (S.phase === "reveal") renderReveal();
  else renderFinal();
}
const joinUrl = () => location.origin + "/mine?c=" + sess.code;

/* ---------- lobby ---------- */
function renderLobby() {
  $("#view").innerHTML = `<div class="hero">
    <div class="card dark"><div class="label">Join Hash Wars Live</div>
      <div class="joinbox"><div class="qr">${qrSVG(joinUrl())}</div>
        <div><div class="url">Scan the code, or go to<br><b>${esc(location.host)}/mine</b></div><div class="small" style="font-size:16px">Game code</div><div class="code">${sess.code}</div></div></div>
      <div class="small" style="margin-top:12px;font-size:15px">One iPad per desk (2 to 4 students). Join with your first names and tap how many people are at your desk. Number yourselves Seat 1, Seat 2... Write down your 3-digit PIN in case an iPad restarts.</div></div>
    <div class="card"><div class="label">Desks joined: ${S.groups.length}</div>
      <div class="tiles" style="grid-template-columns:repeat(2,1fr)">${S.groups.map(g => `<div class="tile"><div><div class="nm">${esc(g.name)}</div><div class="st">PIN ${g.pin} · ${g.seats} seats</div></div><button class="x" data-g="${g.gid}" title="Remove">✕</button></div>`).join("") || `<div class="small">Waiting for desks to join...</div>`}</div>
      <div class="actions"><button class="btn big" id="startBtn" ${S.groups.length ? "" : "disabled"}>Open the build</button></div>
      <div class="small" id="netErr">${esc(netErr)}</div></div></div>`;
  $$(".x").forEach(b => b.onclick = () => { if (confirm("Remove this desk?")) op("remove", { gid: b.dataset.g }); });
  $("#startBtn").onclick = () => op("start");
}

/* ---------- shared bits ---------- */
const codeChip = () => `<span class="codechip">Join <b>${sess.code}</b></span>`;
const clock = () => `<div class="clock"><button class="btn ghost sm" id="tMinus">−1</button><span class="timer" id="timer"></span><button class="btn ghost sm" id="tPlus">+1</button><button class="btn sm" id="tGo">Start</button><button class="btn ghost sm" id="tReset">Reset</button></div>`;
function wireClock() {
  $("#tMinus").onclick = () => { tLeft = Math.max(0, tLeft - 60); if (!tRun) tLen = Math.max(60, tLen - 60); tick(); };
  $("#tPlus").onclick = () => { tLeft += 60; if (!tRun) tLen = Math.min(900, tLen + 60); tick(); };
  $("#tGo").onclick = () => { clearInterval(tRun); tRun = setInterval(() => { if (tLeft > 0) { tLeft--; tick(); } else { clearInterval(tRun); tRun = null; } }, 1000); };
  $("#tReset").onclick = resetClock; tick();
}
function resetClock() { clearInterval(tRun); tRun = null; tLeft = tLen; tick(); }
function tick() { const el = $("#timer"); if (!el) return; el.textContent = Math.floor(tLeft / 60) + ":" + String(tLeft % 60).padStart(2, "0"); el.classList.toggle("low", tLeft <= 30); }
function tilesCard(label) {
  const done = new Set(S.locked);
  return `<div class="card"><div class="label">${label}: ${done.size} of ${S.groups.length}</div>
    <div class="tiles">${S.groups.map(g => `<div class="tile ${done.has(g.gid) ? "done" : ""}"><span class="nm">${esc(g.name)}</span><span class="st">${done.has(g.gid) ? "🔒 Locked" : "Deciding..."}</span></div>`).join("")}</div>
    <div class="small" style="margin-top:8px">Answers stay hidden until the reveal. A desk that doesn't lock in keeps running, holds its Bitcoin and scores no analyst points.</div>
    <div class="small" id="netErr">${esc(netErr)}</div>
    <div class="actions"><button class="btn big" id="revealBtn">${done.size >= S.groups.length && S.groups.length ? "Everyone's in: reveal" : "Reveal anyway"}</button></div></div>`;
}
const head = (sub, title) => `<div class="topbar"><div class="yr"><div class="sub">${sub}</div><h2>${title}</h2></div><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${codeChip()}${clock()}</div></div>`;

/* ---------- build ---------- */
function renderBuild() {
  const shop = `<table><tr><th>Machine</th><th class="r">Speed</th><th class="r">Power</th><th class="r">Efficiency</th><th class="r">Price</th></tr>
    ${D.MODEL_KEYS.map(k => { const M = D.MODELS[k]; return `<tr><td><b>${esc(M.name)}</b><div class="small">${esc(M.tag)}</div></td><td class="r num">${M.th} TH/s</td><td class="r num">${(M.kw * 1000).toLocaleString()} W</td><td class="r num">${M.jth} J/TH</td><td class="r num">${usd(D.MARKET[k][0])}</td></tr>`; }).join("")}</table>`;
  $("#view").innerHTML = `${head("The build · Before January 2027", "Build your rig: $10,000")}
    <div class="board"><div class="grid" style="align-content:start">
      <div class="card"><div class="label">The machines</div>${shop}<div class="small" style="margin-top:8px">J/TH = energy for one trillion guesses. Lower is better. You can sell machines later for 85% of the market price.</div></div>
      <div class="card"><div class="label">Where to plug in</div><div class="hw-plans">${D.PLAN_KEYS.map(k => `<button disabled style="opacity:1">${planLine(k)}</button>`).join("")}</div></div>
      <div class="card"><div class="label">Power cost</div><div style="font-size:24px;font-family:Oswald,Arial">kW × 24 hours × days × price per kWh</div><div class="small" style="font-size:16px">One S21 Pro (3.51 kW) uses 84 kWh a day. That's ${usd(84.24 * 0.16, 2)} a day at home, ${usd(84.24 * 0.05, 2)} on an industrial contract.</div></div>
    </div>${tilesCard("Rigs locked in")}</div>`;
  wireClock(); $("#revealBtn").onclick = () => op("reveal");
}

/* ---------- open round ---------- */
function renderOpen() {
  const R = D.ROUNDS[S.r];
  $("#view").innerHTML = `${head(esc(R.tag + " · " + R.when), esc(R.title))}
    <div class="board"><div class="grid" style="align-content:start">${eventCard(S.r, true)}
      <div class="card"><div class="label">Prove It · check your iPad for which seat answers</div><div class="hw-qbig">${esc(R.q.text)}</div>
        <div class="hw-opts">${R.q.opts.map(o => `<button disabled style="opacity:1">${esc(o)}</button>`).join("")}</div>
        ${R.calc ? `<div style="font-size:20px;margin-top:12px"><b>Math (+1 point and ${usd(D.CALC_BONUS)}):</b> ${esc(R.calc.text)}</div>` : ""}
        ${R.writeup ? `<div style="font-size:20px;margin-top:12px"><b>Write it:</b> ${esc(D.writeupPrompt)}</div>` : ""}</div>
      <div class="card"><div class="label">Then every desk decides</div><div style="font-size:21px;line-height:1.5">⚡ Run or ⏸ shut off · 💎 Hold or 💵 sell your Bitcoin at ${usd(R.price)}</div>
        <div style="font-size:18px;margin-top:6px">Or 🏁 <b>Cash out</b>: sell every machine (${D.MODEL_KEYS.map(k => `${D.MODELS[k].short} ${usd(D.sellPrice(k, S.r))}`).join(", ")}) and all your Bitcoin, then sit out. You still answer Prove It.</div>
        ${R.est ? "" : `<div class="small" style="margin-top:6px;font-size:15px">From Round 3 on, iPads no longer show profit estimates. Desks work it out.</div>`}</div>
    </div>${tilesCard("Desks locked in")}</div>`;
  wireClock(); $("#revealBtn").onclick = () => op("reveal");
}

/* ---------- reveal ---------- */
function stepBar(steps, labels) {
  return `<div class="tabs2">${steps.map((s, i) => `<button data-step="${s}" class="${S.step === s ? "on" : ""}">${i + 1}. ${labels[s]}</button>`).join("")}</div>`;
}
const LABELS = { rigs: "Everyone's rigs", answer: "The answer", writeups: "Halving answers", results: "Results & standings" };
function renderReveal() {
  const r = S.r, steps = r === 0 ? ["rigs"] : r === D.HALVING_ROUND ? ["answer", "writeups", "results"] : ["answer", "results"];
  const i = steps.indexOf(S.step), last = i === steps.length - 1;
  const nextLbl = last ? (r >= D.N ? "Final results" : `Open ${D.ROUNDS[r + 1].tag}`) : "Next: " + LABELS[steps[i + 1]];
  let body = "";
  const prev = r > 0 ? D.replay(S.groups.map(g => g.gid), S.decisions, S.awards, r - 1) : null;
  const now = D.replay(S.groups.map(g => g.gid), S.decisions, S.awards, r);
  if (S.step === "rigs") {
    body = `<div class="card"><table class="hw-res"><tr><th>Desk</th><th>Power plan</th><th>Machines</th><th class="r">Spent</th><th class="r">Cash left</th></tr>
      ${S.groups.map(g => { const row = now[g.gid].rows[0]; return row.skipped ? `<tr><td class="nm">${esc(g.name)}</td><td colspan="4" class="small">No rig: sits out the game</td></tr>` : `<tr><td class="nm">${esc(g.name)}</td><td>${esc(D.PLANS[row.plan].name)}</td><td>${esc(rigText(row.buy))}</td><td class="r num">${usd(row.spent)}</td><td class="r num">${usd(row.endCash)}</td></tr>`; }).join("")}</table>
      <div class="lessonbox">Ask: which desk has the cheapest power? The most efficient machines? Who kept cash in reserve? Nobody knows yet who chose well.</div></div>`;
  } else if (S.step === "answer") {
    const R = D.ROUNDS[r], dec = S.decisions[r] || {};
    const counts = R.q.opts.map((_, j) => S.groups.filter(g => dec[g.gid] && dec[g.gid].q === j));
    const calcRight = R.calc ? S.groups.filter(g => now[g.gid].rows[r] && now[g.gid].rows[r].cRight) : [];
    body = `<div class="card"><div class="label">Prove It</div><div class="hw-qbig">${esc(R.q.text)}</div>
      <div class="hw-opts">${R.q.opts.map((o, j) => `<button disabled class="${j === R.q.ans ? "right" : ""}" style="opacity:1">${j === R.q.ans ? "✓" : ""} ${esc(o)}<span class="hw-cnt">${counts[j].length} desk${counts[j].length === 1 ? "" : "s"}${counts[j].length && counts[j].length <= 4 ? ": " + counts[j].map(g => esc(g.name)).join(", ") : ""}</span></button>`).join("")}</div>
      <div class="lessonbox">${esc(R.q.why)}</div>
      ${R.calc ? `<div class="lessonbox" style="background:var(--greenbg);border-color:var(--green)"><b>Math:</b> ${esc(R.calc.why)}<br><b>Got it (+1 point, +${usd(D.CALC_BONUS)}):</b> ${calcRight.map(g => esc(g.name)).join(", ") || "nobody this time"}</div>` : ""}</div>`;
  } else if (S.step === "writeups") {
    const dec = S.decisions[r] || {};
    body = `<div class="card"><div class="label">${esc(D.writeupPrompt)} Tap the best ones to award +1 point.</div>
      <div class="hw-wu">${S.groups.filter(g => dec[g.gid] && dec[g.gid].text).map(g => `<div class="${S.awards[g.gid] ? "aw" : ""}"><div class="nm">${esc(g.name)}</div><div class="tx">${esc(dec[g.gid].text)}</div><button class="btn sm ${S.awards[g.gid] ? "" : "ghost"}" data-aw="${g.gid}">${S.awards[g.gid] ? "✓ Awarded +1" : "Award +1"}</button></div>`).join("") || `<div class="small">No write-ups this round.</div>`}</div></div>`;
  } else if (S.step === "results") {
    const rows = S.groups.map(g => ({ name: g.name, row: now[g.gid].rows[r], before: prev[g.gid].nw }));
    const ran = rows.filter(x => !x.row.skipped && x.row.run), best = rows.filter(x => !x.row.skipped).sort((a, b) => (b.row.nw - b.before) - (a.row.nw - a.before))[0];
    const outs = rows.filter(x => x.row.cashout).map(x => esc(x.name));
    body = `<div class="card">${resultsTable(rows)}
      <div class="lessonbox">${ran.length} of ${rows.length} desks ran their machines.${outs.length ? ` Cashed out this round: <b>${outs.join(", ")}</b>.` : ""} ${best ? `Biggest gain: <b>${esc(best.name)}</b> (${sgnUsd(best.row.nw - best.before)}).` : ""} Net worth counts your machines at what they'd sell for now, so it moves when machine prices move.</div></div>
      <div class="card" style="margin-top:12px"><div class="label">Standings after ${esc(D.ROUNDS[r].tag)}</div>${standTable(D.standings(S.groups, S.decisions, S.awards, r))}</div>`;
  }
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">${r === 0 ? "The build" : esc(D.ROUNDS[r].tag + " · " + D.ROUNDS[r].when)}</div><h2>${r === 0 ? "Everyone's rigs" : esc(D.ROUNDS[r].icon + " " + D.ROUNDS[r].title)}</h2></div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${stepBar(steps, LABELS)}<button class="btn ghost sm" id="reopen">Reopen round</button><button class="btn big" id="nextBtn">${nextLbl}</button></div></div>
    ${body}<div class="small" id="netErr">${esc(netErr)}</div>`;
  $$("[data-step]").forEach(b => b.onclick = () => op("step", { step: b.dataset.step }));
  $$("[data-aw]").forEach(b => b.onclick = () => op("award", { gid: b.dataset.aw }));
  $("#reopen").onclick = () => { if (confirm("Reopen this round so desks can change their answers?")) op("reopen"); };
  $("#nextBtn").onclick = () => last ? op("next") : op("step", { step: steps[i + 1] });
}

/* ---------- final ---------- */
function renderFinal() {
  const st = D.standings(S.groups, S.decisions, S.awards, D.N);
  const tabs = `<div class="tabs2">${[["stand", "Final standings"], ["debrief", "Debrief"], ["exit", "Exit ticket"]].map(([k, l]) => `<button data-tab="${k}" class="${ui.tab === k ? "on" : ""}">${l}</button>`).join("")}</div>`;
  let body = "";
  if (ui.tab === "stand") {
    const pod = [st[1], st[0], st[2]];
    body = `${st[0] ? `<div class="podium">${pod.map((x, i) => x ? `<div class="pod ${i === 1 ? "first" : ""}"><div class="p">${i === 1 ? 1 : i === 0 ? 2 : 3}</div><div class="n">${esc(x.g.name)}</div><div class="v">${usd(x.score)}</div></div>` : "<div></div>").join("")}</div>` : ""}
      <div class="card">${standTable(st)}</div>
      <div class="card" style="margin-top:12px"><div class="label">Where each desk's money went</div>
      <table class="hw-res"><tr><th>Desk</th><th class="r">Mining revenue</th><th class="r">Power bills</th><th class="r">Machines bought</th><th class="r">Cashed out for</th><th class="r">Machines left (value)</th><th class="r">Bitcoin held</th></tr>
      ${st.map(x => { const rr = x.rows.slice(1).filter(y => !y.skipped); const sum = f => rr.reduce((a, y) => a + (y[f] || 0), 0); const mv = D.MODEL_KEYS.reduce((a, k) => a + (x.desk.rig[k] || 0) * D.sellPrice(k, 6), 0);
        return `<tr><td class="nm">${esc(x.g.name)}</td><td class="r">${usd(sum("minedUSD"))}</td><td class="r neg">${usd(-sum("power"))}</td><td class="r">${usd(-((x.rows[0] || {}).spent || 0))}</td><td class="r">${(() => { const c = rr.find(y => y.cashout); return c ? usd(c.sold + c.btcCash) + `<div class="small">${esc(D.ROUNDS[c.r].tag)}</div>` : "–"; })()}</td><td class="r">${usd(mv)}</td><td class="r">${x.desk.btc.toFixed(4)}</td></tr>`; }).join("")}</table>
      <div class="lessonbox">Ask: Did anyone make money from mining itself, or from cashing out at the right time? Who shut off when the numbers turned red? Was holding Bitcoin a smart bet or a lucky one?</div></div>`;
  } else if (ui.tab === "debrief") {
    body = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(380px,1fr))">${D.ROUNDS.slice(1).map((R, j) => { const dec = S.decisions[j + 1] || {}; const right = S.groups.filter(g => dec[g.gid] && dec[g.gid].q === R.q.ans).length;
      return `<div class="card"><div class="label">${esc(R.tag)} · ${R.icon} ${esc(R.title)} · ${right} of ${S.groups.length} desks right</div><div style="font-size:18px;font-weight:600">${esc(R.q.text)}</div><div class="pos" style="font-size:18px;margin-top:4px">✓ ${esc(R.q.opts[R.q.ans])}</div><div style="font-size:17px;line-height:1.45;margin-top:6px">${esc(R.q.why)}</div></div>`; }).join("")}</div>`;
  } else {
    const ex = (S.exits || []).sort((a, b) => a.name.localeCompare(b.name));
    body = `<div class="card dark"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><div class="label">Exit ticket · each student on their own</div><div style="font-size:20px">${S.exit ? `Open. Students tap <b>Start the exit ticket</b> on the desk iPad, or go to <b>${esc(location.host)}/mine?x=1</b> on their own iPad with code <b>${sess.code}</b>.` : "Closed. Open it when the game's done."}</div></div>
      <button class="btn big" id="exitTog">${S.exit ? "Close the exit ticket" : "Open the exit ticket"}</button></div></div>
      <div class="grid" style="grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);margin-top:12px;align-items:start">
      <div class="card"><div class="label">How the class did: ${ex.length} submitted</div>${D.EXIT.map((q, j) => { const n = ex.filter(e => e.answers[j] === q.ans).length, p = ex.length ? Math.round(100 * n / ex.length) : 0;
        return `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;gap:10px"><b style="font-size:17px">${j + 1}. ${esc(q.q)}</b><span class="num" style="font-size:18px">${p}%</span></div><div class="hw-bar ${p >= 80 ? "ok" : ""}"><div style="width:${p}%"></div></div><div class="small">Answer: ${esc(q.opts[q.ans])}</div></div>`; }).join("")}
        <div class="small">Green bars are 80% or higher. Reteach anything below that.</div></div>
      <div class="card"><div class="label">Students</div><table><tr><th>Name</th><th class="r">Score</th>${D.EXIT.map((_, j) => `<th class="r">Q${j + 1}</th>`).join("")}</tr>
        ${ex.map(e => `<tr><td>${esc(e.name)}</td><td class="r num">${e.right}/${D.EXIT.length}</td>${e.answers.map((a, j) => `<td class="r ${a === D.EXIT[j].ans ? "pos" : "neg"}">${a === D.EXIT[j].ans ? "✓" : "✗"}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="7" class="small">No one yet.</td></tr>`}</table>
        ${ex.length ? `<div class="actions"><button class="btn ghost sm" id="copyCsv">Copy as a spreadsheet</button></div>` : ""}</div></div>`;
  }
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">January 2027 to June 2029</div><h2>Final results</h2></div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${tabs}<button class="btn ghost sm" id="backBtn">Back to Round 5</button></div></div>${body}<div class="small" id="netErr">${esc(netErr)}</div>`;
  $$("[data-tab]").forEach(b => b.onclick = () => { ui.tab = b.dataset.tab; renderFinal(); });
  $("#backBtn").onclick = () => op("back");
  if ($("#exitTog")) $("#exitTog").onclick = () => op("exit", { on: !S.exit });
  if ($("#copyCsv")) $("#copyCsv").onclick = async () => {
    const ex = (S.exits || []).sort((a, b) => a.name.localeCompare(b.name));
    const csv = ["Name\tScore\t" + D.EXIT.map((_, j) => "Q" + (j + 1)).join("\t"), ...ex.map(e => `${e.name}\t${e.right}/${D.EXIT.length}\t` + e.answers.map((a, j) => a === D.EXIT[j].ans ? "right" : "wrong").join("\t"))].join("\n");
    try { await navigator.clipboard.writeText(csv); $("#copyCsv").textContent = "Copied. Paste into a spreadsheet."; } catch { alert("Couldn't copy on this browser."); }
  };
}
boot();
