// Hash Wars Live: all the numbers, wording and scoring for the Bitcoin mining game.
// Shared by the server (mine-core.js), the host screen and the iPads, so everyone computes the same results.
// Every desk starts with $10,000, builds a rig, then plays five half-year rounds (Jan 2027 to Jun 2029).
// Each round is three taps: a Prove It question (right answer = +1 analyst point), run or shut off, and hold or sell
// Bitcoin. Any round a desk can Cash out instead: sell every machine and all its Bitcoin, then sit out (it still answers
// Prove It). The power plan is locked at the build. Final score = net worth + $400 per analyst point.

export const START_CASH = 10000, DAYS = 182, POOL_FEE = 0.02, FEES_PER_BLOCK = 0.02, SELL_PCT = 0.85;
export const POINT_VALUE = 400, CALC_BONUS = 250;
export const N = 5; // rounds after the build

export const MODELS = {
  xp:  { name: "Antminer S21 XP", short: "S21 XP", th: 270, kw: 3.645, jth: 13.5, tag: "Newest, most efficient" },
  pro: { name: "Antminer S21 Pro", short: "S21 Pro", th: 234, kw: 3.51, jth: 15.0, tag: "Popular workhorse" },
  old: { name: "Antminer S19j Pro (used)", short: "S19j Pro", th: 104, kw: 3.068, jth: 29.5, tag: "Old, cheap, power hungry" }
};
export const MODEL_KEYS = ["xp", "pro", "old"];
// Market price of each model. Index 0 = build, 1 to 5 = Round 1 to 5 (cash-out price is 85% of this), 6 = end of the game.
// Machine prices rise in the bull run and crash after the halving, like the real used-miner market.
export const MARKET = {
  xp:  [5000, 5000, 5800, 4600, 3600, 2900, 2400],
  pro: [3100, 3100, 3700, 2800, 2100, 1700, 1300],
  old: [400, 380, 500, 200, 120, 80, 60]
};
export const PLANS = {
  home: { name: "Home garage", rate: 0.16, setup: 600, max: 2, note: "$0.16/kWh. $600 for an electrician to add a 240V circuit. Your house can run 2 machines at most." },
  host: { name: "Hosting facility", rate: 0.08, setup: 0, note: "$0.08/kWh. A company runs your machines in its warehouse. No setup cost, any number of machines." },
  ind:  { name: "Industrial contract", rate: 0.05, setup: 1000, min: 3, fixed: true, note: "$0.05/kWh, locked in (price never changes). $1,000 setup. You need at least 3 machines." }
};
export const PLAN_KEYS = ["home", "host", "ind"];

