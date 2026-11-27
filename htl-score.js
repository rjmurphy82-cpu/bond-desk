// Hold the Line: portfolio math, rule checks, report cards and badges.
// Pure functions shared by the server (htl-core.js), the iPads and the host screen.
// A player's record: { arch, dials:{...}, log:[ {q, a, side:"buy"|"sell", amt (dollars for buy, shares for sell), why, note} ],
//                      cards:{ "<q>:<kind>": {q, kind:"forced"|"paycheck", choice, why, note} }, seen:[q,...] }
import { P, PRE, EPS, DIV, MACRO, A, ARCH, CONSUMER, ORDER, PAYCHECK, START_CASH, YEAR_OF, Q as SCRIPT, TAGS } from "./htl-data.js";

export const price = (k, q) => P[k][q];
export const tradable = (k, q) => q >= 0 && q <= 11 && P[k][q] != null;
export const eps = (k, q) => (EPS[k] ? EPS[k][q] : null);
export const pe = (k, q) => { const e = eps(k, q), p = price(k, q); return A[k].kind === "co" && e != null && e > 0 && p != null ? p / e : null; };
export const peg = (k, q) => { const x = pe(k, q), g = A[k].growth; return x != null && g ? x / g : null; };
export const fg = q => MACRO.fg[q];
export const divRate = (k, q) => (DIV[k] ? DIV[k][Math.max(1, Math.min(12, q + 1))] : 0); // per share, next quarter
export const divYield = (k, q) => { const p = price(k, q); return p ? (divRate(k, q) * 4 / p) * 100 : 0; };
// price two quarters back (for the 6-month change); IPO price stands in before a listing
function back2(k, q) {
  if (q >= 2) { const b = price(k, q - 2); return b != null ? b : P[k].find(x => x != null); }
  if (PRE[k]) return q === 1 ? PRE[k][1] : PRE[k][0];
  return null;
}
export const mom = (k, q) => { const p = price(k, q), b = back2(k, q); return p != null && b ? (p / b - 1) * 100 : null; };
export const highTo = (k, q) => { let m = 0; for (let i = 0; i <= q; i++) if (P[k][i] != null) m = Math.max(m, P[k][i]); return m; };
export const fromHigh = (k, q) => { const h = highTo(k, q), p = price(k, q); return h && p != null ? (p / h - 1) * 100 : null; };

const EPSV = 1e-6;
const isNum = x => typeof x === "number" && isFinite(x);
const r2 = x => Math.round(x * 100) / 100;

// ---------- replay ----------
// Builds the portfolio quarter by quarter. Returns the state at the end of window `upto` (or at Q12 if upto = 12).
export function blank() { return { cash: START_CASH, h: {}, cost: {}, first: {}, buyHi: {}, income: 0 }; }
export function startQuarter(st, q) {
  if (q < 1) return;
  const interest = st.cash * (MACRO.fed[q - 1] / 400);
  let inc = interest;
  for (const k in st.h) inc += st.h[k] * (DIV[k] ? DIV[k][q] : 0);
  st.cash += inc; st.income += inc;
  if (q === 12 && st.h.STLH) { st.cash += st.h.STLH * price("STLH", 12); delete st.h.STLH; delete st.cost.STLH; }
  if (PAYCHECK[q]) st.cash += PAYCHECK[q];
  for (const k in st.h) st.buyHi[k] = Math.max(st.buyHi[k] || 0, price(k, q) || 0);
}
export function applyTrade(st, t) {
  const p = price(t.a, t.q);
  if (t.side === "buy") {
    const sh = t.amt / p; st.cash -= t.amt; st.h[t.a] = (st.h[t.a] || 0) + sh; st.cost[t.a] = (st.cost[t.a] || 0) + t.amt;
    if (st.first[t.a] == null) st.first[t.a] = t.q;
    st.buyHi[t.a] = Math.max(st.buyHi[t.a] || 0, p);
  } else {
    const held = st.h[t.a] || 0, sh = Math.min(t.amt, held), frac = held ? sh / held : 0;
    st.cash += sh * p; st.cost[t.a] = (st.cost[t.a] || 0) * (1 - frac); st.h[t.a] = held - sh;
    if (st.h[t.a] < EPSV) { delete st.h[t.a]; delete st.cost[t.a]; delete st.first[t.a]; delete st.buyHi[t.a]; }
  }
}
export function value(st, q) { let v = st.cash; for (const k in st.h) v += st.h[k] * (price(k, q) || 0); return v; }
export function posVal(st, k, q) { return (st.h[k] || 0) * (price(k, q) || 0); }
export function replay(pl, upto) {
  const st = blank(), log = pl.log || [];
  for (let q = 0; q <= Math.min(upto, 12); q++) { startQuarter(st, q); for (const t of log) if (t.q === q) applyTrade(st, t); }
  return st;
}
const clone = st => JSON.parse(JSON.stringify(st));

