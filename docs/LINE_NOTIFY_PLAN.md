# LINE通知設計・実装準備計画

## 目的
本番フォーム受付時に、既存の公式LINEを使って管理者へLINE通知できるようにするため、実送信前の設計と安全な実装範囲を整理する。

## 基本方針
- LINE Notifyは使わず、LINE Messaging APIを使う
- 既存の公式LINEを使う
- 初回はLINE通知OFFのまま実装する
- 既存のフォーム送信、Google Sheets保存、管理者メール通知を壊さない
- LINE通知の実送信は明確な指示後のみ行う

## Script Properties
以下はApps ScriptのScript Propertiesで管理する。

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_TO_ID`
- `ENABLE_LINE_NOTIFY`

## 秘密情報の扱い
- `LINE_CHANNEL_ACCESS_TOKEN` の実値はGit、docs、HTML、JSに書かない
- `LINE_TO_ID` の実値はGit、docs、HTML、JSに書かない
- `.env.local` には今回触らない
- LINE通知用の値はApps ScriptのScript Properties画面で直接設定する

## LINE_TO_ID取得
- `LINE_TO_ID` の取得方法は別工程にする
- 取得時も実値をチャット、docs、Gitに書かない
- 取得後はScript Propertiesへ直接設定する

## 最小実装範囲
- `ENABLE_LINE_NOTIFY` が `true` の場合のみLINE通知処理を呼ぶ
- `false` または未設定の場合は「送信しない」として扱う
- LINE通知に失敗してもフォーム受付自体は正常扱いを維持する
- 失敗時はGoogle Sheets「ログ」と「依頼・相談」のLINE通知送信列へ記録する

## 初回テスト方針
- 初回実装時は `ENABLE_LINE_NOTIFY=false` のまま構文確認する
- 実送信テストは明確な指示後に1回だけ行う
- テスト後はSheets「ログ」とLINE通知送信列を確認する
