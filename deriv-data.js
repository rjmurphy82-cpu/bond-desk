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
    { t: "q", q: "A bakery locks in flour at $20 a bag for 100 bags. When it buys, flour costs $25 a bag. How much did the bakery save IN TOTAL by locking in?", a: ["$25", "$5", "$2,500", "$500"], c: 3, why: "It saved $5 on every bag. $5 × 100 bags = $500 saved in total." },
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

// ---------- 1. The Futures Exchange ----------
// Half the desks are food makers (BUYERS of five commodities), half are producers (SELLERS of the same five).
// Each quarter, desks send anonymous orders (buy or sell, how many contracts, their price limit).
// A call auction matches desks against each other at one price per commodity; the market maker
// fills what's left at the posted price ± 4%. At delivery, desks settle with whoever was on the other side.
// Score: 1,000 points minus a penalty for every surprise left unhedged, plus or minus how well you traded
// versus the posted price. Everything is measured against the quarter's budget.
const COMMS = [
  { k: "wheat", name: "Wheat", unit: "bushel", size: 5000, tick: 0.05 },
  { k: "corn", name: "Corn", unit: "bushel", size: 5000, tick: 0.05 },
  { k: "sugar", name: "Sugar", unit: "pound", size: 100000, tick: 0.01 },
  { k: "soyoil", name: "Soybean oil", unit: "pound", size: 60000, tick: 0.01 },
  { k: "diesel", name: "Diesel", unit: "gallon", size: 42000, tick: 0.02 }
];
const EX_SPREAD = 0.04, EX_K = 4000;
// One quarter: posted futures price (r), delivery price (S), contracts each desk needs (N), margin limit,
// the market report, and what happened to each commodity.
const Q = (title, season, margin, r, S, N, report, story, lesson) => ({ title, season, margin, r, S, N, report, story, lesson });
const QUARTERS = [
  Q("Spring Planting", "January to March", 7,
    { wheat: 6.50, corn: 4.50, sugar: 0.24, soyoil: 0.48, diesel: 2.60 }, { wheat: 7.60, corn: 4.55, sugar: 0.24, soyoil: 0.50, diesel: 2.56 },
    { wheat: 4, corn: 3, sugar: 2, soyoil: 2, diesel: 1 },
    ["Crop Progress report: Kansas winter wheat is rated 41% \"good to excellent,\" down from 63% at this time last year. Kansas grows more wheat than any other state.",
     "Golden Prairie's marketing team launches a cereal ad campaign with a famous NBA player. Early social media buzz is huge.",
     "Corn planting is on schedule across Iowa and Illinois, and soil moisture is close to normal.",
     "Florida's sugar cane harvest wrapped up at about the same size as last year.",
     "Refineries finished their spring maintenance on time and are running near full speed.",
     "Restaurant chains say cooking oil orders are steady."],
    { wheat: "The weak crop ratings were the clue: Kansas yields came in low and wheat jumped 17%.", corn: "Normal planting, normal price.", sugar: "A normal harvest kept sugar flat.", soyoil: "Steady demand, small move.", diesel: "Refineries running full kept diesel steady." },
    "Crop condition ratings are an early warning. A falling rating means less supply later, and that pushes prices up."),
  Q("Summer Heat", "April to June", 7,
    { wheat: 7.40, corn: 4.60, sugar: 0.24, soyoil: 0.50, diesel: 2.55 }, { wheat: 6.80, corn: 5.30, sugar: 0.25, soyoil: 0.58, diesel: 2.60 },
    { wheat: 3, corn: 4, sugar: 2, soyoil: 2, diesel: 1 },
    ["The National Weather Service forecasts a \"heat dome\" over the Corn Belt for the second half of July, the weeks when corn plants pollinate.",
     "Russia's agriculture ministry raises its wheat harvest estimate to a record. Russia is the world's largest wheat exporter.",
     "The EPA raises how much renewable diesel refiners must blend into fuel next year. Most U.S. renewable diesel is made from soybean oil.",
     "Gas station prices tick up as the summer driving season starts.",
     "Sugar beet fields in Minnesota and North Dakota look healthy.",
     "Golden Prairie's new granola bar hits shelves in 2,000 stores."],
    { wheat: "A record Russian crop flooded the world market and wheat fell 8%.", corn: "Heat during pollination cut yields and corn rose 15%.", sugar: "Healthy beets, small move.", soyoil: "The renewable diesel rule raised demand for soybean oil: up 16%.", diesel: "The gas-station story was about gasoline, not diesel. Diesel barely moved." },
    "Ask who uses a commodity. A new rule for fuel made a FOOD ingredient more expensive."),
  Q("Harvest", "July to September", 6,
    { wheat: 6.80, corn: 5.20, sugar: 0.25, soyoil: 0.57, diesel: 2.60 }, { wheat: 6.85, corn: 4.40, sugar: 0.29, soyoil: 0.56, diesel: 3.04 },
    { wheat: 3, corn: 4, sugar: 2, soyoil: 2, diesel: 1 },
    ["USDA: farmers planted the most corn acres since the 1930s, and yields per acre are near a record.",
     "A Category 3 hurricane is tracking toward the Texas and Louisiana coast, home to about half of U.S. refining capacity.",
     "India, the world's second-largest sugar producer, says it will \"review\" sugar exports after a weak monsoon season.",
     "A food blogger claims cereal sales are falling as people switch to eggs for breakfast.",
     "Wheat exports are right in line with expectations.",
     "Soybean crushing plants report steady oil output."],
    { wheat: "No real news, no real move.", corn: "After last quarter's spike, a huge harvest sent corn down 15%. Last quarter's winner was this quarter's loser.", sugar: "India cut exports and sugar jumped 16%. \"Review\" was the quiet word that mattered.", soyoil: "Steady output, steady price.", diesel: "The hurricane shut Gulf refineries and diesel rose 17%." },
    "Prices that spiked can crash when supply catches up. Don't trade last quarter's news."),
  Q("Winter", "October to December", 7,
    { wheat: 6.85, corn: 4.45, sugar: 0.29, soyoil: 0.56, diesel: 3.00 }, { wheat: 7.70, corn: 4.40, sugar: 0.28, soyoil: 0.49, diesel: 2.56 },
    { wheat: 4, corn: 2, sugar: 2, soyoil: 2, diesel: 2 },
    ["Forecasters predict one of the mildest winters in 20 years for the Northeast, where many homes burn heating oil, a close cousin of diesel.",
     "OPEC agrees to pump more oil starting next month.",
     "Shipping insurers raise rates sharply for cargo ships leaving Black Sea ports. Those ports carry about a quarter of the world's wheat exports.",
     "The EPA says it will delay its renewable diesel rule by a year.",
     "Ethanol plants are running at normal rates.",
     "Golden Prairie's CEO tells a TV host to expect \"record holiday sales.\""],
    { wheat: "Higher shipping risk on the Black Sea squeezed world supply: wheat up 12%.", corn: "Normal ethanol demand kept corn flat.", sugar: "A small slip after last quarter's jump.", soyoil: "The delayed EPA rule erased last summer's demand story: down 12.5%.", diesel: "A mild winter plus more OPEC oil, two clues pointing the same way: diesel down 15%." },
    "Remember earlier quarters. The EPA rule that pushed soybean oil up in the summer pulled it back down when it was delayed."),
  Q("Strong Dollar", "January to March, Year 2", 6,
    { wheat: 7.60, corn: 4.40, sugar: 0.28, soyoil: 0.50, diesel: 2.60 }, { wheat: 7.55, corn: 3.90, sugar: 0.24, soyoil: 0.51, diesel: 2.64 },
    { wheat: 3, corn: 4, sugar: 3, soyoil: 1, diesel: 1 },
    ["The U.S. dollar hits a 10-year high. U.S. crops now cost more for buyers in other countries.",
     "Brazil's second corn crop is coming in early and large. Brazil is the world's biggest corn exporter.",
     "Brazil's sugar cane mills report their best crushing season in a decade.",
     "U.S. wheat stocks are tight, but Australia's wheat harvest is huge.",
     "Trucking companies report normal freight demand.",
     "A viral video of a cereal-packing robot sends Golden Prairie's stock up 6%."],
    { wheat: "Tight U.S. stocks and a huge Australian crop cancelled out. Wheat was flat.", corn: "A strong dollar plus a big Brazilian crop: corn down 11%.", sugar: "Brazil's best season in a decade: sugar down 14%.", soyoil: "Quiet.", diesel: "Normal freight, normal price." },
    "When two clues point opposite ways (tight U.S. wheat vs. huge Australian wheat), the price may not move at all."),
  Q("Disruption", "April to June, Year 2", 7,
    { wheat: 7.50, corn: 3.95, sugar: 0.24, soyoil: 0.51, diesel: 2.66 }, { wheat: 6.95, corn: 4.00, sugar: 0.25, soyoil: 0.60, diesel: 3.16 },
    { wheat: 3, corn: 3, sugar: 2, soyoil: 2, diesel: 2 },
    ["Hackers shut down a major pipeline that carries diesel and gasoline to the East Coast. The company says repairs could take \"weeks.\"",
     "Port workers in Argentina, the world's biggest exporter of soybean oil, go on strike with no end date.",
     "Rain arrived just in time across the Great Plains, and wheat crop ratings jump.",
     "A new study says Americans eat too much added sugar.",
     "Corn markets are quiet and ethanol demand is steady.",
     "Golden Prairie wins a \"Best Places to Work\" award."],
    { wheat: "Good rain meant a good crop: wheat down 7%.", corn: "Quiet.", sugar: "A health study doesn't change supply or demand this quarter.", soyoil: "With Argentina's ports shut, buyers scrambled: soybean oil up 18%.", diesel: "The pipeline outage sent diesel up 19%." },
    "Supply shocks move fast. A shutdown at the world's biggest exporter matters more than any headline about demand."),
  Q("Mixed Signals", "July to September, Year 2", 7,
    { wheat: 6.95, corn: 4.00, sugar: 0.25, soyoil: 0.59, diesel: 3.10 }, { wheat: 7.80, corn: 4.30, sugar: 0.25, soyoil: 0.58, diesel: 2.70 },
    { wheat: 4, corn: 3, sugar: 2, soyoil: 2, diesel: 2 },
    ["Argentina, a major wheat exporter, has had its driest winter in 40 years.",
     "India, which normally grows all the wheat it needs, quietly cuts its import tax on wheat to zero.",
     "Weekly government data: U.S. diesel inventories reach a five-year high.",
     "An oil analyst on TV warns prices \"could soar.\" He has made the same call every month this year.",
     "Cattle ranchers are rebuilding their herds and buying more corn for feed.",
     "Soybean oil markets are steady."],
    { wheat: "Two quiet clues: Argentina's drought cut supply, and India cutting its import tax meant India needed to BUY. Wheat up 12%.", corn: "More feed demand pushed corn up 7.5%.", sugar: "Quiet.", soyoil: "Steady.", diesel: "Full storage tanks beat a TV prediction: diesel down 13%." },
    "Data beats opinions. Inventory numbers told the diesel story; the TV analyst didn't."),
  Q("Year-End", "October to December, Year 2", 6,
    { wheat: 7.75, corn: 4.30, sugar: 0.25, soyoil: 0.58, diesel: 2.70 }, { wheat: 7.70, corn: 4.30, sugar: 0.30, soyoil: 0.52, diesel: 2.74 },
    { wheat: 3, corn: 3, sugar: 3, soyoil: 2, diesel: 1 },
    ["A rare frost hits São Paulo state in Brazil, where most of the country's sugar cane grows.",
     "Malaysia and Indonesia report record palm oil output. Palm oil competes directly with soybean oil in cooking and packaged food.",
     "Wheat and corn markets have a quiet end to the year.",
     "OPEC's meeting ends with no change in output.",
     "Golden Prairie names a new CEO.",
     "A food magazine names granola the \"snack of the year.\""],
    { wheat: "Quiet.", corn: "Quiet.", sugar: "Frost damaged Brazil's cane: sugar up 20%.", soyoil: "Cheap palm oil pulled buyers away from soybean oil: down 10%.", diesel: "No OPEC change, no big move." },
    "Watch the substitutes. A record crop of palm oil made soybean oil cheaper, even with no soybean news at all.")
];
const exchange = {
  title: "The Futures Exchange", kind: "exchange",
  pitch: "Half the desks are food makers that BUY wheat, corn, sugar, soybean oil and diesel. Half are producers that SELL them. Each quarter, read the market report, decide what to hedge, and trade futures with the other desks. You never know who's on the other side.",
  rule: "Score 1,000 points a quarter by landing on budget. Every dollar of price surprise you leave unhedged costs points, up OR down. Trading better than the posted price earns points; trading worse costs points. Your bank limits how many contracts you can trade each quarter.",
  metric: { label: "Points", start: 0, higher: true, show: v => num(v) },
  benchLabel: "Never hedged",
  roles: {
    buy: { name: "Golden Prairie Foods", short: "Buyer", what: "You make cereal, granola bars and crackers. Every quarter you BUY wheat, corn, sugar and soybean oil, and diesel for your delivery trucks. Rising prices hurt you." },
    sell: { name: "Heartland Supply Co.", short: "Seller", what: "You run farms, a sugar mill, a soybean crushing plant and a small refinery. Every quarter you SELL wheat, corn, sugar, soybean oil and diesel. Falling prices hurt you." }
  },
  comms: COMMS, spread: EX_SPREAD, maxRounds: QUARTERS.length, defaultRounds: 4,
  dflt: { orders: {} },
  rounds: QUARTERS
};
const snap = (v, t) => Math.round(Math.round(v / t) * t * 100) / 100;
export const exAsk = (c, r) => snap(Math.ceil(r * (1 + EX_SPREAD) / c.tick - 1e-9) * c.tick, c.tick);
export const exBid = (c, r) => snap(Math.floor(r * (1 - EX_SPREAD) / c.tick + 1e-9) * c.tick, c.tick);
export const exBudget = R => COMMS.reduce((a, c) => a + R.r[c.k] * c.size * R.N[c.k], 0);
// Clean up an order ticket, or null if it breaks a rule
export function exValidate(R, pick) {
  const out = {}; let used = 0;
  for (const c of COMMS) {
    const o = ((pick || {}).orders || {})[c.k]; if (!o || !o.side || o.side === "none") continue;
    if (o.side !== "buy" && o.side !== "sell") return null;
    const qty = +o.qty, lim = +o.lim, r = R.r[c.k];
    if (!(Number.isInteger(qty) && qty >= 1 && qty <= R.margin)) return null;
    if (!(lim >= r * 0.7 - 1e-9 && lim <= r * 1.3 + 1e-9)) return null;
    out[c.k] = { side: o.side, qty, lim: snap(lim, c.tick) }; used += qty;
  }
  if (used > R.margin) return null;
  return { orders: out };
}
// Match one commodity: a call auction among desks, then the market maker.
function matchOne(c, R, list) {
  const r = R.r[c.k], buys = list.filter(o => o.side === "buy"), sells = list.filter(o => o.side === "sell");
  const cands = [...new Set([r, ...list.map(o => o.lim)])].sort((a, b) => a - b);
  let best = { vol: 0, p: null, imb: Infinity, dist: Infinity };
  for (const p of cands) {
    const D = buys.filter(o => o.lim >= p - 1e-9).reduce((a, o) => a + o.qty, 0), Sp = sells.filter(o => o.lim <= p + 1e-9).reduce((a, o) => a + o.qty, 0);
    const vol = Math.min(D, Sp), imb = Math.abs(D - Sp), dist = Math.abs(p - r);
    if (vol > best.vol || (vol === best.vol && vol > 0 && (imb < best.imb || (imb === best.imb && dist < best.dist)))) best = { vol, p, imb, dist };
  }
  const fills = {}, pairs = [], add = (gid, side, qty, price, w) => { (fills[gid] = fills[gid] || []).push({ side, qty, price, w }); };
  const left = new Map(list.map(o => [o, o.qty]));
  if (best.vol > 0) {
    const bq = buys.filter(o => o.lim >= best.p - 1e-9).sort((a, b) => b.lim - a.lim || a.t - b.t);
    const sq = sells.filter(o => o.lim <= best.p + 1e-9).sort((a, b) => a.lim - b.lim || a.t - b.t);
    let need = best.vol, i = 0, j = 0;
    while (need > 0 && i < bq.length && j < sq.length) {
      const q = Math.min(left.get(bq[i]), left.get(sq[j]), need);
      add(bq[i].gid, "buy", q, best.p, sq[j].gid); add(sq[j].gid, "sell", q, best.p, bq[i].gid); pairs.push({ b: bq[i].gid, s: sq[j].gid, q });
      left.set(bq[i], left.get(bq[i]) - q); left.set(sq[j], left.get(sq[j]) - q); need -= q;
      if (!left.get(bq[i])) i++; if (!left.get(sq[j])) j++;
    }
  }
  const ask = exAsk(c, r), bid = exBid(c, r); let mmBuy = 0, mmSell = 0, unfilled = 0;
  for (const o of list) {
    const q = left.get(o); if (!q) continue;
    if (o.side === "buy" && o.lim >= ask - 1e-9) { add(o.gid, "buy", q, ask, "mm"); mmSell += q; }
    else if (o.side === "sell" && o.lim <= bid + 1e-9) { add(o.gid, "sell", q, bid, "mm"); mmBuy += q; }
    else unfilled += q;
  }
  return { p: best.vol ? best.p : null, vol: best.vol, ask, bid, mmBuy, mmSell, unfilled, fills, pairs };
}
// Score every desk from its fills (shared by sealed bids and the live pit)
function scoreDesks(R, market, groups, decs, byGid) {
  const B = exBudget(R);
  for (const g of groups) {
    const nat = g.role === "sell" ? 1 : -1; let risk = 0, fill = 0, fut = 0; const lines = [];
    for (const c of COMMS) {
      const r = R.r[c.k], S = R.S[c.k], fl = market[c.k].fills[g.gid] || [], N = R.N[c.k];
      const x = fl.reduce((a, f) => a + (f.side === "buy" ? f.qty : -f.qty), 0);
      const rk = (S - r) * c.size * (nat * N + x), fg = fl.reduce((a, f) => a + (r - f.price) * c.size * (f.side === "buy" ? f.qty : -f.qty), 0);
      const fp = fl.reduce((a, f) => a + (S - f.price) * c.size * (f.side === "buy" ? f.qty : -f.qty), 0);
      const ord = (((decs || {})[g.gid] || {}).orders || {})[c.k] || null, filled = fl.reduce((a, f) => a + f.qty, 0);
      risk += Math.abs(rk); fill += fg; fut += fp;
      const wrong = ord ? ((nat < 0 && ord.side === "sell") || (nat > 0 && ord.side === "buy")) : ((nat < 0 && x < 0) || (nat > 0 && x > 0));
      lines.push({ c, N, ord, fills: fl, filled, x, net: nat * N + x, risk: rk || 0, fillGain: fg || 0, fut: fp || 0, wrong });
    }
    const points = Math.max(0, Math.round(1000 - EX_K * risk / B + EX_K * fill / B));
    byGid[g.gid] = { points, risk, fill, fut, lines, budget: B };
  }
}
// Settle a whole quarter. decs = {gid: {orders}}, groups = [{gid, role}]
export function exSettle(R, decs, groups) {
  const market = {}, byGid = {}, B = exBudget(R); let mmPnl = 0;
  for (const c of COMMS) {
    const list = [];
    for (const g of groups) { const o = ((decs[g.gid] || {}).orders || {})[c.k]; if (o) list.push({ ...o, gid: g.gid, t: (decs[g.gid] || {}).t || 0 }); }
    market[c.k] = matchOne(c, R, list);
    const S = R.S[c.k]; for (const f of Object.values(market[c.k].fills).flat()) if (f.w === "mm") mmPnl -= (f.side === "buy" ? 1 : -1) * (S - f.price) * c.size * f.qty;
  }
  scoreDesks(R, market, groups, decs, byGid);
  return { market, byGid, mmPnl, budget: B };
}

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

