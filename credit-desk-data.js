// The Credit Desk: rate the borrower yourself, then decide whether its bond is worth buying.
// Combines The Rating Room (six-factor scorecard) with The Bond Desk (fair yield, rates, rating changes).
// Every issuer is made up. Each one's TRUE rating comes from its numbers using the same scorecard as The Rating Room.
// The agency's POSTED rating is sometimes out of date; by year end the agency moves it to the true rating.

export const START_FUND = 1000000;
export const AMOUNTS = [0, 100000, 200000, 300000];
export const JUNK_LIMIT = 200000, JUNK_FINE = 25000;
export const LADDER = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"];
export const SPREADS = { AAA: 0.5, AA: 0.8, A: 1.2, BBB: 2.0, BB: 3.5, B: 5.5, CCC: 10.0 };
export const SCALE = [[22, "AAA"], [19, "AA"], [16, "A"], [13, "BBB"], [10, "BB"], [6, "B"], [0, "CCC"]];
export const YEARS_LBL = ["2022", "2023", "2024", "2025", "2026"];
export const RECOVERY = 40;
export const STEP_PCT = 4, LINE_PCT = 4; // each rating step moves the price 4%; crossing the junk line adds 4% more
export const isJunk = r => LADDER.indexOf(r) >= 4;
export const ratingFor = t => SCALE.find(([lo]) => t >= lo)[1];
export const bandText = r => { const i = SCALE.findIndex(s => s[1] === r); return SCALE[i][0] + "–" + (i === 0 ? 24 : SCALE[i - 1][0] - 1); };
export const fairYield = (t, r) => +(t + SPREADS[r]).toFixed(2);
export function verdict(offered, fair) { const e = +(offered - fair).toFixed(2); return e < 0 ? "Overpriced" : e < 0.3 ? "Fair price" : "Good deal"; }

/* ---------- the scorecard (same rules as The Rating Room) ---------- */
export const FACTORS = [
  { key: "history", name: "Payment history", kind: "pick", q: "Has it always paid on time?", short: ["Behind right now", "Missed one in last 5 yrs", "Late once in last 10 yrs", "Never missed, under 20 yrs", "Never missed, 20+ yrs"] },
  { key: "stability", name: "Earnings stability", kind: "pick", q: "Profit every year? Is revenue growing?", short: ["No profit any year", "Profit 1–3 yrs, or revenue down more than 10%", "Profit 4 of 5, or revenue flat / down 10% or less", "Profit every year, revenue up with a dip", "Profit every year, revenue up every year"] },
  { key: "debt", name: "Debt load", kind: "ratio", formula: "Total debt ÷ earnings", unit: "years", short: ["6 or more", "4.5 to under 6", "3 to under 4.5", "1.5 to under 3", "Under 1.5"] },
  { key: "coverage", name: "Interest coverage", kind: "ratio", formula: "Earnings ÷ yearly interest", unit: "x", short: ["Under 1.5x", "1.5x to under 3x", "3x to under 5x", "5x to under 8x", "8x or more"] },
  { key: "cash", name: "Cash cushion", kind: "ratio", formula: "Cash ÷ debt due next year", unit: "", short: ["Under 0.25", "0.25 to under 0.5", "0.5 to under 1", "1 to under 2", "2 or more"] },
  { key: "backing", name: "Backing & outlook", kind: "pick", q: "Who stands behind it? How safe is the business?", short: ["One uncertain money source", "Shrinking or heavy competition", "Rises and falls with the economy", "Leader, stable growing industry", "Taxing power or essential service"] }
];
const sDebt = (x, e) => e <= 0 ? 0 : x < 1.5 ? 4 : x < 3 ? 3 : x < 4.5 ? 2 : x < 6 ? 1 : 0;
const sCov = x => x >= 8 ? 4 : x >= 5 ? 3 : x >= 3 ? 2 : x >= 1.5 ? 1 : 0;
const sCash = x => x >= 2 ? 4 : x >= 1 ? 3 : x >= 0.5 ? 2 : x >= 0.25 ? 1 : 0;
function sStab(rev, earn) {
  const P = earn.filter(v => v > 0).length, R = (rev[4] - rev[0]) / rev[0] * 100, rising = rev.every((v, i) => i === 0 || v > rev[i - 1]);
  if (P === 0) return 0; if (P === 5 && rising) return 4; if (P === 5 && R > 0) return 3; if ((P === 5 && R >= -10) || (P === 4 && R >= -10)) return 2; return 1;
}
export function solve(c) {
  const e = c.earn[4];
  const debt = e > 0 ? c.debt / e : null, cov = e / c.interest, cash = c.cash / c.due;
  const P = c.earn.filter(v => v > 0).length, R = (c.rev[4] - c.rev[0]) / c.rev[0] * 100;
  const rising = c.rev.every((v, i) => i === 0 || v > c.rev[i - 1]);
  const scores = { history: c.history, stability: sStab(c.rev, c.earn), debt: sDebt(debt === null ? 99 : debt, e), coverage: sCov(cov), cash: sCash(cash), backing: c.backing };
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return { ratios: { debt, cov, cash, P, R, rising }, scores, total, rating: ratingFor(total) };
}

