# District 214 Finance & Investing

The class site for Finance & Investing: a home page, live class games, review games, and practice-on-your-own pages, in the same look as the District 214 Accounting site.

| Page | Who | What |
|---|---|---|
| `/` | Students | Home page with every game and practice |
| `/credit` | Students | Join Credit Desk Live (the host QR code goes here) |
| `/credit-host` | Teacher (projector) | Credit Desk Live host screen: groups rate each borrower on iPads, then buy; you run the reveal. Uses the same database as The Bond Desk. |
| `/join` | Students | Join a live Bond Desk game (the host QR code goes here) |
| `/practice-credit-desk` | Students | The Credit Desk: The Rating Room and The Bond Desk combined. Six years: rate the borrower with the scorecard, use that rating to find the fair yield and decide how much to buy, then see the agency's rating change and the rate move. Pairs with the Credit Desk Analyst Worksheet. |
| `/practice-bond-desk` | Students | Bond Desk Solo: all ten years on your own, with the why after each year. Progress saves in the browser. |
| `/practice-rating-room` | Students | Rating Room Practice: the 5 class case files, 4 bonus case files, unlimited random issuers, and a 12-question quiz |
| `/practice-fair-yield-sprint` | Students | Fair Yield Sprint: price random bonds as good deal, fair or overpriced in 60 seconds, or with no clock |
| `/practice-bond-terms` | Students | Bond Terms: 36 terms from both games as flashcards, a quiz and a word list. Missed terms get starred. |
| `/practice-bond-short-answer` | Students | Short Answer: 14 questions from both games. Students write, then self-check against a model answer and key points. |
| `/my-report` | Students | My Report: everything they finished on the practice pages, sent to the teacher dashboard with name and period |
| `/rating-room` | Teacher (projector) | The Rating Room class game |
| `/host` | Teacher (projector) | Bond Desk host screen |
| `/teacher` | Teacher | Links to both class games. Not linked from the student site. |
| `/teacher/reports` | Teacher | Student reports by period, with each student's short answers and a CSV download. Needs the teacher code. |

**Site address:** https://214-investing.vercel.app (the old https://bond-desk-gamma.vercel.app address still works too).

## Student reports: one-time setup

The reports use the same Upstash database as The Bond Desk. The dashboard is protected by a teacher code that only lives in Vercel (the GitHub repo is public, so the code is never in the files).

1. In Vercel, open the project, then **Settings → Environment Variables**.
2. Add a variable named `TEACHER_CODE`. For the value, type a code only you know. Save.
3. Go to **Deployments**, open the **⋯** menu on the newest deployment, and click **Redeploy**.
4. Open `/teacher/reports` and enter your code.

Reports are kept for 180 days (up to 3,000). Students type first name and last initial, plus their period. Use **Clear all reports** at the end of a unit, after downloading the CSV if you want a copy.

Old links and QR codes that point at `/?c=12345` still work: the home page forwards them to `/join`.

# The Bond Desk

A live classroom bond-investing game for Hersey Finance & Investing (Unit 3: Bonds).
Each desk (group) runs a $1,000,000 bond fund for ten years on an iPad. Each year three bonds hit the market; desks read the news, compare each bond's yield to its fair yield, and choose Pass, Buy $100K, or Buy $200K. The host screen reveals what happened and explains why.

The game gets harder as it goes. **Rookie Desk** (Years 1–2) shows each bond's fair yield and rate sensitivity. **Analyst** (Years 3–5) drops the fair yield. **Senior Analyst** (Years 6–8) drops the rate-sensitivity hint and adds more noise. **Portfolio Manager** (Years 9–10) uses quiet clues that take two headlines, or memory of an earlier year, to read.

- **Projector (teacher):** `https://214-investing.vercel.app/host`
- **iPads (students):** `https://214-investing.vercel.app/join` (or scan the QR code on the host screen)

## One-time setup (about 10 minutes)

1. **Import the repo into Vercel.** In Vercel, click **Add New → Project**, pick the `bond-desk` GitHub repo, leave every setting as is, and click **Deploy**.
2. **Add the free database.** In the new project, open the **Storage** tab, choose **Upstash** (listed as "Upstash for Redis" in the Marketplace), and create a free database. When it asks, connect it to the `bond-desk` project. Vercel adds the connection settings for you.
3. **Redeploy once.** Go to **Deployments**, open the menu (⋯) on the latest one, and click **Redeploy**, so the site picks up the database settings.
4. **Test it.** Open `/host` on your laptop and click **Start a new game**. Join from your phone with the QR code. If the host screen says the database isn't connected, step 2 or 3 didn't take.
5. **Check the district filter.** Open the student link on one student iPad a day before you play.

