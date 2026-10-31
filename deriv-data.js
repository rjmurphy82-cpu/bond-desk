// Unit 5: Derivatives. Content for the eight live games (four story games, four trading desks).
// Shared by the server (deriv-core.js) and every screen. Edit questions, numbers and wording here.
//
// Story game rounds:  {t:"card", title, text}   {t:"q", q, a:[4 answers], c: index of the right one, why}   {t:"board"}
// Desk game rounds:   briefing + fields (the choices a group makes) + outcome. Each desk has a result() that
//                     turns a group's choices into its result for the round. Missing answer = the desk's `dflt`.

export const UNIT = "Unit 5: Derivatives";
export const Q_SECS = 25;          // seconds per story question
export const PTS_MAX = 1000, PTS_MIN = 500;   // story points: right answer = 500 to 1,000 (faster = more)

const usd = (v, cents) => { const a = Math.abs(v), d = cents || (a % 1 !== 0 && a < 1000) ? 2 : 0; return (v < 0 ? "−" : "") + "$" + a.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); };
const sgn = v => (v > 0 ? "+" : "") + usd(v);
const num = v => v.toLocaleString("en-US");
export const fmt = { usd, sgn, num };

/* =====================================================================
   STORY GAMES (one per derivative; Kahoot style, one player per iPad)
   ===================================================================== */
