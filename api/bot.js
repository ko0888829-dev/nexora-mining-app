module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('NEXORA Bot API is Running!');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const message = body && body.message;

    if (!message || !message.text) {
      return res.status(200).send('OK');
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const startParam = parts.length > 1 ? parts[1] : '';
      const webAppUrl = startParam 
        ? `https://nexora-mining-app-seven.vercel.app?ref=${encodeURIComponent(startParam)}`
        : `https://nexora-mining-app-seven.vercel.app`;

      const welcomeMsg = `⚡ *Welcome to NEXORA Network ($NEX)!*\n\n` +
        `🔶 *Mine NEX automatically 24/7*\n` +
        `🔶 *Hold NEX — get mining boost up to Level 500*\n` +
        `🔶 *Build Cloud Nodes for extra yields*\n` +
        `🔶 *Invite friends — get instant 100 $NEX + 10% referral claims*\n\n` +
        `Tap the button below to start mining!\n👇`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: "⚡ Open NEXORA", web_app: { url: webAppUrl } }
          ],
          [
            { text: "📢 News Channel", url: "https://t.me/A_TOOLSx2" }
          ]
        ]
      };

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeMsg,
          parse_mode: 'Markdown',
          reply_markup: replyMarkup
        })
      });
    }
  } catch (error) {
    console.error('Bot Error:', error);
  }

  return res.status(200).send('OK');
};
