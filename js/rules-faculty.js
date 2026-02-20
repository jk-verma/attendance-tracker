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

/**
 * Evaluates a faculty attendance record and returns { hours, status, reason,
 * usedRelaxation, usedType2 }.
 *
 * Decision order:
 *  1. On-Time      — in ≤ 09:00, out ≥ 17:30
 *  2. Grace        — in 09:01–09:10, out ≥ 17:30
 *  3. Late-Comp    — in 09:11–10:30, worked ≥ 8.5 h
 *  4. Relaxation   — quota available, late-in or early-out with ≥ 7.5 h worked
 *  5. Non-Compliant
 */
function applyFacultyRules(record, relaxationCount) {

    const inMin = facultyToMinutes(record.inTime);
    const outMin = facultyToMinutes(record.outTime);
    const workedHours = (outMin - inMin) / 60;

    // Punch-In on time, Punch-Out on or after office end
    if (inMin <= FACULTY_CONFIG.OFFICE_START && outMin >= FACULTY_CONFIG.OFFICE_END) {
        return facultyBuildResult(workedHours, STATUS.COMPLIANT, REASON.ON_TIME);
    }

    // Punch-In within the 10-minute grace window (09:01–09:10)
    if (inMin > FACULTY_CONFIG.OFFICE_START && inMin <= FACULTY_CONFIG.GRACE_END && outMin >= FACULTY_CONFIG.OFFICE_END) {
        return facultyBuildResult(workedHours, STATUS.COMPLIANT, REASON.GRACE);
    }

    // Late Punch-In (09:11–10:30) compensated by completing at least 8.5 hours
    if (inMin > FACULTY_CONFIG.GRACE_END && inMin <= FACULTY_CONFIG.MAX_IN && workedHours >= FACULTY_CONFIG.MIN_FULL_HOURS) {
        return facultyBuildResult(workedHours, STATUS.COMPLIANT, REASON.LATE_COMP);
    }

    // Semimonthly relaxation: up to 2 times per month, requires ≥ 7.5 h worked
    const lateRelax = inMin <= FACULTY_CONFIG.RELAX_LIMIT && outMin >= FACULTY_CONFIG.OFFICE_END;
    const earlyRelax = inMin <= FACULTY_CONFIG.OFFICE_START && outMin >= (FACULTY_CONFIG.OFFICE_END - 60);

    if (relaxationCount < FACULTY_RELAXATION_LIMIT && (lateRelax || earlyRelax) && workedHours >= FACULTY_CONFIG.MIN_RELAX_HOURS) {
        return facultyBuildResult(workedHours, STATUS.COMPLIANT, REASON.SEMI_RELAX, true);
    }

    return facultyBuildResult(workedHours, STATUS.NON_COMPLIANT, REASON.REJECT);
}

/** Constructs the standardized result object returned by applyFacultyRules. */
function facultyBuildResult(hours, status, reason, usedRelaxation = false) {
    return {
        hours: Math.round(hours * 100) / 100,
        status,
        reason,
        usedRelaxation,
        usedType2: false
    };
}

/** Converts a 12-hour time string ("hh:mm AM/PM") to minutes from midnight. Returns 0 for empty input. */
function facultyToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, mPart] = timeStr.split(":");
    const [m, period] = mPart.split(" ");
    let hour = parseInt(h, 10);
    const minute = parseInt(m, 10);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
}
