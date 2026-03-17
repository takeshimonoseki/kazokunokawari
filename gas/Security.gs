const Security = {
  isValidRequest: function(data) {
    // 1. ハニーポットチェック
    if (data.website && data.website !== '') {
      console.warn('Honeypot triggered');
      return false;
    }

    // 2. ペイロードサイズチェック
    const payloadString = JSON.stringify(data);
    if (payloadString.length > 5000) {
      console.warn('Payload too large');
      return false;
    }

    // 3. レート制限 (CacheService)
    const email = data.email;
    if (email) {
      const cache = CacheService.getScriptCache();
      const cacheKey = 'rate_limit_' + email;
      const count = cache.get(cacheKey);
      
      if (count && parseInt(count) > 3) {
        console.warn('Rate limit exceeded for: ' + email);
        return false; // 5分間に3回以上送信でブロック
      }
      
      cache.put(cacheKey, (count ? parseInt(count) + 1 : 1).toString(), 300); // 5分間保持
    }

    return true;
  }
};
