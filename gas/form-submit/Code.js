const DEPLOY_VERSION = '20260520-line-config-layout-v1';
const REQUEST_SHEET_NAME = '依頼・相談';
const LOG_SHEET_NAME = 'ログ';
const DEFAULT_FROM_NAME = 'カゾクノカワリ';
const DEFAULT_REQUEST_TYPE = '相談';
const DEFAULT_STATUS = '新規';
const MAIL_STATUS_PENDING = '未送信';
const MAIL_STATUS_SENT = '送信済み';
const MAIL_STATUS_SKIP = '送信しない';
const MAIL_STATUS_ERROR = 'エラー';
const LINE_NOTIFY_STATUS = MAIL_STATUS_SKIP;

function doGet(e) {
  const config = getConfig_(true);
  return createJsonResponse_({
    ok: true,
    service: 'kazokunokawari-form-submit',
    method: 'GET',
    version: DEPLOY_VERSION,
    enableLineNotify: config.enableLineNotify,
    hasLineToken: Boolean(config.lineChannelAccessToken),
    hasLineToId: Boolean(config.lineToId),
    message: 'GAS Webアプリに到達しています',
  });
}


function handleLineWebhook_(payload) {
  const properties = PropertiesService.getScriptProperties();
  const lineToId = properties.getProperty('LINE_TO_ID');

  if (!lineToId && payload.events.length > 0) {
    const event = payload.events[0];
    const sourceId = event.source.userId || event.source.groupId || event.source.roomId;

    if (sourceId) {
      properties.setProperty('LINE_TO_ID', sourceId);
      console.log('LINE_TO_ID has been successfully set.');
      return createJsonResponse_({ status: 'ok', message: 'LINE_TO_ID set.' });
    }
  } else if (lineToId) {
    console.log('LINE_TO_ID already exists. No changes were made.');
    return createJsonResponse_({ status: 'ok', message: 'LINE_TO_ID already set.' });
  }

  console.log('No valid source ID found in webhook or LINE_TO_ID already set.');
  // LINEプラットフォーム側は200 OKを期待するため、エラー時も正常応答を返す
  return createJsonResponse_({ status: 'ok', message: 'No valid source ID found or LINE_TO_ID already set.' });
}

