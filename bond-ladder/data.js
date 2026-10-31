/* Bond Ladder: everything the game asks. Shared by the student page and the teacher screen.
   Three kinds of rounds, one for each Unit 4 class game:
     Rating Room  - score an issuer on the six-factor scorecard; the app turns your scores into a rating
     Bond Desk    - one Bond Desk year: $0, $100K or $200K in each of three bonds, the rest stays in Treasuries
     Yield Curve  - a Recession Radar mystery curve: name the shape, call the timing, bet 1 to 3 chips
   The issuers, years and curves come straight from the class games (rating-data.js, game-data.js,
   radar-data.js), so fix content there. The Quick Fire banks are copied from Bonds Live and Curves Live
   (bonds-live.html, curves-live.html): questions test the bond concepts and math, not the rules of the games. */
import * as BD from "../game-data.js";
import * as RR from "../radar-data.js";
const RD = window.RATING_DATA;

export const MAIN_MAX = 600;
export const TOPICS = {
  rate:  { name: "The Rating Room", short: "Rating Room", task: "Rate the Issuer", verb: "rating" },
  desk:  { name: "The Bond Desk", short: "Bond Desk", task: "Make the Trade", verb: "trade" },
  curve: { name: "The Yield Curve", short: "Yield Curve", task: "Read the Curve", verb: "call" }
};

/* ---------------------------------------------------------------- QUICK FIRE
   First option is the correct one; options are shuffled per game. cv = mystery curves whose answer the
   explanation gives away, so those questions are skipped in a game that plays that curve. */
