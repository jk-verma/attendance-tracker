/* ============================================================
   ================= STAFF ATTENDANCE RULES =================
   Office Timing:
   - Start: 09:00 AM  (540 mins)
   - End  : 05:30 PM  (1050 mins)

   Rule Priority Order:
   1. On-Time
   2. Grace (09:01–09:10)
   3. Semimonthly Relaxation (max 2 per month)
   4. Late Compensation Type I  (09:11–09:30, ≥ 8.5 hrs)
   5. Late Compensation Type II (09:31–10:00, ≥ 8.5 hrs,
                                  ≤ 30% of (WorkingDays - ClosedHolidays))
   6. Else → REJECT
============================================================ */

const STAFF_CONFIG = {
    OFFICE_START: 540,
    OFFICE_END: 1050,
    GRACE_END: 550,          // 09:10
    TYPE1_END: 570,          // 09:30
    TYPE2_END: 600,          // 10:00
    MIN_FULL_HOURS: 8.5,
    MIN_RELAX_HOURS: 7.5
};

/* ============================================================
   MAIN ENTRY FUNCTION
   Arguments:
   - record
   - relaxationCount (Semimonthly used)
   - type2Count (Existing Type II count)
   - type2Limit (30% cap)
============================================================ */

function applyStaffRules(record, relaxationCount, type2Count, type2Limit) {

    const inMin = toMinutes(record.inTime);
    const outMin = toMinutes(record.outTime);
    const workedHours = (outMin - inMin) / 60;

    /* ------------------------------
       1. ON-TIME
    -------------------------------- */
    if (inMin <= STAFF_CONFIG.OFFICE_START &&
        outMin >= STAFF_CONFIG.OFFICE_END) {

        return buildResult(workedHours, "Compliant", "On-Time");
    }

    /* ------------------------------
       2. GRACE
    -------------------------------- */
    if (inMin > STAFF_CONFIG.OFFICE_START &&
        inMin <= STAFF_CONFIG.GRACE_END &&
        outMin >= STAFF_CONFIG.OFFICE_END) {

        return buildResult(workedHours, "Compliant", "Grace");
    }

    /* ------------------------------
       3. SEMIMONTHLY RELAXATION
       (Late ≤ 10:00 OR Early ≥ 4:30)
    -------------------------------- */
    const lateRelax =
        inMin <= STAFF_CONFIG.TYPE2_END &&
        outMin >= STAFF_CONFIG.OFFICE_END;

    const earlyRelax =
        inMin <= STAFF_CONFIG.OFFICE_START &&
        outMin >= (STAFF_CONFIG.OFFICE_END - 60);

    if (relaxationCount < 2 &&
        (lateRelax || earlyRelax) &&
        workedHours >= STAFF_CONFIG.MIN_RELAX_HOURS) {

        return buildResult(
            workedHours,
            "Compliant",
            "Semimonthly Relaxation",
            true
        );
    }

    /* ------------------------------
       4. LATE COMPENSATION TYPE I
       09:11–09:30
    -------------------------------- */
    if (inMin > STAFF_CONFIG.GRACE_END &&
        inMin <= STAFF_CONFIG.TYPE1_END &&
        workedHours >= STAFF_CONFIG.MIN_FULL_HOURS) {

        return buildResult(
            workedHours,
            "Compliant",
            "Late Compensation Type I"
        );
    }

    /* ------------------------------
       5. LATE COMPENSATION TYPE II
       09:31–10:00
       WITH 30% CAP
    -------------------------------- */
    if (inMin > STAFF_CONFIG.TYPE1_END &&
        inMin <= STAFF_CONFIG.TYPE2_END &&
        workedHours >= STAFF_CONFIG.MIN_FULL_HOURS &&
        type2Count < type2Limit) {

        return buildResult(
            workedHours,
            "Compliant",
            "Late Compensation Type II",
            false,
            true
        );
    }

    /* ------------------------------
       6. REJECT
    -------------------------------- */
    return buildResult(workedHours, "Non-Compliant", "REJECT");
}

/* ============================================================
   HELPER
============================================================ */

function buildResult(
    hours,
    status,
    reason,
    usedRelaxation = false,
    usedType2 = false
) {
    return {
        hours: Math.round(hours * 100) / 100,
        status,
        reason,
        usedRelaxation,
        usedType2
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