// r = 1..5. price = BTC price for the round, net = network hashrate (EH/s), reward = average block reward for the round,
// pm = power price multiplier for home and hosting plans (industrial is locked).
export const ROUNDS = [null,
  { tag: "Round 1", when: "Jan to Jun 2027", title: "The Gold Rush", icon: "⛏️",
    story: "Mining news is everywhere and thousands of new machines plug in around the world. The network's hashrate climbs from 1,020 to 1,120 EH/s. The Bitcoin price holds steady.",
    price: 76000, net: 1120, reward: 3.125, rewardText: "3.125 BTC", pm: 1, est: true,
    q: { text: "The network's hashrate rose about 10%, but your machines didn't change. What happens to the Bitcoin YOUR machines mine?", opts: ["More Bitcoin", "Less Bitcoin", "About the same"], ans: 1,
      why: "The network still makes about 144 blocks a day, no matter how many machines join. Your share is your hashrate divided by the network's. More competition means a smaller slice for you." },
    calc: { text: "Show the math: what does ONE Antminer S21 Pro (3.51 kW) cost per day to run on YOUR power plan?", unit: "$ per day", kind: "pro_day",
      why: "Daily power cost = kW × 24 hours × your price per kWh. For an S21 Pro: 3.51 × 24 = 84.24 kWh a day. Home: $13.48. Hosting: $6.74. Industrial: $4.21." } },
  { tag: "Round 2", when: "Jul to Dec 2027", title: "Bull Run", icon: "🚀",
    story: "Big investment funds pile into Bitcoin and the price rockets from $76,000 to $112,000. Mining looks like a money machine, so more miners join (1,260 EH/s) and the price of mining machines jumps too.",
    price: 112000, net: 1260, reward: 3.125, rewardText: "3.125 BTC", pm: 1, est: true,
    q: { text: "Bitcoin's price jumped about 47%. What happens to the breakeven electricity price (the most you can pay for power and still make money)?", opts: ["It goes up", "It goes down", "It stays the same"], ans: 0,
      why: "Every Bitcoin you mine is worth more, so each kWh of power earns more. You can afford pricier electricity before you start losing money. That's why bull markets pull in more miners." } },
  { tag: "Round 3", when: "Jan to Jun 2028", title: "The Halving", icon: "✂️",
    story: "In April 2028 the block reward is cut in half, from 3.125 to 1.5625 BTC, as it is every four years. Half of this round is before the halving and half is after. The price slips to $104,000 and the network keeps growing (1,300 EH/s).",
    price: 104000, net: 1300, reward: 2.34375, rewardText: "3.125, then 1.5625 BTC", pm: 1, est: false, writeup: true,
    q: { text: "Compared to last round, how much Bitcoin will each of your machines mine this round?", opts: ["About the same", "About 25% less", "About 50% less", "More"], ans: 1,
      why: "Only half the round is after the halving, so the average reward drops about 25%, not 50%. The network also grew a little. Next round is the full 50% cut." } },
  { tag: "Round 4", when: "Jul to Dec 2028", title: "Heat Wave Shakeout", icon: "🔥",
    story: "A summer heat wave pushes electricity prices up 25% for homes and hosting facilities. (Industrial contracts are locked in.) With half the reward, thousands of miners can't pay their bills and shut off. The network shrinks to 1,120 EH/s. Bitcoin dips to $88,000.",
    price: 88000, net: 1120, reward: 1.5625, rewardText: "1.5625 BTC", pm: 1.25, est: false,
    q: { text: "Thousands of miners shut off and the network's hashrate fell about 14%. If you keep running, what happens to the Bitcoin each of YOUR machines mines?", opts: ["More Bitcoin", "Less Bitcoin", "About the same"], ans: 0,
      why: "Fewer machines are splitting the same ~144 blocks a day, so your slice gets bigger. The difficulty adjustment means mining gets easier when miners leave. That's how the network corrects itself." } },
  { tag: "Round 5", when: "Jan to Jun 2029", title: "Crypto Winter", icon: "❄️",
    story: "The excitement fades. Bitcoin slides to $64,000 and power prices go back to normal. Some miners come back (1,180 EH/s). Mining machines are now cheap on the used market.",
    price: 64000, net: 1180, reward: 1.5625, rewardText: "1.5625 BTC", pm: 1, est: false,
    q: { text: "Which miner gets hurt the MOST by the price drop?", opts: ["Industrial power, newest machines", "Hosting facility, S21 Pros", "Home garage, old S19j Pros"], ans: 2,
      why: "Old machines burn about twice the energy per guess (29.5 J/TH vs 13.5), and home power costs three times industrial. Highest cost per Bitcoin means the smallest margin, so a price drop wipes them out first." } }
];
export const HALVING_ROUND = 3;
export const writeupPrompt = "In 1 to 2 sentences: why did your revenue drop this round, and what is your desk doing about it?";

// Individual exit ticket (each student, own iPad)
export const EXIT = [
  { q: "What job do miners do for the Bitcoin network?", opts: ["They set the price of Bitcoin", "They confirm transactions and add new blocks, which secures the ledger", "They store everyone's passwords", "They print paper Bitcoin"], ans: 1 },
  { q: "Your miner's share of the network's total hashrate decides...", opts: ["Your share of the block rewards", "The price of Bitcoin", "Your electricity rate", "How many blocks are made each day"], ans: 0 },
  { q: "Why do big mining companies build next to cheap power like dams and gas wells?", opts: ["Electricity is their biggest ongoing cost, so cheap power means more profit", "The law requires it", "Machines run faster near water", "It makes Bitcoin's price go up"], ans: 0 },
  { q: "Right after a halving, if the price and network stay the same, a miner's revenue...", opts: ["Doubles", "Stays the same", "Falls by about half", "Goes to zero"], ans: 2 },
  { q: "Machine A uses 15 J/TH. Machine B uses 30 J/TH. Which is better, and why?", opts: ["B, because the bigger number is stronger", "A, because it uses half the energy for the same work", "They're the same", "B, because it mines more Bitcoin"], ans: 1 }
];

