/* ============================================================
   CONFIG MODULE
   Version: v1.0 Stable
   Purpose:
   - Centralized constants
   - Time references
   - Threshold definitions
   - Storage key definition
   - Shared utility helpers
   NOTE:
   - No DOM access
   - No attendance logic
   - No UI bindings
============================================================ */

/* ============================================================
   STORAGE CONFIG
============================================================ */

const STORAGE_KEY = "attendance_records_v21";

/* ============================================================
   OFFICE TIMING (Minutes from Midnight)
============================================================ */

const OFFICE_START_MIN = 9 * 60;          // 09:00 AM → 540
const OFFICE_END_MIN   = 17 * 60 + 30;    // 05:30 PM → 1050

/* ============================================================
   FACULTY RULE LIMITS
============================================================ */

// Grace Window: 09:01 – 09:10
const FACULTY_GRACE_START = OFFICE_START_MIN + 1;     // 541
const FACULTY_GRACE_END   = OFFICE_START_MIN + 10;    // 550

// Late Compensation Window: 09:11 – 10:30
const FACULTY_LATE_START  = OFFICE_START_MIN + 11;    // 551
const FACULTY_LATE_END    = 10 * 60 + 30;             // 630

// Semimonthly Relaxation Limit
const FACULTY_RELAXATION_LIMIT = 2;

// Required Duty Hours
const FACULTY_STANDARD_HOURS = 8.5;

/* ============================================================
   STAFF RULE LIMITS
============================================================ */

// Grace Window: 09:01 – 09:10
const STAFF_GRACE_START = OFFICE_START_MIN + 1;
const STAFF_GRACE_END   = OFFICE_START_MIN + 10;

// Late Compensation Type I: 09:11 – 09:30
const STAFF_LATE_TYPE1_START = OFFICE_START_MIN + 11; // 551
const STAFF_LATE_TYPE1_END   = 9 * 60 + 30;           // 570

// Late Compensation Type II: 09:31 – 10:00
const STAFF_LATE_TYPE2_START = 9 * 60 + 31;           // 571
const STAFF_LATE_TYPE2_END   = 10 * 60;               // 600

// 30% Rule Percentage
const STAFF_LATE_TYPE2_PERCENT = 0.30;

// Semimonthly Relaxation Limit
const STAFF_RELAXATION_LIMIT = 2;

// Required Duty Hours
const STAFF_STANDARD_HOURS = 8.5;

/* ============================================================
   STATUS LABELS
============================================================ */

const STATUS = {
    COMPLIANT: "Compliant",
    NON_COMPLIANT: "Non-Compliant"
};

const REASON = {
    ON_TIME: "On-Time",
    GRACE: "Grace",
    SEMI_RELAX: "Semimonthly Relaxation",
    LATE_COMP: "Late Compensation",
    LATE_COMP_TYPE1: "Late Compensation—Type I",
    LATE_COMP_TYPE2: "Late Compensation—Type II",
    REJECT: "REJECT",
    PENDING_IN: "Pending Punch-In",
    PENDING_OUT: "Pending Punch-Out",
    CLOSED: "Closed Holiday",
    SPECIAL: "Special Leave"
};

function buildPendingOutReason(targetOutTime) {
    if (!targetOutTime) return REASON.PENDING_OUT;
    return `${REASON.PENDING_OUT} : ${targetOutTime}`;
}

function isPendingOutReason(reason) {
    if (!reason) return false;
    return reason === REASON.PENDING_OUT || reason.startsWith(`${REASON.PENDING_OUT} :`);
}

/* ============================================================
   UTILITY FUNCTIONS
============================================================ */

/**
 * Convert "hh:mm AM/PM" to minutes from midnight
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return null;

    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

/**
 * Convert minutes to "hh:mm AM/PM"
 */
function minutesToTime(minutes) {
    if (minutes == null) return "";

    let hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hrs >= 12 ? "PM" : "AM";

    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;

    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${period}`;
}

/**
 * Calculate duty hours
 */
function calculateHours(inMin, outMin) {
    if (inMin == null || outMin == null) return 0;
    return ((outMin - inMin) / 60).toFixed(2);
}

/**
 * Get month string from date (YYYY-MM)
 */
function getMonthKey(dateStr) {
    if (!dateStr) return "";
    return dateStr.substring(0, 7);
}

/**
 * Check if date is weekday (Mon–Fri)
 */
function isWeekday(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day >= 1 && day <= 5;
}
