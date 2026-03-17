const Line = {
  push: function(subject, text) {
    const token = Config.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = Config.LINE_TO_USER_ID;
    
    if (!token || !userId) {
      console.warn('LINE credentials not set. Skipping LINE notification.');
      return;
    }
    
    const url = 'https://api.line.me/v2/bot/message/push';
    const payload = {
      to: userId,
      messages: [{ type: 'text', text: `[カゾクノカワリ]\n${subject}\n${text}` }]
    };
    
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    try {
      UrlFetchApp.fetch(url, options);
    } catch (e) {
      console.error('Failed to send LINE message:', e);
    }
  }
};
