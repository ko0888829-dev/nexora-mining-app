const NEX_JETTON = "EQAeLwGfxkF0FYmX1y6s6Iqw2bt2JR0OjeV4tlXeHw9-1khw";
const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";

async function fetchNexPriceMessage() {
  try {
    const gtRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/ton/tokens/${NEX_JETTON}`);
    if (gtRes.ok) {
      const gtData = await gtRes.json();
      const attr = gtData?.data?.attributes;
      if (attr && attr.price_usd) {
        const priceUsd = parseFloat(attr.price_usd).toFixed(6);
        const vol24 = attr.volume_usd?.h24 ? `$${Number(attr.volume_usd.h24).toFixed(2)}` : "$0.00";
        return `📈 *NEXORA ($NEX) Live Market Price*\n\n` +
          `💵 *Price (USD):* \`$${priceUsd}\`\n` +
          `📊 *24h Volume:* ${vol24}\n` +
          `🟢 *DEX Status:* Live on TON`;
      }
    }
  } catch (e) {}
  return `📈 *NEXORA ($NEX) Live Price*\n\n💵 *Rate:* \`$0.000500\` (1 TON = 10,000 NEX)\n🟢 *Status:* Stage 1 Pre-Sale Live`;
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
  if (req.method !== 'POST') return res.status(200).send('NEXORA Bot Running');

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

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

      if (inviterId && inviterId !== chatId) {
        const claimUrl = `https://nexora-mining-app-seven.vercel.app?claim_ref=${encodeURIComponent(chatId)}&ref_name=${encodeURIComponent(username)}`;
        await sendTg(inviterId,
          `🎉 *New Friend Joined Your Link!*\n\n👤 *Friend:* ${username}\n💰 *Reward:* *+100 $NEX*\n\nTap the button below to add this friend & claim +100 NEX into your app! 👇`,
          {
            inline_keyboard: [
              [{ text: "🎁 Claim +100 $NEX Now", web_app: { url: claimUrl } }]
            ]
          }
        );
      }

      const webAppUrl = startParam
        ? `https://nexora-mining-app-seven.vercel.app?ref=${encodeURIComponent(startParam)}`
        : `https://nexora-mining-app-seven.vercel.app`;

      await sendTg(chatId,
        `⚡ *Welcome to NEXORA Network ($NEX)!*\n\n` +
        `🔶 *Mine NEX 24/7 & Withdraw at 7,500 NEX*\n` +
        `🔶 *Hold 2,500+ NEX for 2x Speed (10-Day Fast Track)*\n` +
        `🔶 *Invite Friends — Get +100 $NEX per friend*\n\n` +
        `Tap below to start mining! 👇`,
        {
          inline_keyboard: [
            [{ text: "⚡ Open NEXORA", web_app: { url: webAppUrl } }],
            [{ text: "📈 NEX Live Price", callback_data: "check_nex_price" }],
            [{ text: "📢 News Channel", url: "https://t.me/A_TOOLSx2" }]
          ]
        }
      );
    }
  } catch (e) {
    console.error(e);
  }
  return res.status(200).send('OK');
};
