// ── 設定 ─────────────────────────────────────────────
var SPREADSHEET_ID = '1GEfGO4_t4l5bmftBA2pXncZ1kXdMYtZBhdsvIjz4L-o';
var SHEET_NAME     = 'Sheet1';
var DATA_START_ROW = 2;
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

// 起動時: 品名履歴・事業・納品先の選択肢のみ返す（軽量）
function getMetadata() {
  var data     = getAllData_();
  var products = {};
  var bizSet   = {};
  var destSet  = {};

  data.forEach(function(row) {
    var date      = normalizeDate_(row[COL.DATE]);
    var product   = String(row[COL.PRODUCT]    || '').trim();
    var unitPrice = parseFloat(row[COL.UNIT_PRICE]) || 0;
    var biz       = String(row[COL.BUSINESS]   || '').trim();
    var dest      = String(row[COL.DESTINATION]|| '').trim();

    if (product) {
      if (!products[product]) products[product] = [];
      products[product].push({ date: date, unitPrice: unitPrice });
    }
    if (biz)  bizSet[biz]  = true;
    if (dest) destSet[dest] = true;
  });

  return {
    products:     products,
    businesses:   Object.keys(bizSet).sort(),
    destinations: Object.keys(destSet).sort()
  };
}

// 一覧・請求書用: 指定年月のデータのみ返す（サーバー側フィルタ）
// month: "2026-02" 形式
function getSheetData(month) {
  var data = getAllData_();
  var rows = data.map(rowToArray_);
  if (!month) return rows;

  var y = parseInt(month.split('-')[0]);
  var m = parseInt(month.split('-')[1]);

  return rows.filter(function(row) {
    var ym = extractYearMonth_(row[COL.DATE]);
    // 年情報がある場合は年+月で厳密に一致
    if (ym.year !== null) return ym.year === y && ym.month === m;
    // 年情報がない古いデータは月のみで判定
    return ym.month === m;
  });
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

// DateオブジェクトやあらゆるフォーマットをYYYY年M月D日に統一
function normalizeDate_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return val.getFullYear() + '年' + (val.getMonth() + 1) + '月' + val.getDate() + '日';
  }
  var str = String(val).trim();
  // 既に "YYYY年M月D日" 形式ならそのまま
  if (/^\d{4}年/.test(str)) return str.replace(/[（(][^)）]*[)）]/g, '').trim();
  // "2023/2/3" 形式
  var slash = str.match(/^(\d{4})\/(\d+)\/(\d+)/);
  if (slash) return slash[1] + '年' + parseInt(slash[2]) + '月' + parseInt(slash[3]) + '日';
  // "2023-02-03" 形式
  var iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + '年' + parseInt(iso[2]) + '月' + parseInt(iso[3]) + '日';
  // "2月3日(金)" 形式（年なし）— そのまま返す（古いデータ）
  return str;
}

// 行データを返す（Dateオブジェクトを正規化した文字列に変換）
function rowToArray_(row) {
  return row.map(function(cell, i) {
    if (i === COL.DATE) return normalizeDate_(cell);
    if (cell instanceof Date) return Utilities.formatDate(cell, 'Asia/Tokyo', 'yyyy/MM/dd');
    return cell;
  });
}

// 日付文字列から { year, month } を抽出
function extractYearMonth_(str) {
  str = String(str || '');
  // "YYYY年M月" or "YYYY年M月D日"
  var jpFull = str.match(/(\d{4})年(\d+)月/);
  if (jpFull) return { year: parseInt(jpFull[1]), month: parseInt(jpFull[2]) };
  // "YYYY/M/D"
  var slash = str.match(/^(\d{4})\/(\d+)\//);
  if (slash) return { year: parseInt(slash[1]), month: parseInt(slash[2]) };
  // "YYYY-MM-DD"
  var iso = str.match(/^(\d{4})-(\d{2})-/);
  if (iso) return { year: parseInt(iso[1]), month: parseInt(iso[2]) };
  // "M月D日" — 年なし（古いデータ）
  var jp = str.match(/^(\d+)月/);
  if (jp) return { year: null, month: parseInt(jp[1]) };
  return { year: null, month: -1 };
}
