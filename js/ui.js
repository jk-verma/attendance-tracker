/* ============================================================
   UI MODULE
============================================================ */

function initializeUI() {

    const monthFilterEl = document.getElementById("monthFilter");
    const dateEl = document.getElementById("datePicker");
    const inEl = document.getElementById("punchIn");
    const outEl = document.getElementById("punchOut");

    if (typeof flatpickr === "function") {

        flatpickr(monthFilterEl, {
            plugins: [new monthSelectPlugin({ shorthand: true, dateFormat: "Y-m", altFormat: "F Y" })],
            allowInput: true,
            clickOpens: true,
            disableMobile: true
        });

        flatpickr(dateEl, {
            dateFormat: "Y-m-d",
            defaultDate: new Date(),
            allowInput: true,
            clickOpens: true,
            disableMobile: true
        });

        flatpickr(inEl, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "h:i K",
            time_24hr: false,
            defaultDate: "09:00 AM",
            allowInput: true,
            clickOpens: true,
            disableMobile: true
        });

        flatpickr(outEl, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "h:i K",
            time_24hr: false,
            defaultDate: "05:30 PM",
            allowInput: true,
            clickOpens: true,
            disableMobile: true
        });
    }
}

function handleSaveRecord(payload) {

    if (!payload || !payload.date) {
        alert("Please select date.");
        return;
    }

    const empType = payload.empType || "faculty";
    const record = {
        date: payload.date,
        empType,
        empLabel: empType === "faculty" ? "Faculty" : "Staff",
        inTime: payload.inTime || "",
        outTime: payload.outTime || "",
        hours: 0,
        status: "",
        reason: ""
    };

    const closedHoliday = document.getElementById("closedHoliday").value === "yes";
    const specialLeave = document.getElementById("specialLeave").value === "yes";

    if (closedHoliday) {
        record.status = "Compliant";
        record.reason = "Closed Holiday";
    } else if (specialLeave) {
        record.status = "Compliant";
        record.reason = "Special Leave";
    } else if (!record.outTime) {
        record.status = "Non-Compliant";
        record.reason = "Pending Punch-Out";
    }

    upsertRecord(record);

    const reEvaluated = evaluateMonth(getAllRecords());
    saveAllRecords(reEvaluated);

    const month = (document.getElementById("monthFilter").value || "").trim();
    if (month) {
        renderSummary(month, empType);
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const empTypeEl = document.getElementById("empType");
    const monthFilterEl = document.getElementById("monthFilter");
    const dateEl = document.getElementById("datePicker");
    const inEl = document.getElementById("punchIn");
    const outEl = document.getElementById("punchOut");
    const saveBtn = document.getElementById("saveBtn");

    initializeUI();

    saveBtn.addEventListener("click", function () {

        const payload = {
            empType: empTypeEl.value,
            date: dateEl.value,
            inTime: inEl.value,
            outTime: outEl.value
        };

        handleSaveRecord(payload);
        renderTable();
    });

    monthFilterEl.addEventListener("change", function () {
        if (!monthFilterEl.value) {
            closeSummary();
            renderTable();
            return;
        }

        renderTable();
        renderSummary(monthFilterEl.value, empTypeEl.value);
    });

    empTypeEl.addEventListener("change", function () {
        renderTable();
        if (monthFilterEl.value) {
            renderSummary(monthFilterEl.value, empTypeEl.value);
        }
    });

    inEl.addEventListener("focus", function () {
        if (!inEl.value && inEl._flatpickr) inEl._flatpickr.setDate("09:00 AM", false);
    });

    outEl.addEventListener("focus", function () {
        if (!outEl.value && outEl._flatpickr) outEl._flatpickr.setDate("05:30 PM", false);
    });

});
