// Recession Radar: every curve, clue and outcome. Shared by the live game, the iPads and the practice page.
// Yields: Treasury constant-maturity monthly averages from FRED (GS3M, GS1, GS2, GS5, GS7, GS10).
// Recession dates: NBER business cycle peaks. Today's curve: U.S. Treasury daily par yield curve.
// To refresh "Today" before you play, update TODAY below (see the Refresh note in the README).

export const MATS = ["3M", "1Y", "2Y", "5Y", "7Y", "10Y"];
export const MAT_YEARS = [0.25, 1, 2, 5, 7, 10];

// The rule students use: spread = 10-year yield minus 3-month yield.
export const spreadOf = y => Math.round((y[5] - y[0]) * 100) / 100;
export const shapeOf = sp => sp < 0 ? "inverted" : sp < 1 ? "flat" : "normal";
export const SHAPES = {
  normal: { label: "Normal", rule: "Spread is +1.00 or more", short: "Long rates well above short rates", light: "Green light" },
  flat: { label: "Flat", rule: "Spread is 0 to +0.99", short: "Long and short rates about the same", light: "Yellow light" },
  inverted: { label: "Inverted", rule: "Spread is below 0", short: "Short rates ABOVE long rates", light: "Red light" }
};
export const SHAPE_KEYS = ["normal", "flat", "inverted"];
export const CHIPS = [1, 2, 3];

// Timing bands for the recession call. "none" = no recession starts within 2 years.
export const BANDS = [
  { key: "0-6", label: "0 to 6 months", short: "0-6 mo" },
  { key: "7-12", label: "7 to 12 months", short: "7-12 mo" },
  { key: "13-24", label: "13 to 24 months", short: "13-24 mo" },
  { key: "none", label: "No recession in 2 years", short: "None" }
];
export const BAND_KEYS = BANDS.map(b => b.key);
export const bandOf = rd => !rd.recession ? "none" : rd.months <= 6 ? "0-6" : rd.months <= 12 ? "7-12" : "13-24";

