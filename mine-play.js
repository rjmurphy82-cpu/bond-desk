// Hash Wars Live: student (iPad) screen. One iPad per desk, plus the individual exit ticket.
import { call, $, $$, store } from "./mine-client.js";
import { D, esc, usd, sgnUsd, btc, cls, seatFor, rigText, CSS, eventCard, planLine, standTable } from "./mine-view.js";

document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);
const SK = "hw_play";
let me = store.get(SK);          // {code, gid, key, name, pin}
let S = null, pollT = null, busy = false, lastKey = "", conn = "", draft = null, seatsPick = 3;
const qs = new URLSearchParams(location.search);

/* ---------- join ---------- */
function renderJoin(msg = "", showPin = false) {
  const code = qs.get("c") || (me && me.code) || "";
  $("#who").textContent = "";
  $("#view").innerHTML = `<div class="center card">
    <div class="label">Join Hash Wars Live</div><h2 style="font-size:30px;color:var(--brown)">Build a rig. Outlast the market.</h2>
    <label class="field"><span>Game code</span><input id="jCode" class="code" inputmode="numeric" pattern="[0-9]*" maxlength="5" autocomplete="off" value="${esc(code)}"></label>
    <label class="field"><span>Desk name (your first names)</span><input id="jName" maxlength="24" autocomplete="off" autocapitalize="words" placeholder="e.g. Maya, Jake &amp; Ava"></label>
    <div class="field"><span>How many people at your desk?</span><div class="hw-two" style="grid-template-columns:repeat(3,1fr)" id="seatPick">${[2, 3, 4].map(n => `<button data-n="${n}" class="${n === seatsPick ? "on" : ""}">${n}</button>`).join("")}</div>
      <div class="small" style="margin-top:4px">Number yourselves Seat 1, Seat 2... Each round a different seat answers the Prove It question.</div></div>
    <label class="field" id="pinField" style="display:${showPin ? "block" : "none"}"><span>Your PIN (only if rejoining)</span><input id="jPin" class="code" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off"></label>
    ${showPin ? "" : `<button class="link" id="showPin">Rejoining after your iPad restarted? Tap here.</button>`}
    <div class="actions" style="justify-content:stretch"><button class="btn big" id="jGo" style="width:100%">Join</button></div>
    ${msg ? `<div class="err">${esc(msg)}</div>` : ""}
    <div style="border-top:1px solid var(--rule);margin-top:18px;padding-top:12px"><button class="link" id="goExit">Taking the exit ticket on your own iPad? Tap here.</button></div></div>`;
  $$("#seatPick button").forEach(b => b.onclick = () => { seatsPick = +b.dataset.n; $$("#seatPick button").forEach(x => x.classList.toggle("on", x === b)); });
  if ($("#showPin")) $("#showPin").onclick = () => { const c = $("#jCode").value, n = $("#jName").value; renderJoin("", true); $("#jCode").value = c; $("#jName").value = n; };
  $("#goExit").onclick = () => renderExit($("#jCode").value.trim());
  $("#jGo").onclick = doJoin;
  $$("input").forEach(i => i.onkeydown = e => { if (e.key === "Enter") doJoin(); });
}
async function doJoin() {
  const code = $("#jCode").value.trim(), name = $("#jName").value.trim(), pin = $("#jPin") ? $("#jPin").value.trim() : "";
  if (!/^\d{5}$/.test(code)) return joinErr("The game code is 5 digits. Look at the board.");
  if (!name) return joinErr("Type your desk name.");
  $("#jGo").disabled = true;
  try {
    const r = await call("join", { code, name, pin: pin || undefined, seats: seatsPick });
    me = { code, gid: r.gid, key: r.key, name: r.name, pin: r.pin }; store.set(SK, me);
    history.replaceState(null, "", "/mine?c=" + code); S = null; lastKey = ""; await refresh(true); startPoll();
  } catch (e) { joinErr(e.code === "name_taken" ? "That name is already in this game. If it's your desk rejoining, tap the rejoin link and enter your PIN." : e.message, e.code === "name_taken"); }
}
function joinErr(m, pin) { const c = $("#jCode").value, n = $("#jName").value, p = $("#jPin") ? $("#jPin").value : ""; renderJoin(m, pin || !!$("#jPin")); $("#jCode").value = c; $("#jName").value = n; if ($("#jPin")) $("#jPin").value = p; }

