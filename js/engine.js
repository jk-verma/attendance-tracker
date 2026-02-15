/* ============================================================
   ENGINE MODULE
   Version: v1.0 Stable
   Purpose:
   - Central rule coordinator
   - Decides which rule engine to call
   - Standardizes evaluation response format
   - Ensures separation of concerns

   IMPORTANT:
   - No DOM access
   - No localStorage access
   - No UI logic
   - Pure evaluation orchestration only
============================================================ */

/**
 * Evaluate a single attendance record
 * @param {Object} record - Raw attendance record
 * @param {Object} monthContext - Monthly context data (relaxation counters etc.)
 * @returns {Object} evaluatedRecord
 */
function evaluateRecord(record, monthContext) {

    if (!record || !record.empType) {
        console.error("Invalid record structure.");
        return record;
    }

    let result;

    if (record.empType === "faculty") {

        if (typeof evaluateFaculty !== "function") {
            console.error("Faculty rule engine not loaded.");
            return record;
        }

        result = evaluateFaculty(record, monthContext);

    } else if (record.empType === "staff") {

        if (typeof evaluateStaff !== "function") {
            console.error("Staff rule engine not loaded.");
            return record;
        }

        result = evaluateStaff(record, monthContext);

    } else {
        console.error("Unknown employee type:", record.empType);
        return record;
    }

    return result;
}


/**
 * Evaluate an entire month's records chronologically
 * This ensures:
 * - Semimonthly relaxation applied in order
 * - 30% rule applied dynamically
 * - No retroactive misclassification
 *
 * @param {Array} records
 * @returns {Array} evaluatedRecords
 */
function evaluateMonth(records) {

    if (!Array.isArray(records)) return [];

    // Always sort chronologically
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

    let monthContext = {
        facultyRelaxCount: 0,
        staffRelaxCount: 0,
        staffType2Count: 0,
        workingDays: 0,
        closedHolidays: 0
    };

    const evaluated = [];

    sorted.forEach(record => {

        const evaluatedRecord = evaluateRecord(record, monthContext);

        // Update counters AFTER evaluation
        if (evaluatedRecord.reason === REASON.SEMI_RELAX) {
            if (record.empType === "faculty") {
                monthContext.facultyRelaxCount++;
            }
            if (record.empType === "staff") {
                monthContext.staffRelaxCount++;
            }
        }

        if (evaluatedRecord.reason === REASON.LATE_COMP_TYPE2) {
            monthContext.staffType2Count++;
        }

        evaluated.push(evaluatedRecord);
    });

    return evaluated;
}
