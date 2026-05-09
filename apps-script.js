// ============================================================
// GOOGLE APPS SCRIPT — Angels Tournament Backend
// ============================================================
// HOW TO USE:
// 1. Open your Google Sheet
// 2. Click Extensions → Apps Script
// 3. Paste this entire file (replace default code)
// 4. Click 💾 Save
// 5. Click Deploy → New deployment → Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Click Deploy, authorize, then copy the Web App URL
// ============================================================

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = sheet.getRange('A1').getValue();
  var output = ContentService.createTextOutput(data || 'null');
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (e && e.postData && e.postData.contents) {
    sheet.getRange('A1').setValue(e.postData.contents);
  }
  var output = ContentService.createTextOutput(JSON.stringify({ ok: true }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
