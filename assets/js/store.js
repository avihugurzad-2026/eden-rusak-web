/* Eden Rusak — "החנות" renderer.
   Renders the store grid on shop.html and the product page on
   shop-product.html?id=<key>. Data: store-data.js, merged with admin
   overrides via EDEN_DB (admin.html). */
(function () {
  "use strict";
  var FALLBACK_P = window.EDEN_STORE_PRODUCTS || [];
  var FALLBACK_C = window.EDEN_STORE_CATEGORIES || [];
  var PRODUCTS = (window.EDEN_DB ? EDEN_DB.get("storeProducts", FALLBACK_P) : FALLBACK_P)
    .filter(function (p) { return p.active !== false; });
  var CATS = window.EDEN_DB ? EDEN_DB.get("storeCategories", FALLBACK_C) : FALLBACK_C;

  var WA = "https://wa.me/972552629091";

  function byId(id) { for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === id) return PRODUCTS[i]; } return null; }
  function catLabel(key) { for (var i = 0; i < CATS.length; i++) { if (CATS[i].key === key) return CATS[i].label; } return ""; }
  function fmtPrice(n) { return Number(n) === 0 ? "חינם" : Number(n) + "₪"; }
  function soldOut(p) { return p.stock !== "" && p.stock !== null && p.stock !== undefined && Number(p.stock) <= 0; }
  function lowStock(p) { return p.stock !== "" && p.stock !== null && p.stock !== undefined && Number(p.stock) > 0 && Number(p.stock) <= 5; }
  function couponOf(p) {
    var c = p.coupon;
    if (!c) return null;
    if (typeof c === "string") { return c ? { code: c, off: "", note: "" } : null; }
    return c.code ? c : null;
  }
  function buyUrl(p) {
    if (p.buy) return p.buy;
    var c = couponOf(p);
    var txt = "שלום עדן, אשמח לרכוש את \"" + p.title + "\"" + (c ? " (קוד קופון: " + c.code + ")" : "");
    return WA + "?text=" + encodeURIComponent(txt);
  }

  function badgeHTML(p) {
    if (soldOut(p)) return '<span class="store-badge store-badge-out">אזל מהמלאי</span>';
    if (Number(p.price) === 0) return '<span class="store-badge store-badge-free">חינם</span>';
    if (p.oldPrice) return '<span class="store-badge store-badge-sale">מבצע</span>';
    return "";
  }

  function priceHTML(p) {
    return '<span class="store-price">' + fmtPrice(p.price) +
      (p.oldPrice ? ' <span class="old">' + fmtPrice(p.oldPrice) + "</span>" : "") + "</span>";
  }

  function cardHTML(p) {
    var c = couponOf(p);
    return '<a class="store-card reveal" href="shop-product.html?id=' + encodeURIComponent(p.id) + '" data-cat="' + p.cat + '">' +
      '<span class="store-card-media">' + badgeHTML(p) +
        '<img src="' + p.img + '" alt="' + p.title + '" loading="lazy"></span>' +
      '<span class="store-card-body">' +
        '<span class="store-card-cat">' + catLabel(p.cat) + "</span>" +
        '<span class="store-card-title">' + p.title + "</span>" +
        '<span class="store-card-text">' + p.short + "</span>" +
        '<span class="store-card-foot">' + priceHTML(p) +
          (c ? '<span class="store-card-coupon">קוד: ' + c.code + "</span>" : "") +
        "</span>" +
      "</span></a>";
  }

  /* ---------- Store page ---------- */
  var grid = document.getElementById("storeGrid");
  if (grid) {
    var chipsHost = document.getElementById("storeFilters");
    if (chipsHost) {
      var chips = '<button class="store-chip active" type="button" data-cat="all">הכל</button>' +
        CATS.map(function (c) {
          return '<button class="store-chip" type="button" data-cat="' + c.key + '">' + c.label + "</button>";
        }).join("");
      chipsHost.innerHTML = chips;
      chipsHost.addEventListener("click", function (e) {
        var btn = e.target.closest(".store-chip");
        if (!btn) return;
        chipsHost.querySelectorAll(".store-chip").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var cat = btn.getAttribute("data-cat");
        grid.querySelectorAll(".store-card").forEach(function (card) {
          card.style.display = (cat === "all" || card.getAttribute("data-cat") === cat) ? "" : "none";
        });
      });
    }
    grid.innerHTML = PRODUCTS.map(cardHTML).join("");
    grid.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Product page ---------- */
  var detail = document.getElementById("storeProductDetail");
  if (detail) {
    var params = new URLSearchParams(window.location.search);
    var p = byId(params.get("id")) || PRODUCTS[0];
    if (!p) return;
    document.title = p.title + " — החנות של עדן רוסק";

    var c = couponOf(p);
    var couponBlock = c
      ? '<div class="pd-coupon"><span class="pd-coupon-label">קוד קופון' + (c.off ? " — " + c.off : "") + "</span>" +
        '<div class="pd-coupon-row"><code id="pdCode">' + c.code + "</code>" +
        '<button type="button" class="pd-copy" id="pdCopy">העתקה</button></div>' +
        '<p class="pd-coupon-note">' + (c.note || "הזינו את הקוד בעמוד הרכישה ותיהנו מהטבה.") + "</p></div>"
      : "";

    var stockNote = "";
    if (soldOut(p)) { stockNote = '<p class="pd-stock pd-stock-out">המוצר אזל מהמלאי — השאירו פרטים ואעדכן כשיחזור.</p>'; }
    else if (lowStock(p)) { stockNote = '<p class="pd-stock">נותרו רק ' + Number(p.stock) + " עותקים במחיר הזה!</p>"; }

    var includes = (p.includes && p.includes.length)
      ? '<div class="pd-includes"><h3 class="h3">מה מקבלים</h3><ul class="check-list">' +
        p.includes.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div>"
      : "";

    var buyBtn = soldOut(p)
      ? '<span class="btn btn-primary btn-lg pd-buy pd-buy-disabled" aria-disabled="true">אזל מהמלאי</span>'
      : '<a class="btn btn-primary btn-lg pd-buy" href="' + buyUrl(p) + '" target="_blank" rel="noopener">' +
        (Number(p.price) === 0 ? "להורדה ללא עלות" : "לרכישה מיידית") + "</a>";

    detail.innerHTML =
      '<div class="wrap"><nav class="pd-breadcrumb"><a href="shop.html">החנות</a> <span>›</span> <span>' + catLabel(p.cat) + "</span></nav>" +
      '<div class="pd-grid">' +
        '<div class="pd-gallery"><div class="pd-main">' + badgeHTML(p) + '<img src="' + p.img + '" alt="' + p.title + '"></div></div>' +
        '<div class="pd-info">' +
          '<span class="pd-cat">' + catLabel(p.cat) + "</span>" +
          '<h1 class="pd-title">' + p.title + "</h1>" +
          '<div class="pd-price-row">' + priceHTML(p) + "</div>" +
          stockNote +
          '<p class="pd-desc">' + p.desc + "</p>" +
          includes + couponBlock + buyBtn +
          '<p class="fine pd-affiliate">מוצר דיגיטלי — הגישה נשלחת מיד לאחר הרכישה. לשאלות אני כאן ב-whatsapp.</p>' +
        "</div>" +
      "</div></div>";

    var copyBtn = document.getElementById("pdCopy");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var code = (document.getElementById("pdCode") || {}).textContent || "";
        var done = function () { copyBtn.textContent = "הועתק!"; setTimeout(function () { copyBtn.textContent = "העתקה"; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(done, done); }
        else { done(); }
      });
    }

    /* related products */
    var related = document.getElementById("storeRelated");
    if (related) {
      var pool = PRODUCTS.filter(function (x) { return x.id !== p.id; }).slice(0, 4);
      if (pool.length) {
        related.innerHTML =
          '<div class="wrap"><div class="center"><h2 class="h2">עוד מהחנות</h2></div>' +
          '<div class="store-grid">' + pool.map(cardHTML).join("") + "</div></div>";
        related.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
      } else {
        related.style.display = "none";
      }
    }
  }
})();
