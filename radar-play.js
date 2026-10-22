// Recession Radar Live: student (iPad) screen
import { call, $, $$, store } from "./radar-client.js";
import { R, esc, sgn, pts, curveSVG, shapePill, standings, CSS, mountSimulator } from "./radar-view.js";

document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);
const SK = "rr_play", N = R.N, T = R.TODAY;
let me = store.get(SK);          // {code, gid, key, name, pin}
let S = null, pollT = null, busy = false, lastKey = "", conn = "";
let draft = { shape: null, call: null, chips: null };

/* ---------- join ---------- */
function renderJoin(msg = "", showPin = false) {
  const code = new URLSearchParams(location.search).get("c") || (me && me.code) || "";
  $("#who").textContent = "";
  $("#view").innerHTML = `<div class="center card">
    <div class="label">Join Recession Radar Live</div><h2 style="font-size:30px;color:var(--brown)">Read the curve. Call the future.</h2>
    <label class="field"><span>Game code</span><input id="jCode" class="code" inputmode="numeric" pattern="[0-9]*" maxlength="5" autocomplete="off" value="${esc(code)}"></label>
    <label class="field"><span>Group name (your first names)</span><input id="jName" maxlength="24" autocomplete="off" autocapitalize="words" placeholder="e.g. Maya, Jake &amp; Ava"></label>
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
  if (!name) return joinErr("Type your group name.");
  $("#jGo").disabled = true;
  try {
    const r = await call("join", { code, name, pin: pin || undefined });
    me = { code, gid: r.gid, key: r.key, name: r.name, pin: r.pin }; store.set(SK, me);
    history.replaceState(null, "", "/radar?c=" + code); S = null; lastKey = ""; await refresh(true); startPoll();
  } catch (e) { joinErr(e.code === "name_taken" ? "That name is already in this game. If it's your group rejoining, tap the rejoin link and enter your PIN." : e.message, e.code === "name_taken"); }
}
function joinErr(m, pin) { const c = $("#jCode").value, n = $("#jName").value, p = $("#jPin") ? $("#jPin").value : ""; renderJoin(m, pin || !!$("#jPin")); $("#jCode").value = c; $("#jName").value = n; if ($("#jPin")) $("#jPin").value = p; }

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
    if (e.code === "no_game" || e.code === "not_in_game") { const code = me.code; me = null; store.del(SK); clearInterval(pollT); history.replaceState(null, "", "/radar?c=" + code); renderJoin(e.code === "no_game" ? "That game has ended." : "Your group was removed or rejoined on another iPad. Join again."); }
    else { conn = "Reconnecting..."; setConn(); }
  } finally { busy = false; }
}
function setConn() { const el = $("#conn"); if (el) el.textContent = conn; }
const keepY = fn => { const y = scrollY; fn(); scrollTo(0, y); };

/* ---------- helpers ---------- */
const RD = () => R.ROUNDS[S.r];
const mine = () => (S.decisions[S.r] || {})[me.gid] || null;
const myTotal = upto => upto < 0 ? 0 : (standings(S, upto).find(x => x.g.gid === me.gid) || { total: 0 }).total;
const yldStrip = y => `<div class="rr-ylds">${R.MATS.map((m, i) => `<div class="${i === 0 || i === 5 ? "end" : ""}"><b>${y[i].toFixed(2)}%</b><small>${m}</small></div>`).join("")}</div>`;
const ruleBox = `<div class="rr-rule" style="margin-top:6px">${R.SHAPE_KEYS.map(k => `<div class="${k}"><b>${R.SHAPES[k].label}</b>${R.SHAPES[k].rule}</div>`).join("")}</div>`;
function curveCard(y, title, clue) {
  return `<div class="grid" style="align-content:start"><div class="card"><div class="label">${esc(title)}</div>${curveSVG([{ y, labels: true }], { ink: "#111", h: 300 })}${yldStrip(y)}</div>
    <div class="rr-clue"><b>Analyst clue</b>${esc(clue)}</div></div>`;
}
const callWord = d => d.call === "yes" ? "Yes, recession" : "No recession";

/* ---------- render ---------- */
function render() {
  $("#who").textContent = me.name;
  const key = S.phase + ":" + S.r + ":" + (S.step || "");
  if (key !== lastKey) {
    if (!lastKey.startsWith(S.phase + ":" + S.r)) { draft = { shape: null, call: null, chips: null }; window.scrollTo(0, 0); }
    lastKey = key;
  }
  if (S.phase === "lobby") renderLobby();
  else if (S.phase === "open" || S.phase === "today") renderPick();
  else if (S.phase === "reveal") renderReveal();
  else renderFinal();
}
function renderLobby() {
  $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">You're in</div><div class="bignm">${esc(me.name)}</div>
    <div class="pinbox"><div class="small" style="color:#CFCFCF">Your PIN. Write it down in case your iPad restarts.</div><div class="v">${me.pin}</div></div>
    <p style="font-size:19px;margin-top:18px">Get your <b>Game Log</b> ready. For every curve, find the spread: <b>10-year minus 3-month</b>. Waiting for Mystery Curve A...</p><div class="status" id="conn">${esc(conn)}</div></div>`;
}

