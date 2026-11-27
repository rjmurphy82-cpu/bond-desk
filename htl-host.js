// Hold the Line: host (projector) screen.
import { call, $, $$, store } from "./htl-client.js";
import { qrSVG } from "./qr.js";
import { D, S, CSS, esc, money, pct, cls, chg, gauge, spark, macroGrid, feed, boards, BADGES } from "./htl-view.js";

document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);
const SKEY = "htl_host";
let api = call, G = null, sess = null, pollT = null, netErr = "", tickT = null;
const ui = { menu: false, key: "", tab: "status", ftab: "returns", auto: store.get("htl_auto") !== false, lastFg: 55, say: -1 };
const defSecs = q => q === 0 ? 240 : q < 4 ? 180 : 150;
let secsPick = null;

/* ---------- menu ---------- */
async function boot() {
  sess = store.get(SKEY);
  if (sess) { try { G = await api("state", { code: sess.code, hostKey: sess.hostKey }); if (!G.host) throw 0; startPoll(); } catch { store.del(SKEY); sess = null; G = null; } }
  renderMenu();
}
function renderMenu(msg = "") {
  ui.menu = true; $("#menuBtn").style.display = "none";
  const live = !!(sess && G);
  const where = !G ? "" : G.phase === "lobby" ? "Lobby" : G.phase === "final" ? "Finished" : `${D.QLABEL(G.q)} · ${G.phase === "news" ? "news" : "trading"}`;
  $("#view").innerHTML = `<div class="hero">
    ${live ? `<div class="card dark" style="grid-column:1/-1"><div class="label">Game in progress</div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div><div style="font-family:Oswald,Arial;font-size:44px;line-height:1">Game ${esc(sess.code)}</div><div style="font-size:19px;margin-top:4px">${esc(where)} · ${G.count} students</div></div>
        <button class="btn big" id="mResume">Resume</button></div></div>` : ""}
    <div class="card ${live ? "" : "dark"}"><div class="label">Make a pledge. Keep it for 3 years.</div>
      <h2 style="font-size:${live ? 30 : 44}px;line-height:1.05;margin:4px 0 10px">Can you stick to your investing strategy when the market tests you?</h2>
      <div style="font-size:18px;line-height:1.5">Each student pledges to one of 8 great investors (Graham, Buffett, Lynch, Fisher, Templeton, Bogle, All Weather, Livermore), sets 3 dials, and signs. Then 3 years of a fictional market in about 30 minutes: 12 quarters, 16 investments, breaking news read aloud, a Fear and Greed meter, an IPO mania, a crash, and a fraud. <b>Students are graded on discipline, not returns.</b></div>
      <div class="actions" style="justify-content:flex-start"><button class="btn ${live ? "dk" : "big"}" id="newGame">${live ? "End it &amp; start a new game" : "Start a new game"}</button></div>
      ${msg ? `<div class="err">${esc(msg)}</div>` : ""}</div>
    <div class="card"><div class="label">How a class period runs (85 minutes)</div>
      <ol style="font-size:17px;line-height:1.5;margin:0 0 0 18px"><li><b>Pledge</b> (15 min): students join, pick an investor, set dials, sign.</li><li><b>Opening Bell</b> (7 min): build the opening portfolio.</li><li><b>The sim</b> (about 33 min): each quarter, read the news, then open trading. Decision cards in Q3, Q7, Q10, Q11; paychecks in Q4 and Q8.</li><li><b>Report cards</b> (15 min): each iPad shows the Discipline Score, violations, badges, and the reflection.</li><li><b>Debrief</b> (15 min): leaderboards, archetype standings, the Ghost.</li></ol></div></div>`;
  if ($("#mResume")) $("#mResume").onclick = () => { ui.menu = false; ui.key = ""; render(); };
  $("#newGame").onclick = async () => {
    if (live && !confirm("End this game and start a new one? Everyone's results will be erased.")) return;
    $("#newGame").disabled = true; await endCurrent();
    try { const r = await api("create"); sess = { code: r.code, hostKey: r.hostKey }; store.set(SKEY, sess); ui.menu = false; await refresh(true); startPoll(); }
    catch (e) { renderMenu(e.code === "db_not_configured" ? "The game database isn't connected yet (see the README)." : e.message); }
  };
}
$("#menuBtn").onclick = () => renderMenu();
async function endCurrent() {
  if (sess) { try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: "end" }); } catch {} }
  store.del(SKEY); clearInterval(pollT); G = null; sess = null; ui.key = "";
}

