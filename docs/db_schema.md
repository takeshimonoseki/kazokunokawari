# Google Sheets DB Schema

Spreadsheet ID: `1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8`

以下のタブ（シート）を作成し、1行目にヘッダーを設定してください。

## 1. Requests（依頼）
- A: タイムスタンプ
- B: 依頼種別 (A〜E)
- C: 対象エリア
- D: 希望納期
- E: 予算レンジ
- F: 緊急度
- G: 追加要望
- H: 会社名
- I: 担当者名
- J: メールアドレス
- K: 電話番号
- L: ステータス (未対応/見積済/入金待/アサイン中/検収中/完了/キャンセル)

## 2. Partners（ワーカー）
- A: タイムスタンプ
- B: 氏名
- C: 年齢層
- D: 居住エリア
- E: 普通免許
- F: 稼働可能日
- G: メールアドレス
- H: LINE ID
- I: ステータス (未確認/本人確認済/稼働中/停止)

## 3. Assignments（割当）
- A: 割当ID
- B: 依頼ID (Requestsの行番号等)
- C: パートナーID (Partnersの行番号等)
- D: 割当日
- E: 提出期限
- F: 報酬額
- G: ステータス (依頼中/受諾/提出済/検収NG/検収OK)

## 4. WorkLogs（稼働記録）
- A: ログID
- B: 割当ID
- C: 提出日時
- D: DriveフォルダURL (証跡置き場)
- E: コメント
- F: 検収結果 (未検収/OK/NG)

## 5. Payments（支払い）
- A: 支払ID
- B: パートナーID
- C: 対象月/締め日
- D: 支払額
- E: 振込先銀行情報
- F: ステータス (未払/支払済)
- G: 支払完了日
