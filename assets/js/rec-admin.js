/* Eden Rusak — recommendations admin (rec-admin.html)
   Supabase-backed: sign in with email + password; only users listed in
   eden_admins can write (enforced by Row Level Security in the database). */
(function () {
  "use strict";

  var cfg = window.EDEN_SUPABASE;
  var sb = window.supabase.createClient(cfg.url, cfg.key);
  var $ = function (id) { return document.getElementById(id); };

  var state = { products: [], cats: [], editing: null, editingCat: null, uploadFile: null };

  /* inline icons (emoji glyphs don't render reliably on Eden's devices) */
  function svg(d) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; }
  var IC = {
    star: svg('<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
    edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
    trash: svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>'),
    close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')
  };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var toastTimer;
  function toast(msg, isErr) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.toggle("err", !!isErr);
    t.classList.remove("hide");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add("hide"); }, 2600);
  }
  function heError(err) {
    var m = (err && err.message) || String(err);
    if (/row-level security|permission denied/i.test(m)) return "אין הרשאה לפעולה הזו — החשבון לא מוגדר כמנהל.";
    if (/duplicate key.*slug/i.test(m)) return "כבר יש מוצר עם הכתובת הזו — בחרי כתובת אחרת.";
    if (/duplicate key/i.test(m)) return "המזהה הזה כבר קיים — בחרי מזהה אחר.";
    if (/Invalid login credentials/i.test(m)) return "אימייל או סיסמה שגויים.";
    if (/slug_check|key_check/i.test(m)) return "הכתובת יכולה להכיל רק אותיות קטנות באנגלית, מספרים ומקפים.";
    return m;
  }
  function slugify(s) {
    var latin = String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return latin || "item-" + Math.random().toString(36).slice(2, 8);
  }
  function numOrNull(v) { return v === "" || v == null ? null : Number(v); }
  function strOrNull(v) { v = String(v || "").trim(); return v || null; }
  function money(n) { return n == null ? "" : (Number(n) % 1 === 0 ? Number(n).toFixed(0) : Number(n).toFixed(2)) + "₪"; }
  function catLabel(key) {
    for (var i = 0; i < state.cats.length; i++) { if (state.cats[i].key === key) return state.cats[i].label; }
    return "ללא קטגוריה";
  }

  /* ---------- auth ---------- */
  function show(view) {
    $("loginView").hidden = view !== "login";
    $("appView").hidden = view !== "app";
  }
  $("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    $("lgError").textContent = "";
    $("lgBtn").disabled = true;
    sb.auth.signInWithPassword({ email: $("lgEmail").value.trim(), password: $("lgPass").value })
      .then(function (r) {
        $("lgBtn").disabled = false;
        if (r.error) { $("lgError").textContent = heError(r.error); return; }
        boot(r.data.session);
      });
  });
  $("logoutBtn").addEventListener("click", function () {
    sb.auth.signOut().then(function () { location.reload(); });
  });

  function boot(session) {
    if (!session) { show("login"); return; }
    show("app");
    $("raUser").textContent = session.user.email || "";
    sb.from("eden_admins").select("user_id").eq("user_id", session.user.id).maybeSingle().then(function (r) {
      if (r.error || !r.data) {
        $("notAdmin").hidden = false;
        $("notAdmin").innerHTML = "<b>החשבון מחובר, אבל עדיין לא מוגדר כמנהל החנות.</b><br>" +
          "כדי לקבל הרשאה, שלחי את המזהה הזה למי שמנהל את האתר:<br><code>" + esc(session.user.id) + "</code>";
        return;
      }
      $("adminArea").hidden = false;
      loadAll();
    });
  }
  sb.auth.getSession().then(function (r) { boot(r.data.session); });

  /* ---------- data ---------- */
  function loadAll() {
    return Promise.all([
      sb.from("eden_rec_categories").select("*").order("sort", { ascending: true }),
      sb.from("eden_rec_products").select("*").order("sort", { ascending: true }).order("created_at", { ascending: false })
    ]).then(function (res) {
      if (res[0].error || res[1].error) { toast(heError(res[0].error || res[1].error), true); return; }
      state.cats = res[0].data;
      state.products = res[1].data;
      renderStats(); renderCatOptions(); renderProducts(); renderCats();
    });
  }

  function renderStats() {
    var p = state.products;
    var active = p.filter(function (x) { return x.active; }).length;
    var fav = p.filter(function (x) { return x.featured; }).length;
    var coupons = p.filter(function (x) { return x.coupon; }).length;
    $("raStats").innerHTML = [
      [active, "מוצרים מוצגים באתר"], [p.length - active, "מוסתרים"], [fav, "במועדפים שלי"], [coupons, "עם קוד קופון"], [state.cats.length, "קטגוריות"]
    ].map(function (s) { return '<div class="ra-stat"><b>' + s[0] + "</b><span>" + s[1] + "</span></div>"; }).join("");
  }
  function renderCatOptions() {
    var opts = state.cats.map(function (c) { return '<option value="' + esc(c.key) + '">' + esc(c.label) + "</option>"; }).join("");
    var cur = $("pFilter").value;
    $("pFilter").innerHTML = '<option value="">כל הקטגוריות</option>' + opts;
    $("pFilter").value = cur;
    $("pCat").innerHTML = '<option value="">ללא קטגוריה</option>' + opts;
  }

  /* ---------- products list ---------- */
  function renderProducts() {
    var q = $("pSearch").value.trim().toLowerCase();
    var f = $("pFilter").value;
    var list = state.products.filter(function (p) {
      if (f && p.category_key !== f) return false;
      return !q || (p.title + " " + (p.short || "") + " " + (p.coupon || "")).toLowerCase().indexOf(q) !== -1;
    });
    if (!list.length) { $("pList").innerHTML = '<div class="ra-empty">אין מוצרים להצגה.</div>'; return; }
    $("pList").innerHTML = list.map(function (p) {
      var meta = ['<span class="pill">' + esc(catLabel(p.category_key)) + "</span>"];
      if (p.price != null) meta.push(money(p.price) + (p.old_price ? " <s>" + money(p.old_price) + "</s>" : ""));
      if (p.coupon) meta.push("קוד: " + esc(p.coupon));
      if (p.badge) meta.push("סטיקר: " + esc(p.badge));
      if (p.video_url) meta.push("יש סרטון הדגמה");
      meta.push("מיקום " + p.sort);
      return '<div class="ra-row' + (p.active ? "" : " off") + '" data-id="' + p.id + '">' +
        '<img src="' + esc(p.image_url || "assets/images/logo.png") + '" alt="" loading="lazy">' +
        "<div><div class=\"t\">" + esc(p.title) + '</div><div class="m">' + meta.join("") + "</div></div>" +
        '<div class="acts">' +
          '<button type="button" class="ra-icon' + (p.featured ? " on" : "") + '" data-act="fav" title="המועדפים שלי" aria-label="המועדפים שלי">' + IC.star + '</button>' +
          '<button type="button" class="ra-switch' + (p.active ? " on" : "") + '" data-act="active" title="מוצג באתר" aria-label="מוצג באתר" aria-pressed="' + p.active + '"></button>' +
          '<button type="button" class="ra-icon" data-act="edit" title="עריכה" aria-label="עריכה">' + IC.edit + '</button>' +
          '<button type="button" class="ra-icon" data-act="dup" title="שכפול" aria-label="שכפול">' + IC.copy + '</button>' +
          '<button type="button" class="ra-icon danger" data-act="del" title="מחיקה" aria-label="מחיקה">' + IC.trash + '</button>' +
        "</div></div>";
    }).join("");
  }
  $("pSearch").addEventListener("input", renderProducts);
  $("pFilter").addEventListener("change", renderProducts);

  function findProduct(id) { return state.products.filter(function (p) { return p.id === id; })[0]; }

  $("pList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var p = findProduct(b.closest(".ra-row").getAttribute("data-id"));
    var act = b.getAttribute("data-act");
    if (act === "edit") return openProduct(p);
    if (act === "dup") {
      var copy = Object.assign({}, p);
      delete copy.id; delete copy.created_at; delete copy.updated_at;
      copy.title = p.title + " (עותק)"; copy.slug = slugify(p.slug + "-copy-" + Math.random().toString(36).slice(2, 5)); copy.active = false;
      return sb.from("eden_rec_products").insert(copy).then(function (r) {
        if (r.error) return toast(heError(r.error), true);
        toast("נוצר עותק מוסתר — ערכי ושמרי"); loadAll();
      });
    }
    if (act === "del") {
      if (!confirm('למחוק את "' + p.title + '"? אי אפשר לבטל את זה.')) return;
      return sb.from("eden_rec_products").delete().eq("id", p.id).then(function (r) {
        if (r.error) return toast(heError(r.error), true);
        removeStoredImage(p.image_url, p.id);
        removeStoredImage(p.video_url, p.id);
        toast("המוצר נמחק"); loadAll();
      });
    }
    var patch = act === "fav" ? { featured: !p.featured } : { active: !p.active };
    sb.from("eden_rec_products").update(patch).eq("id", p.id).then(function (r) {
      if (r.error) return toast(heError(r.error), true);
      Object.assign(p, patch); renderStats(); renderProducts();
      toast(act === "fav" ? (patch.featured ? "נוסף למועדפים" : "הוסר מהמועדפים") : (patch.active ? "המוצר מוצג באתר" : "המוצר הוסתר"));
    });
  });

  /* ---------- product editor ---------- */
  function openDrawer(id) { $(id).hidden = false; document.body.style.overflow = "hidden"; }
  function closeDrawers() { $("pDrawer").hidden = true; $("cDrawer").hidden = true; document.body.style.overflow = ""; }
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeDrawers); });
  ["pDrawer", "cDrawer"].forEach(function (id) {
    $(id).addEventListener("click", function (e) { if (e.target === $(id)) closeDrawers(); });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawers(); });

  var slugTouched = false;
  function openProduct(p) {
    state.editing = p || null;
    state.uploadFile = null;
    slugTouched = !!p;
    $("pFormTitle").textContent = p ? "עריכת מוצר" : "מוצר חדש";
    $("pTitle").value = p ? p.title : "";
    $("pCat").value = p ? (p.category_key || "") : ($("pFilter").value || (state.cats[0] || {}).key || "");
    $("pBadge").value = p ? (p.badge || "") : "";
    $("pShort").value = p ? (p.short || "") : "";
    $("pDesc").value = p ? (p.description || "") : "";
    $("pPrice").value = p && p.price != null ? p.price : "";
    $("pOld").value = p && p.old_price != null ? p.old_price : "";
    $("pCoupon").value = p ? (p.coupon || "") : "";
    $("pSort").value = p ? p.sort : (state.products.length ? Math.max.apply(null, state.products.map(function (x) { return x.sort; })) + 1 : 0);
    $("pBuy").value = p ? (p.buy_url || "") : "";
    $("pSlug").value = p ? p.slug : "";
    $("pSlugPrev").textContent = $("pSlug").value || "…";
    $("pActive").checked = p ? p.active : true;
    $("pFeatured").checked = p ? p.featured : false;
    $("pImg").value = p ? (p.image_url || "") : "";
    $("pImgPreview").src = (p && p.image_url) || "assets/images/logo.png";
    $("pFile").value = "";
    state.sticker = p ? (p.sticker_style || "pink") : "pink";
    state.videoFile = null;
    $("pVideo").value = p ? (p.video_url || "") : "";
    $("pVFile").value = "";
    renderSticker(); renderVideoNow();
    $("pError").textContent = "";
    openDrawer("pDrawer");
    $("pTitle").focus();
  }
  $("addProduct").addEventListener("click", function () { openProduct(null); });
  $("pTitle").addEventListener("input", function () {
    if (!slugTouched) { $("pSlug").value = slugify($("pTitle").value); $("pSlugPrev").textContent = $("pSlug").value; }
  });
  $("pSlug").addEventListener("input", function () { slugTouched = true; $("pSlugPrev").textContent = $("pSlug").value || "…"; });
  $("pImg").addEventListener("input", function () {
    state.uploadFile = null;
    $("pImgPreview").src = $("pImg").value || "assets/images/logo.png";
    renderSticker();
  });

  /* ---------- sticker ---------- */
  function renderSticker() {
    var prev = $("pStickerPrev"), text = $("pBadge").value.trim();
    var old = numOrNull($("pOld").value), price = numOrNull($("pPrice").value);
    var auto = !text && price != null && old != null && old > price ? "-" + Math.round((1 - price / old) * 100) + "%" : "";
    prev.hidden = !(text || auto);
    prev.textContent = text || auto;
    prev.className = "sticker sticker-" + (text ? state.sticker : "red");
    $("pStickerImg").src = $("pImgPreview").src;
    document.querySelectorAll("#pSwatches button").forEach(function (b) {
      var on = b.getAttribute("data-s") === state.sticker;
      b.classList.toggle("on", on); b.setAttribute("aria-checked", on);
    });
  }
  $("pBadge").addEventListener("input", renderSticker);
  $("pPrice").addEventListener("input", renderSticker);
  $("pOld").addEventListener("input", renderSticker);
  $("pPresets").addEventListener("click", function (e) {
    var b = e.target.closest("[data-v]");
    if (!b) return;
    $("pBadge").value = b.getAttribute("data-v");
    renderSticker();
  });
  $("pSwatches").addEventListener("click", function (e) {
    var b = e.target.closest("[data-s]");
    if (!b) return;
    state.sticker = b.getAttribute("data-s");
    renderSticker();
  });

  /* ---------- demo video ---------- */
  function renderVideoNow() {
    var box = $("pVideoNow"), url = $("pVideo").value.trim();
    if (state.videoFile) {
      box.hidden = false;
      box.innerHTML = '<video src="' + URL.createObjectURL(state.videoFile) + '" muted playsinline></video><span>' + esc(state.videoFile.name) + " · יעלה בשמירה</span>" +
        '<button type="button" data-vclear>הסרה</button>';
    } else if (url) {
      box.hidden = false;
      box.innerHTML = (/\.(mp4|webm|mov)(\?|$)/i.test(url) || url.indexOf("/storage/v1/object/public/") !== -1
        ? '<video src="' + esc(url) + '" muted playsinline preload="metadata"></video>' : "") +
        '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url.length > 60 ? url.slice(0, 60) + "…" : url) + "</a>" +
        '<button type="button" data-vclear>הסרה</button>';
    } else {
      box.hidden = true; box.innerHTML = "";
    }
  }
  $("pVideoNow").addEventListener("click", function (e) {
    if (!e.target.closest("[data-vclear]")) return;
    state.videoFile = null; $("pVideo").value = ""; $("pVFile").value = "";
    renderVideoNow();
  });
  $("pVideo").addEventListener("input", function () { state.videoFile = null; renderVideoNow(); });
  function pickVideo(file) {
    if (!file) return;
    if (!/^video\/(mp4|quicktime|webm)$/.test(file.type)) { $("pError").textContent = "אפשר להעלות רק סרטון MP4 / MOV / WEBM."; return; }
    if (file.size > 50 * 1024 * 1024) { $("pError").textContent = "הסרטון גדול מ-50MB — כדאי לכווץ אותו או להדביק קישור יוטיוב."; return; }
    $("pError").textContent = "";
    state.videoFile = file;
    $("pVideo").value = "";
    renderVideoNow();
  }
  $("pVFile").addEventListener("change", function () { pickVideo(this.files[0]); });
  var vdrop = $("pVDrop");
  ["dragenter", "dragover"].forEach(function (ev) { vdrop.addEventListener(ev, function (e) { e.preventDefault(); vdrop.classList.add("drag"); }); });
  ["dragleave", "drop"].forEach(function (ev) { vdrop.addEventListener(ev, function (e) { e.preventDefault(); vdrop.classList.remove("drag"); }); });
  vdrop.addEventListener("drop", function (e) { pickVideo(e.dataTransfer.files[0]); });

  function pickFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { $("pError").textContent = "אפשר להעלות רק תמונות JPG / PNG / WEBP / GIF."; return; }
    if (file.size > 5 * 1024 * 1024) { $("pError").textContent = "התמונה גדולה מ-5MB — נסי תמונה קטנה יותר."; return; }
    $("pError").textContent = "";
    state.uploadFile = file;
    $("pImg").value = "";
    $("pImgPreview").src = URL.createObjectURL(file);
    renderSticker();
  }
  $("pFile").addEventListener("change", function () { pickFile(this.files[0]); });
  var drop = $("pDrop");
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("drag"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("drag"); }); });
  drop.addEventListener("drop", function (e) { pickFile(e.dataTransfer.files[0]); });

  function uploadImage(file, folder) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    var path = (folder || "products") + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    return sb.storage.from(cfg.bucket).upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type })
      .then(function (r) {
        if (r.error) throw r.error;
        return sb.storage.from(cfg.bucket).getPublicUrl(path).data.publicUrl;
      });
  }
  /* delete an image or video we uploaded earlier (only files inside our bucket) */
  function removeStoredImage(url, ownerId) {
    var marker = "/storage/v1/object/public/" + cfg.bucket + "/";
    if (!url || url.indexOf(marker) === -1) return;
    /* duplicated products share files — keep it while anyone else uses it */
    var shared = state.products.some(function (x) { return x.id !== ownerId && (x.image_url === url || x.video_url === url); });
    if (shared) return;
    sb.storage.from(cfg.bucket).remove([decodeURIComponent(url.split(marker)[1])]);
  }

  $("pForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var title = $("pTitle").value.trim();
    if (!title) { $("pError").textContent = "חסר שם מוצר."; return; }
    var slug = $("pSlug").value.trim() || slugify(title);
    if (!/^[a-z0-9-]+$/.test(slug)) { $("pError").textContent = "הכתובת יכולה להכיל רק אותיות קטנות באנגלית, מספרים ומקפים."; return; }
    var buy = $("pBuy").value.trim();
    if (buy && !/^https?:\/\//i.test(buy)) { $("pError").textContent = "קישור הרכישה צריך להתחיל ב-https://"; return; }
    var price = numOrNull($("pPrice").value), old = numOrNull($("pOld").value);
    if (price != null && old != null && old <= price) { $("pError").textContent = "המחיר לפני הנחה צריך להיות גבוה מהמחיר."; return; }

    var videoLink = $("pVideo").value.trim();
    if (videoLink && !/^https?:\/\//i.test(videoLink)) { $("pError").textContent = "קישור הסרטון צריך להתחיל ב-https://"; return; }

    $("pSave").disabled = true;
    $("pSave").textContent = state.videoFile ? "מעלה סרטון..." : state.uploadFile ? "מעלה תמונה..." : "שומרת...";
    var prevImage = state.editing ? state.editing.image_url : null;
    var prevVideo = state.editing ? state.editing.video_url : null;
    var imgStep = state.uploadFile ? uploadImage(state.uploadFile) : Promise.resolve(strOrNull($("pImg").value));
    var vidStep = state.videoFile ? uploadImage(state.videoFile, "videos") : Promise.resolve(strOrNull(videoLink));
    var imageUrl;
    imgStep.then(function (url) { imageUrl = url; return vidStep; }).then(function (videoUrl) {
      var row = {
        video_url: videoUrl, sticker_style: state.sticker || "pink",
        title: title, slug: slug, category_key: $("pCat").value || null,
        badge: strOrNull($("pBadge").value), short: strOrNull($("pShort").value), description: strOrNull($("pDesc").value),
        price: price, old_price: old, coupon: strOrNull($("pCoupon").value),
        sort: Number($("pSort").value) || 0, buy_url: strOrNull(buy), image_url: imageUrl,
        active: $("pActive").checked, featured: $("pFeatured").checked
      };
      var q = state.editing
        ? sb.from("eden_rec_products").update(row).eq("id", state.editing.id)
        : sb.from("eden_rec_products").insert(row);
      return q.then(function (r) {
        if (r.error) throw r.error;
        if (prevImage && prevImage !== imageUrl) removeStoredImage(prevImage, state.editing && state.editing.id);
        if (prevVideo && prevVideo !== row.video_url) removeStoredImage(prevVideo, state.editing && state.editing.id);
        closeDrawers();
        toast(state.editing ? "המוצר עודכן — מופיע מיד באתר" : "המוצר נוסף לחנות");
        return loadAll();
      });
    }).catch(function (err) {
      $("pError").textContent = heError(err);
    }).then(function () {
      $("pSave").disabled = false;
      $("pSave").textContent = "שמירה";
    });
  });

  /* ---------- categories ---------- */
  function renderCats() {
    var counts = {};
    state.products.forEach(function (p) { counts[p.category_key] = (counts[p.category_key] || 0) + 1; });
    if (!state.cats.length) { $("cList").innerHTML = '<div class="ra-empty">עוד אין קטגוריות.</div>'; return; }
    $("cList").innerHTML = state.cats.map(function (c) {
      return '<div class="ra-row' + (c.active ? "" : " off") + '" data-key="' + esc(c.key) + '" style="grid-template-columns:1fr auto">' +
        '<div><div class="t">' + esc(c.label) + '</div><div class="m"><span class="pill">' + esc(c.key) + "</span>" +
        (counts[c.key] || 0) + " מוצרים · מיקום " + c.sort + (c.note ? " · " + esc(c.note) : "") + "</div></div>" +
        '<div class="acts">' +
          '<button type="button" class="ra-icon" data-act="edit" aria-label="עריכה">' + IC.edit + '</button>' +
          '<button type="button" class="ra-icon danger" data-act="del" aria-label="מחיקה">' + IC.trash + '</button>' +
        "</div></div>";
    }).join("");
  }
  function openCat(c) {
    state.editingCat = c || null;
    $("cFormTitle").textContent = c ? "עריכת קטגוריה" : "קטגוריה חדשה";
    $("cLabel").value = c ? c.label : "";
    $("cKey").value = c ? c.key : "";
    $("cNote").value = c ? (c.note || "") : "";
    $("cSort").value = c ? c.sort : state.cats.length;
    $("cActive").checked = c ? c.active : true;
    $("cError").textContent = "";
    openDrawer("cDrawer");
    $("cLabel").focus();
  }
  $("addCat").addEventListener("click", function () { openCat(null); });
  $("cList").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var key = b.closest(".ra-row").getAttribute("data-key");
    var c = state.cats.filter(function (x) { return x.key === key; })[0];
    if (b.getAttribute("data-act") === "edit") return openCat(c);
    if (!confirm('למחוק את הקטגוריה "' + c.label + '"? המוצרים שבה יישארו בלי קטגוריה.')) return;
    sb.from("eden_rec_categories").delete().eq("key", key).then(function (r) {
      if (r.error) return toast(heError(r.error), true);
      toast("הקטגוריה נמחקה"); loadAll();
    });
  });
  $("cForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var row = {
      label: $("cLabel").value.trim(), key: $("cKey").value.trim().toLowerCase(),
      note: strOrNull($("cNote").value), sort: Number($("cSort").value) || 0, active: $("cActive").checked
    };
    if (!row.label) { $("cError").textContent = "חסר שם קטגוריה."; return; }
    if (!/^[a-z0-9-]+$/.test(row.key)) { $("cError").textContent = "המזהה יכול להכיל רק אותיות קטנות באנגלית, מספרים ומקפים."; return; }
    var q = state.editingCat
      ? sb.from("eden_rec_categories").update(row).eq("key", state.editingCat.key)
      : sb.from("eden_rec_categories").insert(row);
    q.then(function (r) {
      if (r.error) { $("cError").textContent = heError(r.error); return; }
      closeDrawers(); toast("הקטגוריה נשמרה"); loadAll();
    });
  });

  document.querySelectorAll("[data-close].ra-icon").forEach(function (b) { b.innerHTML = IC.close; });

  /* ---------- tabs ---------- */
  document.querySelectorAll(".ra-tabs button").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll(".ra-tabs button").forEach(function (x) { x.classList.toggle("on", x === b); });
      $("tabProducts").hidden = b.getAttribute("data-tab") !== "products";
      $("tabCats").hidden = b.getAttribute("data-tab") !== "cats";
    });
  });
})();
