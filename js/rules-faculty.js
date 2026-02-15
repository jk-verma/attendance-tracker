/* ============================================================
   ================= FACULTY ATTENDANCE RULES =================
   Office Timing:
   - Start: 09:00 AM  (540 mins)
   - End  : 05:30 PM  (1050 mins)

   Rule Order (Strict Priority):
   1. On-Time
   2. Grace (09:01–09:10)
   3. Semimonthly Relaxation (max 2 per month)
   4. Late Compensation (09:11–10:30 with ≥ 8.5 hrs)
   5. Else → REJECT
============================================================ */

const FACULTY_CONFIG = {
    OFFICE_START: 540,
    OFFICE_END: 1050,
    GRACE_END: 550,       // 09:10
    MAX_IN: 630,          // 10:30
    RELAX_LIMIT: 600,     // 10:00
    MIN_FULL_HOURS: 8.5,
    MIN_RELAX_HOURS: 7.5
};

/* ============================================================
   MAIN ENTRY FUNCTION
============================================================ */

function applyFacultyRules(record, relaxationCount) {

    const inMin = toMinutes(record.inTime);
    const outMin = toMinutes(record.outTime);
    const workedHours = (outMin - inMin) / 60;

    /* ------------------------------
       1. ON-TIME
    -------------------------------- */
    if (inMin <= FACULTY_CONFIG.OFFICE_START &&
        outMin >= FACULTY_CONFIG.OFFICE_END) {

        return buildResult(workedHours, "Compliant", "On-Time");
    }

    /* ------------------------------
       2. GRACE (09:01–09:10)
    -------------------------------- */
    if (inMin > FACULTY_CONFIG.OFFICE_START &&
        inMin <= FACULTY_CONFIG.GRACE_END &&
        outMin >= FACULTY_CONFIG.OFFICE_END) {

        return buildResult(workedHours, "Compliant", "Grace");
    }

    /* ------------------------------
       3. SEMIMONTHLY RELAXATION
       Max 2 per month
    -------------------------------- */
    const lateRelax =
        inMin <= FACULTY_CONFIG.RELAX_LIMIT &&
        outMin >= FACULTY_CONFIG.OFFICE_END;

    const earlyRelax =
        inMin <= FACULTY_CONFIG.OFFICE_START &&
        outMin >= (FACULTY_CONFIG.OFFICE_END - 60);

    if (relaxationCount < 2 &&
        (lateRelax || earlyRelax) &&
        workedHours >= FACULTY_CONFIG.MIN_RELAX_HOURS) {

        return buildResult(
            workedHours,
            "Compliant",
            "Semimonthly Relaxation",
            true
        );
    }

    /* ------------------------------
       4. LATE COMPENSATION
       09:11–10:30 AND ≥ 8.5 hrs
    -------------------------------- */
    if (inMin > FACULTY_CONFIG.GRACE_END &&
        inMin <= FACULTY_CONFIG.MAX_IN &&
        workedHours >= FACULTY_CONFIG.MIN_FULL_HOURS) {

        return buildResult(
            workedHours,
            "Compliant",
            "Late Compensation"
        );
    }

    /* ------------------------------
       5. REJECT
    -------------------------------- */
    return buildResult(workedHours, "Non-Compliant", "REJECT");
}

/* ============================================================
   HELPER
============================================================ */

function buildResult(hours, status, reason, usedRelaxation = false) {
    return {
        hours: Math.round(hours * 100) / 100,
        status,
        reason,
        usedRelaxation
    };
}

/* ============================================================
   TIME UTILITY
============================================================ */

function toMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, mPart] = timeStr.split(":");
    const [m, period] = mPart.split(" ");
    let hour = parseInt(h);
    const minute = parseInt(m);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
}
