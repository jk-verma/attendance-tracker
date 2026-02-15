/* ============================================================
   SUMMARY MODULE
   ------------------------------------------------------------
   - Generates Filter Month Summary
   - Faculty and Staff handled separately
   - Does NOT open automatically
   - Called only when monthFilter is deliberately selected
============================================================ */

function generateMonthlySummary(month, empType) {

    const records = getAllRecords()
        .filter(r => r.date.startsWith(month))
        .filter(r => r.empType === empType);

    const summary = {
        total: records.length,
        compliant: 0,
        nonCompliant: 0,
        pending: 0,
        grace: 0,
        relaxation: 0,
        lateComp: 0,
        lateCompTypeI: 0,
        lateCompTypeII: 0,
        closedHoliday: 0,
        specialLeave: 0
    };

    records.forEach(r => {

        if (r.reason === "Closed Holiday") summary.closedHoliday++;
        if (r.reason === "Special Leave") summary.specialLeave++;
        if (r.reason === "Pending Punch-Out") summary.pending++;

        if (r.status === "Compliant") summary.compliant++;
        if (r.status === "Non-Compliant") summary.nonCompliant++;

        if (r.reason === "Grace") summary.grace++;
        if (r.reason === "Semimonthly Relaxation") summary.relaxation++;
        if (r.reason === "Late Compensation") summary.lateComp++;
        if (r.reason === "Late Compensation—Type I") summary.lateCompTypeI++;
        if (r.reason === "Late Compensation—Type II") summary.lateCompTypeII++;
    });

    return summary;
}


/* ============================================================
   RENDER SUMMARY PANEL
============================================================ */

function renderSummary(month, empType) {

    const panel = document.getElementById("summaryPanel");
    if (!panel) return;

    const s = generateMonthlySummary(month, empType);

    let html = `<h3>${month}</h3>`;

    if (empType === "faculty") {

        html += `
        <div>Total Records: ${s.total}</div>
        <div>Compliant: ${s.compliant}</div>
        <div>Non-Compliant: ${s.nonCompliant}</div>
        <div>Grace: ${s.grace}</div>
        <div>Relaxation: ${s.relaxation}/2</div>
        <div>Late Compensation: ${s.lateComp}</div>
        <div>Pending Punch-Out: ${s.pending}</div>
        <div>Closed Holiday: ${s.closedHoliday}</div>
        <div>Special Leave: ${s.specialLeave}</div>
        `;
    }

    if (empType === "staff") {

        const workingDays = calculateWorkingDays(month);
        const relaxLimit = Math.floor(workingDays * 0.30);

        html += `
        <div>Total Records: ${s.total}</div>
        <div>Compliant: ${s.compliant}</div>
        <div>Non-Compliant: ${s.nonCompliant}</div>
        <div>Grace: ${s.grace}</div>
        <div>Relaxation: ${s.relaxation}/2</div>
        <div>Late Compensation Type I: ${s.lateCompTypeI}</div>
        <div>Late Compensation Type II: ${s.lateCompTypeII}/${relaxLimit}</div>
        <div>Pending Punch-Out: ${s.pending}</div>
        <div>Closed Holiday: ${s.closedHoliday}</div>
        <div>Special Leave: ${s.specialLeave}</div>
        `;
    }

    panel.innerHTML = html;
    panel.style.display = "block";
}


/* ============================================================
   CLOSE SUMMARY PANEL
============================================================ */

function closeSummary() {
    const panel = document.getElementById("summaryPanel");
    if (panel) panel.style.display = "none";
}
