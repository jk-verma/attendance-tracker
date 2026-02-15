/* ============================================================
   UI MODULE
============================================================ */

let uiInitialized = false;

function initializeUI() {

    if (uiInitialized) return;
    uiInitialized = true;

    const empTypeEl = document.getElementById("empType");
    const monthFilterEl = document.getElementById("monthFilter");
    const dateEl = document.getElementById("datePicker");
    const inEl = document.getElementById("punchIn");
    const outEl = document.getElementById("punchOut");
    const saveBtn = document.getElementById("saveBtn");

    if (!empTypeEl || !monthFilterEl || !dateEl || !inEl || !outEl || !saveBtn) {
        console.error("UI elements missing. Initialization aborted.");
        return;
    }

    initializePickers(monthFilterEl, dateEl, inEl, outEl);
    bindCoreActions({ empTypeEl, monthFilterEl, dateEl, inEl, outEl, saveBtn });
    bindImportExportDeleteActions({ monthFilterEl, empTypeEl });

    closeSummary();
}

function initializePickers(monthFilterEl, dateEl, inEl, outEl) {

    if (typeof flatpickr !== "function") {
        console.warn("flatpickr is not available.");
        return;
    }

    const monthConfig = {
        allowInput: true,
        clickOpens: true,
        disableMobile: true,
        dateFormat: "Y-m"
    };

    if (typeof monthSelectPlugin === "function") {
        monthConfig.plugins = [new monthSelectPlugin({ shorthand: true, dateFormat: "Y-m", altFormat: "F Y" })];
    }

    flatpickr(monthFilterEl, monthConfig);

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
        allowInput: true,
        clickOpens: true,
        disableMobile: true
    });

    flatpickr(outEl, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "h:i K",
        time_24hr: false,
        allowInput: true,
        clickOpens: true,
        disableMobile: true
    });

    inEl.value = "";
    outEl.value = "";

    inEl.placeholder = "09:00 AM";
    outEl.placeholder = "05:30 PM";
}

