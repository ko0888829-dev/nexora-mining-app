const { MongoClient } = require('mongodb');

let cachedClient = null;
async function getDb() {
  if (!process.env.MONGODB_URI) return null;
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGODB_URI);
    await cachedClient.connect();
  }
  return cachedClient.db('nexora_db');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('NEXORA Bot API is Running!');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const message = body && body.message;
    if (!message || !message.text) return res.status(200).send('OK');

    const chatId = String(message.chat.id);
    const username = message.from?.username ? `@${message.from.username}` : (message.from?.first_name || 'Miner');
    const text = message.text.trim();
    const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const startParam = parts.length > 1 ? parts[1].trim() : '';
      const inviterId = startParam.replace('ref_', '').trim();

      // Save user & process referral in MongoDB
      const db = await getDb();
      if (db) {
        const users = db.collection('users');
        await users.updateOne(
          { userId: chatId },
          { $setOnInsert: { userId: chatId, username, joinedAt: new Date() } },
          { upsert: true }
        );

        const existingUser = await users.findOne({ userId: chatId });
        if (inviterId && inviterId !== chatId && !existingUser.referredBy) {
          await users.updateOne({ userId: chatId }, { $set: { referredBy: inviterId } });
          await users.updateOne(
            { userId: inviterId },
            { $inc: { refCount: 1, bonusNex: 100 }, $setOnInsert: { userId: inviterId, joinedAt: new Date() } },
            { upsert: true }
          );

          // Notify Inviter via Telegram Bot
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: inviterId,
              text: `🎉 *New Referral Joined!*\n\n👤 Friend: ${username}\n💰 Reward: *+100 $NEX* added to your account!`,
              parse_mode: 'Markdown'
            })
          });
        }
      }

      const webAppUrl = startParam
        ? `https://nexora-mining-app-seven.vercel.app?ref=${encodeURIComponent(startParam)}`
        : `https://nexora-mining-app-seven.vercel.app`;

      const welcomeMsg = `⚡ *Welcome to NEXORA Network ($NEX)!*\n\n` +
        `🔶 *Mine NEX automatically 24/7*\n` +
        `🔶 *Hold NEX — get mining boost up to Level 500*\n` +
        `🔶 *Build Cloud Nodes for extra yields*\n` +
        `🔶 *Invite friends — get instant 100 $NEX + 10% referral claims*\n\n` +
        `Tap the button below to start mining!\n👇`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeMsg,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: "⚡ Open NEXORA", web_app: { url: webAppUrl } }],
              [{ text: "📢 News Channel", url: "https://t.me/A_TOOLSx2" }]
            ]
          }
        })
      });
    }
  } catch (error) {
    console.error('Bot Error:', error);
  }

  return res.status(200).send('OK');
};