function doPost(e) {
  // LINE Webhookからのリクエストか判定
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.events && Array.isArray(payload.events)) {
      return handleLineWebhook_(payload);
    }
  } catch (error) {
    // JSONのパースに失敗した場合、LINEのWebhookではないと判断し、通常のフォーム処理を続行
  }

  let payload = null;
  let receiptNumber = '';

  try {
    payload = parseRequest_(e);
    validatePayload_(payload);

    const config = getConfig_();
    validateAutoReplyEmail_(config, payload);

    const spreadsheet = getSpreadsheet_(config);
    receiptNumber = createReceiptNumber_();
    const requestRow = appendRequestRow_(spreadsheet, payload, receiptNumber);

    appendLogRow_(spreadsheet, 'INFO', 'フォーム受信', receiptNumber, 'フォーム送信を受け付けました。', {
      formType: payload.formType || '',
      sourceSite: payload.source_site || payload.sourceSite || '',
    });

    const notificationResult = {
      adminMailStatus: MAIL_STATUS_PENDING,
      autoReplyStatus: MAIL_STATUS_PENDING,
      lineNotifyStatus: LINE_NOTIFY_STATUS,
      errorMessage: '',
    };

    try {
      const adminMailStatus = sendAdminMail_(config, payload, receiptNumber);
      notificationResult.adminMailStatus = adminMailStatus;
      appendLogRow_(spreadsheet, 'INFO', '管理者メール送信', receiptNumber, `管理者通知メール送信結果: ${adminMailStatus}`, {});
    } catch (error) {
      notificationResult.adminMailStatus = MAIL_STATUS_ERROR;
      notificationResult.errorMessage = appendErrorMessage_(notificationResult.errorMessage, error);
      appendLogRow_(spreadsheet, 'ERROR', '管理者メール送信', receiptNumber, '管理者通知メールの送信でエラーが発生しました。', errorToDetail_(error));
    }

    try {
      const autoReplyStatus = maybeSendAutoReply_(config, payload, receiptNumber);
      notificationResult.autoReplyStatus = autoReplyStatus;
      appendLogRow_(spreadsheet, 'INFO', '自動返信メール送信', receiptNumber, `自動返信メール送信結果: ${autoReplyStatus}`, {});
    } catch (error) {
      notificationResult.autoReplyStatus = MAIL_STATUS_ERROR;
      notificationResult.errorMessage = appendErrorMessage_(notificationResult.errorMessage, error);
      appendLogRow_(spreadsheet, 'ERROR', '自動返信メール送信', receiptNumber, '自動返信メールの送信でエラーが発生しました。', errorToDetail_(error));
    }

    try {
      const lineNotifyStatus = sendLineNotification_(config, payload, receiptNumber);
      notificationResult.lineNotifyStatus = lineNotifyStatus;
      appendLogRow_(spreadsheet, 'INFO', 'LINE通知送信', receiptNumber, `LINE通知送信結果: ${lineNotifyStatus}`, {});
    } catch (error) {
      notificationResult.lineNotifyStatus = MAIL_STATUS_ERROR;
      notificationResult.errorMessage = appendErrorMessage_(notificationResult.errorMessage, error);
      appendLogRow_(spreadsheet, 'ERROR', 'LINE通知送信', receiptNumber, 'LINE通知の送信でエラーが発生しました。', errorToDetail_(error));
    }

    updateNotificationStatus_(spreadsheet, requestRow, notificationResult);

    return createJsonResponse_({
      ok: true,
      receiptNumber,
      message: '受付しました',
    });
  } catch (error) {
    try {
      const config = getConfig_(true);
      if (config.spreadsheetId) {
        const spreadsheet = getSpreadsheet_(config);
        appendLogRow_(spreadsheet, 'ERROR', 'エラー', receiptNumber, 'フォーム受付処理でエラーが発生しました。', errorToDetail_(error));
      }
    } catch (logError) {
      console.error(logError);
    }

    return createJsonResponse_({
      ok: false,
      error: error.code || 'FORM_SUBMIT_FAILED',
      message: error.message || '送信できませんでした。',
    });
  }
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw createError_('INVALID_REQUEST', '送信データが空です。');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw createError_('INVALID_JSON', 'JSONを解析できませんでした。');
  }
}

function validatePayload_(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw createError_('INVALID_PAYLOAD', '送信データの形式が正しくありません。');
  }

  const requiredFields = [
    ['お名前', ['お名前', 'name']],
    ['電話番号', ['電話番号', 'phone']],
    ['希望連絡方法', ['希望連絡方法', 'preferredContactMethod']],
    ['希望サービス', ['希望サービス', 'preferredService', 'selectedItems', 'plan']],
    ['希望内容', ['希望内容', 'notes', 'message']],
  ];

  const missingFields = requiredFields
    .filter((definition) => isBlank_(getFirstValue_(payload, definition[1])))
    .map((definition) => definition[0]);

  if (missingFields.length > 0) {
    throw createError_('MISSING_REQUIRED_FIELD', `必須項目が不足しています: ${missingFields.join(', ')}`);
  }
}

function createReceiptNumber_() {
  const now = new Date();
  const timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMdd-HHmmss');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `KZK-${timestamp}-${random}`;
}

function createJsonResponse_(body) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function getConfig_(allowMissing) {
  const properties = PropertiesService.getScriptProperties();
  const config = {
    spreadsheetId: properties.getProperty('SPREADSHEET_ID') || '',
    adminEmail: properties.getProperty('ADMIN_EMAIL') || '',
    fromName: properties.getProperty('FROM_NAME') || DEFAULT_FROM_NAME,
    enableAutoReply: normalizeBoolean_(properties.getProperty('ENABLE_AUTO_REPLY')),
    enableLineNotify: normalizeBoolean_(properties.getProperty('ENABLE_LINE_NOTIFY')),
    lineChannelAccessToken: properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN') || '',
    lineToId: properties.getProperty('LINE_TO_ID') || '',
    gasEnv: properties.getProperty('GAS_ENV') || 'production',
  };

  if (!allowMissing && !config.spreadsheetId) {
    throw createError_('SPREADSHEET_ID_NOT_SET', 'Script PropertiesにSPREADSHEET_IDが設定されていません。');
  }

  return config;
}

function getSpreadsheet_(config) {
  return SpreadsheetApp.openById(config.spreadsheetId);
}

