// Hold the Line: student (iPad) screen. One student per iPad.
import { call, $, $$, store } from "./htl-client.js";
import { D, S, CSS, esc, money, pct, cls, chg, shares, gauge, spark, statList, pledgeCard, macroGrid, feed, BADGES } from "./htl-view.js";

document.head.insertAdjacentHTML("beforeend", `<style>${CSS}</style>`);
const SK = "htl_play";
let me = store.get(SK);          // {code, gid, key, name, pin}
let G = null, pollT = null, busy = false, conn = "", lastKey = "", lastSig = "";
const ui = { tab: "market", pick: null, draft: null, pledge: null, modal: null, fsec: 0 };

/* ---------- join ---------- */
function renderJoin(msg = "", showPin = false) {
  const code = new URLSearchParams(location.search).get("c") || (me && me.code) || "";
  $("#who").textContent = "";
  $("#view").innerHTML = `<div class="center card">
    <div class="label">Join Hold the Line</div><h2 style="font-size:30px;color:var(--brown)">Make a pledge. Keep it for 3 years.</h2>
    <label class="field"><span>Game code</span><input id="jCode" class="code" inputmode="numeric" pattern="[0-9]*" maxlength="5" autocomplete="off" value="${esc(code)}"></label>
    <label class="field"><span>Your name (first name and last initial)</span><input id="jName" maxlength="24" autocomplete="off" autocapitalize="words" placeholder="e.g. Maya R"></label>
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
  if (!name) return joinErr("Type your name.");
  $("#jGo").disabled = true;
  try {
    const r = await call("join", { code, name, pin: pin || undefined });
    me = { code, gid: r.gid, key: r.key, name: r.name, pin: r.pin }; store.set(SK, me);
    history.replaceState(null, "", "/htl?c=" + code); G = null; await refresh(true); startPoll();
  } catch (e) { joinErr(e.code === "name_taken" ? "That name is already in this game. If it's you rejoining, tap the rejoin link and enter your PIN." : e.message, e.code === "name_taken"); }
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
    const r = await call("state", { code: me.code, gid: me.gid, key: me.key, since: G ? G.v : undefined });
    conn = ""; if (!r.same) { if (!r.me) throw Object.assign(new Error(), { code: "not_in_game" }); G = r; const sig = JSON.stringify([r.phase, r.q, r.opened, r.secs, r.me]); if (sig !== lastSig || force) { lastSig = sig; render(); } else setConn(); } else setConn();
  } catch (e) {
    if (e.code === "no_game" || e.code === "not_in_game") { const code = me.code; me = null; store.del(SK); clearInterval(pollT); history.replaceState(null, "", "/htl?c=" + code); renderJoin(e.code === "no_game" ? "That game has ended." : "You were removed or rejoined on another iPad. Join again."); }
    else { conn = "Reconnecting..."; setConn(); }
  } finally { busy = false; }
}
function setConn() { const el = $("#conn"); if (el) el.textContent = conn; }
async function act(action, params) {
  const r = await call(action, { code: me.code, gid: me.gid, key: me.key, ...params });
  if (r.me && G) { G.me = r.me; }
  return r;
}

/* ---------- helpers ---------- */
const P = () => G.me;
const q = () => G.q;
const st = () => S.replay(P(), q());
const contrib = qq => D.START_CASH + Object.entries(D.PAYCHECK).filter(([x]) => +x <= qq).reduce((s, [, v]) => s + v, 0);
const canPledge = () => G.phase === "lobby" || (G.q === 0 && G.phase !== "final" && !(P().log || []).length);
function topStrip() {
  const s = st(), v = S.value(s, q()), r = (v / contrib(q()) - 1) * 100, sc = D.Q[q()];
  const left = G.phase === "trade" && G.opened ? Math.max(0, Math.round((G.opened + G.secs * 1000 - Date.now()) / 1000)) : null;
  return `<div class="htl-top"><div class="qt"><div class="sub">${esc(D.QLABEL(q()))}</div><h2>${esc(sc.title)}</h2></div>
    ${left != null ? `<div class="chip"><div class="v" id="tleft">${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}</div><div class="k">Time left</div></div>` : ""}
    <div class="chip"><div class="v">${money(v)}</div><div class="k">Portfolio</div></div>
    <div class="chip"><div class="v">${money(s.cash)}</div><div class="k">Cash</div></div>
    <div class="chip"><div class="v ${r >= 0 ? "" : ""}" style="color:${r >= 0 ? "#9BE3B0" : "#FF8A99"}">${pct(r)}</div><div class="k">Return</div></div></div>`;
}
setInterval(() => { const el = $("#tleft"); if (el && G && G.opened) { const left = Math.max(0, Math.round((G.opened + G.secs * 1000 - Date.now()) / 1000)); el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; } }, 1000);

