/* ============================================================
   IMPORT / EXPORT MODULE
============================================================ */

function exportCSV(records, filename = "attendance_export.csv") {

    let csv = "Date,Emp,In,Out,Hours,Status,Reason,Official Tour\n";

    records.forEach(r => {
        csv += `${r.date || ""},${getEmpLabel(r.empType || r.empLabel) || ""},${r.inTime || ""},${r.outTime || ""},${r.hours || ""},${r.status || ""},${r.reason || ""},${r.officialTour || "none"}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function importCSV(file, onComplete) {

    const reader = new FileReader();

    reader.onload = function (evt) {

        const lines = evt.target.result.split("\n").filter(l => l.trim() !== "");

        if (!lines.length || !lines[0].includes("Date")) {
            alert("Invalid CSV Format");
            if (typeof onComplete === "function") onComplete(false);
            return;
        }

        const records = [];

        lines.slice(1).forEach(line => {
            const parts = line.split(",");
            if (parts.length < 4) return;

            const empLabel = parts[1].trim() || "Teaching";
            const empType = normalizeEmpType("", empLabel);
            const officialTour = (parts[7] || "none").trim();

            records.push({
                date: parts[0].trim(),
                empType,
                empLabel: getEmpLabel(empType),
                inTime: parts[2].trim(),
                outTime: parts[3].trim(),
                hours: "",
                status: "",
                reason: "",
                officialTour
            });
        });

        const evaluated = evaluateMonth(records);
        saveAllRecords(evaluated);

        if (typeof renderTable === "function") renderTable();
        alert("CSV Imported & Recalculated Successfully");
        if (typeof onComplete === "function") onComplete(true);
    };

    reader.onerror = function () {
        alert("Failed to read CSV file");
        if (typeof onComplete === "function") onComplete(false);
    };

    reader.readAsText(file);
}

function exportQR(records) {

    const container = document.getElementById("qrContainer");
    const readerContainer = document.getElementById("qrReader");
    container.innerHTML = "";
    readerContainer.innerHTML = "";

    if (typeof QRCode === "undefined" || typeof QRCode.toCanvas !== "function") {
        container.innerHTML = "<div>QR library not available for export.</div>";
        return;
    }

    const compact = records.map(r => {
        const entry = [r.date || "", r.empType || "faculty", r.inTime || "", r.outTime || ""];
        if (r.reason === REASON.CLOSED) entry.push("CH");
        else if (r.reason === REASON.SPECIAL) entry.push("SL");
        else if (r.officialTour === "local") entry.push("OTL");
        else if (r.officialTour === "out") entry.push("OTO");
        return entry;
    });

    const payload = JSON.stringify(compact);

    QRCode.toCanvas(payload, { width: 250, errorCorrectionLevel: "L" }, function (err, canvas) {
        if (err) {
            container.innerHTML = "<div style='color:#c62828'>QR code generation failed. Too many records for a single QR code. Try exporting fewer records using Filter Month.</div>";
            return;
        }
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.textContent = "Close QR";
        closeBtn.style.marginBottom = "10px";
        closeBtn.addEventListener("click", closeQrDisplay);
        container.appendChild(closeBtn);
        container.appendChild(canvas);
    });
}

function closeQrDisplay() {
    const container = document.getElementById("qrContainer");
    if (container) container.innerHTML = "";
}

async function importQRFromScanner(onComplete) {

    const readerContainer = document.getElementById("qrReader");
    const qrContainer = document.getElementById("qrContainer");
    readerContainer.innerHTML = "";
    qrContainer.innerHTML = "";

    // Preferred path: html5-qrcode webcam scanner
    if (typeof Html5Qrcode !== "undefined") {
        const started = await startHtml5QrCameraScan(onComplete);
        if (started) return;
    }

    // Secondary path: html5-qrcode scanner widget
    if (typeof Html5QrcodeScanner !== "undefined") {
        const scanner = new Html5QrcodeScanner("qrReader", {
            fps: 5,
            qrbox: function (viewfinderWidth, viewfinderHeight) {
                const size = Math.min(viewfinderWidth, viewfinderHeight);
                return { width: Math.floor(size * 0.7), height: Math.floor(size * 0.7) };
            }
        });

        scanner.render(function (decodedText) {
            const ok = processQrPayload(decodedText, "QR Imported & Recalculated");
            scanner.clear();
            if (typeof onComplete === "function") onComplete(ok);
        });
        return;
    }

    // Native browser fallback for environments without external libs
    if (typeof BarcodeDetector === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        alert("QR scanner is unavailable in this browser. Please use QR Code Image Upload option.");
        if (typeof onComplete === "function") onComplete(false);
        return;
    }

    readerContainer.innerHTML = `
        <div style="margin-bottom:8px">Fallback webcam scanner active. Point camera at QR code.</div>
        <video id="qrFallbackVideo" autoplay playsinline style="width:100%;max-width:300px;border:1px solid #ccc"></video>
        <button id="qrFallbackStop" style="margin-top:8px">Stop Scan</button>
    `;

    const video = document.getElementById("qrFallbackVideo");
    const stopBtn = document.getElementById("qrFallbackStop");
    const detector = new BarcodeDetector({ formats: ["qr_code"] });

    let stop = false;
    let stream;

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
    } catch (e) {
        alert("Unable to access camera for QR scanning.");
        if (typeof onComplete === "function") onComplete(false);
        return;
    }

    function cleanup() {
        stop = true;
        if (stream) stream.getTracks().forEach(t => t.stop());
        readerContainer.innerHTML = "";
    }

    stopBtn.addEventListener("click", () => {
        cleanup();
        if (typeof onComplete === "function") onComplete(false);
    });

    const scanLoop = async () => {
        if (stop) return;

        try {
            const barcodes = await detector.detect(video);
            const qr = barcodes.find(b => b.rawValue);
            if (qr) {
                const ok = processQrPayload(qr.rawValue, "QR Imported & Recalculated");
                cleanup();
                if (typeof onComplete === "function") onComplete(ok);
                return;
            }
        } catch (e) {
            // continue scanning
        }

        requestAnimationFrame(scanLoop);
    };

    requestAnimationFrame(scanLoop);
}

async function startHtml5QrCameraScan(onComplete) {

    const readerContainer = document.getElementById("qrReader");
    readerContainer.innerHTML = `
        <div style="margin-bottom:8px">Webcam scanner active. Point camera at QR code.</div>
        <div id="qrReaderCamera" style="width:100%"></div>
        <button id="qrCameraStop" style="margin-top:8px">Stop Scan</button>
    `;

    let html5QrCode;

    try {
        html5QrCode = new Html5Qrcode("qrReaderCamera");
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras || cameras.length === 0) {
            readerContainer.innerHTML = "";
            return false;
        }

        const preferred = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[0];

        await html5QrCode.start(
            preferred.id,
            {
                fps: 5,
                qrbox: function (viewfinderWidth, viewfinderHeight) {
                    const size = Math.min(viewfinderWidth, viewfinderHeight);
                    return { width: Math.floor(size * 0.7), height: Math.floor(size * 0.7) };
                }
            },
            (decodedText) => {
                const ok = processQrPayload(decodedText, "QR Imported & Recalculated");
                html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
                readerContainer.innerHTML = "";
                if (typeof onComplete === "function") onComplete(ok);
            },
            () => {}
        );

        const stopBtn = document.getElementById("qrCameraStop");
        stopBtn.addEventListener("click", () => {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
            readerContainer.innerHTML = "";
            if (typeof onComplete === "function") onComplete(false);
        });

        return true;

    } catch (e) {
        if (html5QrCode) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
        }
        readerContainer.innerHTML = "";
        return false;
    }
}

function importQRFromFile(file, onComplete) {

    if (!file) {
        if (typeof onComplete === "function") onComplete(false);
        return;
    }

    if (typeof Html5Qrcode !== "undefined") {
        const readerContainer = document.getElementById("qrReader");
        const qrContainer = document.getElementById("qrContainer");
        readerContainer.innerHTML = "";
        qrContainer.innerHTML = "";

        const html5QrCode = new Html5Qrcode("qrReader");

        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                const ok = processQrPayload(decodedText, "QR File Imported & Recalculated");
                html5QrCode.clear();
                if (typeof onComplete === "function") onComplete(ok);
            })
            .catch(() => {
                fallbackManualQrImport(onComplete);
            });
        return;
    }

    if (typeof BarcodeDetector !== "undefined") {
        createImageBitmap(file)
            .then(async bitmap => {
                const detector = new BarcodeDetector({ formats: ["qr_code"] });
                const barcodes = await detector.detect(bitmap);
                const qr = barcodes.find(b => b.rawValue);
                if (!qr) {
                    fallbackManualQrImport(onComplete);
                    return;
                }

                const ok = processQrPayload(qr.rawValue, "QR File Imported & Recalculated");
                if (typeof onComplete === "function") onComplete(ok);
            })
            .catch(() => {
                fallbackManualQrImport(onComplete);
            });
        return;
    }

    fallbackManualQrImport(onComplete);
}

function fallbackManualQrImport(onComplete) {
    const manualPayload = prompt("Unable to decode QR image in this browser. Paste QR JSON payload here:");
    if (!manualPayload) {
        if (typeof onComplete === "function") onComplete(false);
        return;
    }

    const ok = processQrPayload(manualPayload, "QR Payload Imported & Recalculated");
    if (typeof onComplete === "function") onComplete(ok);
}

function processQrPayload(decodedText, successMessage) {

    try {
        const parsed = JSON.parse(decodedText);

        if (!Array.isArray(parsed)) {
            alert("Invalid QR Data");
            return false;
        }

        let records;

        if (parsed.length > 0 && Array.isArray(parsed[0])) {
            records = parsed.map(entry => {
                const rec = {
                    date: entry[0] || "",
                    empType: normalizeEmpType(entry[1]),
                    empLabel: getEmpLabel(entry[1] || "faculty"),
                    inTime: entry[2] || "",
                    outTime: entry[3] || "",
                    hours: 0,
                    status: "",
                    reason: "",
                    officialTour: "none"
                };
                if (entry[4] === "CH") {
                    rec.status = STATUS.COMPLIANT;
                    rec.reason = REASON.CLOSED;
                } else if (entry[4] === "SL") {
                    rec.status = STATUS.COMPLIANT;
                    rec.reason = REASON.SPECIAL;
                } else if (entry[4] === "OTL") {
                    rec.officialTour = "local";
                } else if (entry[4] === "OTO") {
                    rec.officialTour = "out";
                }
                return rec;
            });
        } else {
            records = parsed;
        }

        records.forEach(r => upsertRecord(r));

        const allRecords = getAllRecords();
        const evaluated = evaluateMonth(allRecords);
        saveAllRecords(evaluated);

        if (typeof renderTable === "function") renderTable();
        alert(successMessage);
        return true;

    } catch (e) {
        alert("Invalid QR Data");
        return false;
    }
}