/* ---------- exit ticket (individual) ---------- */
let exitAns = [];
function renderExit(code, msg = "") {
  clearInterval(pollT); exitAns = exitAns.length === D.EXIT.length ? exitAns : D.EXIT.map(() => null);
  $("#who").textContent = "Exit ticket";
  $("#view").innerHTML = `<div class="card" style="max-width:760px;margin:0 auto">
    <div class="label">Exit ticket · on your own</div><h2 style="font-size:30px;color:var(--brown)">Show what you learned</h2>
    <p style="font-size:17px">Answer by yourself. Your teacher sees how the whole class did on each question.</p>
    <label class="field"><span>Game code</span><input id="xCode" class="code" inputmode="numeric" maxlength="5" value="${esc(code || "")}"></label>
    <label class="field"><span>First name and last initial</span><input id="xName" maxlength="30" autocomplete="off" autocapitalize="words" placeholder="e.g. Maya R"></label>
    ${D.EXIT.map((q, i) => `<div class="hw-step"><b>${i + 1}</b>${esc(q.q)}</div><div class="hw-opts">${q.opts.map((o, j) => `<button data-i="${i}" data-j="${j}" class="${exitAns[i] === j ? "on" : ""}">${esc(o)}</button>`).join("")}</div>`).join("")}
    <div class="actions" style="justify-content:stretch"><button class="btn big" id="xGo" style="width:100%">Submit</button></div>
    ${msg ? `<div class="err">${esc(msg)}</div>` : ""}
    ${me ? `<button class="link" id="xBack">Back to our desk</button>` : ""}</div>`;
  $$(".hw-opts button").forEach(b => b.onclick = () => { exitAns[+b.dataset.i] = +b.dataset.j; $$(`.hw-opts button[data-i="${b.dataset.i}"]`).forEach(x => x.classList.toggle("on", x === b)); });
  if ($("#xBack")) $("#xBack").onclick = () => { lastKey = ""; refresh(true); startPoll(); };
  $("#xGo").onclick = async () => {
    const c = $("#xCode").value.trim(), n = $("#xName").value.trim();
    if (!/^\d{5}$/.test(c)) return renderExitKeep(c, n, "Type the 5-digit game code from the board.");
    if (!n) return renderExitKeep(c, n, "Type your first name and last initial.");
    if (exitAns.some(a => a === null)) return renderExitKeep(c, n, "Answer all " + D.EXIT.length + " questions.");
    $("#xGo").disabled = true;
    try { const r = await call("exit", { code: c, name: n, answers: exitAns }); exitDone(c, n, r); }
    catch (e) { renderExitKeep(c, n, e.message); }
  };
}
function renderExitKeep(c, n, m) { renderExit(c, m); $("#xName").value = n; }
function exitDone(code, name, r) {
  $("#view").innerHTML = `<div class="card" style="max-width:760px;margin:0 auto"><div class="label">Submitted</div><h2 style="font-size:34px;color:var(--brown)">${esc(name)}: ${r.right} of ${r.of}</h2>
    ${D.EXIT.map((q, i) => `<div style="margin-top:12px"><div style="font-weight:700;font-size:17px">${i + 1}. ${esc(q.q)}</div>
      <div class="${exitAns[i] === q.ans ? "pos" : "neg"}" style="font-size:16px">${exitAns[i] === q.ans ? "✓ " : "✗ You picked: " + esc(q.opts[exitAns[i]]) + " · Answer: "}${esc(q.opts[q.ans])}</div></div>`).join("")}
    <div class="actions" style="justify-content:stretch"><button class="btn big" id="xNext" style="width:100%">Next student on this iPad</button></div>
    ${me ? `<button class="link" id="xBack">Back to our desk</button>` : ""}</div>`;
  $("#xNext").onclick = () => { exitAns = []; renderExit(code); };
  if ($("#xBack")) $("#xBack").onclick = () => { lastKey = ""; refresh(true); startPoll(); };
}

