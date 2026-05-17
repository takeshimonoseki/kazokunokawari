# GAS実装仕様書 (カゾクノカワリ専用フォーム連携)

## 目的
カゾクノカワリ専用のフォーム送信を、GAS経由でGoogle Sheetsへ保存し、管理者通知と必要に応じた自動返信を行うための実装仕様を確定する。

## 現時点の前提
- Google Sheets列定義は docs/SHEETS_SETUP_PLAN.md を正とする
- Spreadsheet IDはScript Propertiesで管理する
- GAS Web App URLはHTML/JSに実値を書かない
- 初期実装はメール通知を優先
- LINE通知は任意・後工程
- Google Maps API連携は後工程
- ファイルアップロードは後工程
- 本番送信テストは事前確認後のみ

## 使用するScript Properties
以下の値をScript Propertiesに設定して使用する。

- `SPREADSHEET_ID`: Script Propertiesに設定 (Google SheetsのID)
- `ADMIN_EMAIL`: Script Propertiesに設定 (管理者への通知メールアドレス)
- `FROM_NAME`: Script Propertiesに設定 (送信元名、例: カゾクノカワリ)
- `ENABLE_AUTO_REPLY`: Script Propertiesに設定 (自動返信メールの有効/無効, boolean)
- `ENABLE_LINE_NOTIFY`: Script Propertiesに設定 (LINE通知の有効/無効, boolean)
- `LINE_CHANNEL_ACCESS_TOKEN`: Script Propertiesに設定 (LINE NotifyまたはMessaging APIのトークン)
- `LINE_USER_ID`: Script Propertiesに設定 (LINE通知先のユーザーIDまたはグループID)
- `GAS_ENV`: Script Propertiesに設定 (実行環境, 例: "development", "production")

## doPost仕様
フォームからJSONを受け取る前提で、以下の処理を行う。

### 受信する主な項目
- お名前
- 電話番号
- メールアドレス
- 希望連絡方法
- 希望サービス
- 訪問エリア
- 詳しい訪問場所
- 訪問場所調整
- シミュレーター概算
- オプション
- 希望内容
- 購入品の有無
- 購入予定額・予算上限
- 備考
- 流入元ページ
- idempotencyKey (二重送信防止用)
- clientVersion (フォームのバージョン情報など)
- userAgent (ユーザーエージェント文字列)
- referrer (リファラーURL)

### 処理順
1.  **JSONを受信**: `e.postData.contents` からJSON文字列をパース
2.  **必須項目を検証**: 受信したJSONデータに含まれる必須項目が揃っているか検証
3.  **idempotencyKeyで二重送信を確認**: 受信したidempotencyKeyが、最近処理されたリクエストと重複していないか確認（ログシートまたは依頼・相談シートの受信JSONフィールドを参照）
4.  **受付番号を発行**: 一意の受付番号を生成
5.  **依頼・相談シートへ保存**: `docs/SHEETS_SETUP_PLAN.md` の列定義に基づき、受信データとGAS側で生成したデータを「依頼・相談」シートへ新しい行として保存
6.  **ログシートへ処理ログ保存**: 処理の各段階（受信、保存、通知の成功/失敗）でログシートに情報を記録
7.  **管理者通知メールを送信**: 設定された`ADMIN_EMAIL`へ管理者通知メールを送信
8.  **`ENABLE_AUTO_REPLY`がtrueなら自動返信**: 受信者のメールアドレスへ自動返信メールを送信
9.  **`ENABLE_LINE_NOTIFY`がtrueならLINE通知**: 設定された`LINE_USER_ID`へLINE通知を送信
10. **JSONレスポンスを返す**: 処理結果に応じたJSONレスポンスをフロントエンドへ返す

## 必須項目
初期実装の必須項目は以下とする。これらの項目が不足している場合、エラーとして処理する。

-   お名前
-   電話番号
-   希望連絡方法
-   希望サービス
-   希望内容

メールアドレスは、`ENABLE_AUTO_REPLY`が`true`の場合のみ必須扱いとする。

## 受付番号仕様
以下の形式でGAS側で自動生成する。

`KZK-YYYYMMDD-HHmmss-XXXX`

