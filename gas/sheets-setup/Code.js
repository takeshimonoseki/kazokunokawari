const VALIDATION_ROW_COUNT = 199;
const VALIDATION_START_ROW = 2;
const HEADER_BACKGROUND = '#1f4e79';
const HEADER_FONT_COLOR = '#ffffff';
const REQUIRED_SHEET_NAMES = ['依頼・相談', 'ログ', '設定'];
const DEFAULT_SHEET_NAMES = ['シート1', 'Sheet1'];

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
    widths: [
      160,
      180,
      120,
      140,
      140,
      220,
      140,
      220,
      220,
      260,
      180,
      180,
      260,
      360,
      140,
      180,
      260,
      180,
      140,
      360,
      160,
      160,
      160,
      260,
      420,
    ],
  },
  {
    name: 'ログ',
    headers: ['日時', 'レベル', '処理', '受付番号', 'メッセージ', '詳細JSON'],
    widths: [160, 100, 180, 180, 360, 420],
  },
  {
    name: '設定',
    headers: ['key', 'value', 'memo'],
    widths: [240, 300, 420],
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
  purchaseFlag: ['あり', 'なし', '未定'],
  status: ['新規', '確認中', '見積済み', '依頼確定', '作業完了', 'キャンセル', 'テスト'],
  sentFlag: ['未送信', '送信済み', '送信しない', 'エラー'],
  logLevel: ['INFO', 'WARN', 'ERROR'],
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
    setupSheetLayout_(sheet, definition);
  });

  setupRequestSheetValidation_(spreadsheet.getSheetByName('依頼・相談'));
  setupLogSheetValidation_(spreadsheet.getSheetByName('ログ'));
  setupSettingsSheet_(spreadsheet.getSheetByName('設定'));
  cleanupEmptyDefaultSheets_(spreadsheet);
}

function getOrCreateSheet_(spreadsheet, name) {
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function setupSheetLayout_(sheet, definition) {
  ensureMinimumRows_(sheet, VALIDATION_START_ROW + VALIDATION_ROW_COUNT - 1);
  setupHeader_(sheet, definition.headers);
  setupFilter_(sheet, definition.headers.length);
  setupColumnWidths_(sheet, definition.widths);
  setupBodyStyle_(sheet, definition.headers.length);
}

function setupHeader_(sheet, headers) {
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground(HEADER_BACKGROUND)
    .setFontColor(HEADER_FONT_COLOR)
    .setVerticalAlignment('middle')
    .setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 42);
  sheet.setHiddenGridlines(false);
}

function setupFilter_(sheet, columnCount) {
  const existingFilter = sheet.getFilter();
  if (existingFilter) {
    existingFilter.remove();
  }
  sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 2), columnCount).createFilter();
}

function setupColumnWidths_(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.setColumnWidth(index + 1, width);
  });
}

function setupBodyStyle_(sheet, columnCount) {
  const rowCount = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 1, rowCount, columnCount).setVerticalAlignment('middle').setWrap(true);
}

function setupRequestSheetValidation_(sheet) {
  if (!sheet) {
    throw new Error('依頼・相談シートが見つかりません。');
  }

  setDropdown_(sheet, 3, DROPDOWNS.requestType);
  setDropdown_(sheet, 7, DROPDOWNS.contactMethod);
  setDropdown_(sheet, 8, DROPDOWNS.service);
  setDropdown_(sheet, 9, DROPDOWNS.area);
  setDropdown_(sheet, 15, DROPDOWNS.purchaseFlag);
  setDropdown_(sheet, 19, DROPDOWNS.status);
  setDropdown_(sheet, 21, DROPDOWNS.sentFlag);
  setDropdown_(sheet, 22, DROPDOWNS.sentFlag);
  setDropdown_(sheet, 23, DROPDOWNS.sentFlag);
}

function setupLogSheetValidation_(sheet) {
  if (!sheet) {
    throw new Error('ログシートが見つかりません。');
  }

  setDropdown_(sheet, 2, DROPDOWNS.logLevel);
}

function setDropdown_(sheet, column, values) {
  ensureMinimumRows_(sheet, VALIDATION_START_ROW + VALIDATION_ROW_COUNT - 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(VALIDATION_START_ROW, column, VALIDATION_ROW_COUNT, 1).setDataValidation(rule);
}

function setupSettingsSheet_(sheet) {
  if (!sheet) {
    throw new Error('設定シートが見つかりません。');
  }

  const existingKeys = getExistingSettingsKeys_(sheet);
  const rowsToAppend = SETTINGS_ROWS.filter((row) => !existingKeys.has(row[0]));
  if (rowsToAppend.length === 0) {
    return;
  }

  const startRow = Math.max(sheet.getLastRow() + 1, 2);
  sheet.getRange(startRow, 1, rowsToAppend.length, SETTINGS_ROWS[0].length).setValues(rowsToAppend);
}

function getExistingSettingsKeys_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return new Set();
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  return new Set(values.map((row) => String(row[0]).trim()).filter((key) => key !== ''));
}

function cleanupEmptyDefaultSheets_(spreadsheet) {
  spreadsheet.getSheets().forEach((sheet) => {
    const sheetName = sheet.getName();
    if (!DEFAULT_SHEET_NAMES.includes(sheetName)) {
      return;
    }
    if (REQUIRED_SHEET_NAMES.includes(sheetName)) {
      return;
    }
    if (!isEmptyDefaultSheet_(sheet)) {
      return;
    }
    if (spreadsheet.getSheets().length <= 1) {
      return;
    }
    spreadsheet.deleteSheet(sheet);
  });
}

function isEmptyDefaultSheet_(sheet) {
  const a1Value = sheet.getRange('A1').getValue();
  if (a1Value !== '') {
    return false;
  }

  const values = sheet.getDataRange().getValues();
  return values.every((row) => row.every((cell) => cell === ''));
}

function ensureMinimumRows_(sheet, minRows) {
  const currentRows = sheet.getMaxRows();
  if (currentRows < minRows) {
    sheet.insertRowsAfter(currentRows, minRows - currentRows);
  }
}
