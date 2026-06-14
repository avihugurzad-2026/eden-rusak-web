/* Eden Rusak — admin panel (admin.html).
   Client-side management of the three catalogs: store, recommendations,
   workshops. Edits are saved to localStorage (EDEN_DB) and apply instantly
   on the site in this browser; the "גיבוי ופרסום" tab exports/imports the
   data for publishing. NOTE: this is a static site — the passcode is basic
   screening, not real security; don't keep secrets here. */
(function () {
  "use strict";

  /* ================= passcode gate ================= */
  var PASS_KEY = "eden_admin_pass";
  var SESSION_KEY = "eden_admin_in";
  var DEFAULT_PASS = "eden2026";

  function currentPass() {
    try { return localStorage.getItem(PASS_KEY) || DEFAULT_PASS; } catch (e) { return DEFAULT_PASS; }
  }
  var gate = document.getElementById("gate");
  var app = document.getElementById("app");
  function openApp() { gate.style.display = "none"; app.classList.add("open"); render(); }
  try { if (sessionStorage.getItem(SESSION_KEY) === "1") openApp(); } catch (e) {}
  document.getElementById("gateBtn").addEventListener("click", tryPass);
  document.getElementById("gatePass").addEventListener("keydown", function (e) { if (e.key === "Enter") tryPass(); });
  function tryPass() {
    var v = document.getElementById("gatePass").value;
    if (v === currentPass()) {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
      openApp();
    } else {
      document.getElementById("gateErr").style.display = "block";
    }
  }
  document.getElementById("logoutBtn").addEventListener("click", function () {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    location.reload();
  });

  /* ================= data ================= */
  var DEFAULTS = {
    storeProducts: window.EDEN_STORE_PRODUCTS || [],
    storeCategories: window.EDEN_STORE_CATEGORIES || [],
    recProducts: window.EDEN_PRODUCTS || [],
    recCategories: window.EDEN_CATEGORIES || [],
    workshops: window.EDEN_WORKSHOPS || []
  };
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  var DATA = {};
  Object.keys(DEFAULTS).forEach(function (k) {
    DATA[k] = clone(window.EDEN_DB ? EDEN_DB.get(k, DEFAULTS[k]) : DEFAULTS[k]);
  });
  function persist() {
    var db = EDEN_DB.read();
    Object.keys(DATA).forEach(function (k) { db[k] = DATA[k]; });
    if (!EDEN_DB.save(db)) toast("שגיאה בשמירה — ייתכן שהאחסון מלא");
  }

  /* ================= helpers ================= */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  function set(obj, path, val) {
    var ks = path.split("."), o = obj;
    for (var i = 0; i < ks.length - 1; i++) { if (typeof o[ks[i]] !== "object" || o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = val;
  }
  var toastEl = document.getElementById("toast");
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
  function slugify(s) {
    var x = String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return x || "item-" + Date.now().toString(36);
  }

  /* ================= schemas ================= */
  function catOptions(section) {
    return function () {
      return DATA[section].map(function (c) { return { v: c.key, t: c.label }; });
    };
  }
  var SCHEMAS = {
    storeProducts: {
      title: "מוצר בחנות",
      sub: function (p) {
        var bits = [Number(p.price) === 0 ? "חינם" : p.price + "₪"];
        if (p.oldPrice) bits.push('<span class="sale">מבצע (לפני: ' + p.oldPrice + "₪)</span>");
        if (p.stock !== "" && p.stock != null) {
          bits.push(Number(p.stock) <= 0 ? '<span class="out">אזל מהמלאי</span>' : "מלאי: " + p.stock);
        }
        if (p.coupon && p.coupon.code) bits.push("קופון: " + p.coupon.code);
        return bits.join(" · ");
      },
      fields: [
        { key: "title", label: "שם המוצר", type: "text", full: true },
        { key: "cat", label: "קטגוריה", type: "select", options: catOptions("storeCategories") },
        { key: "img", label: "תמונה (נתיב/קישור)", type: "text" },
        { key: "price", label: "מחיר (₪)", type: "number", hint: "0 = חינם" },
        { key: "oldPrice", label: "מחיר לפני מבצע (₪)", type: "number", hint: "ריק = אין מבצע" },
        { key: "stock", label: "מלאי", type: "text", hint: "ריק = ללא הגבלה, 0 = אזל" },
        { key: "buy", label: "קישור רכישה/סליקה", type: "text", hint: "ריק = פנייה ב-whatsapp" },
        { key: "short", label: "תיאור קצר (בכרטיס)", type: "textarea", full: true },
        { key: "desc", label: "תיאור מלא (בעמוד המוצר)", type: "textarea", full: true },
        { key: "includes", label: "מה מקבלים (שורה לכל פריט)", type: "lines", full: true },
        { key: "coupon.code", label: "קוד קופון", type: "text", hint: "ריק = אין קופון" },
        { key: "coupon.off", label: "גובה ההטבה", type: "text", hint: "למשל: 10% הנחה" },
        { key: "coupon.note", label: "הערת קופון", type: "text", full: true, hint: "מוצג מתחת לקוד בעמוד המוצר" },
        { key: "active", label: "מוצג בחנות", type: "check" }
      ],
      blank: function () {
        return { id: "", cat: (DATA.storeCategories[0] || {}).key || "", img: "", title: "",
          short: "", desc: "", includes: [], price: 0, oldPrice: null, stock: "",
          coupon: { code: "", off: "", note: "" }, buy: "", active: true };
      }
    },
    storeCategories: {
      title: "קטגוריה בחנות",
      sub: function (c) { return c.note || ""; },
      noImg: true,
      fields: [
        { key: "label", label: "שם הקטגוריה", type: "text", full: true },
        { key: "key", label: "מזהה (באנגלית)", type: "text", hint: "למשל: guides" },
        { key: "note", label: "תיאור קצר", type: "textarea", full: true }
      ],
      blank: function () { return { key: "", label: "", note: "" }; },
      titleKey: "label", idKey: "key"
    },
    recProducts: {
      title: "מוצר מומלץ",
      sub: function (p) {
        var bits = [];
        if (p.coupon) bits.push("קופון: " + p.coupon);
        bits.push(p.buy && p.buy.indexOf("wa.me") === -1 ? "קישור רכישה חיצוני" : "רכישה דרך whatsapp");
        return bits.join(" · ");
      },
      fields: [
        { key: "title", label: "שם המוצר", type: "text", full: true },
        { key: "cat", label: "קטגוריה", type: "select", options: catOptions("recCategories") },
        { key: "img", label: "תמונה (נתיב/קישור)", type: "text" },
        { key: "coupon", label: "קוד קופון", type: "text", hint: "ריק = אין קופון" },
        { key: "buy", label: "קישור רכישה", type: "text" },
        { key: "short", label: "תיאור קצר (בכרטיס)", type: "textarea", full: true },
        { key: "desc", label: "תיאור מלא (בעמוד המוצר)", type: "textarea", full: true },
        { key: "active", label: "מוצג באתר", type: "check" }
      ],
      blank: function () {
        return { id: "", cat: (DATA.recCategories[0] || {}).key || "", img: "", title: "",
          short: "", desc: "", coupon: "", buy: "https://wa.me/972552629091", active: true };
      }
    },
    recCategories: {
      title: "קטגוריית מומלצים",
      sub: function (c) { return c.note || ""; },
      noImg: true,
      fields: [
        { key: "label", label: "שם הקטגוריה", type: "text", full: true },
        { key: "key", label: "מזהה (באנגלית)", type: "text" },
        { key: "note", label: "תיאור קצר", type: "textarea", full: true }
      ],
      blank: function () { return { key: "", label: "", note: "" }; },
      titleKey: "label", idKey: "key"
    },
    workshops: {
      title: "סדנה",
      sub: function (w) {
        var bits = [];
        if (w.tag) bits.push(w.tag);
        if (w.price) bits.push(w.price);
        if (w.status) bits.push(w.status);
        return bits.join(" · ");
      },
      fields: [
        { key: "title", label: "שם הסדנה", type: "text", full: true },
        { key: "tag", label: "תגית", type: "text", hint: "למשל: קבוצתי / 1:1" },
        { key: "price", label: "מחיר (טקסט)", type: "text", hint: "למשל: 350₪ — ריק = לא מוצג" },
        { key: "img", label: "תמונה (נתיב/קישור)", type: "text" },
        { key: "cap", label: "מגבלת משתתפים", type: "text", hint: "למשל: עד 12 משתתפים" },
        { key: "text", label: "תיאור", type: "textarea", full: true },
        { key: "status", label: "סטטוס הרשמה", type: "textarea", full: true, hint: "למשל: ההרשמה נסגרת בקרוב, נותרו מקומות אחרונים" },
        { key: "link", label: "קישור (עמוד נחיתה)", type: "text" },
        { key: "linkText", label: "טקסט הכפתור", type: "text" },
        { key: "active", label: "מוצג באתר", type: "check" }
      ],
      blank: function () {
        return { id: "", tag: "", title: "", text: "", cap: "", status: "", price: "",
          img: "", link: "", linkText: "לפרטים", active: true };
      }
    }
  };

  /* ================= rendering ================= */
  var panel = document.getElementById("panel");
  var tabs = document.getElementById("tabs");
  var activeTab = "dash";
  tabs.addEventListener("click", function (e) {
    var b = e.target.closest(".tab");
    if (!b) return;
    tabs.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
    b.classList.add("active");
    activeTab = b.getAttribute("data-tab");
    render();
  });

  function render() {
    if (activeTab === "dash") return renderDash();
    if (activeTab === "store") return renderCatalog([
      { section: "storeProducts", head: "מוצרים בחנות" },
      { section: "storeCategories", head: "קטגוריות החנות" }
    ], "עריכת החנות מתעדכנת מיד בעמוד \"החנות\" באתר.");
    if (activeTab === "rec") return renderCatalog([
      { section: "recProducts", head: "מוצרים מומלצים" },
      { section: "recCategories", head: "קטגוריות המומלצים" }
    ], "עריכת המומלצים מתעדכנת מיד בעמוד \"המומלצים שלי\" ובעמודי המוצר.");
    if (activeTab === "workshops") return renderCatalog([
      { section: "workshops", head: "סדנאות" }
    ], "הסדנאות מוצגות בעמוד \"סדנאות\". מחירים, סטטוס הרשמה ומגבלות משתתפים נשלטים מכאן.");
    if (activeTab === "settings") return renderSettings();
  }

  /* ---- dashboard ---- */
  function renderDash() {
    var sp = DATA.storeProducts, rp = DATA.recProducts, ws = DATA.workshops;
    var sales = sp.filter(function (p) { return p.oldPrice; });
    var low = sp.filter(function (p) { return p.stock !== "" && p.stock != null && Number(p.stock) > 0 && Number(p.stock) <= 5; });
    var out = sp.filter(function (p) { return p.stock !== "" && p.stock != null && Number(p.stock) <= 0; });
    var coupons = [];
    sp.forEach(function (p) { if (p.coupon && p.coupon.code) coupons.push({ code: p.coupon.code, off: p.coupon.off, where: p.title }); });
    rp.forEach(function (p) { if (p.coupon) coupons.push({ code: p.coupon, off: "", where: p.title }); });

    panel.innerHTML =
      '<div class="panel-head"><h2>לוח בקרה</h2></div>' +
      '<div class="note">ברוכה הבאה! כאן שולטים בכל המוצרים באתר — החנות, המומלצים והסדנאות. כל שינוי נשמר ומוצג מיד באתר בדפדפן הזה; כדי לפרסם לכל הגולשים נכנסים ל"גיבוי ופרסום".</div>' +
      '<div class="stat-grid">' +
        stat(sp.filter(function (p) { return p.active !== false; }).length, "מוצרים פעילים בחנות") +
        stat(rp.filter(function (p) { return p.active !== false; }).length, "מוצרים במומלצים") +
        stat(ws.filter(function (w) { return w.active !== false; }).length, "סדנאות פעילות") +
        stat(sales.length, "מוצרים במבצע") +
        stat(coupons.length, "קודי קופון פעילים") +
        stat(out.length, "מוצרים שאזלו") +
      "</div>" +
      '<div class="dash-list"><h3>קודי קופון פעילים</h3><ul>' +
        (coupons.length ? coupons.map(function (c) {
          return "<li><span><strong>" + esc(c.code) + "</strong>" + (c.off ? " — " + esc(c.off) : "") + '</span><span class="muted">' + esc(c.where) + "</span></li>";
        }).join("") : '<li class="muted">אין קופונים פעילים</li>') +
      "</ul></div>" +
      '<div class="dash-list"><h3>התראות מלאי (החנות)</h3><ul>' +
        (low.length || out.length
          ? out.map(function (p) { return "<li><span>" + esc(p.title) + '</span><span class="muted">אזל מהמלאי</span></li>'; }).join("") +
            low.map(function (p) { return "<li><span>" + esc(p.title) + '</span><span class="muted">נותרו ' + p.stock + "</span></li>"; }).join("")
          : '<li class="muted">אין התראות — הכל זמין</li>') +
      "</ul></div>";
  }
  function stat(num, lbl) { return '<div class="stat-card"><div class="num">' + num + '</div><div class="lbl">' + lbl + "</div></div>"; }

  /* ---- catalog lists ---- */
  function renderCatalog(blocks, noteText) {
    panel.innerHTML = '<div class="note">' + noteText + " השינויים נשמרים אוטומטית.</div>";
    blocks.forEach(function (b) {
      var schema = SCHEMAS[b.section];
      var head = el('<div class="panel-head"><h2>' + b.head + '</h2><span class="spacer"></span>' +
        '<button class="btn btn-primary btn-sm" data-add="' + b.section + '">+ הוספה</button></div>');
      panel.appendChild(head);
      var list = el('<div class="items" data-list="' + b.section + '"></div>');
      DATA[b.section].forEach(function (item, i) { list.appendChild(itemRow(b.section, schema, item, i)); });
      if (!DATA[b.section].length) list.appendChild(el('<div class="note">אין פריטים עדיין — לחצי "+ הוספה".</div>'));
      panel.appendChild(list);
      panel.appendChild(el('<div style="height:26px"></div>'));
    });

    panel.querySelectorAll("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function () { openForm(btn.getAttribute("data-add"), -1); });
    });
  }

  function itemRow(section, schema, item, i) {
    var titleKey = schema.titleKey || "title";
    var row = el('<div class="item' + (item.active === false ? " inactive" : "") + '">' +
      (schema.noImg ? "" : '<img src="' + esc(item.img || "") + '" alt="" onerror="this.style.visibility=\'hidden\'">') +
      '<div class="item-main"><div class="item-title">' + esc(item[titleKey] || "(ללא שם)") + "</div>" +
      '<div class="item-sub">' + schema.sub(item) + "</div></div>" +
      '<div class="item-acts">' +
        '<button class="btn btn-ghost btn-sm" data-act="up" title="הזזה למעלה">↑</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="down" title="הזזה למטה">↓</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="toggle">' + (item.active === false ? "הצגה" : "הסתרה") + "</button>" +
        '<button class="btn btn-ghost btn-sm" data-act="dup">שכפול</button>' +
        '<button class="btn btn-pink btn-sm" data-act="edit">עריכה</button>' +
        '<button class="btn btn-danger btn-sm" data-act="del">מחיקה</button>' +
      "</div></div>");
    row.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      var arr = DATA[section];
      if (act === "edit") { openForm(section, i); return; }
      if (act === "del") {
        if (!confirm("למחוק את \"" + (item[titleKey] || "") + "\"? אי אפשר לבטל.")) return;
        arr.splice(i, 1);
      }
      if (act === "dup") {
        var copy = clone(item);
        var idKey = schema.idKey || "id";
        copy[idKey] = (copy[idKey] || "item") + "-copy";
        if (copy[titleKey]) copy[titleKey] += " (עותק)";
        arr.splice(i + 1, 0, copy);
      }
      if (act === "toggle") { item.active = item.active === false; }
      if (act === "up" && i > 0) { arr.splice(i, 1); arr.splice(i - 1, 0, item); }
      if (act === "down" && i < arr.length - 1) { arr.splice(i, 1); arr.splice(i + 1, 0, item); }
      persist(); render(); toast("נשמר");
    });
    return row;
  }

  /* ---- edit form ---- */
  var overlay = document.getElementById("overlay");
  var modal = document.getElementById("modal");
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeForm(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeForm(); });
  function closeForm() { overlay.classList.remove("open"); }

  function openForm(section, index) {
    var schema = SCHEMAS[section];
    var isNew = index < 0;
    var item = isNew ? schema.blank() : clone(DATA[section][index]);

    var fieldsHTML = schema.fields.map(function (f, fi) {
      var val = get(item, f.key);
      var full = f.full ? " full" : "";
      var hint = f.hint ? ' <span class="hint">(' + f.hint + ")</span>" : "";
      if (f.type === "check") {
        return '<div class="ffield ffield-check full"><input type="checkbox" id="f' + fi + '"' + (val !== false ? " checked" : "") + '><label for="f' + fi + '">' + f.label + "</label></div>";
      }
      if (f.type === "textarea" || f.type === "lines") {
        var tv = f.type === "lines" ? (val || []).join("\n") : (val == null ? "" : val);
        return '<div class="ffield' + full + '"><label for="f' + fi + '">' + f.label + hint + '</label><textarea id="f' + fi + '">' + esc(tv) + "</textarea></div>";
      }
      if (f.type === "select") {
        var opts = f.options().map(function (o) {
          return '<option value="' + esc(o.v) + '"' + (o.v === val ? " selected" : "") + ">" + esc(o.t) + "</option>";
        }).join("");
        return '<div class="ffield' + full + '"><label for="f' + fi + '">' + f.label + hint + '</label><select id="f' + fi + '">' + opts + "</select></div>";
      }
      var t = f.type === "number" ? "number" : "text";
      return '<div class="ffield' + full + '"><label for="f' + fi + '">' + f.label + hint + '</label><input type="' + t + '" id="f' + fi + '" value="' + esc(val == null ? "" : val) + '">' +
        (f.key === "img" ? '<img class="img-preview" id="imgPrev" src="' + esc(val || "") + '">' : "") + "</div>";
    }).join("");

    modal.innerHTML = "<h3>" + (isNew ? "הוספת " : "עריכת ") + schema.title + "</h3>" +
      '<div class="form-grid">' + fieldsHTML + "</div>" +
      '<div class="modal-acts"><button class="btn btn-ghost" id="formCancel">ביטול</button>' +
      '<button class="btn btn-primary" id="formSave">שמירה</button></div>';
    overlay.classList.add("open");

    var prev = document.getElementById("imgPrev");
    if (prev && prev.getAttribute("src")) prev.style.display = "block";
    schema.fields.forEach(function (f, fi) {
      if (f.key === "img" && prev) {
        document.getElementById("f" + fi).addEventListener("input", function () {
          prev.src = this.value; prev.style.display = this.value ? "block" : "none";
        });
      }
    });

    document.getElementById("formCancel").addEventListener("click", closeForm);
    document.getElementById("formSave").addEventListener("click", function () {
      schema.fields.forEach(function (f, fi) {
        var input = document.getElementById("f" + fi);
        var v;
        if (f.type === "check") v = input.checked;
        else if (f.type === "lines") v = input.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
        else if (f.type === "number") v = input.value === "" ? (f.key === "price" ? 0 : null) : Number(input.value);
        else v = input.value.trim();
        set(item, f.key, v);
      });
      var idKey = schema.idKey || "id";
      var titleKey = schema.titleKey || "title";
      if (!item[titleKey]) { toast("חסר שם לפריט"); return; }
      if (!item[idKey]) item[idKey] = slugify(item[titleKey]) ;
      if (isNew) DATA[section].push(item);
      else DATA[section][index] = item;
      persist(); closeForm(); render(); toast("נשמר ✓");
    });
  }

  /* ---- settings / backup ---- */
  function renderSettings() {
    panel.innerHTML =
      '<div class="panel-head"><h2>גיבוי ופרסום</h2></div>' +
      '<div class="note"><strong>חשוב להבין:</strong> האתר סטטי (בלי שרת), ולכן השינויים בפאנל נשמרים בדפדפן הזה בלבד ומוצגים בו מיד. ' +
      'כדי שהשינויים יופיעו לכל הגולשים — מייצאים כאן קובץ גיבוי ושולחים למי שמעלה את האתר (או מעלים אותו יחד עם קבצי האתר). ' +
      'מומלץ לייצא גיבוי אחרי כל סבב עריכות.</div>' +
      '<div class="dash-list"><h3>ייצוא וייבוא</h3>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">' +
        '<button class="btn btn-primary" id="expBtn">ייצוא גיבוי (JSON)</button>' +
        '<label class="btn btn-ghost" style="cursor:pointer">ייבוא גיבוי<input type="file" id="impInput" accept=".json" style="display:none"></label>' +
        '<button class="btn btn-danger" id="resetBtn">איפוס לנתוני ברירת המחדל</button>' +
        "</div></div>" +
      '<div class="dash-list"><h3>קוד גישה לפאנל</h3>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;align-items:center">' +
        '<input type="password" id="newPass" placeholder="קוד חדש" style="border:1px solid var(--hairline);border-radius:10px;padding:10px 12px">' +
        '<button class="btn btn-primary" id="passBtn">עדכון קוד</button>' +
        '<span class="muted" style="font-size:13px;color:var(--ink-48)">שימי לב: זו הגנה בסיסית בלבד (אתר סטטי) — לא לשמור כאן מידע רגיש.</span>' +
        "</div></div>";

    document.getElementById("expBtn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "eden-site-data.json";
      a.click();
      URL.revokeObjectURL(a.href);
      toast("הגיבוי ירד למחשב");
    });
    document.getElementById("impInput").addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var parsed = JSON.parse(reader.result);
          Object.keys(DEFAULTS).forEach(function (k) {
            if (Object.prototype.toString.call(parsed[k]) === "[object Array]") DATA[k] = parsed[k];
          });
          persist(); render(); toast("הגיבוי נטען ✓");
        } catch (e) { toast("קובץ לא תקין"); }
      };
      reader.readAsText(file);
    });
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (!confirm("לאפס את כל השינויים ולחזור לנתונים המקוריים של האתר?")) return;
      EDEN_DB.clear();
      Object.keys(DEFAULTS).forEach(function (k) { DATA[k] = clone(DEFAULTS[k]); });
      render(); toast("אופס לברירת המחדל");
    });
    document.getElementById("passBtn").addEventListener("click", function () {
      var v = document.getElementById("newPass").value.trim();
      if (v.length < 4) { toast("קוד קצר מדי (לפחות 4 תווים)"); return; }
      try { localStorage.setItem(PASS_KEY, v); toast("קוד הגישה עודכן ✓"); } catch (e) { toast("שגיאה בשמירה"); }
    });
  }
})();
