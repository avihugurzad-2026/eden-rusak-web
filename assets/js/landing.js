/* Eden Rusak — landing page renderer. Renders landing.html by ?id=<key>.
   Long-form sales structure, inspired by a webinar landing reference,
   in the site's own colors & design language. */
(function () {
  "use strict";
  var DATA = window.EDEN_LANDINGS || {};
  var COMMON = window.EDEN_LANDING_COMMON || { stats: [], steps: [], testimonials: [] };
  var root = document.getElementById("landingContent");
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var key = params.get("id");
  var d = DATA[key] || DATA[Object.keys(DATA)[0]];
  if (!d) return;

  document.title = d.title + " — עדן רוסק";
  var accentTile = d.accent === "pink" ? "tile-pink" : "tile-blue";

  function li(arr) { return arr.map(function (x) { return "<li>" + x + "</li>"; }).join(""); }
  function esc(s) { return String(s); }

  var priceHTML = "";
  if (d.price) {
    priceHTML = '<div class="landing-price">' + d.price +
      (d.oldPrice ? ' <span class="old">' + d.oldPrice + "</span>" : "") + "</div>";
  }
  var dateHTML = d.dateNote ? '<p class="landing-date">' + d.dateNote + "</p>" : "";

  var ctaAttr = d.ctaUrl.indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : "";
  function ctaBtn(extraClass) {
    return '<a class="btn btn-primary btn-lg ' + (extraClass || "") + '" href="' +
      d.ctaUrl + '"' + ctaAttr + ">" + d.ctaText + "</a>";
  }

  /* ---------- benefits (whatYouGet → feature cards) ---------- */
  var benefitIcons = [
    'M20 6L9 17l-5-5',                       /* check */
    'M13 2L3 14h7l-1 8 10-12h-7l1-8z',       /* bolt */
    'M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6L12 2z', /* star */
    'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.4 8.4 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8v.5z', /* chat */
    'M22 11.08V12a10 10 0 1 1-5.93-9.14',    /* check-circle */
    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 5v5l3 3' /* clock */
  ];
  var benefitCards = d.whatYouGet.map(function (b, i) {
    var p = benefitIcons[i % benefitIcons.length];
    return '<div class="benefit-card reveal">' +
      '<span class="benefit-ico"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg></span>' +
      "<p>" + b + "</p></div>";
  }).join("");

  /* ---------- steps strip ---------- */
  var stepsHTML = COMMON.steps.map(function (s, i) {
    return '<div class="step-card reveal"><span class="step-num">' + (i + 1) + "</span>" +
      '<h3 class="h3">' + s.t + "</h3><p>" + s.d + "</p></div>";
  }).join("");

  /* ---------- stats strip ---------- */
  var statsHTML = COMMON.stats.map(function (s) {
    return '<div class="stat-item"><span class="stat-num">' + s.num + "</span>" +
      '<span class="stat-label">' + s.label + "</span></div>";
  }).join("");

  /* ---------- curriculum ---------- */
  var curriculum = d.curriculum.map(function (m, i) {
    var n = (i + 1 < 10 ? "0" : "") + (i + 1);
    return '<div class="card reveal"><div class="card-num">' + n + '</div><h3 class="h3">' +
      m.t + "</h3><p>" + m.d + "</p></div>";
  }).join("");

  /* ---------- testimonials ---------- */
  var testimonialHTML = COMMON.testimonials.map(function (t) {
    var initial = (t.name || "").trim().charAt(0);
    return '<figure class="testimonial reveal">' +
      '<div class="testimonial-stars" aria-hidden="true">★★★★★</div>' +
      '<blockquote>' + t.text + "</blockquote>" +
      '<figcaption><span class="t-avatar">' + initial + "</span>" +
      '<span class="t-meta"><strong>' + t.name + "</strong><span>" + t.role + "</span></span></figcaption>" +
      "</figure>";
  }).join("");

  /* ---------- FAQ (kept from original) ---------- */
  var faqHTML = "";
  if (d.faq && d.faq.length) {
    faqHTML =
      '<section class="section tile-light"><div class="wrap wrap-text">' +
      '<div class="center"><h2 class="h2">שאלות ותשובות</h2>' +
      '<p class="lead" style="margin-top:14px">כל מה שחשוב לדעת לפני שמתחילים</p></div>' +
      '<div class="landing-faq">' +
      d.faq.map(function (f) {
        return '<details class="faq-item"><summary>' + f.q + "</summary><p>" + f.a + "</p></details>";
      }).join("") +
      "</div></div></section>";
  }

  /* mid-page CTA band */
  function ctaBand() {
    return '<section class="section ' + accentTile + ' center landing-cta-band">' +
      '<div class="wrap wrap-text">' +
      '<h2 class="h2">' + (d.price && d.price !== "ללא עלות" ? "מוכנה להתחיל?" : "רוצה פרטים נוספים?") + "</h2>" +
      '<p class="lead" style="margin:16px auto 24px">' + d.tagline + "</p>" +
      (priceHTML ? priceHTML : "") + dateHTML +
      '<div class="btn-row" style="justify-content:center;margin-top:24px">' + ctaBtn() +
      '<a class="btn btn-ghost" href="#enroll">השארת פרטים</a></div>' +
      "</div></section>";
  }

  root.innerHTML =
    /* ===== hero ===== */
    '<section class="' + accentTile + ' page-hero landing-hero">' +
      '<div class="wrap landing-hero-grid">' +
        '<div class="landing-hero-text">' +
          '<span class="landing-badge">' + d.kind + "</span>" +
          '<h1 class="display">' + d.title + "</h1>" +
          '<p class="lead">' + d.tagline + "</p>" +
          priceHTML + dateHTML +
          '<div class="btn-row" style="margin-top:28px">' + ctaBtn() +
          '<a class="btn btn-ghost" href="#enroll">השארת פרטים</a></div>' +
        "</div>" +
        '<div class="landing-hero-media"><img src="' + d.image + '" alt="' + esc(d.title) + '"></div>' +
      "</div>" +
    "</section>" +

    /* ===== benefits ===== */
    '<section class="section tile-light"><div class="wrap"><div class="center">' +
      '<span class="eyebrow">למה כדאי</span>' +
      '<h2 class="h2">מה תקבלי</h2></div>' +
      '<div class="benefit-grid">' + benefitCards + "</div></div></section>" +

    /* ===== intro + image split ===== */
    '<section class="section tile-parchment"><div class="wrap"><div class="split reveal">' +
      '<div class="split-media"><img src="' + d.image + '" alt="' + esc(d.title) + '"></div>' +
      '<div><span class="eyebrow">קצת רקע</span>' +
      '<h2 class="h2">מה מחכה לך</h2><p class="lead" style="margin-top:16px">' + d.intro + "</p>" +
      '<ul class="check-list" style="margin-top:22px">' + li(d.whatYouGet) + "</ul>" +
      '<div class="btn-row" style="margin-top:26px">' + ctaBtn() + "</div></div>" +
    "</div></div></section>" +

    /* ===== stats strip ===== */
    '<section class="section tile-dark landing-stats"><div class="wrap">' +
      '<div class="stats-grid">' + statsHTML + "</div></div></section>" +

    /* ===== curriculum ===== */
    '<section class="section tile-light"><div class="wrap"><div class="center">' +
      '<span class="eyebrow">תכנית</span>' +
      '<h2 class="h2">מה לומדים</h2></div>' +
      '<div class="cards cards-centered">' + curriculum + "</div></div></section>" +

    /* ===== mid CTA band ===== */
    ctaBand() +

    /* ===== steps ===== */
    '<section class="section tile-light"><div class="wrap"><div class="center">' +
      '<span class="eyebrow">איך זה עובד</span>' +
      '<h2 class="h2">שלושה צעדים פשוטים</h2></div>' +
      '<div class="steps-grid">' + stepsHTML + "</div></div></section>" +

    /* ===== for who ===== */
    '<section class="section tile-blue"><div class="wrap"><div class="split reverse reveal">' +
      '<div class="split-media"><img src="assets/images/edenphoto11.jpeg" alt="למי זה מתאים"></div>' +
      '<div><span class="eyebrow" style="color:rgba(255,255,255,.7)">בדיוק בשבילך</span>' +
      '<h2 class="display" style="font-size:clamp(34px,5vw,58px)">למי זה מתאים</h2>' +
      '<ul class="check-list" style="margin-top:22px">' + li(d.forWho) + "</ul></div>" +
    "</div></div></section>" +

    /* ===== testimonials ===== */
    '<section class="section tile-parchment"><div class="wrap"><div class="center">' +
      '<span class="eyebrow">ממליצות</span>' +
      '<h2 class="h2">מה אומרות עליי</h2></div>' +
      '<div class="testimonial-grid">' + testimonialHTML + "</div></div></section>" +

    /* ===== FAQ (kept) ===== */
    faqHTML;

  /* wire the static CTA button + headline in #enroll */
  var ctaBtnEl = document.getElementById("landingCtaBtn");
  if (ctaBtnEl) {
    ctaBtnEl.textContent = d.ctaText;
    ctaBtnEl.setAttribute("href", d.ctaUrl);
    if (d.ctaUrl.indexOf("http") === 0) { ctaBtnEl.setAttribute("target", "_blank"); ctaBtnEl.setAttribute("rel", "noopener"); }
  }
  var ctaHead = document.getElementById("landingCtaHead");
  if (ctaHead) { ctaHead.textContent = "רוצה לשמוע עוד על " + d.title + "?"; }
})();
