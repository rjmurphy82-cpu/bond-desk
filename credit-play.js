// Credit Desk Live: student (iPad) screen
import { call, $, $$, store } from "./credit-client.js";
import { C, esc, k, N, picksFor, ratingOf, nailedCount, standings, caseFileHTML, mathLine, returnLines } from "./credit-view.js";

const SK = "cd_play";
let me = store.get(SK);          // {code, gid, key, name, pin}
let S = null, pollT = null, busy = false, lastKey = "", conn = "";
let draft = { s: {}, fair: "", amt: 0, checked: false };

/* ---------- join ---------- */
function renderJoin(msg = "", showPin = false) {
  const code = new URLSearchParams(location.search).get("c") || (me && me.code) || "";
  $("#barSlot").innerHTML = ""; $("#who").textContent = "";
  $("#view").innerHTML = `<div class="center card">
    <div class="label">Join Credit Desk Live</div><h2 style="font-size:30px;color:var(--brown)">Rate it. Then buy it.</h2>
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
    history.replaceState(null, "", "/credit?c=" + code); S = null; lastKey = ""; await refresh(true); startPoll();
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
    if (e.code === "no_game" || e.code === "not_in_game") { const code = me.code; me = null; store.del(SK); clearInterval(pollT); history.replaceState(null, "", "/credit?c=" + code); renderJoin(e.code === "no_game" ? "That game has ended." : "Your group was removed or rejoined on another iPad. Join again."); }
    else { conn = "Reconnecting..."; setConn(); }
  } finally { busy = false; }
}
function setConn() { const el = $("#conn"); if (el) el.textContent = conn; }
const keepY = fn => { const y = scrollY; fn(); scrollTo(0, y); };

/* ---------- helpers ---------- */
const Y = () => C.YEARS[S.r];
const mine = () => (S.decisions[S.r] || {})[me.gid] || null;
const fundNow = () => S.r === 0 ? C.START_FUND : C.runFund(picksFor(S, me.gid, S.r - 1), S.r - 1).value;
const sheet = part => `<div class="sheetbar">▶ <b>Worksheet: Year ${Y().year}, Part ${part}.</b> Fill it in while you work on this screen.</div>`;
function head(sub) {
  return `<div class="yrhead"><div><div class="sub">Year ${Y().year} of ${N} · ${esc(sub)} · Fund ${C.money(fundNow())}</div><h2>${esc(Y().title)}</h2></div><div class="chip"><div class="v">${Y().t0.toFixed(1)}%</div><div class="k">Treasury rate</div></div></div>`;
}
function saveDraft() { store.set("cd_draft", { key: me.code + lastKey, d: draft }); }

/* ---------- render ---------- */
function render() {
  $("#who").textContent = me.name;
  const key = S.phase + ":" + S.r + ":" + (S.step || "");
  if (key !== lastKey) {
    const phaseKey = S.phase + ":" + S.r;
    if (!lastKey.startsWith(phaseKey)) { const sv = store.get("cd_draft"); draft = sv && sv.key && sv.key.startsWith(me.code + phaseKey) ? sv.d : { s: {}, fair: "", amt: 0, checked: false }; window.scrollTo(0, 0); }
    lastKey = key;
  }
  $("#barSlot").innerHTML = "";
  if (S.phase === "lobby") renderLobby();
  else if (S.phase === "rate") renderRate();
  else if (S.phase === "price") renderPrice();
  else if (S.phase === "reveal") renderReveal();
  else renderFinal();
}
function renderLobby() {
  $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">You're in</div><div class="big" style="font-size:40px">${esc(me.name)}</div>
    <div class="pinbox"><div class="small" style="color:#CFCFCF">Your PIN. Write it down in case your iPad restarts.</div><div class="v">${me.pin}</div></div>
    <p style="font-size:19px;margin-top:18px">You start with <b>${C.money(C.START_FUND)}</b>. Get your <b>Analyst Worksheet</b> ready. Waiting for Year 1...</p><div class="status" id="conn">${esc(conn)}</div></div>`;
}

