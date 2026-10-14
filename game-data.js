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
    B: ["Fair yield for AA = 3.5% + 0.8% = 4.3%. It offered only 4.1%: overpriced.", "Rate hikes were coming, and this is a 10-year bond. Strong bookings didn't matter.", "Overpriced and long when rates are rising. Double pass."],
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
    C: ["Fair yield for BB = 4.5% + 3.5% = 8.0%. It offered 8.6%: a good deal.", "Bookings up 20% meant profits were coming back, a sign of an upgrade.", "Buying a fallen bond as its business recovers can pay off big."] } },
 { year: 6, title: "Boom Times", t0: 4.0, t1: 4.0,
   news: [
    "The economy is booming. Unemployment hits a 20-year low.",
    "Summit Software's stock hits an all-time high.",
    "GreenGrid Solar signs a 20-year deal to supply power to three state universities.",
    "A state report shows Lakewood has set aside only 40% of the pension money it owes retired city workers.",
    "Lakewood's new downtown park opens to big crowds.",
    "Lakewood's mayor proposes selling new bonds to \"close the pension gap.\""],
   bonds: [
    { id: "A", issuer: "GreenGrid Solar", rating: "BB", years: 7, sens: 6, yld: 8.1, what: "Builds and runs solar farms across the Midwest." },
    { id: "B", issuer: "City of Lakewood", rating: "A", years: 15, sens: 11, yld: 5.3, what: "Mid-size city. Bonds repaid with city taxes." },
    { id: "C", issuer: "Midwest Hotels Group", rating: "BBB", years: 10, sens: 8, yld: 6.3, what: "Owns 140 hotels near airports and highways." }],
   outcome: {
    rateNote: "Rates stayed at 4.0% all year.",
    A: { event: { label: "Upgraded BB → BBB (to investment grade)", pct: 8 }, story: "The 20-year university contract locked in steady income. Raters lifted GreenGrid to investment grade." },
    B: { event: { label: "Downgraded A → BBB", pct: -4 }, story: "Lakewood borrowed to plug its pension hole. More debt and a big unpaid promise to retirees cost it a rating step." },
    C: { event: null, story: "A boom year for travel. Every payment made, rating unchanged." } },
   why: {
    A: ["Fair yield for BB = 4.0% + 3.5% = 7.5%. It offered 8.1%: a good deal.", "A 20-year deal with state universities is about as steady as income gets.", "Junk with a good price and a big piece of good news is a strong buy."],
    B: ["Fair yield for A = 4.0% + 1.2% = 5.2%. It offered 5.3%: fair.", "Two headlines together: only 40% of its pension promises funded, AND a plan to borrow more to fill the gap. The park was noise.", "Governments can get downgraded too. Read the news, not just the label."],
    C: ["Fair yield for BBB = 4.0% + 2.0% = 6.0%. It offered 6.3%: a good deal.", "A booming economy is great for hotels. Rates were steady, so the 10-year length didn't hurt.", "Good price, good economy, steady rates: buy."] } },

 { year: 7, title: "Inflation Scare", t0: 4.0, t1: 5.0,
   news: [
    "Grocery prices are up 6% from last year, the fastest jump in a decade.",
    "Riverside Water opens a new reservoir, ending drought worries.",
    "Fed Chair: \"We will keep raising rates until inflation is under control.\"",
    "Gas prices jump 40 cents in one month.",
    "Heartland Freight Rail reports record grain shipments.",
    "Midwest Hotels' summer bookings are up 8%."],
   bonds: [
    { id: "A", issuer: "Riverside Water Authority", rating: "AA", years: 20, sens: 13, yld: 4.9, what: "Drinking water for 600,000 people, repaid from water bills." },
    { id: "B", issuer: "Midwest Hotels Group", rating: "BBB", years: 10, sens: 8, yld: 6.2, what: "Owns 140 hotels near airports and highways." },
    { id: "C", issuer: "Heartland Freight Rail", rating: "A", years: 3, sens: 3, yld: 5.4, what: "Freight railroad hauling grain, cars and containers across 12 states." }],
   outcome: {
    rateNote: "The Fed raised rates from 4.0% to 5.0%. Every bond's price fell, and cash in Treasuries beat all three.",
    A: { event: null, story: "Riverside paid every dollar on time. But a 20-year bond loses about 13% when rates jump 1%." },
    B: { event: null, story: "Midwest paid on time, but its 10-year bond lost about 8% of its price when rates rose." },
    C: { event: null, story: "Heartland paid on time and its short bond barely moved, but it still earned less than cash." } },
   why: {
    A: ["Fair yield for AA = 4.0% + 0.8% = 4.8%. It offered 4.9%: fair.", "Prices jumping 6% plus a Fed chair promising to keep raising rates means rates are headed up. A 20-year bond is the worst place to be.", "A safe borrower does not make a bond safe from rate hikes."],
    B: ["Fair yield for BBB = 4.0% + 2.0% = 6.0%. It offered 6.2%: fair.", "Rate hikes were coming, and this is a 10-year bond. Strong bookings didn't matter.", "When rates are about to rise, long bonds lose even when nothing is wrong with the company."],
    C: ["Fair yield for A = 4.0% + 1.2% = 5.2%. It offered 5.4%: fair.", "Short bonds only lose a little when rates rise, but a little is still enough to fall behind cash.", "Sometimes the best trade is no trade. Cash is a position."] } },

 { year: 8, title: "Default Wave", t0: 5.0, t1: 4.0,
   news: [
    "Factories cut shifts as orders dry up. Economists say a recession has started.",
    "Velocity Airlines unveils new seats with extra legroom.",
    "Velocity Airlines asks its banks for an emergency loan as jet fuel prices spike.",
    "The Fed signals deep rate cuts ahead to fight the slowdown.",
    "Lakewood starts paying some of its suppliers 90 days late.",
    "Harbor Point Hospital breaks ground on a new cancer center."],
   bonds: [
    { id: "A", issuer: "Velocity Airlines", rating: "BB", years: 5, sens: 4, yld: 9.0, what: "Budget airline flying to 60 cities." },
    { id: "B", issuer: "Harbor Point Hospital", rating: "A", years: 15, sens: 11, yld: 6.5, what: "Regional hospital. Bonds repaid from patient revenue." },
    { id: "C", issuer: "City of Lakewood", rating: "BBB", years: 3, sens: 3, yld: 6.6, what: "Mid-size city. Bonds repaid with city taxes." }],
   outcome: {
    rateNote: "The recession hit and the Fed cut rates from 5.0% to 4.0%. Bond prices rose: long bonds gained the most.",
    A: { event: { label: "DEFAULT", pct: null, default: true }, story: "Travel collapsed and Velocity ran out of cash. It missed a payment and filed for bankruptcy. Bondholders got back 40¢ per dollar." },
    B: { event: null, story: "People need hospitals in any economy. Payments arrived on time, and the big rate cut lifted this 15-year bond's price." },
    C: { event: { label: "Downgraded BBB → BB (fell to junk)", pct: -8 }, story: "Delaying bills is a sign of real trouble. Raters cut Lakewood to junk." } },
   why: {
    A: ["Fair yield for BB = 5.0% + 3.5% = 8.5%. It offered 9.0%: a good deal on paper.", "An airline asking for an emergency loan in a recession, with fuel costs spiking, is running out of cash. The new seats were noise.", "A good price can't save you from a company that's running out of money."],
    B: ["Fair yield for A = 5.0% + 1.2% = 6.2%. It offered 6.5%: a good deal.", "Hospitals are an essential service, and the Fed was cutting rates. Long and safe wins when rates fall.", "In a recession, buy safe, long bonds."],
    C: ["Fair yield for BBB = 5.0% + 2.0% = 7.0%. It offered only 6.6%: overpriced.", "A city paying its suppliers 90 days late is short on cash.", "Overpriced plus bad news: pass."] } },

 { year: 9, title: "The Comeback", t0: 4.0, t1: 4.0,
   news: [
    "Hiring rebounds as the recession ends.",
    "A new streaming service signs up 10 million users in its first month.",
    "Tri-County's team wins the league title. Season tickets are sold out for the next three seasons.",
    "Brightline Biotech's stock drops 70% the day after a government safety panel reviews its drug.",
    "Lakewood voters pass a tax increase set aside for the city's pension fund.",
    "Brightline hires a new marketing chief away from a major drug company."],
   bonds: [
    { id: "A", issuer: "Tri-County Stadium Authority", rating: "B", years: 10, sens: 8, yld: 10.2, what: "Owns a minor-league stadium. Repaid from tickets and parking." },
    { id: "B", issuer: "Brightline Biotech", rating: "CCC", years: 5, sens: 4, yld: 13.0, what: "Drug company with one drug in development." },
    { id: "C", issuer: "City of Lakewood", rating: "BB", years: 10, sens: 8, yld: 8.0, what: "Mid-size city. Bonds repaid with city taxes." }],
   outcome: {
    rateNote: "Rates stayed at 4.0% all year.",
    A: { event: { label: "Upgraded B → BB", pct: 8 }, story: "Three years of sold-out seasons means ticket and parking money is locked in. Raters lifted the stadium again." },
    B: { event: { label: "DEFAULT", pct: null, default: true }, story: "With its only drug dead, Brightline had no way to pay. It defaulted. Bondholders got back 40¢ per dollar." },
    C: { event: { label: "Upgraded BB → BBB (back to investment grade)", pct: 8 }, story: "The tax increase fixed the pension hole. Raters returned Lakewood to investment grade." } },
   why: {
    A: ["Fair yield for B = 4.0% + 5.5% = 9.5%. It offered 10.2%: a good deal.", "Sold-out seasons for three years is exactly what a stadium bondholder wants to hear.", "Risky bonds can be great buys when the news removes the risk."],
    B: ["Fair yield for CCC = 4.0% + 10.0% = 14.0%. It offered only 13.0%: overpriced.", "A 70% stock drop right after a safety review means the drug is in trouble, and it's Brightline's only product. The new hire was noise.", "A 13% yield means nothing if you never get paid."],
    C: ["Fair yield for BB = 4.0% + 3.5% = 7.5%. It offered 8.0%: a good deal.", "A tax increase set aside for the pension fund fixes the exact problem that got Lakewood downgraded.", "Buying a fallen borrower as it fixes its problems can pay off big."] } },

 { year: 10, title: "The Long Game", t0: 4.0, t1: 3.5,
   news: [
    "Inflation has cooled for six straight months.",
    "Harbor Point Hospital is named the region's top hospital for the fifth straight year.",
    "Summit Software agrees to buy CloudLedger for $9 billion, paid for with new bonds.",
    "Midwest Hotels opens its 150th hotel.",
    "GreenGrid's new battery plant is a year behind schedule, and its finance chief resigns.",
    "Solar panel prices fall to a record low."],
   bonds: [
    { id: "A", issuer: "Summit Software Inc.", rating: "AA", years: 5, sens: 4, yld: 4.6, what: "Accounting software used by 40,000 businesses." },
    { id: "B", issuer: "Harbor Point Hospital", rating: "A", years: 20, sens: 13, yld: 5.4, what: "Regional hospital. Bonds repaid from patient revenue." },
    { id: "C", issuer: "GreenGrid Solar", rating: "BBB", years: 7, sens: 6, yld: 6.3, what: "Builds and runs solar farms across the Midwest." }],
   outcome: {
    rateNote: "The Fed cut rates from 4.0% to 3.5%. Bond prices rose: long bonds gained the most.",
    A: { event: { label: "Downgraded AA → A", pct: -4 }, story: "A third borrowed-money buyout piled on more debt. Raters cut Summit again." },
    B: { event: null, story: "Harbor Point paid on time, and its 20-year bond gained about 6.5% when rates fell." },
    C: { event: { label: "Downgraded BBB → BB (fell to junk)", pct: -8 }, story: "Cost overruns plus more borrowing pushed GreenGrid back to junk." } },
   why: {
    A: ["Fair yield for AA = 4.0% + 0.8% = 4.8%. It offered only 4.6%: overpriced.", "A $9 billion buyout paid for with new bonds: the same move that got Summit downgraded in Year 1.", "Companies repeat their habits. Overpriced plus a familiar warning: pass."],
    B: ["Fair yield for A = 4.0% + 1.2% = 5.2%. It offered 5.4%: a good deal.", "Six months of cooling inflation points to rate cuts, and this is a 20-year bond. The award was nice but not the reason.", "Match the bond's length to where rates are headed."],
    C: ["Fair yield for BBB = 4.0% + 2.0% = 6.0%. It offered 6.3%: a good deal on paper.", "A big project a year late plus the finance chief quitting are classic signs of trouble. Cheaper solar panels were noise.", "A good price never outweighs a clear warning."] } }
];
export const NROUNDS = ROUNDS.length;

