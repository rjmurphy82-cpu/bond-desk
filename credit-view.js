// Credit Desk Live: pieces shared by the projector (credit-host.js) and the iPads (credit-play.js).
import * as C from "./credit-desk-data.js";
export { C };
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const M = v => (v < 0 ? "−" : "") + "$" + Math.abs(v).toLocaleString("en-US") + "M";
export const k = v => v ? "$" + v / 1000 + "K" : "Pass";
export const N = C.YEARS.length;

// A group's buys so far (missing year = no answer = all cash)
export const picksFor = (S, gid, upto) => Array.from({ length: upto + 1 }, (_, r) => { const d = (S.decisions[r] || {})[gid]; return d && d.amt !== undefined && d.amt !== null ? d.amt : 0; });
export const ratingOf = (S, r, gid) => ((S.decisions[r] || {})[gid] || {}).rating || null;
export const nailedCount = (S, gid, upto) => C.YEARS.slice(0, upto + 1).filter((y, r) => ratingOf(S, r, gid) === y.truth.rating).length;
export function standings(S, upto) {
  const rows = S.groups.map(g => { const f = C.runFund(picksFor(S, g.gid, upto), upto); return { g, f, y: f.years[upto], nailed: nailedCount(S, g.gid, upto) }; });
  rows.sort((a, b) => b.f.value - a.f.value || b.nailed - a.nailed);
  rows.forEach(r => r.place = rows.filter(o => o.f.value > r.f.value).length + 1);
  return rows;
}

export function caseFileHTML(y, big) {
  const c = y.issuer, term = c.munis ? "Surplus" : "Earnings";
  return `<div class="card cf ${big ? "big" : ""}"><div class="label">Case file · ${esc(c.type)}</div><h3 class="cfname">${esc(c.name)}</h3>
    <div class="cfwhat">${esc(c.what)}</div>
    <div class="cffacts">${[["Total debt", c.debt], ["Yearly interest", c.interest], ["Cash on hand", c.cash], ["Debt due next 12 months", c.due]].map(([a, v]) => `<div class="stat"><div class="v">${M(v)}</div><div class="k">${a}</div></div>`).join("")}</div>
    <table class="cftable"><tr><th>Year</th><th class="r">Revenue</th><th class="r">${term} (before interest)</th></tr>${C.YEARS_LBL.map((yy, n) => `<tr><td>${yy}</td><td class="r">${M(c.rev[n])}</td><td class="r ${c.earn[n] < 0 ? "neg" : ""}">${M(c.earn[n])}</td></tr>`).join("")}</table>
    <div class="label" style="margin-top:12px">Case notes</div><ul class="news">${c.notes.map((n, j) => `<li><b>${j + 1}</b><span>${esc(n)}</span></li>`).join("")}</ul>
    <div class="small" style="margin-top:6px">Use 2026 for the math. Dollar figures in millions. Not every note matters.</div></div>`;
}
export function mathLine(y, key) {
  const c = y.issuer, r = y.truth.ratios, e = c.earn[4];
  if (key === "debt") return r.debt === null ? "No earnings in 2026, so 0 points" : `${M(c.debt)} ÷ ${M(e)} = ${r.debt.toFixed(2)} years`;
  if (key === "coverage") return `${M(e)} ÷ ${M(c.interest)} = ${r.cov.toFixed(2)}x`;
  if (key === "cash") return `${M(c.cash)} ÷ ${M(c.due)} = ${r.cash.toFixed(2)}`;
  if (key === "stability") return `Profit in ${r.P} of 5 years; revenue ${r.R >= 0 ? "+" : ""}${r.R.toFixed(1)}%${r.P === 5 && r.R > 0 ? (r.rising ? ", up every year" : ", with a dip") : ""}`;
  if (key === "history") return c.historyText;
  return c.backingText;
}
export function returnLines(y) {
  const b = y.bond, ret = C.bondReturn(y);
  if (ret.isDefault) return { ret, html: `<tr><td>Interest</td><td class="r">none paid</td></tr><tr><td>DEFAULT: bondholders get back $40 per $100</td><td class="r neg">−60.0%</td></tr>` };
  const m = ret.move, d = y.t1 - y.t0, cls = v => v < 0 ? "neg" : v > 0 ? "pos" : "";
  return { ret, html: `<tr><td>1. Interest (the bond pays)</td><td class="r">${C.pct(ret.coupon)}</td></tr>
    <tr><td>2. Rating move: ${esc(m.label)}${m.steps ? ` <span class="small">(${Math.abs(m.steps)} step${Math.abs(m.steps) > 1 ? "s" : ""} × 4%${m.crossed ? " + 4% junk line" : ""})</span>` : ""}</td><td class="r ${cls(ret.credit)}">${C.pct(ret.credit)}</td></tr>
    <tr><td>3. Rate move: ${y.t0.toFixed(1)}% → ${y.t1.toFixed(1)}%${d ? ` <span class="small">(${Math.abs(d).toFixed(1)}% × ${b.sens}, ${d > 0 ? "price down" : "price up"})</span>` : " (no change)"}</td><td class="r ${cls(ret.rate)}">${C.pct(ret.rate)}</td></tr>` };
}
export const STAGES = [["Rate it", "Part A"], ["Price it", "Part B"], ["Reveal", "Part C"]];
export const stageIdx = S => S.phase === "rate" ? 0 : S.phase === "price" ? 1 : 2;
export const stagePills = S => `<div class="stagepills">${STAGES.map(([a, b], n) => `<span class="${n === stageIdx(S) ? "now" : n < stageIdx(S) ? "done" : ""}">${n < stageIdx(S) ? "✓" : n + 1 + "."} ${a} <small>${b}</small></span>`).join("")}</div>`;
