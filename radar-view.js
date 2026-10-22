// Recession Radar: pieces shared by the projector, the iPads and the practice page.
import * as R from "./radar-data.js";
export { R };
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const f2 = v => v.toFixed(2);
export const sgn = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
export const pts = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v);

// Yield curve chart. series: [{ y:[6 yields], color, dash, label, dots, width }]. Equal spacing by maturity.
export function curveSVG(series, o = {}) {
  const W = o.w || (typeof window !== "undefined" && window.innerWidth < 640 ? 420 : 640), H = o.h || 340, L = 54, Rt = 22, T = 24, B = 46;
  const all = series.flatMap(s => s.y);
  let lo = o.min ?? Math.floor(Math.min(...all) - 0.5), hi = o.max ?? Math.ceil(Math.max(...all) + 0.5);
  if (hi - lo < 2) { hi = lo + 2; }
  const step = hi - lo > 6 ? 2 : hi - lo > 3 ? 1 : 0.5;
  const x = i => L + (W - L - Rt) * i / (R.MATS.length - 1), y = v => T + (H - T - B) * (hi - v) / (hi - lo);
  const ink = o.ink || "currentColor", grid = o.grid || "rgba(128,128,128,.25)";
  let g = "";
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) g += `<line x1="${L}" x2="${W - Rt}" y1="${y(v)}" y2="${y(v)}" stroke="${grid}"/><text x="${L - 8}" y="${y(v) + 5}" text-anchor="end" font-size="14" fill="${ink}" opacity=".75">${v % 1 ? v.toFixed(1) : v}%</text>`;
  R.MATS.forEach((m, i) => g += `<text x="${x(i)}" y="${H - B + 24}" text-anchor="middle" font-size="15" font-weight="600" fill="${ink}">${m}</text>`);
  g += `<text x="${(L + W - Rt) / 2}" y="${H - 4}" text-anchor="middle" font-size="12.5" fill="${ink}" opacity=".7">Time until the bond matures →</text>`;
  g += `<text x="14" y="${(T + H - B) / 2}" text-anchor="middle" font-size="12.5" fill="${ink}" opacity=".7" transform="rotate(-90 14 ${(T + H - B) / 2})">Yield</text>`;
  series.forEach(s => {
    const c = s.color || "#C1102F", d = s.y.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    g += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${s.width || 4}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? `stroke-dasharray="${s.dash}"` : ""} opacity="${s.opacity ?? 1}"/>`;
    if (s.dots !== false) s.y.forEach((v, i) => {
      g += `<circle cx="${x(i)}" cy="${y(v)}" r="${s.r || 6}" fill="${c}" stroke="#fff" stroke-width="2"/>`;
      if (s.labels) g += `<text x="${x(i) + (i === 0 ? -4 : i === s.y.length - 1 ? 4 : 0)}" y="${y(v) - 13}" text-anchor="${i === 0 ? "start" : i === s.y.length - 1 ? "end" : "middle"}" font-size="${o.labelSize || 15}" font-weight="700" fill="${c}" paint-order="stroke" stroke="${o.halo || "#fff"}" stroke-width="4">${v.toFixed(2)}</text>`;
    });
  });
  if (o.legend) {
    let lx = L + 6;
    series.filter(s => s.label).forEach(s => { g += `<line x1="${lx}" x2="${lx + 22}" y1="12" y2="12" stroke="${s.color}" stroke-width="4" ${s.dash ? `stroke-dasharray="${s.dash}"` : ""}/><text x="${lx + 28}" y="17" font-size="13.5" fill="${ink}">${esc(s.label)}</text>`; lx += 40 + s.label.length * 7.4; });
  }
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || "Yield curve chart")}" style="width:100%;height:auto;display:block">${g}</svg>`;
}

