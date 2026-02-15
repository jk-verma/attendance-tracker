/* ============================================================
   TEST HARNESS MODULE
   ------------------------------------------------------------
   - Strict validation for Faculty & Staff logic
   - Does NOT modify real data
   - Can be executed manually from console:
       runAllTests()
============================================================ */

function assert(condition, message) {
    if (!condition) {
        console.error("❌ FAIL:", message);
    } else {
        console.log("✅ PASS:", message);
    }
}

/* ============================================================
   FACULTY TESTS
============================================================ */

function testFacultyRules() {

    console.log("=== Faculty Rule Tests ===");

    // On-Time
    let r = evaluateFaculty("09:00 AM", "05:30 PM", 1);
    assert(r.reason === "On-Time", "Faculty On-Time");

    // Grace
    r = evaluateFaculty("09:05 AM", "05:30 PM", 1);
    assert(r.reason === "Grace", "Faculty Grace");

    // Late Compensation (9:30 + 8.5h)
    r = evaluateFaculty("09:30 AM", "06:00 PM", 1);
    assert(r.reason === "Late Compensation", "Faculty Late Compensation");

    // Semimonthly Relaxation (Late)
    r = evaluateFaculty("09:45 AM", "05:30 PM", 0);
    assert(r.reason === "Semimonthly Relaxation", "Faculty Relaxation Late");

    // Reject
    r = evaluateFaculty("10:45 AM", "05:30 PM", 1);
    assert(r.status === "Non-Compliant", "Faculty Reject >10:30");
}


/* ============================================================
   STAFF TESTS
============================================================ */

function testStaffRules() {

    console.log("=== Staff Rule Tests ===");

    // On-Time
    let r = evaluateStaff("09:00 AM", "05:30 PM", 1, 0, 20);
    assert(r.reason === "On-Time", "Staff On-Time");

    // Grace
    r = evaluateStaff("09:08 AM", "05:30 PM", 1, 0, 20);
    assert(r.reason === "Grace", "Staff Grace");

    // Late Compensation Type I (9:20 + 8.5h)
    r = evaluateStaff("09:20 AM", "06:00 PM", 1, 0, 20);
    assert(r.reason === "Late Compensation—Type I", "Staff Late Type I");

    // Late Compensation Type II (9:45 + 8.5h within 30%)
    r = evaluateStaff("09:45 AM", "06:15 PM", 1, 2, 20);
    assert(
        r.reason === "Late Compensation—Type II",
        "Staff Late Type II (within 30%)"
    );

    // Reject >10:00
    r = evaluateStaff("10:15 AM", "06:00 PM", 1, 0, 20);
    assert(r.status === "Non-Compliant", "Staff Reject >10:00");
}


/* ============================================================
   MASTER TEST RUNNER
============================================================ */

function runAllTests() {
    console.clear();
    testFacultyRules();
    testStaffRules();
    console.log("=== Test Execution Completed ===");
}
