/* ============================================================
   APP BOOTSTRAP MODULE
============================================================ */

(function () {

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

   function boot() {
   
       console.log("Attendance Tracker Booting...");
   
       if (typeof STORAGE_KEY === "undefined") {
           console.error("CONFIG MODULE NOT LOADED.");
           return;
       }
   
       if (typeof initializeUI === "function") {
           initializeUI();
       }
   
       if (typeof renderTable === "function") {
           renderTable();
       }
   
       const yearEl = document.getElementById("copyrightYear");
       if (yearEl) yearEl.textContent = new Date().getFullYear();
   
       const monthFilterEl = document.getElementById("monthFilter");
       const empTypeEl = document.getElementById("empType");
   
       if (monthFilterEl && empTypeEl && monthFilterEl.value && typeof renderSummary === "function") {
           renderSummary(monthFilterEl.value, empTypeEl.value);
       }
   
       console.log("Application Initialized Successfully.");
   }


})();