const STORY = {
  futures: { title: "The Prom Bus", rounds: [
    { t: "card", title: "January", text: "Your prom group of 20 needs a party bus for May 9. Today a bus costs $600 for the night. But prom is months away, and every school in the area will be hunting for buses in the spring." },
    { t: "q", q: "Which news between now and May would most likely push the bus price ABOVE $600?", a: ["A new bus company opens in town", "Gas prices drop to a five-year low", "Diesel prices spike and bus drivers win a big raise", "Fewer schools are holding proms this year"], c: 2, why: "Fuel and wages are the bus company's biggest costs. When its costs go up, so do its prices. The other three would push prices DOWN. Not knowing what you'll pay is called price risk." },
    { t: "q", q: "If the price jumps from $600 to $900, how much more does each of the 20 people pay?", a: ["$30", "$300", "$15", "$45"], c: 2, why: "$900 − $600 = $300 more. Split 20 ways, that's $15 more each." },
    { t: "card", title: "The Deal", text: "The bus company makes an offer: sign today, and you pay $600 on prom night, no matter what buses cost in May. Both sides MUST follow through. Your group signs." },
    { t: "q", q: "What did your group lock in today?", a: ["Only the date", "The price, the date, and what you're getting", "Only which bus you get", "Nothing until May"], c: 1, why: "The deal locks in all three: what (one party bus), when (May 9), and how much ($600)." },
    { t: "card", title: "Ending 1: Bus Shortage", text: "May arrives. A bus company goes out of business and every school is scrambling. The going rate for a party bus jumps to $900." },
    { t: "q", q: "What does your group pay?", a: ["$900", "$750", "Nothing. The deal is off", "$600"], c: 3, why: "You locked in $600 in January. The higher market price can't touch your deal." },
    { t: "q", q: "How much did locking in save your group?", a: ["$300", "$600", "$900", "$150"], c: 0, why: "$900 market price − $600 locked price = $300 saved." },
    { t: "board" },
    { t: "card", title: "Ending 2: Too Many Buses", text: "Rewind. Same deal, different year. Two new bus companies open and they're desperate for customers. The going rate drops to $450." },
    { t: "q", q: "What does your group pay?", a: ["$450", "$600", "$525", "You can cancel for free"], c: 1, why: "A locked price works both ways. You still pay $600, even though buses are cheaper now." },
    { t: "q", q: "Your friend says signing the deal was a mistake. What's the best answer?", a: ["She's right. We should have waited", "The bus company cheated us", "We traded the chance to save for knowing our cost ahead of time", "The deal saved us money"], c: 2, why: "You gave up $150 of possible savings in exchange for zero surprises. That trade is the whole point." },
    { t: "card", title: "The Other Side", text: "The bus company signed the deal too. Nobody forced it. It chose to give up the chance to charge more in May." },
    { t: "q", q: "Why would the bus company agree to lock in $600 back in January?", a: ["It thinks bus prices will go up by May", "It wants to protect itself in case bus prices fall by May", "The law requires it to", "So it can charge your group more later"], c: 1, why: "The company is the SELLER. If prices drop to $450 in May, it still gets $600. If it expected prices to RISE, it would wait and charge more. Locking in protects a seller from falling prices." },
    { t: "board" },
    { t: "card", title: "It Has a Name", text: "What you signed is a FUTURES CONTRACT: an agreement made today to buy or sell something on a future date, at a price you lock in now. The buyer is LONG. The seller is SHORT." },
    { t: "q", q: "Chipotle buys tons of avocados every month. Which futures position protects it from price spikes?", a: ["Sell futures (short), like the bus company", "Don't use futures", "Buy futures (long), like your prom group", "Buy more restaurants"], c: 2, why: "Chipotle is a buyer, like your prom group. A long futures position locks in what it pays." },
    { t: "q", q: "A farmer will sell her corn at harvest in October. Which side protects her?", a: ["Buy futures (long)", "Sell futures (short)", "She can't use futures", "Wait and see"], c: 1, why: "The farmer is a seller, like the bus company. A short futures position locks in what she gets paid." },
    { t: "q", q: "A bakery locks in flour at $20 a bag for 100 bags. When it buys, flour costs $25 a bag. How much did the futures contract save?", a: ["$25", "$5", "$2,500", "$500"], c: 3, why: "($25 − $20) × 100 bags = $500 saved." },
    { t: "q", q: "What's the main reason a business uses futures?", a: ["To lock in a price and avoid surprises", "To get rich when prices move", "To avoid paying taxes", "To borrow money"], c: 0, why: "Futures are about certainty. The business knows its price ahead of time, up or down." }
  ] },
  options: { title: "The Sneaker Drop", rounds: [
    { t: "card", title: "The Drop", text: "A limited sneaker drops in 30 days for $200. Only 500 pairs. The shop sells reservations: pay $20 today and you get the RIGHT to buy one pair for $200 on release day. You don't have to buy. The $20 is not refundable." },
    { t: "q", q: "On release day, what do you HAVE to do?", a: ["Buy the shoes for $200", "Pay another $20", "Nothing. Buying is your choice", "Sell the shoes back"], c: 2, why: "A reservation is a right, not a promise. You decide on release day." },
    { t: "q", q: "What's the most money you can lose on the reservation?", a: ["$20", "$200", "$220", "Nothing"], c: 0, why: "If the deal goes bad, you skip buying. All you lose is the $20 you paid." },
    { t: "card", title: "Ending 1: Hype", text: "Release day. A famous rapper wore them on stage last night. The shoes now resell online for $350." },
    { t: "q", q: "You buy for $200 and resell for $350. What's your profit after the $20 reservation?", a: ["$150", "$350", "$170", "$130"], c: 3, why: "$350 − $200 = $150 from the flip. Minus the $20 reservation = $130." },
    { t: "card", title: "Ending 2: Flop", text: "Rewind. Different drop. The reviews are brutal: the soles peel off in a week. The shoes resell for only $150." },
    { t: "q", q: "What do you do?", a: ["Buy them for $200 anyway. It's the rule", "Walk away. You're out only the $20", "Ask for the $20 back", "Buy two pairs"], c: 1, why: "Buying at $200 to resell at $150 loses $50 more. Walk away and your loss stops at $20." },
    { t: "board" },
    { t: "card", title: "Ending 3: Close Call", text: "One more drop. This time the shoes resell for $210." },
    { t: "q", q: "Should you still buy at $200 and resell?", a: ["Yes. You get $10 back, so you're out $10 instead of $20", "No. You'd lose money", "It doesn't matter", "No. You'd have to pay another $20"], c: 0, why: "The $20 is gone either way. Buying and reselling gets $10 of it back." },
    { t: "q", q: "At what resell price do you exactly break even, counting the $20?", a: ["$200", "$180", "$220", "$240"], c: 2, why: "You need $200 + $20 = $220 to get all your money back. That's the breakeven price." },
    { t: "card", title: "It Has a Name", text: "Your reservation was a CALL OPTION: the right, but not the obligation, to BUY at a set price before a deadline. The $200 is the STRIKE PRICE. The $20 you paid is the PREMIUM." },
    { t: "q", q: "In the sneaker deal, what was the strike price?", a: ["$20", "$200", "$350", "$220"], c: 1, why: "The strike price is the set buying price: $200. The $20 was the premium." },
    { t: "board" },
    { t: "card", title: "Phone Protection", text: "Your phone store offers a deal: pay $15 now, and any time in the next 6 months you can trade in your phone for $300. Your phone is worth $320 today. Two months later, you drop it. Cracked screen. Now it's worth $80." },
    { t: "q", q: "What do you do?", a: ["Keep the cracked phone", "Sell it online for $80", "Use the deal: sell it to the store for $300", "Pay $15 more"], c: 2, why: "The deal guarantees $300 for a phone worth $80. You'd use it." },
    { t: "q", q: "That phone deal was a PUT OPTION. A put is the right to...", a: ["SELL at a set price", "BUY at a set price", "Get a free phone", "Borrow money"], c: 0, why: "A call is the right to buy. A put is the right to SELL. A put pays off when the value drops, like insurance." },
    { t: "q", q: "Your phone never breaks and is still worth $320 after 6 months. What happens to the deal?", a: ["The store pays you $300", "You must sell for $300", "You get the $15 back", "It expires unused. You're out the $15"], c: 3, why: "You'd never sell a $320 phone for $300. The put expires and the premium was the cost of being protected." },
    { t: "q", q: "When you BUY any option, what's the most you can lose?", a: ["The strike price", "Unlimited", "The premium you paid", "Nothing"], c: 2, why: "You can always let the option expire. Your loss stops at the premium." },
    { t: "q", q: "You pay $25 for the right to buy a concert ticket at face value next month. Call or put?", a: ["Put", "Futures contract", "Swap", "Call"], c: 3, why: "The right to BUY at a set price is a call option." }
  ] },
  swaps: { title: "The Tip Jar Trade", rounds: [
    { t: "card", title: "Maya", text: "Maya waits tables on weekends. Her pay is mostly tips: $40 on a slow night, $140 on a packed one. She just bought a used car with a $320 monthly payment, and the up-and-down tips are stressing her out." },
    { t: "q", q: "What's Maya's real problem?", a: ["She doesn't know how much she'll make each shift", "She doesn't earn anything", "Her car is too expensive", "She works too many shifts"], c: 0, why: "Her pay changes every shift. That makes it hard to plan for a payment that never changes." },
    { t: "card", title: "Jordan", text: "Jordan works the same shifts but earns a flat $80 a shift. Jordan likes taking chances and thinks the restaurant is about to get busier. They make a deal: every shift, Maya gives Jordan all her tips, and Jordan gives Maya $80." },
    { t: "q", q: "After the deal, how much does Maya take home each shift?", a: ["Whatever her tips are", "$80", "$160", "$40"], c: 1, why: "Maya traded her up-and-down tips for a steady $80." },
    { t: "q", q: "Who is taking the up-and-down risk now?", a: ["Maya", "The restaurant", "Jordan", "Nobody"], c: 2, why: "Jordan gets the tips now, good nights and bad nights." },
    { t: "card", title: "The Week", text: "Here's how their next five shifts go. Tips: Friday $140. Saturday $40. Sunday $90. Next Friday $120. Next Saturday $60." },
    { t: "q", q: "Friday: $140 in tips. Who wins that shift, and by how much?", a: ["Maya, by $60", "Jordan, by $60", "Jordan, by $140", "Nobody"], c: 1, why: "Jordan pays $80 and gets $140. Jordan comes out $60 ahead." },
    { t: "q", q: "Saturday: $40 in tips. Who wins?", a: ["Jordan, by $40", "Maya, by $80", "Nobody", "Maya, by $40"], c: 3, why: "Maya still gets $80 even though her tips were $40. She comes out $40 ahead." },
    { t: "board" },
    { t: "q", q: "All five shifts: tips total $450. Maya got 5 × $80 = $400. Who came out ahead, and by how much?", a: ["Maya, by $50", "They're even", "Jordan, by $450", "Jordan, by $50"], c: 3, why: "Jordan got $450 in tips and paid $400. Jordan is $50 ahead." },
    { t: "q", q: "So was the deal bad for Maya?", a: ["Yes. She lost $50", "No. She gave up $50 to know her pay ahead of time", "Yes. Jordan cheated", "No. She made more money"], c: 1, why: "Maya paid $50 for a week of zero surprises. That's what she wanted." },
    { t: "board" },
    { t: "card", title: "It Has a Name", text: "What they did is a SWAP: two sides trade payments. One payment changes (VARIABLE). The other stays the same (FIXED). Companies swap loan payments. A variable-rate loan's payment moves with the Federal Funds Rate. A fixed-rate loan's payment never changes." },
    { t: "q", q: "Bison Logistics has a variable-rate loan. Its CFO hates surprises, like Maya. What should Bison swap into?", a: ["A fixed payment", "A bigger variable payment", "A stock", "Nothing"], c: 0, why: "Like Maya, Bison trades its changing payment for one that stays the same." },
    { t: "q", q: "In a swap, which word describes Maya's pay AFTER the deal?", a: ["Variable", "Fixed", "Default", "Premium"], c: 1, why: "Maya now gets the same $80 every shift: fixed." },
    { t: "q", q: "The Fed raises interest rates a lot. In a fixed-for-variable swap, who wins?", a: ["The side paying variable", "Nobody", "The side paying fixed", "Both sides equally"], c: 2, why: "Variable payments climb. The side paying fixed keeps paying the same amount, so it wins." },
    { t: "q", q: "Interest rates fall a lot. Who wins?", a: ["The side paying fixed", "The side paying variable", "Both sides", "Nobody"], c: 1, why: "Variable payments shrink. The fixed side is stuck paying the old, higher amount." },
    { t: "q", q: "What's the main reason companies use interest rate swaps?", a: ["To make payments predictable", "To skip paying loans back", "To raise their stock price", "To print money"], c: 0, why: "Swaps turn uncertain payments into predictable ones. They don't remove the cost of borrowing." }
  ] },
  cds: { title: "The Cousin Loan", rounds: [
    { t: "card", title: "The Ask", text: "Your cousin Danny needs $500 to fix his car so he can get to work. He promises to pay you back in one year. You lend it to him." },
    { t: "q", q: "What's the biggest risk for you?", a: ["Danny doesn't pay you back", "Danny pays you back early", "The car gets fixed", "Gas prices rise"], c: 0, why: "You're the lender. The risk is that the borrower doesn't pay." },
    { t: "card", title: "The Offer", text: "Your friend Priya makes an offer: pay her $10 a month. If Danny doesn't pay you back, Priya pays you the full $500." },
    { t: "q", q: "Priya's deal is most like...", a: ["A savings account", "Insurance", "A loan", "A stock"], c: 1, why: "You pay a small amount regularly, and you get paid if something bad happens. That's insurance." },
    { t: "q", q: "In finance, when a borrower fails to pay back, it's called a...", a: ["Dividend", "Premium", "Default", "Swap"], c: 2, why: "Default means a borrower doesn't make the payments it promised." },
    { t: "card", title: "Ending 1: Danny Pays", text: "Danny gets a raise and pays you back in full after 12 months." },
    { t: "q", q: "How much did Priya's protection cost you in total?", a: ["$10", "$500", "$0", "$120"], c: 3, why: "$10 a month × 12 months = $120." },
    { t: "q", q: "Was paying Priya a waste?", a: ["Yes, totally", "No. Like car insurance, you paid to be protected", "Yes. Priya should give it back", "No. You made money"], c: 1, why: "You don't regret car insurance when you don't crash. You paid for peace of mind." },
    { t: "board" },
    { t: "card", title: "Ending 2: Danny Can't Pay", text: "Rewind. After 6 months, Danny loses his job and says he can't pay you back. Priya pays you the $500." },
    { t: "q", q: "What's your net result on the deal with Priya?", a: ["$440 ahead", "$500 ahead", "$60 ahead", "$560 ahead"], c: 0, why: "You got $500 and paid $10 × 6 = $60. $500 − $60 = $440." },
    { t: "card", title: "Cousin Ricky", text: "Your other cousin Ricky wants to borrow $500 too. He still owes two friends money from last year. Priya says protection on a loan to Ricky will cost $25 a month." },
    { t: "q", q: "Why does Priya charge more for Ricky?", a: ["She likes Danny more", "Ricky is more likely to default", "Ricky needs more money", "She made a mistake"], c: 1, why: "A riskier borrower is more likely to default, so protection costs more." },
    { t: "board" },
    { t: "card", title: "It Has a Name", text: "Priya sold you a CREDIT DEFAULT SWAP (CDS): insurance against a borrower not paying you back. You pay a PREMIUM on a schedule. If the borrower DEFAULTS, you get paid the full amount. Big investors buy CDS protection on the company bonds they own." },
    { t: "q", q: "Big investors buy CDS protection on what?", a: ["Company bonds they own", "Their cars", "Gold", "Sneakers"], c: 0, why: "A bond is a loan to a company. CDS protects the lender if the company defaults." },
    { t: "q", q: "A company's credit rating is cut from A to BB. What happens to the cost of CDS protection?", a: ["It goes down", "It stays the same", "It goes up", "It becomes free"], c: 2, why: "A lower rating means more risk of default, so protection costs more. Same as Ricky." },
    { t: "q", q: "You pay $50,000 a year to protect $5 million of bonds. The company defaults after 2 years. What's your net gain on the CDS?", a: ["$5,000,000", "$4,900,000", "$4,950,000", "$100,000"], c: 1, why: "Premiums: $50,000 × 2 = $100,000. Net: $5,000,000 − $100,000 = $4,900,000." },
    { t: "q", q: "No default over 4 years at $50,000 a year. What was the total cost of protection?", a: ["$50,000", "$5,000,000", "$0", "$200,000"], c: 3, why: "$50,000 × 4 years = $200,000." },
    { t: "q", q: "Which borrower would have the CHEAPEST CDS protection?", a: ["A company rated AAA", "A company rated CCC", "A company that just missed a payment", "Cousin Ricky"], c: 0, why: "AAA is the safest rating, so default protection costs the least." }
  ] }
};

