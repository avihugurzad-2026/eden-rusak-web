/* Eden Rusak — site interactions */
(function () {
  "use strict";

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var body = document.body;
  if (toggle) {
    toggle.addEventListener("click", function () {
      body.classList.toggle("nav-open");
      var open = body.classList.contains("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      a.addEventListener("click", function () { body.classList.remove("nav-open"); });
    });
  }

  /* ---------- Adaptive nav contrast (white logo over dark sections) ---------- */
  var nav = document.querySelector(".global-nav");
  if (nav) {
    var darkClasses = ["tile-dark", "tile-dark-2", "tile-blue", "hero"];
    var sections = Array.prototype.slice.call(document.querySelectorAll("main section"));
    function isDark(el) {
      for (var c = 0; c < darkClasses.length; c++) {
        if (el.classList.contains(darkClasses[c])) { return true; }
      }
      return false;
    }
    var ticking = false;
    function syncNav() {
      ticking = false;
      var probe = nav.getBoundingClientRect().bottom - 2;
      var onDark = false;
      for (var i = 0; i < sections.length; i++) {
        var r = sections[i].getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) {
          onDark = isDark(sections[i]);
          break;
        }
      }
      nav.classList.toggle("nav-on-dark", onDark);
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(syncNav); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    syncNav();
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Cookie consent ---------- */
  var KEY = "eden_cookie_consent";
  var banner = document.getElementById("cookieBanner");
  if (banner) {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (!saved) {
      setTimeout(function () { banner.classList.add("show"); }, 900);
    }
    function decide(value) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
      banner.classList.remove("show");
    }
    var acc = document.getElementById("cookieAccept");
    var rej = document.getElementById("cookieReject");
    if (acc) acc.addEventListener("click", function () { decide("accepted"); });
    if (rej) rej.addEventListener("click", function () { decide("rejected"); });
  }

  /* ---------- Reels: hover-play on desktop, autoplay-in-view + tap on touch ---------- */
  (function () {
    var items = document.querySelectorAll(".reel-item");
    if (!items.length) return;
    var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    /* iOS Safari needs the muted/playsinline *properties* set via JS before play() */
    function prime(v) {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("muted", "");
      v.setAttribute("playsinline", "");
      v.setAttribute("webkit-playsinline", "");
    }
    function play(item, v) {
      item.classList.add("playing");
      try { var p = v.play(); if (p) p.catch(function () { item.classList.remove("playing"); }); } catch (e) {}
    }
    function stop(item, v) {
      item.classList.remove("playing");
      v.pause();
    }

    if (coarse) {
      /* Touch devices have no hover — play the muted videos while they're on screen. */
      items.forEach(function (item) {
        var v = item.querySelector("video");
        if (!v) return;
        prime(v);
        try { v.preload = "metadata"; v.load(); } catch (e) {}
        /* tap toggles play/pause as a fallback (e.g. iOS low-power mode blocks autoplay) */
        item.addEventListener("click", function () {
          if (item.classList.contains("playing")) { stop(item, v); } else { play(item, v); }
        });
      });
      if ("IntersectionObserver" in window) {
        var vio = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            var item = e.target, v = item.querySelector("video");
            if (!v) return;
            if (e.isIntersecting) { play(item, v); } else { stop(item, v); }
          });
        }, { threshold: 0.4 });
        items.forEach(function (item) { vio.observe(item); });
      } else {
        items.forEach(function (item) {
          var v = item.querySelector("video");
          if (v) play(item, v);
        });
      }
      return;
    }

    items.forEach(function (item) {
      var video = item.querySelector("video");
      if (!video) return;
      item.addEventListener("mouseenter", function () {
        prime(video);
        try { video.currentTime = 0; } catch (e) {}
        play(item, video);
      });
      item.addEventListener("mouseleave", function () {
        stop(item, video);
        try { video.currentTime = 0; } catch (e) {}
      });
    });
  })();

  /* ---------- Contact form (no backend — friendly handoff) ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.getElementById("formNote");
      var name = (document.getElementById("cName") || {}).value || "";
      var msg = (document.getElementById("cMsg") || {}).value || "";
      var text = encodeURIComponent("שלום עדן, שמי " + name + ". " + msg);
      window.open("https://wa.me/972552629091?text=" + text, "_blank");
      if (note) { note.style.display = "block"; }
      form.reset();
    });
  }

  /* ---------- Accessibility widget ---------- */
  (function () {
    var A11Y_KEY = "eden_a11y";
    var root = document.documentElement;
    var state = { font: 0, contrast: false, links: false, readable: false, gray: false, stop: false };
    try { var s = JSON.parse(localStorage.getItem(A11Y_KEY) || "{}"); for (var k in s) { if (k in state) state[k] = s[k]; } } catch (e) {}

    var launcher = document.createElement("button");
    launcher.className = "a11y-launcher";
    launcher.setAttribute("aria-label", "תפריט נגישות");
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><circle cx="12" cy="3.6" r="2.1"/><path d="M20.5 7.4c0 .66-.49 1.18-1.15 1.27l-4.35.55v3.05l2.12 6.64a1.3 1.3 0 1 1-2.48.79L13 13.9h-2l-1.66 5.8a1.3 1.3 0 1 1-2.48-.8l2.12-6.63V9.22l-4.35-.55A1.28 1.28 0 0 1 4.83 6.1l4.32.55c1.9.24 3.8.24 5.7 0l4.32-.55c.7-.09 1.33.46 1.33 1.18v.12Z"/></svg>';

    var panel = document.createElement("div");
    panel.className = "a11y-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "אפשרויות נגישות");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="a11y-head"><h4>נגישות</h4><button class="a11y-close" type="button" aria-label="סגירה">&times;</button></div>' +
      '<div class="a11y-row"><span>גודל טקסט</span><div class="a11y-stepper">' +
      '<button type="button" data-act="font-down" aria-label="הקטנת טקסט">A−</button>' +
      '<span class="a11y-val" data-val="font">0</span>' +
      '<button type="button" data-act="font-up" aria-label="הגדלת טקסט">A+</button></div></div>' +
      '<button class="a11y-opt" type="button" data-toggle="contrast" aria-pressed="false">ניגודיות גבוהה</button>' +
      '<button class="a11y-opt" type="button" data-toggle="links" aria-pressed="false">הדגשת קישורים</button>' +
      '<button class="a11y-opt" type="button" data-toggle="readable" aria-pressed="false">גופן קריא</button>' +
      '<button class="a11y-opt" type="button" data-toggle="gray" aria-pressed="false">גווני אפור</button>' +
      '<button class="a11y-opt" type="button" data-toggle="stop" aria-pressed="false">עצירת אנימציות</button>' +
      '<button class="a11y-reset" type="button">איפוס הגדרות</button>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    function updateFontVal() { panel.querySelector('[data-val="font"]').textContent = (state.font > 0 ? "+" : "") + state.font; }
    function apply() {
      root.style.setProperty("--a11y-font-scale", (1 + state.font * 0.1).toFixed(2));
      root.classList.toggle("a11y-font", state.font !== 0);
      root.classList.toggle("a11y-contrast", state.contrast);
      root.classList.toggle("a11y-links", state.links);
      root.classList.toggle("a11y-readable", state.readable);
      root.classList.toggle("a11y-gray", state.gray);
      root.classList.toggle("a11y-stop", state.stop);
      try { localStorage.setItem(A11Y_KEY, JSON.stringify(state)); } catch (e) {}
      panel.querySelectorAll("[data-toggle]").forEach(function (btn) {
        var key = btn.getAttribute("data-toggle");
        btn.setAttribute("aria-pressed", state[key] ? "true" : "false");
      });
    }

    function openPanel() { panel.hidden = false; launcher.setAttribute("aria-expanded", "true"); }
    function closePanel() { panel.hidden = true; launcher.setAttribute("aria-expanded", "false"); }
    launcher.addEventListener("click", function () { panel.hidden ? openPanel() : closePanel(); });
    panel.querySelector(".a11y-close").addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

    panel.querySelector('[data-act="font-up"]').addEventListener("click", function () { if (state.font < 5) state.font++; updateFontVal(); apply(); });
    panel.querySelector('[data-act="font-down"]').addEventListener("click", function () { if (state.font > -2) state.font--; updateFontVal(); apply(); });
    panel.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () { var key = btn.getAttribute("data-toggle"); state[key] = !state[key]; apply(); });
    });
    panel.querySelector(".a11y-reset").addEventListener("click", function () {
      state = { font: 0, contrast: false, links: false, readable: false, gray: false, stop: false };
      updateFontVal(); apply();
    });

    updateFontVal();
    apply();
  })();

  /* ---------- Lead form (academy CTA — Israeli phone, optional email) ---------- */
  /* Static site → forward leads by email via FormSubmit (one-time activation
     required: the first submission emails an activation link to the address). */
  function sendLeadEmail(to, data) {
    if (!to) { return; }
    try {
      fetch("https://formsubmit.co/ajax/" + encodeURIComponent(to), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: "ליד חדש מהאתר" + (data.page ? " — " + data.page : ""),
          "שם": data.name || "",
          "טלפון": data.phone || "",
          "אימייל": data.email || "—"
        })
      }).catch(function () {});
    } catch (e) {}
  }

  var leadForm = document.getElementById("leadForm");
  if (leadForm) {
    leadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nameEl = document.getElementById("lName");
      var phoneEl = document.getElementById("lPhone");
      var emailEl = document.getElementById("lEmail");
      var note = document.getElementById("leadNote");
      var name = (nameEl.value || "").trim();
      var phone = (phoneEl.value || "").trim();
      var email = (emailEl.value || "").trim();

      if (!name) { nameEl.focus(); return; }
      var digits = phone.replace(/\D/g, "").replace(/^972/, "0");
      if (!/^0(5\d|[2-489])\d{7}$/.test(digits)) {
        phoneEl.setCustomValidity("נא להזין מספר טלפון ישראלי תקין");
        phoneEl.reportValidity();
        return;
      }
      phoneEl.setCustomValidity("");

      var cfg = window.EDEN_LEAD;
      if (cfg) {
        /* 1) auto-forward the lead to Eden's inbox (no backend — FormSubmit) */
        sendLeadEmail(cfg.email, { name: name, phone: phone, email: email, page: cfg.page });
        /* 2) hand off to a prefilled whatsapp chat within a few seconds */
        var firstName = name.split(/\s+/)[0];
        var waText = (cfg.waMessage || "").replace("{name}", firstName);
        var waUrl = "https://wa.me/" + cfg.waNumber + "?text=" + encodeURIComponent(waText);
        if (note) { note.style.display = "block"; }
        leadForm.reset();
        setTimeout(function () { window.location.href = waUrl; }, cfg.delayMs || 4000);
        return;
      }

      var text = "שלום עדן, שמי " + name + " ואשמח לקבל פרטים על האקדמיה. טלפון: " + phone;
      if (email) { text += ". מייל: " + email; }
      window.open("https://wa.me/972552629091?text=" + encodeURIComponent(text), "_blank");
      if (note) { note.style.display = "block"; }
      leadForm.reset();
    });
    document.getElementById("lPhone").addEventListener("input", function () {
      this.setCustomValidity("");
    });
  }
})();
