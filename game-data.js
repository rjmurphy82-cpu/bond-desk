// The Bond Desk: all game content and scoring rules. Shared by the host screen, the student screen and tests.
export const START_FUND = 1000000;
export const AMOUNTS = [0, 100000, 200000];
export const JUNK_LIMIT = 200000;     // investment policy: max in BB-or-below bonds per year
export const JUNK_FINE = 25000;
export const LADDER = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"];
export const SPREADS = { AAA: 0.5, AA: 0.8, A: 1.2, BBB: 2.0, BB: 3.5, B: 5.5, CCC: 10.0 };
export const isJunk = r => LADDER.indexOf(r) >= 4;
export const fairYield = (t, r) => +(t + SPREADS[r]).toFixed(2);
export const RECOVERY = 40; // cents per dollar after a default

// Credit events and their price effect (percent)
export const EVENT_RULES = [
  ["Upgraded one step (investment grade)", "+3%"],
  ["Upgraded into or within junk, or junk up to investment grade", "+8%"],
  ["Downgraded one step (investment grade)", "−4%"],
  ["Downgraded from BBB into junk, or one step within junk", "−8%"],
  ["Default: no interest paid, bondholders get back 40¢ per $1", "−60% total"]
];

export const ROUNDS = [
 { year: 1, title: "Calm Waters", t0: 4.0, t1: 4.0,
   news: [
    "The Fed says it plans to hold interest rates steady all year.",
    "A new smartphone launch breaks first-week sales records.",
    "Report: Summit Software is in talks to buy its biggest rival, paid for mostly with borrowed money.",
    "Summer travel bookings hit a record high.",
    "Elm Ridge voters approve the school district's budget by a wide margin."],
   bonds: [
    { id: "A", issuer: "Elm Ridge School District", rating: "AA", years: 10, sens: 8, yld: 5.3, what: "Municipal bond repaid with property taxes." },
    { id: "B", issuer: "Summit Software Inc.", rating: "AAA", years: 5, sens: 4, yld: 4.3, what: "Accounting software used by 40,000 businesses." },
    { id: "C", issuer: "Midwest Hotels Group", rating: "BBB", years: 7, sens: 6, yld: 6.4, what: "Owns 140 hotels near airports and highways." }],
   outcome: {
    rateNote: "Rates stayed at 4.0% all year.",
    A: { event: null, story: "A quiet year. Taxes came in, every payment was made." },
    B: { event: { label: "Downgraded AAA → AA", pct: -4 }, story: "Summit borrowed $6 billion to buy its rival. With far more debt, raters cut it from AAA to AA." },
    C: { event: null, story: "Record travel season. Every payment made, rating unchanged." } },
   why: {
    A: ["Fair yield for AA = 4.0% + 0.8% = 4.8%. It offered 5.3%, so you were paid 0.5% extra.", "No warning signs in the news.", "A safe bond at a better-than-fair price in a quiet year is a solid buy."],
    B: ["Fair yield for AAA = 4.0% + 0.5% = 4.5%. It offered only 4.3%: overpriced.", "The buyout headline was the warning. A big pile of new borrowing almost always means a lower rating.", "When a bond pays less than fair, you need a strong reason to buy it. There wasn't one."],
    C: ["Fair yield for BBB = 4.0% + 2.0% = 6.0%. It offered 6.4%: a good deal.", "Record travel bookings meant a strong year for hotels.", "A good price plus good news for the business = buy."] } },

 { year: 2, title: "Storm Clouds", t0: 4.0, t1: 3.5,
   news: [
    "Economists warn a recession may be coming. Shoppers and travelers are cutting back.",
    "Two more anchor stores at Northgate malls announce they are closing.",
    "A record heat wave rolls across the Midwest.",
    "The Fed hints it may cut interest rates to support the economy.",
    "Riverside Water Authority finishes a new treatment plant on time and on budget."],
   bonds: [
    { id: "A", issuer: "Northgate Malls", rating: "BB", years: 7, sens: 6, yld: 7.0, what: "Owns 22 indoor shopping malls." },
    { id: "B", issuer: "Riverside Water Authority", rating: "AA", years: 20, sens: 13, yld: 5.2, what: "Drinking water for 600,000 people, repaid from water bills." },
    { id: "C", issuer: "Midwest Hotels Group", rating: "BBB", years: 5, sens: 4, yld: 6.5, what: "Owns 140 hotels near airports and highways." }],
   outcome: {
    rateNote: "The recession hit and the Fed cut rates from 4.0% to 3.5%. Bond prices rose: the longer the bond, the bigger the gain.",
    A: { event: { label: "Downgraded BB → B", pct: -8 }, story: "Store closings spread and mall traffic fell. Raters cut Northgate deeper into junk." },
    B: { event: null, story: "People pay their water bill in any economy. Payments arrived on time, and the rate cut lifted this long bond's price." },
    C: { event: { label: "Downgraded BBB → BB (fell to junk)", pct: -8 }, story: "Travel collapsed in the recession. Hotel profits dropped and raters cut Midwest to junk." } },
   why: {
    A: ["Fair yield for BB = 4.0% + 3.5% = 7.5%. It offered only 7.0%: overpriced.", "More anchor stores closing, in a recession, is bad news for a mall owner.", "Overpriced AND bad news. Easy pass."],
    B: ["Fair yield for AA = 4.0% + 0.8% = 4.8%. It offered 5.2%: a good deal.", "Water is an essential service, and the Fed hinted at rate cuts. Long bonds gain the most when rates fall.", "In a recession, safe and long is where you want to be."],
    C: ["Fair yield for BBB = 4.0% + 2.0% = 6.0%. It offered 6.5%: a good deal on paper.", "The recession warning was the trap. Hotel profits rise and fall with the economy.", "A good price is not enough if the news says the business is about to get hit."] } },

 { year: 3, title: "The Fed Strikes", t0: 3.5, t1: 4.5,
   news: [
    "Inflation jumps to its highest level in three years.",
    "Prairie State Power wins a state award for its storm response.",
    "Heartland Freight Rail signs a 10-year contract to haul goods for the nation's largest retailer.",
    "The Fed warns it will raise interest rates this year, possibly more than once.",
    "Summit Software's new CEO promises \"bold moves.\""],
   bonds: [
    { id: "A", issuer: "Prairie State Power", rating: "A", years: 20, sens: 13, yld: 5.0, what: "Electric company serving 2 million homes and businesses." },
    { id: "B", issuer: "Summit Software Inc.", rating: "AA", years: 10, sens: 8, yld: 4.1, what: "Accounting software used by 40,000 businesses." },
    { id: "C", issuer: "Heartland Freight Rail", rating: "BBB", years: 3, sens: 3, yld: 6.4, what: "Freight railroad hauling grain, cars and containers across 12 states." }],
   outcome: {
    rateNote: "The Fed raised rates from 3.5% to 4.5%. Every bond's price fell: the longer the bond, the bigger the drop.",
    A: { event: null, story: "Prairie paid every dollar of interest. But a 20-year bond loses about 13% of its price when rates jump 1%." },
    B: { event: null, story: "Summit paid on time, but its 10-year bond lost about 8% of its price when rates rose." },
    C: { event: { label: "Upgraded BBB → A", pct: 3 }, story: "The new 10-year contract made Heartland's earnings far steadier. Raters upgraded it from BBB to A." } },
   why: {
    A: ["Fair yield for A = 3.5% + 1.2% = 4.7%. It offered 5.0%: a fair deal.", "The Fed warned of rate hikes. A 20-year bond is the worst place to be when rates rise.", "Even a good company's bond can lose money. Watch the rate forecast and the maturity."],
    B: ["Fair yield for AA = 3.5% + 0.8% = 4.3%. It offered only 4.1%: overpriced.", "Rate hikes were coming, and this is a 10-year bond.", "Overpriced and long when rates are rising. Double pass."],
    C: ["Fair yield for BBB = 3.5% + 2.0% = 5.5%. It offered 6.4%: a great deal.", "Short bond (only 3 years), so rate hikes barely hurt it. Plus the big new contract pointed to an upgrade.", "When rates are rising, short bonds with good news win."] } },

 { year: 4, title: "Reach for Yield", t0: 4.5, t1: 4.5,
   news: [
    "Rates hold steady. Investors are hungry for higher yields, and riskier companies are rushing to borrow.",
    "Blaze Energy Drinks signs a famous NBA star to a new endorsement deal.",
    "The Tri-County minor-league team signs a new 15-year lease to stay at its stadium.",
    "Blaze's two biggest retail customers launch their own cheaper store-brand energy drinks.",
    "Riverside Water raises its rates 2%, the same as every year."],
   bonds: [
    { id: "A", issuer: "Blaze Energy Drinks", rating: "B", years: 5, sens: 4, yld: 9.0, what: "Fast-growing energy drink brand sold in gas stations and grocery stores." },
    { id: "B", issuer: "Tri-County Stadium Authority", rating: "CCC", years: 10, sens: 8, yld: 16.0, what: "Owns a minor-league stadium. Repaid from tickets and parking." },
    { id: "C", issuer: "Riverside Water Authority", rating: "AA", years: 10, sens: 8, yld: 5.4, what: "Drinking water for 600,000 people, repaid from water bills." }],
   outcome: {
    rateNote: "Rates stayed at 4.5% all year.",
    A: { event: { label: "DEFAULT", pct: null, default: true }, story: "Store brands took Blaze's shelf space. Sales fell, Blaze missed an interest payment and filed for bankruptcy. Bondholders got back 40¢ per dollar." },
    B: { event: { label: "Upgraded CCC → B", pct: 8 }, story: "With the team locked in for 15 years, ticket and parking money is safe. Raters lifted the stadium from CCC to B." },
    C: { event: null, story: "Another quiet year of water bills. Every payment on time." } },
   why: {
    A: ["Fair yield for B = 4.5% + 5.5% = 10.0%. It offered only 9.0%: overpriced for its risk.", "Losing shelf space at its two biggest customers was the real news. The NBA deal was noise.", "A high yield is not a good deal if it is still below fair. Junk that is overpriced can wipe you out."],
    B: ["Fair yield for CCC = 4.5% + 10.0% = 14.5%. It offered 16.0%: a good deal.", "The 15-year lease removed the stadium's biggest risk: the team leaving.", "Risky bonds can be great buys when the price is right and the news removes the danger."],
    C: ["Fair yield for AA = 4.5% + 0.8% = 5.3%. It offered 5.4%: fair.", "No warning signs and steady rates.", "Boring is fine. A fair price on a safe bond beats cash."] } },

 { year: 5, title: "The Recovery", t0: 4.5, t1: 4.0,
   news: [
    "Inflation is cooling. Most economists expect the Fed to cut rates before year end.",
    "Prairie State Power's CEO retires after 12 years.",
    "Northgate warns it may not be able to repay $300 million of debt due next year.",
    "Northgate's largest mall opens a new trampoline park.",
    "Business travel bounces back: Midwest Hotels bookings are up 20%."],
   bonds: [
    { id: "A", issuer: "Prairie State Power", rating: "A", years: 20, sens: 13, yld: 5.9, what: "Electric company serving 2 million homes and businesses." },
    { id: "B", issuer: "Northgate Malls", rating: "B", years: 5, sens: 4, yld: 9.5, what: "Owns 22 indoor shopping malls." },
    { id: "C", issuer: "Midwest Hotels Group", rating: "BB", years: 5, sens: 4, yld: 8.6, what: "Owns 140 hotels near airports and highways." }],
   outcome: {
    rateNote: "The Fed cut rates from 4.5% to 4.0%. Bond prices rose: long bonds gained the most.",
    A: { event: null, story: "Prairie paid on time, and its 20-year bond gained about 6.5% when rates fell." },
    B: { event: { label: "DEFAULT", pct: null, default: true }, story: "Northgate could not repay the $300 million and defaulted. Bondholders got back 40¢ per dollar." },
    C: { event: { label: "Upgraded BB → BBB (back to investment grade)", pct: 8 }, story: "Travel came roaring back. Raters returned Midwest to investment grade." } },
   why: {
    A: ["Fair yield for A = 4.5% + 1.2% = 5.7%. It offered 5.9%: a fair deal.", "Rate cuts were expected, and long bonds gain the most when rates fall. Same bond that hurt in Year 3, opposite rate call.", "Match the maturity to the rate outlook."],
    B: ["Fair yield for B = 4.5% + 5.5% = 10.0%. It offered only 9.5%: overpriced.", "\"May not be able to repay $300 million\" is about as loud as a warning gets. The trampoline park was noise.", "When a company tells you it may not pay, believe it."],
    C: ["Fair yield for BB = 4.5% + 3.5% = 8.0%. It offered 8.6%: a good deal.", "Bookings up 20% meant profits were coming back, a sign of an upgrade.", "Buying a fallen bond as its business recovers can pay off big."] } }
];
export const NROUNDS = ROUNDS.length;