`XXXX` は4桁のランダム数字とする。

## idempotencyKey仕様
-   フロントエンド側で送信前に一意の`idempotencyKey`を生成し、リクエストに含めて送信する。
-   GAS側で`idempotencyKey`を受信後、過去一定時間内に同じ`idempotencyKey`を持つリクエストがログシートまたは「依頼・相談」シートの受信JSONフィールドに存在するか確認する。
-   同じ`idempotencyKey`が短時間（例: 5分以内）に来た場合は、二重送信とみなし、新規のデータ保存や通知は行わず、ユーザーには「既に受付済みの可能性があります」という旨のレスポンスを返す。
-   重複時にはログシートにWARNレベルで記録する。

## Sheets保存仕様
`docs/SHEETS_SETUP_PLAN.md` の「依頼・相談」シートの列順に合わせてデータを保存する。

### 保存時の初期値
-   **受付日時**: GAS側で受信した日時を`YYYY/MM/DD HH:mm:ss`形式で生成
-   **受付番号**: GAS側で生成した一意の受付番号
-   **受付種別**: 受信JSONに`受付種別`が含まれていない場合、初期値として「相談」を設定
-   **ステータス**: 受信JSONに`ステータス`が含まれていない場合、初期値として「新規」を設定
-   **管理者メール送信**: 処理結果（「成功」「失敗」「N/A」）を記録
-   **自動返信メール送信**: 処理結果（「成功」「失敗」「N/A」）を記録
-   **LINE通知送信**: 処理結果（「成功」「失敗」「N/A」）を記録
-   **エラー内容**: 処理中に発生したエラーがあればその詳細を記録
-   **受信JSON**: フロントエンドから受信したJSONデータ全体をJSON文字列として保存

## ログ保存仕様
ログシートに以下の項目とレベルで処理情報を保存する。

-   **日時**: ログ発生日時 (`YYYY/MM/DD HH:mm:ss`)
-   **レベル**: ログの重要度 (`INFO`, `WARN`, `ERROR`)
-   **処理**: 発生した処理のタイプ (`フォーム受信`, `Sheets保存`, `管理者メール送信`, `自動返信メール送信`, `LINE通知送信`, `エラー`)
-   **受付番号**: 関連する受付番号 (あれば)
-   **メッセージ**: ログの詳細メッセージ
-   **詳細JSON**: 関連するデータやエラーの詳細 (JSON形式で保存)

## 管理者通知メール仕様
### 件名
`【カゾクノカワリ】新規相談・依頼：受付番号 [受付番号]`

### 本文に入れる項目
-   受付番号
-   お名前
-   電話番号
-   メールアドレス
-   希望連絡方法
-   希望サービス
-   訪問エリア
-   詳しい訪問場所
-   訪問場所調整
-   概算金額
-   オプション
-   希望内容
-   購入品の有無
-   購入予定額・予算上限
-   備考
-   ステータス
-   スプレッドシート確認用URL (GAS側で生成)

## 自動返信メール仕様
自動返信は`ENABLE_AUTO_REPLY`が`true`の場合のみ実行する。

### 件名
`【カゾクノカワリ】ご相談を受け付けました`

### 本文方針
-   受付完了を伝えるメッセージ
-   まだ正式依頼確定ではないことを明記
-   正式料金は内容確認後に案内することを明記
-   電話・メール・LINEなどで確認する場合があることを明記
-   受付番号を記載し、ユーザーが問い合わせを識別できるようにする
-   送信元情報（「家族の代わり（便利屋TAKE）」代表者名、電話、メール）を記載

## LINE通知仕様
LINE通知は`ENABLE_LINE_NOTIFY`が`true`の場合のみ実行する。
後工程・任意機能とし、初期実装ではメール通知だけで運用可能とする。

### 短い通知文案
`【カゾクノカワリ】新規相談 受付番号:[受付番号] 名前:[お名前] 電話:[電話番号] サービス:[希望サービス] 訪問エリア:[訪問エリア] 概算:[シミュレーター概算]`

## レスポンス仕様
### 成功時
JSON形式で`200 OK`を返す。

