/* ============================================================
   UI MODULE
============================================================ */

let uiInitialized = false;

function initializeUI() {

    if (uiInitialized) return;
    uiInitialized = true;

    const empTypeEls = Array.from(document.querySelectorAll("input[name='empType']"));
    const monthFilterEl = document.getElementById("monthFilter");
    const dateEl = document.getElementById("datePicker");
    const inEl = document.getElementById("punchIn");
    const outEl = document.getElementById("punchOut");
    const saveBtn = document.getElementById("saveBtn");

    if (!empTypeEls.length || !monthFilterEl || !dateEl || !inEl || !outEl || !saveBtn) {
        console.error("UI elements missing. Initialization aborted.");
        return;
    }

    initializePickers(monthFilterEl, dateEl, inEl, outEl);
    bindCoreActions({ empTypeEls, monthFilterEl, dateEl, inEl, outEl, saveBtn });
    bindImportExportDeleteActions({ monthFilterEl, empTypeEls });

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

    const dateEndEl = document.getElementById("datePickerEnd");
    if (dateEndEl) {
        flatpickr(dateEndEl, {
            dateFormat: "Y-m-d",
            allowInput: true,
            clickOpens: true,
            disableMobile: true
        });
    }

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

function bindCoreActions(ctx) {

    const { empTypeEls, monthFilterEl, dateEl, inEl, outEl, saveBtn } = ctx;
    const closedHolidayEls = Array.from(document.querySelectorAll("input[name='closedHoliday']"));
    const specialLeaveEls = Array.from(document.querySelectorAll("input[name='specialLeave']"));
    const officialTourEl = document.getElementById("officialTour");

    saveBtn.addEventListener("click", function () {

        const tourValue = officialTourEl ? officialTourEl.value : "none";
        let dateValue = dateEl.value;

        if (tourValue === "out") {
            const dateEndEl = document.getElementById("datePickerEnd");
            const endDateValue = dateEndEl ? dateEndEl.value : "";
            if (!endDateValue) {
                alert("Please select Tour End Date.");
                return;
            }
            if (dateValue && endDateValue) {
                dateValue = `${dateValue} to ${endDateValue}`;
            }
        }

        const payload = {
            empType: getSelectedEmpType(empTypeEls),
            date: dateValue,
            inTime: inEl.value,
            outTime: outEl.value,
            officialTour: tourValue,
            closedHoliday: getRadioGroupValue(closedHolidayEls) === "yes",
            specialLeave: getRadioGroupValue(specialLeaveEls) === "yes"
        };

        handleSaveRecord(payload);
        refreshAfterDataMutation(monthFilterEl, empTypeEls);
    });

    monthFilterEl.addEventListener("change", function () {
        renderTable();

        if (!monthFilterEl.value) {
            closeSummary();
            return;
        }

        renderSummary(monthFilterEl.value, getSelectedEmpType(empTypeEls));
    });

    empTypeEls.forEach(empTypeEl => {
        empTypeEl.addEventListener("change", function () {
            renderTable();

            if (monthFilterEl.value) {
                renderSummary(monthFilterEl.value, getSelectedEmpType(empTypeEls));
            }
        });
    });

    outEl.addEventListener("focus", function () {
        if (!outEl.value && outEl._flatpickr) outEl._flatpickr.setDate("05:30 PM", false);
    });

    if (closedHolidayEls.length) {
        closedHolidayEls.forEach(closedHolidayEl => closedHolidayEl.addEventListener("change", function () {
            if (getRadioGroupValue(closedHolidayEls) === "yes") {
                setRadioGroupValue(specialLeaveEls, "no");
                if (officialTourEl) {
                    officialTourEl.value = "none";
                    setDatePickerModeForOfficialTour(dateEl, "none");
                }
                clearPunchFields(inEl, outEl);
            } else {
                restorePunchDefaults(inEl, outEl);
            }
        }));
    }

    if (specialLeaveEls.length) {
        specialLeaveEls.forEach(specialLeaveEl => specialLeaveEl.addEventListener("change", function () {
            if (getRadioGroupValue(specialLeaveEls) === "yes") {
                setRadioGroupValue(closedHolidayEls, "no");
                if (officialTourEl) {
                    officialTourEl.value = "none";
                    setDatePickerModeForOfficialTour(dateEl, "none");
                }
                clearPunchFields(inEl, outEl);
            } else {
                restorePunchDefaults(inEl, outEl);
            }
        }));
    }

    if (officialTourEl) {
        officialTourEl.addEventListener("change", function () {
            setDatePickerModeForOfficialTour(dateEl, officialTourEl.value);
            if (officialTourEl.value !== "none") {
                setRadioGroupValue(closedHolidayEls, "no");
                setRadioGroupValue(specialLeaveEls, "no");
            }
            if (officialTourEl.value === "out") {
                clearPunchFields(inEl, outEl);
            } else {
                const dateEndEl = document.getElementById("datePickerEnd");
                if (dateEndEl) {
                    if (dateEndEl._flatpickr) dateEndEl._flatpickr.clear();
                    else dateEndEl.value = "";
                }
                restorePunchDefaults(inEl, outEl);
            }
        });
    }
}

function clearPunchFields(inEl, outEl) {
    if (inEl._flatpickr) inEl._flatpickr.clear();
    else inEl.value = "";
    if (outEl._flatpickr) outEl._flatpickr.clear();
    else outEl.value = "";
}

function restorePunchDefaults(inEl, outEl) {
    if (inEl._flatpickr) inEl._flatpickr.setDate("09:00 AM", false);
    else inEl.value = "09:00 AM";
    if (outEl._flatpickr) outEl._flatpickr.setDate("05:30 PM", false);
    else outEl.value = "05:30 PM";
}

function bindImportExportDeleteActions(ctx) {

    const { monthFilterEl, empTypeEls } = ctx;

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
            importQRFromScanner(() => refreshAfterDataMutation(monthFilterEl, empTypeEls));
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
            refreshAfterDataMutation(monthFilterEl, empTypeEls);
        });
        importFile.value = "";
    });

    qrImageFile.addEventListener("change", function () {
        const file = qrImageFile.files && qrImageFile.files[0];
        if (!file) return;

        importQRFromFile(file, () => {
            refreshAfterDataMutation(monthFilterEl, empTypeEls);
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

        refreshAfterDataMutation(monthFilterEl, empTypeEls);
        closeAllMenus();
    });

    document.addEventListener("click", function (event) {
        if (!event.target.closest(".dropdown")) {
            closeAllMenus();
        }
    });
}

function refreshAfterDataMutation(monthFilterEl, empTypeEls) {
    renderTable();

    if (monthFilterEl.value) {
        renderSummary(monthFilterEl.value, getSelectedEmpType(empTypeEls));
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

    const empType = normalizeEmpType(payload.empType);
    const officialTour = payload.officialTour || "none";
    const selectedDates = parseSelectedDates(payload.date, officialTour);

    if (!selectedDates.length) {
        alert("Please select a valid date.");
        return;
    }

    const closedHoliday = !!payload.closedHoliday;
    const specialLeave = !!payload.specialLeave;
    const outTourId = officialTour === "out" ? selectedDates[0] : null;

    selectedDates.forEach(date => {
        const record = {
            date,
            empType,
            empLabel: getEmpLabel(empType),
            inTime: payload.inTime || "",
            outTime: payload.outTime || "",
            hours: 0,
            status: "",
            reason: "",
            officialTour
        };

        if (closedHoliday) {
            record.officialTour = "none";
            record.inTime = "";
            record.outTime = "";
            record.status = STATUS.COMPLIANT;
            record.reason = REASON.CLOSED;
        } else if (specialLeave) {
            record.officialTour = "none";
            record.outTime = "";
            record.status = STATUS.COMPLIANT;
            record.reason = REASON.SPECIAL;
        } else if (officialTour === "local") {
            if (!record.inTime) {
                record.status = STATUS.NON_COMPLIANT;
                record.reason = REASON.MISSING_PUNCH_IN;
            } else {
                record.status = STATUS.COMPLIANT;
                record.reason = getOfficialTourReason(officialTour, record.inTime, record.outTime, record.date);
            }
        } else if (officialTour === "out") {
            record.outTourId = outTourId;
            record.status = STATUS.COMPLIANT;
            record.reason = getOfficialTourReason(officialTour, record.inTime, record.outTime, record.date);
        } else if (!record.inTime && record.outTime) {
            record.status = STATUS.NON_COMPLIANT;
            record.reason = REASON.MISSING_PUNCH_IN;
        } else if (record.inTime && !record.outTime) {
            const inMin = timeToMinutes(record.inTime);
            const graceEnd = empType === "staff" ? STAFF_GRACE_END : FACULTY_GRACE_END;
            const standardHours = empType === "staff" ? STAFF_STANDARD_HOURS : FACULTY_STANDARD_HOURS;
            const targetOutMin = inMin <= graceEnd ? OFFICE_END_MIN : inMin + (standardHours * 60);
            record.status = STATUS.NON_COMPLIANT;
            record.reason = REASON.MISSING_PUNCH_OUT + " | Target: " + minutesToTime(targetOutMin);
        } else if (!record.inTime && !record.outTime) {
            record.status = STATUS.NON_COMPLIANT;
            record.reason = REASON.MISSING_PUNCH_IN;
        }

        upsertRecord(record);
    });

    const reEvaluated = evaluateMonth(getAllRecords());
    saveAllRecords(reEvaluated);
}

function getSelectedEmpType(empTypeEls) {
    const selected = (empTypeEls || []).find(el => el.checked);
    return normalizeEmpType(selected ? selected.value : "faculty");
}

/**
 * Returns the currently selected value in a radio group.
 */
function getRadioGroupValue(radioEls) {
    const selected = (radioEls || []).find(el => el.checked);
    return selected ? selected.value : "";
}

/**
 * Marks exactly one radio value as checked within a radio group.
 */
function setRadioGroupValue(radioEls, value) {
    (radioEls || []).forEach(el => {
        el.checked = el.value === value;
    });
}

function setDatePickerModeForOfficialTour(dateEl, officialTourValue) {
    const outEndDateRow = document.getElementById("outEndDateRow");
    const datePickerLabel = document.getElementById("datePickerLabel");

    if (officialTourValue === "out") {
        if (outEndDateRow) outEndDateRow.style.display = "";
        if (datePickerLabel) datePickerLabel.textContent = "Tour Start Date";
        if (dateEl && dateEl._flatpickr) dateEl._flatpickr.set("mode", "single");
        return;
    }

    if (outEndDateRow) outEndDateRow.style.display = "none";
    if (datePickerLabel) datePickerLabel.textContent = "Date";

    if (dateEl && dateEl._flatpickr) {
        const selectedDates = dateEl._flatpickr.selectedDates || [];
        dateEl._flatpickr.set("mode", "single");
        if (selectedDates.length > 0) {
            dateEl._flatpickr.setDate(selectedDates[0], false);
        }
    }
}

function parseSelectedDates(dateValue, officialTour) {
    const raw = String(dateValue || "").trim();
    if (!raw) return [];

    if (officialTour !== "out" || !raw.includes(" to ")) {
        const singleDate = raw.split(" to ")[0].trim();
        return isIsoDate(singleDate) ? [singleDate] : [];
    }

    const [startRaw, endRaw] = raw.split(" to ");
    const start = startRaw.trim();
    const end = (endRaw || "").trim();
    if (!isIsoDate(start) || !isIsoDate(end)) return [];

    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return [];

    const dates = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
        dates.push(formatIsoDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
}

function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatIsoDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
