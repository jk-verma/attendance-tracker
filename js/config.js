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
    PENDING: "Pending Punch-Out",
    MISSING_PUNCH_IN: "Missing Punch-In",
    MISSING_PUNCH_OUT: "Missing Punch-Out",
    CLOSED: "Closed Holiday",
    SPECIAL: "Special Leave",
    OFFICIAL_TOUR_LOCAL: "Official Tour—Local Station",
    OFFICIAL_TOUR_OUT: "Official Tour—Out Station"
};

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

function normalizeEmpType(empType, empLabel = "") {
    const type = String(empType || "").toLowerCase();
    const label = String(empLabel || "").toLowerCase();
    const normalizedLabel = label.replace(/-/g, "");
    if (type === "staff" || type === "non-teaching" || type === "nonteaching" || label.includes("staff") || label.includes("non-teaching") || normalizedLabel.includes("nonteaching")) {
        return "staff";
    }
    return "faculty";
}

function getEmpLabel(empType) {
    return normalizeEmpType(empType) === "staff" ? "Non-Teaching" : "Teaching";
}

function getOfficialTourReason(officialTour, inTime, outTime) {
    if (officialTour === "local") {
        return outTime ? REASON.OFFICIAL_TOUR_LOCAL : REASON.OFFICIAL_TOUR_LOCAL + " | Punch-Out Exempted";
    }

    if (officialTour === "out") {
        if (!inTime && !outTime) return REASON.OFFICIAL_TOUR_OUT + " | Punch-In & Punch-Out Exempted";
        if (!inTime) return REASON.OFFICIAL_TOUR_OUT + " | Punch-In Exempted";
        if (!outTime) return REASON.OFFICIAL_TOUR_OUT + " | Punch-Out Exempted";
        return REASON.OFFICIAL_TOUR_OUT;
    }

    return "";
}

function calculateWorkedHours(inTime, outTime) {
    const inMin = timeToMinutes(inTime);
    const outMin = timeToMinutes(outTime);
    if (!inTime || !outTime || inMin == null || outMin == null) return 0;
    return Math.round(((outMin - inMin) / 60) * 100) / 100;
}
