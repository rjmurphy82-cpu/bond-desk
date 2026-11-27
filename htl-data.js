// Hold the Line: scenario data (Seed A). Every number here matches the scenario script doc.
// Prices are as revealed at the start of each quarter, Q0 to Q12. Q0 to Q11 are trading windows; Q12 is the Final Bell.
// The arrays below were generated from the balance-tested model; edit with care (the scoring reads them).
export const NQ = 12; // trading windows Q0..Q11
export const P = {"HRSY": [48, 49.44, 50.43, 50.93, 52.46, 53.51, 50.3, 42.75, 43.61, 47.1, 49.93, 52.43, 54.53], "ZYPH": [null, null, null, 40, 72, 118, 96, 70, 84, 52, 9, 6, 4], "PRKY": [62, 63.86, 65.78, 67.1, 69.11, 71.18, 69.04, 62.83, 65.34, 70.57, 75.51, 80.04, 84.04], "MDWY": [28, 28.28, 28.28, 28.85, 29.43, 30.31, 30.61, 30.0, 30.9, 31.52, 31.84, 32.48, 33.13], "BRSK": [35, 37.8, 41.58, 29.94, 31.44, 35.21, 29.93, 22.45, 24.7, 32.11, 38.53, 44.31, 49.63], "OKRG": [54, 60.48, 66.53, 70.52, 69.11, 63.58, 57.22, 46.92, 44.57, 49.03, 51.97, 53.53, 54.6], "LKSH": [22, 22.44, 22.66, 22.89, 23.35, 23.35, 20.55, 12.74, 15.29, 17.58, 19.34, 20.5, 21.32], "PXLB": [40, 42.4, 45.79, 48.08, 51.45, 53.51, 48.16, 39.49, 41.46, 46.44, 51.08, 55.17, 58.48], "NOVA": [30, 31.5, 34.02, 37.42, 41.91, 48.2, 43.38, 34.7, 12.14, 12.75, 11.47, 11.81, 11.81], "CRST": [45, 42.75, 39.33, 36.18, 34.73, 34.04, 30.64, 24.51, 26.96, 33.7, 39.77, 43.75, 46.38], "CLDK": [120, 126.0, 131.04, 138.9, 150.01, 157.51, 138.61, 108.12, 112.44, 129.31, 144.83, 157.86, 168.91], "STLH": [18, 18.0, 18.36, 18.18, 18.36, 18.36, 17.26, 14.67, 14.96, 16.16, 17.13, 23.98, 23.98], "HX500": [100, 103.0, 105.06, 107.16, 110.37, 111.47, 102.55, 82.04, 79.58, 87.54, 94.54, 100.21, 105.22], "HXBD": [50.0, 49.4, 48.81, 48.52, 48.81, 49.1, 48.22, 50.25, 51.46, 51.15, 50.84, 50.53, 50.53], "GOLD": [200, 208.0, 218.4, 224.95, 229.45, 231.74, 245.64, 267.75, 275.78, 264.75, 251.51, 243.96, 239.08], "PCOIN": [40, 46.0, 57.5, 77.62, 89.26, 107.11, 69.62, 34.81, 27.85, 37.6, 35.72, 28.58, 25.72]};
// prices two quarters and one quarter before Q0 (for the 6-month change shown on stat cards)
export const PRE = {"HRSY": [46.15, 47.06], "PRKY": [60.19, 61.08], "MDWY": [27.72, 27.86], "BRSK": [29.66, 32.11], "OKRG": [46.55, 50.0], "LKSH": [22.45, 22.22], "PXLB": [34.19, 36.87], "NOVA": [27.52, 28.71], "CRST": [47.87, 46.39], "CLDK": [107.14, 113.21], "STLH": [18.56, 18.27], "HX500": [95.24, 97.56], "HXBD": [50.51, 50.25], "GOLD": [188.68, 194.17], "PCOIN": [29.85, 34.19]};
export const EPS = {"HRSY": [2.8, 2.86, 2.92, 2.95, 3.01, 3.04, 2.95, 2.71, 2.66, 2.77, 2.85, 2.94, 3.0], "PRKY": [3.9, 3.94, 3.98, 4.02, 4.1, 4.14, 4.06, 3.82, 3.86, 4.01, 4.13, 4.21, 4.29], "MDWY": [2.55, 2.58, 2.61, 2.64, 2.67, 2.7, 2.73, 2.73, 2.76, 2.79, 2.82, 2.85, 2.88], "BRSK": [0.7, 0.75, 0.8, 0.64, 0.67, 0.71, 0.64, 0.54, 0.57, 0.66, 0.73, 0.79, 0.85], "OKRG": [6.0, 6.6, 7.19, 7.55, 7.32, 6.73, 5.92, 4.74, 4.36, 4.71, 4.95, 5.1, 5.2], "LKSH": [2.75, 2.81, 2.84, 2.87, 2.9, 2.9, 2.73, 2.32, 2.23, 2.34, 2.46, 2.56, 2.64], "PXLB": [1.6, 1.7, 1.8, 1.89, 2.0, 2.1, 2.02, 1.82, 1.86, 2.01, 2.15, 2.28, 2.39], "CRST": [5.0, 4.85, 4.56, 4.2, 3.95, 3.75, 3.3, 2.47, 2.35, 2.82, 3.24, 3.56, 3.77], "CLDK": [2.4, 2.54, 2.69, 2.85, 3.02, 3.17, 3.07, 2.82, 2.9, 3.13, 3.35, 3.55, 3.76], "STLH": [2.4, 2.42, 2.44, 2.44, 2.44, 2.44, 2.34, 2.06, 2.06, 2.18, 2.29, 2.29, 2.29], "NOVA": [-1.2, -1.25, -1.3, -1.35, -1.4, -1.45, -1.5, -1.55, -1.85, -1.4, -1.1, -0.95, -0.85], "ZYPH": [null, null, null, 0.18, 0.22, 0.27, 0.31, 0.34, 0.36, 0.37, -1.1, -1.05, -1.0]};
// dividends / interest paid per share at the start of each quarter (index = quarter)
export const DIV = {"HRSY": [0, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3], "PRKY": [0, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 0.62], "MDWY": [0, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21, 0.21], "OKRG": [0, 0.675, 0.675, 0.675, 0.675, 0.675, 0.675, 0.34, 0.34, 0.34, 0.34, 0.34, 0.34], "LKSH": [0, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.11, 0.11, 0.11, 0.22, 0.22, 0.22], "CRST": [0, 0.225, 0.225, 0.225, 0.225, 0.225, 0.225, 0, 0, 0, 0.225, 0.225, 0.225], "STLH": [0, 0.18, 0.18, 0.18, 0.18, 0.18, 0.18, 0.18, 0.18, 0.18, 0.18, 0.18, 0], "HX500": [0, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45], "HXBD": [0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]};
export const MACRO = {"fed": [3.25, 3.5, 4.0, 4.5, 4.75, 4.75, 5.25, 5.25, 4.5, 4.0, 3.75, 3.75, 3.75], "cpi": [3.1, 3.6, 4.2, 4.6, 4.4, 4.0, 4.3, 3.6, 3.0, 2.7, 2.5, 2.4, 2.3], "unemp": [4.0, 3.8, 3.7, 3.8, 4.0, 4.3, 4.6, 5.4, 6.1, 6.0, 5.6, 5.1, 4.8], "gdp": [2.4, 2.8, 2.5, 2.0, 1.4, 0.9, 0.2, -1.8, -1.2, 0.4, 1.8, 2.4, 2.6], "y10": [4.0, 4.2, 4.4, 4.5, 4.4, 4.3, 4.6, 3.9, 3.5, 3.6, 3.7, 3.8, 3.8], "y2": [3.6, 3.9, 4.3, 4.8, 4.9, 4.8, 5.2, 4.6, 3.8, 3.5, 3.4, 3.4, 3.4], "sent": [98, 101, 97, 94, 96, 97, 84, 62, 58, 70, 79, 86, 90], "fg": [55, 62, 66, 72, 78, 81, 48, 12, 20, 35, 52, 60, 64]};

