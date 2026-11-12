const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";
const CHANNEL_USERNAME = "@nexora_mining";

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });

    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(CHANNEL_USERNAME)}&user_id=${encodeURIComponent(userId)}`
    );
    const data = await tgRes.json();

    if (!data.ok) {
      return res.status(200).json({
        ok: false,
        error: "Bot is not admin in @nexora_mining yet! Please add bot as admin first."
      });
    }

    const status = data.result?.status;
    const isJoined = ['creator', 'administrator', 'member', 'restricted'].includes(status);

    return res.status(200).json({ ok: true, joined: isJoined, status });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