/* ---------- math ---------- */
export const rateFor = (plan, r) => { const p = PLANS[plan]; if (!p) return 0; return p.fixed || !r ? p.rate : p.rate * ROUNDS[r].pm; };
export const unitBTC = (m, r) => MODELS[m].th / (ROUNDS[r].net * 1e6) * 144 * DAYS * (ROUNDS[r].reward + FEES_PER_BLOCK) * (1 - POOL_FEE);
export const unitPower = (m, plan, r) => MODELS[m].kw * 24 * DAYS * rateFor(plan, r);
export const sellPrice = (m, idx) => Math.round(MARKET[m][idx] * SELL_PCT);
export const count = rig => MODEL_KEYS.reduce((a, k) => a + (rig[k] || 0), 0);
export const calcAnswer = (r, plan) => { const c = ROUNDS[r] && ROUNDS[r].calc; if (!c) return null; return c.kind === "pro_day" ? MODELS.pro.kw * 24 * rateFor(plan, r) : c.answer; };
export const calcRight = (r, plan, v) => { const a = calcAnswer(r, plan), x = parseFloat(String(v ?? "").replace(/[$,\s]/g, "")); return a != null && isFinite(x) && Math.abs(x - a) <= Math.max(0.05 * a, 0.01); };

// Empty desk before the build
export const blankDesk = () => ({ cash: START_CASH, btc: 0, plan: null, rig: { xp: 0, pro: 0, old: 0 }, pts: 0, built: false, out: false });
const intq = v => Math.max(0, Math.min(20, Math.floor(+v || 0)));

