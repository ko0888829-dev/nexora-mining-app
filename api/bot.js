const BOT_TOKEN = "9044078069:AAHARiuHEtFtY0uP8wn-X8VrLnCcR6d0vFM";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("NEXORA Bot Active");
  }

  try {
    const body = req.body || {};
    const msg = body.message;

    if (msg && msg.text) {
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      if (text.startsWith("/start")) {
        let inviter = "";
        if (text.startsWith("/start nex_")) {
          inviter = text.split("nex_")[1].trim();
        }

        // စခရင်ရှော့ထဲက Vercel domain အတိုင်း ချိတ်ဆက်ထားသည်
        const host = req.headers.host;
        const appUrl = inviter 
          ? `https://${host}?inviter=${inviter}`
          : `https://${host}`;

        const welcomeText = 
          "⚡ <b>Welcome to NEXORA Network ($NEX)!</b>\n\n" +
          "🔸 Cloud Mine $NEX automatically 24/7\n" +
          "🔸 Daily Check-in Streak & Missions\n" +
          "🔸 Invite partners for 10% lifetime rewards\n" +
          "🔒 <b>DEX Listing & Withdrawals: January 1, 2027</b>\n\n" +
          "Tap below to launch your node!\n👇";

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⚡ Launch NEXORA Node", web_app: { url: appUrl } }],
                [
                  { text: "📦 Community", url: "https://t.me/A_TOOLSx2" },
                  { text: "📢 Official Channel", url: "https://t.me/A_TOOLSx2" }
                ]
              ]
            }
          })
        });

        return res.status(200).send("OK");
      }
    }

    return res.status(200).send("OK");
  } catch (e) {
    return res.status(200).send("Handled");
  }
}
