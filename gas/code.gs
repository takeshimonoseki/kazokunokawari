function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!Security.isValidRequest(data)) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid request' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.formType === 'request') {
      Sheets.saveRequest(data);
    } else if (data.formType === 'partner') {
      Sheets.savePartner(data);
    } else {
      throw new Error('Invalid formType');
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Setup');
}