export const SKILLS = {
  ratios: { tp: "rate", short: "The three ratios" },
  rating: { tp: "rate", short: "Credit ratings" },
  yield: { tp: "desk", short: "Fair yield" },
  call: { tp: "desk", short: "Good deal or overpriced" },
  price: { tp: "desk", short: "Interest rate risk" },
  fund: { tp: "desk", short: "Bond basics and return" },
  read: { tp: "curve", short: "Reading the curve" },
  shape: { tp: "curve", short: "Naming the shape" },
  why: { tp: "curve", short: "Why the curve bends" },
  signal: { tp: "curve", short: "The recession signal" },
  direction: { tp: "curve", short: "Reading the direction" }
};
export const BANK = [
 // ---- the three ratios
 {id:"r1",sk:"ratios",p:"Total debt $600M. Yearly earnings $200M. What is the debt load?",o:["3 years","0.33 years","400 years","800 years"],x:"Debt ÷ earnings = 600 ÷ 200 = 3 years to pay it off."},
 {id:"r2",sk:"ratios",p:"Earnings $120M. Yearly interest $20M. What is the interest coverage?",o:["6x","0.17x","100x","140x"],x:"Earnings ÷ interest = 120 ÷ 20 = 6x."},
 {id:"r3",sk:"ratios",p:"Cash $45M. Debt due next year $30M. What is the cash cushion?",o:["1.5","0.67","15","75"],x:"Cash ÷ debt due = 45 ÷ 30 = 1.5."},
 {id:"r4",sk:"ratios",p:"Total debt $500M. Earnings $50M. What is the debt load?",o:["10 years","0.1 years","450 years","5 years"],x:"500 ÷ 50 = 10 years. That's a lot of debt for what it earns."},
 {id:"r5",sk:"ratios",p:"Company A has a debt load of 2 years. Company B has 7 years. Which is safer?",o:["Company A","Company B","They're equal","Can't tell"],x:"For debt load, lower is safer. A could pay off its debt in 2 years of earnings."},
 {id:"r6",sk:"ratios",p:"Company A has interest coverage of 9x. Company B has 1.5x. Which is safer?",o:["Company A","Company B","They're equal","Can't tell"],x:"For coverage, higher is safer. A earns 9 times its interest bill."},
 {id:"r7",sk:"ratios",p:"A cash cushion of 0.5 means:",o:["It has only half the cash it needs for debt due next year","It has twice the cash it needs","It has no debt","It earns 50% on its cash"],x:"Cash ÷ debt due = 0.5, so cash covers only half of what's due."},
 {id:"r8",sk:"ratios",p:"For which ratio is a LOWER number safer?",o:["Debt load","Interest coverage","Cash cushion","All three"],x:"Less debt per dollar of earnings is safer. For coverage and cash cushion, higher is safer."},
 {id:"r9",sk:"ratios",p:"Interest coverage of 1.2x means:",o:["Earnings barely cover the interest bill","The company has no debt","It has 1.2 years of cash","It earns 12 times its interest"],x:"It earns only 1.2 times what it owes in interest. One bad year and it can't pay."},
 // ---- ratings and risk
 {id:"g1",sk:"rating",p:"Which rating is the safest?",o:["AAA","BBB","A","AA"],x:"AAA is the top rating."},
 {id:"g2",sk:"rating",p:"What is the LOWEST investment-grade rating?",o:["BBB","A","BB","AA"],x:"BBB and up is investment grade. BB and lower is high-yield (junk)."},
 {id:"g3",sk:"rating",p:"Which of these is a high-yield (junk) rating?",o:["BB","BBB","A","AA"],x:"BB, B and CCC are junk."},
 {id:"g4",sk:"rating",p:"What does a rating agency do?",o:["Grades how likely an issuer is to pay its debts","Sets the Treasury rate","Sells bonds to investors","Guarantees the bond will be repaid"],x:"Agencies like S&P, Moody's and Fitch grade credit risk. They don't guarantee anything."},
 {id:"g5",sk:"rating",p:"As a bond's rating goes DOWN, what usually happens to the yield investors demand?",o:["It goes up","It goes down","It stays the same","It becomes zero"],x:"Lower rating means more risk, so investors want more yield."},
 {id:"g6",sk:"rating",p:"A bond is downgraded from BBB to BB. What is it called?",o:["A fallen angel","A rising star","A Treasury","A red herring"],x:"A fallen angel drops from investment grade to junk, and its price usually falls hard."},
 {id:"g7",sk:"rating",p:"The agency rates a company BBB, but your analysis of its numbers says B. What do you expect?",o:["A downgrade, so the bond's price should fall","An upgrade, so the price should rise","No change","The bond pays off early"],x:"If the numbers are weaker than the rating, the rating is likely to be cut, and the price drops."},
 {id:"g8",sk:"rating",p:"The agency rates a company BB, but its numbers have improved a lot. What is likely?",o:["An upgrade, so the price should rise","A downgrade, so the price should fall","A default","Nothing. Ratings never change"],x:"Ratings can be out of date. When the agency catches up, the price goes up."},
 {id:"g9",sk:"rating",p:"Why does a drop from BBB to BB usually hit the price extra hard?",o:["Many funds aren't allowed to hold junk bonds, so they all sell","The coupon stops","The bond matures right away","The Treasury rate changes"],x:"Crossing into junk forces many investors to sell at once, pushing the price down further."},
 // ---- fair yield
 {id:"y1",sk:"yield",p:"Treasury rate 3.0%. The bond's spread is +1.2%. What is the fair yield?",o:["4.2%","3.0%","1.8%","4.5%"],x:"3.0% + 1.2% = 4.2%."},
 {id:"y2",sk:"yield",p:"Treasury rate 4.5%. The bond's spread is +3.5%. What is the fair yield?",o:["8.0%","4.5%","1.0%","6.5%"],x:"4.5% + 3.5% = 8.0%."},
 {id:"y3",sk:"yield",p:"Treasury rate 3.5%. The bond's spread is +0.5%. What is the fair yield?",o:["4.0%","3.5%","4.3%","3.0%"],x:"3.5% + 0.5% = 4.0%."},
 {id:"y4",sk:"yield",p:"Treasury rate 5.0%. The bond's spread is +10.0%. What is the fair yield?",o:["15.0%","10.0%","5.0%","10.5%"],x:"5.0% + 10.0% = 15.0%. A spread that big means a very risky bond."},
 {id:"y5",sk:"yield",p:"Treasury rate 4.0%. A bond's fair yield is 6.0%. What is its spread?",o:["+2.0%","+6.0%","+10.0%","+1.5%"],x:"Spread = fair yield − Treasury rate = 6.0% − 4.0% = 2.0%."},
 {id:"y6",sk:"yield",p:"In the fair-yield formula, the spread is:",o:["The extra yield investors want for taking the bond's risk","The bond's price change","The Treasury rate","The coupon paid twice a year"],x:"The spread is extra pay for risk. Safer bonds get a small spread; risky bonds get a big one."},
 {id:"y7",sk:"yield",p:"Why does a B-rated bond have a bigger spread than an AA-rated bond?",o:["Investors need more pay to take more default risk","B bonds are always newer","The government sets B spreads higher","B bonds are always shorter"],x:"More risk of not getting paid back means investors demand a higher yield."},
 {id:"y8",sk:"yield",p:"Why is the Treasury rate the starting point for fair yield?",o:["U.S. Treasury bonds are treated as the safest bonds there are","Treasury bonds pay the highest yield","Every company must pay the Treasury rate","It is set by the rating agencies"],x:"Treasuries are backed by the U.S. government, so they are the no-risk baseline. Every other bond adds a spread on top."},
 // ---- good deal or overpriced
 {id:"c1",sk:"call",p:"Fair yield is 5.0%. The bond pays 5.5%. What's the call?",o:["Good deal","Overpriced","Can't tell","It will default"],x:"It pays 0.5% more than its fair yield, so it's a good deal."},
 {id:"c2",sk:"call",p:"Fair yield is 4.8%. The bond pays 4.5%. What's the call?",o:["Overpriced","Good deal","Can't tell","It will default"],x:"It pays 0.3% less than it should for its risk, so it's overpriced."},
 {id:"c3",sk:"call",p:"Treasury 4.0%. Spread +1.2%. The bond pays 5.0%. What's the call?",o:["Overpriced","Good deal","Can't tell","It will default"],x:"Fair yield = 4.0% + 1.2% = 5.2%. It pays 5.0%, less than fair, so it's overpriced."},
 {id:"c4",sk:"call",p:"Treasury 3.0%. Spread +2.0%. The bond pays 5.4%. What's the call?",o:["Good deal","Overpriced","Can't tell","It will default"],x:"Fair yield = 5.0%. It pays 5.4%, more than fair, so it's a good deal."},
 {id:"c5",sk:"call",p:"Treasury 4.5%. Spread +3.5%. The bond pays 7.6%. What's the call?",o:["Overpriced","Good deal","Can't tell","It will default"],x:"Fair yield = 8.0%. 7.6% looks high, but it's less than fair for this much risk, so it's overpriced."},
 {id:"c6",sk:"call",p:"A bond pays 9.0%, the highest yield on the board. Is it automatically a good deal?",o:["No. Compare it to its fair yield first","Yes. The highest yield always wins","Yes, as long as it's junk","No. High yields always default"],x:"A risky bond should pay a lot. It's only a good deal if it pays more than its fair yield."},
 {id:"c7",sk:"call",p:"A bond pays LESS than its fair yield. What does that tell you?",o:["You're not being paid enough for the risk","It's a bargain","It must be a Treasury bond","Its rating will go up"],x:"Paying less than fair means the price is too high for the risk you take."},
 {id:"c8",sk:"call",p:"Two bonds both pay 6.0%. Bond X's fair yield is 5.2%. Bond Y's is 6.8%. Which is the better deal?",o:["Bond X","Bond Y","They're the same","Can't tell"],x:"Bond X pays 0.8% more than fair. Bond Y pays 0.8% less than fair. Same yield, very different deals."},
 // ---- rates and prices
 {id:"m1",sk:"price",p:"Interest rates go up. What happens to the price of bonds you already own?",o:["It falls","It rises","It stays the same","It doubles"],x:"New bonds now pay more, so older bonds paying less are worth less."},
 {id:"m2",sk:"price",p:"Interest rates go down. What happens to the price of bonds you already own?",o:["It rises","It falls","It stays the same","It drops to zero"],x:"Your bond pays more than new bonds, so buyers will pay more for it."},
 {id:"m3",sk:"price",p:"Rates rise 0.5%. The bond's rate sensitivity is 6. Price change?",o:["−3%","+3%","−6%","−0.5%"],x:"−6 × 0.5 = −3%."},
 {id:"m4",sk:"price",p:"Rates fall 1%. The bond's rate sensitivity is 8. Price change?",o:["+8%","−8%","+1%","−1%"],x:"−8 × (−1) = +8%. Falling rates push prices up."},
 {id:"m5",sk:"price",p:"Rates rise 1%. The bond's rate sensitivity is 15. Price change?",o:["−15%","+15%","−1%","−16%"],x:"−15 × 1 = −15%. Long bonds can lose a lot when rates rise."},
 {id:"m6",sk:"price",p:"Which bond's price moves the most when rates change?",o:["A 20-year bond","A 2-year bond","A 5-year bond","A 1-year Treasury bill"],x:"Longer bonds have higher rate sensitivity."},
 {id:"m7",sk:"price",p:"Interest rate risk is the risk that:",o:["Rates rise and your bond's price falls","The issuer stops paying","The rating goes up","The coupon gets bigger"],x:"Even a perfectly safe bond loses value if rates rise."},
 {id:"m8",sk:"price",p:"Where do investors buy and sell bonds after they're first issued?",o:["The secondary market","The rating agency","The Treasury","The issuer only"],x:"Bonds trade between investors on the secondary market, and that's where prices move."},
 {id:"m9",sk:"price",p:"You expect rates to RISE soon. Which bond is the safer pick?",o:["A short bond with low sensitivity","A 30-year bond","A long bond with high sensitivity","They will all fall the same"],x:"Short bonds have low sensitivity, so their price falls less when rates rise."},
 // ---- bond basics and return
 {id:"f1",sk:"fund",p:"When you buy a bond, you are:",o:["Lending money to the issuer","Buying part ownership of the company","Opening a savings account","Paying the issuer's taxes"],x:"A bond is a loan. The issuer pays you interest and pays you back at maturity."},
 {id:"f2",sk:"fund",p:"A bond's coupon is:",o:["The interest it pays","The date it pays you back","Its credit rating","Its price on the market"],x:"The coupon is the interest payment. Maturity is when you get your money back."},
 {id:"f3",sk:"fund",p:"A city's bond is repaid only from tolls on one bridge. What kind of bond is it?",o:["A revenue bond","A general obligation bond","A Treasury bond","A corporate bond"],x:"A revenue bond is repaid from one project's income. A general obligation bond is backed by the city's taxing power."},
 {id:"f4",sk:"fund",p:"What does it mean when an issuer defaults?",o:["It fails to make the payments it promised","It pays off the bond early","Its rating goes up","It raises the coupon"],x:"A default means missed payments. Investors may get back only part of their money."},
 {id:"f5",sk:"fund",p:"A bond pays 5%. Its price falls 4%. What is the total return?",o:["1%","9%","−4%","5%"],x:"Total return = yield + price change = 5% − 4% = 1%."},
 {id:"f6",sk:"fund",p:"A bond pays 4%. Its price rises 4% from an upgrade and falls 3% from rising rates. Total return?",o:["5%","11%","8%","1%"],x:"4% + 4% − 3% = 5%."},
 {id:"f7",sk:"fund",p:"You invest $200K in a bond with a 7% total return. Dollars earned?",o:["$14,000","$1,400","$140,000","$7,000"],x:"$200,000 × 0.07 = $14,000."},
 {id:"f8",sk:"fund",p:"You invest $300K in a bond with a −2% total return. Dollars?",o:["−$6,000","+$6,000","−$600","−$60,000"],x:"$300,000 × −0.02 = −$6,000."},
 {id:"f9",sk:"fund",p:"Which business is the safest borrower in a recession?",o:["A water utility (essential service)","A cruise line (cyclical business)","A luxury car maker","A new scooter startup"],x:"People pay for essential services in any economy. Cyclical businesses earn less when the economy slows."},
 // ---- reading the curve
 {id:"a1",sk:"read",p:"On a yield curve, what goes along the bottom (left to right)?",o:["How long until the bond pays you back (maturity)","The bond's credit rating","The year the bond was sold","How much the bond costs"],x:"Maturity runs left to right, from 3 months to 10 years and more. Yield goes up the side."},
 {id:"a2",sk:"read",p:"Why does a yield curve use only U.S. Treasury bonds?",o:["Same borrower, so only TIME changes the yield","Treasuries pay the highest yields","Companies aren't allowed to sell long bonds","Treasuries never change price"],x:"Holding risk the same lets you see the price of time by itself."},
 {id:"a3",sk:"read",p:"10-year yield 4.60%. 3-month yield 3.10%. What is the spread?",o:["+1.50","−1.50","+7.70","+1.10"],x:"4.60 − 3.10 = +1.50."},
 {id:"a4",sk:"read",p:"10-year yield 4.55%. 3-month yield 5.40%. What is the spread?",o:["−0.85","+0.85","+9.95","−0.95"],x:"4.55 − 5.40 = −0.85. Negative, so short rates are above long rates."},
 {id:"a5",sk:"read",p:"10-year yield 6.77%. 3-month yield 3.29%. What is the spread?",o:["+3.48","−3.48","+3.52","+10.06"],x:"6.77 − 3.29 = +3.48 (this was December 1992).",cv:["C"]},
 {id:"a6",sk:"read",p:"10-year yield 5.83%. 3-month yield 6.28%. What is the spread?",o:["−0.45","+0.45","−0.55","+12.11"],x:"5.83 − 6.28 = −0.45 (this was August 2000).",cv:["E"]},
 {id:"a7",sk:"read",p:"For the spread, you subtract:",o:["The 3-month yield FROM the 10-year yield","The 10-year yield from the 3-month yield","The 2-year yield from the 5-year yield","The Fed's rate from the 3-month yield"],x:"Spread = 10Y − 3M. Order matters, because the sign is what tells you the shape."},
 {id:"a8",sk:"read",p:"A spread of −0.30 means:",o:["The 3-month yield is 0.30 HIGHER than the 10-year","The 10-year yield is 0.30 higher than the 3-month","Both yields are 0.30%","Yields fell 0.30 this year"],x:"Negative spread = short rate above long rate."},
 // ---- name the shape
 {id:"s1",sk:"shape",p:"10Y 4.27%, 3M 0.91%. Name the shape.",o:["Normal","Flat","Inverted","Can't tell"],x:"4.27 − 0.91 = +3.36, well over +1.00: normal (December 2003).",cv:["A"]},
 {id:"s2",sk:"shape",p:"10Y 4.72%, 3M 5.16%. Name the shape.",o:["Inverted","Normal","Flat","Can't tell"],x:"4.72 − 5.16 = −0.44, below 0: inverted (February 2007).",cv:["B"]},
 {id:"s3",sk:"shape",p:"10Y 5.50%, 3M 5.12%. Name the shape.",o:["Flat","Normal","Inverted","Can't tell"],x:"5.50 − 5.12 = +0.38, between 0 and +0.99: flat (June 1998).",cv:["F"]},
 {id:"s4",sk:"shape",p:"10Y 5.90%, 3M 4.72%. Name the shape.",o:["Normal","Flat","Inverted","Can't tell"],x:"5.90 − 4.72 = +1.18, at least +1.00: normal (June 1999).",cv:["D"]},
 {id:"s5",sk:"shape",p:"10Y 4.52%, 3M 3.99%. Name the shape.",o:["Flat","Normal","Inverted","Can't tell"],x:"4.52 − 3.99 = +0.53: flat (September 2007).",cv:["I"]},
 {id:"s6",sk:"shape",p:"10Y 8.28%, 3M 8.43%. Name the shape.",o:["Inverted","Flat","Normal","Can't tell"],x:"8.28 − 8.43 = −0.15. Tiny, but below 0, so inverted (June 1989). The sign matters more than the size.",cv:["G"]},
 {id:"s7",sk:"shape",p:"In an INVERTED curve:",o:["Short-term yields are higher than long-term yields","Long-term yields are much higher than short-term","All yields are about the same","Yields are below zero"],x:"Inverted means upside down: lenders get more for 3 months than for 10 years."},
 {id:"s8",sk:"shape",p:"Which shape is the most common, the one you'd expect in a normal economy?",o:["Normal (upward sloping)","Inverted","Flat","Downward sloping"],x:"Lenders usually want more to lend for longer, so most curves slope up."},
 // ---- why it bends
 {id:"w1",sk:"why",p:"Why do lenders usually want a higher yield to lend for 10 years than for 3 months?",o:["More time means more risk: inflation, rising rates, money tied up","The government requires it","Long bonds are always junk","Short bonds pay no interest"],x:"More time = more risk = more yield. That's why most curves slope up."},
 {id:"w2",sk:"why",p:"The Fed raises its key interest rate. Which part of the curve moves up the MOST?",o:["The short end (3-month, 1-year)","The long end (10-year)","Every maturity moves the same","None of it"],x:"The Fed sets a very short-term rate, so short yields follow it closely."},
 {id:"w3",sk:"why",p:"Investors start worrying that inflation will be high for years. Which part of the curve rises the most?",o:["The long end (10-year)","The short end (3-month)","Neither end","Only the 2-year"],x:"Long bond holders lose the most buying power to inflation, so they demand more."},
 {id:"w4",sk:"why",p:"Lots of investors rush to BUY 10-year Treasuries. What happens to the 10-year yield?",o:["It falls","It rises","It stays the same","It goes to zero"],x:"Buying pushes the price up, and price up means yield down."},
 {id:"w5",sk:"why",p:"Why do investors buy long-term Treasuries when they fear a recession?",o:["To lock in today's rates before the Fed cuts them","Because long bonds always pay more","Because recessions raise long rates","To avoid paying taxes"],x:"If they expect rates to fall, they want to lock in today's yield for years."},
 {id:"w6",sk:"why",p:"A bond's yield goes UP. What happens to its price?",o:["It goes down","It goes up","It doesn't change","It doubles"],x:"Price and yield always move in opposite directions."},
 {id:"w7",sk:"why",p:"The Fed hikes rates and the 10-year barely moves. What happens to the curve?",o:["It gets flatter","It gets steeper","Nothing","It disappears"],x:"Short rates rise, long rates don't, so the gap (spread) shrinks: flatter."},
 {id:"w8",sk:"why",p:"How can a yield curve end up inverted?",o:["The Fed pushes short rates up while recession fears pull long rates down","Inflation pushes long rates way up","Every rate falls by the same amount","Companies stop borrowing"],x:"Short end up + long end down = short above long: inverted."},
 // ---- the recession signal
 {id:"n1",sk:"signal",p:"Why is an inverted curve treated as a recession warning?",o:["Investors expect rates to FALL, and the Fed usually cuts when the economy weakens","Inverted curves cause banks to close","It means inflation is about to explode","The government declares a recession"],x:"An inversion is the bond market betting on rate cuts, and cuts usually follow trouble."},
 {id:"n2",sk:"signal",p:"Since the late 1960s, how have inverted curves and U.S. recessions lined up?",o:["Inversions came before most recessions, but there were false alarms","Every inversion caused a recession right away","Inversions only happen after recessions","There is no connection"],x:"It's a strong pattern with misses, so treat it as a warning, not a guarantee."},
 {id:"n3",sk:"signal",p:"When the curve inverts, a recession (if one comes) usually starts:",o:["Months later, often within about 2 years","The same week","Ten years later","Before the inversion"],x:"The lag is long and varies, from about 6 months to 2 years in our history."},
 {id:"n4",sk:"signal",p:"Who officially decides when a U.S. recession started?",o:["The National Bureau of Economic Research (NBER)","The President","The rating agencies","The Treasury Department"],x:"The NBER's Business Cycle Dating Committee is the official referee."},
 {id:"n5",sk:"signal",p:"In July 2023 the curve was deeply inverted (10Y 3.90%, 3M 5.49%). What happened next?",o:["No recession followed","A recession started within 3 months","The Fed was shut down","Bond prices went to zero"],x:"One of the deepest inversions in 40 years, and no recession: proof the signal can miss.",cv:["J"]},
 {id:"n6",sk:"signal",p:"In August 2019 the curve inverted, and a recession began in February 2020. Why do economists argue about whether the curve 'called it'?",o:["The recession was caused by the COVID-19 pandemic, which no market predicted","The curve wasn't really inverted","There was no recession in 2020","The NBER never dated it"],x:"Right signal, arguably for the wrong reason.",cv:["H"]},
 {id:"n7",sk:"signal",p:"A very steep, normal curve right after a recession usually signals:",o:["An early recovery with growth ahead","Another recession next month","A coming default","Nothing at all"],x:"Like December 1992 and December 2003: low short rates, higher long rates, growth ahead.",cv:["A","C"]},
 {id:"n8",sk:"signal",p:"Best way to use the yield curve as a forecaster:",o:["As one strong clue, checked against jobs, inflation and the Fed","As a guarantee","Ignore it completely","Only look at the 2-year yield"],x:"It's a pattern, not a law. Good analysts use it with other evidence."},
 // ---- read the direction
 {id:"d1",sk:"direction",p:"A year ago the spread was −0.21. Today it's +0.53, because the Fed just started cutting rates in a hurry. What should worry you?",o:["Un-inverting after an inversion has often come right before a recession","Nothing, the danger is over","The curve is now normal, so growth is guaranteed","Rate cuts always prevent recessions"],x:"This was September 2007. The Great Recession began 3 months later.",cv:["I"]},
 {id:"d2",sk:"direction",p:"The curve looks normal (spread +1.18), but the Fed just started a string of rate hikes. What could happen?",o:["Short rates rise, and the curve could flatten or invert","The curve will get steeper","Nothing; normal curves stay normal","Long rates will fall to zero"],x:"June 1999: the Fed hiked six times, the curve inverted in 2000, and a recession began in March 2001.",cv:["D","E"]},
 {id:"d3",sk:"direction",p:"A year ago the spread was +0.60. Today it's −1.59. Which way is the curve moving?",o:["Getting more inverted","Getting steeper and more normal","Not moving","Flipping back to normal"],x:"From +0.60 down to −1.59: deeper and deeper inversion (2022 to 2023).",cv:["J"]},
 {id:"d4",sk:"direction",p:"Why does a curve often un-invert right before a recession?",o:["The Fed rushes to cut short rates as trouble shows up","Long rates suddenly fall to zero","Inflation disappears overnight","Investors stop buying bonds"],x:"Cuts pull the short end down below the long end, so the curve flips back."},
 {id:"d5",sk:"direction",p:"Spread a year ago: +0.82. Spread now: −0.36. The Fed just cut rates for the first time in 10 years. What's the read?",o:["It just inverted: a red light","It's steepening: a green light","No change","It's flat, so ignore it"],x:"August 2019. It moved from flat to inverted.",cv:["H"]},
 {id:"d6",sk:"direction",p:"The best yield curve analysts look at:",o:["The shape, the direction it's moving, and what the Fed is doing","Only today's shape","Only the 30-year yield","Only stock prices"],x:"Some of the hardest curves are caught by direction and the Fed, not the shape alone."},
 {id:"d7",sk:"direction",p:"A curve goes from inverted to flat over a year. On its own, does that mean the danger has passed?",o:["No. Check WHY: un-inverting because of Fed cuts is often a late warning","Yes. Flat curves never come before recessions","Yes. Only inverted curves matter","No. It means a recession has already ended"],x:"Direction plus reason. Flipping back because of panic cuts is not an all-clear."}
];
export const bankById = Object.fromEntries(BANK.map(q => [q.id, q]));

