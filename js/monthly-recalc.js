/* ============================================================
   MONTHLY RECALCULATION ENGINE
============================================================ */

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

function evaluateMonth(records) {

    if (!Array.isArray(records)) return [];

    records.sort((a, b) => a.date.localeCompare(b.date));

    const grouped = {};

    records.forEach(r => {
        const month = r.date.slice(0, 7);
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(r);
    });

    Object.keys(grouped).forEach(month => {

        const monthRecords = grouped[month];

        let relaxationCount = 0;
        let type2Count = 0;

        const workingDays = calculateWorkingDays(month);
        const closedHolidays = monthRecords.filter(r => r.reason === REASON.CLOSED).length;
        const type2Limit = Math.floor((workingDays - closedHolidays) * STAFF_LATE_TYPE2_PERCENT);

        monthRecords.forEach(record => {

            if (record.reason === REASON.CLOSED || record.reason === REASON.SPECIAL) {
                record.status = STATUS.COMPLIANT;
                record.hours = 0;
                return;
            }

            if (!record.outTime) {
                record.status = STATUS.NON_COMPLIANT;
                record.reason = REASON.PENDING;
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

function calculateWorkingDays(month) {

    const [year, m] = month.split("-").map(Number);
    const date = new Date(year, m - 1, 1);
    let count = 0;

    while (date.getMonth() === m - 1) {
        const day = date.getDay();
        if (day !== 0 && day !== 6) count++;
        date.setDate(date.getDate() + 1);
    }

    return count;
}
