/* Annual content & marketing planner, Oct 2026 – Oct 2027.
   Mirrors the eight sheets of the planning workbook. All user text is written
   with .value / .textContent, never into innerHTML. */
(function () {
  "use strict";

  // ---------- fixed data from the workbook ----------
  var HE_MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  var HE_DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  // 13 planning months: Oct 2026 .. Oct 2027
  var MONTHS = [];
  for (var i = 0; i < 13; i++) {
    var y = 2026 + Math.floor((9 + i) / 12), m = (9 + i) % 12;
    MONTHS.push({ y: y, m: m, label: HE_MONTHS[m] + " " + String(y).slice(2) });
  }
  // 15 calendar months: Oct 2026 .. Dec 2027
  var CAL = [];
  for (var j = 0; j < 15; j++) {
    var cy = 2026 + Math.floor((9 + j) / 12), cm = (9 + j) % 12;
    CAL.push({ y: cy, m: cm, label: HE_MONTHS[cm] + " " + cy });
  }

  var HOLIDAYS = {"2026-10-01":"חול המועד סוכות","2026-10-02":"הושענא רבה","2026-10-03":"שמיני עצרת / שמחת תורה","2026-12-05":"חנוכה","2026-12-06":"חנוכה","2026-12-07":"חנוכה","2026-12-08":"חנוכה","2026-12-09":"חנוכה","2026-12-10":"חנוכה","2026-12-11":"חנוכה","2026-12-12":"חנוכה","2027-01-23":"ט״ו בשבט","2027-03-23":"פורים","2027-03-24":"שושן פורים","2027-04-22":"פסח","2027-04-23":"חול המועד פסח","2027-04-24":"חול המועד פסח","2027-04-25":"חול המועד פסח","2027-04-26":"חול המועד פסח","2027-04-27":"חול המועד פסח","2027-04-28":"שביעי של פסח","2027-05-12":"יום העצמאות","2027-05-25":"ל״ג בעומר","2027-06-11":"שבועות","2027-08-18":"ט״ו באב","2027-10-02":"ראש השנה א׳","2027-10-03":"ראש השנה ב׳","2027-10-11":"יום כיפור","2027-10-16":"סוכות","2027-10-17":"חול המועד סוכות","2027-10-18":"חול המועד סוכות","2027-10-19":"חול המועד סוכות","2027-10-20":"חול המועד סוכות","2027-10-21":"חול המועד סוכות","2027-10-22":"הושענא רבה","2027-10-23":"שמיני עצרת / שמחת תורה","2027-12-25":"חנוכה","2027-12-26":"חנוכה","2027-12-27":"חנוכה","2027-12-28":"חנוכה","2027-12-29":"חנוכה","2027-12-30":"חנוכה","2027-12-31":"חנוכה"};

  var CATS = [
    { k: "decision", label: "החלטות / למילוי" },
    { k: "sale", label: "מעמד מכירה / הכנסה" },
    { k: "warm", label: "חימום והכנה" },
    { k: "deliv", label: "אספקה / לקוחות" },
    { k: "vac", label: "חופש / שבת" },
    { k: "hol", label: "חג / מועד" }
  ];
  var CAT_LABEL = {};
  CATS.forEach(function (c) { CAT_LABEL[c.k] = c.label; });

  var STEPS = [
    ["קודם כל החיים עצמם", "הכניסי חופשות, חגים, ימי משפחה, תקופות עומס וימים שבהם לא תרצי לעבוד."],
    ["אחר כך המספרים", "הגדירי יעד הכנסה שנתי, מוצרים מרכזיים, תקציב שיווק ויעדי מכירות."],
    ["מקמי מעמדי מכירה", "סמני מתי את רוצה למכור, ואז תכנני אחורה את החימום, ההכנה והנכסים שצריך ליצור."],
    ["בדקי את העומס", "אל תתכנני השקה בתוך חופשה, אספקת מוצר גדול ליד קמפיין נוסף, או יותר מדי מהלכים באותו חודש."],
    ["תכנני ברמת מאקרו", "פעם ברבעון חזרי לכאן, בדקי מה השתנה ועדכני את 90 הימים הבאים."]
  ];
  var QUESTIONS = [
    "מה הדבר העיקרי שאני רוצה שיקרה בעסק עד אוקטובר 2027?",
    "כמה הכנסה אני רוצה לייצר בשנה הזו?",
    "אילו 1–3 מוצרים / שירותים הם מנועי ההכנסה המרכזיים שלי?",
    "כמה מעמדי מכירה באמת נדרשים כדי להגיע ליעד?",
    "באילו חודשים אני רוצה לעבוד פחות / להיות בחופש?",
    "באילו חודשים יש עומס אספקה או עבודה עם לקוחות?",
    "איזה מהלך אחד יקבל פוקוס בכל חודש?"
  ];
  var NUMBERS = [
    ["income", "יעד הכנסה שנתי (₪)", "number"],
    ["clients", "יעד לקוחות / מכירות חדשות", "number"],
    ["list", "יעד גידול רשימת תפוצה", "number"],
    ["budget", "תקציב שיווק שנתי (₪)", "number"],
    ["vacdays", "מספר ימי חופש מתוכננים", "number"]
  ];
  var RULES = [
    "לא מתכננים רק את יום המכירה. מסמנים גם זמן חימום, בניית עמודים, מיילים ותוכן, וזמן אספקה אחרי המכירה.",
    "חודש שיש בו חופש משמעותי הוא לא חודש רגיל. מורידים ממנו ציפיות מראש.",
    "אם יש שני מעמדי מכירה באותו חודש, שאלי האם יש ביניהם קהל, מסר ומשאבים שונים, או שעדיף לבחור אחד.",
    "השאירי לפחות חודש אחד או תקופה אחת בשנה בלי מהלך מכירה גדול, כדי לאפשר התאוששות, פיתוח ושיפור.",
    "פעם ב־90 יום עדכני את התוכנית לפי מה שעבד בפועל. התכנון הוא מצפן, לא חוזה."
  ];
  var MAP_ROWS = [
    ["focus", "המטרה / המיקוד העסקי של החודש", "text"],
    ["product", "המוצר / השירות המרכזי", "text"],
    ["sale", "מעמד המכירה המרכזי", "text"],
    ["deadline", "תאריך מרכזי / דדליין", "text"],
    ["warm", "תקופת חימום / יצירת ביקוש", "text"],
    ["income", "יעד הכנסה (₪)", "number"],
    ["clients", "יעד מכירות / לקוחות", "number"],
    ["budget", "תקציב שיווק (₪)", "number"],
    ["deliv", "תקופת אספקה / עבודה עם לקוחות", "text"],
    ["vac", "חופש / אי זמינות", "text"],
    ["dev", "פרויקט פיתוח פנימי", "text"],
    ["collab", "שיתוף פעולה / אירוע", "text"],
    ["load", "רמת עומס מתוכננת 1–5", "load"],
    ["not", "מה לא עושים החודש", "text"],
    ["notes", "הערות", "text"]
  ];
  var SALE_TYPES = ["השקה", "וובינר", "סדנה", "קורס / קבוצה", "מבצע", "חלון מכירה", "שיתוף פעולה", "מכירה שוטפת", "אחר"];
  var CHANNELS = ["אינסטגרם", "פייסבוק", "מייל", "וובינר", "קהילה", "וואטסאפ", "פרסום ממומן", "שותפים", "אחר"];
  var STATUSES = ["רעיון", "מתוכנן", "בהכנה", "מוכן", "הושלם", "נדחה"];
  var VAC_TYPES = ["חופש", "משפחה", "חג", "כנס / אירוע", "עומס לקוחות", "מחלה / בלת״מ", "אחר"];
  var ACTIVE = ["כן", "חלקית", "לא"];
  var PRESET_DATES = [
    ["2026-10-01", "חול המועד סוכות", "חג / חופשה"], ["2026-10-03", "שמיני עצרת / שמחת תורה", "חג / חופשה"],
    ["2026-11-27", "Black Friday", "מועד מסחרי"], ["2026-11-30", "Cyber Monday", "מועד מסחרי"],
    ["2026-12-05", "חנוכה", "חג / חופשה"], ["2027-01-01", "פתיחת השנה האזרחית", "תוכן / מסחרי"],
    ["2027-02-14", "Valentine’s Day", "תוכן / מסחרי"], ["2027-03-08", "יום האישה הבינלאומי", "תוכן / קמפיין"],
    ["2027-03-23", "פורים", "חג / חופשה"], ["2027-04-22", "פסח", "חג / חופשה"],
    ["2027-05-12", "יום העצמאות", "חג / חופשה"], ["2027-05-25", "ל״ג בעומר", "מועד / תוכן"],
    ["2027-06-11", "שבועות", "חג / חופשה"], ["2027-07-01", "תקופת החופש הגדול", "עונתיות / חופשה"],
    ["2027-08-18", "ט״ו באב", "תוכן / קמפיין"], ["2027-09-01", "חזרה ללימודים", "עונתיות"],
    ["2027-10-02", "ראש השנה", "חג / חופשה"], ["2027-10-11", "יום כיפור", "חג / חופשה"],
    ["2027-10-16", "סוכות", "חג / חופשה"]
  ];
  var GOAL_ROWS = [
    ["p1", "מוצר / שירות 1", "named"], ["p2", "מוצר / שירות 2", "named"], ["p3", "מוצר / שירות 3", "named"],
    ["other", "הכנסה אחרת", "plain"]
  ];
  var GOAL_ROWS_2 = [
    ["budget", "תקציב שיווק מתוכנן (₪)"], ["sales", "יעד מכירות / לקוחות"],
    ["leads", "יעד לידים / נרשמים"], ["list", "יעד גידול רשימת תפוצה"]
  ];
  var ACTUAL_ROWS = [["actual", "הכנסה בפועל (₪)"], ["ads", "השקעה בפרסום ממומן (₪)"]];
  var CHECKS = [
    "האם יעד ההכנסה תואם את מספר מעמדי המכירה שתכננתי?",
    "האם התקציב השיווקי מספיק ביחס ליעד?",
    "האם יש חודשים שבהם אני מצפה להכנסה גבוהה דווקא כשאני בחופש?",
    "האם ההכנסה מפוזרת על יותר מדי מוצרים?",
    "איזה מוצר צריך לקבל את רוב הפוקוס השנה?"
  ];
  var Q90_ROWS = [
    ["goal", "מטרה מרכזית"], ["product", "מוצר / שירות בפוקוס"], ["sale", "מעמד מכירה"],
    ["audience", "קהל / מסר מרכזי"], ["prep", "מה צריך להכין"], ["content", "תוכן / חימום"],
    ["discover", "ערוץ גילוי"], ["deepen", "ערוץ העמקה"], ["where", "מקום המכירה"],
    ["metric", "מדד הצלחה"], ["not", "מה לא עושים"]
  ];
  var QUARTERS = [
    { label: "אוקטובר–דצמבר 2026", months: [0, 1, 2] },
    { label: "ינואר–מרץ 2027", months: [3, 4, 5] },
    { label: "אפריל–יוני 2027", months: [6, 7, 8] },
    { label: "יולי–ספטמבר 2027", months: [9, 10, 11] },
    { label: "אוקטובר 2027", months: [12] }
  ];
  var TABS = [
    ["start", "התחלה"], ["map", "מפת השנה"], ["cal", "לוח שנה"], ["sales", "מעמדי מכירה"],
    ["avail", "חופשות וזמינות"], ["dates", "מועדים והזדמנויות"], ["goals", "יעדים והכנסות"], ["q90", "תכנון 90 יום"]
  ];

  // ---------- helpers ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function getPath(o, p) {
    var parts = p.split(".");
    for (var i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; }
    return o;
  }
  function setPath(o, p, v) {
    var parts = p.split(".");
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (o[k] == null || typeof o[k] !== "object") o[k] = /^\d+$/.test(parts[i + 1]) && Array.isArray(o[k]) ? [] : {};
      o = o[k];
    }
    o[parts[parts.length - 1]] = v;
  }
  function num(v) {
    if (v == null || v === "") return 0;
    var n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
    return isFinite(n) ? n : 0;
  }
  function filled(v) { return v != null && String(v).trim() !== ""; }
  function money(n) { return "₪" + Math.round(n).toLocaleString("he-IL"); }
  function count(n) { return Math.round(n).toLocaleString("he-IL"); }
  function iso(y, m, d) { return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0"); }
  function parseIso(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function fmtDate(s) {
    var d = parseIso(s);
    return d ? d.getDate() + "." + (d.getMonth() + 1) + "." + String(d.getFullYear()).slice(2) : "";
  }
  function monthIndexOf(s) {
    var d = parseIso(s);
    if (!d) return -1;
    var idx = (d.getFullYear() - 2026) * 12 + d.getMonth() - 9;
    return idx >= 0 && idx < 13 ? idx : -1;
  }
  function options(list, includeEmpty) {
    return (includeEmpty ? '<option value="">בחירה</option>' : "") +
      list.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + "</option>"; }).join("");
  }

  // ---------- state ----------
  var S = null, root = null, onChange = null;
  var ui = { tab: "start", calIdx: 0, brush: "", day: null, open: {}, quarter: 0 };

  function normalize(c) {
    c = c && typeof c === "object" ? JSON.parse(JSON.stringify(c)) : {};
    c.v = 1;
    c.start = c.start || { q: {}, n: {} };
    c.start.q = c.start.q || {}; c.start.n = c.start.n || {};
    c.map = c.map || {};
    c.days = c.days || {};
    c.sales = Array.isArray(c.sales) ? c.sales : [];
    c.vac = Array.isArray(c.vac) ? c.vac : [];
    c.cap = c.cap || {};
    if (!Array.isArray(c.dates)) {
      c.dates = PRESET_DATES.map(function (d) { return { date: d[0], name: d[1], type: d[2], rel: "", idea: "", prep: "", notes: "", preset: true }; });
    }
    c.goals = c.goals || {};
    c.goals.names = c.goals.names || {};
    c.checks = c.checks || {};
    c.q90 = c.q90 || {};
    return c;
  }

  function changed() { if (onChange) onChange(); }

  // ---------- derived ----------
  function mapVal(row, m) { return getPath(S, "map." + row + "." + m); }

  function warnings() {
    var out = [];
    var saleMonths = 0;
    for (var m = 0; m < 13; m++) {
      var label = MONTHS[m].label;
      var sale = filled(mapVal("sale", m));
      if (sale) saleMonths++;
      if (sale && filled(mapVal("vac", m))) out.push("ב" + label + " מתוכנן גם מעמד מכירה וגם חופש. כדאי להזיז אחד מהם או להוריד ציפיות מהחודש.");
      if (sale && filled(mapVal("deliv", m))) out.push("ב" + label + " יש גם מכירה וגם תקופת אספקה. בדקי שיש לך מספיק זמן לשניהם.");
      var load = num(mapVal("load", m));
      if (load >= 4 && sale) out.push("רמת העומס ב" + label + " היא " + load + " מתוך 5, ויש בו גם מעמד מכירה.");
      var cap = getPath(S, "cap." + m + ".cap");
      if (num(cap) > 0 && num(cap) <= 2 && sale) out.push("הקיבולת שהגדרת ל" + label + " נמוכה (" + num(cap) + " מתוך 5), אבל מתוכנן בו מעמד מכירה.");
    }
    // two sale events opening in the same month
    var byMonth = {};
    S.sales.forEach(function (ev) {
      var mi = monthIndexOf(ev.open || ev.date);
      if (mi < 0) return;
      (byMonth[mi] = byMonth[mi] || []).push(ev.name || "מעמד ללא שם");
    });
    Object.keys(byMonth).forEach(function (mi) {
      if (byMonth[mi].length > 1) out.push("ב" + MONTHS[mi].label + " נפתחים " + byMonth[mi].length + " מעמדי מכירה: " + byMonth[mi].join(", ") + ". יש ביניהם קהל ומסר שונים?");
    });
    // vacation periods overlapping a sale window
    S.vac.forEach(function (v) {
      var vf = parseIso(v.from), vt = parseIso(v.to || v.from);
      if (!vf || !vt) return;
      S.sales.forEach(function (ev) {
        var so = parseIso(ev.open), sc = parseIso(ev.close || ev.open);
        if (!so || !sc) return;
        if (vf <= sc && vt >= so) out.push("החופש \"" + (v.what || "ללא שם") + "\" חופף לחלון המכירה של \"" + (ev.name || "מעמד ללא שם") + "\".");
      });
    });
    if (saleMonths === 13) out.push("בכל 13 החודשים מתוכנן מעמד מכירה. השאירי לפחות חודש אחד בלי מהלך גדול, להתאוששות ולפיתוח.");
    return out;
  }

  function sums() {
    var income = 0, budget = 0, saleM = 0, vacM = 0;
    for (var m = 0; m < 13; m++) {
      income += num(mapVal("income", m));
      budget += num(mapVal("budget", m));
      if (filled(mapVal("sale", m))) saleM++;
      if (filled(mapVal("vac", m))) vacM++;
    }
    return { income: income, budget: budget, saleM: saleM, vacM: vacM };
  }

  // ---------- binding ----------
  // grow table textareas to their content (fallback where field-sizing is unsupported)
  var FIELD_SIZING = typeof CSS !== "undefined" && CSS.supports && CSS.supports("field-sizing", "content");
  function autosize(ta) {
    if (FIELD_SIZING || !ta.closest("table")) return;
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + 2 + "px";
  }
  function hydrate(scope) {
    scope.querySelectorAll("[data-b]").forEach(function (el) {
      var v = getPath(S, el.getAttribute("data-b"));
      el.value = v == null ? "" : v;
    });
    if (!FIELD_SIZING) scope.querySelectorAll("table textarea").forEach(autosize);
  }

  function onInput(e) {
    var el = e.target;
    var path = el.getAttribute && el.getAttribute("data-b");
    if (!path) return;
    setPath(S, path, el.value);
    if (el.tagName === "TEXTAREA") autosize(el);
    refreshDerived(el);
    changed();
  }

  function refreshDerived(el) {
    var t = ui.tab;
    if (t === "map") {
      renderMapSummary();
      if (el && el.matches("select[data-load]")) {
        var td = el.closest("td");
        td.className = "pl-num" + (el.value ? " pl-load-" + el.value : "");
      }
    } else if (t === "goals") {
      renderGoalTotals();
    } else if (t === "sales") {
      renderTimeline();
      var rec = el && el.closest(".pl-rec");
      if (rec) updateRecSummary(rec, +rec.getAttribute("data-i"));
    } else if (t === "dates") {
      if (el && el.getAttribute("data-b").slice(-4) === ".rel") {
        el.closest("tr").classList.toggle("is-muted", el.value === "לא");
      }
    } else if (t === "avail") {
      var tr = el && el.closest("tr[data-cap]");
      if (tr) markCapRisk(tr, +tr.getAttribute("data-cap"));
    }
  }

  // ---------- render: shell ----------
  function renderShell() {
    root.innerHTML =
      '<div class="pl">' +
      '<div class="pl-title"><h2>תכנון שנה שיווקית</h2><span>אוקטובר 2026 – אוקטובר 2027</span></div>' +
      '<div class="pl-tabs no-print-tabs" role="tablist" aria-label="חלקי התכנון">' +
      TABS.map(function (t) {
        return '<button type="button" class="pl-tab" role="tab" id="pl-tab-' + t[0] + '" data-tab="' + t[0] + '" aria-controls="pl-panel" aria-selected="' + (ui.tab === t[0]) + '">' + t[1] + "</button>";
      }).join("") +
      "</div>" +
      '<div class="pl-panel" id="pl-panel" role="tabpanel" aria-labelledby="pl-tab-' + ui.tab + '"></div>' +
      "</div>";
    root.querySelectorAll(".pl-tab").forEach(function (b) {
      b.addEventListener("click", function () { showTab(b.getAttribute("data-tab")); });
    });
    root.querySelector(".pl-tabs").addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var idx = TABS.findIndex(function (t) { return t[0] === ui.tab; });
      // RTL: left arrow moves forward
      idx = (idx + (e.key === "ArrowLeft" ? 1 : -1) + TABS.length) % TABS.length;
      showTab(TABS[idx][0]);
      root.querySelector("#pl-tab-" + TABS[idx][0]).focus();
    });
    root.addEventListener("input", onInput);
    root.addEventListener("change", onInput);
  }

  function showTab(t) {
    ui.tab = t;
    root.querySelectorAll(".pl-tab").forEach(function (b) {
      var on = b.getAttribute("data-tab") === t;
      b.setAttribute("aria-selected", on);
      b.tabIndex = on ? 0 : -1;
      if (on) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    var panel = root.querySelector("#pl-panel");
    panel.setAttribute("aria-labelledby", "pl-tab-" + t);
    ({ start: renderStart, map: renderMap, cal: renderCal, sales: renderSales, avail: renderAvail, dates: renderDates, goals: renderGoals, q90: renderQ90 })[t](panel);
  }

  // ---------- tab: start ----------
  function renderStart(p) {
    p.innerHTML =
      '<section class="pl-sec"><p class="pl-lead">המטרה: לראות את השנה מלמעלה לפני שנכנסים לתוכן ולמשימות היומיות. מסמנים חופשות, עומסים, מעמדי מכירה, זמן הכנה, יעדים ומספרים.</p></section>' +
      '<section class="pl-sec"><h3>איך עובדים עם התכנון</h3><ol class="pl-steps">' +
      STEPS.map(function (s) { return "<li><b>" + esc(s[0]) + ".</b> " + esc(s[1]) + "</li>"; }).join("") +
      "</ol></section>" +
      '<section class="pl-sec"><h3>מספרים שנתיים</h3><p class="pl-note">ממלאים לפני התכנון. אפשר לעדכן בכל רגע.</p><div class="pl-qs">' +
      NUMBERS.map(function (n) {
        return '<label class="pl-f"><span>' + esc(n[1]) + '</span><input type="number" inputmode="numeric" min="0" id="pl-n-' + n[0] + '" data-b="start.n.' + n[0] + '"></label>';
      }).join("") +
      "</div></section>" +
      '<section class="pl-sec"><h3>שאלות שחייבים לענות עליהן לפני שמתחילים</h3><div class="pl-qs">' +
      QUESTIONS.map(function (q, i) {
        return '<label class="pl-f"><span>' + esc(q) + '</span><textarea rows="3" id="pl-q-' + i + '" data-b="start.q.' + i + '"></textarea></label>';
      }).join("") +
      "</div></section>" +
      '<section class="pl-sec"><h3>מקרא הצבעים בלוח השנה</h3><div class="pl-legend">' +
      CATS.map(function (c) { return '<span class="chip cat-' + c.k + '"><span class="pl-swatch"></span>' + esc(c.label) + "</span>"; }).join("") +
      "</div></section>" +
      '<section class="pl-sec"><h3>כללי אצבע לשנה שלא תעמיס על העסק</h3><ul class="pl-rules">' +
      RULES.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") +
      "</ul></section>";
    hydrate(p);
  }

  // ---------- tab: year map ----------
  function renderMap(p) {
    var head = "<tr><th scope=\"col\">מה מתכננים</th>" + MONTHS.map(function (mo) { return '<th scope="col">' + esc(mo.label) + "</th>"; }).join("") + "</tr>";
    var body = MAP_ROWS.map(function (r) {
      var cells = MONTHS.map(function (mo, m) {
        var path = "map." + r[0] + "." + m;
        var aria = 'aria-label="' + esc(r[1] + ", " + mo.label) + '"';
        if (r[2] === "number") return '<td class="pl-num"><input type="number" inputmode="numeric" min="0" ' + aria + ' data-b="' + path + '"></td>';
        if (r[2] === "load") {
          var lv = mapVal("load", m);
          return '<td class="pl-num' + (lv ? " pl-load-" + lv : "") + '"><select data-load="1" ' + aria + ' data-b="' + path + '"><option value="">–</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></td>';
        }
        return '<td><textarea rows="2" ' + aria + ' data-b="' + path + '"></textarea></td>';
      }).join("");
      return '<tr><th scope="row">' + esc(r[1]) + "</th>" + cells + "</tr>";
    }).join("");
    p.innerHTML =
      '<section class="pl-sec"><h3>סיכום המספרים המתוכננים</h3><dl class="pl-sum" id="pl-map-sum"></dl></section>' +
      '<section class="pl-sec"><h3>בדיקת עומס</h3><div id="pl-map-warn"></div></section>' +
      '<section class="pl-sec"><h3>מפת השנה</h3><p class="pl-note">שורה לכל נושא, עמודה לכל חודש. הטבלה נגללת הצידה, ושם השורה נשאר במקום.</p>' +
      '<div class="pl-scroll"><table class="pl-grid"><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div></section>";
    hydrate(p);
    renderMapSummary();
  }

  function renderMapSummary() {
    var s = sums();
    var sum = root.querySelector("#pl-map-sum");
    if (sum) {
      sum.textContent = "";
      [["סך יעד הכנסה לשנה", money(s.income)], ["סך תקציב שיווק", money(s.budget)],
       ["חודשים עם מעמד מכירה", count(s.saleM) + " מתוך 13"], ["חודשים עם חופש", count(s.vacM) + " מתוך 13"]].forEach(function (x) {
        var d = document.createElement("div");
        var dt = document.createElement("dt"); dt.textContent = x[0];
        var dd = document.createElement("dd"); dd.textContent = x[1];
        d.appendChild(dt); d.appendChild(dd); sum.appendChild(d);
      });
    }
    var w = root.querySelector("#pl-map-warn");
    if (w) {
      w.textContent = "";
      var list = warnings();
      if (!list.length) {
        var ok = document.createElement("p");
        ok.className = "pl-ok";
        ok.textContent = "אין התנגשויות כרגע. הבדיקה רצה על מפת השנה, מעמדי המכירה והחופשות, ומתעדכנת בזמן שאת ממלאת.";
        w.appendChild(ok);
      } else {
        var ul = document.createElement("ul");
        ul.className = "pl-warn";
        list.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
        w.appendChild(ul);
      }
    }
  }

  // ---------- tab: calendar ----------
  function todayIso() { var d = new Date(); return iso(d.getFullYear(), d.getMonth(), d.getDate()); }

  function renderCal(p) {
    if (ui.calIdx === 0 && !ui.calInit) {
      // open on the current month when it falls inside the range
      var now = new Date();
      var idx = (now.getFullYear() - 2026) * 12 + now.getMonth() - 9;
      if (idx > 0 && idx < CAL.length) ui.calIdx = idx;
      ui.calInit = true;
    }
    p.innerHTML =
      '<section class="pl-sec"><p class="pl-note">בחרי צבע מהרשימה, ולחצי על ימים כדי לסמן אותם. לחיצה נוספת באותו צבע מנקה את הסימון. החגים כבר מסומנים.</p></section>' +
      '<div class="pl-cal">' +
      '<div class="pl-sec">' +
      '<div class="pl-cal-head">' +
      '<button type="button" class="pl-iconbtn" id="pl-cal-prev" aria-label="החודש הקודם">›</button>' +
      '<h3 id="pl-cal-title" aria-live="polite"></h3>' +
      '<button type="button" class="pl-iconbtn" id="pl-cal-next" aria-label="החודש הבא">‹</button>' +
      "</div>" +
      '<div class="pl-week" aria-hidden="true">' + HE_DAYS.map(function (d) { return "<span>" + d + "</span>"; }).join("") + "</div>" +
      '<div class="pl-days" id="pl-days" role="grid" aria-labelledby="pl-cal-title"></div>' +
      "</div>" +
      '<aside class="pl-side">' +
      '<div class="pl-side-block"><h4>צבע לסימון</h4><div class="pl-brush" role="radiogroup" aria-label="צבע לסימון">' +
      '<label class="none"><input type="radio" name="pl-brush" value=""' + (ui.brush === "" ? " checked" : "") + '><span class="pl-swatch"></span>בלי צבע (רק בחירה)</label>' +
      CATS.filter(function (c) { return c.k !== "hol"; }).map(function (c) {
        return '<label class="cat-' + c.k + '"><input type="radio" name="pl-brush" value="' + c.k + '"' + (ui.brush === c.k ? " checked" : "") + '><span class="pl-swatch"></span>' + esc(c.label) + "</label>";
      }).join("") +
      "</div></div>" +
      '<div class="pl-side-block" id="pl-day-edit"></div>' +
      '<div class="pl-side-block"><h4>בחודש הזה</h4><div class="pl-month-count" id="pl-month-count"></div></div>' +
      "</aside></div>";
    p.querySelector("#pl-cal-prev").addEventListener("click", function () { if (ui.calIdx > 0) { ui.calIdx--; ui.day = null; drawMonth(); } });
    p.querySelector("#pl-cal-next").addEventListener("click", function () { if (ui.calIdx < CAL.length - 1) { ui.calIdx++; ui.day = null; drawMonth(); } });
    p.querySelectorAll('input[name="pl-brush"]').forEach(function (r) {
      r.addEventListener("change", function () { ui.brush = r.value; });
    });
    drawMonth();
  }

  function drawMonth() {
    var mo = CAL[ui.calIdx];
    root.querySelector("#pl-cal-title").textContent = mo.label;
    root.querySelector("#pl-cal-prev").disabled = ui.calIdx === 0;
    root.querySelector("#pl-cal-next").disabled = ui.calIdx === CAL.length - 1;
    var grid = root.querySelector("#pl-days");
    grid.textContent = "";
    var first = new Date(mo.y, mo.m, 1).getDay();
    var days = new Date(mo.y, mo.m + 1, 0).getDate();
    var today = todayIso();
    for (var b = 0; b < first; b++) {
      var e = document.createElement("div"); e.className = "pl-day is-empty"; e.setAttribute("aria-hidden", "true"); grid.appendChild(e);
    }
    var counts = {};
    for (var d = 1; d <= days; d++) {
      (function (d) {
        var key = iso(mo.y, mo.m, d);
        var rec = S.days[key] || {};
        var hol = HOLIDAYS[key];
        var dow = new Date(mo.y, mo.m, d).getDay();
        var btn = document.createElement("button");
        btn.type = "button";
        var cls = "pl-day";
        if (rec.c) { cls += " cat-" + rec.c; counts[rec.c] = (counts[rec.c] || 0) + 1; }
        if (hol) { cls += " has-hol"; counts.hol = (counts.hol || 0) + 1; }
        if (rec.n) cls += " has-note";
        if (dow === 5 || dow === 6) cls += " is-weekend";
        if (key === today) cls += " is-today";
        if (ui.day === key) cls += " is-sel";
        btn.className = cls;
        var label = d + " ב" + HE_MONTHS[mo.m] + (hol ? ", " + hol : "") + (rec.c ? ", " + CAT_LABEL[rec.c] : "") + (rec.n ? ", " + rec.n : "");
        btn.setAttribute("aria-label", label);
        btn.setAttribute("aria-pressed", ui.day === key ? "true" : "false");
        var dn = document.createElement("span"); dn.className = "d"; dn.textContent = d; btn.appendChild(dn);
        if (hol) { var h = document.createElement("span"); h.className = "hol"; h.textContent = hol; btn.appendChild(h); }
        if (rec.n) { var n = document.createElement("span"); n.className = "nt"; n.textContent = rec.n; btn.appendChild(n); }
        btn.addEventListener("click", function () { clickDay(key); });
        grid.appendChild(btn);
      })(d);
    }
    var mc = root.querySelector("#pl-month-count");
    mc.textContent = "";
    var any = false;
    CATS.forEach(function (c) {
      if (!counts[c.k]) return;
      any = true;
      var chip = document.createElement("span");
      chip.className = "chip cat-" + c.k;
      chip.textContent = c.label + ": " + counts[c.k];
      mc.appendChild(chip);
    });
    if (!any) { var p = document.createElement("p"); p.className = "pl-note"; p.textContent = "עוד לא סומנו ימים בחודש הזה."; mc.appendChild(p); }
    drawDayEditor();
  }

  function clickDay(key) {
    var rec = S.days[key] || {};
    if (ui.brush) {
      rec.c = rec.c === ui.brush ? "" : ui.brush;
      if (!rec.c && !rec.n) delete S.days[key]; else S.days[key] = rec;
      changed();
    }
    ui.day = key;
    drawMonth();
    var sel = root.querySelector(".pl-day.is-sel");
    if (sel) sel.focus();
  }

  function drawDayEditor() {
    var box = root.querySelector("#pl-day-edit");
    box.textContent = "";
    var h = document.createElement("h4");
    if (!ui.day) {
      h.textContent = "יום נבחר";
      var p = document.createElement("p"); p.className = "pl-note"; p.textContent = "לחצי על יום בלוח כדי להוסיף לו הערה או לשנות את הצבע שלו.";
      box.appendChild(h); box.appendChild(p);
      return;
    }
    var d = parseIso(ui.day);
    h.textContent = d.getDate() + " ב" + HE_MONTHS[d.getMonth()] + " " + d.getFullYear();
    box.appendChild(h);
    if (HOLIDAYS[ui.day]) { var hol = document.createElement("span"); hol.className = "chip cat-hol"; hol.textContent = HOLIDAYS[ui.day]; box.appendChild(hol); }
    var rec = S.days[ui.day] || {};
    var lab = document.createElement("label"); lab.className = "pl-f";
    var sp = document.createElement("span"); sp.textContent = "סוג היום";
    var sel = document.createElement("select"); sel.id = "pl-day-cat";
    var o0 = document.createElement("option"); o0.value = ""; o0.textContent = "ללא"; sel.appendChild(o0);
    CATS.filter(function (c) { return c.k !== "hol"; }).forEach(function (c) {
      var o = document.createElement("option"); o.value = c.k; o.textContent = c.label; sel.appendChild(o);
    });
    sel.value = rec.c || "";
    lab.appendChild(sp); lab.appendChild(sel); box.appendChild(lab);
    var lab2 = document.createElement("label"); lab2.className = "pl-f";
    var sp2 = document.createElement("span"); sp2.textContent = "הערה";
    var ta = document.createElement("textarea"); ta.rows = 3; ta.id = "pl-day-note"; ta.value = rec.n || "";
    ta.placeholder = "למשל: יום צילום, השקת סדנה, יום הולדת";
    lab2.appendChild(sp2); lab2.appendChild(ta); box.appendChild(lab2);
    function save() {
      var r = S.days[ui.day] || {};
      r.c = sel.value; r.n = ta.value;
      if (!r.c && !r.n) delete S.days[ui.day]; else S.days[ui.day] = r;
      changed();
    }
    sel.addEventListener("change", function () { save(); drawMonth(); });
    ta.addEventListener("input", function (e) { e.stopPropagation(); save(); });
    ta.addEventListener("change", function (e) { e.stopPropagation(); drawMonthKeepFocus(); });
  }

  function drawMonthKeepFocus() {
    var key = ui.day;
    drawMonth();
    ui.day = key;
  }

  // ---------- tab: sale events ----------
  function renderSales(p) {
    p.innerHTML =
      '<section class="pl-sec"><p class="pl-lead">כל וובינר, סדנה, הרשמה, מבצע, פתיחת קבוצה או חלון מכירה הוא מעמד שדורש זמן חימום והכנה. מתכננים אחורה מהתאריך שבו רוצים למכור.</p></section>' +
      '<section class="pl-sec"><h3>ציר השנה</h3><div class="pl-legend">' +
      '<span class="chip cat-warm"><span class="pl-swatch"></span>חימום</span>' +
      '<span class="chip cat-sale"><span class="pl-swatch"></span>חלון מכירה</span>' +
      '<span class="chip cat-deliv"><span class="pl-swatch"></span>אספקה</span>' +
      '<span class="chip cat-vac"><span class="pl-swatch"></span>חופשות</span>' +
      '</div><div class="pl-tl" id="pl-tl"></div></section>' +
      '<section class="pl-sec"><h3>מעמדי המכירה</h3><div class="pl-recs" id="pl-recs"></div>' +
      '<div class="pl-actions"><button type="button" id="pl-add-sale">+ מעמד מכירה</button></div></section>';
    p.querySelector("#pl-add-sale").addEventListener("click", function () {
      S.sales.push({ status: "רעיון" });
      ui.open[S.sales.length - 1] = true;
      changed();
      drawRecs();
      renderTimeline();
      var last = root.querySelector('.pl-rec[data-i="' + (S.sales.length - 1) + '"] input');
      if (last) last.focus();
    });
    drawRecs();
    renderTimeline();
  }

  var SALE_FIELDS = [
    ["name", "שם המעמד", "text"], ["product", "מוצר / שירות", "text"], ["type", "סוג", "sel:type"],
    ["date", "תאריך יעד / אירוע", "date"], ["warm", "תחילת חימום", "date"], ["open", "פתיחת מכירה", "date"],
    ["close", "סגירת מכירה", "date"], ["dstart", "תחילת אספקה", "date"], ["dend", "סיום אספקה", "date"],
    ["income", "יעד הכנסה (₪)", "number"], ["sales", "יעד מכירות", "number"], ["budget", "תקציב שיווק (₪)", "number"],
    ["channel", "ערוץ מוביל", "sel:channel"], ["status", "סטטוס", "sel:status"]
  ];

  function drawRecs() {
    var box = root.querySelector("#pl-recs");
    box.textContent = "";
    if (!S.sales.length) {
      var p = document.createElement("p"); p.className = "pl-note";
      p.textContent = "עוד אין מעמדי מכירה. הוסיפי את הראשון, מלאי את תאריכי החימום, המכירה והאספקה, והוא יופיע על ציר השנה.";
      box.appendChild(p);
      return;
    }
    S.sales.forEach(function (ev, i) {
      var wrap = document.createElement("div");
      wrap.className = "pl-rec" + (ui.open[i] ? " is-open" : "");
      wrap.setAttribute("data-i", i);
      var sum = document.createElement("button");
      sum.type = "button"; sum.className = "pl-rec-sum";
      sum.setAttribute("aria-expanded", ui.open[i] ? "true" : "false");
      sum.setAttribute("aria-controls", "pl-rec-body-" + i);
      sum.innerHTML = '<b></b><span class="meta"></span><span class="chip pl-status"></span><span class="chev" aria-hidden="true">⌄</span>';
      sum.addEventListener("click", function () {
        ui.open[i] = !ui.open[i];
        wrap.classList.toggle("is-open", ui.open[i]);
        sum.setAttribute("aria-expanded", ui.open[i] ? "true" : "false");
        body.hidden = !ui.open[i];
      });
      wrap.appendChild(sum);
      var body = document.createElement("div");
      body.className = "pl-rec-body"; body.id = "pl-rec-body-" + i; body.hidden = !ui.open[i];
      body.innerHTML = '<div class="pl-qs">' + SALE_FIELDS.map(function (f) {
        var path = "sales." + i + "." + f[0];
        var input;
        if (f[2] === "date") input = '<input type="date" data-b="' + path + '">';
        else if (f[2] === "number") input = '<input type="number" inputmode="numeric" min="0" data-b="' + path + '">';
        else if (f[2] === "sel:type") input = '<select data-b="' + path + '">' + options(SALE_TYPES, true) + "</select>";
        else if (f[2] === "sel:channel") input = '<select data-b="' + path + '">' + options(CHANNELS, true) + "</select>";
        else if (f[2] === "sel:status") input = '<select data-b="' + path + '">' + options(STATUSES, false) + "</select>";
        else input = '<input type="text" data-b="' + path + '">';
        return '<label class="pl-f"><span>' + esc(f[1]) + "</span>" + input + "</label>";
      }).join("") + "</div>" +
        '<label class="pl-f"><span>מה חייב להיות מוכן לפני</span><textarea rows="3" data-b="sales.' + i + '.ready"></textarea></label>' +
        '<label class="pl-f"><span>הערות</span><textarea rows="2" data-b="sales.' + i + '.notes"></textarea></label>' +
        '<div class="pl-actions"><button type="button" class="pl-del" aria-label="מחיקת המעמד">×</button></div>';
      wireDelete(body.querySelector(".pl-del"), function () {
        S.sales.splice(i, 1);
        ui.open = {};
        changed(); drawRecs(); renderTimeline();
      });
      wrap.appendChild(body);
      box.appendChild(wrap);
      hydrate(body);
      updateRecSummary(wrap, i);
    });
  }

  function updateRecSummary(wrap, i) {
    var ev = S.sales[i] || {};
    wrap.querySelector(".pl-rec-sum b").textContent = ev.name || "מעמד ללא שם";
    var bits = [];
    if (ev.type) bits.push(ev.type);
    if (ev.open || ev.close) bits.push("מכירה " + (fmtDate(ev.open) || "?") + "–" + (fmtDate(ev.close) || "?"));
    else if (ev.date) bits.push(fmtDate(ev.date));
    if (num(ev.income)) bits.push(money(num(ev.income)));
    wrap.querySelector(".pl-rec-sum .meta").textContent = bits.join(" · ");
    var st = wrap.querySelector(".pl-status");
    st.textContent = ev.status || "רעיון";
    st.className = "chip pl-status " + ({ "רעיון": "cat-decision", "מתוכנן": "cat-warm", "בהכנה": "cat-deliv", "מוכן": "cat-sale", "הושלם": "cat-sale", "נדחה": "cat-vac" }[ev.status || "רעיון"]);
  }

  var Y0 = new Date(2026, 9, 1).getTime(), Y1 = new Date(2027, 10, 1).getTime();
  function pos(s) {
    var d = parseIso(s);
    if (!d) return null;
    return Math.min(1, Math.max(0, (d.getTime() - Y0) / (Y1 - Y0)));
  }
  function seg(track, cls, from, to, title) {
    var a = pos(from), b = pos(to || from);
    if (a == null || b == null) return;
    if (b < a) { var t = a; a = b; b = t; }
    var el = document.createElement("span");
    el.className = "pl-tl-seg " + cls;
    // RTL: the year runs right to left
    el.style.insetInlineStart = (a * 100) + "%";
    el.style.width = Math.max(0.6, (b - a) * 100) + "%";
    el.title = title;
    track.appendChild(el);
  }

  function renderTimeline() {
    var tl = root.querySelector("#pl-tl");
    if (!tl) return;
    tl.textContent = "";
    var inner = document.createElement("div"); inner.className = "pl-tl-inner";
    var months = document.createElement("div"); months.className = "pl-tl-months";
    var blank = document.createElement("span"); months.appendChild(blank);
    MONTHS.forEach(function (mo) { var s = document.createElement("span"); s.textContent = mo.label; months.appendChild(s); });
    inner.appendChild(months);
    var rows = 0;
    S.sales.forEach(function (ev) {
      if (!ev.warm && !ev.open && !ev.close && !ev.dstart && !ev.date) return;
      rows++;
      var row = document.createElement("div"); row.className = "pl-tl-row";
      var b = document.createElement("b"); b.textContent = ev.name || "מעמד ללא שם"; row.appendChild(b);
      var track = document.createElement("div"); track.className = "pl-tl-track";
      if (ev.warm && (ev.open || ev.date)) seg(track, "warm", ev.warm, ev.open || ev.date, "חימום");
      if (ev.open) seg(track, "sale", ev.open, ev.close || ev.open, "חלון מכירה");
      else if (ev.date) seg(track, "sale", ev.date, ev.date, "תאריך יעד");
      if (ev.dstart) seg(track, "deliv", ev.dstart, ev.dend || ev.dstart, "אספקה");
      row.appendChild(track);
      inner.appendChild(row);
    });
    var vrow = null;
    S.vac.forEach(function (v) {
      if (!v.from) return;
      if (!vrow) {
        vrow = document.createElement("div"); vrow.className = "pl-tl-row";
        var b = document.createElement("b"); b.textContent = "חופשות"; vrow.appendChild(b);
        var tr = document.createElement("div"); tr.className = "pl-tl-track"; vrow.appendChild(tr);
      }
      seg(vrow.lastChild, "vac", v.from, v.to || v.from, v.what || "חופש");
    });
    if (vrow) { inner.appendChild(vrow); rows++; }
    if (!rows) {
      var p = document.createElement("p"); p.className = "pl-tl-empty";
      p.textContent = "הציר יתמלא כשתוסיפי תאריכים למעמדי המכירה או לחופשות.";
      inner.appendChild(p);
    }
    tl.appendChild(inner);
  }

  // two-step delete without dialogs
  function wireDelete(btn, run) {
    btn.addEventListener("click", function () {
      if (btn.getAttribute("data-armed") === "1") { run(); return; }
      btn.setAttribute("data-armed", "1");
      btn.textContent = "למחוק?";
      setTimeout(function () { if (btn.isConnected) { btn.removeAttribute("data-armed"); btn.textContent = "×"; } }, 3500);
    });
  }

  // ---------- tab: availability ----------
  function renderAvail(p) {
    p.innerHTML =
      '<section class="pl-sec"><p class="pl-lead">קודם החיים, אחר כך השיווק. מכניסים מראש חופשות, חגים, ימי משפחה ותקופות עומס, ואז בודקים שהקמפיינים לא מתנגשים בהם.</p></section>' +
      '<section class="pl-sec"><h3>תאריכים שלא עובדים בהם כרגיל</h3><div class="pl-scroll"><table class="pl-table"><thead><tr>' +
      "<th>מתאריך</th><th>עד תאריך</th><th>מה קורה</th><th>סוג</th><th>העסק פעיל?</th><th>מה צריך להכין מראש</th><th>מי מחליף / מטפל</th><th>הערות</th><th></th>" +
      '</tr></thead><tbody id="pl-vac-rows"></tbody></table></div>' +
      '<div class="pl-actions"><button type="button" id="pl-add-vac">+ תקופה</button></div></section>' +
      '<section class="pl-sec"><h3>קיבולת חודשית</h3><p class="pl-note">כדי לא לתכנן שנה על 100% כל הזמן. שורה מסומנת כשהקיבולת נמוכה ויש בה מעמד מכירה.</p>' +
      '<div class="pl-scroll"><table class="pl-table"><thead><tr>' +
      "<th>חודש</th><th>קיבולת עבודה 1–5</th><th>ימי חופש</th><th>עומס אספקה 1–5</th><th>מעמד מכירה?</th><th>סיכון לעומס</th><th>מה צריך לשנות</th><th>הערות</th>" +
      "</tr></thead><tbody>" +
      MONTHS.map(function (mo, m) {
        var b = "cap." + m + ".";
        return '<tr data-cap="' + m + '"><td class="date-cell">' + esc(mo.label) + "</td>" +
          '<td class="narrow"><select data-b="' + b + 'cap" aria-label="קיבולת ' + esc(mo.label) + '"><option value="">–</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></td>' +
          '<td class="narrow"><input type="number" min="0" inputmode="numeric" data-b="' + b + 'vdays" aria-label="ימי חופש ' + esc(mo.label) + '"></td>' +
          '<td class="narrow"><select data-b="' + b + 'dload" aria-label="עומס אספקה ' + esc(mo.label) + '"><option value="">–</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></td>' +
          '<td class="narrow"><select data-b="' + b + 'sale" aria-label="מעמד מכירה ' + esc(mo.label) + '"><option value="">–</option><option>כן</option><option>לא</option></select></td>' +
          '<td class="narrow"><select data-b="' + b + 'risk" aria-label="סיכון ' + esc(mo.label) + '"><option value="">–</option><option>נמוך</option><option>בינוני</option><option>גבוה</option></select></td>' +
          '<td class="wide"><textarea rows="1" data-b="' + b + 'change" aria-label="מה לשנות ' + esc(mo.label) + '"></textarea></td>' +
          '<td class="wide"><textarea rows="1" data-b="' + b + 'notes" aria-label="הערות ' + esc(mo.label) + '"></textarea></td></tr>';
      }).join("") +
      "</tbody></table></div></section>";
    p.querySelector("#pl-add-vac").addEventListener("click", function () {
      S.vac.push({ active: "לא" });
      changed(); drawVac();
      var rows = root.querySelectorAll("#pl-vac-rows tr");
      var last = rows[rows.length - 1];
      if (last) last.querySelector("input").focus();
    });
    drawVac();
    hydrate(p.querySelector("tbody:not(#pl-vac-rows)"));
    p.querySelectorAll("tr[data-cap]").forEach(function (tr) { markCapRisk(tr, +tr.getAttribute("data-cap")); });
  }

  function markCapRisk(tr, m) {
    var c = getPath(S, "cap." + m) || {};
    var risky = (num(c.cap) > 0 && num(c.cap) <= 2 && c.sale === "כן") || c.risk === "גבוה" || (num(c.dload) >= 4 && c.sale === "כן");
    tr.classList.toggle("is-risk", !!risky);
  }

  function drawVac() {
    var tb = root.querySelector("#pl-vac-rows");
    tb.textContent = "";
    if (!S.vac.length) {
      var tr = document.createElement("tr"); var td = document.createElement("td"); td.colSpan = 9;
      td.className = "pl-note"; td.textContent = "עוד אין תקופות. הוסיפי חופשה, אירוע משפחתי או תקופת עומס.";
      tr.appendChild(td); tb.appendChild(tr); return;
    }
    S.vac.forEach(function (v, i) {
      var b = "vac." + i + ".";
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td class="narrow"><input type="date" data-b="' + b + 'from" aria-label="מתאריך"></td>' +
        '<td class="narrow"><input type="date" data-b="' + b + 'to" aria-label="עד תאריך"></td>' +
        '<td><input type="text" data-b="' + b + 'what" aria-label="מה קורה"></td>' +
        '<td class="narrow"><select data-b="' + b + 'type" aria-label="סוג">' + options(VAC_TYPES, true) + "</select></td>" +
        '<td class="narrow"><select data-b="' + b + 'active" aria-label="העסק פעיל">' + options(ACTIVE, false) + "</select></td>" +
        '<td class="wide"><textarea rows="1" data-b="' + b + 'prep" aria-label="מה להכין מראש"></textarea></td>' +
        '<td><input type="text" data-b="' + b + 'who" aria-label="מי מחליף"></td>' +
        '<td class="wide"><textarea rows="1" data-b="' + b + 'notes" aria-label="הערות"></textarea></td>' +
        '<td class="narrow"><button type="button" class="pl-del" aria-label="מחיקת התקופה">×</button></td>';
      wireDelete(tr.querySelector(".pl-del"), function () { S.vac.splice(i, 1); changed(); drawVac(); });
      tb.appendChild(tr);
      hydrate(tr);
    });
  }

  // ---------- tab: dates & opportunities ----------
  function renderDates(p) {
    p.innerHTML =
      '<section class="pl-sec"><p class="pl-lead">לא צריך לשווק סביב כל תאריך. המטרה היא לזהות מראש תאריכים שבאמת משפיעים על הקהל, על הקניות או על הזמינות שלך, ולהחליט אם להשתמש בהם.</p></section>' +
      '<section class="pl-sec"><div class="pl-scroll"><table class="pl-table"><thead><tr>' +
      "<th>תאריך</th><th>מועד</th><th>סוג</th><th>רלוונטי לעסק שלי?</th><th>רעיון / זווית אפשרית</th><th>מתי להתחיל הכנה</th><th>הערות</th><th></th>" +
      '</tr></thead><tbody id="pl-date-rows"></tbody></table></div>' +
      '<div class="pl-actions"><button type="button" id="pl-add-date">+ מועד</button></div></section>';
    p.querySelector("#pl-add-date").addEventListener("click", function () {
      S.dates.push({ date: "", name: "", type: "", rel: "", idea: "", prep: "", notes: "" });
      changed(); drawDates();
      var rows = root.querySelectorAll("#pl-date-rows tr");
      rows[rows.length - 1].querySelector("input").focus();
    });
    drawDates();
  }

  function drawDates() {
    var tb = root.querySelector("#pl-date-rows");
    tb.textContent = "";
    // keep the user's order, but show presets sorted by date
    S.dates.forEach(function (d, i) {
      var b = "dates." + i + ".";
      var tr = document.createElement("tr");
      if (d.rel === "לא") tr.className = "is-muted";
      var dateCell = d.preset
        ? '<td class="date-cell"></td>'
        : '<td class="narrow"><input type="date" data-b="' + b + 'date" aria-label="תאריך"></td>';
      var nameCell = d.preset ? '<td class="date-cell pl-dname"></td>' : '<td><input type="text" data-b="' + b + 'name" aria-label="מועד"></td>';
      var typeCell = d.preset ? '<td class="pl-dtype"></td>' : '<td><input type="text" data-b="' + b + 'type" aria-label="סוג"></td>';
      tr.innerHTML = dateCell + nameCell + typeCell +
        '<td class="narrow"><select data-b="' + b + 'rel" aria-label="רלוונטי"><option value="">–</option><option>כן</option><option>אולי</option><option>לא</option></select></td>' +
        '<td class="wide"><textarea rows="1" data-b="' + b + 'idea" aria-label="רעיון או זווית"></textarea></td>' +
        '<td class="narrow"><input type="date" data-b="' + b + 'prep" aria-label="מתי להתחיל הכנה"></td>' +
        '<td class="wide"><textarea rows="1" data-b="' + b + 'notes" aria-label="הערות"></textarea></td>' +
        '<td class="narrow">' + (d.preset ? "" : '<button type="button" class="pl-del" aria-label="מחיקת המועד">×</button>') + "</td>";
      if (d.preset) {
        tr.children[0].textContent = fmtDate(d.date);
        tr.children[1].textContent = d.name;
        tr.children[2].textContent = d.type;
        tr.children[2].style.color = "var(--ink-soft)";
        tr.children[2].style.fontSize = "0.875rem";
        tr.children[2].style.padding = "0.6rem 0.5rem";
      } else {
        wireDelete(tr.querySelector(".pl-del"), function () { S.dates.splice(i, 1); changed(); drawDates(); });
      }
      tb.appendChild(tr);
      hydrate(tr);
    });
  }

  // ---------- tab: goals ----------
  function renderGoals(p) {
    var head = '<tr><th scope="col">מדד</th>' + MONTHS.map(function (mo) { return '<th scope="col">' + esc(mo.label) + "</th>"; }).join("") + '<th scope="col">סה״כ</th></tr>';
    function numRow(key, label, labelHtml) {
      return '<tr><th scope="row">' + (labelHtml || esc(label)) + "</th>" + MONTHS.map(function (mo, m) {
        return '<td class="pl-num"><input type="number" inputmode="numeric" min="0" aria-label="' + esc(label + ", " + mo.label) + '" data-b="goals.' + key + "." + m + '"></td>';
      }).join("") + '<td class="pl-num" data-total="' + key + '"></td></tr>';
    }
    var incomeRows = GOAL_ROWS.map(function (r) {
      if (r[2] === "named") {
        return numRow(r[0], r[1], '<span class="pl-rowname"><input type="text" placeholder="' + esc(r[1]) + '" aria-label="שם ' + esc(r[1]) + '" data-b="goals.names.' + r[0] + '"><span>יעד הכנסה (₪)</span></span>');
      }
      return numRow(r[0], r[1] + " (₪)");
    }).join("");
    var totalRow = '<tr class="pl-total"><th scope="row">סה״כ יעד הכנסה חודשי</th>' + MONTHS.map(function (mo, m) { return '<td data-month-total="' + m + '"></td>'; }).join("") + '<td data-total="all"></td></tr>';
    var more = GOAL_ROWS_2.map(function (r) { return numRow(r[0], r[1]); }).join("");
    var actual = ACTUAL_ROWS.map(function (r) { return numRow(r[0], r[1]); }).join("");
    var gap = '<tr class="pl-total"><th scope="row">פער מהיעד (בפועל פחות יעד)</th>' + MONTHS.map(function (mo, m) { return '<td data-gap="' + m + '"></td>'; }).join("") + '<td data-gap="all"></td></tr>';
    p.innerHTML =
      '<section class="pl-sec"><p class="pl-lead">מה צריך לקרות במספרים כדי שהתוכנית תעבוד. הסכומים מחושבים לבד.</p></section>' +
      '<section class="pl-sec"><h3>יעדים</h3><div class="pl-scroll"><table class="pl-grid"><thead>' + head + "</thead><tbody>" + incomeRows + totalRow + more + "</tbody></table></div></section>" +
      '<section class="pl-sec"><h3>בפועל</h3><div class="pl-scroll"><table class="pl-grid"><thead>' + head + "</thead><tbody>" + actual + gap + "</tbody></table></div></section>" +
      '<section class="pl-sec"><h3>בדיקת היגיון</h3><div class="pl-qs">' +
      CHECKS.map(function (q, i) { return '<label class="pl-f"><span>' + esc(q) + '</span><textarea rows="3" data-b="checks.' + i + '"></textarea></label>'; }).join("") +
      "</div></section>";
    hydrate(p);
    renderGoalTotals();
  }

  function rowSum(key) { var s = 0; for (var m = 0; m < 13; m++) s += num(getPath(S, "goals." + key + "." + m)); return s; }
  function monthIncome(m) { return GOAL_ROWS.reduce(function (a, r) { return a + num(getPath(S, "goals." + r[0] + "." + m)); }, 0); }

  function renderGoalTotals() {
    var moneyKeys = { p1: 1, p2: 1, p3: 1, other: 1, budget: 1, actual: 1, ads: 1, all: 1 };
    root.querySelectorAll("[data-total]").forEach(function (td) {
      var k = td.getAttribute("data-total");
      var v = k === "all" ? MONTHS.reduce(function (a, mo, m) { return a + monthIncome(m); }, 0) : rowSum(k);
      td.textContent = moneyKeys[k] ? money(v) : count(v);
    });
    root.querySelectorAll("[data-month-total]").forEach(function (td) {
      td.textContent = money(monthIncome(+td.getAttribute("data-month-total")));
    });
    root.querySelectorAll("[data-gap]").forEach(function (td) {
      var k = td.getAttribute("data-gap");
      // a gap only means something for months that already have an actual figure
      var hasActual = function (m) { return filled(getPath(S, "goals.actual." + m)); };
      var v;
      if (k === "all") {
        var months = MONTHS.map(function (mo, m) { return m; }).filter(hasActual);
        if (!months.length) { td.textContent = "—"; td.style.color = ""; return; }
        v = months.reduce(function (a, m) { return a + num(getPath(S, "goals.actual." + m)) - monthIncome(m); }, 0);
      } else {
        if (!hasActual(+k)) { td.textContent = "—"; td.style.color = ""; return; }
        v = num(getPath(S, "goals.actual." + k)) - monthIncome(+k);
      }
      td.textContent = (v > 0 ? "+" : v < 0 ? "−" : "") + money(Math.abs(v));
      td.style.color = v < 0 ? "var(--c-vac-fg)" : v > 0 ? "var(--ok-fg)" : "";
    });
  }

  // ---------- tab: 90 days ----------
  function renderQ90(p) {
    p.innerHTML =
      '<section class="pl-sec"><p class="pl-lead">אחרי שסגרת את השנה ברמת מאקרו, מתכננים לעומק רק את 90 הימים הקרובים. חוזרים לכאן בתחילת כל רבעון ומעדכנים.</p>' +
      '<div class="pl-seg" role="group" aria-label="בחירת רבעון">' +
      QUARTERS.map(function (q, i) { return '<button type="button" data-q="' + i + '" aria-pressed="' + (ui.quarter === i) + '">' + esc(q.label) + "</button>"; }).join("") +
      '</div></section><section class="pl-sec" id="pl-q-body"></section>';
    p.querySelectorAll(".pl-seg button").forEach(function (b) {
      b.addEventListener("click", function () {
        ui.quarter = +b.getAttribute("data-q");
        p.querySelectorAll(".pl-seg button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        drawQuarter();
      });
    });
    drawQuarter();
  }

  function drawQuarter() {
    var q = QUARTERS[ui.quarter];
    var box = root.querySelector("#pl-q-body");
    var head = '<tr><th scope="col">מה מתכננים</th>' + q.months.map(function (m) { return '<th scope="col">' + esc(MONTHS[m].label) + "</th>"; }).join("") + "</tr>";
    var body = Q90_ROWS.map(function (r) {
      return '<tr><th scope="row">' + esc(r[1]) + "</th>" + q.months.map(function (m) {
        return '<td><textarea rows="2" aria-label="' + esc(r[1] + ", " + MONTHS[m].label) + '" data-b="q90.' + r[0] + "." + m + '"></textarea></td>';
      }).join("") + "</tr>";
    }).join("");
    box.innerHTML = "<h3>" + esc(q.label) + '</h3><div class="pl-scroll"><table class="pl-grid"><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>";
    hydrate(box);
  }

  // ---------- public ----------
  window.Planner = {
    mount: function (el, content, cb) {
      root = el; onChange = cb;
      S = normalize(content);
      ui = { tab: "start", calIdx: 0, brush: "", day: null, open: {}, quarter: 0 };
      renderShell();
      showTab("start");
    },
    read: function () { return S; },
    title: function () { return "תכנון שנתי 2026–2027"; }
  };
})();
