/* ============================================================
   STORAGE LAYER
   ------------------------------------------------------------
   Single responsibility:
   - Read / Write attendance records
   - Ensure single record per date
   - Always return data sorted by date (ascending)
============================================================ */

const STORAGE_KEY = 'attendance_records_v1';

/* ------------------------------------------------------------
   Get All Records (Sorted by Date)
------------------------------------------------------------ */
function getAllRecords() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return data.sort((a, b) => a.date.localeCompare(b.date));
}

/* ------------------------------------------------------------
   Save Full Dataset
------------------------------------------------------------ */
function saveAllRecords(records) {
    const sorted = records.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
}

/* ------------------------------------------------------------
   Get Record By Date
------------------------------------------------------------ */
function getRecordByDate(date) {
    const records = getAllRecords();
    return records.find(r => r.date === date) || null;
}

/* ------------------------------------------------------------
   Add or Overwrite Record (Single Entry Enforcement)
------------------------------------------------------------ */
function upsertRecord(newRecord) {
    let records = getAllRecords();

    const existingIndex = records.findIndex(r => r.date === newRecord.date);

    if (existingIndex !== -1) {
        // overwrite
        records[existingIndex] = newRecord;
    } else {
        records.push(newRecord);
    }

    saveAllRecords(records);
}

/* ------------------------------------------------------------
   Delete By Date
------------------------------------------------------------ */
function deleteRecordByDate(date) {
    const records = getAllRecords().filter(r => r.date !== date);
    saveAllRecords(records);
}

/* ------------------------------------------------------------
   Delete Filter Month
------------------------------------------------------------ */
function deleteByMonth(month) {
    const records = getAllRecords()
        .filter(r => !r.date.startsWith(month));
    saveAllRecords(records);
}

/* ------------------------------------------------------------
   Clear Entire Storage
------------------------------------------------------------ */
function clearAllRecords() {
    localStorage.removeItem(STORAGE_KEY);
}
