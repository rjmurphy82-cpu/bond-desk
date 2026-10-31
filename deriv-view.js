// Unit 5 Derivatives Live: pieces shared by the projector (deriv-host.js) and the iPads (deriv-play.js).
import { GAMES, ORDER, UNIT, Q_SECS, fmt, needed, exSettle, exBudget, exAsk, exBid } from "./deriv-data.js";
export { GAMES, ORDER, UNIT, Q_SECS, fmt, needed, exSettle, exBudget, exAsk, exBid };
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const SHAPES = ["▲", "◆", "●", "■"];
export const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

// The game as played: the exchange uses only the number of quarters the host picked
const gcache = new Map();
export const game = S => { const G = GAMES[S.game]; if (!S.nr || S.nr >= G.rounds.length) return G; const k = G.id + ":" + S.nr; if (!gcache.has(k)) gcache.set(k, { ...G, rounds: G.rounds.slice(0, S.nr) }); return gcache.get(k); };
export const round = S => GAMES[S.game].rounds[S.r];
export const dec = (S, r, gid) => (S.decisions[r] || {})[gid] || null;
export const answerable = (G, r) => G.kind !== "story" || (G.rounds[r] && G.rounds[r].t === "q");
// Exchange: settle a quarter once per state version
const scache = new Map();
export function settle(S, r) { const k = S.game + ":" + S.v + ":" + r; if (!scache.has(k)) { if (scache.size > 60) scache.clear(); scache.set(k, exSettle(GAMES[S.game].rounds[r], S.decisions[r] || {}, S.groups)); } return scache.get(k); }

// A desk group's result for one round (no answer = the desk's default choice)
export function deskResult(G, r, d) { const R = G.rounds[r]; const pick = d && !d.a ? d : G.dflt; return { ...G.result(R, pick), missing: !d }; }

// Last round whose results everyone may see
export function shownUpto(S) { return S.phase === "final" ? game(S).rounds.length - 1 : S.phase === "reveal" ? S.r : S.r - 1; }

// Standings through round `upto`. Desk: start value + every round's result. Story: total points.
export function standings(S, upto) {
  const G = game(S);
  const rows = S.groups.map(g => {
    let total = 0, right = 0, last = 0, lastPick = null;
    for (let r = 0; r <= upto; r++) {
      if (!answerable(G, r)) continue;
      const d = dec(S, r, g.gid);
      if (G.kind === "story") { const p = d ? d.pts || 0 : 0; total += p; if (p > 0) right++; if (r === upto) last = p; }
      else if (G.kind === "exchange") { const x = settle(S, r).byGid[g.gid]; const p = x ? x.points : 0; total += p; if (r === upto) { last = p; lastPick = x; } }
      else { const x = deskResult(G, r, d); total += x.delta; if (r === upto) { last = x.delta; lastPick = x; } }
    }
    return { g, value: (G.kind === "story" ? 0 : G.metric.start) + total, right, last, lastPick };
  });
  rows.sort((a, b) => b.value - a.value || b.right - a.right || a.g.name.localeCompare(b.g.name));
  rows.forEach(r => r.place = rows.filter(o => o.value > r.value).length + 1);
  return rows;
}
// The "do nothing" benchmark for a desk: every round at the default choice
export function bench(G, upto) { let v = G.metric.start; for (let r = 0; r <= upto; r++) v += G.kind === "exchange" ? exSettle(G.rounds[r], {}, [{ gid: "x", role: "buy" }]).byGid.x.points : deskResult(G, r, null).delta; return v; }
export const deltaText = (G, v) => G.kind === "exchange" ? fmt.num(v) + " pts" : G.metric.higher ? fmt.sgn(v) : fmt.usd(-v);
export const show = (G, v) => G.kind === "story" ? fmt.num(v) : G.metric.show(v);
export const qIndex = (G, r) => G.rounds.slice(0, r + 1).filter(x => x.t === "q").length;
export const roundLabel = (G, r) => G.kind === "exchange" ? `Quarter ${r + 1} of ${G.rounds.length}` : G.kind === "desk" ? `Round ${r + 1} of ${G.rounds.length}` : G.rounds[r].t === "q" ? `Question ${qIndex(G, r)} of ${G.rounds.filter(x => x.t === "q").length}` : G.rounds[r].t === "card" ? "Story" : "Leaderboard";