function bindCoreActions(ctx) {

    const { empTypeEl, monthFilterEl, dateEl, inEl, outEl, saveBtn } = ctx;

    saveBtn.addEventListener("click", function () {

        const payload = {
            empType: empTypeEl.value,
            date: dateEl.value,
            inTime: inEl.value,
            outTime: outEl.value
        };

        handleSaveRecord(payload);
        refreshAfterDataMutation(monthFilterEl, empTypeEl);
    });

    monthFilterEl.addEventListener("change", function () {
        renderTable();

        if (!monthFilterEl.value) {
            closeSummary();
            return;
        }

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
}

function bindImportExportDeleteActions(ctx) {

    const { monthFilterEl, empTypeEl } = ctx;

    const importBtn = document.getElementById("importBtn");
    const exportBtn = document.getElementById("exportBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    const importMenu = document.getElementById("importMenu");
    const exportMenu = document.getElementById("exportMenu");
    const deleteMenu = document.getElementById("deleteMenu");

    const importFile = document.getElementById("importFile");
    const qrImageFile = document.getElementById("qrImageFile");

    if (!importBtn || !exportBtn || !deleteBtn || !importMenu || !exportMenu || !deleteMenu || !importFile || !qrImageFile) {
        console.error("Action menu elements missing.");
        return;
    }

    importBtn.addEventListener("click", event => {
        event.stopPropagation();
        toggleMenu(importMenu);
    });

    exportBtn.addEventListener("click", event => {
        event.stopPropagation();
        toggleMenu(exportMenu);
    });

    deleteBtn.addEventListener("click", event => {
        event.stopPropagation();
        toggleMenu(deleteMenu);
    });

    importMenu.addEventListener("click", function (event) {
        const type = event.target.dataset.type;
        if (!type) return;

        if (type === "csv") {
            importFile.click();
        }

        if (type === "qr-scan") {
            importQRFromScanner(() => refreshAfterDataMutation(monthFilterEl, empTypeEl));
        }

        if (type === "qr-upload") {
            qrImageFile.click();
        }

        closeAllMenus();
    });

    importFile.addEventListener("change", function () {
        const file = importFile.files && importFile.files[0];
        if (!file) return;

        importCSV(file, () => {
            refreshAfterDataMutation(monthFilterEl, empTypeEl);
        });
        importFile.value = "";
    });

    qrImageFile.addEventListener("change", function () {
        const file = qrImageFile.files && qrImageFile.files[0];
        if (!file) return;

        importQRFromFile(file, () => {
            refreshAfterDataMutation(monthFilterEl, empTypeEl);
        });
        qrImageFile.value = "";
    });

    exportMenu.addEventListener("click", function (event) {
        const type = event.target.dataset.type;
        if (!type) return;

        const allRecords = getAllRecords();
        const month = monthFilterEl.value;
        const monthRecords = month ? allRecords.filter(r => r.date.startsWith(month)) : allRecords;

        if (type === "csv-all") exportCSV(allRecords, "attendance_all.csv");
        if (type === "csv-month") exportCSV(monthRecords, `attendance_${month || "month"}.csv`);
        if (type === "qr-all") exportQR(allRecords);
        if (type === "qr-month") exportQR(monthRecords);

        closeAllMenus();
    });

    deleteMenu.addEventListener("click", function (event) {
        const type = event.target.dataset.type;
        if (!type) return;

        if (type === "all") {
            if (confirm("Delete all attendance records?")) {
                clearAllRecords();
            }
        }

        if (type === "month") {
            const month = monthFilterEl.value;
            if (!month) {
                alert("Please select Filter Month first.");
            } else if (confirm(`Delete all records for ${month}?`)) {
                deleteByMonth(month);
            }
        }

        refreshAfterDataMutation(monthFilterEl, empTypeEl);
        closeAllMenus();
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".dropdown")) {
            closeAllMenus();
        }
    });
}

function refreshAfterDataMutation(monthFilterEl, empTypeEl) {
    renderTable();

    if (monthFilterEl.value) {
        renderSummary(monthFilterEl.value, empTypeEl.value);
    } else {
        closeSummary();
    }
}

function toggleMenu(menuEl) {
    const isOpen = menuEl.style.display === "block";
    closeAllMenus();
    menuEl.style.display = isOpen ? "none" : "block";
}

function closeAllMenus() {
    document.querySelectorAll(".dropdown-menu").forEach(menu => {
        menu.style.display = "none";
    });
}

function handleSaveRecord(payload) {

    if (!payload || !payload.date) {
        alert("Please select date.");
        return;
    }

    const empType = payload.empType || "faculty";
    const inTime = payload.inTime || "";
    const hasManualOutTime = Boolean(payload.outTime);
    const computedOutTime = hasManualOutTime
        ? payload.outTime
        : calculateAutoPunchOutTime(inTime, empType);

    const record = {
        date: payload.date,
        empType,
        empLabel: empType === "faculty" ? "Faculty" : "Staff",
        inTime,
        outTime: computedOutTime,
        hours: 0,
        status: "",
        reason: "",
        isAutoPunchOutPending: !hasManualOutTime
    };

    const closedHoliday = document.getElementById("closedHoliday").value === "yes";
    const specialLeave = document.getElementById("specialLeave").value === "yes";

    if (closedHoliday) {
        record.status = STATUS.COMPLIANT;
        record.reason = REASON.CLOSED;
    } else if (specialLeave) {
        record.status = STATUS.COMPLIANT;
        record.reason = REASON.SPECIAL;
    } else if (!hasManualOutTime) {
        record.status = STATUS.NON_COMPLIANT;
        record.reason = buildPendingOutReason(record.outTime);
        record.hours = calculateHours(timeToMinutes(record.inTime), timeToMinutes(record.outTime));
    }

    upsertRecord(record);

    const reEvaluated = evaluateMonth(getAllRecords());
    saveAllRecords(reEvaluated);
}

function calculateAutoPunchOutTime(inTime, empType) {
    const inMinutes = timeToMinutes(inTime);
    if (inMinutes == null) {
        return minutesToTime(OFFICE_END_MIN);
    }

    const requiredHours = empType === "staff" ? STAFF_STANDARD_HOURS : FACULTY_STANDARD_HOURS;
    const requiredMinutes = Math.round(requiredHours * 60);
    return minutesToTime(inMinutes + requiredMinutes);
}