/* ---------- the six years ---------- */
export const YEARS = [
 { year: 1, title: "Learning the Desk", t0: 4.0, t1: 4.0, rateNews: "The Fed says it will hold interest rates steady all year.",
   issuer: { name: "Lakeview Water District", type: "Municipal revenue bond, 10 years", what: "Supplies drinking water to 300,000 homes. Bonds are repaid from water bills.", munis: true,
     rev: [180, 186, 192, 199, 205], earn: [30, 31, 33, 34, 36], debt: 90, interest: 9, cash: 30, due: 12,
     history: 4, historyText: "Has sold bonds since 1971. Every payment on time.", backing: 4, backingText: "Water is an essential service: people pay their water bill in any economy.",
     notes: ["Has sold bonds since 1971. Every payment on time.", "Water is an essential service: people pay their water bill in any economy.", "The district's new logo won a design award.", "Water rates go up about 3% every year, as planned."] },
   bond: { posted: "AA", years: 10, sens: 8, yld: 5.2 },
   lesson: "Sometimes the agency is right and the price is good. Your scorecard agreed with the AA, the bond paid 0.4% more than fair, and rates held steady: a clean win." },

 { year: 2, title: "The Stale Rating", t0: 4.0, t1: 4.5, rateNews: "Inflation ticks up. The Fed may raise rates a little this year.",
   issuer: { name: "Crestline Cruises", type: "Corporate bond, 5 years", what: "Runs 14 cruise ships to the Caribbean and Alaska.",
     rev: [2400, 2350, 2200, 2050, 1950], earn: [600, 520, 440, 380, 330], debt: 2100, interest: 150, cash: 300, due: 250,
     history: 4, historyText: "Has borrowed for 25 years and never missed a payment.", backing: 2, backingText: "Cruise bookings rise and fall with the economy.",
     notes: ["Agencies rated Crestline A back in 2022, when ships sailed full.", "Has borrowed for 25 years and never missed a payment.", "Borrowed $900 million in 2025 to build two new ships.", "Cruise bookings rise and fall with the economy.", "Its newest ship has the world's longest water slide."] },
   bond: { posted: "A", years: 5, sens: 4, yld: 5.5 },
   lesson: "The posted A was from 2022. The numbers today say BB: falling revenue and a mountain of new debt. The bond was priced like an A, so it paid far too little for a BB. When your scorecard says lower than the posted rating, a downgrade is coming." },

 { year: 3, title: "The Hidden Gem", t0: 4.5, t1: 3.5, rateNews: "Recession worries grow. The Fed signals big rate cuts ahead.",
   issuer: { name: "Northfield Medical Center", type: "Hospital revenue bond, 15 years", what: "A 400-bed regional hospital. Bonds are repaid from patient revenue.", munis: true,
     rev: [400, 420, 415, 440, 460], earn: [90, 96, 92, 110, 120], debt: 300, interest: 20, cash: 25, due: 30,
     history: 3, historyText: "Has borrowed since 2014 and never missed a payment.", backing: 4, backingText: "Hospitals are an essential service.",
     notes: ["Rated BBB in 2021, when it was half its size.", "Has borrowed since 2014 and never missed a payment.", "Hospitals are an essential service.", "Its CEO was named Healthcare Leader of the Year.", "Opened a new cancer wing in 2025, paid for in cash."] },
   bond: { posted: "BBB", years: 15, sens: 11, yld: 6.7 },
   lesson: "The posted BBB was out of date in the good direction. Your scorecard says A, so the bond paid a full 1.0% more than fair. Then two wins stacked up: an upgrade, and falling rates lifting a long 15-year bond." },

 { year: 4, title: "The Yield Trap", t0: 3.5, t1: 3.5, rateNews: "Rates hold steady. Investors are hungry for higher yields.",
   issuer: { name: "Volt Scooters", type: "Corporate bond, 3 years", what: "Rents electric scooters by app in 40 cities.",
     rev: [80, 150, 260, 310, 290], earn: [-30, -20, -8, 12, -6], debt: 450, interest: 40, cash: 20, due: 120,
     history: 1, historyText: "Missed an interest payment in 2024, then caught up two months later.", backing: 1, backingText: "Dozens of scooter companies fight for the same riders.",
     notes: ["Missed an interest payment in 2024, then caught up two months later.", "Made a profit in only 1 of the last 5 years.", "Dozens of scooter companies fight for the same riders.", "Two big cities are voting on whether to ban rental scooters.", "Volt's app is #1 in the travel category."] },
   bond: { posted: "B", years: 3, sens: 3, yld: 9.5, defaults: true },
   lesson: "A 9.5% yield looked like a good deal next to the posted B (fair 9.0%). But the numbers say CCC: losses, almost no cash, and $120 million due with $20 million on hand. CCC's fair yield is 13.5%, so 9.5% was nowhere near enough. Volt defaulted." },

 { year: 5, title: "Right Rating, Wrong Time", t0: 3.5, t1: 4.5, rateNews: "Inflation jumps. The Fed promises to keep raising rates until it's under control.",
   issuer: { name: "Granite Peak Power", type: "Utility bond, 20 years", what: "Electric company serving 1.2 million homes and businesses.",
     rev: [1500, 1560, 1540, 1600, 1650], earn: [300, 310, 305, 320, 330], debt: 1300, interest: 90, cash: 150, due: 200,
     history: 4, historyText: "Has sold bonds since 1960. Every payment on time.", backing: 4, backingText: "Electricity is an essential service.",
     notes: ["Has sold bonds since 1960. Every payment on time.", "Electricity is an essential service.", "Plans a new solar farm, paid for with this bond.", "Its headquarters is getting a new rooftop garden."] },
   bond: { posted: "A", years: 20, sens: 13, yld: 5.0 },
   lesson: "Your rating was right and the price was a good deal, but the rate headline was the real story. Rates rose 1%, so a 20-year bond lost about 13% of its price. A great borrower can still be a bad buy when rates are about to rise." },

 { year: 6, title: "The Comeback", t0: 4.5, t1: 4.0, rateNews: "Inflation is cooling. A small rate cut is expected.",
   issuer: { name: "Sunrise Snack Foods", type: "Corporate bond, 7 years", what: "Makes chips, pretzels and granola bars sold in 9,000 stores.",
     rev: [900, 940, 925, 1010, 1060], earn: [70, 85, 95, 105, 120], debt: 520, interest: 45, cash: 60, due: 100,
     history: 4, historyText: "Has borrowed for 30 years and never missed a payment.", backing: 3, backingText: "A top-three snack brand in a steady, growing industry.",
     notes: ["Agencies cut Sunrise to BB in 2022 after a big product recall.", "Has borrowed for 30 years and never missed a payment.", "Has paid down debt every year since the recall.", "A top-three snack brand in a steady, growing industry.", "Its new spicy pretzel went viral online."] },
   bond: { posted: "BB", years: 7, sens: 6, yld: 8.1 },
   lesson: "The BB was left over from the 2022 recall. Since then Sunrise paid down debt and grew every year, and the scorecard says BBB, back to investment grade. That's two rating moves in one: a step up AND crossing the junk line. Remember the fund rule: it's still posted as junk, so $300K would cost a fine." }
];
YEARS.forEach(y => { y.truth = solve(y.issuer); y.issuer.notes = y.issuer.notes || []; });