/* ---------- polling ---------- */
function startPoll() { clearInterval(pollT); pollT = setInterval(() => refresh(false), 2000); }
let busy = false;
async function refresh(force) {
  if (!sess || busy) return; busy = true;
  try {
    const r = await api("state", { code: sess.code, hostKey: sess.hostKey, since: force || !G ? undefined : G.v });
    netErr = "";
    if (!r.same) { G = r; if (!ui.menu) render(); }
  } catch (e) {
    if (e.code === "no_game") { await endCurrent(); renderMenu("That game ended (games erase after 12 hours)."); }
    else { netErr = e.message; const el = $("#netErr"); if (el) el.textContent = netErr; }
  } finally { busy = false; }
}
async function op(o, extra = {}) {
  try { await api("host", { code: sess.code, hostKey: sess.hostKey, op: o, ...extra }); await refresh(true); }
  catch (e) { alert(e.message); }
}

/* ---------- read aloud ---------- */
function speak(lines) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const voices = speechSynthesis.getVoices(), v = voices.find(x => /en-US/i.test(x.lang) && /Google|Samantha|Aria|Jenny|Guy/i.test(x.name)) || voices.find(x => /en-US/i.test(x.lang));
  lines.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t); if (v) u.voice = v; u.rate = 1.0;
    u.onstart = () => { ui.say = i; $$(".htl-news.big li").forEach((li, j) => li.classList.toggle("say", j === i)); };
    u.onend = () => { if (i === lines.length - 1) $$(".htl-news.big li").forEach(li => li.classList.remove("say")); };
    speechSynthesis.speak(u);
  });
}
const newsLines = q => [`${q === 0 ? "Opening Bell" : q === 12 ? "Final Bell" : "Breaking news. Year " + Math.ceil(q / 4) + ", quarter " + q}.`, ...D.Q[q].news];

/* ---------- render ---------- */
function render() {
  $("#menuBtn").style.display = "inline-block";
  const key = G.phase + ":" + G.q;
  const fresh = key !== ui.key;
  if (fresh) { ui.key = key; ui.tab = "status"; }
  if (G.phase === "lobby") return renderLobby();
  if (G.phase === "news") { if (fresh) { renderNews(); if (ui.auto) speak(newsLines(G.q)); ui.lastFg = D.MACRO.fg[G.q]; } else updateNews(); return; }
  if (G.phase === "trade") { if (fresh) renderTrade(); else updateTrade(); return; }
  if (fresh) { renderFinal(); if (ui.auto) speak(newsLines(12)); ui.lastFg = D.MACRO.fg[12]; } else renderFinal();
}
const joinUrl = () => location.origin + "/htl?c=" + sess.code;
const codeChip = () => `<span class="codechip">Join at ${esc(location.host)}/htl · code <b>${sess.code}</b></span>`;

