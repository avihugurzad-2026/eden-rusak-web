/* Eden Rusak — travel guides. Content comes from the admin (eden_site_content, key "travel"):
   { destinations: [{ slug, name, country, region, styles: [], cover, summary, published,
     sections: [{ title, text }], hotels: [{ name, url, note }], food: [{ name, url, note }], tips: [] }] }
   /recommendations/travel lists published destinations; /recommendations/travel/<slug> shows one. */
(function () {
  "use strict";
  var base = "https://lefqtffubkmxbsenptrc.supabase.co", key = "sb_publishable_P2XYPTQ1k6DkqUZ5txXGgw_j7v-hIqn";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function safe(u) {
    if (!u) return "";
    if (/^\/?assets\//.test(u)) return u.charAt(0) === "/" ? u : "/" + u;
    try { var x = new URL(u); return x.protocol === "https:" ? x.href : ""; } catch (e) { return ""; }
  }
  function paras(t) { return String(t || "").split(/\n{2,}/).map(function (p) { return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>"; }).join(""); }
  var data = fetch(base + "/rest/v1/eden_site_content?key=eq.travel&select=data", { headers: { apikey: key, Authorization: "Bearer " + key } })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) { var d = rows[0] && rows[0].data; return (d && Array.isArray(d.destinations) ? d.destinations : []).filter(function (x) { return x && x.slug && x.name && x.published !== false; }); })
    .catch(function () { return []; });

  var grid = document.getElementById("tripGrid");
  if (grid) data.then(function (list) {
    var empty = document.getElementById("tripEmpty"), filters = document.getElementById("tripFilters");
    if (!list.length) { empty.hidden = false; return; }
    function card(d) {
      var img = safe(d.cover);
      return '<a class="trip-card" href="/recommendations/travel/' + encodeURIComponent(d.slug) + '" data-region="' + esc(d.region || "") + '">' +
        (img ? '<img loading="lazy" src="' + esc(img) + '" alt="' + esc(d.name) + '">' : '<span class="trip-card-ph" aria-hidden="true"></span>') +
        '<span class="trip-card-body"><b>' + esc(d.name) + "</b>" + (d.country ? "<small>" + esc(d.country) + "</small>" : "") +
        (d.summary ? "<span>" + esc(d.summary) + "</span>" : "") + "</span></a>";
    }
    grid.innerHTML = list.map(card).join("");
    var regions = list.map(function (d) { return d.region; }).filter(function (r, i, a) { return r && a.indexOf(r) === i; });
    if (regions.length > 1) {
      filters.innerHTML = ['<button class="store-chip active" data-r="">הכל</button>'].concat(regions.map(function (r) { return '<button class="store-chip" data-r="' + esc(r) + '">' + esc(r) + "</button>"; })).join("");
      filters.hidden = false;
      filters.addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        filters.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
        grid.querySelectorAll(".trip-card").forEach(function (c) { c.hidden = !!b.dataset.r && c.dataset.region !== b.dataset.r; });
      });
    }
  });

  var page = document.getElementById("tripPage");
  if (page) data.then(function (list) {
    var slug = decodeURIComponent(location.pathname.replace(/\/$/, "").split("/").pop());
    var d = list.filter(function (x) { return x.slug === slug; })[0];
    if (!d) {
      document.getElementById("tripTitle").textContent = "היעד לא נמצא";
      page.insertAdjacentHTML("beforeend", '<section class="section"><div class="wrap center"><a class="btn btn-primary" href="/recommendations/travel">לכל היעדים</a></div></section>');
      return;
    }
    document.title = d.name + " — מדריך יעד | עדן רוסק";
    document.getElementById("tripTitle").textContent = d.name;
    function list2(title, items) {
      items = (items || []).filter(function (x) { return x && x.name; });
      if (!items.length) return "";
      return "<h2 class=\"h3\">" + title + '</h2><ul class="trip-list">' + items.map(function (x) {
        var u = safe(x.url);
        return "<li>" + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer sponsored">' + esc(x.name) + "</a>" : "<b>" + esc(x.name) + "</b>") + (x.note ? " — " + esc(x.note) : "") + "</li>";
      }).join("") + "</ul>";
    }
    var img = safe(d.cover);
    var html = '<section class="section"><div class="wrap wrap-text trip-body">' +
      (img ? '<img class="trip-cover" src="' + esc(img) + '" alt="' + esc(d.name) + '">' : "") +
      (d.summary ? '<p class="lead">' + esc(d.summary) + "</p>" : "") +
      (d.sections || []).filter(function (s) { return s && (s.title || s.text); }).map(function (s) { return (s.title ? '<h2 class="h3">' + esc(s.title) + "</h2>" : "") + paras(s.text); }).join("") +
      list2("איפה לישון", d.hotels) + list2("איפה לאכול", d.food) +
      ((d.tips || []).length ? '<h2 class="h3">טיפים</h2><ul class="trip-list">' + d.tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") +
      '<p class="trip-note">חלק מהקישורים הם קישורי שותפים. <a href="/disclosure">גילוי נאות</a></p>' +
      '<p style="margin-top:30px"><a class="btn btn-outline" href="/recommendations/travel">לכל היעדים</a></p></div></section>';
    page.insertAdjacentHTML("beforeend", html);
  });
}());
