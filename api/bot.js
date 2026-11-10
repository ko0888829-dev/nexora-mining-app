export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('NEXORA Bot API Active');
  }

  const { message } = req.body;
  if (!message || !message.text) {
    return res.status(200).send('OK');
  }

  const chatId = message.chat.id;
  const text = message.text;
  const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";

  if (text.startsWith('/start')) {
    const startParam = text.split(' ')[1] || ''; // ref parameter
    const webAppUrl = `https://pp-seven.vercel.app?ref=${startParam}`;

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

  return res.status(200).send('OK');
}
