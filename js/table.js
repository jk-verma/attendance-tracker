/* ============================================================
   TABLE MODULE
   ------------------------------------------------------------
   - Responsible ONLY for rendering records table
   - No attendance logic here
   - No storage logic here
============================================================ */

function renderTable() {

    const tbody = document.querySelector("#recordsTable tbody");
    if (!tbody) return;

    const selectedMonth = document.getElementById("monthFilter").value;

    let records = getAllRecords()
        .sort((a, b) => a.date.localeCompare(b.date));

    // Show only current month unless filter selected
    if (selectedMonth) {
        records = records.filter(r => r.date.startsWith(selectedMonth));
    }

    tbody.innerHTML = "";

    records.forEach(record => {

        const tr = document.createElement("tr");

        // Row coloring
        if (record.reason === "Pending Punch-Out") {
            tr.className = "status-pending";
        } 
        else if (record.reason === "Closed Holiday" || record.reason === "Special Leave") {
            tr.className = "status-neutral";
        }
        else if (record.status === "Compliant") {
            tr.className = "status-compliant";
        } 
        else {
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
            <td>
                <button onclick="loadRecordForEdit('${record.date}')">
                    Edit
                </button>
            </td>
            <td>
                <button onclick="deleteRecord('${record.date}')" 
                        style="background:#c62828">
                    Delete
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}


/* ============================================================
   LOAD RECORD INTO UI FOR EDITING
============================================================ */

function loadRecordForEdit(date) {

    const record = getAllRecords().find(r => r.date === date);
    if (!record) return;

    document.getElementById("empType").value = record.empType;
    document.getElementById("datePicker")._flatpickr.setDate(record.date, false);
    document.getElementById("punchIn")._flatpickr.setDate(record.inTime || "", false);
    document.getElementById("punchOut")._flatpickr.setDate(record.outTime || "", false);
}


/* ============================================================
   DELETE SINGLE RECORD
============================================================ */

function deleteRecord(date) {

    if (!confirm("Delete record for " + date + " ?")) return;

    let records = getAllRecords()
        .filter(r => r.date !== date);

    saveAllRecords(records);

    renderTable();
}
