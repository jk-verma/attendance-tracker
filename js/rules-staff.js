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

function applyStaffRules(record, relaxationCount, type2Count, type2Limit) {

    const inMin = timeToMinutes(record.inTime); // From config.js
    const outMin = timeToMinutes(record.outTime); // From config.js
    const workedHours = (outMin - inMin) / 60;

    if (inMin <= STAFF_CONFIG.OFFICE_START && outMin >= STAFF_CONFIG.OFFICE_END) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.ON_TIME);
    }

    if (inMin > STAFF_CONFIG.OFFICE_START && inMin <= STAFF_CONFIG.GRACE_END && outMin >= STAFF_CONFIG.OFFICE_END) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.GRACE);
    }

    const lateRelax = inMin <= STAFF_CONFIG.TYPE2_END && outMin >= STAFF_CONFIG.OFFICE_END;
    const earlyRelax = inMin <= STAFF_CONFIG.OFFICE_START && outMin >= (STAFF_CONFIG.OFFICE_END - 60);

    if (relaxationCount < STAFF_RELAXATION_LIMIT && (lateRelax || earlyRelax) && workedHours >= STAFF_CONFIG.MIN_RELAX_HOURS) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.SEMI_RELAX, true);
    }

    if (inMin > STAFF_CONFIG.GRACE_END && inMin <= STAFF_CONFIG.TYPE1_END && workedHours >= STAFF_CONFIG.MIN_FULL_HOURS) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.LATE_COMP_TYPE1);
    }

    if (inMin > STAFF_CONFIG.TYPE1_END && inMin <= STAFF_CONFIG.TYPE2_END && workedHours >= STAFF_CONFIG.MIN_FULL_HOURS && type2Count < type2Limit) {
        return staffBuildResult(workedHours, STATUS.COMPLIANT, REASON.LATE_COMP_TYPE2, false, true);
    }

    return staffBuildResult(workedHours, STATUS.NON_COMPLIANT, REASON.REJECT);
}

function staffBuildResult(hours, status, reason, usedRelaxation = false, usedType2 = false) {
    return {
        hours: Math.round(hours * 100) / 100,
        status,
        reason,
        usedRelaxation,
        usedType2
    };
}

