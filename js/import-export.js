/* ============================================================
   IMPORT / EXPORT MODULE
   Version: v1.0 Stable
   Purpose:
   - CSV Import
   - CSV Export
   - QR Export
   - QR Import
   NOTE:
   - No rule logic here
   - Recalculation triggered after import
============================================================ */

/* ================= CSV EXPORT ================= */

function exportCSV(records, filename = "attendance_export.csv") {
    let csv = "Date,Emp,In,Out,Hours,Status,Reason\n";
    records.forEach(r => {
        csv += `${r.date || ""},${r.empLabel || ""},${r.inTime || ""},${r.outTime || ""},${r.hours || ""},${r.status || ""},${r.reason || ""}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

/* ================= CSV IMPORT ================= */

function importCSV(file) {

    const reader = new FileReader();

    reader.onload = function (evt) {

        const lines = evt.target.result.split('\n').filter(l => l.trim() !== '');
        if (!lines[0].includes("Date")) {
            alert("Invalid CSV Format");
            return;
        }

        let records = [];

        lines.slice(1).forEach(line => {
            const parts = line.split(",");
            if (parts.length < 4) return;

            records.push({
                date: parts[0].trim(),
                empType: parts[1].trim().toLowerCase(),
                empLabel: parts[1].trim(),
                inTime: parts[2].trim(),
                outTime: parts[3].trim(),
                hours: "",
                status: "",
                reason: ""
            });
        });

        // Recalculate using engine
        const evaluated = evaluateMonth(records);
        saveAllRecords(evaluated);

        if (typeof renderTable === "function") renderTable();
        alert("CSV Imported & Recalculated Successfully");

    };

    reader.readAsText(file);
}

/* ================= QR EXPORT ================= */

function exportQR(records) {
    const payload = JSON.stringify(records);
    const container = document.getElementById("qrContainer");
    container.innerHTML = "";

    QRCode.toCanvas(payload, { width: 250 }, function (err, canvas) {
        if (!err) container.appendChild(canvas);
    });
}

/* ================= QR IMPORT ================= */

function importQR() {

    const readerContainer = document.getElementById("qrReader");
    readerContainer.innerHTML = "";

    if (typeof Html5QrcodeScanner === "undefined") {
        alert("QR Scanner Library Missing");
        return;
    }

    const scanner = new Html5QrcodeScanner("qrReader", { fps: 10, qrbox: 250 });

    scanner.render(function (decodedText) {

        try {
            const parsed = JSON.parse(decodedText);
            const evaluated = evaluateMonth(parsed);
            saveAllRecords(evaluated);

            if (typeof renderTable === "function") renderTable();

            scanner.clear();
            alert("QR Imported & Recalculated");

        } catch (e) {
            alert("Invalid QR Data");
        }

    });
}