/* =====================================================================
   TRADING DESKS (one per derivative; groups decide on iPads)
   ===================================================================== */

// ---------- 1. The Futures Pit ----------
const FUT_POINTS = (miss, budget) => Math.max(0, Math.round(1000 - 4000 * miss / budget));
const futures = {
  title: "The Futures Pit",
  pitch: "Six rounds. In five, your desk runs a real business with a price problem: hedge it with futures or ride the market. In the last round you're a speculator with no business at all.",
  rule: "Hedging rounds: your CFO set a budget at the futures price. Every dollar you miss it by, up OR down, costs points. Hit it exactly: 1,000 points. Speculator round: you score your profit, and a loss takes points away.",
  metric: { label: "Points", start: 0, higher: true, show: v => num(v) },
  benchLabel: "Never hedged",
  dflt: { side: "none", size: "all" },
  rounds: [
    { title: "Drought Watch", who: "Prairie Crunch Cereal", role: "buy", item: "wheat", unit: "bushel", q: 50000, F: 6.50, S: 8.00, now: 6.40,
      brief: "Prairie Crunch will BUY 50,000 bushels of wheat in three months to make cereal.",
      news: ["Kansas has had six weeks without rain.", "Weather forecasters see no relief in sight."],
      story: "The drought got worse. Wheat jumped to $8.00 a bushel. Desks that bought futures locked in $6.50 and hit their budget. Desks without a hedge paid $75,000 more than planned.",
      lesson: "A buyer fears rising prices, so a buyer goes LONG (buys futures)." },
    { title: "Record Harvest", who: "Alto Verde Coffee", role: "sell", item: "coffee", unit: "pound", q: 40000, F: 2.10, S: 1.70, now: 2.15,
      brief: "Alto Verde grows coffee and will SELL 40,000 pounds at harvest in three months.",
      news: ["Brazil, the world's biggest coffee grower, expects a record crop.", "Coffee shops say demand is flat this year."],
      story: "Brazil's record crop flooded the market and coffee fell to $1.70. Desks that sold futures still got $2.10 a pound. Unhedged desks got $16,000 less than budget.",
      lesson: "A seller fears falling prices, so a seller goes SHORT (sells futures)." },
    { title: "Fuel Fears", who: "Route 53 Freight", role: "buy", item: "diesel", unit: "gallon", q: 100000, F: 3.20, S: 2.80, now: 3.15,
      brief: "Route 53 runs 60 trucks and will BUY 100,000 gallons of diesel next quarter.",
      news: ["Oil-producing countries talk about cutting production.", "Some economists think a slowdown could cut fuel demand."],
      story: "Fuel demand dropped and diesel fell to $2.80. Hedged desks LOST $40,000 on their futures, but they paid less for diesel by the same amount. They hit their $320,000 budget right on the nose.",
      lesson: "A hedge can lose money and still do its job. The goal was a known cost, not a bet." },
    { title: "Trade Deal", who: "Lindqvist Family Farm", role: "sell", item: "soybeans", unit: "bushel", q: 20000, F: 11.00, S: 12.50, now: 10.90,
      brief: "The Lindqvists will SELL 20,000 bushels of soybeans at harvest.",
      news: ["Talks on a big soybean trade deal with China have stalled.", "Farmers planted more soybeans than last year."],
      story: "Surprise: the trade deal got signed and soybeans jumped to $12.50. Hedged desks gave up $30,000 of upside but hit their budget. Unhedged desks got lucky this time.",
      lesson: "Hedging gives up the lucky surprises along with the bad ones." },
    { title: "Peak Travel", who: "Skyline Airlines", role: "buy", item: "jet fuel", unit: "gallon", q: 200000, F: 2.50, S: 3.10, now: 2.45,
      brief: "Skyline will BUY 200,000 gallons of jet fuel for summer flights.",
      news: ["Summer bookings are the highest ever.", "A major refinery just shut down for repairs."],
      story: "Record travel plus a closed refinery sent jet fuel to $3.10. Fully hedged desks locked in $2.50. Unhedged desks blew the budget by $120,000.",
      lesson: "When two clues point the same way, the risk is real. That's when a hedge pays off." },
    { title: "Speculator Round", spec: true, who: "Hersey Trading Co.", item: "corn", unit: "bushel", per: 5000, F: 4.50, S: 4.00, now: 4.55,
      brief: "You have no farm and no business. You're a speculator: you trade corn futures only to make money. Each contract is 5,000 bushels.",
      news: ["Perfect growing weather across the Midwest.", "The government predicts a record corn crop."],
      story: "The record crop came in and corn fell to $4.00. Speculators who sold 2 contracts made $5,000. Those who bought 2 lost $5,000.",
      lesson: "Hedgers use futures to REMOVE risk. Speculators TAKE ON risk to try to profit." }
  ],
  fields(R) {
    if (R.spec) return [
      { k: "side", label: "Your trade", opts: [["buy", "Buy corn futures", "You win if corn rises"], ["sell", "Sell corn futures", "You win if corn falls"], ["none", "Stay out", "No risk, no reward"]] },
      { k: "size", label: "How many contracts?", skip: { side: "none" }, opts: [["1", "1 contract", "5,000 bushels"], ["2", "2 contracts", "10,000 bushels"]] }];
    return [
      { k: "side", label: "Your hedge", opts: [["buy", "Buy futures (long)", "Lock in what you pay"], ["sell", "Sell futures (short)", "Lock in what you get"], ["none", "No hedge", "Take the market price"]] },
      { k: "size", label: "How much?", skip: { side: "none" }, opts: [["half", "Hedge half", num(R.q / 2) + " " + R.unit + "s"], ["all", "Hedge all", num(R.q) + " " + R.unit + "s"]] }];
  },
  facts(R) {
    if (R.spec) return [["Corn today", usd(R.now, true)], ["Futures price", usd(R.F, true)], ["Contract size", num(R.per) + " bu"]];
    return [[R.item[0].toUpperCase() + R.item.slice(1) + " today", usd(R.now, true)], ["Futures price", usd(R.F, true) + " / " + R.unit], ["Quantity", num(R.q) + " " + R.unit + "s"], [R.role === "buy" ? "Cost budget" : "Sales budget", usd(R.F * R.q)]];
  },
  reveal(R) { return { label: (R.spec ? "Corn" : R.item[0].toUpperCase() + R.item.slice(1)) + " at delivery", big: usd(R.S, true), sub: (R.S > R.F ? "Up " : "Down ") + usd(Math.abs(R.S - R.F), true) + " from the futures price" }; },
  result(R, d) {
    const side = d.side || "none", sign = side === "buy" ? 1 : side === "sell" ? -1 : 0;
    if (R.spec) {
      const n = side === "none" ? 0 : (d.size === "2" ? 2 : 1), pnl = sign * (R.S - R.F) * R.per * n || 0, pts = Math.round(pnl / 5) || 0;
      return { delta: pts, pick: side === "none" ? "Stayed out" : (side === "buy" ? "Bought " : "Sold ") + n + " contract" + (n > 1 ? "s" : ""),
        rows: [["Futures profit or loss", n ? `${side === "buy" ? "(" + usd(R.S, true) + " − " + usd(R.F, true) + ")" : "(" + usd(R.F, true) + " − " + usd(R.S, true) + ")"} × ${num(R.per * n)}` : "No trade", sgn(pnl)]],
        head: n ? (pnl > 0 ? "Profit of " + usd(pnl) : "Loss of " + usd(-pnl)) : "Stayed out", good: pnl > 0, bad: pnl < 0 };
    }
    const cov = side === "none" ? 0 : (d.size === "half" ? 0.5 : 1), hq = R.q * cov, pnl = sign * (R.S - R.F) * hq || 0;
    const cash = R.S * R.q, budget = R.F * R.q, eff = R.role === "buy" ? cash - pnl : cash + pnl, miss = Math.abs(eff - budget), pts = FUT_POINTS(miss, budget);
    const wrong = (R.role === "buy" && side === "sell") || (R.role === "sell" && side === "buy");
    return { delta: pts, wrong, pick: side === "none" ? "No hedge" : (side === "buy" ? "Bought" : "Sold") + " futures · " + (cov === 1 ? "all" : "half"),
      rows: [["Futures gain or loss", side === "none" ? "No futures" : `${side === "buy" ? "(" + usd(R.S, true) + " − " + usd(R.F, true) + ")" : "(" + usd(R.F, true) + " − " + usd(R.S, true) + ")"} × ${num(hq)}`, sgn(pnl)],
        [R.role === "buy" ? "Cost in the cash market" : "Sales in the cash market", `${num(R.q)} × ${usd(R.S, true)}`, usd(cash)],
        [R.role === "buy" ? "Effective cost" : "Effective sales", R.role === "buy" ? "Cash cost − futures gain" : "Cash sales + futures gain", usd(eff)],
        ["Budget", `${num(R.q)} × ${usd(R.F, true)}`, usd(budget)],
        ["Missed the budget by", "", usd(miss)]],
      head: wrong ? "Wrong side: missed by " + usd(miss) : miss === 0 ? "Hit the budget exactly" : "Missed the budget by " + usd(miss), good: miss === 0, bad: wrong || pts < 300 };
  }
};

