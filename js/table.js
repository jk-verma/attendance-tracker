/* ============================================================
   TABLE MODULE
============================================================ */

function renderTable() {

    const tbody = document.querySelector("#recordsTable tbody");
    if (!tbody) return;

    const selectedMonth = document.getElementById("monthFilter").value;

    let records = getAllRecords();

    if (selectedMonth) {
        records = records.filter(r => r.date.startsWith(selectedMonth));
    }

    tbody.innerHTML = "";

    records.forEach(record => {

        const tr = document.createElement("tr");

        if (isPendingOutReason(record.reason)) {
            tr.className = "status-pending";
        } else if (record.reason === REASON.CLOSED || record.reason === REASON.SPECIAL) {
            tr.className = "status-neutral";
        } else if (record.status === STATUS.COMPLIANT) {
            tr.className = "status-compliant";
        } else {
            tr.className = "status-noncompliant";
        }

        tr.innerHTML = `
            <td>${record.date || ""}</td>
            <td>${record.empLabel || ""}</td>
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

    document.getElementById("empType").value = record.empType;

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
    const empType = document.getElementById("empType").value;

    if (month) renderSummary(month, empType);
}
