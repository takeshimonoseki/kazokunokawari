const Config = {
  get ADMIN_EMAIL() { return PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL'); },
  get SHEET_ID() { return PropertiesService.getScriptProperties().getProperty('SHEET_ID'); },
  get DRIVE_FOLDER_ID() { return PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'); },
  get LINE_CHANNEL_ACCESS_TOKEN() { return PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN'); },
  get LINE_TO_USER_ID() { return PropertiesService.getScriptProperties().getProperty('LINE_TO_USER_ID'); },
  get BANK_TRANSFER_TEXT() { return PropertiesService.getScriptProperties().getProperty('BANK_TRANSFER_TEXT'); }
};
