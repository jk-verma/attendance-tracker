/* ============================================================
   STAFF ATTENDANCE RULES
============================================================ */

const STAFF_CONFIG = {
    OFFICE_START: OFFICE_START_MIN,
    OFFICE_END: OFFICE_END_MIN,
    GRACE_END: STAFF_GRACE_END,
    TYPE1_END: STAFF_LATE_TYPE1_END,
    TYPE2_END: STAFF_LATE_TYPE2_END,
    MIN_FULL_HOURS: STAFF_STANDARD_HOURS,
    MIN_RELAX_HOURS: 7.5
};

/**
 * Evaluates a staff attendance record and returns { hours, status, reason,
 * usedRelaxation, usedType2 }.
 *
 * Decision order:
 *  1. On-Time      — in ≤ 09:00, out ≥ 17:30
 *  2. Grace        — in 09:01–09:10, out ≥ 17:30
 *  3. Late-Comp Type I  — in 09:11–09:30, worked ≥ 8.5 h
 *  4. Late-Comp Type II — in 09:31–10:00, worked ≥ 8.5 h, within monthly 30% cap
 *  5. Relaxation   — quota available, late-in or early-out with ≥ 7.5 h worked
 *  6. Non-Compliant
 */
function applyStaffRules(record, relaxationCount, type2Count, type2Limit) {

    const inMin = staffToMinutes(record.inTime);
    const outMin = staffToMinutes(record.outTime);
    const workedHours = (outMin - inMin) / 60;

    // Punch-In on time, Punch-Out on or after office end
    if (inMin <= STAFF_CONFIG.OFFICE_START && outMin >= STAFF_CONFIG.OFFICE_END) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.ON_TIME);
    }

    // Punch-In within the 10-minute grace window (09:01–09:10)
    if (inMin > STAFF_CONFIG.OFFICE_START && inMin <= STAFF_CONFIG.GRACE_END && outMin >= STAFF_CONFIG.OFFICE_END) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.GRACE);
    }

    // Late Compensation Type I: in 09:11–09:30, must work at least 8.5 h
    if (inMin > STAFF_CONFIG.GRACE_END && inMin <= STAFF_CONFIG.TYPE1_END && workedHours >= STAFF_CONFIG.MIN_FULL_HOURS) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.LATE_COMP_TYPE1);
    }

    // Late Compensation Type II: in 09:31–10:00, must work ≥ 8.5 h, subject to the monthly 30% cap
    if (inMin > STAFF_CONFIG.TYPE1_END && inMin <= STAFF_CONFIG.TYPE2_END && workedHours >= STAFF_CONFIG.MIN_FULL_HOURS && type2Count < type2Limit) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.LATE_COMP_TYPE2, false, true);
    }

    // Semimonthly relaxation: up to 2 times per month, requires ≥ 7.5 h worked
    const lateRelax = inMin <= STAFF_CONFIG.TYPE2_END && outMin >= STAFF_CONFIG.OFFICE_END;
    const earlyRelax = inMin <= STAFF_CONFIG.OFFICE_START && outMin >= (STAFF_CONFIG.OFFICE_END - 60);

    if (relaxationCount < STAFF_RELAXATION_LIMIT && (lateRelax || earlyRelax) && workedHours >= STAFF_CONFIG.MIN_RELAX_HOURS) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.SEMI_RELAX, true);
    }

    return staffBuildResult(workedHours, STATUS.NON_COMPLIANT, REASON.REJECT);
}

/** Constructs the standardized result object returned by applyStaffRules. */
function staffBuildResult(hours, status, reason, usedRelaxation = false, usedType2 = false) {
    return {
        hours: Math.round(hours * 100) / 100,
        status,
        reason,
        usedRelaxation,
        usedType2
    };
}

/** Converts a 12-hour time string ("hh:mm AM/PM") to minutes from midnight. Returns 0 for empty input. */
function staffToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, mPart] = timeStr.split(":");
    const [m, period] = mPart.split(" ");
    let hour = parseInt(h, 10);
    const minute = parseInt(m, 10);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
}
