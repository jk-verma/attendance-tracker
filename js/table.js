/* ============================================================
   TABLE MODULE
============================================================ */

function renderTable() {

    const tbody = document.querySelector("#recordsTable tbody");
    if (!tbody) return;

    const selectedMonth = document.getElementById("monthFilter").value;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const filterMonth = selectedMonth || currentMonth;

    let records = getAllRecords();

    records = records.filter(r => r.date.startsWith(filterMonth));

    tbody.innerHTML = "";

    records.forEach(record => {

        const tr = document.createElement("tr");

        if (record.reason === REASON.MISSING_PUNCH_IN) {
            tr.className = "status-pending";
        } else if (record.reason && record.reason.startsWith(REASON.MISSING_PUNCH_OUT)) {
            tr.className = "status-pending";        
        } else if (record.reason === REASON.CLOSED || record.reason === REASON.SPECIAL) {
            tr.className = "status-neutral";
        } else if (record.officialTour === "local" || record.officialTour === "out") {
            tr.className = "status-official-tour";
        } else if (record.status === STATUS.COMPLIANT) {
            tr.className = "status-compliant";
        } else {
            tr.className = "status-noncompliant";
        }

        tr.innerHTML = `
            <td>${record.date || ""}</td>
            <td>${getEmpLabel(record.empType || record.empLabel) || ""}</td>
            <td>${record.inTime || ""}</td>
            <td>${record.outTime || ""}</td>
            <td>${record.hours || ""}</td>
            <td>${record.status || ""}</td>
            <td>${record.reason || ""}</td>
            <td><button onclick="loadRecordForEdit('${record.date}')">Edit</button></td>
            <td><button onclick="deleteRecord('${record.date}')" style="background:#c62828">Delete</button></td>
        `;

        tbody.appendChild(tr);
    });
}

function loadRecordForEdit(date) {

    const record = getAllRecords().find(r => r.date === date);
    if (!record) return;

    const normalizedType = normalizeEmpType(record.empType, record.empLabel);
    document.querySelectorAll("input[name='empType']").forEach(el => {
        el.checked = (el.value === normalizedType);
    });

    const officialTourEl = document.getElementById("officialTour");
    if (officialTourEl) officialTourEl.value = record.officialTour || "none";

    const dateInput = document.getElementById("datePicker");
    const inInput = document.getElementById("punchIn");
    const outInput = document.getElementById("punchOut");

    if (dateInput._flatpickr) dateInput._flatpickr.setDate(record.date, false);
    else dateInput.value = record.date;

    if (inInput._flatpickr) inInput._flatpickr.setDate(record.inTime || "", false);
    else inInput.value = record.inTime || "";

    if (outInput._flatpickr) outInput._flatpickr.setDate(record.outTime || "", false);
    else outInput.value = record.outTime || "";
}

function deleteRecord(date) {

    if (!confirm("Delete record for " + date + " ?")) return;

    deleteRecordByDate(date);
    renderTable();

    const month = document.getElementById("monthFilter").value;
    const checkedEmpType = document.querySelector("input[name='empType']:checked");
    const empType = checkedEmpType ? checkedEmpType.value : "faculty";

    if (month) renderSummary(month, empType);
}
