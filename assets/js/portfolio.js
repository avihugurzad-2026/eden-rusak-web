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
      emblem: "📱",
      note: "גאדג'טים, אלקטרוניקה ומוצרי לייף-סטייל טכנולוגיים",
      items: imgs(["02", "07", "11", "15", "19", "24"])
    },
    {
      id: "fashion",
      label: "אופנה וביוטי",
      emblem: "💄",
      note: "מותגי אופנה, קוסמטיקה, טיפוח ויופי",
      items: imgs(["03", "06", "09", "13", "20", "22"])
    },
    {
      id: "hospitality",
      label: "מלונאות ולייפסטייל",
      emblem: "🏝️",
      note: "מלונות, נופש, חוויות ותוכן לייפסטייל",
      items: imgs(["01", "05", "10", "16", "18", "25"])
    },
    {
      id: "food",
      label: "מסעדות",
      emblem: "🍽️",
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
          '<span class="pf-cat-emblem" aria-hidden="true">' + cat.emblem + "</span>" +
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