// Series for a round's chart: the curve, plus the faded curve from 12 months earlier on Senior rounds.
export function roundSeries(rd) {
  const out = [];
  if (rd.before) out.push({ y: rd.before, color: "#9A9A9A", dash: "4 6", width: 3, r: 4, label: "12 months earlier" });
  out.push({ y: rd.ylds, labels: true, color: "#C1102F", label: rd.before ? "This curve" : undefined });
  return out;
}
export const chartOpts = (rd, o = {}) => ({ ink: "#111", legend: !!rd.before, ...o });
export const shapePill = s => `<span class="rr-shape ${s}">${R.SHAPES[s].label}</span>`;
export const answerFor = rd => { const sp = R.spreadOf(rd.ylds); return { sp, shape: R.shapeOf(sp) }; };

// Spot-the-Analyst points for one group in round r: +1 for picking the analyst, +1 for every group it fooled.
export function defendPoints(S, r, gid) {
  const m = (S.maps || {})[r], d = S.decisions[r] || {};
  if (!m) return { found: false, fooled: 0, pts: 0, voted: false };
  const mine = d[gid] || {}, found = m[mine.vote] === "analyst";
  const fooled = Object.keys(d).filter(h => h !== gid && d[h] && m[d[h].vote] === gid).length;
  return { found, fooled, pts: (found ? 1 : 0) + fooled, voted: !!mine.vote };
}
// Totals for every group through round `upto`
export function standings(S, upto) {
  const rows = S.groups.map(g => {
    let total = 0, shapes = 0, calls = 0, analyst = 0;
    const per = R.ROUNDS.slice(0, upto + 1).map((rd, r) => {
      const sc = R.scoreRound(((S.decisions[r] || {})[g.gid]), rd), dp = defendPoints(S, r, g.gid);
      const t = sc.total + dp.pts; total += t; analyst += dp.pts; shapes += sc.shapeOK ? 1 : 0; calls += sc.callOK ? 1 : 0;
      return { ...sc, defend: dp, total: t };
    });
    return { g, total, shapes, calls, analyst, per };
  });
  rows.sort((a, b) => b.total - a.total || b.calls - a.calls);
  rows.forEach(r => r.place = rows.filter(o => o.total > r.total).length + 1);
  return rows;
}
export const bandLabel = k => (R.BANDS.find(b => b.key === k) || {}).label || "";
export const callText = d => !d || !d.call ? "" : d.call === "yes" ? "Yes" : d.call === "no" ? "No" : d.call === "none" ? "No recession" : "Recession in " + bandLabel(d.call).toLowerCase();

