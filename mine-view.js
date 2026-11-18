// Hash Wars Live: shared pieces for the host screen and the iPads.
import * as D from "./mine-data.js";
export { D };
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const usd = (v, d = 0) => (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
export const sgnUsd = v => (v > 0 ? "+" : "") + usd(v);
export const btc = v => (+v).toFixed(4) + " BTC";
export const cls = v => v > 0.5 ? "pos" : v < -0.5 ? "neg" : "";
export const seatFor = (r, seats) => ((r - 1) % Math.max(1, seats || 3)) + 1;
export const rigText = rig => D.MODEL_KEYS.filter(k => rig && rig[k]).map(k => `${rig[k]} × ${D.MODELS[k].short}`).join(", ") || "No machines";

export const CSS = `
.hw-ev{background:#111;color:#fff;border-radius:12px;padding:16px 18px;position:relative;overflow:hidden;border-bottom:5px solid var(--orange)}
.hw-ev::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:24px 24px;pointer-events:none}
.hw-ev>*{position:relative}
.hw-ev .k{font-family:Consolas,'Courier New',monospace;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--light)}
.hw-ev h2{font-size:38px;line-height:1.05;margin:4px 0 8px}
.hw-ev p{font-size:19px;line-height:1.45;margin:0;color:#E9E9E9}
.hw-chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:12px}
.hw-chips div{background:#000;border:1px solid #2b2b2b;border-radius:8px;padding:8px 10px;font-family:Consolas,'Courier New',monospace}
.hw-chips small{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8E8E8E}
.hw-chips b{font-size:21px;color:#fff}
.hw-chips b.up{color:#6FD08C}.hw-chips b.dn{color:#FF8A99}
.hw-q{background:#FBF1F2;border-left:6px solid var(--orange);border-radius:0 10px 10px 0;padding:12px 16px}
.hw-q .t{font-size:20px;line-height:1.4;font-weight:600}
.hw-opts{display:grid;gap:8px;margin-top:10px}
.hw-opts button{background:#fff;border:2px solid var(--rule);border-radius:10px;padding:12px 14px;font-family:Barlow,Arial,sans-serif;text-transform:none;font-size:19px;text-align:left;color:var(--ink);font-weight:600}
.hw-opts button.on{background:var(--brown);border-color:var(--brown);color:#fff}
.hw-opts button.right{background:var(--greenbg);border-color:var(--green);color:var(--green)}
.hw-opts button.wrong{background:var(--redbg);border-color:var(--red);color:var(--red)}
.hw-seat{display:inline-block;background:var(--orange);color:#fff;border-radius:999px;padding:3px 12px;font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:15px;letter-spacing:.04em}
.hw-step{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;color:var(--brown);font-size:20px;margin:18px 0 8px;display:flex;align-items:center;gap:8px}
.hw-step b{display:inline-block;background:var(--orange);color:#fff;border-radius:50%;width:28px;height:28px;text-align:center;line-height:28px;font-size:15px}
.hw-shop{display:grid;gap:8px}
.hw-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;background:#fff;border:2px solid var(--rule);border-radius:10px;padding:10px 12px}
.hw-item .nm{font-family:Oswald,Arial,sans-serif;font-size:20px;text-transform:uppercase;line-height:1.1}
.hw-item .sp{font-family:Consolas,'Courier New',monospace;font-size:13.5px;color:var(--muted)}
.hw-item .pr{font-family:Oswald,Arial,sans-serif;color:var(--orange);font-size:18px}
.hw-stp{display:flex;align-items:center;gap:6px}
.hw-stp button{width:44px;height:44px;border-radius:10px;border:2px solid var(--rule);background:#fff;font-size:24px;color:var(--brown);padding:0}
.hw-stp span{font-family:Oswald,Arial,sans-serif;font-size:26px;min-width:30px;text-align:center}
.hw-plans{display:grid;gap:8px}
.hw-plans button{background:#fff;border:2px solid var(--rule);border-radius:10px;padding:10px 14px;text-align:left;text-transform:none;font-family:Barlow,Arial,sans-serif;color:var(--ink)}
.hw-plans button b{display:block;font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:20px;font-weight:600}
.hw-plans button small{font-size:15px;color:var(--muted)}
.hw-plans button.on{border-color:var(--orange);background:#FBF1F2}
.hw-plans button:disabled{opacity:.45}
.hw-two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hw-two button{border:2px solid var(--rule);background:#fff;border-radius:10px;font-size:19px;padding:12px 6px;color:var(--brown)}
.hw-two button.on{background:var(--brown);border-color:var(--brown);color:#fff}
.hw-two button.on.go{background:var(--orange);border-color:var(--orange)}
.hw-cash{display:flex;flex-direction:column;gap:4px;width:100%;text-align:left;background:#fff;border:2px dashed var(--rule);border-radius:10px;padding:12px 14px;text-transform:none;font-family:Barlow,Arial,sans-serif;color:var(--ink)}
.hw-cash b{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:20px;font-weight:600}
.hw-cash span{font-size:15px;color:var(--muted)}
.hw-cash.on{border-style:solid;border-color:var(--brown);background:var(--brown);color:#fff}.hw-cash.on span{color:#CFCFCF}
.hw-desk{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px}
.hw-desk div{background:var(--brown);color:#fff;border-radius:8px;padding:7px 10px}
.hw-desk small{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#CFCFCF}
.hw-desk b{font-family:Consolas,'Courier New',monospace;font-size:19px}
.hw-est td{font-family:Consolas,'Courier New',monospace;font-size:15px}
.hw-tot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;background:var(--sand);border-radius:10px;padding:10px 14px;margin-top:12px;font-size:17px}
.hw-tot b{font-family:Consolas,'Courier New',monospace}
.hw-why{font-size:18px;line-height:1.45;margin-top:10px}
.hw-res td{font-size:17px}.hw-res td.r{font-family:Consolas,'Courier New',monospace}
.hw-res td.nm{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;color:var(--brown)}
.hw-wu{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
.hw-wu>div{background:#fff;border:2px solid var(--rule);border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.hw-wu>div.aw{border-color:var(--green);background:var(--greenbg)}
.hw-wu .nm{font-family:Oswald,Arial,sans-serif;text-transform:uppercase;font-size:18px;color:var(--brown)}
.hw-wu .tx{font-size:18px;line-height:1.4;flex:1}
.lessonbox{background:#FBF1F2;border-left:6px solid var(--orange);border-radius:0 10px 10px 0;padding:10px 14px;font-size:19px;line-height:1.4;margin-top:12px}
.hw-bar{height:12px;background:var(--sand);border-radius:6px;overflow:hidden}
.hw-bar div{height:100%;background:var(--orange)}
.hw-bar.ok div{background:var(--green)}
`;

export function eventCard(r, big) {
  const R = D.ROUNDS[r], P = D.ROUNDS[r - 1];
  const dir = (a, b) => !b ? "" : a > b ? "up" : a < b ? "dn" : "";
  const prevPrice = P ? P.price : 74600, prevNet = P ? P.net : 1020;
  return `<div class="hw-ev"><div class="k">${esc(R.tag)} · ${esc(R.when)}</div><h2 style="${big ? "font-size:48px" : ""}">${R.icon} ${esc(R.title)}</h2><p style="${big ? "font-size:22px" : ""}">${esc(R.story)}</p>
    <div class="hw-chips">
      <div><small>Bitcoin price</small><b class="${dir(R.price, prevPrice)}">${usd(R.price)}</b></div>
      <div><small>Network hashrate</small><b class="${dir(R.net, prevNet)}">${R.net.toLocaleString()} EH/s</b></div>
      <div><small>Block reward</small><b class="${r === 3 ? "dn" : ""}">${esc(R.rewardText)}</b></div>
      <div><small>Power prices</small><b class="${R.pm > 1 ? "dn" : ""}">${R.pm > 1 ? "+25% home/hosting" : "Normal"}</b></div>
    </div></div>`;
}
export const planLine = k => { const p = D.PLANS[k]; return p ? `<b>${esc(p.name)}</b><small>${esc(p.note)}</small>` : ""; };
export function resultsTable(rows) { // rows: [{name, row, nwBefore}]
  return `<table class="hw-res"><tr><th>Desk</th><th>Machines</th><th>Ran?</th><th class="r">Mined</th><th class="r">Power bill</th><th class="r">Mining profit</th><th>Bitcoin</th><th class="r">Bonus</th><th class="r">Net worth</th></tr>
  ${rows.map(({ name, row, before }) => row.skipped ? `<tr><td class="nm">${esc(name)}</td><td colspan="8" class="small">Sat out (no rig)</td></tr>` :
    `<tr><td class="nm">${esc(name)}</td><td>${row.out ? "–" : esc(rigText(row.rig))}<div class="small">${esc((D.PLANS[row.plan] || {}).name || "")}</div></td>
    <td>${row.cashout ? `<span class="pill j">Cashed out</span>` : row.out ? `<span class="pill ig">Out</span>` : row.run ? `<span class="pill g">Ran</span>` : `<span class="pill ig">Off</span>`}</td>
    <td class="r">${usd(row.minedUSD)}<div class="small">${btc(row.mined)}</div></td><td class="r">${usd(-row.power)}</td>
    <td class="r ${cls(row.minedUSD - row.power)}">${sgnUsd(row.minedUSD - row.power)}</td>
    <td>${row.out ? "–" : row.cashout ? "Sold all + machines " + usd(row.sold) : row.sellBTC ? "Sold" : "Held"}</td><td class="r">${row.bonus ? "+" + usd(row.bonus) : ""}</td>
    <td class="r"><b>${usd(row.nw)}</b><div class="small ${cls(row.nw - before)}">${sgnUsd(row.nw - before)}</div></td></tr>`).join("")}</table>`;
}
export function standTable(st, opts = {}) {
  return `<table class="hw-res standings"><tr><th>#</th><th>Desk</th><th class="r">Net worth</th><th class="r">Analyst points</th><th class="r">Score</th></tr>
  ${st.map((x, i) => `<tr class="${i === 0 ? "top" : ""} ${opts.me === x.g.gid ? "me" : ""}"><td class="pl" style="font-family:Oswald,Arial;font-size:22px;color:var(--rust)">${i + 1}</td><td class="nm">${esc(x.g.name)}</td>
    <td class="r">${usd(x.nw)}</td><td class="r">${x.pts} <span class="small">(+${usd(x.pts * D.POINT_VALUE)})</span></td><td class="r" style="font-family:Oswald,Arial;font-size:22px">${usd(x.score)}</td></tr>`).join("")}</table>
  <div class="small" style="margin-top:6px">Score = net worth + ${usd(D.POINT_VALUE)} per analyst point (right Prove It answers, right math, and a top halving answer). Net worth = cash + Bitcoin + what your machines would sell for.</div>`;
}