/* ---------- polling ---------- */
function startPoll() { clearInterval(pollT); pollT = setInterval(() => { if (!document.hidden) refresh(); }, 2500); }
document.addEventListener("visibilitychange", () => { if (!document.hidden && me) refresh(); });
async function refresh(force) {
  if (!me) return;
  if (busy) { if (!force) return; while (busy) await new Promise(r => setTimeout(r, 80)); }
  busy = true;
  try {
    const r = await call("state", { code: me.code, gid: me.gid, key: me.key, since: S && !force ? S.v : undefined });
    conn = ""; if (!r.same) { if (!r.me) throw Object.assign(new Error(), { code: "not_in_game" }); S = r; render(); } else setConn();
  } catch (e) {
    if (e.code === "no_game" || e.code === "not_in_game") { const code = me.code; me = null; store.del(SK); clearInterval(pollT); history.replaceState(null, "", "/mine?c=" + code); renderJoin(e.code === "no_game" ? "That game has ended." : "Your desk was removed or rejoined on another iPad. Join again."); }
    else { conn = "Reconnecting..."; setConn(); }
  } finally { busy = false; }
}
function setConn() { const el = $("#conn"); if (el) el.textContent = conn; }
const keepY = fn => { const y = scrollY; fn(); scrollTo(0, y); };

/* ---------- my desk ---------- */
const mine = () => (S.decisions[S.r] || {})[me.gid] || null;
function myDesk(upto) { return D.replay([me.gid], S.decisions, S.awards, upto)[me.gid]; }
function deskStrip(desk, r) {
  const price = r ? D.ROUNDS[r].price : 74600;
  return `<div class="hw-desk"><div><small>Cash</small><b class="${desk.cash < 0 ? "neg" : ""}">${usd(desk.cash)}</b></div><div><small>Bitcoin held</small><b>${desk.btc.toFixed(4)}</b><small>worth ${usd(desk.btc * price)}</small></div>
    <div><small>Machines</small><b style="font-size:15px">${esc(rigText(desk.rig))}</b></div><div><small>Power plan</small><b style="font-size:15px">${esc((D.PLANS[desk.plan] || {}).name || "None")}</b></div>
    <div><small>Analyst points</small><b>${desk.pts}</b></div></div>`;
}

/* ---------- render ---------- */
function render() {
  $("#who").textContent = me.name;
  const key = S.phase + ":" + S.r + ":" + (S.step || "");
  if (key === lastKey && (S.phase === "build" || S.phase === "open") && !mine() && $("#lock")) return; // don't wipe what they're typing
  if (key !== lastKey) { if (!lastKey.startsWith(S.phase + ":" + S.r)) { draft = null; window.scrollTo(0, 0); } lastKey = key; }
  if (S.phase === "lobby") renderLobby();
  else if (S.phase === "build" || S.phase === "open") mine() ? renderLocked() : renderPick();
  else if (S.phase === "reveal") renderReveal();
  else renderFinal();
}
function renderLobby() {
  $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">You're in</div><div class="bignm">${esc(me.name)}</div>
    <div class="pinbox"><div class="small" style="color:#CFCFCF">Your PIN. Write it down in case your iPad restarts.</div><div class="v">${me.pin}</div></div>
    <p style="font-size:19px;margin-top:18px">Your desk starts with <b>$10,000</b>. First you'll buy machines and pick where to plug them in. Then five half-years of real mining events. Number your seats now: Seat 1, Seat 2${S.me.seats > 2 ? ", Seat 3" : ""}${S.me.seats > 3 ? ", Seat 4" : ""}.</p><div class="status" id="conn">${esc(conn)}</div></div>`;
}

