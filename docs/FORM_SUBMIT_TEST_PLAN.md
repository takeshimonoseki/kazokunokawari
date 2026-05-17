# フォーム送信GAS単体テスト計画

## 目的
`GAS_WEBAPP_URL` を使って、カゾクノカワリのフォーム送信GASへテストJSONを送れるようにする。

## 前提
- `GAS_WEBAPP_URL` は `.env.local` にのみ保存する
- Apps Script側のScript Propertiesが設定済みである
- `ENABLE_AUTO_REPLY=false` 推奨
- テスト送信はSheetsに保存される可能性がある
- 管理者メールが送信される可能性がある
- GAS WebアプリURLの実値はdocsやGitに書かない

## 実行前確認
- Webアプリデプロイ済みであること
- Script Propertiesに `SPREADSHEET_ID` と `ADMIN_EMAIL` が設定されていること
- 自動返信を避ける場合は `ENABLE_AUTO_REPLY=false` であること
- テスト送信してよいタイミングであること

## テスト送信手順
1. `.env.local` に `GAS_WEBAPP_URL` を設定する
2. `scripts/test-form-submit.sh` を実行する
3. 確認プロンプトを読んで、明確に送信してよい場合だけ続行する
4. レスポンスJSONを `logs/form-submit-test_YYYYMMDD_HHMMSS.json` で確認する

## 確認すること
- レスポンスJSONで受付成功またはエラー内容が確認できること
- 「依頼・相談」シートに受付種別「テスト」として保存されていること
- 希望内容が「GAS単体テスト」になっていること
- ログシートに処理結果が記録されていること
- 管理者メール送信結果が記録されていること

## 失敗時に見るもの
- `logs/form-submit-test_YYYYMMDD_HHMMSS.json`
- Apps Scriptの実行ログ
- Script Propertiesの設定値
- Google Sheetsの「ログ」シート
- Webアプリの公開範囲と実行ユーザー設定

## 今回やらないこと
- テスト送信
- `curl` 実行
- フォーム送信
- メール送信
- LINE通知
- Sheets書き込み
