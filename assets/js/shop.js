/* Eden Rusak — recommendations store renderer
   Renders category carousels on recommendations.html and the product page. */
(function () {
  "use strict";
  /* admin.html edits are merged in via EDEN_DB (localStorage overrides) */
  var PRODUCTS = window.EDEN_DB ? EDEN_DB.get("recProducts", window.EDEN_PRODUCTS || []) : (window.EDEN_PRODUCTS || []);
  var CATS = window.EDEN_DB ? EDEN_DB.get("recCategories", window.EDEN_CATEGORIES || []) : (window.EDEN_CATEGORIES || []);
  PRODUCTS = PRODUCTS.filter(function (p) { return p.active !== false; });

  function byId(id) { for (var i = 0; i < PRODUCTS.length; i++) { if (PRODUCTS[i].id === id) return PRODUCTS[i]; } return null; }
  function inCat(key) { return PRODUCTS.filter(function (p) { return p.cat === key; }); }
  function catLabel(key) { for (var i = 0; i < CATS.length; i++) { if (CATS[i].key === key) return CATS[i].label; } return ""; }

  function cardHTML(p) {
    var coupon = p.coupon ? '<span class="shop-card-coupon">קוד: ' + p.coupon + '</span>' : '';
    return '' +
      '<a class="shop-card" href="product.html?id=' + encodeURIComponent(p.id) + '">' +
        '<span class="shop-card-media"><img src="' + p.img + '" alt="' + p.title + '" loading="lazy"></span>' +
        '<span class="shop-card-body">' +
          '<span class="shop-card-cat">' + catLabel(p.cat) + '</span>' +
          '<span class="shop-card-title">' + p.title + '</span>' +
          '<span class="shop-card-text">' + p.short + '</span>' +
          '<span class="shop-card-foot">' + coupon + '<span class="shop-card-link">לפרטים ‹</span></span>' +
        '</span>' +
      '</a>';
  }

  function buildRow(list) {
    var row = document.createElement("div");
    row.className = "shop-row";
    var track = document.createElement("div");
    track.className = "shop-track";
    track.innerHTML = list.map(cardHTML).join("");
    row.appendChild(track);
    // arrows
    var prev = document.createElement("button");
    prev.className = "shop-arrow shop-arrow-prev"; prev.setAttribute("aria-label", "הקודם"); prev.innerHTML = "›";
    var next = document.createElement("button");
    next.className = "shop-arrow shop-arrow-next"; next.setAttribute("aria-label", "הבא"); next.innerHTML = "‹";
    function step(dir) { track.scrollBy({ left: dir * Math.min(track.clientWidth * 0.8, 520), behavior: "smooth" }); }
    prev.addEventListener("click", function () { step(1); });   // RTL: prev scrolls right (positive)
    next.addEventListener("click", function () { step(-1); });
    row.appendChild(prev); row.appendChild(next);
    return row;
  }

  /* ---------- Recommendations page ---------- */
  var shopRoot = document.getElementById("shopCategories");
  if (shopRoot) {
    CATS.forEach(function (c) {
      var list = inCat(c.key);
      if (!list.length) return;
      var sec = document.createElement("section");
      sec.className = "shop-cat";
      sec.id = "cat-" + c.key;
      sec.innerHTML =
        '<div class="wrap"><div class="shop-cat-head">' +
        '<h2 class="h2">' + c.label + '</h2>' +
        (c.note ? '<p class="shop-cat-note">' + c.note + '</p>' : '') +
        '</div></div>';
      var wrap = document.createElement("div");
      wrap.className = "wrap";
      wrap.appendChild(buildRow(list));
      sec.appendChild(wrap);
      shopRoot.appendChild(sec);
    });
  }

  /* ---------- Product page ---------- */
  var detail = document.getElementById("productDetail");
  if (detail) {
    var params = new URLSearchParams(window.location.search);
    var p = byId(params.get("id")) || PRODUCTS[0];
    if (!p) return;
    document.title = p.title + " — עדן רוסק";

    var couponBlock = p.coupon
      ? '<div class="pd-coupon"><span class="pd-coupon-label">קוד קופון של עדן</span>' +
        '<div class="pd-coupon-row"><code id="pdCode">' + p.coupon + '</code>' +
        '<button type="button" class="pd-copy" id="pdCopy">העתקה</button></div>' +
        '<p class="pd-coupon-note">הזינו את הקוד בעמוד הרכישה ותיהנו מהטבה.</p></div>'
      : '<div class="pd-coupon pd-coupon-empty"><span class="pd-coupon-label">קוד קופון</span>' +
        '<p class="pd-coupon-note">אין כרגע קוד קופון פעיל למוצר זה.</p></div>';

    detail.innerHTML =
      '<div class="wrap"><nav class="pd-breadcrumb"><a href="recommendations.html">המומלצים שלי</a> <span>›</span> <span>' + catLabel(p.cat) + '</span></nav>' +
      '<div class="pd-grid">' +
        '<div class="pd-gallery"><div class="pd-main"><img src="' + p.img + '" alt="' + p.title + '"></div></div>' +
        '<div class="pd-info">' +
          '<span class="pd-cat">' + catLabel(p.cat) + '</span>' +
          '<h1 class="pd-title">' + p.title + '</h1>' +
          '<p class="pd-desc">' + p.desc + '</p>' +
          couponBlock +
          '<a class="btn btn-primary btn-lg pd-buy" href="' + (p.buy || "#") + '" target="_blank" rel="noopener">לרכישת המוצר</a>' +
          '<p class="fine pd-affiliate">* ייתכן שהקישור כולל קישור שותפים. אני ממליצה רק על מוצרים שאני באמת משתמשת בהם.</p>' +
        '</div>' +
      '</div></div>';

    var copyBtn = document.getElementById("pdCopy");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var code = (document.getElementById("pdCode") || {}).textContent || "";
        var done = function () { copyBtn.textContent = "הועתק!"; setTimeout(function () { copyBtn.textContent = "העתקה"; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(done, done); }
        else { done(); }
      });
    }

    /* Related — "מוצרים נוספים בסגנון" from several categories */
    var related = document.getElementById("productRelated");
    if (related) {
      var pool = PRODUCTS.filter(function (x) { return x.id !== p.id; });
      // shuffle
      for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      var pick = pool.slice(0, 10);
      var wrapEl = document.createElement("div");
      wrapEl.className = "wrap";
      wrapEl.innerHTML = '<div class="shop-cat-head"><h2 class="h2">מוצרים נוספים בסגנון</h2></div>';
      wrapEl.appendChild(buildRow(pick));
      related.appendChild(wrapEl);
    }
  }
})();