function renderLobby() {
  const pl = G.players;
  $("#view").innerHTML = `<div class="hero">
    <div class="card dark"><div class="label">Join Hold the Line</div>
      <div class="joinbox"><div class="qr">${qrSVG(joinUrl())}</div>
        <div><div class="url">Scan the code, or go to<br><b>${esc(location.host)}/htl</b></div><div class="small" style="font-size:16px">Game code</div><div class="code">${sess.code}</div></div></div>
      <div class="small" style="margin-top:12px;font-size:15px">One iPad per student. Join with first name and last initial. Write down your 3-digit PIN in case your iPad restarts. Then pick your investor, set your dials, and sign your pledge.</div></div>
    <div class="card"><div class="label">Joined: ${pl.length} · Pledged: ${G.pledged}</div>
      <div class="tiles">${pl.map(p => `<div class="tile ${p.arch ? "done" : ""}"><div><div class="nm">${esc(p.name)}</div><div class="st">${p.arch ? D.ARCH[p.arch].icon + " " + esc(D.ARCH[p.arch].name) : "Pledging..."} · PIN ${p.pin}</div></div><button class="x" data-g="${p.gid}" title="Remove">✕</button></div>`).join("") || `<div class="small">Waiting for students to join...</div>`}</div>
      ${archMix()}
      <div class="actions"><button class="btn big" id="startBtn" ${G.pledged ? "" : "disabled"}>Ring the Opening Bell</button></div>
      <div class="small">Students who haven't pledged yet can still finish during the Opening Bell, before their first trade.</div>
      <div class="small" id="netErr">${esc(netErr)}</div></div></div>`;
  $$(".x").forEach(b => b.onclick = () => { if (confirm("Remove this student?")) op("remove", { gid: b.dataset.g }); });
  $("#startBtn").onclick = () => op("start");
}
function archMix() {
  const n = {}; G.players.forEach(p => { if (p.arch) n[p.arch] = (n[p.arch] || 0) + 1; });
  if (!Object.keys(n).length) return "";
  return `<div class="htl-sec">The class's pledges</div><div style="display:flex;flex-wrap:wrap;gap:6px">${D.ARCH_ORDER.filter(k => n[k]).map(k => `<span class="pill ig" style="font-size:16px">${D.ARCH[k].icon} ${esc(D.ARCH[k].name)} × ${n[k]}</span>`).join("")}</div>`;
}