/* ---------- pick (mystery rounds and today's curve) ---------- */
function renderPick() {
  const today = S.phase === "today", d = mine(), y = today ? T.ylds : RD().ylds;
  const title = today ? `Today's curve · ${T.date}` : `Mystery Curve ${RD().tag} · date unknown`;
  const head = `<div class="yrhead"><div><div class="sub">${today ? "The live round · not scored" : `Round ${S.r + 1} of ${N} · Your points: ${myTotal(S.r - 1)}`}</div><h2>${today ? "Today's curve" : "Mystery Curve " + RD().tag}</h2></div><div class="chip"><div class="v">${S.locked.length}/${S.groups.length}</div><div class="k">Groups locked</div></div></div>`;
  if (d) {
    $("#view").innerHTML = head + `<div class="lockedcard"><div class="label">Locked in 🔒</div><h2>${R.SHAPES[d.shape].label} · ${callWord(d)}${today ? "" : ` · ${d.chips} chip${d.chips > 1 ? "s" : ""}`}</h2>
      <div style="font-size:18px;margin-top:6px;color:#E6E6E6">${today ? `Your forecast: will a recession start before ${esc(T.checkBack)}? Write it on your Game Log.` : "Fill in this round on your Game Log while you wait. Answers stay hidden until the reveal."}</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="change" style="color:#fff;border-color:#fff">Change our answer</button></div></div>
      <div style="margin-top:14px">${curveCard(y, title, today ? T.clue : RD().clue)}</div><div class="status" id="conn">${esc(conn)}</div>`;
    $("#change").onclick = async () => { try { draft = { shape: d.shape, call: d.call, chips: d.chips || null }; await call("undecide", { code: me.code, gid: me.gid, key: me.key, r: S.r }); S = null; await refresh(true); } catch (e) { alert(e.message); } };
    return;
  }
  const ready = draft.shape && draft.call && (today || draft.chips);
  $("#view").innerHTML = head + `<div class="sheetbar">▶ <b>Game Log, ${today ? "Today's curve" : "Curve " + RD().tag}:</b> write the 10Y and 3M yields, subtract, and name the shape.</div>
    <div class="cols">${curveCard(y, title, today ? T.clue : RD().clue)}
    <div class="card"><div class="step"><b>1</b>Spread = 10Y − 3M. What shape is it?</div>${ruleBox}
      <div class="rr-pick" style="grid-template-columns:repeat(3,1fr);margin-top:8px">${R.SHAPE_KEYS.map(k => `<button data-k="shape" data-v="${k}" class="${draft.shape === k ? "on" : ""}">${R.SHAPES[k].label}<small>${R.SHAPES[k].short}</small></button>`).join("")}</div>
      <div class="step"><b>2</b>${today ? `Will a recession start before ${esc(T.checkBack)}?` : "Will a recession START within 2 years?"}</div>
      <div class="rr-pick" style="grid-template-columns:1fr 1fr">${[["yes", "Yes", "Recession is coming"], ["no", "No", "The economy keeps growing"]].map(([v, l, s]) => `<button data-k="call" data-v="${v}" class="${draft.call === v ? "on" : ""} ${v === "no" ? "no" : ""}">${l}<small>${s}</small></button>`).join("")}</div>
      ${today ? "" : `<div class="step"><b>3</b>How sure are you? Bet chips</div>
      <div class="rr-pick" style="grid-template-columns:repeat(3,1fr)">${R.CHIPS.map(c => `<button data-k="chips" data-v="${c}" class="${draft.chips === c ? "on" : ""}">${"●".repeat(c)}<small>${["Just a hunch", "Pretty sure", "Lock it in"][c - 1]}: ±${c}</small></button>`).join("")}</div>
      <div class="small" style="margin-top:6px">Right shape: +1. Right call: + your chips. Wrong call: − your chips.</div>`}
      <div class="actions"><button class="btn big" id="lock" ${ready ? "" : "disabled"} style="width:100%">Lock it in</button></div>
      <div class="status" id="conn">${esc(conn)}</div></div></div>`;
  $$(".rr-pick button").forEach(b => b.onclick = () => { const k = b.dataset.k; draft[k] = k === "chips" ? +b.dataset.v : b.dataset.v; keepY(renderPick); });
  $("#lock").onclick = async () => {
    try { $("#lock").disabled = true; await call("decide", { code: me.code, gid: me.gid, key: me.key, r: S.r, ...draft }); S = null; await refresh(true); }
    catch (e) { alert(e.message); if ($("#lock")) $("#lock").disabled = false; }
  };
}

