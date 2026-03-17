# カゾクノカワリ ファイル一覧（Manifest）

## ルートディレクトリ

- `index.html`: 依頼主向けトップページ・依頼フォーム・料金計算機
- `partner.html`: パートナー向け登録ページ・登録フォーム
- `pricing.html`: 料金体系・メニュー詳細ページ・料金計算機
- `how-it-works.html`: ご利用の流れ（依頼〜完了まで）
- `faq.html`: よくある質問（JSON-LD構造化データ含む）
- `terms.html`: 利用規約（免責事項・禁止事項・キャンセル規定）
- `privacy.html`: プライバシーポリシー
- `thanks.html`: フォーム送信完了ページ（パートナー向けLINE誘導含む）
- `robots.txt`: クローラー制御設定
- `sitemap.xml`: サイトマップ
- `README_SETUP.md`: デプロイ・初期設定マニュアル

## assets/css/

- `style.css`: Tailwind CSS カスタム設定（フォント・アニメーション等）

## assets/js/

- `app.js`: スムーズスクロール等の共通処理
- `forms.js`: フォーム送信処理（GAS連携・スパム対策・バリデーション）
- `simulator.js`: 料金シミュレーター計算ロジック

## gas/ (Google Apps Script)

- `Code.gs`: WebApp エントリポイント（doPost/doGet）
- `Config.gs`: 環境変数（Script Properties）読み込み
- `Sheets.gs`: スプレッドシートへのデータ書き込み処理
- `Mail.gs`: 管理者宛メール通知処理
- `Line.gs`: LINE Messaging API 通知処理

## docs/ (運用ドキュメント)

- `ops_manual.md`: 運用手順マニュアル（依頼受付〜支払いまで）
- `ops_templates.md`: 運用テンプレート集（メール・LINE文面）
- `QA_CHECKLIST.md`: テスト・確認用チェックリスト
- `schema_sheets.md`: スプレッドシート（DB）スキーマ定義
- `automation_make.md`: 将来の Make.com 自動化ロードマップ
- `sample_payloads.json`: フォーム送信データのサンプル（正常/スパム）
- `manifest.md`: 本ファイル（全ファイル一覧）

- assets/js/simulator.js