/* ---------- news ---------- */
function marketStrip(q) {
  return `<div class="mkt">${D.ORDER.map(k => { const p = S.price(k, q); if (p == null) return `<div><b>${k}</b><span class="small">IPO Q${D.A[k].ipo}</span></div>`; const c = chg(k, q); return `<div><b>${k}</b><span>${money(p, true)} <span class="${cls(c)}">${q ? pct(c, 0) : ""}</span></span></div>`; }).join("")}</div>`;
}
function renderNews() {
  const q = G.q, sc = D.Q[q], hx = q ? chg("HX500", q) : null, yearEnd = q === 4 || q === 8;
  if (secsPick == null || ui.secsQ !== q) { secsPick = defSecs(q); ui.secsQ = q; }
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">${esc(D.QLABEL(q))}</div><h2>${esc(sc.title)}</h2></div>${codeChip()}</div>
    <div class="board"><div class="grid" style="align-content:start">
      <div class="card"><div class="label">Breaking news</div><ol class="htl-news big">${sc.news.map((n, i) => `<li><b>${i + 1}</b><span>${esc(n)}</span></li>`).join("")}</ol>
        <div>${sc.forced ? `<span class="flag">⚠️ Decision card this quarter</span>` : ""}${sc.paycheck ? `<span class="flag">💵 Payday: +$1,000</span>` : ""}</div>
        <div class="actions" style="justify-content:space-between;align-items:center"><label style="font-size:16px;display:flex;gap:8px;align-items:center"><input type="checkbox" id="autoTog" ${ui.auto ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--orange)"> Read the news aloud automatically</label>
          <button class="btn ghost" id="readBtn">🔊 Read aloud</button></div></div>
      <div class="card"><div class="label">The economy</div>${macroGrid(q)}</div>
      ${yearEnd ? `<div class="card"><div class="label">Year ${q / 4} standings</div>${boardPair(q)}</div>` : ""}
    </div>
    <div class="grid" style="align-content:start">
      <div class="card"><div class="label">Fear and Greed</div>${gauge(D.MACRO.fg[q], ui.lastFg)}</div>
      <div class="card"><div class="label">The market · Hersey 500</div><div style="font-family:Oswald,Arial;font-size:40px;color:var(--brown);line-height:1">${money(S.price("HX500", q), true)} ${hx != null ? `<span class="${cls(hx)}" style="font-size:28px">${pct(hx)}</span>` : ""}</div>${spark("HX500", q, { w: 400, h: 120, big: true })}</div>
      <div class="card"><div class="label">Open trading</div>
        <div class="seg" style="grid-template-columns:repeat(4,1fr)">${[120, 150, 180, 240].map(s => `<button data-s="${s}" class="${secsPick === s ? "on" : ""}">${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}</button>`).join("")}</div>
        <div class="actions" style="justify-content:stretch"><button class="btn big" id="openBtn" style="width:100%">Open trading for ${q === 0 ? "the opening portfolio" : "Q" + q}</button></div>
        <div class="small" id="pledgeNote">${G.count - G.pledged ? `${G.count - G.pledged} student(s) still pledging.` : ""}</div><div class="small" id="netErr">${esc(netErr)}</div></div>
    </div></div>
    <div class="card" style="margin-top:14px"><div class="label">Prices this quarter</div>${marketStrip(q)}</div>`;
  $("#autoTog").onchange = e => { ui.auto = e.target.checked; store.set("htl_auto", ui.auto); };
  $("#readBtn").onclick = () => speak(newsLines(q));
  $$("[data-s]").forEach(b => b.onclick = () => { secsPick = +b.dataset.s; $$("[data-s]").forEach(x => x.classList.toggle("on", x === b)); });
  $("#openBtn").onclick = () => { speechSynthesis && speechSynthesis.cancel(); op("trade", { secs: secsPick }); };
}
function updateNews() { const el = $("#pledgeNote"); if (el) el.textContent = G.count - G.pledged ? `${G.count - G.pledged} student(s) still pledging.` : ""; }

/* ---------- trading ---------- */
function left() { return G.opened ? Math.max(0, Math.round((G.opened + G.secs * 1000 - Date.now()) / 1000)) : 0; }
function renderTrade() {
  const q = G.q, sc = D.Q[q];
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">${esc(D.QLABEL(q))} · trading</div><h2>${esc(sc.title)}</h2></div>
      <div style="display:flex;gap:10px;align-items:center"><span class="timer" id="timer"></span><button class="btn ghost sm" id="plus">+30s</button></div>${codeChip()}</div>
    <div class="board"><div class="grid" style="align-content:start">
      <div class="card"><div class="label">This quarter's news</div><ol class="htl-news">${sc.news.map((n, i) => `<li><b>${i + 1}</b><span>${esc(n)}</span></li>`).join("")}</ol>
        <div>${sc.forced ? `<span class="flag">⚠️ Decision card: ${esc(sc.forced.prompt)}</span>` : ""}${sc.paycheck ? `<span class="flag">💵 Payday: +$1,000</span>` : ""}</div></div>
      <div class="card"><div class="label">On the feed (not all true)</div>${feed(q)}</div>
      <div class="card"><div class="label">Prices this quarter</div>${marketStrip(q)}</div>
    </div>
    <div class="grid" style="align-content:start">
      <div class="card"><div class="tabs2">${[["status", "Who's done"], ["returns", "Returns"], ["discipline", "Discipline"]].map(([k, l]) => `<button data-t="${k}" class="${ui.tab === k ? "on" : ""}">${l}</button>`).join("")}</div><div id="dyn"></div></div>
      <div class="card"><div class="actions" style="justify-content:space-between;margin-top:0"><button class="btn ghost" id="backBtn">Back to the news</button><button class="btn big" id="nextBtn">${q === 11 ? "Ring the Final Bell" : "Next quarter →"}</button></div><div class="small" id="netErr">${esc(netErr)}</div></div>
    </div></div>`;
  $$("[data-t]").forEach(b => b.onclick = () => { ui.tab = b.dataset.t; $$("[data-t]").forEach(x => x.classList.toggle("on", x === b)); updateTrade(); });
  $("#plus").onclick = () => op("extend", { secs: 30 });
  $("#backBtn").onclick = () => op("back");
  $("#nextBtn").onclick = () => {
    const notDone = G.players.filter(p => p.arch && !(p.done || []).includes(q)).length;
    const missing = sc.forced || sc.paycheck ? G.players.filter(p => p.arch && ((sc.forced && !p.cards[q + ":forced"]) || (sc.paycheck && !p.cards[q + ":paycheck"]))).length : 0;
    if ((notDone || missing) && !confirm(`${notDone} student(s) haven't tapped Done${missing ? ` and ${missing} haven't submitted their decision card` : ""}. Move on anyway?`)) return;
    op("next");
  };
  clearInterval(tickT); tickT = setInterval(() => { const el = $("#timer"); if (!el || G.phase !== "trade") return clearInterval(tickT); const l = left(); el.textContent = Math.floor(l / 60) + ":" + String(l % 60).padStart(2, "0"); el.classList.toggle("low", l <= 20); }, 500);
  updateTrade();
}
function updateTrade() {
  const el = $("#dyn"); if (!el) return; const q = G.q, sc = D.Q[q];
  if (ui.tab === "status") {
    const pl = G.players.filter(p => p.arch);
    const cardOk = p => (!sc.forced || p.cards[q + ":forced"]) && (!sc.paycheck || p.cards[q + ":paycheck"]);
    el.innerHTML = `<div class="label">Done: ${G.doneCount} of ${pl.length}${sc.forced || sc.paycheck ? ` · Decision cards: ${pl.filter(cardOk).length} of ${pl.length}` : ""}</div>
      <div class="tiles">${pl.map(p => { const dn = (p.done || []).includes(q); return `<div class="tile ${dn ? "done" : ""}"><div><div class="nm">${esc(p.name)}</div><div class="st">${D.ARCH[p.arch].icon} ${dn ? "Done" : "Trading..."}${(sc.forced || sc.paycheck) && !cardOk(p) ? " · card due" : ""}</div></div></div>`; }).join("")}</div>
      ${G.count - pl.length ? `<div class="small" style="margin-top:6px">${G.count - pl.length} student(s) haven't pledged.</div>` : ""}`;
  } else el.innerHTML = board(ui.tab, q, "trade");
}
function board(kind, q, phase, n = 10) {
  const rows = boards(G.players, q, phase);
  if (kind === "returns") {
    const list = rows.map(r => ({ nm: r.p.name, ic: D.ARCH[r.p.arch].icon, v: r.val, x: r.ret }));
    if (phase === "final") { const g = S.ghost(); list.push({ nm: "The Ghost (undisciplined)", ic: "👻", v: g.value, x: (g.value / g.contributed - 1) * 100, ghost: true }); }
    list.sort((a, b) => b.v - a.v);
    return `<table class="lb"><tr><th></th><th>Student</th><th class="r">Portfolio</th><th class="r">Return</th></tr>${list.slice(0, phase === "final" ? 99 : n).map((r, i) => `<tr class="${r.ghost ? "ghost" : ""}"><td class="pl">${i + 1}</td><td class="nm">${r.ic} ${esc(r.nm)}</td><td class="r num">${money(r.v)}</td><td class="r ${cls(r.x)}">${pct(r.x)}</td></tr>`).join("")}</table>`;
  }
  const list = rows.map(r => ({ nm: r.p.name, ic: D.ARCH[r.p.arch].icon, x: r.disc, d: r.ev ? r.ev.decisions : 0 })).sort((a, b) => b.x - a.x || b.d - a.d);
  return `<table class="lb"><tr><th></th><th>Student</th><th class="r">Discipline</th></tr>${list.slice(0, phase === "final" ? 99 : n).map((r, i) => `<tr><td class="pl">${i + 1}</td><td class="nm">${r.ic} ${esc(r.nm)}</td><td class="r"><b>${r.x.toFixed(0)}%</b></td></tr>`).join("")}</table>
    <div class="small" style="margin-top:6px">${phase === "final" ? "All 12 quarters." : `Through Q${q - 1}. Discipline counts trades, required actions and decision cards.`}</div>`;
}
const boardPair = q => `<div class="grid" style="grid-template-columns:1fr 1fr"><div><div class="htl-sec">Top returns</div>${board("returns", q, "news", 5)}</div><div><div class="htl-sec">Top discipline</div>${board("discipline", q, "news", 5)}</div></div>`;

/* ---------- final ---------- */
function grades() {
  const rows = G.players.filter(p => p.arch).map(p => { const ev = S.evaluate(p, 12); return { p, ev, ret: S.ret(ev) }; });
  const elig = rows.filter(r => r.ev.disc >= 0.9).sort((a, b) => b.ev.value - a.ev.value).slice(0, 3).map(r => r.p.gid);
  rows.forEach(r => r.bonus = elig.includes(r.p.gid) ? 3 : 0);
  return rows;
}
function renderFinal() {
  const sc = D.Q[12], rows = grades();
  const tabs = [["returns", "Returns"], ["discipline", "Discipline"], ["arch", "Archetypes"], ["badges", "Badges"], ["grades", "Gradebook"]];
  let body = "";
  if (ui.ftab === "returns" || ui.ftab === "discipline") body = board(ui.ftab, 12, "final");
  else if (ui.ftab === "arch") {
    const by = {}; rows.forEach(r => { (by[r.p.arch] = by[r.p.arch] || []).push(r); });
    const gh = S.ghost();
    body = `<table class="lb"><tr><th>Investor</th><th class="r">Students</th><th class="r">Avg. return</th><th class="r">Avg. discipline</th></tr>${D.ARCH_ORDER.filter(k => by[k]).map(k => { const L = by[k], ar = L.reduce((s, r) => s + r.ret, 0) / L.length, ad = L.reduce((s, r) => s + r.ev.disc, 0) / L.length * 100; return [k, ar, ad, L.length]; }).sort((a, b) => b[1] - a[1]).map(([k, ar, ad, n]) => `<tr><td class="nm">${D.ARCH[k].icon} ${esc(D.ARCH[k].name)} <span class="small">${esc(D.ARCH[k].style)}</span></td><td class="r">${n}</td><td class="r ${cls(ar)}">${pct(ar)}</td><td class="r"><b>${ad.toFixed(0)}%</b></td></tr>`).join("")}
      <tr class="ghost"><td class="nm">👻 The Ghost <span class="small">chased ZYPH, sold at the bottom</span></td><td class="r">1</td><td class="r neg">${pct((gh.value / 12000 - 1) * 100)}</td><td class="r">0%</td></tr></table>
      <div class="lessonbox" style="background:#FBF1F2;border-left:6px solid var(--orange);border-radius:0 10px 10px 0;padding:10px 14px;font-size:19px;margin-top:12px">This market rewarded some styles more than others. A different 3 years (a steady bull market, say) would crown a different winner. The question for every student: <b>did your strategy fail, or did you fail your strategy?</b></div>`;
  } else if (ui.ftab === "badges") {
    body = `<table class="lb"><tr><th>Badge</th><th>Earned by</th><th class="r">Students</th></tr>${BADGES.map(([b, x]) => { const who = rows.filter(r => r.ev.badges.includes(b)); return `<tr><td class="nm">${esc(b)}</td><td style="font-size:15px">${esc(x)}<div class="small">${who.map(r => esc(r.p.name)).join(", ")}</div></td><td class="r"><b>${who.length}</b></td></tr>`; }).join("")}</table>`;
  } else {
    body = `<div class="actions" style="justify-content:flex-start;margin-top:0"><button class="btn dk" id="csv">Download CSV</button></div>
      <table class="lb" style="font-size:15px"><tr><th>Student</th><th>Investor</th><th class="r">Discipline /70</th><th class="r">Journal /20</th><th class="r">Bonus</th><th class="r">Subtotal /90</th><th>Reflection (/10)</th><th class="r">Final value</th></tr>
      ${rows.sort((a, b) => a.p.name.localeCompare(b.p.name)).map(r => `<tr><td class="nm">${esc(r.p.name)}</td><td>${D.ARCH[r.p.arch].icon} ${esc(D.ARCH[r.p.arch].name)}</td><td class="r">${r.ev.points.disc}</td><td class="r">${r.ev.points.journal}</td><td class="r">${r.bonus ? "+3" : ""}</td><td class="r"><b>${(r.ev.points.disc + r.ev.points.journal + r.bonus).toFixed(1)}</b></td><td style="font-size:14px">${r.p.reflect ? `<details><summary>Read</summary><p><b>Tempted:</b> ${esc(r.p.reflect.tempted)}</p><p><b>Did:</b> ${esc(r.p.reflect.did)}</p><p><b>Held:</b> ${esc(r.p.reflect.held)}</p></details>` : `<span class="small">Not yet</span>`}</td><td class="r num">${money(r.ev.value)}</td></tr>`).join("")}</table>`;
  }
  $("#view").innerHTML = `<div class="topbar"><div class="yr"><div class="sub">Three years later</div><h2>Final Bell</h2></div><div style="display:flex;gap:8px"><button class="btn ghost" id="readBtn">🔊 Read aloud</button></div></div>
    <div class="board"><div class="grid" style="align-content:start">
      <div class="card"><div class="label">Final news</div><ol class="htl-news big">${sc.news.map((n, i) => `<li><b>${i + 1}</b><span>${esc(n)}</span></li>`).join("")}</ol></div>
      <div class="card"><div class="tabs2">${tabs.map(([k, l]) => `<button data-f="${k}" class="${ui.ftab === k ? "on" : ""}">${l}</button>`).join("")}</div>${body}</div></div>
    <div class="grid" style="align-content:start">
      <div class="card"><div class="label">Fear and Greed</div>${gauge(D.MACRO.fg[12], ui.lastFg)}</div>
      <div class="card"><div class="label">The market over 3 years · Hersey 500</div>${spark("HX500", 12, { w: 400, h: 120, big: true })}<div class="small">From $100.00 to ${money(S.price("HX500", 12), true)}, through a 29% drop.</div></div>
      <div class="card"><div class="label">Reflections in</div><div style="font-family:Oswald,Arial;font-size:44px;color:var(--brown)">${G.players.filter(p => p.reflect).length} / ${rows.length}</div><div class="small">Students write theirs on the report card on their iPads.</div></div>
    </div></div>`;
  ui.lastFg = D.MACRO.fg[12];
  $$("[data-f]").forEach(b => b.onclick = () => { ui.ftab = b.dataset.f; renderFinal(); });
  $("#readBtn").onclick = () => speak(newsLines(12));
  if ($("#csv")) $("#csv").onclick = () => downloadCSV(rows);
}
function downloadCSV(rows) {
  const q = s => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = ["Student", "Investor", "Dials", "Pledge sentence", "Final value", "Return %", "Discipline %", "Discipline points (70)", "Journal %", "Journal points (20)", "Bonus", "Subtotal (90)", "Violations", "Badges", "Most tempted", "What I did", "Did it hold"];
  const lines = rows.map(r => { const a = D.ARCH[r.p.arch], d = r.ev.dials; return [r.p.name, a.name, a.dials.map(([k, l, , , , , u]) => `${l}: ${d[k]}${u}`).join("; "), `I will never ${r.p.never} even if ${r.p.evenIf}`, r.ev.value.toFixed(2), r.ret.toFixed(1), (r.ev.disc * 100).toFixed(0), r.ev.points.disc, (r.ev.journal * 100).toFixed(0), r.ev.points.journal, r.bonus, (r.ev.points.disc + r.ev.points.journal + r.bonus).toFixed(1), r.ev.items.filter(i => !i.ok).map(i => `Q${i.q}: ${i.issues.join("; ")}`).join(" | "), r.ev.badges.join(", "), r.p.reflect ? r.p.reflect.tempted : "", r.p.reflect ? r.p.reflect.did : "", r.p.reflect ? r.p.reflect.held : ""].map(q).join(","); });
  const blob = new Blob([[head.map(q).join(","), ...lines].join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `hold-the-line-${sess.code}.csv`; a.click();
}

boot();
