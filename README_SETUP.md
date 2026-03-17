# カゾクノカワリ セットアップ手順

## 1. GitHub Pagesへのデプロイ

1. GitHubに新しいリポジトリを作成します。
2. 本プロジェクトのファイル一式をコミットし、プッシュします。
3. リポジトリの `Settings` > `Pages` を開きます。
4. `Source` を `Deploy from a branch` に設定し、`main` ブランチの `/ (root)` を選択して `Save` をクリックします。
5. 数分後、`https://takeshimonoseki.github.io` でサイトが公開されます。

## 2. Google Apps Script (GAS) のデプロイ

1. Googleドライブで新しい「Google Apps Script」プロジェクトを作成します。
2. `gas/` フォルダ内のすべての `.gs` ファイル（`Code.gs`, `Config.gs`, `Sheets.gs`, `Mail.gs`, `Line.gs`）と `Setup.html` をGASエディタにコピーします。
3. エディタ右上の「デプロイ」>「新しいデプロイ」をクリックします。
4. 種類の選択で「ウェブアプリ」を選びます。
5. 以下の設定でデプロイします：
   - アクセスできるユーザー: 「全員」
6. 表示された **ウェブアプリのURL** をコピーします。

## 3. フロントエンドとの連携

1. コピーしたウェブアプリのURLを、`assets/js/forms.js` の2行目にある `GAS_WEBAPP_URL` 変数に貼り付けます。
   ```javascript
   const GAS_WEBAPP_URL =
     "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
   ```
2. 変更をコミットし、GitHubにプッシュしてGitHub Pagesを更新します。

## 4. Script Properties の設定

GASエディタの「プロジェクトの設定（歯車アイコン）」>「スクリプト プロパティ」に以下のキーと値を設定します。

| プロパティ名                | 値の例                                        | 説明                                         |
| --------------------------- | --------------------------------------------- | -------------------------------------------- |
| `ADMIN_EMAIL`               | takeshimonoseki@gmail.com                     | 通知を受け取る管理者メールアドレス           |
| `SHEET_ID`                  | 1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8  | データを保存するスプレッドシートのID         |
| `DRIVE_FOLDER_ID`           | 1jJeND1RbxHS0rcCUJC116um2VL-UXAiC             | 証跡画像を保存するGoogleドライブフォルダのID |
| `LINE_CHANNEL_ACCESS_TOKEN` | (任意)                                        | LINE通知用のチャネルアクセストークン         |
| `LINE_TO_USER_ID`           | U94fa1bd99a801f9d531193705c108b65             | LINE通知を受け取るユーザーID                 |
| `BANK_TRANSFER_TEXT`        | 〇〇銀行 〇〇支店 普通 1234567 カゾクノカワリ | 振込先口座情報（メールテンプレート用）       |

## 5. スプレッドシートの準備

指定したIDのスプレッドシートに、以下のタブ（シート名）を作成してください。

- `Requests` （依頼データ保存用）
- `Partners` （パートナー登録データ保存用）
- `Assignments` （割当管理用）
- `WorkLogs` （稼働記録用）
- `Payments` （支払い管理用）
  ※既存の `Drivers` タブはそのまま残して構いません。

## 6. 料金計算ロジック（シミュレーター）

料金シミュレーターは以下のロジックで計算されています。変更する場合は `assets/js/simulator.js` の定数を編集してください。

- **基本料金（項目数）**:
  - Sプラン（1項目）: 11,000円
  - Mプラン（2項目）: 14,500円
  - Lプラン（3項目）: 22,000円
- **出張費**: 往復総距離(km) × 50円 (`KM_RATE = 50`)
- **緊急料金**:
  - 通常（3日以降）: 0円
  - 翌日: +3,000円
  - 当日: +4,000円
- **夜間・早朝料金**: 20:00〜8:00の場合は +5,000円
- **待機料金**: 10分あたり700円 (`WAIT_10MIN_RATE = 700`)
- **追加立ち寄り**: 1箇所あたり2,000円 (`STOP_FEE = 2000`)
- **鍵の受渡**: +3,500円 (`KEY_FEE = 3500`)
- **報告強化**: +3,500円 (`REPORT_PLUS_FEE = 3500`)

## 7. 動作確認

1. 公開されたGitHub Pagesのサイトにアクセスします。
2. 依頼フォームからテスト送信を行います。
3. 以下の動作を確認します：
   - 送信後、`/thanks.html?type=request` に遷移すること。
   - スプレッドシートの `Requests` タブにデータが追加されていること。
   - `ADMIN_EMAIL` 宛に通知メールが届いていること。


## 料金シミュレーター（100点版）

- 料金は「対応範囲（S/M/L＝やることの数）＋移動距離（往復総距離×60円）＋緊急＋待機（10分×700円）＋立ち寄り（回数×2000円）＋鍵（3500円）＋報告強化（3500円）」で計算します。
- 料金定数は `/assets/js/simulator.js` の `PRICING` を変更してください。
