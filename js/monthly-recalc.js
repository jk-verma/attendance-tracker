/* ============================================================
   MONTHLY RECALCULATION ENGINE
   Version: v1.0 Stable
   Purpose:
   - Sort records chronologically
   - Apply attendance rules in date order
   - Enforce:
        • Semimonthly relaxation (max 2)
        • Staff 30% rule
   - Return fully recalculated records
============================================================ */

function evaluateMonth(records) {

    if (!Array.isArray(records)) return [];

    // Sort chronologically
    records.sort((a, b) => a.date.localeCompare(b.date));

    // Group by YYYY-MM
    const grouped = {};

    records.forEach(r => {
        const month = r.date.slice(0, 7);
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(r);
    });

    // Process each month separately
    Object.keys(grouped).forEach(month => {

        const monthRecords = grouped[month];

        let relaxationCount = 0;
        let type2Count = 0;

        const workingDays = calculateWorkingDays(month);
        const closedHolidays = monthRecords.filter(r => r.reason === "Closed Holiday").length;

        const type2Limit = Math.floor((workingDays - closedHolidays) * 0.30);

        monthRecords.forEach(record => {

            // Skip holidays
            if (record.reason === "Closed Holiday" || record.reason === "Special Leave") {
                record.status = "Compliant";
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

/* ============================================================
   WORKING DAYS CALCULATION (Mon–Fri)
============================================================ */

function calculateWorkingDays(month) {

    const [year, m] = month.split("-").map(Number);
    const date = new Date(year, m - 1, 1);
    let count = 0;

    while (date.getMonth() === m - 1) {
        const day = date.getDay();
        if (day !== 0 && day !== 6) count++; // Mon-Fri
        date.setDate(date.getDate() + 1);
    }

    return count;
}
