const REQUEST_SHEET_NAME = '依頼・相談';
const LOG_SHEET_NAME = 'ログ';
const DEFAULT_FROM_NAME = 'カゾクノカワリ';
const DEFAULT_REQUEST_TYPE = '相談';
const DEFAULT_STATUS = '新規';
const LINE_NOTIFY_STATUS = 'N/A';

function doPost(e) {
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
      adminMailStatus: 'N/A',
      autoReplyStatus: 'N/A',
      lineNotifyStatus: LINE_NOTIFY_STATUS,
      errorMessage: '',
    };

    try {
      const adminMailStatus = sendAdminMail_(config, payload, receiptNumber);
      notificationResult.adminMailStatus = adminMailStatus;
      appendLogRow_(spreadsheet, 'INFO', '管理者メール送信', receiptNumber, `管理者通知メール送信結果: ${adminMailStatus}`, {});
    } catch (error) {
      notificationResult.adminMailStatus = '失敗';
      notificationResult.errorMessage = appendErrorMessage_(notificationResult.errorMessage, error);
      appendLogRow_(spreadsheet, 'ERROR', '管理者メール送信', receiptNumber, '管理者通知メールの送信に失敗しました。', errorToDetail_(error));
    }

    try {
      const autoReplyStatus = maybeSendAutoReply_(config, payload, receiptNumber);
      notificationResult.autoReplyStatus = autoReplyStatus;
      appendLogRow_(spreadsheet, 'INFO', '自動返信メール送信', receiptNumber, `自動返信メール送信結果: ${autoReplyStatus}`, {});
    } catch (error) {
      notificationResult.autoReplyStatus = '失敗';
      notificationResult.errorMessage = appendErrorMessage_(notificationResult.errorMessage, error);
      appendLogRow_(spreadsheet, 'ERROR', '自動返信メール送信', receiptNumber, '自動返信メールの送信に失敗しました。', errorToDetail_(error));
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
    'N/A',
    'N/A',
    LINE_NOTIFY_STATUS,
    '',
    JSON.stringify(payload),
  ];

  sheet.appendRow(row);
  return sheet.getLastRow();
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
}

function sendAdminMail_(config, payload, receiptNumber) {
  if (!config.adminEmail) {
    return 'N/A';
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

  return '成功';
}

function maybeSendAutoReply_(config, payload, receiptNumber) {
  if (!config.enableAutoReply) {
    return 'N/A';
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

  return '成功';
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