/* ---------------------------------------------------------------- RATING ROOM issuers */
export const FACTORS = RD.factors, LADDER = RD.ladder, YEARS = RD.years;
export const ratingFor = total => RD.scale.find(([min]) => total >= min)[1];
export const CASES = RD.cases;

/* ---------------------------------------------------------------- BOND DESK years */
export const DESK = BD.ROUNDS, SPREADS = BD.SPREADS, AMOUNTS = BD.AMOUNTS, bondReturn = BD.bondReturn;
export const FUND = 1000000;
export function deskGain(year, picks) { // picks [a,b,c] in dollars; the rest earns the Treasury rate
  const R = DESK[year]; let inv = 0, g = 0; const lines = R.bonds.map((b, i) => {
    const amt = AMOUNTS.includes(+picks[i]) ? +picks[i] : 0, ret = bondReturn(R, b), d = Math.round(amt * ret.total / 100);
    inv += amt; g += d; return { amt, ret, gain: d }; });
  const cash = FUND - inv, cashGain = Math.round(cash * R.t0 / 100);
  return { gain: g + cashGain, cash, cashGain, lines };
}
const deskCache = {};
export function deskRange(year) { // best and worst possible years (all 27 combinations)
  if (deskCache[year]) return deskCache[year];
  let best = null, worst = null;
  for (const a of AMOUNTS) for (const b of AMOUNTS) for (const c of AMOUNTS) {
    const g = deskGain(year, [a, b, c]).gain;
    if (!best || g > best.gain || (g === best.gain && a + b + c < best.picks.reduce((x, y) => x + y, 0))) best = { gain: g, picks: [a, b, c] };
    if (!worst || g < worst.gain) worst = { gain: g, picks: [a, b, c] };
  }
  return (deskCache[year] = { best, worst });
}