/* ---------- what happens to the bond ---------- */
export function ratingMove(from, to) {
  const a = LADDER.indexOf(from), b = LADDER.indexOf(to), steps = a - b; // + = upgrade
  const crossed = isJunk(from) !== isJunk(to);
  const pct = steps === 0 ? 0 : Math.sign(steps) * (Math.abs(steps) * STEP_PCT + (crossed ? LINE_PCT : 0));
  const label = steps === 0 ? "No change" : (steps > 0 ? "Upgraded " : "Downgraded ") + from + " → " + to + (crossed ? (steps > 0 ? " (out of junk)" : " (into junk)") : "");
  return { steps, crossed, pct, label };
}
export function bondReturn(y) {
  const b = y.bond, truth = y.truth.rating;
  if (b.defaults) return { coupon: 0, rate: 0, credit: -(100 - RECOVERY), total: -(100 - RECOVERY), isDefault: true, move: { label: "DEFAULT", pct: null }, endPrice: RECOVERY };
  const move = ratingMove(b.posted, truth), rate = +(-b.sens * (y.t1 - y.t0)).toFixed(2), coupon = b.yld;
  const total = +(coupon + move.pct + rate).toFixed(2);
  return { coupon, rate, credit: move.pct, total, isDefault: false, move, endPrice: +(100 + move.pct + rate).toFixed(2) };
}
export function scoreYear(i, amt, start) {
  const y = YEARS[i]; amt = AMOUNTS.includes(amt) ? amt : 0;
  const ret = bondReturn(y), bondGain = Math.round(amt * ret.total / 100), interest = Math.round(amt * ret.coupon / 100);
  const cash = Math.max(0, start - amt), cashGain = Math.round(cash * y.t0 / 100);
  const fine = isJunk(y.bond.posted) && amt > JUNK_LIMIT ? JUNK_FINE : 0;
  const gain = bondGain + cashGain - fine;
  return { amt, ret, bondGain, interest, priceGain: bondGain - interest, cash, cashGain, fine, gain, end: start + gain };
}
export function runFund(picks, through = YEARS.length - 1) {
  let v = START_FUND; const yrs = [];
  for (let i = 0; i <= through; i++) { const s = scoreYear(i, picks[i] || 0, v); yrs.push(s); v = s.end; }
  return { value: v, years: yrs };
}
export function bestPick(i, start) { let best = null; for (const a of AMOUNTS) { const s = scoreYear(i, a, start); if (!best || s.gain > best.s.gain) best = { a, s }; } return best; }
export function bestFund() { let v = START_FUND; const picks = []; YEARS.forEach((_, i) => { const b = bestPick(i, v); picks.push(b.a); v = b.s.end; }); return { value: v, picks }; }

export const money = v => (v < 0 ? "−$" : "$") + Math.abs(Math.round(v)).toLocaleString("en-US");
export const signed = v => (v > 0 ? "+" : v < 0 ? "−" : "") + "$" + Math.abs(Math.round(v)).toLocaleString("en-US");
export const pct = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