```json
{
  "ok": true,
  "受付番号": "KZK-YYYYMMDD-HHmmss-XXXX",
  "message": "受付しました",
  "GAS_ENV": "development" // 開発環境でのみ返す
}
```

### 失敗時
JSON形式で`500 Internal Server Error`または`400 Bad Request`を返す。

```json
{
  "ok": false,
  "error": "ERROR_CODE", // 例: "INVALID_JSON", "MISSING_REQUIRED_FIELD", "DUPLICATE_SUBMISSION", "SHEETS_SAVE_FAILED"
  "message": "送信できませんでした。理由：...",
  "details": "詳細なエラーメッセージ" // 開発環境でのみ返す
}
```

## エラー処理
以下のエラーケースを想定し、適切に処理する。

-   **JSON不正**: 受信データが有効なJSON形式でない場合。`400 Bad Request`を返し、ログシートに`ERROR`レベルで記録。
-   **必須項目不足**: 定義された必須項目がJSONデータに含まれていない場合。`400 Bad Request`を返し、ログシートに`ERROR`レベルで記録。
-   **idempotencyKey重複**: 二重送信が検出された場合。`200 OK` (ただし、新規処理なし) を返し、「既に受付済みの可能性があります」メッセージを含める。ログシートに`WARN`レベルで記録。
-   **Spreadsheet ID未設定**: Script Propertiesに`SPREADSHEET_ID`が設定されていない場合。`500 Internal Server Error`を返し、ログシートに`ERROR`レベルで記録。
-   **Sheets保存失敗**: Google Sheetsへのデータ保存に失敗した場合。`500 Internal Server Error`を返し、ログシートに`ERROR`レベルで記録。依頼・相談シートの`エラー内容`列に詳細を記録。
-   **管理者メール送信失敗**: 管理者通知メールの送信に失敗した場合。`INFO`レベルでログを記録し、依頼・相談シートの`管理者メール送信`列に「失敗」を記録するが、フォーム受付自体は成功扱いとする。
-   **自動返信失敗**: 自動返信メールの送信に失敗した場合。`INFO`レベルでログを記録し、依頼・相談シートの`自動返信メール送信`列に「失敗」を記録するが、フォーム受付自体は成功扱いとする。
-   **LINE通知失敗**: LINE通知の送信に失敗した場合。`INFO`レベルでログを記録し、依頼・相談シートの`LINE通知送信`列に「失敗」を記録するが、フォーム受付自体は成功扱いとする。

### 方針
-   Google Sheetsへのデータ保存を最優先する。Sheetsへの保存が成功した場合は、その他の通知処理（メール、LINE）が失敗しても、原則としてフォーム受付自体は成功扱いとし、ユーザーには成功レスポンスを返す。
-   通知処理の失敗はログシートに記録し、依頼・相談シートの該当列にも「失敗」と記録することで、後から管理者が手動でフォローアップできるようにする。
-   `GAS_ENV` Script Propertyが`development`の場合、失敗レスポンスに`details`フィールドを含めることでデバッグを容易にする。

## 今回は実装しないこと
-   外部環境へのGAS反映
-   Google Sheets作成
-   Script Properties設定
-   GASデプロイ
-   本番送信
-   メール送信 (実際のSMTP接続)
-   LINE通知 (実際のAPI接続)
-   Google Maps API連携
-   ファイルアップロード

## 次の最小タスク
ローカル実装した `gas/form-submit` を外部反映する前に、Script Propertiesの設定項目と送信テスト手順を確認する。

## ローカル実装メモ
-   `gas/form-submit` はフォーム送信用GAS本体を置くディレクトリとする
-   初回はローカル実装のみ行い、`clasp push`、Webアプリデプロイ、送信テストは別工程にする
-   使用前にScript Propertiesへ `SPREADSHEET_ID`、`ADMIN_EMAIL`、`FROM_NAME`、`ENABLE_AUTO_REPLY` を設定する
-   `ENABLE_AUTO_REPLY` が `true` の場合のみ自動返信メールを送る
-   `ENABLE_LINE_NOTIFY` は将来用の設定として保持するが、初期実装ではLINE通知は行わない
-   `gas/sheets-setup` はシート初期セットアップ用、`gas/form-submit` はフォーム送信用として分けて管理する
