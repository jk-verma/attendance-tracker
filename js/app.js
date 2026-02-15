/* ============================================================
   APP BOOTSTRAP MODULE
   Version: v1.0 Stable
   Purpose:
   - Initialize application
   - Connect modules
   - Ensure proper startup sequence
   NOTE:
   - No attendance rules here
   - No storage logic here
   - No UI layout logic here
============================================================ */

(function () {

    console.log("Attendance Tracker v1.0 Stable Booting...");

    // Ensure required modules exist
    if (typeof STORAGE_KEY === "undefined") {
        console.error("CONFIG MODULE NOT LOADED.");
        return;
    }

    // Initialize default date if UI module provides method
    if (typeof initializeUI === "function") {
        initializeUI();
    }

    // Render existing records
    if (typeof renderTable === "function") {
        renderTable();
    }

    // Attach summary refresh if function exists
    if (typeof initializeSummary === "function") {
        initializeSummary();
    }

    console.log("Application Initialized Successfully.");

})();