// Server-side check that a trade is possible (not whether it follows the pledge).
export function checkTrade(pl, t) {
  if (!ORDER.includes(t.a)) return "Pick an investment.";
  if (!tradable(t.a, t.q)) return t.a === "ZYPH" ? "Zephyr AI isn't listed yet." : "That can't be traded now.";
  if (!isNum(t.amt) || t.amt <= 0) return "Enter an amount.";
  const st = replay(pl, t.q);
  if (t.side === "buy") { if (t.amt > st.cash + 0.005) return "You don't have that much cash."; if (t.amt < 1) return "The smallest trade is $1."; }
  else if (t.side === "sell") { if (!st.h[t.a]) return "You don't own any."; if (t.amt > st.h[t.a] + 1e-6) return "You don't own that many shares."; }
  else return "Pick buy or sell.";
  return null;
}

// ---------- pledge rules ----------
export function dialsOf(pl) {
  const a = ARCH[pl.arch]; const d = {};
  if (!a) return d;
  for (const [key, , mn, mx, , def] of a.dials) { const v = pl.dials && isNum(+pl.dials[key]) ? +pl.dials[key] : def; d[key] = Math.min(mx, Math.max(mn, v)); }
  return d;
}
const stockShare = (st, q) => { const s = posVal(st, "HX500", q), b = posVal(st, "HXBD", q); return s + b > 0 ? s / (s + b) * 100 : null; };
const share = (st, k, q) => { const v = value(st, q); return v > 0 ? posVal(st, k, q) / v * 100 : 0; };
const cashPct = (st, q) => { const v = value(st, q); return v > 0 ? st.cash / v * 100 : 100; };
const nHold = st => Object.keys(st.h).length;
const money = x => "$" + Math.round(x).toLocaleString("en-US");
const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
const qn = q => "Q" + q;
const isRebQ = (d, q) => q > 0 && q % d.reb === 0;