export const ORDER = ["HRSY", "ZYPH", "PRKY", "MDWY", "BRSK", "OKRG", "LKSH", "PXLB", "NOVA", "CRST", "CLDK", "STLH", "HX500", "HXBD", "GOLD", "PCOIN"];
// kind: "co" company or "fund"; growth = expected growth % (for PEG); moat: Wide / Narrow / None / Unknown
export const A = {
  HRSY:  { kind: "co", name: "Hersey Holdings Inc.", sector: "Conglomerate", growth: 7, moat: "Wide", debt: "Low", blurb: "Owns brands in snacks, insurance and logistics. 40 straight years of profits." },
  ZYPH:  { kind: "co", name: "Zephyr AI", sector: "Tech", growth: 80, moat: "Unknown", debt: "Low", blurb: "AI assistant startup. The hottest IPO of the year. Growth figure is the company's own claim.", ipo: 3 },
  PRKY:  { kind: "co", name: "Prairie Rail & Freight", sector: "Transportation", growth: 5, moat: "Wide", debt: "Medium", blurb: "Hauls grain and freight across 9 Midwest states. Nobody can build a competing railroad." },
  MDWY:  { kind: "co", name: "Midway Grocers", sector: "Consumer staples", growth: 8, moat: "Narrow", debt: "Low", blurb: "Regional grocery chain expanding grocery delivery. People buy food in every economy." },
  BRSK:  { kind: "co", name: "Bright Spark Energy", sector: "Clean energy", growth: 30, moat: "Narrow", debt: "Medium", blurb: "Solar panels and home batteries. Depends on government subsidies." },
  OKRG:  { kind: "co", name: "Oak Ridge Energy", sector: "Oil and gas", growth: 3, moat: "None", debt: "Medium", blurb: "Oil producer. Profits rise and fall with oil prices." },
  LKSH:  { kind: "co", name: "Lakeshore Bank", sector: "Financials", growth: 4, moat: "Narrow", debt: "High (normal for a bank)", blurb: "Regional bank. Book value is $26 a share.", book: 26 },
  PXLB:  { kind: "co", name: "Pixel Burger", sector: "Restaurants", growth: 25, moat: "Narrow", debt: "Low", blurb: "Fast-casual burgers and shakes, opening 200 new stores. The place you actually eat." },
  NOVA:  { kind: "co", name: "Novagen Therapeutics", sector: "Biotech", growth: null, moat: "None", debt: "Low", blurb: "One drug in trials. FDA decision expected in Q8. No profits yet." },
  CRST:  { kind: "co", name: "Crestline Homebuilders", sector: "Housing", growth: 6, moat: "None", debt: "Medium", blurb: "Builds starter homes. Sales depend on mortgage rates." },
  CLDK:  { kind: "co", name: "Cloudkeep Software", sector: "Software", growth: 28, moat: "Wide", debt: "Low", blurb: "Cloud storage used by 60% of the Fortune 500. Customers almost never leave." },
  STLH:  { kind: "co", name: "Steelhead Industrial", sector: "Industrials", growth: 2, moat: "None", debt: "Low", blurb: "Makes steel parts for factories. Book value is $24 a share.", book: 24 },
  HX500: { kind: "fund", name: "Hersey 500 Index Fund", sector: "Index fund", blurb: "The 500 largest companies in the market. Expense ratio 0.03%. Moves with the whole market." },
  HXBD:  { kind: "fund", name: "Hersey Total Bond Fund", sector: "Bond fund", blurb: "Government and corporate bonds, duration 6 years. Price falls about 6% for every 1-point rise in rates." },
  GOLD:  { kind: "fund", name: "Hersey Gold Trust", sector: "Gold", blurb: "Physical gold. Tends to rise when people are afraid or inflation is high. No income." },
  PCOIN: { kind: "fund", name: "PrairieCoin", sector: "Cryptocurrency", blurb: "A cryptocurrency. Huge swings driven by hype. No earnings, no dividends." }
};
export const CONSUMER = ["Consumer staples", "Restaurants", "Housing", "Conglomerate"];
export const QLABEL = q => q === 0 ? "Opening Bell" : q === 12 ? "Final Bell" : `Year ${Math.ceil(q / 4)} · Q${q}`;
export const YEAR_OF = q => q < 4 ? 1 : q < 8 ? 2 : 3; // trading windows Q0-3 = Year 1, Q4-7 = Year 2, Q8-11 = Year 3
export const PAYCHECK = { 4: 1000, 8: 1000 };
export const START_CASH = 10000;
export const FG_BAND = v => v <= 25 ? "Extreme fear" : v < 45 ? "Fear" : v <= 55 ? "Neutral" : v < 75 ? "Greed" : "Extreme greed";

