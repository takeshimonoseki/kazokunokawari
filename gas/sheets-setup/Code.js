const SHEET_DEFINITIONS = [
  {
    name: '依頼・相談',
    headers: [
      '受付日時',
      '受付番号',
      '受付種別',
      'お名前',
      '電話番号',
      'メールアドレス',
      '希望連絡方法',
      '希望サービス',
      '訪問エリア',
      '詳しい訪問場所',
      '訪問場所調整',
      'シミュレーター概算',
      'オプション',
      '希望内容',
      '購入品の有無',
      '購入予定額・予算上限',
      '備考',
      '流入元ページ',
      'ステータス',
      '対応メモ',
      '管理者メール送信',
      '自動返信メール送信',
      'LINE通知送信',
      'エラー内容',
      '受信JSON',
    ],
  },
  {
    name: 'ログ',
    headers: ['日時', 'レベル', '処理', '受付番号', 'メッセージ', '詳細JSON'],
  },
  {
    name: '設定',
    headers: ['key', 'value', 'memo'],
  },
];

const DROPDOWNS = {
  requestType: ['相談', '見積依頼', '正式依頼', 'テスト'],
  contactMethod: ['電話', 'メール', 'LINE', 'どれでも可'],
  service: [
    'お墓参り代行',
    'お墓参り＋清掃',
    'お墓参り＋清掃＋墓石洗浄',
    '実家・親族の様子確認',
    '空き家の簡易確認',
    '買い物代行',
    '届け物・小荷物運搬',
    '家具組立・簡単な軽作業',
    '生活まわりの簡単な代行',
    '実家片付け前の仕分けサポート',
    'その他・個別相談',
  ],
  area: [
    '下関市内・近隣エリア',
    '下関市内やや離れる地域',
    '下関市北部・豊浦・豊田方面',
    '北九州市門司区周辺',
    '北九州市小倉方面',
    'その他・遠方・判断に迷う',
  ],
  status: ['新規', '確認中', '見積済み', '依頼確定', '作業完了', 'キャンセル', 'テスト'],
  sentFlag: ['未送信', '送信済み', '送信しない', 'エラー'],
};

const SETTINGS_ROWS = [
  ['ADMIN_EMAIL', '', '管理者通知先メールアドレス'],
  ['FROM_NAME', 'カゾクノカワリ', 'メール送信時の表示名'],
  ['ENABLE_AUTO_REPLY', 'false', '自動返信メールの有効化'],
  ['ENABLE_LINE_NOTIFY', 'false', 'LINE通知の有効化'],
  ['GAS_ENV', 'development', 'GAS実行環境'],
];

function setupKazokunokawariSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('アクティブなスプレッドシートを取得できません。');
  }

  SHEET_DEFINITIONS.forEach((definition) => {
    const sheet = getOrCreateSheet_(spreadsheet, definition.name);
    setupHeader_(sheet, definition.headers);
    setupFilter_(sheet, definition.headers.length);
  });

  setupRequestSheetValidation_(spreadsheet.getSheetByName('依頼・相談'));
  setupSettingsSheet_(spreadsheet.getSheetByName('設定'));
}

function getOrCreateSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function setupHeader_(sheet, headers) {
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#f1f3f4');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function setupFilter_(sheet, columnCount) {
  const existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), columnCount).createFilter();
}

function setupRequestSheetValidation_(sheet) {
  if (!sheet) {
    throw new Error('依頼・相談シートが見つかりません。');
  }

  const maxRows = sheet.getMaxRows();
  setDropdown_(sheet, 3, maxRows, DROPDOWNS.requestType);
  setDropdown_(sheet, 7, maxRows, DROPDOWNS.contactMethod);
  setDropdown_(sheet, 8, maxRows, DROPDOWNS.service);
  setDropdown_(sheet, 9, maxRows, DROPDOWNS.area);
  setDropdown_(sheet, 19, maxRows, DROPDOWNS.status);
  setDropdown_(sheet, 21, maxRows, DROPDOWNS.sentFlag);
  setDropdown_(sheet, 22, maxRows, DROPDOWNS.sentFlag);
  setDropdown_(sheet, 23, maxRows, DROPDOWNS.sentFlag);
}

function setDropdown_(sheet, column, maxRows, values) {
  if (maxRows <= 1) {
    return;
  }
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, column, maxRows - 1, 1).setDataValidation(rule);
}

function setupSettingsSheet_(sheet) {
  if (!sheet) {
    throw new Error('設定シートが見つかりません。');
  }
  sheet.getRange(2, 1, SETTINGS_ROWS.length, SETTINGS_ROWS[0].length).setValues(SETTINGS_ROWS);
  sheet.autoResizeColumns(1, 3);
}