/* ---------------------------------------------------------------- YIELD CURVES */
export const CURVES = RR.ROUNDS, MATS = RR.MATS, SHAPE_INFO = RR.SHAPES, SHAPE_KEYS = RR.SHAPE_KEYS, BANDS = RR.BANDS;
export const spreadOf = RR.spreadOf, shapeOf = RR.shapeOf, bandOf = RR.bandOf;
export const curveByTag = Object.fromEntries(CURVES.map(c => [c.tag, c]));

/* ---------------------------------------------------------------- ROUND CATALOG
   id = "rate:<case index>", "desk:<year index>", "curve:<tag>". Play order follows ORDER. */
export const ROUNDS = {};
CASES.forEach((c, i) => ROUNDS["rate:" + i] = { id: "rate:" + i, tp: "rate", title: c.name, sub: c.type, ref: i });
DESK.forEach((y, i) => ROUNDS["desk:" + i] = { id: "desk:" + i, tp: "desk", title: `Year ${y.year}: ${y.title}`, sub: y.bonds.map(b => b.issuer.replace(/ (Inc\.|Group|Authority)$/, "")).join(", "), ref: i });
CURVES.forEach(c => ROUNDS["curve:" + c.tag] = { id: "curve:" + c.tag, tp: "curve", title: `Mystery curve ${c.tag}`, sub: c.trap ? "Trap curve" : c.before ? "Shows the curve a year earlier" : "From Recession Radar", ref: c.tag, date: c.date });
export const GROUPS = {
  rate: [3, 6, 4, 7, 2, 5, 1, 0, 8].map(i => "rate:" + i),
  desk: [1, 7, 2, 4, 3, 6, 5, 8, 0, 9].map(i => "desk:" + i),
  curve: ["B", "D", "J", "E", "I", "F", "A", "G", "H", "C"].map(t => "curve:" + t)
};
export const DEFAULT_ON = ["rate:3", "desk:1", "curve:B", "rate:6", "desk:7", "curve:D"];
// Play order: Rating, Desk, Curve, Rating, Desk, Curve ... using each list's on-switches in order.
export function playOrder(on) {
  const lists = ["rate", "desk", "curve"].map(tp => GROUPS[tp].filter(id => on.includes(id))), out = [];
  for (let i = 0; out.length < on.length; i++) lists.forEach(l => { if (l[i]) out.push(l[i]); });
  return out;
}

