const Sheets = {
  getSpreadsheet: function () {
    return SpreadsheetApp.openById(Config.SHEET_ID);
  },

  saveRequest: function (data) {
    const ss = this.getSpreadsheet();
    const isKazoku = data.source_site === "kazokunokawari";
    const sheetName = isKazoku ? "家族代行依頼" : "Requests";
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(sheetName + " sheet not found");

    const id = "REQ-" + Utilities.getUuid().substring(0, 8).toUpperCase();

    const row = [
      data.timestamp || new Date().toISOString(),
      id,
      data.source_site || "",
      data.plan || "",
      data.selectedItems || "",
      data.areaPref || "",
      data.areaCity || "",
      data.specificAddress || "",
      data.totalKm || "",
      data.urgency || "",
      data.breakdownJSON || "",
      data.notes || "",
      data.name || "",
      data.email || "",
      data.address || "",
      data.phone || "",
      "新規受付",
    ];
    sheet.appendRow(row);

    const subject = `【新規依頼】${data.areaPref}${data.areaCity} - ${data.plan}プラン`;
    const body = `新規依頼がありました。\nID: ${id}\nプラン: ${data.plan}\n項目: ${data.selectedItems}\nメール: ${data.email}`;
    Mail.send(subject, body);
    Line.push(subject, body);
  },

  savePartner: function (data) {
    const ss = this.getSpreadsheet();
    const isKazoku = data.source_site === "kazokunokawari";
    const sheetName = isKazoku ? "家族代行サポーター" : "Partners";
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(sheetName + " sheet not found");

    const id = "PTN-" + Utilities.getUuid().substring(0, 8).toUpperCase();

    const row = [
      data.timestamp || new Date().toISOString(),
      id,
      data.source_site || "",
      data.name || "",
      data.ageGroup || "",
      data.areaPref || "",
      data.license || "",
      data.availableDays || "",
      data.contactLine || "",
      data.email || "",
      "未確認（身分証待ち）",
      "",
      "",
    ];
    sheet.appendRow(row);

    const subject = `【新規サポーター登録】${data.areaPref} - ${data.name}`;
    const body = `新規サポーター登録がありました。\nID: ${id}\nエリア: ${data.areaPref}\nメール: ${data.email}`;
    Mail.send(subject, body);
    Line.push(subject, body);
  },
};