// Styles shared by the live screens (style.css look) and the practice page (site.css look)
export const CSS = `
.rr-shape{display:inline-block;font-family:Oswald,Arial,sans-serif;text-transform:uppercase;border-radius:8px;padding:2px 10px;font-weight:600;letter-spacing:.02em}
.rr-shape.normal{background:#E3F1E7;color:#1E6B3E}.rr-shape.flat{background:#FFF3B0;color:#6B5300}.rr-shape.inverted{background:#F8E1DE;color:#B3261E}
.rr-ylds{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;text-align:center;margin-top:8px}
.rr-ylds div{background:#111;color:#fff;border-radius:8px;padding:5px 0}
.rr-ylds b{display:block;font-family:Oswald,Arial,sans-serif;font-size:clamp(17px,1.6vw,22px);line-height:1.1}
.rr-ylds small{font-size:12px;color:#CFCFCF;text-transform:uppercase}
.rr-ylds div.end{background:#C1102F}.rr-ylds div.end small{color:#FFE1E5}
.rr-clue{background:#FFF8E1;border-left:6px solid #E0B000;border-radius:0 10px 10px 0;padding:10px 14px;font-size:17px;line-height:1.4;color:#111}
.rr-clue.big{font-size:21px;padding:12px 16px}
.rr-clue b{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-weight:600;color:#6B5300;font-size:13px;letter-spacing:.06em;display:block}
.rr-rule{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.rr-rule div{border-radius:8px;padding:6px 8px;font-size:14px;line-height:1.25}
.rr-rule div b{display:block;font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:17px}
.rr-rule .normal{background:#E3F1E7;color:#1E6B3E}.rr-rule .flat{background:#FFF3B0;color:#6B5300}.rr-rule .inverted{background:#F8E1DE;color:#B3261E}
.rr-pick{display:grid;gap:6px}
.rr-pick button{border:2px solid #D9D9D9;background:#fff;border-radius:10px;color:#111;font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:21px;padding:12px 4px;line-height:1.1}
.rr-pick button small{display:block;font:600 12.5px Barlow,Arial,sans-serif;text-transform:none;color:#5C5C5C;margin-top:2px}
.rr-pick button.on{background:#C1102F;border-color:#C1102F;color:#fff}.rr-pick button.on small{color:#FFE1E5}
.rr-pick button.on.no{background:#111;border-color:#111}
.rr-case{display:block;width:100%;text-align:left;border:2px solid #D9D9D9;background:#fff;border-radius:10px;padding:12px 14px;font:600 18px/1.35 Barlow,Arial,sans-serif;color:#111;margin-bottom:8px;text-transform:none}
.rr-case.on{border-color:#C1102F;background:#FBE7EA}.rr-case.mine{opacity:.55;border-style:dashed}.rr-case .who{display:block;font:700 12px Oswald,Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#B00E2A;margin-top:4px}
.rr-case.analyst{border-color:#2E7D4F;background:#E3F1E7}
.rr-ta{width:100%;min-height:84px;font:600 18px/1.35 Barlow,Arial,sans-serif;padding:10px 12px;border:2px solid #D9D9D9;border-radius:10px;resize:vertical}
.rr-ghost{font-size:13px;color:#5C5C5C;margin-top:4px}
.rr-pick button:disabled{opacity:.45}
.rr-verdict{border-radius:12px;padding:14px 18px;color:#fff;display:flex;gap:6px 16px;align-items:center;flex-wrap:wrap}
.rr-verdict.yes{background:#B3261E}.rr-verdict.no{background:#1E6B3E}
.rr-verdict .big{font-family:Oswald,Arial,sans-serif;font-size:52px;line-height:1;font-weight:700;color:#fff}
.rr-rec td{padding:6px 10px;white-space:nowrap}
.rr-sim{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:14px;align-items:start}
.rr-chartbox{background:#fff;border-radius:10px;padding:8px;color:#111;border:1px solid #D9D9D9}
.rr-reading{margin-top:8px;font-size:16px;line-height:1.4}
.rr-cmp{display:block;font-size:14px;font-weight:700;margin-top:4px}.rr-cmp select{width:100%;font-size:16px;padding:6px;border-radius:8px;margin-top:4px}
.rr-note{font-size:13px;color:#5C5C5C;margin-top:6px}
.rr-sim input[type=range]{width:100%;accent-color:#C1102F;height:30px}
.rr-lever{border:1px solid #D9D9D9;border-radius:10px;padding:8px 12px;margin-bottom:8px;background:#fff;color:#111}
.rr-lever .top{display:flex;justify-content:space-between;gap:8px;font-weight:700}
.rr-lever .top span{font-family:Consolas,monospace}
.rr-lever .h{font-size:13.5px;color:#5C5C5C}
.rr-presets{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.rr-presets button{border:2px solid #111;background:#fff;color:#111;border-radius:8px;padding:6px 10px;font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:14px}
.rr-readout{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
.rr-readout div{background:#111;color:#fff;border-radius:8px;padding:6px 8px;text-align:center}
.rr-readout b{display:block;font-family:Oswald,Arial,sans-serif;font-size:24px;line-height:1.1}
.rr-readout small{font-size:11.5px;text-transform:uppercase;color:#CFCFCF}
.rr-readout .neg{color:#FF8A99}.rr-readout .pos{color:#9BE3B4}
@media(max-width:900px){.rr-sim{grid-template-columns:1fr}}
@media(max-width:700px){.rr-ylds{grid-template-columns:repeat(3,1fr)}.rr-rule{grid-template-columns:1fr}.rr-readout{grid-template-columns:1fr 1fr}}
`;