/* ---------------------------------------------------------------- SCORING (each main task is worth up to 600) */
export function ratePoints(caseIdx, picks) { // picks = six levels (0 to 4) in FACTORS order, null if left blank
  const c = CASES[caseIdx], right = FACTORS.map((f, i) => picks && picks[i] === c.scores[f.key]);
  const filled = picks && picks.every(v => v != null);
  const total = (picks || []).reduce((a, v) => a + (+v || 0), 0), mine = filled ? ratingFor(total) : null;
  const off = mine ? Math.abs(LADDER.indexOf(mine) - LADDER.indexOf(c.rating)) : 9;
  const fp = right.filter(Boolean).length * 50, rp = [300, 150, 50][off] || 0;
  return { pts: fp + rp, factorPts: fp, ratingPts: rp, right, mine, off, total, official: c.rating };
}
export function deskPoints(year, picks) {
  const { best, worst } = deskRange(year), g = deskGain(year, picks || [0, 0, 0]).gain;
  const f = best.gain === worst.gain ? 1 : (g - worst.gain) / (best.gain - worst.gain);
  return { pts: Math.round(MAIN_MAX * Math.max(0, Math.min(1, f))), gain: g, best: best.gain };
}
export function curvePoints(tag, d) { // d = { shape, call (band key), chips 1-3 }. The exact timing band (or "no recession") earns the +50.
  const rd = curveByTag[tag], shape = shapeOf(spreadOf(rd.ylds)), band = bandOf(rd);
  const shapeOK = !!d && d.shape === shape, answered = !!d && BANDS.some(b => b.key === d.call);
  const chips = d && [1, 2, 3].includes(+d.chips) ? +d.chips : 1;
  const callOK = answered && (d.call !== "none") === rd.recession, timingOK = callOK && d.call === band;
  const sp = shapeOK ? 100 : 0, cp = !answered ? 0 : callOK ? 150 * chips : -100 * (chips - 1), tp = timingOK ? 50 : 0;
  return { pts: Math.max(0, sp + cp + tp), shapeOK, callOK, timingOK, answered, chips, sp, cp, tp, shape, band };
}