// Seconds left on a story question, using the server clock
export function secsLeft(S, skew) { if (!S.openedAt) return Q_SECS; return Math.max(0, Math.ceil((Q_SECS * 1000 - (Date.now() + skew - S.openedAt)) / 1000)); }

// The briefing a desk group reads before deciding
export function briefHTML(G, R, big) {
  return `<div class="card brief ${big ? "big" : ""}">${R.who ? `<div class="label">${esc(R.who)}</div>` : ""}<p class="bline">${esc(R.brief || G.pitch)}</p>
    <div class="facts">${G.facts(R).map(([k, v]) => `<div class="fact"><div class="v">${esc(v)}</div><div class="k">${esc(k)}</div></div>`).join("")}</div>
    <div class="label" style="margin-top:12px">The news</div><ul class="newsl">${R.news.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>`;
}
export function resultTable(x) {
  return `<table class="brk">${x.rows.map(([a, b, c]) => `<tr><td>${esc(a)}${b ? `<div class="small">${esc(b)}</div>` : ""}</td><td class="r">${esc(c)}</td></tr>`).join("")}</table>`;
}
export function storyCardHTML(R) { return `<div class="storycard"><div class="label">The story</div><h2>${esc(R.title)}</h2><p>${esc(R.text)}</p></div>`; }