/* ---------- 1. rate it ---------- */
function renderRate() {
  const d = mine(), y = Y();
  if (d && d.rating) {
    $("#view").innerHTML = head("Rate it") + `<div class="lockedcard"><div class="label">Rating locked 🔒</div><h2>Your rating: ${d.rating}</h2>
      <div style="font-size:18px;margin-top:6px;color:#E6E6E6">${d.total != null ? d.total + " points. " : ""}${S.rated.length} of ${S.groups.length} groups rated. When everyone's in, your teacher opens the market.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="change" style="color:#fff;border-color:#fff">Change our rating</button></div></div>
      <div style="margin-top:14px">${caseFileHTML(y)}</div><div class="status" id="conn">${esc(conn)}</div>`;
    $("#change").onclick = async () => { try { draft.s = { ...(d.s || {}) }; saveDraft(); await call("undecide", { code: me.code, gid: me.gid, key: me.key, r: S.r, stage: "rate" }); S = null; await refresh(true); } catch (e) { alert(e.message); } };
    return;
  }
  const done = C.FACTORS.every(f => draft.s[f.key] !== undefined), tot = C.FACTORS.reduce((a, f) => a + (draft.s[f.key] ?? 0), 0);
  $("#view").innerHTML = head("Rate it") + sheet("A") + `<div class="cols">${caseFileHTML(y)}
    <div class="card"><div class="label">Your scorecard · tap 0 to 4</div>
      ${C.FACTORS.map(f => `<div class="frow"><div class="fname">${f.name}</div><div class="fq">${f.kind === "ratio" ? `<b>${f.formula}</b> (do it on your worksheet)` : esc(f.q)}</div>
        <div class="levels">${[4, 3, 2, 1, 0].map(l => `<button class="lv ${draft.s[f.key] === l ? "on" : ""}" data-k="${f.key}" data-l="${l}"><b>${l}</b>${f.short[l]}</button>`).join("")}</div></div>`).join("")}
      <div class="totrow"><div><div class="k">Your points</div><div class="v">${done ? tot : "–"} <span style="font-size:16px">/ 24</span></div></div><div class="red"><div class="k">Your rating</div><div class="v">${done ? C.ratingFor(tot) : "?"}</div></div></div>
      <div class="spreads">${C.LADDER.map(r => `<div class="${C.isJunk(r) ? "j" : ""}" style="${done && r === C.ratingFor(tot) ? "outline:3px solid var(--brown)" : ""}">${r}<small>${C.bandText(r)}</small></div>`).join("")}</div>
      <div class="actions"><button class="btn big" id="lockRate" ${done ? "" : "disabled"} style="width:100%">Lock in our rating</button></div>
      <div class="status" id="conn">${esc(conn)}</div></div></div>`;
  $$(".lv").forEach(b => b.onclick = () => { draft.s[b.dataset.k] = +b.dataset.l; saveDraft(); keepY(renderRate); });
  $("#lockRate").onclick = async () => {
    if (!confirm(`Lock in ${C.ratingFor(tot)} (${tot} points)?`)) return;
    try { $("#lockRate").disabled = true; await call("decide", { code: me.code, gid: me.gid, key: me.key, r: S.r, stage: "rate", scores: draft.s }); S = null; await refresh(true); }
    catch (e) { alert(e.message); if ($("#lockRate")) $("#lockRate").disabled = false; }
  };
}