// Mystery order is not chronological on purpose. The last three rounds (Senior) also show the curve 12 months earlier.
// Rounds with `analyst` are Spot-the-Analyst rounds: the analyst line is a paraphrased composite of common forecasts
// at the time (not a quote from one person). `decoys` are used only on the solo practice page.
export const ROUNDS = [
  { tag: "A", date: "December 2003", year: 2003, ylds: [0.91, 1.31, 1.91, 3.27, 3.79, 4.27],
    clue: "The economy is recovering from a recession that ended two years ago. The Fed has cut its key rate to 1%, its lowest level in about 45 years.",
    recession: false, months: 48, next: "December 2007",
    headline: "No recession for four more years",
    story: "A steep curve meant lenders expected growth ahead, and they got it. The economy kept expanding until December 2007, 48 months later.",
    lesson: "A steep, normal curve usually means investors expect growth (and some inflation) ahead." },
  { tag: "B", date: "February 2007", year: 2007, ylds: [5.16, 5.05, 4.85, 4.71, 4.71, 4.72],
    clue: "The Fed raised short-term rates 17 times in a row from 2004 to 2006, then stopped. After a long boom, home prices have stopped rising.",
    recession: true, months: 10, next: "December 2007",
    headline: "Recession began December 2007",
    story: "Ten months later the Great Recession began, the worst downturn since the 1930s, as the housing bubble burst and banks failed.",
    lesson: "Investors were locking in long-term rates because they expected the Fed to have to cut. They were right." },
  { tag: "C", date: "December 1992", year: 1992, ylds: [3.29, 3.71, 4.67, 6.08, 6.46, 6.77],
    clue: "The economy is slowly climbing out of a recession that ended in 1991. The Fed has cut rates again and again to help.",
    recession: false, months: 99, next: "March 2001",
    headline: "No recession for more than eight years",
    story: "The expansion that followed ran until March 2001, the longest in U.S. history at the time.",
    lesson: "A very steep curve right after a recession is a classic early-recovery signal." },
  { tag: "D", date: "June 1999", year: 1999, ylds: [4.72, 5.10, 5.62, 5.81, 6.05, 5.90], trap: true,
    clue: "Internet stocks are soaring and unemployment is very low. This month the Fed raised rates for the first time since early 1997.",
    recession: true, months: 21, next: "March 2001",
    headline: "TRAP: Recession began March 2001",
    story: "The curve looked healthy, but the Fed kept raising rates six times in a year, the curve inverted in 2000, and a recession began 21 months later.",
    lesson: "A normal curve today is not a promise for two years. When the Fed starts a string of rate hikes, the curve can flip fast. The clue was the signal." },
  { tag: "E", date: "August 2000", year: 2000, ylds: [6.28, 6.18, 6.23, 6.06, 6.05, 5.83],
    clue: "Tech stocks soared for years, then started falling this spring. The Fed has raised rates six times since mid-1999 to cool things down.",
    recession: true, months: 7, next: "March 2001",
    headline: "Recession began March 2001",
    story: "Seven months later a recession began as the dot-com bubble burst and businesses cut back on spending.",
    lesson: "Short rates above long rates: the bond market expected rate cuts ahead, and cuts come when the economy weakens.",
    analystCall: "no",
    analyst: "The Fed is slowing things down just enough, so no recession.",
    decoys: ["Tech stocks are crashing and the curve is upside down, so a recession is coming soon.", "Short rates are higher than long rates, which means investors expect cuts, so we say recession within a year.", "Unemployment is still low and people keep spending, so the economy will keep growing."] },
  { tag: "F", date: "June 1998", year: 1998, ylds: [5.12, 5.41, 5.52, 5.52, 5.56, 5.50],
    clue: "Unemployment is the lowest in nearly 30 years and inflation is low. The Fed has kept its key rate steady for more than a year.",
    recession: false, months: 33, next: "March 2001",
    headline: "No recession within two years",
    story: "The Fed cut rates three times that fall and the boom kept going. The next recession didn't start until March 2001, 33 months later, outside our two-year window.",
    lesson: "Flat is a yellow light, not a red one. Flat curves are common and often pass without a recession." },
  { tag: "G", date: "June 1989", year: 1989, ylds: [8.43, 8.44, 8.41, 8.29, 8.31, 8.28],
    clue: "The Fed raised rates sharply over the past year to fight rising inflation.",
    recession: true, months: 13, next: "July 1990",
    headline: "Recession began July 1990",
    story: "Thirteen months later a recession began, made worse when an oil price spike hit in the summer of 1990.",
    lesson: "The inversion was tiny (just -0.15), but the signal still worked. The sign matters more than the size." },
  { tag: "H", date: "August 2019", year: 2019, ylds: [1.99, 1.77, 1.57, 1.49, 1.55, 1.63], before: [2.07, 2.45, 2.64, 2.77, 2.84, 2.89],
    clue: "A trade war is worrying businesses. The Fed just cut rates for the first time in more than 10 years.",
    recession: true, months: 6, next: "February 2020", asterisk: true,
    headline: "Recession began February 2020",
    story: "Six months later a recession began, but it was caused by the COVID-19 pandemic, something no bond market could have predicted. Scored as a correct YES, with an asterisk.",
    lesson: "Did the curve really call it, or was it luck? Economists still argue. A signal is only as good as its reason." },
  { tag: "I", date: "September 2007", year: 2007, ylds: [3.99, 4.14, 4.01, 4.20, 4.33, 4.52], before: [4.93, 4.97, 4.77, 4.67, 4.68, 4.72], trap: true,
    clue: "Problems with risky home loans (subprime mortgages) spread to Wall Street this summer. This month the Fed cut rates by half a point, its first cut in four years.",
    recession: true, months: 3, next: "December 2007",
    headline: "TRAP: Recession began December 2007",
    story: "Only three months later the Great Recession began. The curve looked flat and calm, but a year earlier it had been inverted. It was flipping back because the Fed had started cutting in a hurry.",
    lesson: "Watch the direction, not just the shape. When an inverted curve 'un-inverts' because the Fed is rushing to cut, the recession is often right around the corner.",
    analystCall: "no",
    analyst: "Home loans are a mess, but the Fed is cutting rates, so we'll be fine.",
    decoys: ["The curve already flipped back to normal, so the danger is over and growth continues.", "Last year it was inverted and now the Fed is cutting in a hurry, which is what happens right before a recession.", "Home loans going bad will hit the banks hard, so a recession is close."] },
  { tag: "J", date: "July 2023", year: 2023, ylds: [5.49, 5.37, 4.83, 4.14, 4.03, 3.90], before: [2.30, 3.02, 3.04, 2.96, 2.97, 2.90],
    clue: "Inflation hit a 40-year high last year. The Fed has raised rates 11 times since March 2022, its fastest pace in four decades.",
    recession: false, months: null, next: "None declared as of October 2026",
    headline: "NO recession. The radar missed.",
    story: "One of the deepest inversions in more than 40 years, and the curve stayed inverted for about two years. No recession followed. Economists point to extra household savings from the pandemic, a strong job market, and inflation cooling without mass layoffs.",
    lesson: "The yield curve is a pattern, not a law. Every forecasting tool can be wrong, and 'this time is different' is sometimes true.",
    analystCall: "yes",
    analyst: "The Fed raised rates too fast, so a recession is coming soon.",
    decoys: ["The job market is too strong for a recession, so the economy keeps growing.", "This is the most inverted curve in 40 years, so a recession is basically guaranteed.", "People still have pandemic savings to spend, so any slowdown will be mild with no recession."] }
];
export const N = ROUNDS.length;
export const isDefend = r => !!(ROUNDS[r] && ROUNDS[r].analyst);

