/**
 * NNN provider directory — Apps Script JSON endpoint
 *
 * Deploy
 * 1. Open the Google Sheet (NNN Provider Directory).
 * 2. Extensions → Apps Script. Replace the default file with this script. Save.
 * 3. Deploy → New deployment → type: Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 4. Copy the web app URL (ends in /exec).
 * 5. Do not put this web app on the site request path. The live site reads
 *    the public CSV export and caches it. Apps Script web apps are capped at
 *    about 30 simultaneous executions per owning user.
 *    The sheet must stay shared so anyone with the link can view.
 *
 * The script returns only rows whose status is "published".
 * Specialty cells are passed through as written. The site splits on commas.
 * Adding a new specialty in the sheet does not require a script change.
 *
 * Web app deployments from script.google.com are requested with CORS open
 * (Access-Control-Allow-Origin: *) by Google’s exec endpoint when access is
 * Anyone. The site still loads the sheet on the server if you leave the
 * script URL blank, so a CORS miss does not take the directory down.
 */
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var values = sheet.getDataRange().getValues();
  if (!values.length) return json_([]);

  var headers = values[0].map(function (header) {
    return String(header || "").trim();
  });
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var record = {};
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      var cell = values[i][c];
      record[headers[c]] = cell == null ? "" : String(cell);
    }
    var status = String(record.status || "")
      .trim()
      .toLowerCase();
    if (status !== "published") continue;
    if (!record.display_name) continue;
    rows.push(record);
  }

  return json_(rows);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