// ---------- 2. The Options Floor ----------
const OPT = (v, label, type, K, p, n = 1) => ({ v, label, type, K, p, n });
const options = {
  title: "The Options Floor",
  pitch: "Six rounds of HRSY (Hersey Holdings Inc.) news. Each round, your desk buys a call, buys a put, or sits out. In two rounds you own HRSY shares and decide whether to protect them.",
  rule: "Every desk starts with a $10,000 trading account. Each contract covers 100 shares. You only BUY options, so the most you can lose on one is its premium. Highest account wins.",
  metric: { label: "Account", start: 10000, higher: true, show: v => usd(v) },
  benchLabel: "Always sat out",
  dflt: { trade: "none" },
  rounds: [
    { title: "Big Contract Rumors", now: 48, S: 55,
      brief: "HRSY trades at $48. Your desk has no shares.",
      news: ["HRSY is one of two finalists for a huge contract with a national retailer.", "The winner will be announced Friday."],
      choices: [OPT("call", "Buy a $50 call", "call", 50, 2), OPT("put", "Buy a $46 put", "put", 46, 1.5), OPT("none", "Sit out", "none")],
      story: "HRSY won the contract and the stock jumped to $55. The $50 call paid $5 a share, $500, minus the $200 premium: +$300. The put expired worthless.",
      lesson: "Buy a call when you expect the price to RISE." },
    { title: "Recall Rumors", now: 55, S: 47,
      brief: "HRSY trades at $55. Your desk has no shares.",
      news: ["Reports say HRSY's best-selling product may be recalled.", "HRSY hasn't commented yet."],
      choices: [OPT("put", "Buy a $52 put", "put", 52, 2.5), OPT("call", "Buy a $58 call", "call", 58, 2), OPT("none", "Sit out", "none")],
      story: "The recall was real. HRSY fell to $47. The $52 put paid $5 a share, $500, minus the $250 premium: +$250. The call expired worthless: −$200.",
      lesson: "Buy a put when you expect the price to FALL." },
    { title: "Everybody Wants In", now: 50, S: 54,
      brief: "HRSY trades at $50. Your desk has no shares.",
      news: ["HRSY reports earnings tomorrow, and social media hype is through the roof.", "Because everyone wants options, premiums are very expensive today."],
      choices: [OPT("call", "Buy a $50 call", "call", 50, 6), OPT("put", "Buy a $50 put", "put", 50, 5), OPT("none", "Sit out", "none")],
      story: "Earnings were good and HRSY rose to $54. But the call cost $6 a share, so the breakeven was $56. The call paid $400 and cost $600: −$200, even though you were right about the direction.",
      lesson: "In the money is not the same as profitable. A call needs the price above strike + premium." },
    { title: "Protect the Shares", own: { shares: 100, cost: 60 }, now: 60, S: 45,
      brief: "Your desk bought 100 HRSY shares at $60. HRSY is still $60.",
      news: ["HRSY's biggest competitor just cut prices 30%.", "Analysts say HRSY may have to cut prices too."],
      choices: [OPT("p56", "Buy a $56 put (protective)", "put", 56, 2), OPT("p58", "Buy a $58 put (protective)", "put", 58, 3.5), OPT("none", "No protection", "none")],
      story: "The price war hit HRSY hard: the stock fell to $45, a $1,500 loss on your shares. A protective put limited the damage: the $56 put paid $1,100, so the loss was only $600 after the premium.",
      lesson: "A protective put is insurance on shares you own. It sets a floor on your loss." },
    { title: "Insurance or Not?", own: { shares: 100, cost: 50 }, now: 50, S: 58,
      brief: "Your desk bought 100 new HRSY shares at $50.",
      news: ["A quiet week for the market.", "HRSY launches a new product line that early reviewers love."],
      choices: [OPT("p47", "Buy a $47 put (protective)", "put", 47, 1.5), OPT("none", "No protection", "none")],
      story: "The new products were a hit and HRSY rose to $58: +$800 on your shares. The put expired unused, so protected desks made $650 instead of $800.",
      lesson: "Insurance costs money even when you don't need it. That's the premium." },
    { title: "Final Bell", now: 40, S: 47,
      brief: "HRSY slipped to $40 during a market selloff. Your desk has no shares. You can buy 1 or 2 contracts this time.",
      news: ["HRSY confirms the national retailer contract starts next month.", "The selloff was about other companies, not HRSY."],
      choices: [OPT("c1", "Buy 1 $42 call", "call", 42, 1.5, 1), OPT("c2", "Buy 2 $42 calls", "call", 42, 1.5, 2), OPT("p1", "Buy 1 $38 put", "put", 38, 1, 1), OPT("p2", "Buy 2 $38 puts", "put", 38, 1, 2), OPT("none", "Sit out", "none")],
      story: "With the selloff over and the contract starting, HRSY bounced to $47. Each $42 call paid $500 minus a $150 premium: +$350 per contract.",
      lesson: "More contracts means more reward AND more risk. Size your bets carefully." }
  ],
  fields(R) { return [{ k: "trade", label: "Your trade", opts: R.choices.map(c => [c.v, c.label, c.type === "none" ? (R.own ? "Keep the shares unprotected" : "No cost, no risk") : `Premium ${usd(c.p, true)}/share · ${usd(c.p * 100 * c.n)} total`]) }]; },
  facts(R) { return [["HRSY now", usd(R.now, true)], R.own ? ["Your shares", `${R.own.shares} at ${usd(R.own.cost, true)}`] : ["Your shares", "None"], ["Contract size", "100 shares"]]; },
  reveal(R) { return { label: "HRSY at expiration", big: usd(R.S, true), sub: (R.S > R.now ? "Up " : "Down ") + usd(Math.abs(R.S - R.now), true) + " from " + usd(R.now, true) }; },
  result(R, d) {
    const c = R.choices.find(x => x.v === d.trade) || R.choices.find(x => x.type === "none");
    const stock = R.own ? (R.S - R.own.cost) * R.own.shares : 0;
    const payoff = c.type === "call" ? Math.max(R.S - c.K, 0) : c.type === "put" ? Math.max(c.K - R.S, 0) : 0;
    const opt = c.type === "none" ? 0 : c.n * 100 * (payoff - c.p), total = stock + opt;
    const rows = [];
    if (R.own) rows.push(["Your shares", `(${usd(R.S, true)} − ${usd(R.own.cost, true)}) × ${R.own.shares}`, sgn(stock)]);
    if (c.type !== "none") { rows.push(["Option payoff", c.type === "call" ? `max(${usd(R.S, true)} − ${usd(c.K, true)}, 0) × ${c.n * 100}` : `max(${usd(c.K, true)} − ${usd(R.S, true)}, 0) × ${c.n * 100}`, usd(payoff * 100 * c.n)]); rows.push(["Premium paid", `${usd(c.p, true)} × ${c.n * 100}`, "−" + usd(c.p * 100 * c.n)]); }
    else rows.push(["Option", R.own ? "No protection" : "Sat out", usd(0)]);
    return { delta: total, pick: c.label, rows, head: (total > 0 ? "Made " : total < 0 ? "Lost " : "Broke even ") + (total ? usd(Math.abs(total)) : ""), good: total > 0, bad: total < 0 };
  }
};