// Return (percent) on a bond held for the year
export function bondReturn(round, b) {
  const o = round.outcome[b.id], dRate = round.t1 - round.t0;
  if (o.event && o.event.default) return { coupon: 0, rate: 0, credit: -(100 - RECOVERY), total: -(100 - RECOVERY), isDefault: true };
  const coupon = b.yld, rate = +(-b.sens * dRate).toFixed(2), credit = o.event ? o.event.pct : 0;
  return { coupon, rate, credit, total: +(coupon + rate + credit).toFixed(2), isDefault: false };
}
// One group's year: picks = {A: 0|100000|200000, B: ..., C: ...}
export function scoreRound(ri, picks, startValue) {
  const R = ROUNDS[ri]; picks = picks || {};
  let invested = 0, junk = 0, gain = 0; const lines = [];
  for (const b of R.bonds) {
    const amt = AMOUNTS.includes(picks[b.id]) ? picks[b.id] : 0, ret = bondReturn(R, b);
    const g = Math.round(amt * ret.total / 100);
    invested += amt; if (isJunk(b.rating)) junk += amt; gain += g;
    lines.push({ id: b.id, amt, ret, gain: g });
  }
  const cash = Math.max(0, startValue - invested), cashGain = Math.round(cash * R.t0 / 100);
  const fine = junk > JUNK_LIMIT ? JUNK_FINE : 0;
  const total = gain + cashGain - fine;
  return { lines, invested, junk, cash, cashGain, fine, gain: total, end: startValue + total };
}
// Full history for one group: decisions[r] = picks or undefined (no answer = all cash)
export function runFund(decisions, throughRound) {
  let v = START_FUND; const years = [];
  for (let r = 0; r <= throughRound; r++) { const s = scoreRound(r, decisions[r], v); years.push(s); v = s.end; }
  return { value: v, years };
}
export const money = v => (v < 0 ? "−$" : "$") + Math.abs(Math.round(v)).toLocaleString("en-US");
export const signed = v => (v > 0 ? "+" : v < 0 ? "−" : "") + "$" + Math.abs(Math.round(v)).toLocaleString("en-US");
export const pct = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
