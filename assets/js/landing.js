/* Eden Rusak — landing page renderer. Renders landing.html by ?id=<key>.
   Premium one-background structure (ronizaken.com reference): unified white
   page, big editorial typography, hero → features → curriculum → about →
   process → for-who → testimonials → FAQ → lead form. Site colors only. */
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

  /* optional: strip the global header/nav on focused landing pages (e.g. UGC) */
  if (d.hideHeader) {
    var navEl = document.querySelector(".global-nav");
    if (navEl) navEl.parentNode.removeChild(navEl);
    document.body.classList.add("lp-no-header");
  }

  /* accent → primary button colour (pink accent uses the pink button) */
  var accentBtn = d.accent === "blue" ? "btn-primary" : "btn-pink";
  var WA_NUMBER = "972552629091";

  /* optional: route the primary CTAs straight to a prefilled whatsapp chat */
  if (d.ctaWhatsapp) {
    d.ctaUrl = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(d.ctaWhatsapp);
  }

  /* optional: lead-form behaviour (auto-email + whatsapp handoff) read by main.js */
  if (d.leadEmail) {
    window.EDEN_LEAD = {
      email: d.leadEmail,
      waNumber: WA_NUMBER,
      waMessage: d.leadWaMessage || "היי, אשמח לקבל פרטים נוספים",
      delayMs: 4000,
      page: d.title
    };
  }

  /* eyebrow kicker — hidden on de-cluttered pages */
  function eb(text) { return d.hideEyebrows ? "" : '<span class="eyebrow">' + text + "</span>"; }
  /* bold the opening clause up to the first colon, then drop to a new line */
  function boldLead(s) {
    var i = s.indexOf(":");
    if (i === -1) { return s; }
    return "<strong>" + s.slice(0, i + 1) + "</strong><br>" + s.slice(i + 1).replace(/^\s+/, "");
  }

  function li(arr) { return arr.map(function (x) { return "<li>" + boldLead(x) + "</li>"; }).join(""); }
  function esc(s) { return String(s); }

  var priceHTML = "";
  if (d.price) {
    priceHTML = '<div class="landing-price">' + d.price +
      (d.oldPrice ? ' <span class="old">' + d.oldPrice + "</span>" : "") + "</div>";
  }
  var dateHTML = d.dateNote ? '<p class="landing-date">' + d.dateNote + "</p>" : "";

  var ctaAttr = d.ctaUrl.indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : "";
  var ctaSecondaryText = d.ctaSecondaryText || "השארת פרטים";
  function ctaBtn(extraClass) {
    return '<a class="btn ' + accentBtn + ' btn-lg ' + (extraClass || "") + '" href="' +
      d.ctaUrl + '"' + ctaAttr + ">" + d.ctaText + "</a>";
  }

  /* small decorative sparkle (site pink/blue) */
  function spark(cls, style) {
    return '<span class="lp-spark ' + (cls || "") + '" style="' + style + '" aria-hidden="true"></span>';
  }

  /* ---------- features (whatYouGet → icon rows) ---------- */
  var featureIcons = [
    'M20 6L9 17l-5-5',                       /* check */
    'M13 2L3 14h7l-1 8 10-12h-7l1-8z',       /* bolt */
    'M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6L5.7 21 8 14 2 9.4h7.6L12 2z', /* star */
    'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.4 8.4 0 0 1 12.5 3H13a8.5 8.5 0 0 1 8 8v.5z', /* chat */
    'M22 11.08V12a10 10 0 1 1-5.93-9.14',    /* check-circle */
    'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 5v5l3 3' /* clock */
  ];
  var featuresHTML = d.whatYouGet.map(function (b, i) {
    var p = featureIcons[i % featureIcons.length];
    return '<div class="lp-feature reveal">' +
      '<span class="lp-feature-ico"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg></span>' +
      "<p>" + boldLead(b) + "</p></div>";
  }).join("");

  /* ---------- curriculum (numbered cards grid) ---------- */
  var curriculum = d.curriculum.map(function (m, i) {
    var n = (i + 1 < 10 ? "0" : "") + (i + 1);
    return '<div class="card reveal"><div class="card-num">' + n + '</div><h3 class="h3">' +
      m.t + "</h3><p>" + m.d + "</p></div>";
  }).join("");

  /* ---------- process steps ---------- */
  var stepsHTML = COMMON.steps.map(function (s, i) {
    return '<div class="step-card reveal"><span class="step-num">' + (i + 1) + "</span>" +
      '<h3 class="h3">' + s.t + "</h3><p>" + s.d + "</p></div>";
  }).join("");

  /* ---------- stats (quiet trust strip, white) ---------- */
  var statsHTML = COMMON.stats.map(function (s) {
    return '<div class="lp-stat"><span class="lp-stat-num">' + s.num + "</span>" +
      '<span class="lp-stat-label">' + s.label + "</span></div>";
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

  /* ---------- FAQ ---------- */
  var faqHTML = "";
  if (d.faq && d.faq.length) {
    faqHTML =
      '<section class="landing-sec lp-faq-sec"><div class="wrap wrap-text">' +
      '<div class="center">' + eb("שאלות נפוצות") +
      '<h2 class="h2 lp-h2">שאלות ותשובות</h2></div>' +
      '<div class="landing-faq">' +
      d.faq.map(function (f) {
        return '<details class="faq-item"><summary>' + f.q + "</summary><p>" + f.a + "</p></details>";
      }).join("") +
      "</div></div></section>";
  }

  /* ---------- technical details + urgency (workshops) ---------- */
  var detailsHTML = "";
  if (d.details) {
    detailsHTML =
      '<section class="landing-sec"><div class="wrap wrap-text">' +
      '<div class="center">' + eb("פרטים טכניים") +
      '<h2 class="h2 lp-h2">מתי, איפה וכמה מקומות</h2></div>' +
      '<div class="lp-details">' +
        (d.details.when ? '<div class="lp-detail"><span class="lp-detail-k">מתי</span><span class="lp-detail-v">' + d.details.when + "</span></div>" : "") +
        (d.details.where ? '<div class="lp-detail"><span class="lp-detail-k">איפה</span><span class="lp-detail-v">' + d.details.where +
          (d.details.whereNote ? '<span class="lp-detail-note">' + d.details.whereNote + "</span>" : "") + "</span></div>" : "") +
      "</div>" +
      (d.details.urgency ? '<p class="lp-urgency">' + d.details.urgency + "</p>" : "") +
      "</div></section>";
  }

  root.innerHTML =
    /* ===== hero — centered, big type, large image below ===== */
    '<section class="landing-hero">' +
      spark("", "top:18%;inset-inline-start:10%;width:26px;height:26px;animation-delay:.3s") +
      spark("lp-spark-blue", "top:30%;inset-inline-end:9%;width:18px;height:18px;animation-delay:1.1s") +
      spark("lp-spark-blue", "top:12%;inset-inline-end:18%;width:12px;height:12px") +
      '<div class="wrap landing-hero-inner">' +
        '<span class="landing-badge">' + d.kind + "</span>" +
        '<h1 class="landing-display">' + d.title + "</h1>" +
        (d.subtitle ? '<p class="landing-subtitle">' + d.subtitle + "</p>" : "") +
        '<p class="lead">' + d.tagline + "</p>" +
        priceHTML + dateHTML +
        '<div class="btn-row landing-hero-cta">' + ctaBtn() +
        '<a class="btn btn-ghost" href="#enroll">' + ctaSecondaryText + "</a></div>" +
        '<div class="landing-hero-media reveal"><img src="' + d.image + '" alt="' + esc(d.title) + '"></div>' +
      "</div>" +
    "</section>" +

    /* ===== features ===== */
    '<section class="landing-sec"><div class="wrap"><div class="center">' +
      eb("למה כדאי") +
      '<h2 class="h2 lp-h2">' + (d.featuresTitle || "מה תקבלי") + "</h2></div>" +
      '<div class="lp-feature-grid">' + featuresHTML + "</div>" +
      (d.summaryLine ? '<p class="lp-summary-line">' + d.summaryLine + "</p>" : "") +
      "</div></section>" +

    /* ===== curriculum ===== */
    '<section class="landing-sec"><div class="wrap"><div class="center">' +
      eb("התכנית") +
      '<h2 class="h2 lp-h2">' + (d.curriculumTitle || "מה לומדים בפנים") + "</h2></div>" +
      '<div class="cards cards-centered' + (d.curriculumPlain ? " cards-plain" : "") + '">' + curriculum + "</div></div></section>" +

    /* ===== mid CTA strip (soft pink card on the white page) ===== */
    '<section class="landing-sec"><div class="wrap">' +
      '<div class="lp-cta-strip reveal">' +
      '<h2 class="h2 lp-h2">' + (d.price && d.price !== "ללא עלות" ? "מוכנה להתחיל" : "רוצה פרטים נוספים?") + "</h2>" +
      '<p class="lead" style="margin:14px auto 0;max-width:560px">' + d.tagline + "</p>" +
      priceHTML + dateHTML +
      '<div class="btn-row" style="justify-content:center;margin-top:26px">' + ctaBtn() +
      '<a class="btn btn-ghost" href="#enroll">' + ctaSecondaryText + "</a></div>" +
      "</div></div></section>" +

    /* ===== about — "נעים להכיר" split ===== */
    '<section class="landing-sec"><div class="wrap"><div class="split reveal">' +
      '<div class="split-media"><img src="assets/images/eden-hero-bw.jpg" alt="עדן רוסק"></div>' +
      "<div>" + eb("נעים להכיר") +
      '<h2 class="h2 lp-h2">מה מחכה לך</h2><p class="lead" style="margin-top:16px">' + d.intro + "</p>" +
      '<ul class="check-list" style="margin-top:22px">' + li(d.whatYouGet) + "</ul>" +
      '<div class="btn-row" style="margin-top:26px">' + ctaBtn() + "</div></div>" +
    "</div></div></section>" +

    /* ===== process steps ===== */
    (d.hideSteps ? "" :
      '<section class="landing-sec"><div class="wrap"><div class="center">' +
      eb("איך זה עובד") +
      '<h2 class="h2 lp-h2">שלושה צעדים פשוטים</h2></div>' +
      '<div class="steps-grid">' + stepsHTML + "</div></div></section>") +

    /* ===== for who ===== */
    '<section class="landing-sec"><div class="wrap"><div class="center">' +
      eb("בדיוק בשבילך") +
      '<h2 class="h2 lp-h2">' + (d.forWhoTitle || "למי זה מתאים") + "</h2></div>" +
      '<div class="lp-forwho"><ul class="check-list' + (d.forWhoSpark ? " check-list-spark" : "") + '">' + li(d.forWho) + "</ul></div>" +
    "</div></section>" +

    /* ===== stats — quiet trust strip ===== */
    (statsHTML ? '<section class="landing-sec lp-stats-sec"><div class="wrap"><div class="lp-stats">' + statsHTML + "</div></div></section>" : "") +

    /* ===== testimonials ===== */
    '<section class="landing-sec"><div class="wrap"><div class="center">' +
      eb("ממליצות") +
      '<h2 class="h2 lp-h2">מה אומרות עליי</h2></div>' +
      '<div class="testimonial-grid">' + testimonialHTML + "</div></div></section>" +

    /* ===== FAQ ===== */
    faqHTML +

    /* ===== technical details + urgency ===== */
    detailsHTML;

  /* wire the static CTA button + headline in #enroll */
  var ctaBtnEl = document.getElementById("landingCtaBtn");
  if (ctaBtnEl) {
    ctaBtnEl.textContent = d.enrollCtaText || d.ctaText;
    ctaBtnEl.setAttribute("href", d.ctaUrl);
    ctaBtnEl.className = "btn " + accentBtn + " btn-lg";
    if (d.ctaUrl.indexOf("http") === 0) { ctaBtnEl.setAttribute("target", "_blank"); ctaBtnEl.setAttribute("rel", "noopener"); }
  }
  var ctaHead = document.getElementById("landingCtaHead");
  if (ctaHead) { ctaHead.textContent = "רוצה לשמוע עוד על " + d.title.replace(/[!?.]+$/, "") + "?"; }

  /* optional: override the lead-form submit label (e.g. UGC) */
  if (d.formBtnText) {
    var formBtn = document.querySelector('#leadForm button[type="submit"]');
    if (formBtn) formBtn.textContent = d.formBtnText;
  }

  /* optional: scatter a few animated sparkles down the whole page (UGC) */
  if (d.scatterSparks) {
    var secs = root.querySelectorAll(".landing-sec");
    Array.prototype.forEach.call(secs, function (sec, i) {
      sec.classList.add("lp-spark-host");
      var n = i % 2 === 0 ? 2 : 1;
      for (var k = 0; k < n; k++) {
        var sp = document.createElement("span");
        sp.className = "lp-spark" + ((i + k) % 2 ? " lp-spark-blue" : "");
        sp.setAttribute("aria-hidden", "true");
        var side = (i + k) % 2 ? "start" : "end";
        var top = 14 + ((i * 23 + k * 47) % 64);
        var off = 4 + ((i * 13 + k * 29) % 12);
        var sz = 12 + ((i + k) % 3) * 5;
        sp.style.cssText = "top:" + top + "%;inset-inline-" + side + ":" + off +
          "%;width:" + sz + "px;height:" + sz + "px;animation-delay:" + (((i + k) % 5) * 0.4).toFixed(1) + "s";
        sec.appendChild(sp);
      }
    });
  }
})();
