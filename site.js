// District 214 Finance & Investing: sidebar, mobile menu and text size, shared by every page that uses site.css.
// To add a page to the menu, add it to NAV below. The page's <body data-page="..."> marks it as current.
(function () {
  var NAV = [
    { group: "Live Class Games" },
    { href: "/join", ch: "3", label: "Bond Desk Live", page: "join" },
    { group: "Review Games" },
    { href: "/rating-room", ch: "3", label: "The Rating Room", page: "rating-room" },
    { group: "Practice On Your Own" },
    { sub: "Unit 3: Bonds" },
    { href: "/practice-bond-desk", ch: "3", label: "Bond Desk Solo", page: "practice-bond-desk" },
    { href: "/practice-rating-room", ch: "3", label: "Rating Room Practice", page: "practice-rating-room" },
    { href: "/practice-fair-yield-sprint", ch: "3", label: "Fair Yield Sprint", page: "practice-fair-yield-sprint" },
    { href: "/practice-bond-terms", ch: "3", label: "Bond Terms", page: "practice-bond-terms" },
    { href: "/practice-bond-short-answer", ch: "3", label: "Short Answer", page: "practice-bond-short-answer" }
  ];
  var cur = document.body.getAttribute("data-page") || "";
  var links = NAV.map(function (n) {
    if (n.group) return '<div class="ng">' + n.group + "</div>";
    if (n.sub) return '<div class="nch">' + n.sub + "</div>";
    return '<a href="' + n.href + '"' + (n.page === cur ? ' aria-current="page"' : "") + '><span class="ch">' + n.ch + "</span>" + n.label + "</a>";
  }).join("");
  var shell = document.querySelector(".shell");
  if (shell) {
    shell.insertAdjacentHTML("afterbegin",
      '<div class="mbar"><a href="/"><img src="/logo-214.png" alt="High School District 214"></a><button id="menuBtn" aria-expanded="false" aria-controls="side">Menu</button></div>' +
      '<aside class="side" id="side"><a class="brandlink" href="/"><img src="/logo-214.png" alt="High School District 214"></a>' +
      '<div class="sitename">Finance &amp; Investing</div><nav aria-label="Site"><a class="home" href="/"' + (cur === "home" ? ' aria-current="page"' : "") + '><span class="ch">⌂</span>Home</a>' + links + "</nav>" +
      '<div class="sidefoot">High School District 214 | Finance &amp; Investing</div></aside><div class="scrim" id="scrim"></div>');
    var s = document.getElementById("side"), b = document.getElementById("menuBtn"), c = document.getElementById("scrim");
    var set = function (o) { s.classList.toggle("open", o); c.classList.toggle("on", o); b.setAttribute("aria-expanded", o); b.textContent = o ? "Close" : "Menu"; };
    b.addEventListener("click", function () { set(!s.classList.contains("open")); });
    c.addEventListener("click", function () { set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  }
  // Text size: scales the main content, remembered across pages
  document.body.insertAdjacentHTML("beforeend",
    '<div id="tsz" role="group" aria-label="Text size"><button type="button" data-d="-1" aria-label="Smaller text">A−</button><button type="button" data-d="0" class="pct" aria-label="Reset text size">100%</button><button type="button" data-d="1" class="big" aria-label="Bigger text">A+</button></div>');
  var STEPS = [0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2], KEY = "d214-fin-text-size", box = document.getElementById("tsz");
  var target = document.querySelector("main") || document.body, i = 2;
  try { var j = STEPS.indexOf(parseFloat(localStorage.getItem(KEY))); if (j >= 0) i = j; } catch (e) {}
  function apply() {
    var z = STEPS[i]; target.style.zoom = z;
    box.children[1].textContent = Math.round(z * 100) + "%";
    box.children[0].disabled = i === 0; box.children[2].disabled = i === STEPS.length - 1;
    try { localStorage.setItem(KEY, z); } catch (e) {}
  }
  box.addEventListener("click", function (e) { var t = e.target.closest("button"); if (!t) return; var d = +t.dataset.d; i = d === 0 ? 2 : Math.max(0, Math.min(STEPS.length - 1, i + d)); apply(); t.blur(); });
  apply();
})();