/* ---------- render ---------- */
function render() {
  $("#who").textContent = me.name;
  const key = G.phase + ":" + G.q;
  if (key !== lastKey) { if (G.phase === "trade" && !lastKey.startsWith("trade")) ui.tab = "market"; if (G.phase === "trade") ui.tab = ui.tab || "market"; lastKey = key; ui.modal = null; ui.draft = null; ui.cdraft = null; const m = $("#htlModal"); if (m) m.classList.remove("on"); window.scrollTo(0, 0); }
  if (ui.modal) return; // don't redraw under an open trade sheet
  if (!P().arch && G.phase !== "final") { if (canPledge()) return renderPledge(); return renderLate(); }
  if (ui.pledge && canPledge()) return renderPledge();
  if (G.phase === "lobby") return renderLobby();
  if (G.phase === "news") return renderNews();
  if (G.phase === "trade") return renderTrade();
  return renderFinal();
}
function renderLate() { $("#view").innerHTML = `<div class="center card"><h2>The game has started</h2><p>Pledges close after the opening portfolio. Ask your teacher.</p></div>`; }
function renderLobby() {
  $("#view").innerHTML = `<div class="center" style="max-width:640px"><div class="card" style="text-align:center"><div class="label">You're in</div><div class="bignm">${esc(me.name)}</div>
    <div class="pinbox"><div class="small" style="color:#CFCFCF">Your PIN. Write it down in case your iPad restarts.</div><div class="v">${me.pin}</div></div></div>
    <div style="margin-top:14px">${pledgeCard(P())}</div>
    <div class="actions"><button class="btn ghost" id="chg">Change my pledge</button></div>
    <p style="font-size:18px;text-align:center">Waiting for the Opening Bell. You start with <b>$10,000</b>.</p><div class="status" id="conn">${esc(conn)}</div></div>`;
  $("#chg").onclick = () => { ui.pledge = { arch: P().arch, dials: { ...S.dialsOf(P()) }, never: P().never, evenIf: P().evenIf, sign: P().sign }; render(); };
}

