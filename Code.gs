/*
 * Google Apps Script для свадебного RSVP.
 * Вставьте код в script.google.com, задайте SPREADSHEET_ID и разверните как Web App.
 */

const SPREADSHEET_ID = "1zNae73_qVsRDNf5krayV0a7pkfuGPnRtMkLoRLE8THw";
const SHEET_NAME = "Ответы";

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["timestamp", "имя", "фамилия", "приду/не приду", "способ связи", "контакт", "алкоголь"]);
  }
  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || "{}");
    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const attendance = String(data.attendance || "").trim();
    const contactMethod = String(data.contactMethod || "").trim();
    const contact = String(data.contact || "").trim();
    const allowedAttendance = ["Приду!", "К сожалению, не получится"];
    const allowedMethods = ["Email", "Телефон"];
    const allowedAlcohol = ["Вино", "Шампанское", "Крепкие напитки"];
    const alcohol = Array.isArray(data.alcohol)
      ? data.alcohol.filter(item => allowedAlcohol.includes(item))
      : [];

    if (!firstName || !lastName || !allowedAttendance.includes(attendance) ||
        !allowedMethods.includes(contactMethod) || !contact) {
      throw new Error("Некорректные или неполные данные.");
    }

    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      safeCell_(firstName),
      safeCell_(lastName),
      attendance,
      contactMethod,
      safeCell_(contact),
      alcohol.join(", ")
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// JSONP: позволяет админ-странице на GitHub Pages читать данные без настройки CORS.
function doGet(e) {
  const callback = e && e.parameter ? e.parameter.callback : "";
  try {
    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    const rows = values.slice(1).map(row => ({
      timestamp: row[0] instanceof Date
        ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), "dd.MM.yyyy HH:mm:ss")
        : String(row[0] || ""),
      firstName: String(row[1] || ""),
      lastName: String(row[2] || ""),
      attendance: String(row[3] || ""),
      contactMethod: String(row[4] || ""),
      contact: String(row[5] || ""),
      alcohol: String(row[6] || "").split(", ").filter(Boolean)
    })).reverse();

    return output_( { ok: true, rows: rows }, callback);
  } catch (error) {
    console.error(error);
    return output_({ ok: false, error: error.message, rows: [] }, callback);
  }
}

function output_(data, callback) {
  const json = JSON.stringify(data);
  // Имя callback ограничиваем безопасными символами.
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

// Защита от интерпретации текста гостя как формулы в Google Sheets.
function safeCell_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}
