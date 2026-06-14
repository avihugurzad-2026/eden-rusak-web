/* Eden Rusak — workshops cards renderer (data-driven via workshops-data.js,
   merged with admin.html overrides through EDEN_DB). */
(function () {
  "use strict";
  var host = document.getElementById("workshopCards");
  if (!host) return;
  var LIST = (window.EDEN_DB ? EDEN_DB.get("workshops", window.EDEN_WORKSHOPS || []) : (window.EDEN_WORKSHOPS || []))
    .filter(function (w) { return w.active !== false; });

  host.innerHTML = LIST.map(function (w) {
    return '<div class="course-card">' +
      '<div class="course-media"><img src="' + w.img + '" alt="' + w.title + '" loading="lazy"></div>' +
      '<div class="course-body">' +
        (w.tag ? '<span class="tag">' + w.tag + "</span>" : "") +
        '<h3 class="h3">' + w.title + "</h3>" +
        (w.text ? "<p>" + w.text + "</p>" : "") +
        (w.cap ? '<p class="workshop-cap">' + w.cap + "</p>" : "") +
        (w.status ? '<p class="workshop-status">' + w.status + "</p>" : "") +
        (w.price ? '<div class="course-meta"><span class="course-price">' + w.price + "</span></div>" : "") +
        '<a href="' + w.link + '" class="btn btn-primary">' + (w.linkText || "לפרטים") + "</a>" +
      "</div></div>";
  }).join("");
})();