/* ---------- build + rounds ---------- */
function startDraft(desk) {
  if (draft) return;
  draft = S.r === 0 ? { plan: null, buy: { xp: 0, pro: 0, old: 0 } } : { q: null, calc: "", text: "", run: true, sell: false, buy: { xp: 0, pro: 0, old: 0 }, dump: { xp: 0, pro: 0, old: 0 }, plan: desk.plan };
}
function preview(base) { return D.apply(base, draft, S.r, false, true); }
function renderPick(err = "") {
  const r = S.r, base = r === 0 ? D.blankDesk() : myDesk(r - 1).desk;
  startDraft(base);
  if (r > 0 && !base.built) { $("#view").innerHTML = `<div class="center card"><div class="label">Sitting out</div><h2>Your desk didn't build a rig</h2><p>Watch the board and follow along on your Game Log.</p></div>`; return; }
  const pv = preview(base), idx = r;
  const shop = D.MODEL_KEYS.map(k => {
    const M = D.MODELS[k], own = base.rig[k] || 0;
    return `<div class="hw-item"><div><div class="nm">${esc(M.name)} ${own ? `<span class="pill ig">You own ${own}</span>` : ""}</div>
      <div class="sp">${M.th} TH/s · ${(M.kw * 1000).toLocaleString()} W · ${M.jth} J/TH · ${esc(M.tag)}</div>
      <div class="pr">Buy ${usd(D.MARKET[k][idx])}${r ? ` · Sell ${usd(D.sellPrice(k, idx))}` : ""}</div></div>
      <div style="display:grid;gap:6px">${stepper("buy", k, "Buy")}${r && own ? stepper("dump", k, "Sell") : ""}</div></div>`;
  }).join("");
  const plans = `<div class="hw-plans">${D.PLAN_KEYS.map(k => `<button data-plan="${k}" class="${draft.plan === k ? "on" : ""}">${planLine(k)}${r && k !== base.plan ? `<small style="color:var(--rust)">Switching costs ${usd(D.PLANS[k].setup)}.</small>` : ""}${r && k === base.plan ? `<small style="color:var(--green)">Your current plan.</small>` : ""}</button>`).join("")}</div>`;
  let html;
  if (r === 0) {
    const cost = D.MODEL_KEYS.reduce((a, k) => a + draft.buy[k] * D.MARKET[k][0], 0) + (draft.plan ? D.PLANS[draft.plan].setup : 0);
    html = `<div class="yrhead"><div><div class="sub">Build your rig</div><h2>You have $10,000</h2></div></div>
      <div class="card"><div class="small" style="font-size:16px">Electricity is your biggest cost. A machine runs 24/7: power cost = kW × 24 hours × days × price per kWh. Machines lose value over time, and you can sell them back later at 85% of the market price.</div></div>
      <div class="hw-step"><b>1</b>Where will you plug in?</div>${plans}
      <div class="hw-step"><b>2</b>Buy machines</div><div class="hw-shop">${shop}</div>
      <div class="hw-tot"><span>Spending: <b>${usd(cost)}</b></span><span>Cash left: <b class="${10000 - cost < 0 ? "neg" : ""}">${usd(10000 - cost)}</b></span></div>
      ${pv.err && (draft.plan || D.count(draft.buy)) ? `<div class="err">${esc(pv.err)}</div>` : ""}`;
  } else {
    const R = D.ROUNDS[r], seat = seatFor(r, S.me.seats);
    const est = R.est ? `<div class="card" style="margin-top:12px"><div class="label">Rookie help (Rounds 1 and 2 only): estimate per machine this round</div>
      <table class="hw-est"><tr><th>Machine</th><th class="r">Bitcoin mined</th><th class="r">Worth</th><th class="r">Power bill</th><th class="r">Profit</th></tr>
      ${D.MODEL_KEYS.map(k => { const b = D.unitBTC(k, r), w = b * R.price, p = D.unitPower(k, draft.plan || base.plan, r); return `<tr><td>${D.MODELS[k].short}</td><td class="r">${b.toFixed(4)}</td><td class="r">${usd(w)}</td><td class="r">${usd(-p)}</td><td class="r ${cls(w - p)}">${sgnUsd(w - p)}</td></tr>`; }).join("")}</table>
      <div class="small">For 182 days on the ${esc(D.PLANS[draft.plan || base.plan].name.toLowerCase())} plan. From Round 3 on, you work it out yourselves.</div></div>` : "";
    html = `${eventCard(r)}${deskStrip(base, r - 1 || 0).replace('class="hw-desk"', 'class="hw-desk" style="margin-top:12px"')}${est}
      <div class="hw-step"><b>1</b>Prove it <span class="hw-seat">Seat ${seat} answers</span></div>
      <div class="hw-q"><div class="t">${esc(R.q.text)}</div><div class="hw-opts">${R.q.opts.map((o, i) => `<button data-q="${i}" class="${draft.q === i ? "on" : ""}">${esc(o)}</button>`).join("")}</div>
        ${R.calc ? `<div style="margin-top:12px;font-size:18px;font-weight:600">${esc(R.calc.text)}</div><label class="field" style="margin-top:6px"><span>${esc(R.calc.unit)} (within 5% = +1 point and $${D.CALC_BONUS})</span><input id="calc" inputmode="decimal" value="${esc(draft.calc)}" style="font-size:24px"></label>` : ""}
        ${R.writeup ? `<label class="field"><span>${esc(D.writeupPrompt)}</span><textarea id="wu" rows="3" maxlength="240" style="width:100%;font-size:18px;padding:10px;border:2px solid var(--rule);border-radius:10px;font-family:Barlow,Arial">${esc(draft.text)}</textarea></label><div class="small">Your teacher can award +1 point for the best answers.</div>` : ""}</div>
      <div class="hw-step"><b>2</b>Run your machines this round?</div>
      <div class="hw-two"><button data-run="1" class="${draft.run ? "on go" : ""}">⚡ Run them</button><button data-run="0" class="${!draft.run ? "on" : ""}">⏸ Shut off (no Bitcoin, no power bill)</button></div>
      <div class="hw-step"><b>3</b>Buy or sell machines (optional)</div><div class="hw-shop">${shop}</div>
      <div class="hw-step"><b>4</b>Power plan</div>${plans}
      <div class="hw-step"><b>5</b>Your Bitcoin</div>
      <div class="hw-two"><button data-sell="0" class="${!draft.sell ? "on" : ""}">💎 Hold it all</button><button data-sell="1" class="${draft.sell ? "on go" : ""}">💵 Sell it all at ${usd(R.price)}</button></div>
      <div class="small" style="margin-top:4px">Selling turns every Bitcoin you hold (including what you mine this round) into cash at this round's price.</div>
      ${pv.err ? `<div class="err">${esc(pv.err)}</div>` : `<div class="hw-tot"><span>Cash after this round's buys, sells and power: <b class="${pv.desk.cash < 0 ? "neg" : ""}">${usd(pv.desk.cash)}</b></span></div>${pv.desk.cash < 0 ? `<div class="err" style="background:#FFF3B0;color:#111">Heads up: that puts your desk in debt. You can still lock it in, but shutting off or selling machines would stop the bleeding.</div>` : ""}`}`;
  }
  $("#view").innerHTML = `${html}<div class="actions" style="justify-content:stretch"><button class="btn big" id="lock" style="width:100%" ${pv.err ? "disabled" : ""}>Lock it in</button></div>
    ${err ? `<div class="err">${esc(err)}</div>` : ""}<div class="status" id="conn">${esc(conn)}</div>`;
  $$("[data-plan]").forEach(b => b.onclick = () => keepY(() => { draft.plan = b.dataset.plan; renderPick(); }));
  $$("[data-q]").forEach(b => b.onclick = () => keepY(() => { draft.q = +b.dataset.q; renderPick(); }));
  $$("[data-run]").forEach(b => b.onclick = () => keepY(() => { draft.run = b.dataset.run === "1"; renderPick(); }));
  $$("[data-sell]").forEach(b => b.onclick = () => keepY(() => { draft.sell = b.dataset.sell === "1"; renderPick(); }));
  $$("[data-st]").forEach(b => b.onclick = () => keepY(() => { const [f, k, d] = b.dataset.st.split(":"); const max = f === "dump" ? base.rig[k] : 20; draft[f][k] = Math.max(0, Math.min(max, draft[f][k] + +d)); renderPick(); }));
  if ($("#calc")) $("#calc").oninput = e => { draft.calc = e.target.value; };
  if ($("#wu")) $("#wu").oninput = e => { draft.text = e.target.value; };
  $("#lock").onclick = lockIn;
}
const stepper = (f, k, lbl) => `<div class="hw-stp"><span class="small" style="min-width:34px;font-size:13px;font-family:Oswald,Arial;text-transform:uppercase">${lbl}</span><button data-st="${f}:${k}:-1">−</button><span>${draft[f][k]}</span><button data-st="${f}:${k}:1">+</button></div>`;
async function lockIn() {
  if (S.r > 0) {
    if (draft.q === null) return keepY(() => renderPick("Answer the Prove It question first."));
    if (D.ROUNDS[S.r].calc && !String(draft.calc).trim()) return keepY(() => renderPick("Type your answer to the math question."));
    if (D.ROUNDS[S.r].writeup && draft.text.trim().length < 15) return keepY(() => renderPick("Write your 1 to 2 sentence halving answer."));
  }
  $("#lock").disabled = true;
  try { await call("decide", { code: me.code, gid: me.gid, key: me.key, r: S.r, ...draft }); await refresh(true); }
  catch (e) { keepY(() => renderPick(e.message)); }
}
function renderLocked() {
  const d = mine(), r = S.r;
  const lines = r === 0 ? `<p style="font-size:20px">${esc(D.PLANS[d.plan].name)} · ${esc(rigText(d.buy))}</p>`
    : `<p style="font-size:19px;line-height:1.5">Prove It: <b>${esc(D.ROUNDS[r].q.opts[d.q])}</b>${d.calc ? ` · Math: <b>${esc(d.calc)}</b>` : ""}<br>${d.run ? "⚡ Running" : "⏸ Shut off"} · ${d.sell ? "💵 Selling Bitcoin" : "💎 Holding Bitcoin"}${D.count(d.buy) ? ` · Buying ${esc(rigText(d.buy))}` : ""}${D.count(d.dump) ? ` · Selling ${esc(rigText(d.dump))}` : ""}</p>`;
  $("#view").innerHTML = `<div class="center lockedcard"><h2>🔒 Locked in</h2>${lines}
    <p style="font-size:17px;color:#CFCFCF">${S.locked.length} of ${S.groups.length} desks are locked. Eyes on the board.</p>
    <button class="btn ghost" id="undo" style="color:#fff;border-color:#fff">Change our answer</button></div><div class="status" id="conn">${esc(conn)}</div>`;
  $("#undo").onclick = async () => { try { await call("undecide", { code: me.code, gid: me.gid, key: me.key, r: S.r }); draft = null; await refresh(true); } catch (e) { alert(e.message); } };
}