/* ---------- reveal ---------- */
function renderReveal() {
  const rd = RD(), d = mine(), step = S.step || "shape", sp = R.spreadOf(rd.ylds), sh = R.shapeOf(sp), sc = R.scoreRound(d, rd);
  const mineLine = d ? `You said: ${shapePill(d.shape)} · ${callWord(d)} · ${d.chips} chip${d.chips > 1 ? "s" : ""}` : "Your group didn't answer this round (0 points).";
  let body = "";
  if (step === "shape") {
    body = `<div class="card" style="text-align:center"><div class="label">👀 Eyes on the board</div>
      <div style="font-family:Oswald,Arial;font-size:34px;color:var(--brown);margin:8px 0">${rd.ylds[5].toFixed(2)} − ${rd.ylds[0].toFixed(2)} = ${sgn(sp)} → ${shapePill(sh)}</div>
      <div style="font-size:18px">${mineLine}</div>
      <div style="font-size:22px;margin-top:10px;font-family:Oswald,Arial;text-transform:uppercase">${d ? (sc.shapeOK ? "✓ Right shape: +1" : "✗ Not this time: +0") : ""}</div>
      <div class="small" style="margin-top:8px">Next: the date and what really happened.</div></div>`;
  } else {
    const rows = standings(S, S.r), myRow = rows.find(x => x.g.gid === me.gid);
    body = `<div class="rr-verdict ${rd.recession ? "yes" : "no"}"><div class="big" style="font-size:40px">${rd.recession ? "Recession" : "No recession"}${rd.asterisk ? "*" : ""}</div><div style="font-size:18px">Curve ${rd.tag} was <b>${esc(rd.date)}</b>.<br>${esc(rd.headline)}.</div></div>
      <div class="card" style="margin-top:12px"><div style="font-size:18px;line-height:1.45">${esc(rd.story)}</div><div class="lessonbox" style="background:#FBF1F2;border-left:6px solid var(--orange);border-radius:0 10px 10px 0;padding:8px 12px;margin-top:10px;font-size:17px"><b>The lesson:</b> ${esc(rd.lesson)}</div></div>
      <div class="card" style="margin-top:12px"><div class="label">Your round</div><div style="font-size:17px">${mineLine}</div>
        <table class="res" style="margin-top:8px"><tr><td>Shape (${R.SHAPES[sh].label})</td><td class="r">${sc.shapeOK ? "+1" : "0"}</td></tr>
        <tr><td>Call (${rd.recession ? "Yes" : "No"} was right)</td><td class="r ${sc.call < 0 ? "neg" : "pos"}">${d ? pts(sc.call) : "0"}</td></tr>
        <tr class="tot"><td>This round</td><td class="r">${pts(sc.total)}</td></tr></table></div>
      ${step === "stand" && myRow ? `<div class="card dark" style="margin-top:12px"><div class="rank"><div class="p">#${myRow.place}</div><div><div class="label">of ${rows.length} groups</div><div style="font-family:Oswald,Arial;font-size:30px">${myRow.total} points</div><div class="small">${myRow.calls} of ${S.r + 1} calls right</div></div></div></div>` : `<div class="small" style="margin-top:8px;text-align:center">Standings are coming on the board.</div>`}`;
  }
  $("#view").innerHTML = `<div class="yrhead"><div><div class="sub">Round ${S.r + 1} of ${N} · Reveal</div><h2>Mystery Curve ${rd.tag}</h2></div></div>${body}<div class="status" id="conn">${esc(conn)}</div>`;
}

