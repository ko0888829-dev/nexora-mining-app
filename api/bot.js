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

const NEX_JETTON = "EQAeLwGfxkF0FYmX1y6s6Iqw2bt2JR0OjeV4tlXeHw9-1khw";
const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";

async function fetchNexPriceMessage() {
  try {
    // 1. Try GeckoTerminal TON Pool API
    const gtRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/ton/tokens/${NEX_JETTON}`);
    if (gtRes.ok) {
      const gtData = await gtRes.json();
      const attr = gtData?.data?.attributes;
      if (attr && attr.price_usd) {
        const priceUsd = parseFloat(attr.price_usd).toFixed(6);
        const fdv = attr.fdv_usd ? `$${Number(attr.fdv_usd).toLocaleString()}` : "N/A";
        const vol24 = attr.volume_usd?.h24 ? `$${Number(attr.volume_usd.h24).toFixed(2)}` : "$0.00";
        return `📈 *NEXORA ($NEX) Live Market Price*\n\n` +
          `💵 *Price (USD):* \`$${priceUsd}\`\n` +
          `📊 *24h Volume:* ${vol24}\n` +
          `💎 *FDV / Market Cap:* ${fdv}\n` +
          `🔗 *Network:* TON Blockchain\n\n` +
          `_Updated live from DEX pools._`;
      }
    }

    // 2. Fallback to DexScreener API
    const dsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${NEX_JETTON}`);
    if (dsRes.ok) {
      const dsData = await dsRes.json();
      const pair = dsData?.pairs?.[0];
      if (pair) {
        const change24 = pair.priceChange?.h24 || 0;
        const icon = change24 >= 0 ? "🟢" : "🔴";
        return `📈 *NEXORA ($NEX) Live Market Price*\n\n` +
          `💵 *Price (USD):* \`$${pair.priceUsd}\`\n` +
          `💎 *Price (TON):* \`${pair.priceNative} TON\`\n` +
          `${icon} *24h Change:* ${change24}%\n` +
          `💧 *Liquidity:* $${Number(pair.liquidity?.usd || 0).toLocaleString()}\n` +
          `📊 *24h Volume:* $${Number(pair.volume?.h24 || 0).toLocaleString()}`;
      }
    }
  } catch (e) {
    console.error("Price fetch error:", e);
  }

  // Stage 1 Pre-sale Reference Price fallback
  return `📈 *NEXORA ($NEX) Market & Pre-Sale Info*\n\n` +
    `💵 *Pre-Sale Rate:* \`1 TON = 10,000 NEX\` (~$0.0005 / NEX)\n` +
    `📊 *Status:* Stage 1 Pre-Order Live (DEX Pool Indexing)\n` +
    `📄 *Contract:* \`${NEX_JETTON}\``;
}

async function sendTg(chatId, text, replyMarkup = null) {
  const payload = { chat_id: chatId, text, parse_mode: 'Markdown' };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('NEXORA Bot API Active');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Handle Inline Button Callback (Live Price Check)
    if (body && body.callback_query) {
      const cb = body.callback_query;
      if (cb.data === 'check_nex_price') {
        const priceText = await fetchNexPriceMessage();
        await sendTg(cb.message.chat.id, priceText, {
          inline_keyboard: [
            [{ text: "🔄 Refresh Price", callback_data: "check_nex_price" }],
            [{ text: "⚡ Open NEXORA Miner", web_app: { url: "https://nexora-mining-app-seven.vercel.app" } }]
          ]
        });
      }
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id })
      });
      return res.status(200).send('OK');
    }

    const message = body && body.message;
    if (!message || !message.text) return res.status(200).send('OK');

    const chatId = String(message.chat.id);
    const username = message.from?.username ? `@${message.from.username}` : (message.from?.first_name || 'Miner');
    const text = message.text.trim();

    if (text === '/price' || text.toLowerCase().includes('price')) {
      const priceText = await fetchNexPriceMessage();
      await sendTg(chatId, priceText, {
        inline_keyboard: [
          [{ text: "🔄 Refresh Price", callback_data: "check_nex_price" }],
          [{ text: "⚡ Open NEXORA Miner", web_app: { url: "https://nexora-mining-app-seven.vercel.app" } }]
        ]
      });
      return res.status(200).send('OK');
    }

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const startParam = parts.length > 1 ? parts[1].trim() : '';
      const inviterId = startParam.replace('ref_', '').trim();

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

          await sendTg(inviterId, `🎉 *New Referral Joined!*\n\n👤 Friend: ${username}\n💰 Reward: *+100 $NEX* added!`);
        }
      }

      const webAppUrl = startParam
        ? `https://nexora-mining-app-seven.vercel.app?ref=${encodeURIComponent(startParam)}`
        : `https://nexora-mining-app-seven.vercel.app`;

      const welcomeMsg = `⚡ *Welcome to NEXORA Network ($NEX)!*\n\n` +
        `🔶 *Free Mining:* 15.63 NEX/hr (20 days to 7,500 NEX)\n` +
        `🔶 *Hold 2,500+ NEX:* 31.25+ NEX/hr (10 days to 7,500 NEX)\n` +
        `🔶 *Invite Friends:* +100 $NEX per friend\n` +
        `🔶 *Live Price:* Send /price anytime to check $NEX market rate\n\n` +
        `Tap below to launch NEXORA Miner! 👇`;

      await sendTg(chatId, welcomeMsg, {
        inline_keyboard: [
          [{ text: "⚡ Open NEXORA", web_app: { url: webAppUrl } }],
          [{ text: "📈 NEX Live Price", callback_data: "check_nex_price" }],
          [{ text: "📢 News Channel", url: "https://t.me/A_TOOLSx2" }]
        ]
      });
    }
  } catch (error) {
    console.error('Bot Error:', error);
  }

  return res.status(200).send('OK');
};