// ---------- the 8 archetypes ----------
// dials: [key, label, min, max, step, default, unit]
export const ARCH = {
  graham: { name: "Graham", style: "Deep value", icon: "🔍", idea: "Buy things for less than they're worth, and keep a margin of safety.",
    rules: ["Positive earnings only", "Companies or the bond fund only. No PrairieCoin, no gold"],
    dials: [["pe", "Max P/E when I buy", 10, 18, 1, 12, ""], ["cash", "Minimum cash after any trade", 10, 30, 5, 20, "%"], ["trim", "Sell half a position once it's up", 30, 60, 5, 50, "%"]],
    tags: ["opening", "value", "trim", "paycheck", "broke", "hold", "other"] },
  buffett: { name: "Buffett", style: "Quality value", icon: "🏰", idea: "Wonderful companies at fair prices, held for years.",
    rules: ["Wide-moat companies or HX500 only", "Never sell a holding in a quarter its price fell", "Trades in Q0 don't count toward the yearly limit"],
    dials: [["trades", "Max trades per year", 2, 6, 1, 4, ""], ["pe", "Max P/E when I buy", 18, 30, 1, 25, ""], ["dip", "Buy more when a holding drops this far from its high", 15, 30, 5, 20, "%"]],
    tags: ["opening", "moat", "value", "dip", "paycheck", "hold", "other"] },
  lynch: { name: "Lynch", style: "Growth at a reasonable price", icon: "🍔", idea: "Buy growing companies you understand, at a fair price.",
    rules: ["Positive earnings only", "Consumer-facing companies only: staples, restaurants, housing, conglomerate"],
    dials: [["peg", "Max PEG when I buy", 1.0, 1.5, 0.1, 1.5, ""], ["pos", "Max position size", 15, 35, 5, 30, "%"], ["sellpeg", "Sell when PEG rises above", 2.0, 3.0, 0.1, 2.5, ""]],
    tags: ["opening", "peg", "pegsell", "paycheck", "broke", "hold", "other"] },
  fisher: { name: "Fisher", style: "Quality growth", icon: "🌱", idea: "Find outstanding growers and hold them for years.",
    rules: ["Expected growth of 20% or more", "Positive earnings only", "Never sell because the price fell (selling is allowed if earnings turn negative)"],
    dials: [["hold", "Minimum holding period (quarters)", 4, 8, 1, 4, ""], ["maxh", "Max number of holdings", 3, 6, 1, 4, ""], ["pos", "Max position size", 20, 40, 5, 35, "%"]],
    tags: ["opening", "growth", "broke", "paycheck", "hold", "other"] },
  templeton: { name: "Templeton", style: "Contrarian", icon: "🧭", idea: "Buy at maximum pessimism, when everyone else is scared.",
    rules: ["Opening portfolio (Q0): cash and HX500 only", "After Q0, buy only what's down from its high by your Dial 1 amount, or anything when Fear and Greed is 25 or lower"],
    dials: [["drop", "Required drop from its high before I buy", 20, 40, 5, 25, "%"], ["cash", "Minimum cash while Fear and Greed is above 60", 20, 50, 5, 30, "%"], ["fg", "Trim when Fear and Greed reaches", 70, 85, 5, 75, ""]],
    tags: ["opening", "fear", "trim", "paycheck", "hold", "other"] },
  bogle: { name: "Bogle", style: "Index investing", icon: "📈", idea: "Own the whole market, keep costs low, and don't tinker.",
    rules: ["HX500 and HXBD only", "Trade only in Q0, paycheck quarters, scheduled rebalances, or when you drift past your band", "Invest every paycheck"],
    dials: [["stock", "Stock share (HX500)", 60, 90, 5, 80, "%"], ["reb", "Rebalance every (quarters)", 4, 8, 4, 4, ""], ["band", "Allowed drift before an early rebalance", 5, 15, 5, 10, "%"]],
    tags: ["opening", "rebalance", "paycheck", "hold", "other"] },
  allweather: { name: "All Weather", style: "Balanced (Dalio-style)", icon: "🌦️", idea: "Balance across asset classes so no single economy can sink you.",
    rules: ["Always hold HX500, HXBD and GOLD", "Allowed: HX500, HXBD, GOLD, OKRG and cash. No PrairieCoin", "Invest every paycheck"],
    dials: [["bond", "Bond share (HXBD)", 30, 50, 5, 40, "%"], ["gold", "Gold share", 10, 20, 5, 15, "%"], ["reb", "Rebalance every (quarters)", 4, 8, 4, 4, ""]],
    tags: ["opening", "rebalance", "paycheck", "hold", "other"] },
  livermore: { name: "Livermore", style: "Momentum", icon: "🚀", idea: "Ride the winners and cut losers fast.",
    rules: ["Buy only what's rising (Dial 1, over the last 6 months)", "Sell in the same quarter a stop loss is hit"],
    dials: [["up", "Buy only if up this much over 6 months", 10, 25, 5, 15, "%"], ["stop", "Trailing stop loss from the high since I bought", 8, 20, 1, 15, "%"], ["maxh", "Max number of holdings", 3, 6, 1, 4, ""]],
    tags: ["opening", "momentum", "stop", "paycheck", "hold", "other"] }
};
export const ARCH_ORDER = ["graham", "buffett", "lynch", "fisher", "templeton", "bogle", "allweather", "livermore"];
// Reasons a student can tag on a trade or decision card. Validity is checked in htl-score.js.
export const TAGS = {
  opening: "Building my opening portfolio by my rules",
  value: "It's cheap: P/E under my cap",
  moat: "Wide-moat company",
  dip: "Buying more after a big drop",
  trim: "Taking profits / trimming per my rule",
  peg: "Growth at a fair price: PEG under my cap",
  pegsell: "PEG climbed above my sell line",
  growth: "Outstanding grower: 20%+ growth",
  fear: "Others are fearful: buying at pessimism",
  momentum: "It's rising: up enough over 6 months",
  stop: "My stop loss was hit",
  rebalance: "Rebalancing to my targets",
  paycheck: "Investing my paycheck",
  broke: "Its earnings turned negative",
  hold: "Holding: my rules don't call for action",
  other: "Other (explain in the note)"
};