/* ---------- The Futures Exchange: shared pieces ---------- */
const px = v => fmt.usd(v, true);
export const roleOf = (S, gid) => ((S.groups || []).find(g => g.gid === gid) || {}).role || "buy";
export function exSheetHTML(G, R, role, big) {
  const co = G.roles[role], B = exBudget(R);
  return `<div class="card brief ${big ? "big" : ""}"><div class="label">${esc(co.short)} · ${esc(co.name)}</div><p class="bline">${esc(co.what)}</p>
    <div class="tblwrap"><table class="exsheet"><tr><th>Commodity</th><th class="r">You ${role === "buy" ? "need" : "will sell"}</th><th class="r">Posted futures price</th><th class="r">Budget</th></tr>
    ${G.comms.map(c => `<tr><td><b>${c.name}</b><div class="small">1 contract = ${fmt.num(c.size)} ${c.unit}s</div></td><td class="r">${R.N[c.k]} contract${R.N[c.k] > 1 ? "s" : ""}</td><td class="r">${px(R.r[c.k])} / ${c.unit}</td><td class="r">${fmt.usd(R.r[c.k] * c.size * R.N[c.k])}</td></tr>`).join("")}
    <tr class="tot"><td>Total</td><td class="r">${Object.values(R.N).reduce((a, b) => a + b, 0)} contracts</td><td></td><td class="r">${fmt.usd(B)}</td></tr></table></div>
    <div class="small" style="margin-top:6px">Your bank lets you trade up to <b>${R.margin} contracts</b> this quarter, so you can't hedge everything. Pick what matters most.</div></div>`;
}
export function exReportHTML(R, big) {
  return `<div class="card brief ${big ? "big" : ""}"><div class="label">Market report · ${esc(R.season)}</div><ol class="newsl report">${R.report.map(n => `<li>${esc(n)}</li>`).join("")}</ol>
    <div class="small" style="margin-top:6px">Not every item matters. Some clues only make sense together.</div></div>`;
}
// The order ticket. d = {orders:{k:{side,qty,lim}}}. Buttons carry data-act for the page to wire up.
export function exTicketHTML(G, R, d) {
  const o = (d && d.orders) || {}, used = G.comms.reduce((a, c) => a + (o[c.k] && o[c.k].side && o[c.k].side !== "none" ? +o[c.k].qty || 0 : 0), 0);
  return `<div class="ticket">${G.comms.map(c => { const x = o[c.k] || {}, on = x.side === "buy" || x.side === "sell", r = R.r[c.k];
    return `<div class="trow ${on ? "on" : ""}"><div class="tname"><b>${c.name}</b><span>Posted ${px(r)} · market maker buys at ${px(exBid(c, r))}, sells at ${px(exAsk(c, r))}</span></div>
      <div class="tseg">${[["buy", "Buy"], ["sell", "Sell"], ["none", "No trade"]].map(([v, l]) => `<button type="button" class="${(x.side || "none") === v ? "sel" : ""}" data-act="side" data-k="${c.k}" data-v="${v}">${l}</button>`).join("")}</div>
      <div class="tstep ${on ? "" : "off"}"><span class="tl">Contracts</span><button type="button" data-act="qty" data-k="${c.k}" data-v="-1" ${on ? "" : "disabled"}>−</button><b>${on ? x.qty : "–"}</b><button type="button" data-act="qty" data-k="${c.k}" data-v="1" ${on ? "" : "disabled"}>+</button></div>
      <div class="tstep ${on ? "" : "off"}"><span class="tl">${x.side === "sell" ? "Lowest price you'll take" : "Highest price you'll pay"}</span><button type="button" data-act="lim" data-k="${c.k}" data-v="-1" ${on ? "" : "disabled"}>−</button><b>${on ? px(x.lim) : "–"}</b><button type="button" data-act="lim" data-k="${c.k}" data-v="1" ${on ? "" : "disabled"}>+</button></div></div>`; }).join("")}
    <div class="tfoot ${used > R.margin ? "over" : ""}">Contracts used: <b>${used} of ${R.margin}</b></div></div>`;
}
// Apply one ticket tap to a draft; returns the new draft
export function exTap(G, R, d, act, k, v) {
  const o = { ...((d && d.orders) || {}) }, c = G.comms.find(x => x.k === k), cur = { ...(o[k] || {}) };
  if (act === "side") { if (v === "none") delete o[k]; else o[k] = { side: v, qty: cur.qty || 1, lim: cur.lim || R.r[k] }; }
  else if (act === "qty" && cur.side) o[k] = { ...cur, qty: Math.max(1, Math.min(R.margin, (cur.qty || 1) + +v)) };
  else if (act === "lim" && cur.side) { const n = Math.round(((cur.lim || R.r[k]) + +v * c.tick) * 100) / 100; o[k] = { ...cur, lim: Math.max(Math.round(R.r[k] * 0.7 * 100) / 100, Math.min(Math.round(R.r[k] * 1.3 * 100) / 100, n)) }; }
  return { orders: o };
}
export const exUsed = d => Object.values((d && d.orders) || {}).reduce((a, x) => a + (x.side ? +x.qty || 0 : 0), 0);
export function exOrderText(G, d) { const o = (d && d.orders) || {}; const parts = G.comms.filter(c => o[c.k]).map(c => `${o[c.k].side === "buy" ? "Buy" : "Sell"} ${o[c.k].qty} ${c.name.toLowerCase()} @ ${px(o[c.k].lim)}`); return parts.length ? parts.join(" · ") : "No trades"; }
// One desk's results for a quarter
export function exResultHTML(G, R, x, showRisk) {
  const who = w => w === "mm" ? "the market maker" : "another desk";
  return `<div class="tblwrap"><table class="exsheet"><tr><th>Commodity</th><th>Your trades</th><th class="r">Delivery price</th><th class="r">Futures gain/loss</th>${showRisk ? '<th class="r">Left unhedged</th>' : ""}</tr>
    ${x.lines.map(l => { const fills = l.fills.length ? l.fills.map(f => `${f.side === "buy" ? "Bought" : "Sold"} ${f.qty} @ ${px(f.price)} from ${who(f.w)}`.replace("Sold " + f.qty + " @ " + px(f.price) + " from", "Sold " + f.qty + " @ " + px(f.price) + " to")).join("<br>") : (l.ord ? `<span class="neg">Order not filled</span>` : "No trade");
      return `<tr><td><b>${l.c.name}</b>${l.wrong ? ' <span class="pill r">wrong side</span>' : ""}</td><td>${fills}</td><td class="r">${px(R.S[l.c.k])}<div class="small">${R.S[l.c.k] >= R.r[l.c.k] ? "+" : ""}${(100 * (R.S[l.c.k] / R.r[l.c.k] - 1)).toFixed(1)}%</div></td><td class="r ${l.fut < 0 ? "neg" : l.fut > 0 ? "pos" : ""}">${l.fills.length ? fmt.sgn(Math.round(l.fut)) : "–"}</td>${showRisk ? `<td class="r">${l.net === 0 ? "Fully hedged" : `${Math.abs(l.net)} contract${Math.abs(l.net) > 1 ? "s" : ""}: ${l.risk === 0 ? "$0" : (l.risk > 0 ? "lucky " : "hurt ") + fmt.usd(Math.abs(Math.round(l.risk)))}`}</td>` : ""}</tr>`; }).join("")}</table></div>`;
}
