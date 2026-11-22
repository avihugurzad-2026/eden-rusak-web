/* Only explicitly published aggregate metrics are read; no access credentials in the browser. */
(async function () {
  try {
    var response = await fetch("https://bestie.edenrusak.com/api/public/eden-insights", { credentials: "omit" });
    if (!response.ok) return;
    var data = await response.json();
    if (data.periodDays !== 28 || ![data.followers, data.reach, data.views].every(function (x) { return Number.isSafeInteger(x) && x >= 0; })) return;
    var date = new Date(data.updatedAt); if (isNaN(date.getTime())) return;
    var format = new Intl.NumberFormat("he-IL");
    document.getElementById("igFollowers").textContent = format.format(data.followers);
    document.getElementById("igReach").textContent = format.format(data.reach);
    document.getElementById("igViews").textContent = format.format(data.views);
    document.getElementById("igUpdated").textContent = "עודכן ב־" + new Intl.DateTimeFormat("he-IL").format(date);
    document.getElementById("instagramMetrics").hidden = false;
    document.getElementById("igUpdated").hidden = false;
  } catch (_) { /* Keep the contact alternative visible if the service is unavailable. */ }
})();
