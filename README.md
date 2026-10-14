# The Bond Desk

A live classroom bond-investing game for Hersey Finance & Investing (Unit 3: Bonds).
Each desk (group) runs a $1,000,000 bond fund for five years on an iPad. Each year three bonds hit the market; desks read the news, compare each bond's yield to its fair yield, and choose Pass, Buy $100K, or Buy $200K. The host screen reveals what happened and explains why.

- **Projector (teacher):** `https://YOUR-SITE.vercel.app/host`
- **iPads (students):** `https://YOUR-SITE.vercel.app` (or scan the QR code on the host screen)

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
3. Click **Open Year 1**. Use the timer (default 5:00). Locked desks turn dark; answers stay hidden.
4. Click **Close the market & reveal**. Walk through **What happened** (use **Show the why** on each bond), then **Standings**, then open the next year.
5. After Year 5, the final screen shows the podium, year-by-year results, and the lessons.

**If an iPad restarts:** reopen the site, tap the rejoin link, and enter the same desk name and PIN. Nothing is lost.
**If a desk doesn't answer:** its money stays in cash (Treasuries) that year.
**To fix a desk's choices:** tap its tile on the host screen during the year, or click **Reopen this year** after a reveal.
**No Wi-Fi?** On the host start screen, choose **Play without iPads**. You add desks by hand and tap in each desk's choices.

Games expire automatically 12 hours after the last activity. Only desk names you type are stored; no student names, emails, or logins.

## The rules students play by

- Fair yield = Treasury rate + the spread for the bond's rating (AAA +0.5, AA +0.8, A +1.2, BBB +2.0, BB +3.5, B +5.5, CCC +10.0).
- Money not invested earns the Treasury rate for the year.
- A bond's return for the year = its yield + the price change from rate moves (rate sensitivity × change in rates) + any rating change (+3% / +8% up, −4% / −8% down). A default returns −60% (bondholders get back 40¢ per $1).
- Fund rule: no more than $200K in junk bonds (BB and below) in any one year, or a $25,000 fine.

All companies, governments, and outcomes are made up and engineered so every class gets the same story. Benchmarks: all-cash finishes at $1,222,474; the best picks finish around $1,341,547; buying everything at $200K finishes at $964,208.

## Files

| File | What it is |
|---|---|
| `public/game-data.js` | All five years: news, bonds, outcomes, explanations, and the scoring math. Edit this to change content. |
| `public/host.html`, `public/host.js` | Projector screen |
| `public/index.html`, `public/play.js` | iPad screen |
| `public/core.js` | Game rules on the server (codes, joining, hidden answers) |
| `api/game.js` | Vercel function that connects the game to the database |
| `dev.js` | Local test server with a temporary in-memory database: `node dev.js` |

QR codes are generated in the browser with "QRCode for JavaScript" by Kazuhiko Arase (MIT license). "QR Code" is a registered trademark of DENSO WAVE INCORPORATED.