/* ---------- the pledge ---------- */
function renderPledge(msg = "") {
  const p = ui.pledge || (ui.pledge = { arch: null, dials: {}, never: "", evenIf: "", sign: "" });
  const a = D.ARCH[p.arch];
  if (!a) {
    $("#view").innerHTML = `<div class="label">Step 1 of 2 · Pick the investor you'll follow</div>
      <h2 style="font-size:30px;color:var(--brown);margin-bottom:6px">Whose strategy will you pledge to?</h2>
      <p style="font-size:17px;margin:0 0 12px">You'll be graded on how faithfully you follow it, <b>not</b> on how much money you make.</p>
      <div class="htl-arch">${D.ARCH_ORDER.map(k => { const x = D.ARCH[k]; return `<button data-a="${k}"><span class="ic">${x.icon}</span><span class="an">${esc(x.name)}</span><span class="st">${esc(x.style)}</span><span style="font-size:16px">${esc(x.idea)}</span><ul>${x.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul></button>`; }).join("")}</div>
      ${P().arch ? `<div class="actions"><button class="btn ghost" id="keep">Keep my current pledge</button></div>` : ""}`;
    $$("[data-a]").forEach(b => b.onclick = () => { p.arch = b.dataset.a; p.dials = {}; for (const [k, , , , , def] of D.ARCH[p.arch].dials) p.dials[k] = def; renderPledge(); window.scrollTo(0, 0); });
    if ($("#keep")) $("#keep").onclick = () => { ui.pledge = null; render(); };
    return;
  }
  $("#view").innerHTML = `<div class="center" style="max-width:720px">
    <div class="label">Step 2 of 2 · Set your dials and sign</div>
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 style="font-size:30px;color:var(--brown)">${a.icon} ${esc(a.name)}</h2><button class="btn ghost sm" id="back">Pick a different investor</button></div>
      <div style="font-size:17px">${esc(a.idea)}</div>
      <div class="htl-sec">Locked rules</div><ul style="margin:0 0 0 18px;font-size:16px">${a.rules.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      <div class="htl-sec">Your dials</div>
      ${a.dials.map(([k, l, mn, mx, step, , u]) => `<div class="htl-dial"><div class="h"><span>${esc(l)}</span><b id="dv_${k}">${p.dials[k]}${u}</b></div>
        <input type="range" min="${mn}" max="${mx}" step="${step}" value="${p.dials[k]}" data-d="${k}" data-u="${u}"><div class="rg"><span>${mn}${u}</span><span>${mx}${u}</span></div></div>`).join("")}
      <div class="htl-sec">Your promise</div>
      <div style="font-size:18px;display:grid;gap:6px">I will never <input class="htl-note" id="never" maxlength="80" placeholder="e.g. buy a stock just because it's going up" value="${esc(p.never)}">
      even if <input class="htl-note" id="evenIf" maxlength="80" placeholder="e.g. my friends are getting rich" value="${esc(p.evenIf)}"></div>
      <div class="htl-sec">Sign it</div><input class="htl-note" id="sign" maxlength="30" placeholder="Type your full name" value="${esc(p.sign)}" style="font-family:'Brush Script MT','Segoe Script',cursive;font-size:28px">
      <div class="actions" style="justify-content:stretch"><button class="btn big" id="signGo" style="width:100%">Sign my pledge</button></div>
      ${msg ? `<div class="err">${esc(msg)}</div>` : ""}</div></div>`;
  $$("[data-d]").forEach(r => r.oninput = () => { p.dials[r.dataset.d] = +r.value; $("#dv_" + r.dataset.d).textContent = r.value + r.dataset.u; });
  ["never", "evenIf", "sign"].forEach(id => $("#" + id).oninput = e => p[id] = e.target.value);
  $("#back").onclick = () => { p.arch = null; renderPledge(); };
  $("#signGo").onclick = async () => {
    $("#signGo").disabled = true;
    try { await act("pledge", { arch: p.arch, dials: p.dials, never: p.never, evenIf: p.evenIf, sign: p.sign }); ui.pledge = null; G.v = -1; await refresh(true); }
    catch (e) { renderPledge(e.message); }
  };
}

/* ---------- news (eyes on the board) ---------- */
function renderNews() {
  const sc = D.Q[q()];
  $("#view").innerHTML = topStrip() + `<div class="lockedcard" style="margin-bottom:12px"><div class="label">Breaking news</div><h2>Eyes on the board 📺</h2>
    <div style="font-size:17px;color:#E6E6E6;margin-top:4px">Trading opens when your teacher is done reading the news.</div></div>
    <div class="card"><ol class="htl-news">${sc.news.map((n, i) => `<li><b>${i + 1}</b><span>${esc(n)}</span></li>`).join("")}</ol></div>
    <div style="margin-top:12px">${pledgeCard(P(), { small: true })}</div><div class="status" id="conn">${esc(conn)}</div>`;
}

/* ---------- trading ---------- */
function alerts() {
  const sc = D.Q[q()], cards = P().cards || {}, out = [];
  if (sc.forced) {
    const c = cards[q() + ":forced"];
    out.push(c ? `<div class="htl-alert done"><h3>✓ Decision card submitted</h3><div>${esc(sc.forced.prompt)} You chose <b>${esc(c.choice.toUpperCase())}</b>${c.asset && c.asset !== "cash" ? ` (${esc(c.asset)})` : ""}. <button class="link" data-card="forced">Change</button></div></div>`
      : `<div class="htl-alert"><h3>⚠️ Decision card: everyone must answer</h3><div style="font-size:17px">${esc(sc.forced.prompt)}</div><div class="actions" style="justify-content:flex-start;margin-top:6px"><button class="btn" data-card="forced">Make my decision</button></div></div>`);
  }
  if (sc.paycheck) {
    const c = cards[q() + ":paycheck"];
    out.push(c ? `<div class="htl-alert done"><h3>✓ Paycheck decision: ${c.choice === "invest" ? "invest it" : "keep as cash"}</h3><div>Now make the trades that match. <button class="link" data-card="paycheck">Change</button></div></div>`
      : `<div class="htl-alert"><h3>💵 Payday: $1,000 just landed in your cash</h3><div style="font-size:17px">Decide what your pledge says to do with it.</div><div class="actions" style="justify-content:flex-start;margin-top:6px"><button class="btn" data-card="paycheck">Make my decision</button></div></div>`);
  }
  return out.join("");
}
function renderTrade() {
  const sc = D.Q[q()], s = st(), doneNow = (P().done || []).includes(q());
  const seen = (P().seen || []).includes(q());
  const tabs = [["market", "Market"], ["portfolio", "My portfolio"], ["research", "Research" + (seen ? "" : '<span class="dot"></span>')], ["feed", "News & feed"], ["pledge", "My pledge"]];
  let body = "";
  if (ui.tab === "market") body = marketTab(s);
  else if (ui.tab === "portfolio") body = portfolioTab(s);
  else if (ui.tab === "research") body = `<div class="card"><div class="label">The economy this quarter</div>${macroGrid(q())}
      <div class="htl-sec">Research notes</div><ul style="margin:0 0 0 18px;font-size:17px;line-height:1.45">${sc.research.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
      <div class="htl-sec">The market (Hersey 500)</div>${spark("HX500", q(), { w: 600, h: 120 })}</div>`;
  else if (ui.tab === "feed") body = `<div class="card"><div class="label">Headlines</div><ol class="htl-news">${sc.news.map((n, i) => `<li><b>${i + 1}</b><span>${esc(n)}</span></li>`).join("")}</ol></div>
      <div class="card" style="margin-top:10px"><div class="label">Social feed and group chat</div>${feed(q())}<div class="small" style="margin-top:6px">Not everything you read here is true.</div></div>`;
  else body = pledgeCard(P());
  $("#view").innerHTML = topStrip() + alerts() + `<div class="htl-tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${ui.tab === k ? "on" : ""}">${l}</button>`).join("")}</div>` + body +
    `<div class="actions" style="justify-content:stretch;margin-top:16px"><button class="btn big ${doneNow ? "dk" : ""}" id="doneBtn" style="width:100%">${doneNow ? "✓ Done for this quarter (tap to keep trading)" : "I'm done for this quarter"}</button></div><div class="status" id="conn">${esc(conn)}</div>`;
  $$("[data-tab]").forEach(b => b.onclick = () => { ui.tab = b.dataset.tab; if (ui.tab === "research" && !seen) act("seen", { q: q() }).then(() => { const pl = P(); pl.seen = [...(pl.seen || []), q()]; }).catch(() => {}); renderTrade(); });
  $$("[data-k]").forEach(b => b.onclick = () => openTrade(b.dataset.k));
  $$("[data-card]").forEach(b => b.onclick = () => openCard(b.dataset.card));
  $("#doneBtn").onclick = async () => { try { await act("done", { q: q(), on: !doneNow }); renderTrade(); } catch (e) { alert(e.message); } };
  if ($("#undoBtn")) $("#undoBtn").onclick = async () => { if (!confirm("Undo your last trade?")) return; try { await act("undo", { q: q() }); renderTrade(); } catch (e) { alert(e.message); } };
}
function marketTab(s) {
  const qq = q(), card = k => {
    const a = D.A[k], p = S.price(k, qq), off = !S.tradable(k, qq), c = chg(k, qq), pe = S.pe(k, qq), dy = S.divYield(k, qq), own = s.h[k];
    if (off) return `<div class="htl-a off"><div class="t"><span class="tk">${k}</span><span class="pr">IPO Q${a.ipo}</span></div><div class="nm">${esc(a.name)}</div><div class="mini">Not listed yet</div></div>`;
    return `<button class="htl-a ${own ? "own" : ""}" data-k="${k}"><div class="t"><span class="tk">${k}</span><span class="pr">${money(p, true)}</span></div>
      <div class="nm">${esc(a.name)} · ${esc(a.sector)}</div>
      <div class="mini">${qq ? `<span class="${cls(c)}">Qtr <b>${pct(c)}</b></span>` : ""}<span>6-mo <b class="${cls(S.mom(k, qq))}">${pct(S.mom(k, qq), 0)}</b></span>${a.kind === "co" ? `<span>P/E <b>${pe == null ? "none" : pe.toFixed(1)}</b></span><span>Moat <b>${esc(a.moat)}</b></span>` : ""}${dy ? `<span>Yield <b>${dy.toFixed(1)}%</b></span>` : ""}</div>
      ${own ? `<div class="mini" style="color:var(--orange)">You own ${money(S.posVal(s, k, qq))}</div>` : ""}</button>`;
  };
  const cos = D.ORDER.filter(k => D.A[k].kind === "co"), funds = D.ORDER.filter(k => D.A[k].kind === "fund");
  return `<div class="htl-sec">Companies</div><div class="htl-mkt">${cos.map(card).join("")}</div><div class="htl-sec">Funds and other assets</div><div class="htl-mkt">${funds.map(card).join("")}</div>
    <div class="small" style="margin-top:8px">Tap any investment to see its full stat card and trade. Uninvested cash earns ${D.MACRO.fed[qq].toFixed(2)}% a year.</div>`;
}
function portfolioTab(s) {
  const qq = q(), v = S.value(s, qq), keys = Object.keys(s.h).sort((a, b) => S.posVal(s, b, qq) - S.posVal(s, a, qq));
  const mine = (P().log || []).filter(t => t.q === qq);
  return `<div class="card"><div class="label">Holdings</div><table><tr><th>Investment</th><th class="r">Shares</th><th class="r">Price</th><th class="r">Value</th><th class="r">% of total</th><th class="r">Gain/loss</th></tr>
    ${keys.map(k => { const val = S.posVal(s, k, qq), gl = val - s.cost[k]; return `<tr data-k="${k}" style="cursor:pointer"><td><b>${k}</b> <span class="small">${esc(D.A[k].name)}</span></td><td class="r num">${shares(s.h[k])}</td><td class="r num">${money(S.price(k, qq), true)}</td><td class="r num">${money(val)}</td><td class="r">${(val / v * 100).toFixed(1)}%</td><td class="r num ${cls(gl)}">${gl >= 0 ? "+" : ""}${money(gl)}</td></tr>`; }).join("")}
    <tr><td><b>Cash</b></td><td></td><td></td><td class="r num">${money(s.cash)}</td><td class="r">${(s.cash / v * 100).toFixed(1)}%</td><td></td></tr>
    <tr class="tot"><td><b>Total</b></td><td></td><td></td><td class="r num"><b>${money(v)}</b></td><td></td><td class="r small">Income so far: ${money(s.income)}</td></tr></table></div>
    <div class="card" style="margin-top:10px"><div class="label">Your trades this quarter</div>${mine.length ? `<ul style="margin:0 0 0 18px;font-size:16px">${mine.map(t => `<li>${t.side === "buy" ? "Bought" : "Sold"} <b>${t.a}</b> ${t.side === "buy" ? money(t.amt) : shares(t.amt) + " shares"} · <i>${esc(D.TAGS[t.why])}</i>${t.note ? ` · "${esc(t.note)}"` : ""}</li>`).join("")}</ul>
      <div class="actions" style="justify-content:flex-start"><button class="btn ghost sm" id="undoBtn">Undo my last trade</button></div>` : `<div class="small">No trades yet this quarter.</div>`}</div>`;
}

/* ---------- trade sheet ---------- */
function modal(html) {
  let m = $("#htlModal"); if (!m) { document.body.insertAdjacentHTML("beforeend", `<div class="modal" id="htlModal"><div class="mbox" id="htlBox"></div></div>`); m = $("#htlModal"); }
  $("#htlBox").innerHTML = html; m.classList.add("on");
  m.onclick = e => { if (e.target === m) closeModal(); };
}
function closeModal() { const m = $("#htlModal"); if (m) m.classList.remove("on"); ui.modal = null; render(); }
const reasonSelect = (sel) => `<select class="htl-sel" id="why"><option value="">Pick the rule behind this…</option>${S.tagsFor(P().arch).map(([k, l]) => `<option value="${k}" ${sel === k ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
function openTrade(k, side = "buy", msg = "") {
  ui.modal = "trade"; const s = st(), qq = q(), held = s.h[k] || 0, p = S.price(k, qq), a = D.A[k];
  const d = ui.draft && ui.draft.k === k ? ui.draft : (ui.draft = { k, side: held && side === "sell" ? "sell" : "buy", amt: "", why: "", note: "" });
  const sell = d.side === "sell";
  modal(`<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><h2 style="font-size:30px;color:var(--brown)">${k} <span style="font-size:18px;color:var(--muted)">${esc(a.name)}</span></h2><button class="btn ghost sm" id="mx">Close</button></div>
    <div style="font-size:15px;color:var(--brown2);margin:2px 0 8px">${esc(a.blurb)}</div>
    ${spark(k, qq, { w: 600, h: 90 })}
    <div class="htl-stats">${statList(k, qq).map(([x, y]) => `<div><span>${esc(x)}</span><span>${esc(y)}</span></div>`).join("")}</div>
    <div class="small" style="margin-top:6px">You own ${held ? `<b>${shares(held)} shares</b> worth <b>${money(held * p)}</b>` : "none"} · Cash: <b>${money(s.cash)}</b></div>
    <div class="seg" style="grid-template-columns:1fr 1fr;margin-top:12px"><button data-side="buy" class="${!sell ? "on" : ""}">Buy</button><button data-side="sell" class="${sell ? "on pass" : ""}" ${held ? "" : "disabled"}>Sell</button></div>
    <div class="htl-sec">${sell ? "Shares to sell" : "Dollars to invest"}</div>
    <input class="htl-in" id="amt" inputmode="decimal" placeholder="${sell ? "shares" : "$"}" value="${esc(d.amt)}">
    <div class="htl-quick">${sell ? [["25%", .25], ["50%", .5], ["All", 1]].map(([l, f]) => `<button data-f="${f}">${l}</button>`).join("") : [["$500", 500], ["$1,000", 1000], ["25% of cash", -.25], ["50% of cash", -.5], ["All cash", -1]].map(([l, f]) => `<button data-f="${f}">${l}</button>`).join("")}</div>
    <div class="small" id="est" style="margin-top:6px"></div>
    <div class="htl-sec">Why? (your trade journal)</div>${reasonSelect(d.why)}
    <input class="htl-note" id="note" maxlength="140" placeholder="Optional note (required if you pick Other)" value="${esc(d.note)}" style="margin-top:6px">
    <div class="actions" style="justify-content:stretch"><button class="btn big" id="go" style="width:100%">${sell ? "Sell" : "Buy"} ${k}</button></div>
    ${msg ? `<div class="err">${esc(msg)}</div>` : ""}`);
  const est = () => { const x = parseFloat($("#amt").value); $("#est").textContent = !(x > 0) ? "" : sell ? `≈ ${money(x * p, true)} at ${money(p, true)} a share` : `≈ ${shares(x / p)} shares at ${money(p, true)}`; };
  $("#amt").oninput = () => { d.amt = $("#amt").value; est(); }; est();
  $("#why").onchange = () => d.why = $("#why").value; $("#note").oninput = () => d.note = $("#note").value;
  $$("[data-side]").forEach(b => b.onclick = () => { if (b.disabled) return; d.side = b.dataset.side; d.amt = ""; openTrade(k, d.side); });
  $$("[data-f]").forEach(b => b.onclick = () => { const f = +b.dataset.f; const v = sell ? held * f : f < 0 ? s.cash * -f : Math.min(f, s.cash); d.amt = sell ? (f === 1 ? String(held) : v.toFixed(4)) : (Math.floor(v * 100) / 100).toFixed(2); $("#amt").value = d.amt; est(); });
  $("#mx").onclick = () => { ui.draft = null; closeModal(); };
  $("#go").onclick = async () => {
    const x = parseFloat(d.amt);
    if (!(x > 0)) return openTrade(k, d.side, "Enter an amount.");
    if (!d.why) return openTrade(k, d.side, "Pick the rule behind this trade. That's your trade journal.");
    $("#go").disabled = true;
    try { await act("trade", { q: qq, a: k, side: d.side, amt: x, why: d.why, note: d.note }); ui.draft = null; ui.tab = "portfolio"; closeModal(); }
    catch (e) { openTrade(k, d.side, e.message); }
  };
}
function openCard(kind, msg = "") {
  ui.modal = "card"; const sc = D.Q[q()], c = (P().cards || {})[q() + ":" + kind] || {};
  const d = ui.cdraft && ui.cdraft.kind === kind ? ui.cdraft : (ui.cdraft = { kind, choice: c.choice || "", why: c.why || "", note: c.note || "" });
  const choices = kind === "forced" ? [["buy", "Buy"], ["sell", "Sell"], ["hold", "Hold"]] : [["invest", "Invest it"], ["cash", "Keep as cash"]];
  modal(`<div class="label">${kind === "forced" ? "Decision card" : "Paycheck decision"}</div>
    <h2 style="font-size:28px;color:var(--brown)">${esc(kind === "forced" ? sc.forced.prompt : "What will you do with your $1,000 paycheck?")}</h2>
    ${kind === "forced" && sc.forced.asset === "LARGEST" ? `<div class="small">Your largest position is the one this card is about.</div>` : ""}
    <div class="seg" style="grid-template-columns:repeat(${choices.length},1fr);margin-top:12px">${choices.map(([v, l]) => `<button data-c="${v}" class="${d.choice === v ? "on" : ""}">${l}</button>`).join("")}</div>
    <div class="htl-sec">Which rule of yours drives this?</div>${reasonSelect(d.why)}
    <input class="htl-note" id="note" maxlength="140" placeholder="Optional note (required if you pick Other)" value="${esc(d.note)}" style="margin-top:6px">
    <div class="small" style="margin-top:8px">This card records your decision. If you choose to buy, sell or invest, make that trade in the Market too.</div>
    <div class="actions"><button class="btn ghost" id="mx">Cancel</button><button class="btn big" id="go">Submit</button></div>${msg ? `<div class="err">${esc(msg)}</div>` : ""}`);
  $$("[data-c]").forEach(b => b.onclick = () => { d.choice = b.dataset.c; openCard(kind); });
  $("#why").onchange = () => d.why = $("#why").value; $("#note").oninput = () => d.note = $("#note").value;
  $("#mx").onclick = () => { ui.cdraft = null; closeModal(); };
  $("#go").onclick = async () => {
    if (!d.choice) return openCard(kind, "Make your choice first.");
    if (!d.why) return openCard(kind, "Pick the rule behind your decision.");
    $("#go").disabled = true;
    try { await act("card", { q: q(), kind, choice: d.choice, why: d.why, note: d.note }); ui.cdraft = null; closeModal(); }
    catch (e) { openCard(kind, e.message); }
  };
}

/* ---------- final report card ---------- */
function renderFinal() {
  if (!P().arch) { $("#view").innerHTML = `<div class="center card"><h2>The game is over</h2></div>`; return; }
  const ev = S.evaluate(P(), 12), gh = S.ghost(), r = S.ret(ev), sc = D.Q[12], rf = P().reflect;
  const bad = ev.items.filter(i => !i.ok), badTags = ev.items.filter(i => !i.req && !i.tagOk);
  const a = D.ARCH[P().arch];
  $("#view").innerHTML = `<div class="card" style="margin-bottom:12px"><div class="label">Final Bell</div><ol class="htl-news">${sc.news.map((n, i) => `<li><b>${i + 1}</b><span>${esc(n)}</span></li>`).join("")}</ol></div>
  <div class="grid htl-rc" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
    <div class="card dark"><div class="label">Discipline Score</div><div class="big" style="color:#fff">${(ev.disc * 100).toFixed(0)}%</div><div class="small">${ev.good} of ${ev.decisions} decisions followed your ${esc(a.name)} pledge · <b style="color:#fff">${ev.points.disc} / 70 points</b></div></div>
    <div class="card"><div class="label">Trade Journal</div><div class="big">${(ev.journal * 100).toFixed(0)}%</div><div class="small">${ev.tagGood} of ${ev.tagged} reasons matched the facts · <b>${ev.points.journal} / 20 points</b></div></div>
    <div class="card"><div class="label">Final portfolio (not graded)</div><div class="big">${money(ev.value)}</div><div class="small">${pct(r)} on ${money(ev.contributed)} put in. The Ghost (undisciplined) ended with ${money(gh.value)}.</div></div></div>
  <div class="card" style="margin-top:12px"><div class="label">Badges</div><div class="htl-badges">${BADGES.map(([b, x]) => `<span class="htl-badge ${ev.badges.includes(b) ? "" : "off"}" title="${esc(x)}">${esc(b)}</span>`).join("")}</div></div>
  <div class="card" style="margin-top:12px"><div class="label">Where you broke your pledge</div>${bad.length ? `<ul class="htl-viol">${bad.map(i => `<li><b>Q${i.q}:</b> ${esc(i.what.replace(/^Required: .*/, "Required action"))}: ${esc(i.issues.join("; "))}</li>`).join("")}</ul>` : `<div style="font-size:18px">Nowhere. You held the line. 🛡️</div>`}
    ${badTags.length ? `<div class="label" style="margin-top:12px">Journal reasons that didn't match the facts</div><ul class="htl-viol">${badTags.map(i => `<li><b>Q${i.q}:</b> ${esc(i.what)} · you wrote "${esc(D.TAGS[i.why] || "no reason")}"</li>`).join("")}</ul>` : ""}</div>
  <div style="margin-top:12px">${pledgeCard(P())}</div>
  <div class="card" style="margin-top:12px"><div class="label">Reflection (10 points, scored by your teacher)</div>
    ${rf ? `<div style="font-size:17px"><p><b>Most tempted:</b> ${esc(rf.tempted)}</p><p><b>What I did and why:</b> ${esc(rf.did)}</p><p><b>Did my "I will never" sentence hold?</b> ${esc(rf.held)}</p></div><div class="small">Submitted. You can edit it below.</div>` : ""}
    <label class="field"><span>1. When were you most tempted to break your pledge?</span><textarea class="htl-note" id="r1" maxlength="600">${esc(rf ? rf.tempted : "")}</textarea></label>
    <label class="field"><span>2. What did you do, and why?</span><textarea class="htl-note" id="r2" maxlength="600">${esc(rf ? rf.did : "")}</textarea></label>
    <label class="field"><span>3. "I will never ${esc(P().never)} even if ${esc(P().evenIf)}." Did it hold?</span><textarea class="htl-note" id="r3" maxlength="600">${esc(rf ? rf.held : "")}</textarea></label>
    <div class="actions"><button class="btn big" id="rGo">${rf ? "Update my reflection" : "Submit my reflection"}</button></div><div id="rMsg"></div></div>
  <div class="status" id="conn">${esc(conn)}</div>`;
  $("#rGo").onclick = async () => {
    $("#rGo").disabled = true;
    try { await act("reflect", { tempted: $("#r1").value, did: $("#r2").value, held: $("#r3").value }); renderFinal(); }
    catch (e) { $("#rMsg").innerHTML = `<div class="err">${esc(e.message)}</div>`; $("#rGo").disabled = false; }
  };
}

/* ---------- boot ---------- */
if (me) { refresh(true).then(startPoll); } else renderJoin();