/* ---------- 2. price it ---------- */
function renderPrice() {
  const d = mine(), y = Y(), b = y.bond;
  if (!d || !d.rating) {
    $("#view").innerHTML = head("Price it") + `<div class="center card" style="text-align:center"><div class="big" style="font-size:40px">No rating this year</div><p style="font-size:19px">Your group didn't lock in a rating, so your money stays in cash this year. Watch the board, and fill in Part B on your worksheet anyway.</p><div class="status" id="conn">${esc(conn)}</div></div>`;
    return;
  }
  if (d.amt !== undefined && d.amt !== null) {
    $("#view").innerHTML = head("Price it") + `<div class="lockedcard"><div class="label">Locked in 🔒</div><h2>${d.amt ? "Buying " + k(d.amt) : "Passing"}</h2>
      <div style="font-size:18px;margin-top:6px;color:#E6E6E6">Your rating: ${d.rating}. ${S.priced.length} of ${S.groups.length} groups locked. When everyone's in, your teacher reveals the year.</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost" id="change" style="color:#fff;border-color:#fff">Change our choice</button></div></div><div class="status" id="conn">${esc(conn)}</div>`;
    $("#change").onclick = async () => { try { draft.amt = d.amt; draft.fair = d.fair || ""; draft.checked = !!d.fair; saveDraft(); await call("undecide", { code: me.code, gid: me.gid, key: me.key, r: S.r, stage: "price" }); S = null; await refresh(true); } catch (e) { alert(e.message); } };
    return;
  }
  const R = d.rating, fairMine = C.fairYield(y.t0, R), ok = draft.checked && Math.abs(parseFloat(draft.fair) - fairMine) < 0.051, junk = C.isJunk(b.posted), sv = fundNow();
  $("#view").innerHTML = head("Price it") + sheet("B") + `<div class="cols"><div class="grid" style="align-content:start">
      <div class="card"><div class="label">Rate news</div><p style="font-size:19px;margin:0"><b>${esc(y.rateNews)}</b></p><div class="small" style="margin-top:6px">Rates up → bond prices down. Rates down → prices up. Long bonds move the most.</div></div>
      <div class="card"><div class="label">Fair yield = ${y.t0.toFixed(1)}% + spread</div><div class="spreads">${C.LADDER.map(r => `<div class="${C.isJunk(r) ? "j" : ""}" style="${r === R ? "outline:3px solid var(--brown)" : ""}">${r}<small>+${C.SPREADS[r].toFixed(1)}%</small></div>`).join("")}</div>
        <div class="small" style="margin-top:8px">Cash earns ${y.t0.toFixed(1)}%. No more than $200K in a bond <b>posted</b> as junk (BB or lower), or a $25,000 fine.</div></div>
      ${caseFileHTML(y)}</div>
    <div class="bond"><h3>${esc(y.issuer.name)}</h3>
      <div class="stats" style="grid-template-columns:repeat(4,1fr)"><div class="stat" style="background:var(--green)"><div class="v">${R}</div><div class="k">Your rating</div></div><div class="stat ${junk ? "j" : ""}"><div class="v">${b.posted}</div><div class="k">Agency posted</div></div>
        <div class="stat"><div class="v">${b.yld.toFixed(1)}%</div><div class="k">Bond pays</div></div><div class="stat"><div class="v">${b.years} yr</div><div class="k">Matures</div></div></div>
      <div class="sens">${R !== b.posted ? "<b>Your rating doesn't match the agency's.</b> Their rating may be out of date. " : ""}If rates rise 1%, its price falls about <b>${b.sens}%</b>.</div>
      <div class="label" style="margin-top:8px">Your fair yield (use YOUR rating)</div>
      <div class="calc">${y.t0.toFixed(1)}% + spread for ${R} = <input id="fair" inputmode="decimal" placeholder="?" value="${esc(draft.fair)}"> % <button class="btn ghost sm" id="check">Check</button></div>
      ${draft.checked ? `<div class="${ok ? "okbox" : "nobox"}">${ok ? `<b>Right: ${fairMine.toFixed(1)}%.</b>` : `<b>Check it: ${y.t0.toFixed(1)}% + ${C.SPREADS[R].toFixed(1)}% = ${fairMine.toFixed(1)}%.</b>`} It pays ${b.yld.toFixed(1)}% → <b>${C.verdict(b.yld, fairMine)}</b> (by your rating).</div>` : ""}
      <div class="label" style="margin-top:8px">How much will you buy?</div>
      <div class="seg4">${C.AMOUNTS.map(a => `<button data-a="${a}" class="${draft.amt === a ? "on" : ""} ${a ? "" : "pass"}" ${draft.checked ? "" : "disabled"}>${a ? "Buy " + k(a) : "Pass"}</button>`).join("")}</div>
      ${draft.checked ? "" : `<div class="small">Find your fair yield first.</div>`}<div class="status" id="conn">${esc(conn)}</div></div></div>`;
  const fi = $("#fair");
  fi.oninput = () => { draft.fair = fi.value; saveDraft(); };
  $("#check").onclick = () => { if (!fi.value.trim()) return fi.focus(); draft.fair = fi.value.trim(); draft.checked = true; saveDraft(); keepY(renderPrice); };
  fi.onkeydown = e => { if (e.key === "Enter") $("#check").click(); };
  $$(".seg4 button").forEach(x => x.onclick = () => { draft.amt = +x.dataset.a; saveDraft(); keepY(renderPrice); });
  const over = junk && draft.amt > C.JUNK_LIMIT;
  $("#barSlot").innerHTML = `<div class="bar"><div class="nums"><div class="n"><div class="v">${C.money(draft.amt)}</div><div class="k">In the bond</div></div><div class="n"><div class="v">${C.money(sv - draft.amt)}</div><div class="k">In cash</div></div>
    <div class="n ${over ? "over" : ""}"><div class="v">${junk ? C.money(draft.amt) : "$0"}</div><div class="k">Posted junk · limit $200K</div></div></div><button class="btn" id="lock" ${draft.checked ? "" : "disabled"}>Lock in</button></div>`;
  $("#lock").onclick = async () => {
    const msg = over ? "\n\nThis bond is posted as junk and you're over $200K: that's a $25,000 fine." : "";
    if (!confirm(`Lock in: ${draft.amt ? "Buy " + k(draft.amt) : "Pass"}?${msg}`)) return;
    try { $("#lock").disabled = true; await call("decide", { code: me.code, gid: me.gid, key: me.key, r: S.r, stage: "price", fair: draft.fair, amt: draft.amt }); S = null; await refresh(true); }
    catch (e) { alert(e.message); if ($("#lock")) $("#lock").disabled = false; }
  };
}