// Difficulty: hints fade as the game goes on
export const LEVELS = [
  { name: "Rookie Desk", years: [1, 2], showFair: true, showSens: true, note: "Hints on: each bond shows its fair yield and rate sensitivity." },
  { name: "Analyst", years: [3, 4, 5], showFair: false, showSens: true, note: "Work out the fair yield yourself." },
  { name: "Senior Analyst", years: [6, 7, 8], showFair: false, showSens: false, note: "No rate-sensitivity hints. Longer bonds move more." },
  { name: "Portfolio Manager", years: [9, 10], showFair: false, showSens: false, note: "Quiet clues. Connect the headlines and remember past years." }];
export const levelFor = year => LEVELS.find(l => l.years.includes(year));

// Return (percent) on a bond held for the year
export function bondReturn(round, b) {
  const o = round.outcome[b.id], dRate = round.t1 - round.t0;
  if (o.event && o.event.default) return { coupon: 0, rate: 0, credit: -(100 - RECOVERY), price: -(100 - RECOVERY), endPrice: RECOVERY, total: -(100 - RECOVERY), isDefault: true };
  const coupon = b.yld, rate = +(-b.sens * dRate).toFixed(2), credit = o.event ? o.event.pct : 0, price = +(rate + credit).toFixed(2);
  return { coupon, rate, credit, price, endPrice: +(100 + price).toFixed(2), total: +(coupon + price).toFixed(2), isDefault: false };
}
// One group's year: picks = {A: 0|100000|200000, B: ..., C: ...}
export function scoreRound(ri, picks, startValue) {
  const R = ROUNDS[ri]; picks = picks || {};
  let invested = 0, junk = 0, gain = 0; const lines = [];
  for (const b of R.bonds) {
    const amt = AMOUNTS.includes(picks[b.id]) ? picks[b.id] : 0, ret = bondReturn(R, b);
    const g = Math.round(amt * ret.total / 100), interest = Math.round(amt * ret.coupon / 100);
    invested += amt; if (isJunk(b.rating)) junk += amt; gain += g;
    lines.push({ id: b.id, amt, ret, gain: g, interest, priceGain: g - interest });
  }
  const cash = Math.max(0, startValue - invested), cashGain = Math.round(cash * R.t0 / 100);
  const fine = junk > JUNK_LIMIT ? JUNK_FINE : 0;
  const total = gain + cashGain - fine;
  const interest = lines.reduce((a, l) => a + l.interest, 0), priceGain = lines.reduce((a, l) => a + l.priceGain, 0);
  return { lines, invested, junk, cash, cashGain, fine, interest, priceGain, gain: total, end: startValue + total };
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
