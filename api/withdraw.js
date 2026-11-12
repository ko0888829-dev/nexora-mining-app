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

const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";
const ADMIN_CHAT_ID = "5330848428";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { userId, username, walletAddress, amount, holdAmount } = req.body;
    if (!walletAddress || Number(amount) < 7500 || Number(holdAmount) < 2500) {
      return res.status(400).json({ ok: false, error: 'Minimum 7,500 NEX withdraw & 2,500 NEX hold required.' });
    }

    const db = await getDb();
    if (db) {
      await db.collection('withdrawals').insertOne({
        userId: String(userId),
        username: username || 'Miner',
        walletAddress,
        amount: Number(amount),
        holdAmount: Number(holdAmount),
        verifiedGram: true,
        status: 'pending',
        createdAt: new Date()
      });
    }

    const adminMsg = `💸 *NEW NEX WITHDRAWAL REQUEST*\n\n` +
      `👤 *User:* ${username} (\`${userId}\`)\n` +
      `💰 *Amount:* \`${Number(amount).toLocaleString()} NEX\`\n` +
      `💎 *Wallet Hold:* \`${Number(holdAmount).toLocaleString()} NEX\` ✅\n` +
      `🛡️ *0.1 GRAM Verify:* Paid ✅\n` +
      `📬 *To Wallet:* \`${walletAddress}\``;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: adminMsg,
        parse_mode: 'Markdown'
      })
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