// The today's-curve simulator. Controls render once; only the chart and readouts redraw while sliding.
export function mountSimulator(el, o = {}) {
  const base = R.TODAY.ylds, v = { fed: 0, infl: 0, fear: 0 }; let cmp = "";
  el.innerHTML = `<div class="rr-sim"><div><div class="rr-chartbox" data-chart></div><div class="rr-readout" data-read></div><div class="rr-reading" data-radar></div></div>
    <div>${o.hidePresets ? "" : `<div class="rr-presets">${R.PRESETS.map((p, i) => `<button type="button" data-p="${i}">${esc(p.label)}</button>`).join("")}</div>`}
      ${R.LEVERS.map(L => `<div class="rr-lever"><div class="top">${esc(L.label)}<span data-val="${L.key}">+0.00%</span></div>
        <input type="range" min="${L.min}" max="${L.max}" step="${L.step}" value="0" data-k="${L.key}" aria-label="${esc(L.label)}"><div class="h">${esc(L.help)}</div></div>`).join("")}
      <label class="rr-cmp">Compare with a mystery curve
        <select data-cmp><option value="">None</option>${R.ROUNDS.map((rd, i) => `<option value="${i}">${rd.date} (${R.SHAPES[R.shapeOf(R.spreadOf(rd.ylds))].label}, ${rd.recession ? "recession" : "no recession"})</option>`).join("")}</select></label>
      <div class="rr-note">Bond prices use rate sensitivity like The Bond Desk: about ${R.SENS["2Y"]}% per 1% change for a 2-year bond and ${R.SENS["10Y"]}% for a 10-year bond. A simplified model for class.</div></div></div>`;
  const q = s => el.querySelector(s);
  const cls = n => n < 0 ? "neg" : n > 0 ? "pos" : "";
  function draw() {
    const sim = R.simulate(base, v), sp = R.spreadOf(sim), sh = R.shapeOf(sp), rec = R.record();
    const p2 = R.priceMove(sim[2] - base[2], R.SENS["2Y"]), p10 = R.priceMove(sim[5] - base[5], R.SENS["10Y"]), moved = Object.values(v).some(x => x);
    const past = cmp !== "" ? R.ROUNDS[+cmp] : null, series = [];
    if (past) series.push({ y: past.ylds, color: "#8E8E8E", dash: "3 6", label: past.date, width: 3, r: 4 });
    if (moved) series.push({ y: base, color: "#111111", dash: "8 6", label: "Today", width: 3, r: 4 });
    series.push({ y: sim, color: "#C1102F", label: moved ? "Your scenario" : "Today, " + R.TODAY.date, labels: true });
    q("[data-chart]").innerHTML = curveSVG(series, { legend: true, ink: "#111", min: 0, max: 9, aria: "Today's yield curve and your scenario" });
    q("[data-read]").innerHTML = `<div><b class="${sp < 0 ? "neg" : ""}">${sgn(sp)}</b><small>10Y minus 3M</small></div><div><b>${R.SHAPES[sh].label}</b><small>${R.SHAPES[sh].light}</small></div>
      <div><b class="${cls(p2)}">${pts(p2)}%</b><small>2-yr bond price</small></div><div><b class="${cls(p10)}">${pts(p10)}%</b><small>10-yr bond price</small></div>`;
    const [n, k] = rec[sh];
    q("[data-radar]").innerHTML = `📡 <b>Radar reading:</b> ${n} of our ${R.N} mystery curves ${n === 1 ? "was" : "were"} ${R.SHAPES[sh].label.toLowerCase()}, and ${k} of those ${n} ${k === 1 ? "was" : "were"} followed by a recession within two years.`;
    R.LEVERS.forEach(L => { q(`[data-val="${L.key}"]`).textContent = L.level ? ["None", "Low", "Medium", "High", "Panic"][Math.round(v[L.key] / 0.5)] || "" : (v[L.key] > 0 ? "+" : v[L.key] < 0 ? "−" : "+") + Math.abs(v[L.key]).toFixed(2) + "%"; q(`input[data-k="${L.key}"]`).value = v[L.key]; });
  }
  el.querySelectorAll("input[type=range]").forEach(i => i.addEventListener("input", () => { v[i.dataset.k] = +i.value; draw(); }));
  el.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { Object.assign(v, R.PRESETS[+b.dataset.p].v); draw(); });
  q("[data-cmp]").onchange = e => { cmp = e.target.value; draw(); };
  draw();
  return { set(vals) { Object.assign(v, vals); draw(); } };
}