// ---------- 3. The Swap Desk ----------
const LOAN = 10000000, SPREAD = 2.0, CAP = 825000, PENALTY = 100000;
const swaps = {
  title: "The Swap Desk",
  pitch: "Your desk is the CFO of Bison Logistics, with a $10 million loan at the Federal Funds Rate + 2%. Six years. Each year a bank offers to swap your variable payment for a fixed one.",
  rule: "Each year: stay variable, swap half to fixed, or swap all to fixed. The board's rule: interest above $825,000 in any year costs a $100,000 penalty. Lowest total cost after six years wins.",
  metric: { label: "Total cost", start: 0, higher: false, show: v => usd(-v) },
  benchLabel: "Stayed variable",
  dflt: { swap: "variable" },
  rounds: [
    { title: "Steady as She Goes", ff0: 4.00, ff1: 4.00, fixed: 6.25,
      news: ["Inflation is steady near 2%.", "The Fed says it's in no hurry to change rates."],
      story: "The Fed sat still all year. Variable cost 4.00% + 2% = 6.00%, or $600,000. Fixed at 6.25% cost $625,000. Staying variable saved $25,000.",
      lesson: "When rates don't move, the fixed rate costs a little extra. That's the price of certainty." },
    { title: "Inflation Wakes Up", ff0: 4.00, ff1: 5.50, fixed: 6.75,
      news: ["Inflation jumps to its highest level in years.", "The Fed says rate hikes are coming."],
      story: "The Fed raised rates to 5.50%. Variable cost 7.50%, or $750,000. Desks that swapped to fixed paid $675,000.",
      lesson: "Rates rise: the fixed-rate payer wins." },
    { title: "More Work to Do", ff0: 5.50, ff1: 6.50, fixed: 7.75,
      news: ["Inflation is still running hot.", "Fed officials say they have \"more work to do.\""],
      story: "Rates climbed to 6.50%. Variable cost 8.50%, or $850,000, over the board's $825,000 limit: a $100,000 penalty. Swapping half came in at $812,500, just under the limit.",
      lesson: "A swap protects you from the year that hurts the most. Even a half hedge can keep you under the limit." },
    { title: "Cooling Off", ff0: 6.50, ff1: 5.00, fixed: 7.50,
      news: ["Hiring is slowing and stores report weaker sales.", "The Fed hints that rate cuts could be coming."],
      story: "The Fed cut to 5.00%. Variable cost 7.00%, or $700,000. Fixed at 7.50% cost $750,000.",
      lesson: "Rates fall: the variable-rate payer wins." },
    { title: "Emergency Cut", ff0: 5.00, ff1: 2.50, fixed: 6.00,
      news: ["The economy shrinks two quarters in a row.", "The Fed makes an emergency rate cut and says more may follow."],
      story: "Rates crashed to 2.50%. Variable cost 4.50%, or $450,000. Desks that swapped to fixed were stuck paying $600,000.",
      lesson: "A fixed payment you locked in can sting when rates drop. You gave up the savings for certainty." },
    { title: "The Recovery", ff0: 2.50, ff1: 3.00, fixed: 5.25,
      news: ["The recovery is picking up speed.", "Some economists expect rates to climb next year. Others say not yet."],
      story: "Rates edged up to 3.00%. Variable cost 5.00%, or $500,000. Fixed cost $525,000.",
      lesson: "Swaps don't predict rates. They let a company choose how much rate risk it takes." }
  ],
  fields(R) { return [{ k: "swap", label: "This year's loan payment", opts: [["variable", "Stay variable", `Fed funds + 2% (now ${(R.ff0 + SPREAD).toFixed(2)}%)`], ["half", "Swap half to fixed", `$5M at ${R.fixed.toFixed(2)}%, $5M variable`], ["all", "Swap all to fixed", `${R.fixed.toFixed(2)}% on the full $10M`]] }]; },
  facts(R) { return [["Fed funds now", R.ff0.toFixed(2) + "%"], ["Variable rate now", (R.ff0 + SPREAD).toFixed(2) + "%"], ["Bank's fixed offer", R.fixed.toFixed(2) + "%"], ["Board's limit", usd(CAP)]]; },
  reveal(R) { const d = R.ff1 - R.ff0; return { label: "Fed funds rate for the year", big: R.ff1.toFixed(2) + "%", sub: d > 0 ? "Up " + d.toFixed(2) + "%: variable payments rise" : d < 0 ? "Down " + Math.abs(d).toFixed(2) + "%: variable payments fall" : "No change" }; },
  result(R, d) {
    const cov = d.swap === "all" ? 1 : d.swap === "half" ? 0.5 : 0, vr = R.ff1 + SPREAD;
    const varPart = LOAN * (1 - cov) * vr / 100, fixPart = LOAN * cov * R.fixed / 100, interest = varPart + fixPart, pen = interest > CAP ? PENALTY : 0;
    const rows = [];
    if (cov < 1) rows.push(["Variable payment", `${usd(LOAN * (1 - cov))} × (${R.ff1.toFixed(2)}% + 2%)`, usd(varPart)]);
    if (cov > 0) rows.push(["Fixed payment", `${usd(LOAN * cov)} × ${R.fixed.toFixed(2)}%`, usd(fixPart)]);
    rows.push(["Board penalty", interest > CAP ? `Interest over ${usd(CAP)}` : "Under the limit", pen ? "−" + usd(pen) : usd(0)]);
    return { delta: -(interest + pen), pick: cov === 0 ? "Stayed variable" : cov === 1 ? "Swapped all" : "Swapped half", rows,
      head: `Paid ${usd(interest + pen)}${pen ? " (penalty!)" : ""}`, good: false, bad: !!pen };
  }
};