// What the pledge requires at the start of window q (before this window's trades).
// Returns [{id, k, kind, text}] and updates `memo` (once-only flags).
function required(pl, d, st, q, memo) {
  const out = [], arch = pl.arch;
  if (q > 11) return out;
  if (arch === "graham") for (const k in st.h) {
    const avg = st.cost[k] / st.h[k];
    if (!memo["trim:" + k] && price(k, q) >= avg * (1 + d.trim / 100) - EPSV) out.push({ id: "trim:" + k, k, kind: "sell40", text: `${k} was up ${d.trim}% or more from what you paid, and your rule says sell half` });
  }
  if (arch === "buffett") for (const k in st.h) {
    const hi = st.buyHi[k] || price(k, q);
    if (!memo["dip:" + k] && price(k, q) <= hi * (1 - d.dip / 100) + EPSV && st.cash >= 50) out.push({ id: "dip:" + k, k, kind: "buy", text: `${k} fell ${d.dip}% or more from its high, and your rule says buy more` });
  }
  if (arch === "lynch") for (const k in st.h) {
    const g = peg(k, q);
    if (!memo["pegsell:" + k] && (g == null || g > d.sellpeg)) out.push({ id: "pegsell:" + k, k, kind: "sellall", text: g == null ? `${k} has no positive earnings, so it no longer fits your rules` : `${k}'s PEG rose to ${f1(g)}, above your sell line of ${d.sellpeg}` });
  }
  if (arch === "templeton") {
    if (fg(q) >= d.fg) { if (!memo.greed) out.push({ id: "greed", k: null, kind: "anysell", text: `Fear and Greed hit ${fg(q)}, at or above your trim line of ${d.fg}` }); }
    else delete memo.greed;
  }
  if (arch === "livermore") for (const k in st.h) {
    const hi = st.buyHi[k] || price(k, q);
    if (!memo["stop:" + k] && price(k, q) <= hi * (1 - d.stop / 100) + EPSV) out.push({ id: "stop:" + k, k, kind: "sellall", text: `${k} fell ${d.stop}% or more from its high since you bought, so your stop loss was hit` });
  }
  if (arch === "bogle") {
    const s = stockShare(st, q);
    if (isRebQ(d, q)) out.push({ id: "reb:" + q, k: null, kind: "bogleReb", text: `Q${q} is a scheduled rebalance: back to ${d.stock}% HX500` });
    else if (s != null && Math.abs(s - d.stock) > d.band) out.push({ id: "drift:" + q, k: null, kind: "bogleReb", text: `HX500 drifted to ${f1(s)}%, more than ${d.band} points from your ${d.stock}% target` });
    if (q === 0 || PAYCHECK[q]) out.push({ id: "invest:" + q, k: null, kind: "invest", text: q === 0 ? "Bogle investors put their money to work on day one" : "Your pledge says invest every paycheck" });
  }
  if (arch === "allweather") {
    if (isRebQ(d, q)) out.push({ id: "reb:" + q, k: null, kind: "awReb", text: `Q${q} is a scheduled rebalance: back to ${d.bond}% bonds and ${d.gold}% gold` });
    if (q === 0 || PAYCHECK[q]) out.push({ id: "invest:" + q, k: null, kind: "invest", text: q === 0 ? "All Weather investors put their money to work on day one" : "Your pledge says invest every paycheck" });
    out.push({ id: "core:" + q, k: null, kind: "awCore", text: "Your pledge says always hold HX500, HXBD and GOLD" });
  }
  return out;
}
// Was requirement r met by the end of window q? before = state at window start, after = state at window end.
function met(r, d, before, after, trades, q) {
  const mine = trades.filter(t => r.k == null || t.a === r.k);
  if (r.kind === "buy") return mine.some(t => t.side === "buy");
  if (r.kind === "sell40") return (before.h[r.k] || 0) - (after.h[r.k] || 0) >= (before.h[r.k] || 0) * 0.4 - EPSV;
  if (r.kind === "sellall") return !after.h[r.k] || after.h[r.k] <= (before.h[r.k] || 0) * 0.05;
  if (r.kind === "anysell") return trades.some(t => t.side === "sell");
  if (r.kind === "bogleReb") { const s = stockShare(after, q); return s != null && Math.abs(s - d.stock) <= 5; }
  if (r.kind === "invest") return cashPct(after, q) <= 5;
  if (r.kind === "awReb") return Math.abs(share(after, "HXBD", q) - d.bond) <= 5 && Math.abs(share(after, "GOLD", q) - d.gold) <= 5;
  if (r.kind === "awCore") return ["HX500", "HXBD", "GOLD"].every(k => after.h[k] > 0);
  return true;
}