/* ---------- final ---------- */
function renderFinal() {
  const rows = standings(S, N - 1), myRow = rows.find(x => x.g.gid === me.gid), fc = (S.decisions[N] || {})[me.gid];
  $("#view").innerHTML = `<div class="yrhead"><div><div class="sub">Recession Radar · final</div><h2>${myRow ? `#${myRow.place} of ${rows.length} · ${myRow.total} points` : "Game over"}</h2></div></div>
    ${myRow ? `<div class="card"><div class="label">Your scorecard</div><table class="res"><tr><th>Curve</th><th>Date</th><th>Shape</th><th>Call</th><th class="r">Points</th></tr>
      ${R.ROUNDS.map((rd, i) => { const d = (S.decisions[i] || {})[me.gid], p = myRow.per[i]; return `<tr><td>${rd.tag}</td><td>${esc(rd.date)}</td><td>${d ? (p.shapeOK ? "✓" : "✗") : "–"}</td><td>${d ? (p.callOK ? "✓" : "✗") : "–"}</td><td class="r ${p.total < 0 ? "neg" : ""}">${pts(p.total)}</td></tr>`; }).join("")}
      <tr class="tot"><td colspan="4">Total</td><td class="r">${myRow.total}</td></tr></table></div>` : ""}
    <div class="card" style="margin-top:12px"><div class="label">Your forecast for today's curve</div><div style="font-size:19px">${fc ? `${shapePill(fc.shape)} · ${callWord(fc)} before ${esc(T.checkBack)}` : "No forecast locked in."}</div>
      <div style="font-size:16px;margin-top:6px">Today: ${T.ylds[5].toFixed(2)} − ${T.ylds[0].toFixed(2)} = ${sgn(R.spreadOf(T.ylds))} → ${shapePill(R.shapeOf(R.spreadOf(T.ylds)))}</div></div>
    <div class="card" style="margin-top:12px"><div class="label">Try it: today's curve simulator</div><div id="sim"></div></div>
    <div class="status" id="conn">${esc(conn)}</div>`;
  mountSimulator($("#sim"));
}

/* ---------- boot ---------- */
const urlCode = new URLSearchParams(location.search).get("c");
if (me && (!urlCode || urlCode === me.code)) { refresh(); startPoll(); $("#view").innerHTML = `<div class="center card">Reconnecting to your group...</div>`; }
else { if (me && urlCode !== me.code) { me = null; store.del(SK); } renderJoin(); }
window.__rrp = { get S() { return S; } };