// Applies one decision to a copy of a desk. r = 0 for the build, 1..5 for rounds.
// Returns { desk, row, err }. With strict, an impossible build returns err (the server uses this to refuse it).
export function apply(desk0, d, r, award, strict) {
  const desk = JSON.parse(JSON.stringify(desk0)), row = { r, startCash: desk.cash };
  const err = m => ({ desk: desk0, row: null, err: m });
  d = d || null;
  if (r === 0) {
    if (!d) return { desk, row: { r, skipped: true } };
    const plan = d.plan; if (!PLANS[plan]) return strict ? err("Pick a power plan.") : { desk, row: { r, skipped: true } };
    const buy = {}; MODEL_KEYS.forEach(k => buy[k] = intq((d.buy || {})[k]));
    const n = count(buy), cost = MODEL_KEYS.reduce((a, k) => a + buy[k] * MARKET[k][0], 0) + PLANS[plan].setup;
    if (n < 1) return strict ? err("Buy at least one machine.") : { desk, row: { r, skipped: true } };
    if (PLANS[plan].max && n > PLANS[plan].max) return strict ? err(`Your garage can only run ${PLANS[plan].max} machines.`) : { desk, row: { r, skipped: true } };
    if (PLANS[plan].min && n < PLANS[plan].min) return strict ? err(`An industrial contract needs at least ${PLANS[plan].min} machines.`) : { desk, row: { r, skipped: true } };
    if (cost > desk.cash) return strict ? err(`That costs $${cost.toLocaleString()}. You have $${desk.cash.toLocaleString()}.`) : { desk, row: { r, skipped: true } };
    desk.cash -= cost; desk.plan = plan; desk.rig = buy; desk.built = true;
    Object.assign(row, { plan, buy, spent: cost, setup: PLANS[plan].setup });
    row.endCash = desk.cash; row.nw = netWorth(desk, 1); return { desk, row };
  }
  const R = ROUNDS[r], plan = desk.plan;
  d = d || { run: true, sell: false };
  // Prove It points and bonus (desks that cashed out still answer)
  const qRight = d.q === R.q.ans, cRight = !!(R.calc && calcRight(r, plan, d.calc));
  if (cRight) desk.cash += CALC_BONUS;
  const gained = (qRight ? 1 : 0) + (cRight ? 1 : 0) + (award ? 1 : 0);
  desk.pts += gained;
  Object.assign(row, { plan, qRight, cRight, award: !!award, gained, bonus: cRight ? CALC_BONUS : 0, answered: d.q !== undefined && d.q !== null });
  if (desk.out) { Object.assign(row, { out: true, run: false, mined: 0, minedUSD: 0, power: 0, rig: { ...desk.rig } }); row.endCash = desk.cash; row.btcHeld = 0; row.nw = desk.cash; row.pts = desk.pts; return { desk, row }; }
  if (d.cashout) {
    let sold = 0; MODEL_KEYS.forEach(k => { sold += (desk.rig[k] || 0) * sellPrice(k, r); });
    Object.assign(row, { cashout: true, rig: { ...desk.rig }, sold, run: false, mined: 0, minedUSD: 0, power: 0, btcSold: desk.btc, btcCash: desk.btc * R.price, sellBTC: true });
    desk.cash += sold + desk.btc * R.price; desk.btc = 0; desk.rig = { xp: 0, pro: 0, old: 0 }; desk.out = true;
    row.endCash = desk.cash; row.btcHeld = 0; row.nw = desk.cash; row.pts = desk.pts; return { desk, row };
  }
  // run or shut off
  const run = d.run !== false && count(desk.rig) > 0;
  let btc = 0, power = 0;
  if (run) MODEL_KEYS.forEach(k => { btc += desk.rig[k] * unitBTC(k, r); power += desk.rig[k] * unitPower(k, plan, r); });
  desk.cash -= power; desk.btc += btc;
  Object.assign(row, { rig: { ...desk.rig }, run, mined: btc, minedUSD: btc * R.price, power });
  // sell or hold Bitcoin
  row.sellBTC = !!d.sell;
  if (d.sell && desk.btc > 0) { row.btcSold = desk.btc; row.btcCash = desk.btc * R.price; desk.cash += desk.btc * R.price; desk.btc = 0; }
  row.endCash = desk.cash; row.btcHeld = desk.btc; row.nw = netWorth(desk, r + 1, R.price); row.pts = desk.pts;
  return { desk, row };
}
// Net worth: cash + Bitcoin at the round's price + machines at what they'd sell for at idx.
export function netWorth(desk, idx, price) {
  const p = price ?? (ROUNDS[Math.max(1, Math.min(N, idx - 1))] || ROUNDS[1]).price;
  return desk.cash + desk.btc * p + MODEL_KEYS.reduce((a, k) => a + (desk.rig[k] || 0) * sellPrice(k, Math.min(6, idx)), 0);
}
export const score = (nw, pts) => nw + POINT_VALUE * pts;

// Replays every desk through rounds 0..upto. decisions[r][gid] = decision. awards = { gid: true } for the halving write-up.
export function replay(gids, decisions, awards, upto) {
  const out = {};
  for (const gid of gids) {
    let desk = blankDesk(); const rows = [];
    for (let r = 0; r <= upto; r++) {
      const d = (decisions[r] || {})[gid];
      if (r > 0 && !desk.built) { rows.push({ r, skipped: true, nw: desk.cash, pts: desk.pts }); continue; }
      const res = apply(desk, d, r, r === HALVING_ROUND && awards && awards[gid], false);
      desk = res.desk; rows.push(res.row);
    }
    const last = rows[rows.length - 1] || {};
    const nw = last.nw ?? desk.cash;
    out[gid] = { desk, rows, nw, pts: desk.pts, score: score(nw, desk.pts) };
  }
  return out;
}
// Standings after round upto, best score first
export function standings(groups, decisions, awards, upto) {
  const rp = replay(groups.map(g => g.gid), decisions, awards, upto);
  return groups.map(g => ({ g, ...rp[g.gid] })).sort((a, b) => b.score - a.score);
}