// Rule check for one trade. before/after = state around the trade. Returns a list of problems (strings).
function tradeIssues(pl, d, t, before, after, ctx) {
  const k = t.a, q = t.q, a = A[k], arch = pl.arch, out = [];
  const buy = t.side === "buy", x = pe(k, q), e = eps(k, q), g = peg(k, q);
  const peTxt = x != null ? `P/E ${f1(x)}` : "no positive earnings";
  if (arch === "graham") {
    if (buy) {
      if (k === "HXBD") {} else if (a.kind !== "co") out.push(`${k} isn't a company or the bond fund`);
      else if (x == null) out.push(`${k} has no positive earnings`);
      else if (x > d.pe + EPSV) out.push(`bought ${k} at ${peTxt}; your cap is ${d.pe}`);
      if (cashPct(after, q) < d.cash - 0.05) out.push(`cash fell to ${f1(cashPct(after, q))}%; your floor is ${d.cash}%`);
    }
  }
  if (arch === "buffett") {
    if (buy) {
      if (k === "HX500") {} else if (a.kind !== "co" || a.moat !== "Wide") out.push(`${k} isn't a wide-moat company or HX500`);
      else if (x == null || x > d.pe + EPSV) out.push(`bought ${k} at ${peTxt}; your cap is ${d.pe}`);
    } else if (q > 0 && price(k, q) < price(k, q - 1) - EPSV) out.push(`sold ${k} in a quarter its price fell`);
    if (q > 0 && !ctx.dipBuy) { const y = YEAR_OF(q); ctx.year[y] = (ctx.year[y] || 0) + 1; if (ctx.year[y] === d.trades + 1) out.push(`trade number ${ctx.year[y]} in Year ${y}; your limit is ${d.trades}`); else if (ctx.year[y] > d.trades + 1) out.push(`over your limit of ${d.trades} trades in Year ${y}`); }
  }
  if (arch === "lynch" && buy) {
    if (a.kind !== "co" || !CONSUMER.includes(a.sector)) out.push(`${k} isn't a consumer-facing company`);
    else if (g == null) out.push(`${k} has no positive earnings`);
    else if (g > d.peg + EPSV) out.push(`bought ${k} at PEG ${f1(g)}; your cap is ${d.peg}`);
    if (share(after, k, q) > d.pos + 0.05) out.push(`${k} became ${f1(share(after, k, q))}% of your portfolio; your max is ${d.pos}%`);
  }
  if (arch === "fisher") {
    if (buy) {
      if (a.kind !== "co" || !a.growth || a.growth < 20) out.push(`${k} isn't expected to grow 20% or more`);
      else if (e == null || e <= 0) out.push(`${k} has no positive earnings`);
      if (nHold(after) > d.maxh) out.push(`${nHold(after)} holdings; your max is ${d.maxh}`);
      if (share(after, k, q) > d.pos + 0.05) out.push(`${k} became ${f1(share(after, k, q))}% of your portfolio; your max is ${d.pos}%`);
    } else if (!(e != null && e <= 0) && a.kind === "co") {
      if (before.first[k] != null && q - before.first[k] < d.hold) out.push(`sold ${k} after ${q - before.first[k]} quarters; your minimum is ${d.hold}`);
      else if (q > 0 && price(k, q) < price(k, q - 1) - EPSV) out.push(`sold ${k} because the price fell`);
    }
  }
  if (arch === "templeton") {
    if (buy) {
      if (q === 0) { if (k !== "HX500") out.push(`your opening portfolio is cash and HX500 only`); }
      else { const fh = fromHigh(k, q); if (!(fg(q) <= 25 || (fh != null && fh <= -d.drop + EPSV))) out.push(`bought ${k} only ${f1(-(fh || 0))}% below its high with Fear and Greed at ${fg(q)}`); }
    }
    if (fg(q) > 60 && cashPct(after, q) < d.cash - 0.05) out.push(`cash at ${f1(cashPct(after, q))}% with Fear and Greed above 60; your floor is ${d.cash}%`);
  }
  if (arch === "bogle") {
    if (k !== "HX500" && k !== "HXBD") out.push(`${k} isn't HX500 or HXBD`);
    else if (!ctx.allowedQ) out.push(`traded in Q${q}, which isn't a paycheck, rebalance or drift quarter`);
  }
  if (arch === "allweather" && buy && !["HX500", "HXBD", "GOLD", "OKRG"].includes(k)) out.push(`${k} isn't on your All Weather list`);
  if (arch === "livermore" && buy) {
    const m = mom(k, q);
    if (m == null || m < d.up - EPSV) out.push(`${k} was up only ${f1(m || 0)}% over 6 months; your rule is ${d.up}%`);
    if (nHold(after) > d.maxh) out.push(`${nHold(after)} holdings; your max is ${d.maxh}`);
  }
  return out;
}