function appendRequestRow_(spreadsheet, payload, receiptNumber) {
  const sheet = spreadsheet.getSheetByName(REQUEST_SHEET_NAME);
  if (!sheet) {
    throw createError_('REQUEST_SHEET_NOT_FOUND', `${REQUEST_SHEET_NAME}シートが見つかりません。`);
  }

  const receivedAt = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');
  const row = [
    receivedAt,
    receiptNumber,
    getValue_(payload, ['受付種別', 'requestType'], DEFAULT_REQUEST_TYPE),
    getValue_(payload, ['お名前', 'name']),
    getValue_(payload, ['電話番号', 'phone']),
    getValue_(payload, ['メールアドレス', 'email']),
    getValue_(payload, ['希望連絡方法', 'preferredContactMethod']),
    getValue_(payload, ['希望サービス', 'preferredService', 'selectedItems', 'plan']),
    getValue_(payload, ['訪問エリア', 'area', 'areaCity']),
    getValue_(payload, ['詳しい訪問場所', 'specificAddress']),
    getValue_(payload, ['訪問場所調整', 'areaAdjustment', 'totalKm']),
    getValue_(payload, ['シミュレーター概算', 'estimatedTotal']),
    getValue_(payload, ['オプション', 'options']),
    getValue_(payload, ['希望内容', 'notes', 'message']),
    getValue_(payload, ['購入品の有無', 'hasPurchaseItems']),
    getValue_(payload, ['購入予定額・予算上限', 'purchaseBudget']),
    getValue_(payload, ['備考', 'remarks']),
    getValue_(payload, ['流入元ページ', 'sourcePage', 'referrer']),
    DEFAULT_STATUS,
    '',
    MAIL_STATUS_PENDING,
    MAIL_STATUS_PENDING,
    LINE_NOTIFY_STATUS,
    '',
    JSON.stringify(payload),
  ];

  sheet.appendRow(row);
  const rowNumber = sheet.getLastRow();
  formatRequestRow_(sheet, rowNumber);
  return rowNumber;
}

function appendLogRow_(spreadsheet, level, process, receiptNumber, message, detail) {
  const sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) {
    return;
  }

  sheet.appendRow([
    Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss'),
    level,
    process,
    receiptNumber || '',
    message,
    detail ? JSON.stringify(detail) : '',
  ]);
  const rowNumber = sheet.getLastRow();
  formatLogRow_(sheet, rowNumber);
}

function sendAdminMail_(config, payload, receiptNumber) {
  if (!config.adminEmail) {
    return MAIL_STATUS_SKIP;
  }

  const subject = `【カゾクノカワリ】新規相談・依頼：受付番号 ${receiptNumber}`;
  const body = [
    '家族の代わり 公式ホームページより、新規の相談・依頼がありました。',
    '',
    `受付番号: ${receiptNumber}`,
    `受付種別: ${getValue_(payload, ['受付種別', 'requestType'], DEFAULT_REQUEST_TYPE)}`,
    `お名前: ${getValue_(payload, ['お名前', 'name'])}`,
    `電話番号: ${getValue_(payload, ['電話番号', 'phone'])}`,
    `メールアドレス: ${getValue_(payload, ['メールアドレス', 'email'])}`,
    `希望連絡方法: ${getValue_(payload, ['希望連絡方法', 'preferredContactMethod'])}`,
    `希望サービス: ${getValue_(payload, ['希望サービス', 'preferredService', 'selectedItems', 'plan'])}`,
    `訪問エリア: ${getValue_(payload, ['訪問エリア', 'area', 'areaCity'])}`,
    `詳しい訪問場所: ${getValue_(payload, ['詳しい訪問場所', 'specificAddress'])}`,
    `訪問場所調整: ${getValue_(payload, ['訪問場所調整', 'areaAdjustment', 'totalKm'])}`,
    `シミュレーター概算: ${getValue_(payload, ['シミュレーター概算', 'estimatedTotal'])}`,
    `オプション: ${getValue_(payload, ['オプション', 'options'])}`,
    `購入品の有無: ${getValue_(payload, ['購入品の有無', 'hasPurchaseItems'])}`,
    `購入予定額・予算上限: ${getValue_(payload, ['購入予定額・予算上限', 'purchaseBudget'])}`,
    '',
    '希望内容:',
    getValue_(payload, ['希望内容', 'notes', 'message']),
    '',
    '備考:',
    getValue_(payload, ['備考', 'remarks']),
  ].join('\n');

  MailApp.sendEmail({
    to: config.adminEmail,
    subject,
    body,
    name: config.fromName,
  });

  return MAIL_STATUS_SENT;
}