// TODAY: refresh from https://home.treasury.gov (Daily Treasury Par Yield Curve Rates) before class.
export const TODAY = {
  date: "October 21, 2026", year: 2026, ylds: [4.25, 4.52, 4.81, 4.95, 5.03, 5.13], y30: 5.42,
  fedFunds: "3.75% to 4.00%", source: "U.S. Treasury daily par yield curve, October 21, 2026",
  checkBack: "October 2028",
  clue: "In September the Fed raised its key rate to 3.75% to 4.00%, its first hike since 2023, saying inflation is still above its 2% goal. The job market has held up.",
  facts: [
    "Every yield on our chart rises from left to right, from 4.25% (3-month) to 5.13% (10-year). The 30-year pays 5.42%.",
    "10-year minus 3-month = 5.13 - 4.25 = +0.88. Under our rule that is FLAT, near the top of the range.",
    "10-year minus 2-year (the spread on the news) = +0.32.",
    "The 3-month bill (4.25%) pays more than the Fed's key rate (3.75% to 4.00%). That suggests investors expect the Fed may raise rates again.",
    "The curve is NOT inverted. It was inverted from late 2022 until late 2024, and no recession followed. Remember Curve I: un-inverting can be a warning, but there the Fed was cutting. Today it is raising."
  ],
  sides: [
    ["Reasons to worry", "Recessions have often started AFTER an inverted curve flips back to normal. Rates are rising again, and higher borrowing costs slow home buying and business spending."],
    ["Reasons for calm", "The curve isn't inverted. This time it is sloping up because long-term rates are rising, not because the Fed is cutting in a panic. The job market has held up."]
  ]
};

// Scoring: +1 right shape; the recession call (yes = any timing band) wins or loses the chips bet (1 to 3);
// +1 timing bonus for the exact band when a recession did start. Spot-the-Analyst points are added in standings.
export function scoreRound(d, rd) {
  if (!d || !rd) return { shape: 0, call: 0, timing: 0, total: 0, shapeOK: false, callOK: false, timingOK: false, answered: false };
  const truthShape = shapeOf(spreadOf(rd.ylds)), band = d.call;
  const shapeOK = d.shape === truthShape, answered = BAND_KEYS.includes(band);
  const callOK = answered && (band !== "none") === rd.recession;
  const timingOK = answered && rd.recession && band === bandOf(rd);
  const chips = CHIPS.includes(+d.chips) ? +d.chips : 1;
  const shape = shapeOK ? 1 : 0, call = answered ? (callOK ? chips : -chips) : 0, timing = timingOK ? 1 : 0;
  return { shape, call, timing, total: shape + call + timing, shapeOK, callOK, timingOK, answered, chips };
}
export const MAX_ROUND = 5, MAX_GAME = ROUNDS.reduce((a, rd) => a + 4 + (rd.recession ? 1 : 0), 0);

// The Radar record: for each shape, how many rounds and how many recessions followed within 2 years.
export function record(upto = N - 1) {
  const out = { normal: [0, 0], flat: [0, 0], inverted: [0, 0] };
  ROUNDS.slice(0, upto + 1).forEach(rd => { const s = shapeOf(spreadOf(rd.ylds)); out[s][0]++; if (rd.recession) out[s][1]++; });
  return out;
}

// Today's curve simulator. Each lever moves each maturity by (lever × weight).
export const LEVERS = [
  { key: "fed", label: "The Fed moves its key rate", min: -2, max: 2, step: 0.25, w: [1, 0.85, 0.65, 0.35, 0.25, 0.2],
    help: "Hikes push SHORT rates up the most. Cuts pull them down." },
  { key: "infl", label: "Inflation worries", min: -1.5, max: 1.5, step: 0.25, w: [0.05, 0.15, 0.3, 0.6, 0.8, 1],
    help: "Lenders demand more to tie up money for years, so LONG rates move the most." },
  { key: "fear", label: "Recession fear (investors rush to safety)", min: 0, max: 2, step: 0.25, w: [-0.1, -0.4, -0.7, -0.9, -1, -1], level: true,
    help: "Investors buy long Treasuries to lock in today's rates. Prices go up, so LONG yields go down." }
];
export const PRESETS = [
  { label: "Reset to today", v: { fed: 0, infl: 0, fear: 0 } },
  { label: "Fed hikes 3 more times", v: { fed: 0.75, infl: 0, fear: 0 } },
  { label: "Inflation scare", v: { fed: 0.25, infl: 1, fear: 0 } },
  { label: "Recession scare", v: { fed: 0, infl: -0.25, fear: 1.5 } },
  { label: "Fed cuts in a hurry", v: { fed: -1.5, infl: 0, fear: 0.5 } }
];
export function simulate(base, v) {
  return base.map((y, i) => Math.round((y + LEVERS.reduce((a, L) => a + (v[L.key] || 0) * L.w[i], 0)) * 100) / 100);
}
// Rate sensitivity from The Bond Desk: price move per 1% change in yield.
export const SENS = { "2Y": 1.9, "10Y": 7.8 };
export const priceMove = (dy, sens) => Math.round(-dy * sens * 10) / 10;