function ctxIssues(pl, d, t, before) { const after = clone(before); applyTrade(after, t); return tradeIssues(pl, d, t, before, after, { year: {}, allowedQ: true }).length > 0; }
// Is the reason a student tagged actually true at that moment?
function tagValid(pl, d, why, t, before, reqs) {
  const k = t.a, q = t.q, buy = t.side === "buy", x = pe(k, q), g = peg(k, q), e = eps(k, q);
  const trig = id => reqs.some(r => r.id === id);
  switch (why) {
    case "opening": return t.q === 0 && buy && !ctxIssues(pl, d, t, before);
    case "value": return buy && x != null && x <= (d.pe || 0) + EPSV;
    case "moat": return buy && (k === "HX500" || A[k].moat === "Wide");
    case "dip": return buy && (before.buyHi[k] ? price(k, q) <= before.buyHi[k] * (1 - (d.dip || 20) / 100) + EPSV : (fromHigh(k, q) || 0) <= -(d.dip || 20));
    case "trim": return !buy && (pl.arch === "templeton" ? fg(q) >= d.fg : trig("trim:" + k));
    case "peg": return buy && g != null && g <= d.peg + EPSV;
    case "pegsell": return !buy && (g == null || g > d.sellpeg);
    case "growth": return buy && (A[k].growth || 0) >= 20 && e != null && e > 0;
    case "fear": return buy && (fg(q) <= 25 || (fromHigh(k, q) || 0) <= -d.drop + EPSV);
    case "momentum": return buy && (mom(k, q) || -1e9) >= d.up - EPSV;
    case "stop": return !buy && trig("stop:" + k);
    case "rebalance": return (pl.arch === "bogle" || pl.arch === "allweather") && (q === 0 || isRebQ(d, q) || reqs.some(r => r.kind === "bogleReb" || r.kind === "awReb"));
    case "paycheck": return buy && !!PAYCHECK[q];
    case "broke": return !buy && e != null && e <= 0;
    default: return false;
  }
}