// ---------- 4. The Default Desk ----------
const FACE = 10000000, RECOVER = 0.4;
const cds = {
  title: "The Default Desk",
  pitch: "Your desk runs a bond fund. Each round, the fund holds $10 million of bonds from a different company. Read the clues and decide whether to buy credit default swap protection.",
  rule: "Protection costs a yearly premium based on the company's rating. If the company defaults, unprotected bonds are worth only 40 cents on the dollar. Protected bonds get paid the full face value. Lowest total losses wins.",
  metric: { label: "Total losses", start: 0, higher: false, show: v => usd(-v) },
  benchLabel: "Never protected",
  dflt: { cover: "none" },
  rounds: [
    { title: "The Utility", who: "Maple Grove Utilities", rating: "AAA", rate: 0.5, def: false,
      news: ["Sells water and electricity to 2 million homes.", "Profits every year for 30 years."],
      story: "Maple Grove paid every bond payment, like always. Protection cost $50,000 and wasn't needed.",
      lesson: "For the safest borrowers, protection is cheap, and usually unused." },
    { title: "The Mall Chain", who: "Northside Retail", rating: "BB", rate: 3.0, def: true,
      news: ["Closing 40 stores after three straight years of falling sales.", "Has $2 billion of debt due next year and only $200 million in cash."],
      story: "Northside couldn't pay its debt and defaulted. Unprotected bonds fell to $4 million: a $6 million loss. Fully protected desks handed over their bonds and got the full $10 million back.",
      lesson: "When the clues scream default, protection is worth the premium." },
    { title: "The Software Company", who: "Apex Software", rating: "A", rate: 1.0, def: false,
      news: ["Subscriptions are up 20% this year.", "Has more cash than debt."],
      story: "Apex had a great year and paid every bond payment. Protection cost $100,000 and wasn't needed.",
      lesson: "Strong cash and growing sales: a default is very unlikely." },
    { title: "The Cruise Line", who: "Coastal Cruise Lines", rating: "B", rate: 5.0, def: false,
      news: ["Still carries lots of debt from a rough few years.", "Bookings hit a record, and it just paid off a big loan early."],
      story: "Coastal kept paying and its rating is on the way up. Protection cost $500,000, the most expensive premium so far, and wasn't needed.",
      lesson: "A low rating makes protection expensive. Look at the newest clues, not just the rating." },
    { title: "The Media Company", who: "Lakeview Media", rating: "CCC", rate: 8.0, def: true,
      news: ["Missed an interest payment last month.", "Its biggest lender says it won't lend any more money."],
      story: "Lakeview defaulted. Protection cost $800,000, but it saved protected desks from a $6 million loss.",
      lesson: "A missed payment is the loudest default clue there is." },
    { title: "The Hometown Pick", who: "Hersey Holdings (HRSY)", rating: "A", rate: 1.0, def: false,
      news: ["Just won a contract with a national retailer.", "Rating agencies say HRSY's outlook is positive."],
      story: "HRSY paid every bond payment. Protection cost $100,000 and wasn't needed.",
      lesson: "Over six rounds, the best desks paid for protection only when the risk was real." }
  ],
  fields(R) { const p = FACE * R.rate / 100; return [{ k: "cover", label: "CDS protection", opts: [["none", "No protection", "Pay nothing, keep all the risk"], ["half", "Protect half ($5M)", `Premium ${usd(p / 2)}`], ["all", "Protect all ($10M)", `Premium ${usd(p)}`]] }]; },
  facts(R) { return [["Bonds you hold", usd(FACE)], ["Credit rating", R.rating], ["CDS premium", R.rate.toFixed(1) + "% a year"], ["Full protection costs", usd(FACE * R.rate / 100)]]; },
  reveal(R) { return { label: R.who, big: R.def ? "DEFAULT" : "PAID", sub: R.def ? "Unprotected bonds now worth 40 cents on the dollar" : "Every bond payment made on time" }; },
  result(R, d) {
    const cov = d.cover === "all" ? 1 : d.cover === "half" ? 0.5 : 0, prem = FACE * cov * R.rate / 100, loss = R.def ? FACE * (1 - cov) * (1 - RECOVER) : 0;
    return { delta: -(prem + loss), pick: cov === 0 ? "No protection" : cov === 1 ? "Protected all" : "Protected half",
      rows: [["Premium paid", cov ? `${usd(FACE * cov)} × ${R.rate.toFixed(1)}%` : "No protection", prem ? "−" + usd(prem) : usd(0)],
        ["Default loss", R.def ? (cov === 1 ? "All bonds protected" : `${usd(FACE * (1 - cov))} unprotected × 60% lost`) : "No default", loss ? "−" + usd(loss) : usd(0)]],
      head: prem + loss ? "Lost " + usd(prem + loss) : "No losses", good: prem + loss === 0, bad: loss > 0 };
  }
};

