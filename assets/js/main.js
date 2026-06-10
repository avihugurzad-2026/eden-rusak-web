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
})();
