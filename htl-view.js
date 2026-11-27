// Hold the Line: shared display helpers for the iPad and host screens.
import * as D from "./htl-data.js";
import * as S from "./htl-score.js";
export { D, S };
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const money = (x, cents) => (x < 0 ? "-" : "") + "$" + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
export const pct = (x, d = 1) => x == null || !isFinite(x) ? "n/a" : (x > 0 ? "+" : "") + x.toFixed(d) + "%";
export const cls = x => x > 0.0001 ? "pos" : x < -0.0001 ? "neg" : "";
export const chg = (k, q) => { if (q < 1) return null; const a = S.price(k, q - 1), b = S.price(k, q); return a && b != null ? (b / a - 1) * 100 : null; };
export const shares = x => x >= 100 ? x.toFixed(1) : x >= 1 ? x.toFixed(2) : x.toFixed(4);

// Fear and Greed gauge (semicircle). from = previous value for the needle animation.
export function gauge(v, from = v, w = 300) {
  const h = w * 0.66, cx = w / 2, cy = w * 0.5, r = w * 0.4;
  const pt = (val, rr = r) => { const a = Math.PI * (1 - val / 100); return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)]; };
  const arc = (a, b, col) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}" stroke="${col}" stroke-width="${w * 0.09}" fill="none"/>`; };
  const bands = [[0, 25, "#B3261E"], [25, 45, "#E07A5F"], [45, 55, "#BDBDBD"], [55, 75, "#7FB77E"], [75, 100, "#2E7D4F"]];
  const ang = val => 180 * (val / 100) - 90;
  return `<svg viewBox="0 0 ${w} ${h}" class="htl-gauge" role="img" aria-label="Fear and Greed ${v}">
    ${bands.map(([a, b, c]) => arc(a + 0.6, b - 0.6, c)).join("")}
    <text x="${cx - r}" y="${cy + w * 0.08}" font-size="${w * 0.045}" fill="#5C5C5C" text-anchor="middle">FEAR</text>
    <text x="${cx + r}" y="${cy + w * 0.08}" font-size="${w * 0.045}" fill="#5C5C5C" text-anchor="middle">GREED</text>
    <g class="needle" style="transform-origin:${cx}px ${cy}px;--from:${ang(from)}deg;--to:${ang(v)}deg;transform:rotate(${ang(v)}deg)">
      <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r * 0.78}" stroke="#111" stroke-width="${w * 0.018}" stroke-linecap="round"/></g>
    <circle cx="${cx}" cy="${cy}" r="${w * 0.03}" fill="#111"/>
    <text x="${cx}" y="${cy + w * 0.155}" font-size="${w * 0.13}" font-family="Oswald,Arial" font-weight="700" fill="#111" text-anchor="middle">${v}</text>
  </svg><div class="htl-glabel">${esc(D.FG_BAND(v))}</div>`;
}
// Small price line for one asset, Q0..q (IPO-aware). big = host size.
export function spark(k, q, { w = 260, h = 70, big = false, label = true } = {}) {
  const pts = []; for (let i = 0; i <= q; i++) { const p = S.price(k, i); if (p != null) pts.push([i, p]); }
  if (pts.length < 2) return pts.length && q > 0 ? `<div class="small">Just listed</div>` : "";
  const lo = Math.min(...pts.map(p => p[1])), hi = Math.max(...pts.map(p => p[1])), pad = (hi - lo) * 0.12 || 1;
  const x = i => 6 + (i - pts[0][0]) / Math.max(1, q - pts[0][0]) * (w - 12), y = p => h - 6 - (p - lo + pad) / (hi - lo + 2 * pad) * (h - 12);
  const first = pts[0][1], last = pts[pts.length - 1][1], col = last >= first ? "#2E7D4F" : "#B3261E";
  const d = pts.map(([i, p], n) => (n ? "L" : "M") + x(i).toFixed(1) + " " + y(p).toFixed(1)).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" class="htl-spark${big ? " big" : ""}" preserveAspectRatio="none"><path d="${d}" fill="none" stroke="${col}" stroke-width="${big ? 4 : 2.5}" stroke-linejoin="round"/>
    <circle cx="${x(pts[pts.length - 1][0])}" cy="${y(last)}" r="${big ? 6 : 3.5}" fill="${col}"/></svg>`;
}

// One row of the stat card grid
export function statList(k, q) {
  const a = D.A[k], p = S.price(k, q), e = S.eps(k, q), pe = S.pe(k, q), g = S.peg(k, q), dy = S.divYield(k, q), m = S.mom(k, q), fh = S.fromHigh(k, q);
  const rows = [["Price", money(p, true)], ["This quarter", pct(chg(k, q))], ["6-month change", pct(m)], ["Below its high", fh != null && fh < -0.05 ? pct(fh) : "At its high"]];
  if (a.kind === "co") rows.push(["EPS (annual)", e == null ? "n/a" : (e < 0 ? "-$" + Math.abs(e).toFixed(2) + " (loss)" : "$" + e.toFixed(2))], ["P/E", pe == null ? "None (no profit)" : pe.toFixed(1)], ["Expected growth", a.growth ? a.growth + "%" : "n/a"], ["PEG", g == null ? "n/a" : g.toFixed(2)], ["Moat", a.moat], ["Debt", a.debt]);
  rows.push(["Dividend yield", dy ? dy.toFixed(1) + "%" : "None"]);
  if (a.book) rows.push(["Price / book", (p / a.book).toFixed(2)]);
  return rows;
}

export const CSS = `
.htl-gauge{width:100%;max-width:340px;display:block;margin:0 auto}
.htl-gauge .needle{animation:htlNeedle 1.6s cubic-bezier(.3,1.4,.5,1) both}
@keyframes htlNeedle{from{transform:rotate(var(--from))}to{transform:rotate(var(--to))}}
.htl-glabel{text-align:center;font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:20px;color:var(--brown);margin-top:2px}
.htl-spark{width:100%;height:60px;display:block}.htl-spark.big{height:200px}
.htl-top{display:flex;gap:8px;flex-wrap:wrap;align-items:stretch;margin-bottom:12px}
.htl-top .chip{background:var(--brown);color:#fff;border-radius:10px;padding:6px 12px;text-align:center;min-width:92px}
.htl-top .chip .v{font-family:Oswald,Arial,sans-serif;font-size:22px;font-weight:600;line-height:1.1}
.htl-top .chip .k{font-size:11px;color:#CFCFCF;text-transform:uppercase}
.htl-top .qt{flex:1;min-width:180px}.htl-top .qt h2{font-size:26px;color:var(--brown);line-height:1}.htl-top .qt .sub{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;color:var(--rust);font-size:14px}
.htl-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 12px;position:sticky;top:0;background:var(--bg);padding:6px 0;z-index:5}
.htl-tabs button{background:var(--card);border:2px solid var(--rule);border-radius:8px;padding:8px 14px;font-size:17px;color:var(--brown)}
.htl-tabs button.on{background:var(--brown);border-color:var(--brown);color:#fff}
.htl-tabs button .dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--orange);margin-left:6px;vertical-align:middle}
.htl-mkt{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px}
.htl-a{background:var(--card);border:2px solid var(--rule);border-radius:10px;padding:10px 12px;text-align:left;text-transform:none;font-family:Barlow,Arial,sans-serif;color:var(--ink);display:flex;flex-direction:column;gap:4px;cursor:pointer}
.htl-a:active{transform:scale(.99)}
.htl-a.own{border-color:var(--orange)}
.htl-a.off{opacity:.45;cursor:default}
.htl-a .t{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.htl-a .tk{font-family:Oswald,Arial,sans-serif;font-size:22px;font-weight:700;color:var(--brown)}
.htl-a .pr{font-family:Consolas,monospace;font-size:19px;font-weight:700}
.htl-a .nm{font-size:14px;color:var(--muted);line-height:1.2}
.htl-a .mini{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:13px;color:var(--brown2)}
.htl-a .mini b{font-weight:700}
.htl-sec{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;color:var(--rust);font-size:16px;margin:14px 0 6px}
.htl-alert{background:#FFF3B0;border:2px solid #E0B000;border-radius:10px;padding:10px 14px;margin-bottom:10px}
.htl-alert h3{font-size:19px;color:var(--brown)}
.htl-alert.done{background:var(--greenbg);border-color:var(--green)}
.htl-stats{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;font-size:15px}
.htl-stats div{display:flex;justify-content:space-between;border-bottom:1px solid var(--rule);padding:3px 0}
.htl-stats div span:first-child{color:var(--muted)}
.htl-stats div span:last-child{font-weight:700;font-family:Consolas,monospace}
.htl-quick{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.htl-quick button{background:var(--sand);border:2px solid var(--rule);border-radius:8px;padding:6px 10px;font-size:15px;color:var(--brown)}
.htl-in{width:100%;font-size:24px;padding:10px 12px;border:2px solid var(--rule);border-radius:10px;font-family:Consolas,monospace}
.htl-sel,.htl-note{width:100%;font-size:17px;padding:10px 12px;border:2px solid var(--rule);border-radius:10px;font-family:Barlow,Arial,sans-serif;background:#fff}
.htl-feed{display:flex;flex-direction:column;gap:8px}
.htl-post{background:var(--card);border:1px solid var(--rule);border-radius:12px;padding:8px 12px;font-size:16px;max-width:520px}
.htl-post b{display:block;font-size:13px;color:var(--muted)}
.htl-post.jake{background:#DCF3FF;border-color:#B5E0F7;align-self:flex-start}
.htl-post.analyst{border-left:5px solid var(--brown)}
.htl-arch{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.htl-arch button{background:var(--card);border:2px solid var(--rule);border-radius:12px;padding:12px 14px;text-align:left;text-transform:none;font-family:Barlow,Arial,sans-serif;color:var(--ink);display:flex;flex-direction:column;gap:4px}
.htl-arch button.on{border-color:var(--orange);background:#FFF5F6}
.htl-arch .ic{font-size:30px;line-height:1}
.htl-arch .an{font-family:Oswald,Arial,sans-serif;font-size:24px;color:var(--brown);text-transform:uppercase;line-height:1}
.htl-arch .st{font-family:Oswald,Arial,sans-serif;font-size:14px;color:var(--rust);text-transform:uppercase}
.htl-arch ul{margin:4px 0 0 18px;padding:0;font-size:14px;color:var(--brown2)}
.htl-dial{margin:12px 0}
.htl-dial .h{display:flex;justify-content:space-between;font-weight:700;font-size:17px}
.htl-dial .h b{font-family:Oswald,Arial,sans-serif;font-size:24px;color:var(--orange)}
.htl-dial input[type=range]{width:100%;height:36px;accent-color:var(--orange)}
.htl-dial .rg{display:flex;justify-content:space-between;font-size:13px;color:var(--muted)}
.htl-pledge{background:var(--brown);color:#fff;border-radius:12px;padding:14px 18px}
.htl-pledge .label{color:var(--light)}
.htl-pledge h2{font-size:28px}
.htl-pledge ul{margin:6px 0 0 18px;padding:0}
.htl-pledge .vow{font-size:19px;font-style:italic;color:#FFE1E5;margin-top:8px}
.htl-pledge .sig{font-family:'Brush Script MT','Segoe Script',cursive;font-size:30px;color:#fff;margin-top:6px}
.htl-macro{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:6px}
.htl-macro div{background:var(--card);border:1px solid var(--rule);border-radius:8px;padding:6px 10px}
.htl-macro div b{display:block;font-family:Oswald,Arial,sans-serif;font-size:22px;color:var(--brown)}
.htl-macro div small{font-size:12px;color:var(--muted);text-transform:uppercase}
.htl-macro div.inv b{color:var(--red)}
.htl-news{list-style:none;margin:0;padding:0}
.htl-news li{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--rule);font-size:19px;line-height:1.35}
.htl-news li:last-child{border-bottom:0}
.htl-news li b{flex:none;width:30px;height:30px;border-radius:50%;background:var(--orange);color:#fff;display:flex;align-items:center;justify-content:center;font-family:Oswald,Arial,sans-serif}
.htl-news.big li{font-size:27px;line-height:1.3;padding:14px 0}
.htl-news.big li b{width:42px;height:42px;font-size:22px}
.htl-news li.say{background:#FFF5F6}
.htl-rc .big{font-family:Oswald,Arial,sans-serif;font-size:54px;line-height:1;color:var(--brown)}
.htl-viol li{margin-bottom:6px;line-height:1.35}
.htl-badges{display:flex;flex-wrap:wrap;gap:6px}
.htl-badge{background:var(--orange);color:#fff;font-family:Oswald,Arial,sans-serif;text-transform:uppercase;border-radius:16px;padding:4px 12px;font-size:15px}
.htl-badge.off{background:var(--sand);color:var(--muted)}
textarea.htl-note{min-height:70px}
`;
export const BADGES = [
  ["Perfect Pledge", "100% Discipline Score"], ["Diamond Hands", "Sold nothing in Q7 and Q8 (not for Livermore)"], ["Spotted the Fraud", "Never bought ZYPH, or sold it before Q9 explaining a red flag"],
  ["Never Touched the Coin", "Never bought PrairieCoin"], ["Bargain Hunter", "Bought LKSH or CRST in Q7 or Q8"], ["Deal Maker", "Held STLH when the buyout offer arrived"],
  ["Clean Stop", "Livermore: every stop loss executed on time"], ["Steady Hand", "Bogle or All Weather: no trades outside paychecks and rebalances"], ["Paycheck Pro", "Both paychecks handled by the pledge"], ["Research Rat", "Opened the research tab every quarter"]
];
export function pledgeCard(p, { small = false } = {}) {
  const a = D.ARCH[p.arch]; if (!a) return "";
  const d = S.dialsOf(p);
  return `<div class="htl-pledge"><div class="label">My pledge</div><h2>${a.icon} ${esc(a.name)} <span style="font-size:18px;color:var(--light)">${esc(a.style)}</span></h2>
    <div style="font-size:16px;margin-top:4px">${esc(a.idea)}</div>
    <ul>${a.rules.map(r => `<li>${esc(r)}</li>`).join("")}${a.dials.map(([k, l, , , , , u]) => `<li>${esc(l)}: <b>${d[k]}${u}</b></li>`).join("")}</ul>
    ${small ? "" : `<div class="vow">"I will never ${esc(p.never)} even if ${esc(p.evenIf)}."</div><div class="sig">${esc(p.sign)}</div>`}</div>`;
}
export function macroGrid(q) {
  const m = D.MACRO, sp = m.y10[q] - m.y2[q];
  const cells = [["Fed funds rate", m.fed[q].toFixed(2) + "%"], ["Inflation (CPI)", m.cpi[q].toFixed(1) + "%"], ["Unemployment", m.unemp[q].toFixed(1) + "%"], ["GDP growth", (m.gdp[q] > 0 ? "+" : "") + m.gdp[q].toFixed(1) + "%"],
    ["10-year yield", m.y10[q].toFixed(1) + "%"], ["2-year yield", m.y2[q].toFixed(1) + "%"], ["Yield curve (10y − 2y)", (sp > 0 ? "+" : "") + sp.toFixed(1) + (sp < 0 ? " inverted" : ""), sp < 0], ["Consumer sentiment", m.sent[q]], ["Fear and Greed", m.fg[q] + " · " + D.FG_BAND(m.fg[q])]];
  return `<div class="htl-macro">${cells.map(([k, v, bad]) => `<div class="${bad ? "inv" : ""}"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("")}</div>`;
}
export function feed(q) {
  const sc = D.Q[q];
  return `<div class="htl-feed">${sc.noise.map(([who, txt]) => `<div class="htl-post ${who === "Jake" ? "jake" : /Research/.test(who) ? "analyst" : ""}"><b>${who === "Jake" ? "Jake (group chat)" : esc(who)}</b>${esc(txt)}</div>`).join("")}</div>`;
}
// Leaderboards. players = host state players; q = current quarter; phase decides which windows are finished.
export function boards(players, q, phase) {
  const valQ = phase === "final" ? 12 : q, doneUpto = phase === "final" ? 12 : q - 1;
  const rows = players.filter(p => p.arch).map(p => {
    const st = S.replay(p, valQ), val = S.value(st, valQ), contrib = D.START_CASH + Object.entries(D.PAYCHECK).filter(([x]) => +x <= valQ).reduce((s, [, v]) => s + v, 0);
    const ev = doneUpto >= 0 ? S.evaluate(p, doneUpto) : null;
    return { p, val, ret: (val / contrib - 1) * 100, disc: ev ? ev.disc * 100 : 100, ev };
  });
  return rows;
}
