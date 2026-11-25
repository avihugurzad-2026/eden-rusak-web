/* Eden Rusak — retired browser-local admin storage shim.
   Catalog management moved to academy.edenrusak.com/admin/site (Supabase).
   Clears any stale localStorage overrides from the retired admin.html so
   every browser renders the canonical site data. */
(function () {
  "use strict";
  try {
    localStorage.removeItem("eden_admin_db_v1");
    localStorage.removeItem("eden_admin_pass");
    sessionStorage.removeItem("eden_admin_in");
  } catch (e) {}

  window.EDEN_DB = {
    read: function () { return {}; },
    get: function (_section, fallback) { return fallback || []; },
    save: function () { return false; },
    clear: function () {}
  };
})();
