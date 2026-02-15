/* ============================================================
   UI MODULE
   ------------------------------------------------------------
   - Handles UI interactions ONLY
   - Connects buttons to engine
   - Does NOT contain attendance logic
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    /* ===============================
       ELEMENT REFERENCES
    =============================== */

    const empTypeEl = document.getElementById("empType");
    const monthFilterEl = document.getElementById("monthFilter");
    const dateEl = document.getElementById("datePicker");
    const inEl = document.getElementById("punchIn");
    const outEl = document.getElementById("punchOut");
    const saveBtn = document.getElementById("saveBtn");

    /* ===============================
       SAVE BUTTON
    =============================== */

    saveBtn.addEventListener("click", function () {

        const payload = {
            empType: empTypeEl.value,
            date: dateEl.value,
            inTime: inEl.value,
            outTime: outEl.value
        };

        handleSaveRecord(payload);   // Engine layer

        renderTable();               // Table refresh
    });


    /* ===============================
       MONTH FILTER (Summary trigger)
       Summary only opens deliberately
    =============================== */

    monthFilterEl.addEventListener("change", function () {

        if (!monthFilterEl.value) return;

        renderTable();
        renderSummary(monthFilterEl.value, empTypeEl.value);
    });


    /* ===============================
       EMP TYPE CHANGE
    =============================== */

    empTypeEl.addEventListener("change", function () {

        renderTable();

        if (monthFilterEl.value) {
            renderSummary(monthFilterEl.value, empTypeEl.value);
        }
    });


    /* ===============================
       DEFAULT DATE AUTO-SET
    =============================== */

    if (!dateEl.value && dateEl._flatpickr) {
        dateEl._flatpickr.setDate(new Date(), false);
    }


    /* ===============================
       AUTO DEFAULT TIMES ON FOCUS
    =============================== */

    inEl.addEventListener("focus", function () {
        if (!inEl.value) inEl._flatpickr.setDate("09:00 AM", false);
    });

    outEl.addEventListener("focus", function () {
        if (!outEl.value) outEl._flatpickr.setDate("05:30 PM", false);
    });

});
