/* ============================================================
   FACULTY ATTENDANCE RULES
============================================================ */

const FACULTY_CONFIG = {
    OFFICE_START: OFFICE_START_MIN,
    OFFICE_END: OFFICE_END_MIN,
    GRACE_END: FACULTY_GRACE_END,
    MAX_IN: FACULTY_LATE_END,
    RELAX_LIMIT: 10 * 60,
    MIN_FULL_HOURS: FACULTY_STANDARD_HOURS,
    MIN_RELAX_HOURS: 7.5
};

function applyFacultyRules(record, relaxationCount) {

<<<<<<< Updated upstream
    const inMin = timeToMinutes(record.inTime); // from config.js
    const outMin = timeToMinutes(record.outTime); // from config.js
=======
    const inMin = timeToMinutes(record.inTime); // From config.js
    const outMin = timeToMinutes(record.outTime); // From config.js
>>>>>>> Stashed changes
    const workedHours = (outMin - inMin) / 60;

    if (inMin <= FACULTY_CONFIG.OFFICE_START && outMin >= FACULTY_CONFIG.OFFICE_END) {
        return facultyBuildResult(workedHours, STATUS.COMPLIANT, REASON.ON_TIME);
    }

    if (inMin > FACULTY_CONFIG.OFFICE_START && inMin <= FACULTY_CONFIG.GRACE_END && outMin >= FACULTY_CONFIG.OFFICE_END) {
        return facultyBuildResult(workedHours, STATUS.COMPLIANT, REASON.GRACE);
    }

    const lateRelax = inMin <= FACULTY_CONFIG.RELAX_LIMIT && outMin >= FACULTY_CONFIG.OFFICE_END;
    const earlyRelax = inMin <= FACULTY_CONFIG.OFFICE_START && outMin >= (FACULTY_CONFIG.OFFICE_END - 60);

    if (relaxationCount < FACULTY_RELAXATION_LIMIT && (lateRelax || earlyRelax) && workedHours >= FACULTY_CONFIG.MIN_RELAX_HOURS) {
        return facultyBuildResult(workedHours, STATUS.COMPLIANT, REASON.SEMI_RELAX, true);
    }

    if (inMin > FACULTY_CONFIG.GRACE_END && inMin <= FACULTY_CONFIG.MAX_IN && workedHours >= FACULTY_CONFIG.MIN_FULL_HOURS) {
        return facultyBuildResult(workedHours, STATUS.COMPLIANT, REASON.LATE_COMP);
    }

    return facultyBuildResult(workedHours, STATUS.NON_COMPLIANT, REASON.REJECT);
}

function facultyBuildResult(hours, status, reason, usedRelaxation = false) {
    return {
        hours: Math.round(hours * 100) / 100,
        status,
        reason,
        usedRelaxation,
        usedType2: false
    };
}
<<<<<<< Updated upstream
=======

// function facultyToMinutes(timeStr) {
//     if (!timeStr) return 0;
//     const [h, mPart] = timeStr.split(":");
//     const [m, period] = mPart.split(" ");
//     let hour = parseInt(h, 10);
//     const minute = parseInt(m, 10);

//     if (period === "PM" && hour !== 12) hour += 12;
//     if (period === "AM" && hour === 12) hour = 0;

//     return hour * 60 + minute;
// }
>>>>>>> Stashed changes
