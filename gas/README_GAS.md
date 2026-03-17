# GAS WebApp セットアップ手順

1. Google Driveで新規「Google Apps Script」を作成。
2. `/gas/` ディレクトリ内のすべての `.gs` ファイルと `.html` ファイルをGASエディタ上に作成し、コードを貼り付ける。
   - `Code.gs`
   - `Config.gs`
   - `Sheets.gs`
   - `Line.gs`
   - `Mail.gs`
   - `Security.gs`
   - `Setup.html`
3. 歯車アイコン（プロジェクトの設定） > 「スクリプト プロパティを追加」で以下を設定。
   - `ADMIN_EMAIL` : `takeshimonoseki@gmail.com`
   - `SHEET_ID` : `1mEPSJsN0Pt1GULgLIBqQXyUQg-L7a4QCvSLMvADejN8`
   - `DRIVE_FOLDER_ID` : `1jJeND1RbxHS0rcCUJC116um2VL-UXAiC`
   - `LINE_CHANNEL_ACCESS_TOKEN` : (空でもOK)
   - `LINE_TO_USER_ID` : `U94fa1bd99a801f9d531193705c108b65`
4. 右上の「デプロイ」>「新しいデプロイ」をクリック。
5. 種類の選択で「ウェブアプリ」を選ぶ。
6. 実行するユーザーを「自分」、アクセスできるユーザーを「全員」にしてデプロイ。
7. 発行されたURLをフロントエンドの `/assets/js/forms.js` に貼り付ける。
