/* Eden Rusak — portfolio / media-kit page.
   Renders the UGC work carousels, divided by category.
   עדן: כשמגיעים הסרטונים, מחליפים כאן את ה-img בכל פריט בסרטון (poster + src),
   או פשוט מעדכנים את כתובת התמונה. אפשר גם להוסיף/להסיר פריטים בכל קטגוריה. */
(function () {
  "use strict";

  /* placeholder thumbnails — להחלפה בסרטונים אמיתיים בהמשך */
  function imgs(list) { return list.map(function (n) { return "assets/images/work/work-" + n + ".jpg"; }); }

  var CATEGORIES = [
    {
      id: "tech",
      label: "מוצרים טכנולוגיים",
      emblem: '<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><line x1="10" y1="18.5" x2="14" y2="18.5"/>',
      note: "גאדג'טים, אלקטרוניקה ומוצרי לייף-סטייל טכנולוגיים",
      items: imgs(["02", "07", "11", "15", "19", "24"])
    },
    {
      id: "fashion",
      label: "אופנה וביוטי",
      emblem: '<path d="M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6z"/>',
      note: "מותגי אופנה, קוסמטיקה, טיפוח ויופי",
      items: imgs(["03", "06", "09", "13", "20", "22"])
    },
    {
      id: "hospitality",
      label: "מלונאות ולייפסטייל",
      emblem: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>',
      note: "מלונות, נופש, חוויות ותוכן לייפסטייל",
      items: imgs(["01", "05", "10", "16", "18", "25"])
    },
    {
      id: "food",
      label: "מסעדות",
      emblem: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="3.2"/>',
      note: "מסעדות, בתי קפה וחוויות קולינריות",
      items: imgs(["04", "08", "12", "14", "17", "23"])
    }
  ];

  var host = document.getElementById("portfolioCats");
  if (!host) return;

  function cardHTML(src, label, i) {
    return '<div class="pf-card">' +
      '<div class="pf-card-media">' +
        '<img src="' + src + '" alt="' + label + ' — עבודת UGC ' + (i + 1) + '" loading="lazy">' +
        '<span class="pf-card-play" aria-hidden="true">▶</span>' +
      "</div></div>";
  }

  host.innerHTML = CATEGORIES.map(function (cat) {
    var cards = cat.items.map(function (src, i) { return cardHTML(src, cat.label, i); }).join("");
    return '<section class="section pf-cat tile-light">' +
      '<div class="wrap">' +
        '<div class="pf-cat-head">' +
          '<span class="pf-cat-emblem" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + cat.emblem + "</svg></span>" +
          '<h2 class="h2">' + cat.label + "</h2>" +
          '<p class="pf-cat-note">' + cat.note + "</p>" +
        "</div>" +
        '<div class="pf-row" data-row="' + cat.id + '">' +
          '<button class="shop-arrow shop-arrow-prev" type="button" aria-label="הקודם">›</button>' +
          '<div class="pf-track">' + cards + "</div>" +
          '<button class="shop-arrow shop-arrow-next" type="button" aria-label="הבא">‹</button>' +
        "</div>" +
      "</div></section>";
  }).join("");

  /* wire carousel arrows */
  host.querySelectorAll(".pf-row").forEach(function (row) {
    var track = row.querySelector(".pf-track");
    var prev = row.querySelector(".shop-arrow-prev");
    var next = row.querySelector(".shop-arrow-next");
    function step() { return Math.max(240, Math.round(track.clientWidth * 0.8)); }
    /* RTL: previous scrolls positive, next scrolls negative */
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });
  });
})();