// ---------- the script ----------
// news: read aloud on the board. research: tap-to-open details. noise: social feed and Jake's group chat.
// forced: a decision card every student submits. asset "LARGEST" = the student's largest position.
export const Q = [
  { title: "Opening Bell", sub: "Build your opening portfolio",
    news: ["The economy grew 2.4% last quarter. Unemployment is low at 4.0%.", "Inflation is 3.1%, above the Fed's 2% target. The Fed holds rates at 3.25% and says it is watching prices closely.", "Novagen Therapeutics says the FDA will rule on its only drug in about two years.", "Rumors say Zephyr AI, the hottest private tech company in the country, will go public later this year."],
    research: ["Oil: $78 a barrel. 30-year mortgage rate: 6.6%.", "Every stat card shows price, P/E, dividend yield, expected growth, PEG, moat and the 6-month change. Use them to build a portfolio that follows your pledge."],
    noise: [["Jake", "just put everything in PrairieCoin, it's literally free money"], ["@moonboi", "Bonds are for grandparents."]] },
  { title: "Inflation heats up",
    news: ["Inflation rises to 3.6%. The Fed raises rates a quarter point to 3.50%.", "Oil jumps to $88 after major producers cut output. Oak Ridge Energy climbs 12%.", "Pixel Burger crushes earnings and announces 200 new stores. Shares up 6%.", "Mortgage rates hit 6.9%. Crestline Homebuilders says new orders fell. Shares down 5%."],
    research: ["Oak Ridge earnings per share up 10% to $6.60.", "Pixel Burger same-store sales up 9%.", "Midway Grocers launches grocery delivery in 40 stores.", "Crestline order backlog down 6%."],
    noise: [["@moonboi", "PCOIN to $1,000 by summer 🚀"], ["Prairie Capital Research", "Upgrading Bright Spark Energy to BUY."]] },
  { title: "The Fed gets aggressive",
    news: ["Inflation hits 4.2%. The Fed raises rates half a point to 4.00%, its biggest hike in years.", "Bright Spark Energy wins a contract to supply batteries to three utilities. Shares up 10%.", "Oil reaches $97. Oak Ridge up another 10%.", "Zephyr AI officially files to go public. Its filing says revenue tripled last year."],
    research: ["The bond fund fell 1.2% as interest rates rose.", "Crestline orders down again. Mortgage rate: 7.3%.", "Hersey Holdings raises its full-year profit outlook slightly."],
    noise: [["Jake", "my cousin got ZYPH shares before the IPO, he's gonna be rich"], ["@moonboi", "PrairieCoin up 25% this quarter. Still early."]] },
  { title: "The IPO and the warning sign",
    news: ["Zephyr AI goes public at $40 a share. It's the most talked-about IPO of the year. Its P/E is 222.", "The Fed raises rates half a point to 4.50%.", "The yield curve inverts: the 2-year Treasury now yields 4.8%, more than the 10-year at 4.5%. In the past, inversions have often come before recessions.", "Congress cuts solar tax credits. Bright Spark Energy falls 28%."],
    research: ["Zephyr AI's filing: revenue up 210%, but accounts receivable (money customers owe and haven't paid yet) up 480%. That gap is a red flag.", "Bright Spark earnings per share drop to $0.64. The company says growth will slow for a year.", "Oil: $103."],
    noise: [["@techbro_daily", "ZYPH is the next trillion-dollar company. Not financial advice (it is)."], ["Jake", "if you don't buy ZYPH today you will regret it forever"]],
    forced: { asset: "ZYPH", prompt: "Zephyr AI just went public. Buy, sell or hold ZYPH?" } },
  { title: "The mania", paycheck: true,
    news: ["Zephyr AI soars 80% in its first full quarter, to $72.", "The Fed raises rates a quarter point to 4.75% and hints it may pause.", "Economic growth slows to 1.4%.", "Novagen's drug shows strong results in a mid-stage trial. Shares up 12%."],
    research: ["Zephyr AI reports a profit, but its cash flow from operations is negative: it reports earnings while cash leaves the company. Second red flag.", "Cloudkeep beats earnings for the 8th straight quarter. P/E is about 50.", "Oil eases to $100. Mortgage rate: 7.7%.", "Payday: $1,000 lands in your account this quarter."],
    noise: [["Jake", "I'm up 80% on ZYPH what are you even doing"], ["@moonboi", "PrairieCoin up again. Told you."]] },
  { title: "Extreme greed",
    news: ["Zephyr AI hits $118, nearly triple its IPO price. The Fear and Greed meter reads 81: extreme greed.", "The Fed holds rates at 4.75%.", "Unemployment ticks up to 4.3%.", "Novagen climbs 15% as investors bet on FDA approval."],
    research: ["Oil demand is falling. Oak Ridge earnings per share down 8%.", "The yield curve is still inverted.", "The Hersey 500's P/E is now about 21, above its long-run average."],
    noise: [["Prairie Capital Research", "Starting Zephyr AI at STRONG BUY. Price target: $200."], ["@biotechbets", "Novagen approval is GUARANTEED, my uncle works there"], ["@moonboi", "PrairieCoin +20%. Generational wealth loading."]] },
  { title: "The Fed shock",
    news: ["Surprise: inflation jumps back to 4.3%. The Fed raises rates half a point to 5.25%, the highest in years.", "The market falls 8%. Zephyr AI drops 19% to $96.", "PrairieCoin crashes 35%.", "Gold rises 6% as investors look for safety."],
    research: ["Lakeshore Bank reports rising loan losses on office buildings.", "Crestline orders hit a 10-year low. Mortgage rate: 7.9%.", "Economic growth is near zero: 0.2%."],
    noise: [["Jake", "BUY THE DIP"], ["@macro_mike", "The Fed will cut next month for sure."]] },
  { title: "The crash",
    news: ["The economy shrinks 1.8%. Unemployment jumps to 5.4%. The country is in a recession.", "The market falls 20%. The Fear and Greed meter drops to 12: extreme fear.", "Lakeshore Bank falls 38% after social media posts claim customers are pulling their money out.", "Oak Ridge Energy cuts its dividend in half. Crestline suspends its dividend."],
    research: ["Lakeshore says deposits fell only 3%, and its capital is well above what regulators require. It cuts its dividend in half to be safe.", "The bond fund rose 4% as interest rates fell.", "Gold is up 9%, a record high.", "Oil: $64. PrairieCoin down another 50%."],
    noise: [["@doom_daily", "This is the big one. Sell everything."], ["Jake", "I lost half my money, I'm out"], ["Prairie Capital Research", "Downgrading nine stocks to SELL."]],
    forced: { asset: "LARGEST", prompt: "The market just crashed 20%. Buy, sell or hold your largest position?" } },
  { title: "The bottom", paycheck: true,
    news: ["The Fed cuts rates three quarters of a point to 4.50%.", "Unemployment reaches 6.1%. The market slips another 3%.", "The FDA rejects Novagen's drug. Novagen falls 65%.", "Regulators confirm Lakeshore Bank is safe. Shares rebound 20%."],
    research: ["Zephyr AI's auditor delays signing off on its annual report. Third red flag.", "Mortgage rates drop to 6.5%. Crestline orders rise for the first time in two years.", "Gold edges up 3%.", "Payday: $1,000 lands in your account this quarter."],
    noise: [["@techbro_daily", "AI is recession-proof. ZYPH bouncing."], ["@biotechbets", "Novagen will win on appeal."]] },
  { title: "The turn",
    news: ["The Fed cuts rates half a point to 4.00%. The yield curve is no longer inverted.", "The economy grows again, at 0.4%. The market rises 10%.", "A short seller publishes a report saying many of Zephyr AI's customers don't exist. Zephyr falls 38% to $52.", "Congress restores solar tax credits. Bright Spark jumps 30%."],
    research: ["Short-seller report: 40% of Zephyr's customers share three mailing addresses. Zephyr's CEO calls the report lies.", "Crestline up 25% as home sales recover. Mortgage rate: 6.0%."],
    noise: [["ZYPH CEO", "Short sellers are criminals. Buy the dip."], ["Jake", "ZYPH at $52 is a steal"]] },
  { title: "The truth comes out",
    news: ["Zephyr AI admits it overstated revenue by 60%. It restates its profits as losses, and the CEO resigns. Zephyr falls 83% to $9.", "The Fed cuts rates a quarter point to 3.75%.", "The market rises 8%.", "Lakeshore Bank and Crestline restore their full dividends."],
    research: ["Zephyr AI earnings per share restated to negative $1.10.", "Unemployment is down to 5.6%. Oil: $72."],
    noise: [["@techbro_daily", "ZYPH at $9 is the buy of the decade."], ["@moonboi", "PrairieCoin down 5%. Just a dip."]],
    forced: { asset: "ZYPH", prompt: "Zephyr AI admitted it faked its revenue. Buy, sell or hold ZYPH?" } },
  { title: "The buyout offer",
    news: ["Titan Manufacturing offers to buy Steelhead Industrial for $23.98 a share in cash, 40% above last quarter's price. The deal closes next quarter.", "The market rises 6%.", "A PrairieCoin exchange is hacked. PrairieCoin falls 20%.", "Unemployment falls to 5.1%."],
    research: ["Steelhead's board recommends accepting. Holders can sell now near $23.98, or hold and receive $23.98 in cash when the deal closes. No other bidder has appeared."],
    noise: [["@dealhunter", "Hold STLH, someone will bid $30."]],
    forced: { asset: "STLH", prompt: "Titan offered $23.98 cash for Steelhead. Sell now, hold to the close, or buy?" } },
  { title: "Final Bell",
    news: ["The market rises 5% and finishes above where it started three years ago.", "The Steelhead deal closes. Holders are paid $23.98 a share in cash.", "Prairie Rail reports record profits.", "Zephyr AI is removed from the stock exchange's main board. Final price: $4."],
    research: [], noise: [] }
];
