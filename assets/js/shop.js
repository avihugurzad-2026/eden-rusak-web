/* Eden Rusak — recommendations store ("המומלצים שלי")
   Data lives in Supabase (eden_rec_categories / eden_rec_products), edited from
   rec-admin.html. If Supabase is unreachable it falls back to products.js.
   Renders the storefront on recommendations.html and the product page. */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  /* only http(s), wa.me or site-relative links/images */
  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "";
    return u;
  }
  function money(n) {
    if (n === null || n === undefined || n === "") return "";
    var v = Number(n);
    if (isNaN(v)) return "";
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)) + "₪";
  }
  function productUrl(p) { return "product.html?id=" + encodeURIComponent(p.id); }

  /* ---------- data ---------- */
  function fromRow(r) {
    return {
      id: r.slug, cat: r.category_key || "", img: r.image_url || "", title: r.title || "",
      short: r.short || "", desc: r.description || "", coupon: r.coupon || "", buy: r.buy_url || "",
      price: r.price, oldPrice: r.old_price, badge: r.badge || "", stickerStyle: r.sticker_style || "pink",
      video: r.video_url || "", featured: !!r.featured,
      sort: r.sort || 0, created: r.created_at || ""
    };
  }
  function localData() {
    var products = (window.EDEN_PRODUCTS || []).map(function (p, i) {
      return { id: p.id, cat: p.cat, img: p.img, title: p.title, short: p.short, desc: p.desc,
        coupon: p.coupon, buy: p.buy, price: null, oldPrice: null, badge: "", stickerStyle: "pink", video: "",
        featured: p.cat === "favorites", sort: i, created: "" };
    });
    return { cats: window.EDEN_CATEGORIES || [], products: products, source: "local" };
  }
  function loadData() {
    var cfg = window.EDEN_SUPABASE;
    if (!cfg || !window.fetch) return Promise.resolve(localData());
    var opts = { headers: { apikey: cfg.key } };
    var base = cfg.url + "/rest/v1/";
    return Promise.all([
      fetch(base + "eden_rec_categories?select=key,label,note,sort&active=eq.true&order=sort.asc", opts),
      fetch(base + "eden_rec_products?select=*&active=eq.true&order=sort.asc,created_at.desc", opts)
    ]).then(function (res) {
      if (!res[0].ok || !res[1].ok) throw new Error("supabase " + res[0].status + "/" + res[1].status);
      return Promise.all([res[0].json(), res[1].json()]);
    }).then(function (json) {
      return { cats: json[0], products: json[1].map(fromRow), source: "supabase" };
    }).catch(function (err) {
      if (window.console) console.warn("Recommendations: using local fallback —", err);
      return localData();
    });
  }

  var DATA = { cats: [], products: [] };
  function catLabel(key) {
    for (var i = 0; i < DATA.cats.length; i++) { if (DATA.cats[i].key === key) return DATA.cats[i].label; }
    return "";
  }
  function byId(id) {
    for (var i = 0; i < DATA.products.length; i++) { if (DATA.products[i].id === id) return DATA.products[i]; }
    return null;
  }

  /* ---------- card ---------- */
  function priceHTML(p) {
    var now = money(p.price), old = money(p.oldPrice);
    if (!now) return "";
    var off = discount(p);
    return '<div class="pcard-price"><b>' + now + "</b>" + (old && off ? "<s>" + old + "</s><em>-" + off + "%</em>" : "") + "</div>";
  }
  function discount(p) {
    return (p.price && p.oldPrice && Number(p.oldPrice) > Number(p.price))
      ? Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100) : 0;
  }
  /* sticker Eden types in the admin wins; otherwise a price drop shows its % automatically */
  function badgeHTML(p) {
    var html = "";
    if (p.badge) html += '<span class="sticker sticker-' + esc(p.stickerStyle) + '">' + esc(p.badge) + "</span>";
    else if (discount(p)) html += '<span class="sticker sticker-red">-' + discount(p) + "%</span>";
    if (p.featured) html += '<span class="pcard-badge fav">המועדפים שלי</span>';
    return html;
  }

  /* ---------- demo video ---------- */
  function isFileVideo(u) { return /\.(mp4|webm|mov)(\?|#|$)/i.test(u) || u.indexOf("/storage/v1/object/public/") !== -1; }
  function youtubeId(u) {
    var m = String(u).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
    return m ? m[1] : "";
  }
  function videoPlayerHTML(p, autoplay) {
    var u = safeUrl(p.video);
    if (!u) return "";
    if (isFileVideo(u)) {
      return '<video class="demo-video" src="' + esc(u) + '" poster="' + esc(safeUrl(p.img)) + '" controls playsinline preload="metadata"' + (autoplay ? " autoplay muted" : "") + "></video>";
    }
    var yt = youtubeId(u);
    if (yt) {
      return '<div class="demo-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + yt + (autoplay ? "?autoplay=1&mute=1" : "") +
        '" title="' + esc(p.title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
    }
    return ""; /* Instagram / TikTok links open in a new tab instead */
  }
  function videoLinkHTML(p) {
    var u = safeUrl(p.video);
    if (!u || isFileVideo(u) || youtubeId(u)) return "";
    return '<a class="btn btn-outline demo-link" href="' + esc(u) + '" target="_blank" rel="noopener">' + PLAY + " צפו בהדגמה של עדן</a>";
  }
  var PLAY = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  function cardHTML(p) {
    var buy = safeUrl(p.buy);
    return '' +
      '<article class="pcard">' +
        '<a class="pcard-media" href="' + productUrl(p) + '">' +
          '<img src="' + esc(safeUrl(p.img)) + '" alt="' + esc(p.title) + '" loading="lazy">' + badgeHTML(p) +
        "</a>" +
        (p.video ? '<button type="button" class="pcard-video" data-qv="' + esc(p.id) + '" data-play="1">' + PLAY + " הדגמה</button>" : "") +
        '<button type="button" class="pcard-quick" data-qv="' + esc(p.id) + '">צפייה מהירה</button>' +
        '<div class="pcard-body">' +
          '<span class="pcard-cat">' + esc(catLabel(p.cat)) + "</span>" +
          '<a class="pcard-title" href="' + productUrl(p) + '">' + esc(p.title) + "</a>" +
          '<p class="pcard-text">' + esc(p.short) + "</p>" +
          priceHTML(p) +
          '<div class="pcard-actions">' +
            (buy ? '<a class="btn btn-primary pcard-buy" href="' + esc(buy) + '" target="_blank" rel="noopener sponsored">לרכישה</a>' : "") +
            (p.coupon ? '<button type="button" class="pcard-coupon" data-copy="' + esc(p.coupon) + '" title="העתקת קוד">קוד: <b>' + esc(p.coupon) + "</b></button>" : "") +
          "</div>" +
        "</div>" +
      "</article>";
  }

  function copyCode(btn, code) {
    var label = btn.innerHTML;
    var done = function () { btn.innerHTML = "הועתק!"; btn.classList.add("copied"); setTimeout(function () { btn.innerHTML = label; btn.classList.remove("copied"); }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(done, done); } else { done(); }
  }
  document.addEventListener("click", function (e) {
    var c = e.target.closest("[data-copy]");
    if (c) { e.preventDefault(); copyCode(c, c.getAttribute("data-copy")); }
  });

  /* ---------- quick view ---------- */
  function openQuickView(p, play) {
    var qv = document.getElementById("quickView");
    if (!qv || !p) return;
    var buy = safeUrl(p.buy);
    var player = videoPlayerHTML(p, play);
    qv.querySelector(".qv-body").innerHTML =
      '<div class="qv-media">' + (player || '<img src="' + esc(safeUrl(p.img)) + '" alt="' + esc(p.title) + '">') + "</div>" +
      '<div class="qv-info">' +
        '<span class="pcard-cat">' + esc(catLabel(p.cat)) + "</span>" +
        '<h3 class="qv-title" id="qvTitle">' + esc(p.title) + "</h3>" +
        priceHTML(p) +
        '<p class="qv-desc">' + esc(p.desc || p.short) + "</p>" +
        (p.coupon ? '<div class="pd-coupon"><span class="pd-coupon-label">קוד קופון של עדן</span><div class="pd-coupon-row"><code>' + esc(p.coupon) + '</code><button type="button" class="pd-copy" data-copy="' + esc(p.coupon) + '">העתקה</button></div></div>' : "") +
        '<div class="btn-row">' +
          (buy ? '<a class="btn btn-primary btn-lg" href="' + esc(buy) + '" target="_blank" rel="noopener sponsored">לרכישת המוצר</a>' : "") +
          '<a class="btn btn-outline" href="' + productUrl(p) + '">לעמוד המוצר</a>' +
        "</div>" + videoLinkHTML(p) +
      "</div>";
    qv.hidden = false;
    document.body.classList.add("qv-open");
    qv.querySelector(".qv-close").focus();
  }
  function closeQuickView() {
    var qv = document.getElementById("quickView");
    if (!qv) return;
    var v = qv.querySelector("video");
    if (v) v.pause();
    qv.querySelector(".qv-body").innerHTML = ""; /* stops YouTube embeds too */
    qv.hidden = true;
    document.body.classList.remove("qv-open");
  }

  /* ---------- storefront (recommendations.html) ---------- */
  function initStore() {
    var grid = document.getElementById("storeGrid");
    if (!grid) return;
    var chips = document.getElementById("storeChips");
    var search = document.getElementById("storeSearch");
    var sort = document.getElementById("storeSort");
    var count = document.getElementById("storeCount");
    var empty = document.getElementById("storeEmpty");
    var params = new URLSearchParams(location.search);
    var state = { cat: params.get("cat") || "all", q: params.get("q") || "", sort: "featured" };
    if (search) search.value = state.q;

    function counts() {
      var c = { all: DATA.products.length };
      DATA.products.forEach(function (p) { c[p.cat] = (c[p.cat] || 0) + 1; });
      return c;
    }
    function renderChips() {
      var c = counts();
      var list = [{ key: "all", label: "הכל" }].concat(DATA.cats.filter(function (x) { return c[x.key]; }));
      chips.innerHTML = list.map(function (x) {
        return '<button type="button" class="chip' + (state.cat === x.key ? " on" : "") + '" data-cat="' + esc(x.key) + '">' +
          esc(x.label) + " <span>" + (c[x.key] || 0) + "</span></button>";
      }).join("");
    }
    function sorted(list) {
      var s = state.sort;
      var priceVal = function (p) { return (p.price === null || p.price === undefined || p.price === "") ? null : Number(p.price); };
      return list.slice().sort(function (a, b) {
        if (s === "new") return String(b.created).localeCompare(String(a.created));
        if (s === "price-asc" || s === "price-desc") {
          var pa = priceVal(a), pb = priceVal(b);
          if (pa === null && pb === null) return a.sort - b.sort;
          if (pa === null) return 1;
          if (pb === null) return -1;
          return s === "price-asc" ? pa - pb : pb - pa;
        }
        if (s === "az") return a.title.localeCompare(b.title, "he");
        return (b.featured - a.featured) || (a.sort - b.sort);
      });
    }
    function render() {
      var q = state.q.trim().toLowerCase();
      var list = DATA.products.filter(function (p) {
        if (state.cat !== "all" && p.cat !== state.cat) return false;
        if (!q) return true;
        return (p.title + " " + p.short + " " + p.desc + " " + catLabel(p.cat)).toLowerCase().indexOf(q) !== -1;
      });
      list = sorted(list);
      grid.classList.toggle("is-grouped", state.cat === "all" && !q);
      if (state.cat === "all" && !q) {
        /* "הכל" = one section per category, in the order Eden set in the admin */
        var groups = DATA.cats.map(function (c) {
          return { key: c.key, label: c.label, note: c.note, items: list.filter(function (p) { return p.cat === c.key; }) };
        });
        var known = DATA.cats.map(function (c) { return c.key; });
        groups.push({ key: "", label: "עוד מוצרים", note: "", items: list.filter(function (p) { return known.indexOf(p.cat) === -1; }) });
        grid.innerHTML = groups.filter(function (g) { return g.items.length; }).map(function (g) {
          return '<section class="store-group" id="cat-' + esc(g.key || "other") + '">' +
            '<div class="store-group-head"><div><h2 class="h3">' + esc(g.label) + "</h2>" +
            (g.note ? "<p>" + esc(g.note) + "</p>" : "") + "</div>" +
            (g.key ? '<button type="button" class="store-group-more" data-show-cat="' + esc(g.key) + '">' + g.items.length + " מוצרים ‹</button>" : "") +
            "</div>" +
            '<div class="store-grid">' + g.items.map(cardHTML).join("") + "</div></section>";
        }).join("");
      } else {
        grid.innerHTML = '<div class="store-grid">' + list.map(cardHTML).join("") + "</div>";
      }
      if (count) count.textContent = list.length === 1 ? "מוצר אחד" : list.length + " מוצרים";
      if (empty) empty.hidden = list.length !== 0;
      renderChips();
    }

    chips.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]");
      if (!b) return;
      state.cat = b.getAttribute("data-cat");
      render();
    });
    if (search) search.addEventListener("input", function () { state.q = search.value; render(); });
    if (sort) sort.addEventListener("change", function () { state.sort = sort.value; render(); });
    var reset = document.getElementById("storeReset");
    if (reset) reset.addEventListener("click", function () { state.cat = "all"; state.q = ""; if (search) search.value = ""; render(); });

    /* hero search jumps into the store */
    var heroForm = document.getElementById("heroSearch");
    if (heroForm) heroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = (heroForm.querySelector("input") || {}).value || "";
      state.q = v; state.cat = "all";
      if (search) search.value = v;
      render();
      document.getElementById("store").scrollIntoView({ behavior: "smooth" });
    });
    /* hero category shortcuts */
    document.querySelectorAll("[data-jump-cat]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        state.cat = a.getAttribute("data-jump-cat");
        render();
        document.getElementById("store").scrollIntoView({ behavior: "smooth" });
      });
    });

    /* quick view */
    grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-qv]");
      if (b) openQuickView(byId(b.getAttribute("data-qv")), b.hasAttribute("data-play"));
      var j = e.target.closest("[data-show-cat]");
      if (j) { state.cat = j.getAttribute("data-show-cat"); render(); document.getElementById("store").scrollIntoView({ behavior: "smooth" }); }
    });
    var qv = document.getElementById("quickView");
    if (qv) {
      qv.addEventListener("click", function (e) { if (e.target === qv || e.target.closest(".qv-close")) closeQuickView(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeQuickView(); });
    }

    render();
    renderFeatured();
    renderSpotlight();
    renderHeroCats();
  }

  function renderFeatured() {
    var host = document.getElementById("featuredTrack");
    if (!host) return;
    var fav = DATA.products.filter(function (p) { return p.featured; });
    var sec = document.getElementById("storeFeatured");
    if (!fav.length) { if (sec) sec.hidden = true; return; }
    host.innerHTML = fav.map(cardHTML).join("");
    host.addEventListener("click", function (e) {
      var b = e.target.closest("[data-qv]");
      if (b) openQuickView(byId(b.getAttribute("data-qv")), b.hasAttribute("data-play"));
    });
  }
  function renderSpotlight() {
    var host = document.getElementById("storeSpotlight");
    if (!host) return;
    var p = DATA.products.filter(function (x) { return x.featured; })[0] || DATA.products[0];
    if (!p) return;
    host.innerHTML =
      '<a class="spot-media" href="' + productUrl(p) + '"><img src="' + esc(safeUrl(p.img)) + '" alt="' + esc(p.title) + '"></a>' +
      '<div class="spot-info"><span class="spot-tag">המוצר של השבוע</span>' +
      '<a class="spot-title" href="' + productUrl(p) + '">' + esc(p.title) + "</a>" +
      priceHTML(p) +
      (p.coupon ? '<button type="button" class="pcard-coupon" data-copy="' + esc(p.coupon) + '">קוד: <b>' + esc(p.coupon) + "</b></button>" : "") +
      "</div>";
  }
  function renderHeroCats() {
    var host = document.getElementById("heroCats");
    if (!host) return;
    host.innerHTML = DATA.cats.map(function (c) {
      return '<a href="#store" data-jump-cat="' + esc(c.key) + '">' + esc(c.label) + "</a>";
    }).join("");
    host.querySelectorAll("[data-jump-cat]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var chip = document.querySelector('#storeChips [data-cat="' + a.getAttribute("data-jump-cat") + '"]');
        if (chip) chip.click();
        document.getElementById("store").scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ---------- product page ---------- */
  function initProduct() {
    var detail = document.getElementById("productDetail");
    if (!detail) return;
    var id = new URLSearchParams(location.search).get("id");
    var p = byId(id) || DATA.products[0];
    if (!p) { detail.innerHTML = '<div class="wrap center"><h1 class="h2">המוצר לא נמצא</h1><p><a href="recommendations.html">חזרה לחנות</a></p></div>'; return; }
    document.title = p.title + " — עדן רוסק";
    var buy = safeUrl(p.buy);

    var couponBlock = p.coupon
      ? '<div class="pd-coupon"><span class="pd-coupon-label">קוד קופון של עדן</span>' +
        '<div class="pd-coupon-row"><code>' + esc(p.coupon) + "</code>" +
        '<button type="button" class="pd-copy" data-copy="' + esc(p.coupon) + '">העתקה</button></div>' +
        '<p class="pd-coupon-note">הזינו את הקוד בעמוד הרכישה ותיהנו מהטבה.</p></div>'
      : "";

    detail.innerHTML =
      '<div class="wrap"><nav class="pd-breadcrumb"><a href="recommendations.html">המומלצים שלי</a> <span>›</span> ' +
      '<a href="recommendations.html?cat=' + encodeURIComponent(p.cat) + '#store">' + esc(catLabel(p.cat)) + "</a></nav>" +
      '<div class="pd-grid">' +
        '<div class="pd-gallery"><div class="pd-main">' + badgeHTML(p) + '<img src="' + esc(safeUrl(p.img)) + '" alt="' + esc(p.title) + '"></div>' +
          (videoPlayerHTML(p, false) ? '<div class="pd-video"><span class="pd-video-label">' + PLAY + " עדן מדגימה את המוצר</span>" + videoPlayerHTML(p, false) + "</div>" : "") +
        "</div>" +
        '<div class="pd-info">' +
          '<span class="pd-cat">' + esc(catLabel(p.cat)) + "</span>" +
          '<h1 class="pd-title">' + esc(p.title) + "</h1>" +
          priceHTML(p) +
          '<p class="pd-desc">' + esc(p.desc || p.short) + "</p>" +
          couponBlock +
          (buy ? '<a class="btn btn-primary btn-lg pd-buy" href="' + esc(buy) + '" target="_blank" rel="noopener sponsored">לרכישת המוצר</a>' : "") +
          videoLinkHTML(p) +
          '<ul class="pd-perks"><li>מוצר שאני באמת משתמשת בו</li><li>קישור ישיר לרכישה אצל המוכר</li></ul>' +
          '<p class="fine pd-affiliate">* ייתכן שהקישור כולל קישור שותפים. אני ממליצה רק על מוצרים שאני באמת משתמשת בהם.</p>' +
        "</div>" +
      "</div></div>";

    var related = document.getElementById("productRelated");
    if (related) {
      var same = DATA.products.filter(function (x) { return x.id !== p.id && x.cat === p.cat; });
      var other = DATA.products.filter(function (x) { return x.id !== p.id && x.cat !== p.cat; });
      var pick = same.concat(other).slice(0, 8);
      related.innerHTML = pick.length
        ? '<div class="wrap"><div class="sec-head"><h2 class="h2">עוד מוצרים שאני אוהבת</h2>' +
          '<a class="btn btn-outline" href="recommendations.html#store">לכל המוצרים</a></div>' +
          '<div class="store-grid">' + pick.map(cardHTML).join("") + "</div></div>"
        : "";
    }
  }

  loadData().then(function (d) {
    DATA = d;
    initStore();
    initProduct();
  });
})();
