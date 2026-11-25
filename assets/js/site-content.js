/* Eden Rusak — live site content from the admin (academy.edenrusak.com/admin/site).
   - catalog: digital products. Every element marked data-p="<product id>" data-f="price|old|buy|title|short|img"
     follows the admin, so a price or link changes on every page at once.
   - media: which video sits where. Every container marked data-slot="<slot>" is rebuilt from the admin's choice.
   - trust: testimonials, offer details, business block, fit quiz, stats. A container marked
     data-trust-page="<page key>" gets a section for every block the admin filled in; nothing filled = nothing shown.
   If the service is unavailable the static HTML stays exactly as it is. */
(function () {
  "use strict";
  var base = "https://lefqtffubkmxbsenptrc.supabase.co", key = "sb_publishable_P2XYPTQ1k6DkqUZ5txXGgw_j7v-hIqn";
  var controller = new AbortController(), timeout = setTimeout(function () { controller.abort(); }, 5000);
  var rows = fetch(base + "/rest/v1/eden_site_content?key=in.(catalog,media,trust)&select=key,data", { signal: controller.signal, headers: { apikey: key, Authorization: "Bearer " + key } })
    .then(function (r) { if (!r.ok) throw Error("content"); return r.json(); })
    .then(function (list) { var out = {}; list.forEach(function (row) { out[row.key] = row.data; }); return out; })
    .catch(function () { return {}; })
    .finally(function () { clearTimeout(timeout); });
  /* store.js awaits this */
  window.EDEN_CATALOG = rows.then(function (r) { return r.catalog || null; });
  window.EDEN_MEDIA = rows.then(function (r) { return r.media || null; });

  function url(s) {
    if (!s) return "";
    if (/^assets\//.test(s)) return s;
    try { var u = new URL(s, location.origin); return u.protocol === "https:" ? u.href : ""; } catch (e) { return ""; }
  }
  function money(n) { return (Number(n) % 1 === 0 ? String(Number(n)) : Number(n).toFixed(2)) + "₪"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function applyProducts(catalog) {
    var products = catalog && Array.isArray(catalog.products) ? catalog.products : [];
    products.forEach(function (p) {
      if (!p || !p.id) return;
      var price = p.price, old = p.oldPrice;
      /* a sale synced from the courses system ends by itself */
      if (p.saleEndsAt && new Date(p.saleEndsAt).getTime() < Date.now() && old) { price = old; old = null; }
      document.querySelectorAll('[data-p="' + p.id + '"]').forEach(function (el) {
        var f = el.getAttribute("data-f");
        if (f === "price" && price != null && price !== "") el.textContent = Number(price) === 0 ? "חינם" : money(price);
        else if (f === "old") { if (old && Number(old) > Number(price)) { el.textContent = money(old); el.hidden = false; } else el.hidden = true; }
        else if (f === "buy") { var b = url(p.buy); if (b) el.href = b; }
        else if (f === "title" && p.title) el.textContent = p.title;
        else if (f === "short" && p.short) el.textContent = p.short;
        else if (f === "img") { var i = url(p.img); if (i) { el.src = i; if (p.title) el.alt = p.title; } }
      });
    });
  }

  /* Course cards (academy page). A card marked data-card="<product id>" disappears when the product is
     hidden or removed in the admin; a grid marked data-courses also gets a card for every other active course. */
  function link(s) {
    if (!s) return "";
    if (/^[a-z0-9][\w\-./]*\.html([?#][\w\-=&%.]*)?$/i.test(s)) return s;
    return url(s);
  }
  function applyCards(catalog) {
    if (!catalog || !Array.isArray(catalog.products)) return;
    var byId = {};
    catalog.products.forEach(function (p) { if (p && p.id) byId[p.id] = p; });
    document.querySelectorAll("[data-card]").forEach(function (el) {
      var p = byId[el.getAttribute("data-card")];
      if (!p || p.active === false) el.remove();
    });
    document.querySelectorAll("[data-courses]").forEach(function (grid) {
      catalog.products.forEach(function (p) {
        if (!p || !p.id || p.active === false || p.cat !== "courses" || !p.title) return;
        if (grid.querySelector('[data-card="' + p.id + '"]')) return;
        var href = esc(link(p.landing) || "shop-product.html?id=" + encodeURIComponent(p.id)), img = url(p.img), title = esc(p.title);
        var card = document.createElement("article");
        card.className = "course-card";
        card.setAttribute("data-card", p.id);
        card.innerHTML = '<a class="course-media" href="' + href + '">' + (img ? '<img src="' + esc(img) + '" alt="' + title + '" loading="lazy">' : "") + '</a>' +
          '<div class="course-body"><span class="tag">קורס דיגיטלי</span><h3 class="h3">' + title + '</h3><p>' + esc(p.short || "") + '</p>' +
          '<a href="' + href + '" class="btn btn-primary">לפרטים על הקורס</a></div>';
        grid.appendChild(card);
      });
    });
  }

  function applyMedia(media, catalog) {
    var library = {};
    (media && Array.isArray(media.library) ? media.library : []).forEach(function (v) { if (v && v.id) library[v.id] = v; });
    var slots = (media && media.slots) || {};
    /* before the media manager existed, extra portfolio videos lived in catalog.videos */
    if (!slots["portfolio-more"] && catalog && Array.isArray(catalog.videos) && catalog.videos.length) {
      slots["portfolio-more"] = catalog.videos.map(function (v, i) { library["legacy-" + i] = { id: "legacy-" + i, title: v.title, url: v.url }; return "legacy-" + i; });
    }
    var reels = false;
    document.querySelectorAll("[data-slot]").forEach(function (el) {
      var ids = slots[el.getAttribute("data-slot")];
      if (!Array.isArray(ids)) return; /* never arranged in the admin: keep the page as built */
      var items = ids.map(function (id) { return library[id]; }).filter(function (v) { return v && url(v.url); });
      var reel = el.classList.contains("reel-track");
      el.innerHTML = items.map(function (v) {
        var src = esc(url(v.url)), poster = v.poster && url(v.poster) ? esc(url(v.poster)) : "", title = esc(v.title || "סרטון");
        if (reel) return '<div class="reel-item">' + (poster ? '<img class="reel-poster" src="' + poster + '" alt="' + title + '" loading="lazy">' : "") +
          '<video src="' + src + '" muted loop playsinline preload="metadata"></video><span class="reel-play">▶</span></div>';
        var video = '<video controls playsinline preload="none"' + (poster ? ' poster="' + poster + '"' : "") + ' aria-label="' + title + '"><source src="' + src + '" type="' + (/\.webm(\?|$)/i.test(src) ? "video/webm" : "video/mp4") + '"></video>';
        if (el.hasAttribute("data-show-titles")) return '<figure class="ugc-example">' + video + '<figcaption><strong>' + title + '</strong><span>תוכן UGC למותג</span></figcaption></figure>';
        return video;
      }).join("");
      var section = el.closest("section");
      if (section) section.hidden = !items.length;
      if (reel) reels = true;
    });
    if (reels && window.EDEN_initReels) window.EDEN_initReels();
  }

  /* ---------- trust & sales blocks (admin: אתר › אמון ומכירה) ---------- */
  function onPage(list, page) { return !Array.isArray(list) || !list.length || list.indexOf(page) > -1; }
  function sec(cls, inner) { return '<section class="section trust-sec ' + cls + '"><div class="wrap">' + inner + "</div></section>"; }
  function head(eyebrow, title) { return '<div class="center"><span class="eyebrow">' + esc(eyebrow) + '</span><h2 class="h2">' + esc(title) + "</h2></div>"; }

  function offerHTML(o) {
    if (!o) return "";
    var rows = [["מחיר", o.price ? esc(o.price) + (o.oldPrice ? ' <s>' + esc(o.oldPrice) + "</s>" : "") : ""], ["היקף", esc(o.hours || "")],
      ["שיעורים / מפגשים", esc(o.lessons || "")], ["מועד קרוב", esc(o.nextDate || "")]].filter(function (r) { return r[1]; });
    var syl = link(o.syllabusUrl);
    if (!rows.length && !syl && !o.community && !o.note) return "";
    return sec("trust-offer", head("פרטים", "כל מה שחשוב לדעת") +
      '<div class="trust-offer-card">' +
        (rows.length ? '<dl class="trust-facts">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>" : "") +
        (o.community ? '<p class="trust-community">' + esc(o.community) + "</p>" : "") +
        (o.note ? '<p class="trust-note">' + esc(o.note) + "</p>" : "") +
        (syl ? '<a class="btn btn-secondary" href="' + esc(syl) + '" target="_blank" rel="noopener">לסילבוס המלא</a>' : "") +
      "</div>");
  }
  function businessHTML(b) {
    if (!b || !Array.isArray(b.items) || !b.items.length) return "";
    return sec("trust-business tile-parchment", head("הצד העסקי", b.title || "מתמחור ועד חוזה") +
      (b.intro ? '<p class="lead center trust-intro">' + esc(b.intro) + "</p>" : "") +
      '<ul class="trust-biz">' + b.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>");
  }
  function testimonialsHTML(list, page) {
    var items = (list || []).filter(function (t) { return t && t.name && t.text && onPage(t.pages, page); });
    if (!items.length) return "";
    return sec("trust-reviews", head("ממליצות", "מה אומרות הבוגרות") + '<div class="testimonial-grid">' + items.map(function (t) {
      var img = url(t.img);
      return '<figure class="testimonial"><blockquote>' + esc(t.text) + "</blockquote>" +
        (t.result ? '<p class="trust-result">' + esc(t.result) + "</p>" : "") +
        '<figcaption>' + (img ? '<img class="t-avatar" src="' + esc(img) + '" alt="" loading="lazy">' : '<span class="t-avatar">' + esc(t.name.trim().charAt(0)) + "</span>") +
        '<span class="t-meta"><strong>' + esc(t.name) + "</strong>" + (t.role ? "<span>" + esc(t.role) + "</span>" : "") + "</span></figcaption></figure>";
    }).join("") + "</div>");
  }
  function statsHTML(stats) {
    var s = (stats || []).filter(function (x) { return x && x.num && x.label; });
    if (!s.length) return "";
    return '<section class="landing-sec lp-stats-sec"><div class="wrap"><div class="lp-stats">' + s.map(function (x) {
      return '<div class="lp-stat"><span class="lp-stat-num">' + esc(x.num) + '</span><span class="lp-stat-label">' + esc(x.label) + "</span></div>";
    }).join("") + "</div></div></section>";
  }
  function quizHTML(q, page) {
    if (!q || !onPage(q.pages, page) || !Array.isArray(q.questions) || !q.questions.length) return "";
    return sec("trust-quiz", head("בדיקת התאמה", q.title || "הקורס מתאים לך?") + (q.intro ? '<p class="lead center trust-intro">' + esc(q.intro) + "</p>" : "") +
      '<div class="trust-quiz-box" data-quiz><p class="trust-quiz-step"></p><h3 class="h3 trust-quiz-q"></h3><div class="trust-quiz-opts"></div></div>');
  }
  function runQuiz(box, q, page) {
    var i = 0, unfit = 0;
    var step = box.querySelector(".trust-quiz-step"), title = box.querySelector(".trust-quiz-q"), opts = box.querySelector(".trust-quiz-opts");
    function show() {
      if (i >= q.questions.length) return done();
      var qq = q.questions[i];
      step.textContent = "שאלה " + (i + 1) + " מתוך " + q.questions.length;
      title.textContent = qq.q;
      opts.innerHTML = "";
      qq.options.forEach(function (o) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "trust-quiz-opt"; b.textContent = o.label;
        b.onclick = function () { if (o.fit === false) unfit++; i++; show(); };
        opts.appendChild(b);
      });
    }
    function done() {
      var fit = unfit < 2;
      var buy = link(q.ctaUrl) || (document.querySelector('[data-f="buy"]') || {}).href || "";
      step.textContent = "";
      title.textContent = fit ? (q.fitTitle || "זה מתאים לך!") : (q.unfitTitle || "בואי נדבר");
      opts.innerHTML = '<p class="trust-quiz-res">' + esc(fit ? q.fitText || "" : q.unfitText || "") + "</p>" +
        '<div class="btn-row" style="justify-content:center">' +
        (fit && buy ? '<a class="btn btn-primary" href="' + esc(buy) + '">' + esc(q.ctaLabel || "להרשמה") + "</a>" : "") +
        (q.whatsapp ? '<a class="btn btn-secondary" target="_blank" rel="noopener" href="https://wa.me/' + esc(String(q.whatsapp).replace(/\D/g, "")) + '">שאלה בוואטסאפ</a>' : "") +
        '<button type="button" class="btn btn-ghost trust-quiz-again">מהתחלה</button></div>';
      opts.querySelector(".trust-quiz-again").onclick = function () { i = 0; unfit = 0; show(); };
    }
    show();
  }
  function applyTrust(t) {
    if (!t) return;
    document.querySelectorAll("[data-trust-page]").forEach(function (el) {
      var page = el.getAttribute("data-trust-page");
      var html = (el.hasAttribute("data-trust-stats") ? statsHTML(t.stats) : "") +
        offerHTML(t.offers && t.offers[page]) + businessHTML(t.business && t.business[page]) +
        testimonialsHTML(t.testimonials, page) + quizHTML(t.quiz, page);
      el.innerHTML = html;
      el.hidden = !html;
      var box = el.querySelector("[data-quiz]");
      if (box) runQuiz(box, t.quiz, page);
    });
  }

  rows.then(function (r) {
    try { applyProducts(r.catalog); } catch (e) {}
    try { applyCards(r.catalog); } catch (e) {}
    try { applyMedia(r.media, r.catalog); } catch (e) {}
    try { applyTrust(r.trust); } catch (e) {}
  });
})();
