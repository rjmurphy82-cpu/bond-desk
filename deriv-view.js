// Unit 5 Derivatives Live: pieces shared by the projector (deriv-host.js) and the iPads (deriv-play.js).
import { GAMES, ORDER, UNIT, Q_SECS, fmt, needed } from "./deriv-data.js";
export { GAMES, ORDER, UNIT, Q_SECS, fmt, needed };
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const SHAPES = ["▲", "◆", "●", "■"];
export const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");

export const game = S => GAMES[S.game];
export const round = S => GAMES[S.game].rounds[S.r];
export const dec = (S, r, gid) => (S.decisions[r] || {})[gid] || null;
export const answerable = (G, r) => G.kind === "desk" || (G.rounds[r] && G.rounds[r].t === "q");

// A desk group's result for one round (no answer = the desk's default choice)
export function deskResult(G, r, d) { const R = G.rounds[r]; const pick = d && !d.a ? d : G.dflt; return { ...G.result(R, pick), missing: !d }; }

// Last round whose results everyone may see
export function shownUpto(S) { return S.phase === "final" ? GAMES[S.game].rounds.length - 1 : S.phase === "reveal" ? S.r : S.r - 1; }

// Standings through round `upto`. Desk: start value + every round's result. Story: total points.
export function standings(S, upto) {
  const G = game(S);
  const rows = S.groups.map(g => {
    let total = 0, right = 0, last = 0, lastPick = null;
    for (let r = 0; r <= upto; r++) {
      if (!answerable(G, r)) continue;
      const d = dec(S, r, g.gid);
      if (G.kind === "story") { const p = d ? d.pts || 0 : 0; total += p; if (p > 0) right++; if (r === upto) last = p; }
      else { const x = deskResult(G, r, d); total += x.delta; if (r === upto) { last = x.delta; lastPick = x; } }
    }
    return { g, value: (G.kind === "desk" ? G.metric.start : 0) + total, right, last, lastPick };
  });
  rows.sort((a, b) => b.value - a.value || b.right - a.right || a.g.name.localeCompare(b.g.name));
  rows.forEach(r => r.place = rows.filter(o => o.value > r.value).length + 1);
  return rows;
}
// The "do nothing" benchmark for a desk: every round at the default choice
export function bench(G, upto) { let v = G.metric.start; for (let r = 0; r <= upto; r++) v += deskResult(G, r, null).delta; return v; }
export const deltaText = (G, v) => G.id === "futures-desk" ? fmt.num(v) + " pts" : G.metric.higher ? fmt.sgn(v) : fmt.usd(-v);
export const show = (G, v) => G.kind === "desk" ? G.metric.show(v) : fmt.num(v);
export const qIndex = (G, r) => G.rounds.slice(0, r + 1).filter(x => x.t === "q").length;
export const roundLabel = (G, r) => G.kind === "desk" ? `Round ${r + 1} of ${G.rounds.length}` : G.rounds[r].t === "q" ? `Question ${qIndex(G, r)} of ${G.rounds.filter(x => x.t === "q").length}` : G.rounds[r].t === "card" ? "Story" : "Leaderboard";

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
