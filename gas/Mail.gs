const Mail = {
  send: function(subject, body) {
    const adminEmail = Config.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL is not set. Skipping email notification.');
      return;
    }
    
    try {
      MailApp.sendEmail({
        to: adminEmail,
        subject: `[カゾクノカワリ] ${subject}`,
        body: body
      });
    } catch (e) {
      console.error('Failed to send email:', e);
    }
  }
};
