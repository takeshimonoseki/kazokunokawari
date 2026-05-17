# フォーム送信GAS反映前準備計画

## 目的
フォーム送信GASをApps Scriptへ反映し、Webアプリとして使う前の安全な手順を整理する。

## 使うApps Script
- `gas/form-submit` はフォーム送信用GAS本体
- 初期セットアップ用 `gas/sheets-setup` とは分ける
- `FORM_SCRIPT_URL` または `FORM_SCRIPT_ID` で対象Apps Scriptを指定する

## Script Properties設定項目
- `SPREADSHEET_ID`：依頼管理スプレッドシートID
- `ADMIN_EMAIL`：管理者通知先
- `FROM_NAME`：カゾクノカワリ
- `ENABLE_AUTO_REPLY`：false推奨
- `ENABLE_LINE_NOTIFY`：false
- `GAS_ENV`：development

注意：
- 実値はdocsに書かない
- Script Properties画面に直接設定する
- 自動返信は初期false
- LINE通知は後工程

## 反映手順
1. フォーム送信用Apps Scriptを用意
2. URLを `.env.local` の `FORM_SCRIPT_URL` に貼る
3. `scripts/push-form-submit.sh` を実行
4. Apps Script画面でScript Propertiesを設定
5. Webアプリデプロイは別工程

## 今回やらないこと
- `clasp push`実行
- GASデプロイ
- フォーム送信
- メール送信
- LINE通知
- Sheets書き込み
