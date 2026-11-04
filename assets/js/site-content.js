/* Eden Rusak — live site content from the admin (academy.edenrusak.com/admin/site).
   - catalog: digital products. Every element marked data-p="<product id>" data-f="price|old|buy|title|short|img"
     follows the admin, so a price or link changes on every page at once.
   - media: which video sits where. Every container marked data-slot="<slot>" is rebuilt from the admin's choice.
   If the service is unavailable the static HTML stays exactly as it is. */
(function () {
  "use strict";
  var base = "https://lefqtffubkmxbsenptrc.supabase.co", key = "sb_publishable_P2XYPTQ1k6DkqUZ5txXGgw_j7v-hIqn";
  var controller = new AbortController(), timeout = setTimeout(function () { controller.abort(); }, 5000);
  var rows = fetch(base + "/rest/v1/eden_site_content?key=in.(catalog,media)&select=key,data", { signal: controller.signal, headers: { apikey: key, Authorization: "Bearer " + key } })
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
        else if (f === "img") { var i = url(p.img); if (i) el.src = i; }
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
        return '<video controls playsinline preload="none"' + (poster ? ' poster="' + poster + '"' : "") + ' aria-label="' + title + '"><source src="' + src + '" type="' + (/\.webm(\?|$)/i.test(src) ? "video/webm" : "video/mp4") + '"></video>';
      }).join("");
      var section = el.closest("section");
      if (section) section.hidden = !items.length;
      if (reel) reels = true;
    });
    if (reels && window.EDEN_initReels) window.EDEN_initReels();
  }

  rows.then(function (r) {
    try { applyProducts(r.catalog); } catch (e) {}
    try { applyMedia(r.media, r.catalog); } catch (e) {}
  });
})();
