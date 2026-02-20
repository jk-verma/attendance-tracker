/* ============================================================
   MONTHLY RECALCULATION ENGINE
============================================================ */

/**
 * Dispatches a fully-punched record to the appropriate rule set
 * (faculty or staff) and returns the evaluated result.
 */
function applyAttendanceRules(record, relaxationCount, type2Count, type2Limit) {

    if (record.empType === "faculty") {
        return applyFacultyRules(record, relaxationCount);
    }

    if (record.empType === "staff") {
        return applyStaffRules(record, relaxationCount, type2Count, type2Limit);
    }

    return {
        hours: 0,
        status: STATUS.NON_COMPLIANT,
        reason: REASON.REJECT,
        usedRelaxation: false,
        usedType2: false
    };
}

/**
 * Re-evaluates every record in the dataset by applying attendance rules.
 * Records are grouped by (month × empType) so that per-month counters
 * (relaxation, type2) are tracked independently for each employee type.
 */
function evaluateMonth(records) {

    if (!Array.isArray(records)) return [];

    records.sort((a, b) => a.date.localeCompare(b.date));

    // Group records by YYYY-MM so each month is evaluated with its own running counters
    const grouped = {};

    records.forEach(r => {
        r.empType = normalizeEmpType(r.empType, r.empLabel);
        r.empLabel = getEmpLabel(r.empType);
        r.officialTour = r.officialTour || "none";
        const month = r.date.slice(0, 7);
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(r);
    });

    Object.keys(grouped).forEach(month => {

        const monthRecords = grouped[month];

        // Per-month running counters; relaxation and type2 are capped by their respective limits
        let relaxationCount = 0;
        let type2Count = 0;

        const workingDays = calculateWorkingDays(month);
        const closedHolidays = monthRecords.filter(r => r.reason === REASON.CLOSED).length;
        const type2Limit = Math.ceil((workingDays - closedHolidays) * STAFF_LATE_TYPE2_PERCENT);

        monthRecords.forEach(record => {

            // Closed Holiday and Special Leave are always Compliant; skip rule evaluation
            if (record.reason === REASON.CLOSED || record.reason === REASON.SPECIAL) {
                record.status = STATUS.COMPLIANT;
                record.hours = 0;
                return;
            }

            // Local Station tour: Compliant if punched in, otherwise Non-Compliant
            if (record.officialTour === "local") {
                if (!record.inTime) {
                    record.status = STATUS.NON_COMPLIANT;
                    record.reason = REASON.MISSING_PUNCH_IN;
                    record.hours = 0;
                } else {
                    record.status = STATUS.COMPLIANT;
                    record.reason = getOfficialTourReason(record.officialTour, record.inTime, record.outTime, record.date);
                    record.hours = calculateWorkedHours(record.inTime, record.outTime);
                }
                return;
            }

            // Outstation tour: always Compliant; punch times are optional
            if (record.officialTour === "out") {
                record.status = STATUS.COMPLIANT;
                record.reason = getOfficialTourReason(record.officialTour, record.inTime, record.outTime, record.date);
                record.hours = calculateWorkedHours(record.inTime, record.outTime);
                return;
            }

            if (!record.inTime && !record.outTime) {
                record.status = STATUS.NON_COMPLIANT;
                record.reason = REASON.MISSING_PUNCH_IN;
                record.hours = 0;
                return;
            }

            if (!record.inTime) {
                record.status = STATUS.NON_COMPLIANT;
                record.reason = REASON.MISSING_PUNCH_IN;
                record.hours = 0;
                return;
            }

            if (!record.outTime) {
                const inMin = timeToMinutes(record.inTime);
                const graceEnd = record.empType === "staff" ? STAFF_GRACE_END : FACULTY_GRACE_END;
                const standardHours = record.empType === "staff" ? STAFF_STANDARD_HOURS : FACULTY_STANDARD_HOURS;
                const targetOutMin = inMin <= graceEnd ? OFFICE_END_MIN : inMin + (standardHours * 60);
                record.status = STATUS.NON_COMPLIANT;
                record.reason = REASON.MISSING_PUNCH_OUT + " | Target: " + minutesToTime(targetOutMin);
                record.hours = 0;
                return;
            }

            const evaluated = applyAttendanceRules(
                record,
                relaxationCount,
                type2Count,
                type2Limit
            );

            record.hours = evaluated.hours;
            record.status = evaluated.status;
            record.reason = evaluated.reason;

            if (evaluated.usedRelaxation) relaxationCount++;
            if (evaluated.usedType2) type2Count++;
        });
    });

    return records;
}

/**
 * Returns the number of Monday–Friday days in the given YYYY-MM month.
 */
function calculateWorkingDays(month) {

    const [year, m] = month.split("-").map(Number);
    const date = new Date(year, m - 1, 1);
    let count = 0;

    while (date.getMonth() === m - 1) {
        const day = date.getDay(); // 0 = Sunday, 6 = Saturday
        if (day !== 0 && day !== 6) count++;
        date.setDate(date.getDate() + 1);
    }

    return count;
}