/* ---------- reveal ---------- */
function renderReveal() {
  const r = S.r, st = D.standings(S.groups, S.decisions, S.awards, r), mi = st.findIndex(x => x.g.gid === me.gid), my = st[mi];
  const row = my && my.rows[r], d = mine();
  let body = "";
  if (r === 0) body = `<div class="card"><div class="label">Your rig</div><p style="font-size:20px">${row && !row.skipped ? `${esc(D.PLANS[row.plan].name)} · ${esc(rigText(row.buy))}<br>Spent ${usd(row.spent)} · Cash left ${usd(row.endCash)}` : "You didn't build a rig."}</p></div>`;
  else if (S.step === "answer" || S.step === "writeups") {
    const R = D.ROUNDS[r];
    body = `<div class="card"><div class="label">Prove It</div><div style="font-size:19px;font-weight:600">${esc(R.q.text)}</div>
      <div class="hw-opts">${R.q.opts.map((o, i) => `<button class="${i === R.q.ans ? "right" : d && d.q === i ? "wrong" : ""}" disabled>${i === R.q.ans ? "✓ " : d && d.q === i ? "✗ " : ""}${esc(o)}</button>`).join("")}</div>
      <div class="hw-why">${esc(R.q.why)}</div>
      ${R.calc ? `<div class="hw-why"><b>Math:</b> ${d && d.calc ? `you said ${esc(d.calc)}, ${row && row.cRight ? `<span class="pos">right! +1 point and ${usd(D.CALC_BONUS)}</span>` : `<span class="neg">not within 5%</span>`}. ` : ""}${esc(R.calc.why)}</div>` : ""}</div>`;
  } else if (row) {
    body = `<div class="card"><div class="label">Your round</div>${row.skipped ? "Sat out." : `<table class="hw-res">
      <tr><td>Machines</td><td class="r">${esc(rigText(row.rig))}</td></tr>
      <tr><td>${row.run ? "Bitcoin mined" : "Shut off"}</td><td class="r">${row.run ? `${btc(row.mined)} (${usd(row.minedUSD)})` : "–"}</td></tr>
      <tr><td>Power bill</td><td class="r neg">${usd(-row.power)}</td></tr>
      <tr><td>Mining profit</td><td class="r ${cls(row.minedUSD - row.power)}">${sgnUsd(row.minedUSD - row.power)}</td></tr>
      ${row.sold ? `<tr><td>Machines sold</td><td class="r">+${usd(row.sold)}</td></tr>` : ""}${row.spent ? `<tr><td>Machines bought</td><td class="r">${usd(-row.spent)}</td></tr>` : ""}
      ${row.btcSold ? `<tr><td>Bitcoin sold</td><td class="r">+${usd(row.btcCash)}</td></tr>` : ""}
      <tr><td>Analyst points this round</td><td class="r">+${row.gained}${row.bonus ? ` and +${usd(row.bonus)}` : ""}</td></tr>
      <tr><td><b>Net worth</b></td><td class="r"><b>${usd(row.nw)}</b></td></tr></table>`}</div>`;
    if (S.step === "stand") body += `<div class="card dark" style="margin-top:12px;text-align:center"><div class="label">Standings</div><div class="rank" style="justify-content:center"><div class="p">#${mi + 1}</div><div style="font-size:20px">of ${st.length} · score ${usd(my.score)}</div></div></div>`;
  }
  $("#view").innerHTML = `<div class="yrhead"><div><div class="sub">${r === 0 ? "The build" : esc(D.ROUNDS[r].tag + " · " + D.ROUNDS[r].title)}</div><h2>Eyes on the board</h2></div></div>${body}<div class="status" id="conn">${esc(conn)}</div>`;
}
function renderFinal() {
  const st = D.standings(S.groups, S.decisions, S.awards, D.N), mi = st.findIndex(x => x.g.gid === me.gid), my = st[mi];
  $("#view").innerHTML = `<div class="center card dark" style="text-align:center"><div class="label">Final</div><div class="bignm" style="color:#fff">#${mi + 1} of ${st.length}</div>
    <p style="font-size:20px">Net worth ${usd(my.nw)} · ${my.pts} analyst points · Score ${usd(my.score)}</p></div>
    ${S.exit ? `<div class="center card" style="text-align:center"><div class="label">Exit ticket is open</div><p style="font-size:18px">Everyone answers on their own. Use your own iPad, or take turns on this one.</p><button class="btn big" id="toExit">Start the exit ticket</button></div>` : `<div class="status">Wait for your teacher to open the exit ticket.</div>`}
    <div class="card" style="margin-top:12px">${standTable(st, { me: me.gid })}</div><div class="status" id="conn">${esc(conn)}</div>`;
  if ($("#toExit")) $("#toExit").onclick = () => renderExit(me.code);
}

/* ---------- boot ---------- */
if (qs.has("x")) renderExit(qs.get("c") || "");
else if (me && (!qs.get("c") || qs.get("c") === me.code)) { refresh(true); startPoll(); }
else renderJoin();
