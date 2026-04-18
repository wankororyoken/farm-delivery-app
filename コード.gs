// ── 設定 ─────────────────────────────────────────────
var SPREADSHEET_ID = '1GEfGO4_t4l5bmftBA2pXncZ1kXdMYtZBhdsvIjz4L-o';
var SHEET_NAME     = 'Sheet1';
var DATA_START_ROW = 2;  // 1行目がヘッダー
var COL = { DATE:0, PRODUCT:1, QTY:2, UNIT_PRICE:3, AMOUNT:4, BUSINESS:5, DESTINATION:6 };

// ── エントリポイント ──────────────────────────────────
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('農場配達管理')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ── サーバー関数 ──────────────────────────────────────

// 起動時: 品名履歴・事業・納品先の選択肢だけを返す（軽量）
function getMetadata() {
  var data = getAllData_();
  var products     = {};
  var businessSet  = {};
  var destSet      = {};

  data.forEach(function(row) {
    var date      = formatDateStr_(row[COL.DATE]);
    var product   = String(row[COL.PRODUCT]    || '').trim();
    var unitPrice = parseFloat(row[COL.UNIT_PRICE]) || 0;
    var biz       = String(row[COL.BUSINESS]   || '').trim();
    var dest      = String(row[COL.DESTINATION]|| '').trim();

    if (product) {
      if (!products[product]) products[product] = [];
      products[product].push({ date: date, unitPrice: unitPrice });
    }
    if (biz)  businessSet[biz]  = true;
    if (dest) destSet[dest]     = true;
  });

  return {
    products:     products,
    businesses:   Object.keys(businessSet).sort(),
    destinations: Object.keys(destSet).sort()
  };
}

// 一覧・請求書用: 指定月のデータのみ返す（サーバー側フィルタで転送量削減）
// month: "2026-02" 形式。省略時は全件
function getSheetData(month) {
  var data = getAllData_();
  if (!month) return data.map(rowToArray_);

  var m = parseInt(month.split('-')[1]);
  return data.filter(function(row) {
    return extractMonth_(row[COL.DATE]) === m;
  }).map(rowToArray_);
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
  if (!sheet) throw new Error('シート「' + SHEET_NAME + '」が見つかりません。');
  return sheet;
}

function getAllData_() {
  var sheet   = getSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return [];
  return sheet.getRange(DATA_START_ROW, 1, lastRow - DATA_START_ROW + 1, 7).getValues();
}

// GASのDateオブジェクトや数値を文字列に統一
function formatDateStr_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return (val.getMonth() + 1) + '月' + val.getDate() + '日';
  }
  return String(val);
}

// 行データをそのまま返す（Dateオブジェクトを文字列に変換）
function rowToArray_(row) {
  return row.map(function(cell) {
    if (cell instanceof Date) return formatDateStr_(cell);
    return cell;
  });
}

// 日付文字列から月を数値で取り出す
function extractMonth_(val) {
  var str = formatDateStr_(val);
  var jp    = str.match(/^(\d+)月/);
  if (jp) return parseInt(jp[1]);
  var slash = str.match(/^\d{4}\/(\d+)\//);
  if (slash) return parseInt(slash[1]);
  var iso   = str.match(/^\d{4}-(\d{2})-/);
  if (iso) return parseInt(iso[1]);
  return -1;
}
