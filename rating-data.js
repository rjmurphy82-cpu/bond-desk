// The Rating Room: issuers, scorecard, scale and blitz questions.
// Shared by the class game (rating-room.html) and the solo practice (practice-rating-room.html).
// The official scores are recomputed from the numbers, so edit the numbers, not the scores.
window.RATING_DATA = {
 "rounds": [
  {
   "case": 1,
   "name": "Round 1",
   "mult": 1
  },
  {
   "case": 5,
   "name": "Round 2",
   "mult": 1
  },
  {
   "case": 3,
   "name": "Round 3",
   "mult": 1
  },
  {
   "case": 7,
   "name": "Round 4",
   "mult": 1
  },
  {
   "case": 6,
   "name": "Final Round",
   "mult": 2
  }
 ],
 "place_points": [
  10,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1
 ],
 "team_points": {
  "exact": 10,
  "one": 0,
  "miss": -5
 },
 "factors": [
  {
   "key": "history",
   "name": "Payment history",
   "q": "Has this borrower always paid on time?",
   "kind": "pick",
   "levels": [
    "Behind on payments right now",
    "Missed a payment in the last 5 years",
    "Paid late once in the last 10 years, then caught up",
    "Never missed, but less than 20 years of borrowing",
    "Never missed, 20+ years of borrowing"
   ],
   "short": [
    "Behind right now",
    "Missed one in last 5 yrs",
    "Late once in last 10 yrs",
    "Never missed, under 20 yrs",
    "Never missed, 20+ yrs"
   ]
  },
  {
   "key": "stability",
   "name": "Earnings stability",
   "q": "Does it make money every year, and is revenue growing?",
   "kind": "pick",
   "levels": [
    "No profit in any of the last 5 years",
    "Profit in only 1 to 3 of 5 years, OR revenue fell more than 10%",
    "Profit in 4 of 5 years, OR profit every year but revenue flat or down (10% or less)",
    "Profit every year, revenue up overall (dipped at least once)",
    "Profit every year AND revenue rose every year"
   ],
   "short": [
    "No profit any year",
    "Profit 1 to 3 yrs, or revenue down more than 10%",
    "Profit 4 of 5, or revenue flat / down 10% or less",
    "Profit every year, revenue up with a dip",
    "Profit every year, revenue up every year"
   ]
  },
  {
   "key": "debt",
   "name": "Debt load",
   "q": "How many years of earnings would it take to pay off all its debt?",
   "kind": "ratio",
   "formula": "Total debt ÷ yearly earnings",
   "unit": "years",
   "levels": [
    "6 or more (or no earnings)",
    "4.5 to under 6",
    "3 to under 4.5",
    "1.5 to under 3",
    "Under 1.5"
   ],
   "short": [
    "6 or more years",
    "4.5 to under 6",
    "3 to under 4.5",
    "1.5 to under 3",
    "Under 1.5 years"
   ]
  },
  {
   "key": "coverage",
   "name": "Interest coverage",
   "q": "How many times over can earnings pay this year's interest?",
   "kind": "ratio",
   "formula": "Yearly earnings ÷ yearly interest",
   "unit": "x",
   "levels": [
    "Under 1.5x",
    "1.5x to under 3x",
    "3x to under 5x",
    "5x to under 8x",
    "8x or more"
   ],
   "short": [
    "Under 1.5x",
    "1.5x to under 3x",
    "3x to under 5x",
    "5x to under 8x",
    "8x or more"
   ]
  },
  {
   "key": "cash",
   "name": "Cash cushion",
   "q": "Could it pay the debt that comes due in the next 12 months from cash on hand?",
   "kind": "ratio",
   "formula": "Cash on hand ÷ debt due next year",
   "unit": "x",
   "levels": [
    "Under 0.25",
    "0.25 to under 0.5",
    "0.5 to under 1",
    "1 to under 2",
    "2 or more"
   ],
   "short": [
    "Under 0.25",
    "0.25 to under 0.5",
    "0.5 to under 1",
    "1 to under 2",
    "2 or more"
   ]
  },
  {
   "key": "backing",
   "name": "Backing & outlook",
   "q": "Who stands behind the bond, and how safe is the business?",
   "kind": "pick",
   "levels": [
    "Repayment depends on one uncertain source of money",
    "Shrinking industry or heavy competition",
    "Solid, but sales rise and fall with the economy",
    "Leader in a stable, growing industry",
    "Backed by the power to tax, or an essential service people must pay for"
   ],
   "short": [
    "One uncertain money source",
    "Shrinking or heavy competition",
    "Rises and falls with economy",
    "Leader, stable industry",
    "Taxing power or essential service"
   ]
  }
 ],
 "scale": [
  [
   22,
   "AAA"
  ],
  [
   19,
   "AA"
  ],
  [
   16,
   "A"
  ],
  [
   13,
   "BBB"
  ],
  [
   10,
   "BB"
  ],
  [
   6,
   "B"
  ],
  [
   0,
   "CCC"
  ]
 ],
 "ladder": [
  "AAA",
  "AA",
  "A",
  "BBB",
  "BB",
  "B",
  "CCC"
 ],
 "years": [
  "2022",
  "2023",
  "2024",
  "2025",
  "2026"
 ],
 "cases": [
  {
   "group": 1,
   "name": "Summit Software Inc.",
   "type": "Corporate bond, 10 years",
   "what": "Makes accounting software used by 40,000 businesses.",
   "rev": [
    8200,
    9000,
    9900,
    10800,
    11900
   ],
   "earn": [
    1400,
    1550,
    1700,
    1850,
    2000
   ],
   "debt": 400,
   "interest": 20,
   "cash": 3000,
   "due": 100,
   "historyText": "Has borrowed since 1996. Never missed or been late on a payment.",
   "history": 4,
   "backingText": "Customers sign 3-year contracts. Software is a stable, growing industry, and Summit is a top-3 company in its market.",
   "backing": 3,
   "ratios": {
    "debt": 0.2,
    "coverage": 100.0,
    "cash": 30.0,
    "P": 5,
    "R": 45.1
   },
   "scores": {
    "history": 4,
    "stability": 4,
    "debt": 4,
    "coverage": 4,
    "cash": 4,
    "backing": 3
   },
   "total": 23,
   "rating": "AAA"
  },
  {
   "group": 2,
   "name": "Elm Ridge School District",
   "type": "Municipal general obligation bond, 20 years",
   "what": "Suburban K-12 district with 9 schools. Selling new bonds to build a STEM wing.",
   "rev": [
    210,
    218,
    226,
    233,
    241
   ],
   "earn": [
    22,
    24,
    26,
    28,
    30
   ],
   "debt": 95,
   "interest": 4,
   "cash": 25,
   "due": 10,
   "munis": true,
   "historyText": "Has sold bonds since 1955. Never missed or been late on a payment.",
   "history": 4,
   "backingText": "Repaid with property taxes. Bondholders are backed by the district's full power to tax.",
   "backing": 4,
   "ratios": {
    "debt": 3.17,
    "coverage": 7.5,
    "cash": 2.5,
    "P": 5,
    "R": 14.8
   },
   "scores": {
    "history": 4,
    "stability": 4,
    "debt": 2,
    "coverage": 3,
    "cash": 4,
    "backing": 4
   },
   "total": 21,
   "rating": "AA",
   "notes": [
    "District enrollment has held steady at about 7,200 students for five years.",
    "These are general obligation bonds. If money ever runs short, the district can raise its property tax levy to pay bondholders.",
    "The Elm Ridge Eagles won the conference football title last fall.",
    "Elm Ridge first sold bonds in 1955. Every payment since then has arrived on time.",
    "A new superintendent started in July."
   ],
   "why": {
    "headline": "Nearly bulletproof, but not perfect.",
    "body": "Elm Ridge earns AA because the things that matter most for a government borrower are at full strength: a 70-year clean record, a surplus that grows every year, plenty of cash, and the power to tax. It missed AAA by just one point. Its debt equals a little over 3 years of surplus, and its interest coverage of 7.5x sits just under the 8x line.",
    "f": {
     "history": [
      "Clue: bonds since 1955, every payment on time",
      "70+ years with a clean record. Full points."
     ],
     "stability": [
      "Surplus 5 of 5 years. Revenue $210M → $241M, up every year",
      "Surplus every year AND revenue rose every year."
     ],
     "debt": [
      "$95M ÷ $30M = 3.17 years",
      "Lands in the 3 to under 4.5 band. This is the factor that cost the most."
     ],
     "coverage": [
      "$30M ÷ $4M = 7.50x",
      "Strong, but just short of the 8x line for 4 points."
     ],
     "cash": [
      "$25M ÷ $10M = 2.50",
      "It could pay this year's debt from cash twice over."
     ],
     "backing": [
      "Clue: general obligation, can raise the property tax levy",
      "That is the power to tax. Full points."
     ]
    },
    "trap": "Assuming every government bond is AAA. Taxing power earns 4 points on one factor, not all six. The debt math still counts.",
    "noise": "Steady enrollment, the football title, and the new superintendent do not change any of the six factors."
   }
  },
  {
   "group": 3,
   "name": "Riverside Water Authority",
   "type": "Municipal revenue bond, 25 years",
   "what": "Supplies drinking water to 600,000 people in three counties.",
   "rev": [
    300,
    312,
    325,
    338,
    350
   ],
   "earn": [
    120,
    126,
    135,
    142,
    150
   ],
   "debt": 600,
   "interest": 25,
   "cash": 120,
   "due": 40,
   "munis": true,
   "historyText": "Has sold bonds since 1978. Never missed or been late on a payment.",
   "history": 4,
   "backingText": "Repaid from monthly water bills. Water is an essential service: people pay it even in a recession.",
   "backing": 4,
   "ratios": {
    "debt": 4.0,
    "coverage": 6.0,
    "cash": 3.0,
    "P": 5,
    "R": 16.7
   },
   "scores": {
    "history": 4,
    "stability": 4,
    "debt": 2,
    "coverage": 3,
    "cash": 4,
    "backing": 4
   },
   "total": 21,
   "rating": "AA"
  },
  {
   "group": 4,
   "name": "Prairie State Power",
   "type": "Utility corporate bond, 15 years",
   "what": "Electric company serving 2 million homes and businesses.",
   "rev": [
    4000,
    4150,
    4050,
    4300,
    4500
   ],
   "earn": [
    1000,
    1050,
    980,
    1120,
    1200
   ],
   "debt": 4200,
   "interest": 300,
   "cash": 500,
   "due": 400,
   "historyText": "Has borrowed for 60 years. Never missed or been late on a payment.",
   "history": 4,
   "backingText": "Electricity is an essential service, and prices are approved by state regulators.",
   "backing": 4,
   "ratios": {
    "debt": 3.5,
    "coverage": 4.0,
    "cash": 1.25,
    "P": 5,
    "R": 12.5
   },
   "scores": {
    "history": 4,
    "stability": 3,
    "debt": 2,
    "coverage": 2,
    "cash": 3,
    "backing": 4
   },
   "total": 18,
   "rating": "A",
   "notes": [
    "Has borrowed for 60 years. Every payment has been made in full and on time.",
    "Its CEO was named Utility Executive of the Year.",
    "Homes and businesses keep paying for electricity even in a recession, and state regulators approve its prices.",
    "A mild winter in 2024 cut how much power people used.",
    "Plans to add 300 electric-vehicle charging stations next year."
   ],
   "why": {
    "headline": "Rock-solid business, heavy borrower.",
    "body": "Prairie State Power sells something people cannot go without, has a 60-year clean record, and made a profit every year. So why only A? Utilities borrow heavily to build power plants and lines. Its debt equals 3.5 years of earnings and its earnings cover interest only 4 times, both middle-of-the-pack scores. The mild 2024 winter also dipped revenue, so stability earns 3, not 4.",
    "f": {
     "history": [
      "Clue: borrowed for 60 years, every payment on time",
      "Full points."
     ],
     "stability": [
      "Profit 5 of 5 years. Revenue dipped in 2024, +12.5% overall",
      "Profit every year, revenue up with a dip."
     ],
     "debt": [
      "$4,200M ÷ $1,200M = 3.50 years",
      "In the 3 to under 4.5 band."
     ],
     "coverage": [
      "$1,200M ÷ $300M = 4.00x",
      "In the 3x to under 5x band."
     ],
     "cash": [
      "$500M ÷ $400M = 1.25",
      "It can cover next year's debt from cash."
     ],
     "backing": [
      "Clue: essential service, prices approved by regulators",
      "An essential service people must pay for. Full points."
     ]
    },
    "trap": "Giving it 4 on stability. Revenue rose overall, but it dipped in 2024, and 4 points requires growth every single year.",
    "noise": "The CEO award and the charging stations do not change any of the six factors."
   }
  },
  {
   "group": 5,
   "name": "Heartland Freight Rail",
   "type": "Corporate bond, 10 years",
   "what": "Freight railroad hauling grain, cars, and shipping containers across 12 states.",
   "rev": [
    6200,
    5700,
    6400,
    5900,
    6000
   ],
   "earn": [
    1000,
    750,
    1050,
    820,
    900
   ],
   "debt": 3600,
   "interest": 250,
   "cash": 300,
   "due": 450,
   "historyText": "Has borrowed for 45 years. Never missed or been late on a payment.",
   "history": 4,
   "backingText": "Profitable business, but shipping volume rises and falls with the economy.",
   "backing": 2,
   "ratios": {
    "debt": 4.0,
    "coverage": 3.6,
    "cash": 0.67,
    "P": 5,
    "R": -3.2
   },
   "scores": {
    "history": 4,
    "stability": 2,
    "debt": 2,
    "coverage": 2,
    "cash": 2,
    "backing": 2
   },
   "total": 14,
   "rating": "BBB"
  },
  {
   "group": 6,
   "name": "Midwest Hotels Group",
   "type": "Corporate bond, 7 years",
   "what": "Owns 140 hotels near airports and highways.",
   "rev": [
    2600,
    1400,
    2300,
    2650,
    2800
   ],
   "earn": [
    480,
    -150,
    400,
    520,
    560
   ],
   "debt": 2500,
   "interest": 150,
   "cash": 200,
   "due": 180,
   "historyText": "Has borrowed for 25 years. Never missed or been late on a payment.",
   "history": 4,
   "backingText": "Travel booms in good times and collapses in bad times. 2023 was a bad year.",
   "backing": 2,
   "ratios": {
    "debt": 4.46,
    "coverage": 3.73,
    "cash": 1.11,
    "P": 4,
    "R": 7.7
   },
   "scores": {
    "history": 4,
    "stability": 2,
    "debt": 2,
    "coverage": 2,
    "cash": 3,
    "backing": 2
   },
   "total": 15,
   "rating": "BBB",
   "notes": [
    "Just finished renovating the lobbies at 30 of its hotels.",
    "Has sold bonds since 2001. Every payment has been made in full and on time.",
    "When the economy slows, business trips and family road trips are among the first things people cut. 2023 showed it.",
    "Guest satisfaction scores rose to 4.4 out of 5 stars this year."
   ],
   "why": {
    "headline": "Great year, shaky cycle.",
    "body": "Midwest Hotels lands at BBB, the last investment-grade category before junk. 2026 looks great: record revenue and $560M in earnings. But raters look at the whole cycle, and 2023 showed how fast this business can lose money. Two of its numbers sit right next to a line: debt load is 4.46 years (4.5 drops a point) and its cash barely covers the debt due next year.",
    "f": {
     "history": [
      "Clue: bonds since 2001, every payment on time",
      "25 years, never missed. Full points."
     ],
     "stability": [
      "Profit 4 of 5 years (lost $150M in 2023). Revenue +7.7% overall",
      "The loss year caps this at 2, even though revenue grew."
     ],
     "debt": [
      "$2,500M ÷ $560M = 4.46 years",
      "Just under the 4.5 line, so it holds on to 2 points."
     ],
     "coverage": [
      "$560M ÷ $150M = 3.73x",
      "In the 3x to under 5x band."
     ],
     "cash": [
      "$200M ÷ $180M = 1.11",
      "It can cover next year's debt from cash, barely."
     ],
     "backing": [
      "Clue: travel is cut first when the economy slows",
      "Sales rise and fall with the economy."
     ]
    },
    "trap": "Rating it off 2026 alone. A record year does not erase a loss year, and a second bad year would hit several factors at once.",
    "noise": "New lobbies and better guest ratings are nice, but neither one is on the scorecard."
   }
  },
  {
   "group": 7,
   "name": "Northgate Malls",
   "type": "Corporate bond, 7 years",
   "what": "Owns 22 indoor shopping malls.",
   "rev": [
    1700,
    1620,
    1540,
    1470,
    1390
   ],
   "earn": [
    760,
    700,
    650,
    600,
    550
   ],
   "debt": 3000,
   "interest": 240,
   "cash": 155,
   "due": 300,
   "historyText": "Has borrowed for 30 years. Never missed or been late on a payment.",
   "history": 4,
   "backingText": "Shoppers keep moving online. Six stores closed in its malls last year.",
   "backing": 1,
   "ratios": {
    "debt": 5.45,
    "coverage": 2.29,
    "cash": 0.52,
    "P": 5,
    "R": -18.2
   },
   "scores": {
    "history": 4,
    "stability": 1,
    "debt": 1,
    "coverage": 1,
    "cash": 2,
    "backing": 1
   },
   "total": 10,
   "rating": "BB",
   "notes": [
    "Has borrowed for 30 years and has never missed or been late on a payment.",
    "Its largest mall just added a trampoline park and an escape room.",
    "Shoppers keep moving online. Six anchor department stores in its malls closed last year.",
    "Paid its shareholders a dividend every quarter this year."
   ],
   "why": {
    "headline": "Profitable today, shrinking every year.",
    "body": "Northgate has never missed a payment and makes a profit every year, which is exactly why it fools people. Ratings look forward, not backward. Revenue has dropped every single year, its debt equals more than 5 years of earnings, and it has only about half the cash it needs for next year's payments. That adds up to high-yield (junk) territory.",
    "f": {
     "history": [
      "Clue: 30 years, never missed or late",
      "A perfect record. Full points, and still junk."
     ],
     "stability": [
      "Profit 5 of 5 years. Revenue $1,700M → $1,390M = −18.2%",
      "Revenue fell more than 10%, so only 1 point."
     ],
     "debt": [
      "$3,000M ÷ $550M = 5.45 years",
      "In the 4.5 to under 6 band."
     ],
     "coverage": [
      "$550M ÷ $240M = 2.29x",
      "In the 1.5x to under 3x band."
     ],
     "cash": [
      "$155M ÷ $300M = 0.52",
      "Just over the 0.5 line. It has about half of what comes due."
     ],
     "backing": [
      "Clue: shoppers moving online, anchor stores closing",
      "A shrinking industry."
     ]
    },
    "trap": "A perfect payment record plus a dividend feels safe. But the dividend sends cash to shareholders that could have paid down debt.",
    "noise": "The trampoline park and escape room do not change the trend in the numbers."
   }
  },
  {
   "group": 8,
   "name": "Blaze Energy Drinks",
   "type": "Corporate bond, 5 years",
   "what": "Fast-growing energy drink brand sold in gas stations and grocery stores.",
   "rev": [
    40,
    85,
    160,
    310,
    600
   ],
   "earn": [
    -30,
    -20,
    -5,
    60,
    150
   ],
   "debt": 920,
   "interest": 95,
   "cash": 120,
   "due": 100,
   "historyText": "First borrowed 4 years ago. Never missed a payment.",
   "history": 3,
   "backingText": "Crowded market: dozens of brands fight for the same cooler space.",
   "backing": 1,
   "ratios": {
    "debt": 6.13,
    "coverage": 1.58,
    "cash": 1.2,
    "P": 2,
    "R": 1400.0
   },
   "scores": {
    "history": 3,
    "stability": 1,
    "debt": 0,
    "coverage": 1,
    "cash": 3,
    "backing": 1
   },
   "total": 9,
   "rating": "B",
   "notes": [
    "Revenue has grown 15 times over in five years.",
    "Signed a famous NBA player to a 3-year endorsement deal.",
    "First sold bonds 4 years ago. Has never missed a payment.",
    "Dozens of brands fight for the same cooler space, and new ones launch every month.",
    "Its drinks have 1.6 million followers on social media."
   ],
   "why": {
    "headline": "Hot brand, thin cushion.",
    "body": "Blaze is the fastest-growing company in the room, which is exactly why it fools people. Growth is not the same as safety. It lost money in three of the last five years, its debt equals more than 6 years of current earnings, and its earnings cover interest only about 1.6 times. One bad year in a crowded market and it could struggle to pay. Its one bright spot is cash on hand.",
    "f": {
     "history": [
      "Clue: first borrowed 4 years ago, never missed",
      "Clean record, but under 20 years of borrowing = 3."
     ],
     "stability": [
      "Profit 2 of 5 years (losses 2022 to 2024). Revenue +1,400%",
      "Profit in only 1 to 3 years caps this at 1, no matter how fast revenue grew."
     ],
     "debt": [
      "$920M ÷ $150M = 6.13 years",
      "6 or more years = 0 points."
     ],
     "coverage": [
      "$150M ÷ $95M = 1.58x",
      "Barely over the 1.5x line."
     ],
     "cash": [
      "$120M ÷ $100M = 1.20",
      "Enough cash to cover next year's debt. Its strongest number."
     ],
     "backing": [
      "Clue: dozens of brands fight for cooler space",
      "Heavy competition."
     ]
    },
    "trap": "Rewarding growth. A 1,400% revenue jump feels safe, but raters care about profits and debt, and Blaze only turned a profit two years ago.",
    "noise": "The NBA endorsement and the social media following do not appear anywhere on the scorecard."
   }
  },
  {
   "group": 9,
   "name": "Tri-County Stadium Authority",
   "type": "Municipal revenue bond, 20 years",
   "what": "Owns the stadium for a minor-league team. Bonds are repaid from tickets and parking.",
   "rev": [
    80,
    76,
    70,
    64,
    60
   ],
   "earn": [
    12,
    -3,
    5,
    -6,
    8
   ],
   "debt": 400,
   "interest": 32,
   "cash": 6,
   "due": 30,
   "munis": true,
   "historyText": "Missed an interest payment last year and paid it 3 months late.",
   "history": 1,
   "backingText": "The team announced it may move to another city. If it leaves, ticket and parking money disappears.",
   "backing": 0,
   "ratios": {
    "debt": 50.0,
    "coverage": 0.25,
    "cash": 0.2,
    "P": 3,
    "R": -25.0
   },
   "scores": {
    "history": 1,
    "stability": 1,
    "debt": 0,
    "coverage": 0,
    "cash": 0,
    "backing": 0
   },
   "total": 2,
   "rating": "CCC"
  }
 ],
 "example": {
  "group": 0,
  "name": "Prairie Rail Co.",
  "type": "Corporate bond, 10 years",
  "what": "Freight railroad (worked example).",
  "rev": [
   5000,
   5300,
   4900,
   5400,
   5600
  ],
  "earn": [
   700,
   760,
   640,
   780,
   800
  ],
  "debt": 3400,
  "interest": 260,
  "cash": 250,
  "due": 400,
  "historyText": "Has borrowed for 40 years. Never missed or been late on a payment.",
  "history": 4,
  "backingText": "Profitable for decades, but profits drop when the economy slows.",
  "backing": 2,
  "ratios": {
   "debt": 4.25,
   "coverage": 3.08,
   "cash": 0.62,
   "P": 5,
   "R": 12.0
  },
  "scores": {
   "history": 4,
   "stability": 3,
   "debt": 2,
   "coverage": 2,
   "cash": 2,
   "backing": 2
  },
  "total": 15,
  "rating": "BBB"
 },
 "blitz": [
  {
   "q": "Earnings: $800 million. Yearly interest: $100 million. What is the interest coverage?",
   "o": [
    "0.125x",
    "8.0x",
    "700x",
    "80x"
   ],
   "a": 1,
   "why": "$800M ÷ $100M = 8.0x. That scores the full 4 points."
  },
  {
   "q": "Total debt: $1,200 million. Yearly earnings: $300 million. What is the debt load?",
   "o": [
    "4.0 years",
    "0.25 years",
    "900 years",
    "3.6 years"
   ],
   "a": 0,
   "why": "$1,200M ÷ $300M = 4.0 years of earnings. That scores 2 points."
  },
  {
   "q": "A scorecard adds up to 17 points. What rating is that?",
   "o": [
    "AA",
    "BBB",
    "A",
    "BB"
   ],
   "a": 2,
   "why": "16 to 18 points = A."
  },
  {
   "q": "A scorecard adds up to 12 points. Investment grade or junk?",
   "o": [
    "Investment grade",
    "Junk"
   ],
   "a": 1,
   "why": "12 points = BB. Junk starts at BB."
  },
  {
   "q": "A city's bonds are repaid with property taxes. What does it score for Backing & outlook?",
   "o": [
    "4",
    "3",
    "2",
    "0"
   ],
   "a": 0,
   "why": "Backed by the power to tax = 4."
  },
  {
   "q": "Cash on hand: $50 million. Debt due next year: $200 million. What does the cash cushion score?",
   "o": [
    "4",
    "3",
    "2",
    "1"
   ],
   "a": 3,
   "why": "$50M ÷ $200M = 0.25. 0.25 to under 0.5 scores 1."
  },
  {
   "q": "Which is the BIGGEST red flag for a bond rater?",
   "o": [
    "Revenue grew 5% last year",
    "It missed an interest payment last year",
    "It hired a new CEO",
    "It paid a dividend"
   ],
   "a": 1,
   "why": "A missed payment is the clearest warning sign there is."
  },
  {
   "q": "Company A covers its interest 12 times. Company B covers it 1.4 times. Everything else is the same. Who gets the higher rating?",
   "o": [
    "Company A",
    "Company B",
    "They tie"
   ],
   "a": 0,
   "why": "12x scores 4; 1.4x scores 0. A is far safer."
  },
  {
   "q": "An airline's sales rise and fall with the economy. What does it score for Backing & outlook?",
   "o": [
    "4",
    "3",
    "2",
    "1"
   ],
   "a": 2,
   "why": "Cyclical = 2."
  },
  {
   "q": "Profit every year for 5 years, and revenue rose every single year. Earnings stability score?",
   "o": [
    "4",
    "3",
    "2",
    "1"
   ],
   "a": 0,
   "why": "Profit every year AND revenue up every year = 4."
  },
  {
   "q": "A company is cut from BBB- to BB+. What just happened?",
   "o": [
    "Nothing important",
    "It fell from investment grade to junk, so borrowing costs jump",
    "It became a government bond",
    "Its bonds now pay less interest"
   ],
   "a": 1,
   "why": "BBB- is the last step of investment grade. One notch down = junk."
  },
  {
   "q": "DOUBLE POINTS. A scorecard adds up to 23 points. What rating?",
   "o": [
    "AA",
    "AAA",
    "A",
    "BBB"
   ],
   "a": 1,
   "why": "22 to 24 points = AAA, the top of the ladder.",
   "double": true
  }
 ]
};