const DESK = { futures: exchange, options, swaps, cds };

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

/* ---------- The Futures Exchange: live trading pit ----------
   During a timed window, desks post bids and offers that everyone sees (under codenames), take each
   other's orders, or trade with the market maker, whose spread widens from 3% to 9% as the clock runs out.
   book = {orders:[{id,gid,code,k,side,qty,price,t}], trades:[{id,k,b,s,bc,sc,qty,price,t,mm}], seq} */
export const CODENAMES = ["Falcon", "Otter", "Bison", "Cobra", "Raven", "Lynx", "Mako", "Viper", "Heron", "Puma", "Wolf", "Orca", "Hawk", "Fox", "Badger", "Moose", "Gecko", "Panther", "Condor", "Jaguar", "Marlin", "Coyote", "Stallion", "Mustang", "Osprey", "Grizzly", "Pelican", "Kestrel", "Rhino", "Tiger"];
export const PIT_MM = { start: 0.03, end: 0.09 };
export const pitFrac = (s, now) => !s.tradeAt ? 0 : Math.max(0, Math.min(1, (now - s.tradeAt) / (s.win * 1000)));
export const pitOpen = (s, now) => s.phase === "open" && !!s.tradeAt && now < s.tradeAt + s.win * 1000;
export function mmQuote(c, r, frac) { const sp = PIT_MM.start + (PIT_MM.end - PIT_MM.start) * frac; return { bid: snap(Math.floor(r * (1 - sp) / c.tick + 1e-9) * c.tick, c.tick), ask: snap(Math.ceil(r * (1 + sp) / c.tick - 1e-9) * c.tick, c.tick), spread: sp }; }
export const pitUsed = (book, gid) => book.trades.reduce((a, t) => a + (t.b === gid || t.s === gid ? t.qty : 0), 0) + book.orders.reduce((a, o) => a + (o.gid === gid ? o.qty : 0), 0);
export const emptyBook = () => ({ orders: [], trades: [], seq: 0 });
// Apply one pit action. Returns {book} or {error}. me = {gid, code}
export function pitApply(R, book, me, a, now, frac) {
  const b = JSON.parse(JSON.stringify(book || emptyBook())), c = COMMS.find(x => x.k === a.k);
  const err = m => ({ error: m }), left = () => R.margin - pitUsed(b, me.gid), id = () => "x" + (++b.seq);
  const trade = (k, side, qty, price, other) => { const t = { id: id(), k, qty, price, t: now }; if (other === "mm") { t.mm = true; if (side === "buy") { t.b = me.gid; t.bc = me.code; t.s = "mm"; t.sc = "Market maker"; } else { t.s = me.gid; t.sc = me.code; t.b = "mm"; t.bc = "Market maker"; } } else if (side === "buy") { t.b = me.gid; t.bc = me.code; t.s = other.gid; t.sc = other.code; } else { t.s = me.gid; t.sc = me.code; t.b = other.gid; t.bc = other.code; } b.trades.push(t); };
  if (a.op === "cancel") { const i = b.orders.findIndex(o => o.id === a.id && o.gid === me.gid); if (i < 0) return err("That order is already gone."); b.orders.splice(i, 1); return { book: b }; }
  const qty = +a.qty;
  if (!(Number.isInteger(qty) && qty >= 1)) return err("Pick how many contracts.");
  if (a.op === "take") {
    const o = b.orders.find(x => x.id === a.id);
    if (!o) return err("Too slow! Someone else took that order.");
    if (o.gid === me.gid) return err("That's your own order.");
    const q = Math.min(qty, o.qty); if (q > left()) return err(`Your bank limit only lets you trade ${left()} more contract${left() === 1 ? "" : "s"} this quarter.`);
    trade(o.k, o.side === "sell" ? "buy" : "sell", q, o.price, o); o.qty -= q; if (!o.qty) b.orders = b.orders.filter(x => x !== o);
    return { book: b, filled: q, price: o.price };
  }
  if (!c) return err("Pick a commodity.");
  const r = R.r[c.k];
  if (a.op === "mm") {
    if (a.side !== "buy" && a.side !== "sell") return err("Pick buy or sell.");
    if (qty > left()) return err(`Your bank limit only lets you trade ${left()} more contract${left() === 1 ? "" : "s"} this quarter.`);
    const q = mmQuote(c, r, frac), price = a.side === "buy" ? q.ask : q.bid;
    trade(c.k, a.side, qty, price, "mm"); return { book: b, filled: qty, price };
  }
  if (a.op === "post") {
    if (a.side !== "buy" && a.side !== "sell") return err("Pick buy or sell.");
    const price = snap(+a.price, c.tick);
    if (!(price >= r * 0.7 - 1e-9 && price <= r * 1.3 + 1e-9)) return err("That price is too far from the posted price.");
    if (qty > left()) return err(`Your bank limit only lets you trade ${left()} more contract${left() === 1 ? "" : "s"} this quarter.`);
    let rem = qty; const opp = b.orders.filter(o => o.k === c.k && o.gid !== me.gid && (a.side === "buy" ? o.side === "sell" && o.price <= price + 1e-9 : o.side === "buy" && o.price >= price - 1e-9))
      .sort((x, y) => (a.side === "buy" ? x.price - y.price : y.price - x.price) || x.t - y.t);
    let got = 0;
    for (const o of opp) { if (!rem) break; const q = Math.min(rem, o.qty); trade(c.k, a.side, q, o.price, o); o.qty -= q; rem -= q; got += q; }
    b.orders = b.orders.filter(o => o.qty > 0);
    if (rem) b.orders.push({ id: id(), gid: me.gid, code: me.code, k: c.k, side: a.side, qty: rem, price, t: now });
    return { book: b, filled: got, rested: rem };
  }
  return err("Unknown action.");
}
// Settle a pit quarter from its trades
export function exSettleTrades(R, trades, groups) {
  const market = {}, byGid = {}, B = exBudget(R); let mmPnl = 0;
  for (const c of COMMS) {
    const ts = (trades || []).filter(t => t.k === c.k), fills = {}, pairs = [];
    const add = (gid, side, qty, price, w) => { if (gid === "mm") return; (fills[gid] = fills[gid] || []).push({ side, qty, price, w }); };
    let vol = 0, mmBuy = 0, mmSell = 0, val = 0, hi = null, lo = null;
    for (const t of ts) {
      add(t.b, "buy", t.qty, t.price, t.mm ? "mm" : t.s); add(t.s, "sell", t.qty, t.price, t.mm ? "mm" : t.b);
      if (t.mm) { if (t.b === "mm") { mmBuy += t.qty; mmPnl += (R.S[c.k] - t.price) * c.size * t.qty; } else { mmSell += t.qty; mmPnl -= (R.S[c.k] - t.price) * c.size * t.qty; } }
      else { vol += t.qty; val += t.qty * t.price; pairs.push({ b: t.b, s: t.s, q: t.qty }); hi = hi == null ? t.price : Math.max(hi, t.price); lo = lo == null ? t.price : Math.min(lo, t.price); }
    }
    market[c.k] = { p: vol ? Math.round(val / vol * 100) / 100 : null, vol, mmBuy, mmSell, unfilled: 0, fills, pairs, hi, lo, n: ts.length, last: ts.length ? ts[ts.length - 1].price : null };
  }
  scoreDesks(R, market, groups, null, byGid);
  return { market, byGid, mmPnl, budget: B };
}
