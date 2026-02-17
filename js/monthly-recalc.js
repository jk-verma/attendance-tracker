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

    const result = [];

    // Group records by empType and month
    const groups = {};
    records.forEach(r => {
        const key = `${r.empType}-${getMonthKey(r.date)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    });

    Object.keys(groups).forEach(key => {
        const groupRecords = groups[key];
        const [empType, month] = key.split('-');

        let relaxationCount = 0;
        let type2Count = 0;

        const workingDays = calculateWorkingDays(month);
        const closedHolidays = groupRecords.filter(r => r.reason === REASON.CLOSED).length;
        const type2Limit = empType === "staff"
            ? Math.floor((workingDays - closedHolidays) * STAFF_LATE_TYPE2_PERCENT)
            : 0;

        groupRecords.forEach(record => {
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

            let evaluated;

            if (empType === "faculty") {
                evaluated = applyFacultyRules(record, relaxationCount);
            } else if (empType === "staff") {
                evaluated = applyStaffRules(record, relaxationCount, type2Count, type2Limit);
            } else {
                evaluated = {
                    hours: 0,
                    status: STATUS.NON_COMPLIANT,
                    reason: REASON.REJECT,
                    usedRelaxation: false,
                    usedType2: false
                };
            }

            record.hours = evaluated.hours;
            record.status = evaluated.status;
            record.reason = evaluated.reason;

            if (evaluated.usedRelaxation) relaxationCount++;
            if (evaluated.usedType2) type2Count++;
        });

        
        result.push(...groupRecords);
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
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