const DESK = { futures, options, swaps, cds };

/* =====================================================================
   The eight games
   ===================================================================== */
const TOPIC = { futures: "Futures", options: "Options", swaps: "Swaps", cds: "Credit Default Swaps" };
export const GAMES = {};
for (const t of Object.keys(TOPIC)) {
  GAMES[t + "-story"] = { id: t + "-story", kind: "story", topic: t, topicName: TOPIC[t], title: STORY[t].title, rounds: STORY[t].rounds };
  GAMES[t + "-desk"] = { id: t + "-desk", kind: "desk", topic: t, topicName: TOPIC[t], ...DESK[t] };
}
export const ORDER = ["futures-story", "futures-desk", "options-story", "options-desk", "swaps-story", "swaps-desk", "cds-story", "cds-desk"];
export const nRounds = id => GAMES[id].rounds.length;
export const nQuestions = id => GAMES[id].kind === "story" ? GAMES[id].rounds.filter(r => r.t === "q").length : GAMES[id].rounds.length;

// Points for a story answer: 500 to 1,000 if right (faster = more), 0 if wrong.
export function storyPoints(R, a, ms) {
  if (+a !== R.c) return 0;
  const lim = Q_SECS * 1000, f = Math.max(0, Math.min(1, 1 - (ms || 0) / lim));
  return Math.round(PTS_MIN + (PTS_MAX - PTS_MIN) * f);
}
// The choices a desk round needs, given what's been picked so far
export function needed(G, R, d) { return G.fields(R).filter(f => !(f.skip && Object.entries(f.skip).every(([k, v]) => d[k] === v))); }
export function validPick(G, R, d) {
  const out = {};
  for (const f of needed(G, R, d || {})) { const v = String((d || {})[f.k] ?? ""); if (!f.opts.some(o => o[0] === v)) return null; out[f.k] = v; }
  return out;
}