/* ---------- 3. reveal ---------- */
function renderReveal() {
  const y = Y(), d = mine() || {};
  if (S.step !== "stand") {
    $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">Year ${y.year}: ${esc(y.issuer.name)}</div><div class="big" style="font-size:52px">👀 Eyes on the board</div>
      <p style="font-size:19px">${S.step === "bond" ? "Watch what happened to the bond. Fill in Part C on your worksheet." : "The true rating is on the board. Write it in Part C on your worksheet."}</p>
      <div class="lockedcard" style="text-align:left;margin-top:10px"><div class="label">Your group this year</div><table><tr><td>Your rating</td><td class="r">${d.rating || "none"}</td></tr><tr><td>You chose</td><td class="r">${d.amt ? "Buy " + k(d.amt) : "Pass"}</td></tr></table></div><div class="status" id="conn">${esc(conn)}</div></div>`;
    return;
  }
  const t = y.truth, rows = standings(S, S.r), myRow = rows.find(x => x.g.gid === me.gid), yy = myRow.y, { ret, html } = returnLines(y);
  const steps = d.rating ? Math.abs(C.LADDER.indexOf(d.rating) - C.LADDER.indexOf(t.rating)) : null;
  $("#view").innerHTML = `<div class="yrhead"><div><div class="sub">Year ${y.year} results</div><h2>${esc(y.title)}</h2></div><div class="chip"><div class="v">${y.t0.toFixed(1)}% → ${y.t1.toFixed(1)}%</div><div class="k">Treasury rate</div></div></div>
    <div class="cols"><div class="grid" style="align-content:start">
      <div class="card"><div class="rank"><div class="p">${myRow.place}<span style="font-size:24px">/${rows.length}</span></div><div><div class="label">Your group this year</div><div class="big" style="font-size:40px">${C.signed(yy.gain)}</div><div style="font-size:18px">Fund value: <b>${C.money(myRow.f.value)}</b> · Ratings nailed: <b>${myRow.nailed} / ${S.r + 1}</b></div></div></div></div>
      <div class="card"><div class="label">${steps === 0 ? `✓ You nailed it: ${t.rating}` : `True rating: ${t.rating}${d.rating ? ` · you said ${d.rating} (${steps} step${steps > 1 ? "s" : ""} off)` : ""}`}</div>
        <table class="cmp"><tr><th>Factor</th><th class="r">You</th><th class="r">True</th><th>Why</th></tr>
        ${C.FACTORS.map(f => { const mv = d.s ? d.s[f.key] : null; return `<tr class="${mv === t.scores[f.key] ? "ok" : mv == null ? "" : "bad"}"><td><b>${f.name}</b></td><td class="r">${mv ?? "–"}</td><td class="r"><b>${t.scores[f.key]}</b></td><td>${esc(mathLine(y, f.key))}</td></tr>`; }).join("")}</table></div></div>
    <div class="card"><div class="label">What happened to the bond</div><table class="res">${html}<tr class="tot"><td>Return for the year</td><td class="r ${ret.total < 0 ? "neg" : ""}">${C.pct(ret.total)}</td></tr></table>
      <table class="res" style="margin-top:10px"><tr><td>${esc(y.issuer.name)} (${d.amt ? k(d.amt) : "Pass"})</td><td class="r ${yy.bondGain < 0 ? "neg" : ""}">${d.amt ? C.signed(yy.bondGain) : "–"}</td></tr>
        <tr><td>Cash in Treasuries</td><td class="r">${C.signed(yy.cashGain)}</td></tr>${yy.fine ? `<tr><td>Junk limit fine</td><td class="r neg">−$25,000</td></tr>` : ""}
        <tr class="tot"><td>Total for the year</td><td class="r ${yy.gain < 0 ? "neg" : ""}">${C.signed(yy.gain)}</td></tr></table>
      <p style="font-size:16px;line-height:1.45">${esc(y.lesson)}</p><div class="status" id="conn">${esc(conn)}</div></div></div>`;
}
function renderFinal() {
  const lastR = N - 1, rows = standings(S, lastR), my = rows.find(x => x.g.gid === me.gid), bench = C.runFund([], lastR).value;
  $("#view").innerHTML = `<div class="center card" style="text-align:center"><div class="label">${N} years on the Credit Desk</div><div class="big" style="font-size:40px">${esc(me.name)}</div>
    <div class="rank" style="justify-content:center;margin:16px 0"><div class="p">${my.place}<span style="font-size:24px">/${rows.length}</span></div><div style="text-align:left"><div class="small">Final fund value</div><div class="big" style="font-size:44px">${C.money(my.f.value)}</div></div></div>
    <p style="font-size:18px">${my.f.value > bench ? "You beat" : "You fell short of"} the Play-It-Safe Fund (all cash), which finished at <b>${C.money(bench)}</b>. You rated <b>${my.nailed} of ${N}</b> borrowers exactly right.</p>
    <table class="res" style="margin-top:10px">${my.f.years.map((yy, i) => `<tr><td>Year ${i + 1}: ${esc(C.YEARS[i].issuer.name)}</td><td>${ratingOf(S, i, me.gid) || "–"} ${ratingOf(S, i, me.gid) === C.YEARS[i].truth.rating ? "✓" : ""}</td><td class="r ${yy.gain < 0 ? "neg" : ""}">${C.signed(yy.gain)}</td></tr>`).join("")}</table>
    <div class="actions" style="justify-content:center"><button class="btn ghost" id="leave">Leave game</button></div></div>`;
  $("#leave").onclick = () => { store.del(SK); me = null; clearInterval(pollT); renderJoin(); };
}

/* ---------- boot ---------- */
const urlCode = new URLSearchParams(location.search).get("c");
if (me && (!urlCode || urlCode === me.code)) { refresh(); startPoll(); $("#view").innerHTML = `<div class="center card">Reconnecting to your group...</div>`; }
else { if (me && urlCode !== me.code) { me = null; store.del(SK); } renderJoin(); }
window.__cdp = { get S() { return S; } };
