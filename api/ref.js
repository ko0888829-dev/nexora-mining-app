const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const { userId, referrerId, username } = req.body;
      const cleanRef = String(referrerId || '').replace('ref_', '').trim();
      const friendName = username || `User_${userId}`;

      if (cleanRef && cleanRef !== String(userId)) {
        const claimUrl = `https://nexora-mining-app-seven.vercel.app?claim_ref=${encodeURIComponent(userId)}&ref_name=${encodeURIComponent(friendName)}`;
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanRef,
            text: `🎉 *New Referral Joined!*\n\n👤 *Friend:* ${friendName}\n💰 *Reward:* *+100 $NEX*\n\nTap below to credit +100 NEX to your balance! 👇`,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎁 Claim +100 $NEX", web_app: { url: claimUrl } }]
              ]
            }
          })
        });
        return res.status(200).json({ ok: true, newlyReferred: true });
      }
      return res.status(200).json({ ok: true, newlyReferred: false });
    } catch (e) {
      return res.status(200).json({ ok: false, error: e.message });
    }
  }

  return res.status(200).json({ ok: true });
};