// ---------- the report card ----------
// upto: last finished window (0..11), or 12 for the final report.
export function evaluate(pl, upto = 12) {
  const d = dialsOf(pl), arch = pl.arch, st = blank(), memo = {}, ctx = { year: {} };
  const items = [];   // every decision: {q, what, ok, issues[], tagOk}
  const cards = pl.cards || {}, log = pl.log || [], last = Math.min(upto, 11);
  const flags = { soldQ7Q8: false, heldZyph: false, zyphEarlySell: false, coin: false, bargain: false, stlhAtOffer: false, stopsClean: true, steady: true, paychecks: 0 };
  for (let q = 0; q <= Math.min(upto, 12); q++) {
    startQuarter(st, q);
    if (q === 11 && st.h.STLH) flags.stlhAtOffer = true;
    if (q > last) break;
    const before = clone(st), reqs = required(pl, d, st, q, memo), trades = log.filter(t => t.q === q);
    const bogleOk = q === 0 || !!PAYCHECK[q] || reqs.some(r => r.kind === "bogleReb");
    for (const t of trades) {
      const b = clone(st); applyTrade(st, t);
      ctx.allowedQ = bogleOk;
      ctx.dipBuy = arch === "buffett" && t.side === "buy" && reqs.some(r => r.id === "dip:" + t.a);
      const issues = pl.arch ? tradeIssues(pl, d, t, b, st, ctx) : [];
      const tagOk = tagValid(pl, d, t.why, t, b, reqs);
      items.push({ q, what: `${t.side === "buy" ? "Bought" : "Sold"} ${t.a} (${t.side === "buy" ? money(t.amt) : r2(t.amt) + " sh"})`, ok: issues.length === 0, issues, tagOk, why: t.why, note: t.note || "" });
      if (t.side === "sell" && (q === 7 || q === 8)) flags.soldQ7Q8 = true;
      if (t.a === "PCOIN" && t.side === "buy") flags.coin = true;
      if ((t.a === "LKSH" || t.a === "CRST") && t.side === "buy" && (q === 7 || q === 8)) flags.bargain = true;
      if (t.a === "ZYPH" && t.side === "sell" && q < 9 && ["other", "broke", "stop", "trim"].includes(t.why) && t.note) flags.zyphEarlySell = true;
    }
    if (st.h.ZYPH) flags.heldZyph = true;
    if ((arch === "bogle" || arch === "allweather") && trades.length && !(q === 0 || PAYCHECK[q] || isRebQ(d, q) || reqs.some(r => r.kind === "bogleReb"))) flags.steady = false;
    // required actions
    for (const r of reqs) {
      const ok = met(r, d, before, st, trades, q);
      if (r.id.startsWith("trim:") || r.id.startsWith("dip:") || r.id.startsWith("pegsell:") || r.id.startsWith("stop:") || r.id === "greed") memo[r.id] = true;
      if (r.kind === "awCore" && q === 0) continue;
      if (r.kind === "awCore" && ok) continue; // only counts when missed
      items.push({ q, what: `Required: ${r.text}`, ok, issues: ok ? [] : [`didn't act: ${r.text}`], req: true });
      if (r.id.startsWith("stop:") && !ok) flags.stopsClean = false;
    }
    // decision cards
    const sc = SCRIPT[q];
    if (sc.forced) {
      const c = cards[q + ":forced"];
      items.push({ q, what: `Decision card: ${sc.forced.prompt}`, ok: !!c, issues: c ? [] : ["no decision card submitted"], tagOk: c ? cardTagOk(pl, d, c, q, reqs, st) : false, card: true, why: c && c.why, note: c && c.note, choice: c && c.choice });
    }
    if (PAYCHECK[q]) {
      const c = cards[q + ":paycheck"], keep = c && c.choice === "cash";
      const bad = !c ? ["no paycheck decision submitted"] : keep && (arch === "bogle" || arch === "allweather") ? ["kept your paycheck as cash; your pledge says invest it"] : [];
      if (c && !bad.length) flags.paychecks++;
      items.push({ q, what: `Paycheck decision: ${c ? (keep ? "keep as cash" : "invest it") : "none"}`, ok: !bad.length, issues: bad, tagOk: c ? cardTagOk(pl, d, c, q, reqs, st) : false, card: true, why: c && c.why, note: c && c.note });
    }
  }
  const decisions = items.length, good = items.filter(i => i.ok).length;
  const tagged = items.filter(i => !i.req), tagGood = tagged.filter(i => i.tagOk).length;
  const disc = decisions ? good / decisions : 1, journal = tagged.length ? tagGood / tagged.length : 0;
  const endQ = Math.min(upto, 12), val = value(st, endQ);
  const seen = new Set(pl.seen || []);
  const badges = [];
  if (upto >= 12) {
    if (decisions && good === decisions) badges.push("Perfect Pledge");
    if (!flags.soldQ7Q8 && arch !== "livermore") badges.push("Diamond Hands");
    if (!log.some(t => t.a === "ZYPH" && t.side === "buy") || flags.zyphEarlySell) badges.push("Spotted the Fraud");
    if (!flags.coin) badges.push("Never Touched the Coin");
    if (flags.bargain) badges.push("Bargain Hunter");
    if (flags.stlhAtOffer) badges.push("Deal Maker");
    if (arch === "livermore" && flags.stopsClean && items.some(i => i.req && i.ok)) badges.push("Clean Stop");
    if ((arch === "bogle" || arch === "allweather") && flags.steady) badges.push("Steady Hand");
    if (flags.paychecks === 2) badges.push("Paycheck Pro");
    if ([...Array(12).keys()].every(q => seen.has(q))) badges.push("Research Rat");
  }
  return {
    value: val, contributed: START_CASH + Object.entries(PAYCHECK).filter(([q]) => +q <= endQ).reduce((s, [, v]) => s + v, 0),
    st, items, decisions, good, disc, journal, tagged: tagged.length, tagGood,
    points: { disc: Math.round(disc * 700) / 10, journal: Math.round(journal * 200) / 10 }, badges, dials: d
  };
}
function cardTagOk(pl, d, c, q, reqs, st) {
  if (c.kind === "paycheck") return c.choice === "invest" ? c.why === "paycheck" : c.why === "hold" && pl.arch !== "bogle" && pl.arch !== "allweather";
  if (c.choice === "hold") return c.why === "hold" && !reqs.some(r => r.k === c.asset && /sell|buy/.test(r.kind));
  return c.why && c.why !== "other" && c.why !== "hold";
}
export const ret = ev => (ev.value / ev.contributed - 1) * 100;

// ---------- the Ghost ----------
// A built-in undisciplined portfolio: buys HX500, chases ZYPH, panic-sells at the bottom, chases ZYPH again.
export function ghost() {
  const st = blank(), steps = { 0: [["buy", "HX500", 8000]], 4: [["buy", "ZYPH", "all"]], 7: [["sell", "HX500", "all"]], 8: [["buy", "ZYPH", "half"]] };
  for (let q = 0; q <= 12; q++) {
    startQuarter(st, q);
    for (const [side, a, amt] of steps[q] || []) {
      const n = side === "buy" ? (amt === "all" ? st.cash : amt === "half" ? st.cash / 2 : amt) : st.h[a];
      applyTrade(st, { q, a, side, amt: n });
    }
  }
  return { value: value(st, 12), contributed: 12000 };
}
// Options a reason dropdown should offer this player
export const tagsFor = arch => (ARCH[arch] ? ARCH[arch].tags : ["hold", "other"]).map(k => [k, TAGS[k]]);