function sendLineNotification_(config, payload, receiptNumber) {
  if (!config.enableLineNotify) {
    return MAIL_STATUS_SKIP;
  }
  if (!config.lineToId || !config.lineChannelAccessToken) {
    console.log('LINE通知送信スキップ: LINE_TO_IDまたはLINE_CHANNEL_ACCESS_TOKENが未設定です。');
    return MAIL_STATUS_SKIP;
  }

  const messageText = [
    `【カゾクノカワリ】新規相談・依頼`,
    `受付番号: ${receiptNumber}`,
    `お名前: ${getValue_(payload, ['お名前', 'name'])}`,
    `希望サービス: ${getValue_(payload, ['希望サービス', 'preferredService', 'selectedItems', 'plan'])}`,
    `希望連絡方法: ${getValue_(payload, ['希望連絡方法', 'preferredContactMethod'])}`,
    `連絡先: ${getValue_(payload, ['メールアドレス', 'email']) || getValue_(payload, ['電話番号', 'phone'])}`,
    '---',
    `内容: ${(getValue_(payload, ['希望内容', 'notes', 'message']) || '').substring(0, 100)}...`,
  ].join('\n');

  const linePayload = {
    to: config.lineToId,
    messages: [{
      type: 'text',
      text: messageText,
    }],
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`,
    },
    payload: JSON.stringify(linePayload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  const responseCode = response.getResponseCode();

  if (responseCode >= 200 && responseCode < 300) {
    return MAIL_STATUS_SENT;
  }
  console.error(`LINE通知送信失敗: status=${responseCode}, response=${response.getContentText()}`);
  return MAIL_STATUS_ERROR;
}

function maybeSendAutoReply_(config, payload, receiptNumber) {
  if (!config.enableAutoReply) {
    return MAIL_STATUS_SKIP;
  }

  const email = getValue_(payload, ['メールアドレス', 'email']);
  if (!email) {
    throw createError_('EMAIL_REQUIRED_FOR_AUTO_REPLY', '自動返信を有効にする場合、メールアドレスが必要です。');
  }

  const name = getValue_(payload, ['お名前', 'name']);
  const subject = '【カゾクノカワリ】ご相談を受け付けました';
  const body = [
    `${name}様`,
    '',
    'この度は、「家族の代わり」へご相談いただきありがとうございます。',
    '以下の受付番号で、ご相談内容を受け付けました。',
    '',
    `受付番号: ${receiptNumber}`,
    `希望サービス: ${getValue_(payload, ['希望サービス', 'preferredService', 'selectedItems', 'plan'])}`,
    `希望連絡方法: ${getValue_(payload, ['希望連絡方法', 'preferredContactMethod'])}`,
    '',
    '本メールは受付完了をお知らせするものであり、正式なご依頼の確定ではありません。',
    '内容確認後、担当者より改めてご連絡いたします。',
  ].join('\n');

  MailApp.sendEmail({
    to: email,
    subject,
    body,
    name: config.fromName,
  });

  return MAIL_STATUS_SENT;
}

function updateNotificationStatus_(spreadsheet, rowNumber, result) {
  const sheet = spreadsheet.getSheetByName(REQUEST_SHEET_NAME);
  if (!sheet || !rowNumber) {
    return;
  }

  sheet.getRange(rowNumber, 21, 1, 4).setValues([[
    result.adminMailStatus,
    result.autoReplyStatus,
    result.lineNotifyStatus,
    result.errorMessage,
  ]]);
}

function validateAutoReplyEmail_(config, payload) {
  if (config.enableAutoReply && isBlank_(getValue_(payload, ['メールアドレス', 'email']))) {
    throw createError_('EMAIL_REQUIRED_FOR_AUTO_REPLY', '自動返信を有効にする場合、メールアドレスが必要です。');
  }
}

function getValue_(payload, keys, fallback) {
  const value = getFirstValue_(payload, keys);
  if (isBlank_(value)) {
    return fallback || '';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value).trim();
}

function getFirstValue_(payload, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      return payload[key];
    }
  }
  return '';
}

function isBlank_(value) {
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((item) => isBlank_(item));
  }
  return value === null || value === undefined || String(value).trim() === '';
}

function normalizeBoolean_(value) {
  return String(value || '').toLowerCase() === 'true';
}

function appendErrorMessage_(currentMessage, error) {
  const nextMessage = error && error.message ? error.message : String(error);
  return currentMessage ? `${currentMessage}\n${nextMessage}` : nextMessage;
}

function errorToDetail_(error) {
  return {
    name: error && error.name ? error.name : '',
    code: error && error.code ? error.code : '',
    message: error && error.message ? error.message : String(error),
    stack: error && error.stack ? error.stack : '',
  };
}

function createError_(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function setRequestSheetColumnWidths_(sheet) {
  const widths = [
    150, 210, 100, 130, 140,
    220, 130, 190, 170, 220,
    160, 160, 180, 260, 130,
    180, 220, 180, 110, 220,
    150, 160, 150, 220, 260,
  ];
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));
}

function formatRequestRow_(sheet, rowNumber) {
  if (!sheet || !rowNumber) return;
  sheet.setRowHeight(rowNumber, 40);
  sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  setRequestSheetColumnWidths_(sheet);
}

function formatLogRow_(sheet, rowNumber) {
  if (!sheet || !rowNumber) return;
  sheet.setRowHeight(rowNumber, 28);
  sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 90);
  sheet.setColumnWidth(3, 170);
  sheet.setColumnWidth(4, 210);
  sheet.setColumnWidth(5, 360);
  sheet.setColumnWidth(6, 300);
}

function fixSheetLayout() {
  const config = getConfig_(true);
  const spreadsheet = getSpreadsheet_(config);

  const requestSheet = spreadsheet.getSheetByName(REQUEST_SHEET_NAME);
  if (requestSheet) {
    const maxRows = Math.max(requestSheet.getLastRow(), 1);
    requestSheet.setRowHeights(1, maxRows, 40);
    requestSheet.getRange(1, 1, maxRows, requestSheet.getLastColumn()).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    requestSheet.setFrozenRows(1);
    setRequestSheetColumnWidths_(requestSheet);
  }

  const logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (logSheet) {
    const maxRows = Math.max(logSheet.getLastRow(), 1);
    logSheet.setRowHeights(1, maxRows, 28);
    logSheet.getRange(1, 1, maxRows, logSheet.getLastColumn()).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    logSheet.setFrozenRows(1);
    logSheet.setColumnWidth(1, 150);
    logSheet.setColumnWidth(2, 90);
    logSheet.setColumnWidth(3, 170);
    logSheet.setColumnWidth(4, 210);
    logSheet.setColumnWidth(5, 360);
    logSheet.setColumnWidth(6, 300);
  }
}

function debugSheetTargetOnly() {
  const config = getConfig_(true);
  const result = {
    hasSpreadsheetId: Boolean(config.spreadsheetId),
    requestSheetExists: false,
    logSheetExists: false,
    requestLastRow: null,
    logLastRow: null,
  };

  if (config.spreadsheetId) {
    const spreadsheet = getSpreadsheet_(config);
    const requestSheet = spreadsheet.getSheetByName(REQUEST_SHEET_NAME);
    const logSheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);

    result.requestSheetExists = Boolean(requestSheet);
    result.logSheetExists = Boolean(logSheet);
    result.requestLastRow = requestSheet ? requestSheet.getLastRow() : null;
    result.logLastRow = logSheet ? logSheet.getLastRow() : null;
  }

  console.log(JSON.stringify(result));
  return result;
}

function testLinePushOnly() {
  const config = getConfig_(true);
  const result = {
    enableLineNotify: config.enableLineNotify,
    hasLineToken: Boolean(config.lineChannelAccessToken),
    hasLineToId: Boolean(config.lineToId),
    responseCode: null,
    responseBody: '',
  };

  if (!config.enableLineNotify || !config.lineChannelAccessToken || !config.lineToId) {
    console.log(JSON.stringify(result));
    return result;
  }

  const payload = {
    to: config.lineToId,
    messages: [{
      type: 'text',
      text: '【カゾクノカワリ】LINE通知テストです。フォーム送信ではありません。',
    }],
  };

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${config.lineChannelAccessToken}`,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  result.responseCode = response.getResponseCode();
  result.responseBody = response.getContentText();

  console.log(JSON.stringify(result));
  return result;
}
