/* ============================================================
   SUMMARY MODULE
============================================================ */

function generateMonthlySummary(month, empType) {

    const records = getAllRecords()
        .filter(r => r.date.startsWith(month))
        .filter(r => r.empType === empType);

    const summary = {
        total: records.length,
        compliant: 0,
        nonCompliant: 0,
        missingPunchIn: 0,
        missingPunchOut: 0,
        grace: 0,
        relaxation: 0,
        lateComp: 0,
        lateCompTypeI: 0,
        lateCompTypeII: 0,
        closedHoliday: 0,
        specialLeave: 0,
        officialTourLocal: 0,
        officialTourOut: 0
    };

    records.forEach(r => {
        if (r.reason === REASON.CLOSED) summary.closedHoliday++;
        if (r.reason === REASON.SPECIAL) summary.specialLeave++;
        if (r.reason === REASON.MISSING_PUNCH_IN) summary.missingPunchIn++;
        if (r.reason && r.reason.startsWith(REASON.MISSING_PUNCH_OUT)) summary.missingPunchOut++;

        if (r.status === STATUS.COMPLIANT) summary.compliant++;
        if (r.status === STATUS.NON_COMPLIANT) summary.nonCompliant++;

        if (r.reason === REASON.GRACE) summary.grace++;
        if (r.reason === REASON.SEMI_RELAX) summary.relaxation++;
        if (r.reason === REASON.LATE_COMP) summary.lateComp++;
        if (r.reason === REASON.LATE_COMP_TYPE1) summary.lateCompTypeI++;
        if (r.reason === REASON.LATE_COMP_TYPE2) summary.lateCompTypeII++;
        if (r.reason && r.reason.startsWith(REASON.OFFICIAL_TOUR_LOCAL)) summary.officialTourLocal++;
        if (r.reason && r.reason.startsWith(REASON.OFFICIAL_TOUR_OUT)) summary.officialTourOut++;
    });

    return summary;
}

function renderSummary(month, empType) {

    const panel = document.getElementById("summaryPanel");
    if (!panel) return;

    const s = generateMonthlySummary(month, empType);

    let html = `
        <div class="summary-header">
            <h3>${month}</h3>
            <button type="button" class="summary-close" onclick="closeSummary()">Close ✕</button>
        </div>
    `;

    if (empType === "faculty") {
        html += `
        <div class="summary-box">
            <div>Total Records: ${s.total}</div>
            <div>Compliant: ${s.compliant}</div>
            <div>Non-Compliant: ${s.nonCompliant}</div>
            <div>Grace: ${s.grace}</div>
            <div>Relaxation: ${s.relaxation}/${FACULTY_RELAXATION_LIMIT}</div>
            <div>Late Compensation: ${s.lateComp}</div>
            <div>Missing Punch-In: ${s.missingPunchIn}</div>
            <div>Missing Punch-Out: ${s.missingPunchOut}</div>
            <div>Official Tour (Local Station): ${s.officialTourLocal}</div>
            <div>Official Tour (Outstation): ${s.officialTourOut}</div>
            <div>Closed Holiday: ${s.closedHoliday}</div>
            <div>Special Leave: ${s.specialLeave}</div>
        </div>`;
    }

    if (empType === "staff") {
        const workingDays = calculateWorkingDays(month);
        const type2Limit = Math.ceil((workingDays - s.closedHoliday) * STAFF_LATE_TYPE2_PERCENT);

        html += `
        <div class="summary-box">
            <div>Total Records: ${s.total}</div>
            <div>Compliant: ${s.compliant}</div>
            <div>Non-Compliant: ${s.nonCompliant}</div>
            <div>Grace: ${s.grace}</div>
            <div>Relaxation: ${s.relaxation}/${STAFF_RELAXATION_LIMIT}</div>
            <div>Late Compensation Type I: ${s.lateCompTypeI}</div>
            <div>Late Compensation Type II: ${s.lateCompTypeII}/${type2Limit}</div>
            <div>Missing Punch-In: ${s.missingPunchIn}</div>
            <div>Missing Punch-Out: ${s.missingPunchOut}</div>
            <div>Official Tour (Local Station): ${s.officialTourLocal}</div>
            <div>Official Tour (Outstation): ${s.officialTourOut}</div>
            <div>Closed Holiday: ${s.closedHoliday}</div>
            <div>Special Leave: ${s.specialLeave}</div>
        </div>`;
    }

    panel.innerHTML = html;
    panel.style.display = "block";
}

function closeSummary() {
    const panel = document.getElementById("summaryPanel");
    if (!panel) return;
    panel.innerHTML = "";
    panel.style.display = "none";
}