/* ---------------------------------------------------------------- QUICK FIRE plan */
export function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function shuffle(arr, r = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function hash(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
// rounds = round ids in play order. Each round gets `per` Quick Fire questions from its own game's skills, mixed across skills.
export function plan(rounds, per, seed) {
  const r = rng(seed), used = new Set(), tags = rounds.filter(id => id.startsWith("curve:")).map(id => id.slice(6));
  const ok = q => !used.has(q.id) && !(q.cv || []).some(t => tags.includes(t));
  return rounds.map(id => {
    const tp = ROUNDS[id].tp, skills = shuffle(Object.keys(SKILLS).filter(k => SKILLS[k].tp === tp), r), pick = [];
    for (let pass = 0; pick.length < per && pass < 12; pass++) // after 6 passes, reuse questions from earlier rounds if this game's bank runs out
      skills.forEach(sk => { if (pick.length >= per) return; const q = shuffle(BANK.filter(x => x.sk === sk && !pick.includes(x.id) && (pass >= 6 ? !(x.cv || []).some(t => tags.includes(t)) : ok(x))), r)[0]; if (q) { pick.push(q.id); used.add(q.id); } });
    return { id, qs: pick };
  });
}
export function question(id, seed) { // options shuffled the same way on every device
  const q = bankById[id], order = shuffle([0, 1, 2, 3], rng(hash(id + ":" + seed)));
  return { ...q, tp: SKILLS[q.sk].tp, opts: order.map(i => q.o[i]), ans: order.indexOf(0) };
}
export const quickPts = (ok, ms, secs) => (ok ? 100 + Math.round(50 * Math.max(0, 1 - ms / (secs * 1000))) : 0);
