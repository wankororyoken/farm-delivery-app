// ── 設定 ─────────────────────────────────────────────
var SPREADSHEET_ID = '1GEfGO4_t4l5bmftBA2pXncZ1kXdMYtZBhdsvIjz4L-o';
var SHEET_NAME     = 'Sheet1'; // データが入っているタブ名
var DATA_START_ROW = 2;         // 1行目がヘッダーなので2から
var COL = { DATE:0, PRODUCT:1, QTY:2, UNIT_PRICE:3, AMOUNT:4, BUSINESS:5, DESTINATION:6 };

// ── エントリポイント ──────────────────────────────────
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('農場配達管理')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// style.html / script.html をインクルードするためのヘルパー
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ── サーバー関数（クライアントから呼び出される） ──────

// 全データを2次元配列で返す
function getSheetData() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return [];
  return sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 7).getValues();
}

// 行の配列をシート末尾に追記する
function appendRows(rows) {
  var sheet = getSheet_();
  rows.forEach(function(row) { sheet.appendRow(row); });
  return rows.length;
}

// ── 内部ユーティリティ ────────────────────────────────
function getSheet_() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('シート「' + SHEET_NAME + '」が見つかりません。コード.gs の SHEET_NAME を確認してください。');
  return sheet;
}