After that, any change pushed to GitHub goes live automatically.

## Running a game

1. Open `/host` and click **Start a new game**. A 5-digit code and QR code appear.
2. One iPad per desk: scan the QR code (or go to the site and type the code), then pick a desk name. Each desk gets a 3-digit PIN; have them write it down.
3. Click **Open Year 1**. Use the timer (default 5:00). Locked desks turn dark; answers stay hidden. iPads show how many desks are still deciding.
4. When every desk is locked, click **Everyone's in: reveal**. (If an iPad dies, use **Reveal anyway**.) The iPads switch to "Eyes on the board" and show only the desk's own picks.
5. Walk through **What happened**. Each bond shows the interest it paid, its secondary-market price at year end, a price check (good deal, fair price, or overpriced), and a one-line reason.
6. Click **Standings**. Only now do the iPads show each desk's results. Then open the next year.
7. After Year 10, the final screen shows the podium, year-by-year results, where each desk's money came from (interest vs. secondary-market gains and losses), and the lessons.

**If an iPad restarts:** reopen the site, tap the rejoin link, and enter the same desk name and PIN. Nothing is lost.
**If a desk doesn't answer:** its money stays in cash (Treasuries) that year.
**To fix a desk's choices:** tap its tile on the host screen during the year, or click **Reopen this year** after a reveal.
**No Wi-Fi?** On the host start screen, choose **Play without iPads**. You add desks by hand and tap in each desk's choices.

Games expire automatically 12 hours after the last activity. Only desk names you type are stored; no student names, emails, or logins.

## The rules students play by

- Fair yield = Treasury rate + the spread for the bond's rating (AAA +0.5, AA +0.8, A +1.2, BBB +2.0, BB +3.5, B +5.5, CCC +10.0).
- Money not invested earns the Treasury rate for the year.
- Each bond pays its yield as interest (the coupon). At year end, desks sell every bond on the secondary market. Its price per $100 moves with rates (rate sensitivity × change in rates) and with any rating change (+3% / +8% up, −4% / −8% down). A default pays no interest and sells for $40 per $100.
- Return for the year = interest collected + secondary-market price change.
- Fund rule: no more than $200K in junk bonds (BB and below) in any one year, or a $25,000 fine.

All companies, governments, and outcomes are made up and engineered so every class gets the same story. Benchmarks over ten years: all-cash finishes at $1,501,628; the best picks finish around $1,754,283; buying everything at $200K finishes at $949,785.

## Files

| File | What it is |
|---|---|
| `game-data.js` | All ten years: news, bonds, outcomes, difficulty levels, explanations, and the scoring math. Edit this to change content. |
| `host.html`, `host.js` | Projector screen |
| `join.html`, `play.js` | iPad screen |
| `core.js` | Game rules on the server (codes, joining, hidden answers) |
| `api/game.js` | Vercel function that connects the game to the database |
| `index.html` | Home page |
| `site.css`, `site.js` | Shared look, sidebar menu and text-size control for the home and practice pages. Add new pages to the menu in `site.js`. |
| `rating-room.html`, `rating-data.js` | The Rating Room class game and its case files, scorecard and blitz questions (shared with the practice page) |
| `credit-core.js`, `api/credit.js`, `credit-host.*`, `credit.html`, `credit-play.js`, `credit-view.js`, `credit-client.js` | Credit Desk Live: server rules, Vercel function, projector screen, iPad screen, shared pieces |
| `credit-desk-data.js` | The Credit Desk's six issuers, their true ratings (computed by the scorecard), and the scoring math |
| `practice-*.html` | Practice-on-your-own pages. Terms and short answer questions are listed at the top of the script in their pages. |
| `teacher/index.html`, `teacher/reports.html` | Teacher links and the student report dashboard |
| `my-report.html`, `api/report.js` | Student report page and the function that stores reports |
| `bond-short-answer-data.js` | The 14 short answer questions (shared by the Short Answer page, My Report and the dashboard) |
| `dev.js` | Local test server with a temporary in-memory database: `node dev.js` |

QR codes are generated in the browser with "QRCode for JavaScript" by Kazuhiko Arase (MIT license). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
