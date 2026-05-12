# 農場配達管理アプリ

詳細仕様は `SPEC.md` を参照。以下は Claude Code での作業に必要な要点。

## プロジェクト概要

農場の野菜納品データを Google スプレッドシートに記録する Google Apps Script (GAS) ウェブアプリ。
iPhone での現場入力を主用途とする。

## ファイル構成

| ファイル | 役割 |
|---|---|
| `コード.gs` | GAS サーバー（スプレッドシート読み書き） |
| `index.html` | アプリシェル（GAS テンプレート） |
| `style.html` | CSS（`<style>` タグのみ） |
| `script.html` | クライアント JS（`<script>` タグのみ） |
| `SPEC.md` | 詳細仕様書 |

**重要**: これらのファイルは GitHub で管理しているが、実際に動作するのは
Google Apps Script エディタにコピーしたコード。変更後は GAS エディタに手動で反映してデプロイする。

## データ構造

スプレッドシート ID: `1GEfGO4_t4l5bmftBA2pXncZ1kXdMYtZBhdsvIjz4L-o`
シート名: `Sheet1` / データ開始行: 2行目

列順: `日付(A) | 品名(B) | 数量(C) | 単価(D) | 金額(E) | 事業(F) | 納品先(G)`

## 主要な設計上の注意点

- **日付形式**: スプレッドシートには `"2026年5月12日"` の文字列で保存（GAS の Date オブジェクトを正規化）
- **行番号**: `getSheetData()` は各行末尾 (index 7) にシートの実際の行番号を付加。編集・削除に使用
- **キャッシュ**: `cachedRows` / `cachedMonth` で月ごとにキャッシュ。削除・編集後は `cachedMonth = null` で無効化
- **iOS 対応**: font-size 16px（ズーム防止）、`visualViewport` でキーボード対応、`position: fixed` サジェスト

## GAS サーバー関数

```
getMetadata()                  → { products, businesses, destinations }
getSheetData(month)            → Array<[date, product, qty, price, amount, biz, dest, rowNum]>
appendRows(rows)               → Number
updateRow({ rowNum, rowData }) → true
deleteRow(rowNum)              → true
```
