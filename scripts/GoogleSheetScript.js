// -----------------------------------------------------------------------------
// Google Apps Script for PackTrack
// -----------------------------------------------------------------------------
// Instructions:
// 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1WQl9Lp0JzaBqKa42L4jRGA3coh_VfnMMy8TA_0tRGWk/edit
// 2. Go to Extensions > Apps Script
// 3. Delete any code there and paste this entire script.
// 4. Click 'Deploy' > 'New deployment'.
// 5. Select type: 'Web app'.
// 6. Description: 'PackTrack API'
// 7. Execute as: 'Me' (your email).
// 8. Who has access: 'Anyone'. (IMPORTANT)
// 9. Click 'Deploy', authorize accesses, and copy the 'Web app URL'.
// -----------------------------------------------------------------------------

const SHEET_NAME = "Answer Form";
const START_ROW = 2; // Skip header
const START_COL = 1; // Column A (Timestamp)
const END_COL = 25; // Column Y (Remark)

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return responseJSON({ status: "error", message: "Sheet not found" });
    }

    // Handle POST (Add Data)
    if (e.parameter.action === "add") {
      const data = JSON.parse(e.postData.contents);

      // Prepare row data (Indices 0-24 matching A-Y)
      // We expect the client to send an array of values matching the columns
      // But for safety, we construct it here or expect a mapped object.
      // Let's expect the client to send a flat array of values for columns B-Y (indices 1-24)
      // And we generate Timestamp (A) here.

      const newRow = [new Date(), ...data.values]; // A: Timestamp, B-Y: Data

      sheet.appendRow(newRow);
      return responseJSON({ status: "success", message: "Row added" });
    }

    // Handle GET (Read Data)
    const lastRow = sheet.getLastRow();

    if (lastRow < START_ROW) {
      return responseJSON({ status: "success", data: [] });
    }

    // Get range A2:Y[lastRow]
    const range = sheet.getRange(
      START_ROW,
      START_COL,
      lastRow - START_ROW + 1,
      END_COL
    );
    const values = range.getDisplayValues(); // Use display values to get formatted strings

    // Map to simple object structure if needed, or just return arrays
    // Returning 2D array is efficient
    return responseJSON({ status: "success", data: values });
  } catch (error) {
    return responseJSON({ status: "error", message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}
