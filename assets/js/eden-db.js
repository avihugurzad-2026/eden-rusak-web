/* Eden Rusak — shared data layer.
   Site catalogs (store / recommendations / workshops) are seeded from JS data
   files; the admin panel (admin.html) saves overrides to localStorage.
   Every renderer reads through EDEN_DB.get() so admin edits apply instantly
   in this browser. Use the admin "ייצוא" button to publish changes for all
   visitors (replace the data files with the exported content). */
(function () {
  "use strict";
  var KEY = "eden_admin_db_v1";

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  window.EDEN_DB = {
    KEY: KEY,
    read: read,
    /* returns admin-edited array for a section, or the bundled fallback */
    get: function (section, fallback) {
      var db = read();
      if (db && Object.prototype.toString.call(db[section]) === "[object Array]" && db[section].length >= 0) {
        return db[section];
      }
      return fallback || [];
    },
    save: function (db) {
      try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
      catch (e) { return false; }
    },
    clear: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
  };
})();
